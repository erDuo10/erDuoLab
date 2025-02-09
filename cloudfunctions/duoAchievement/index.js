const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const $ = _.aggregate

// 成就条件检查函数
const achievementConditions = {
    GAME_COMPLETION: (data, config) => ({
        currentValue: data.gamesCompleted,
        progress: Math.min(100, (data.gamesCompleted / config.targetValue) * 100),
        completed: data.gamesCompleted >= config.targetValue
    }),

    DIFFICULTY: (data, config) => {
        if (data.difficulty !== config.difficulty) {
            return { currentValue: 0, progress: 0, completed: false }
        }
        const completed = data.difficultyStats[config.difficulty].completed
        return {
            currentValue: completed,
            progress: Math.min(100, (completed / config.targetValue) * 100),
            completed: completed >= config.targetValue
        }
    },

    PERFECT_GAME: (data, config) => {
        if (data.difficulty !== config.difficulty) {
            return { currentValue: 0, progress: 0, completed: false }
        }
        const isPerfect = data.errorCount === 0 && data.hintsUsed === 0
        return {
            currentValue: isPerfect ? 1 : 0,
            progress: isPerfect ? 100 : 0,
            completed: isPerfect
        }
    },

    SPEED: (data, config) => {
        if (data.difficulty !== config.difficulty) {
            return { currentValue: 0, progress: 0, completed: false }
        }
        return {
            currentValue: data.timeSpent,
            progress: Math.min(100, (config.targetValue / data.timeSpent) * 100),
            completed: data.timeSpent <= config.targetValue
        }
    },

    STREAK: (data, config) => {
        const streakValue = config.subType === 'PERFECT'
            ? data.streaks.current.perfect
            : data.streaks.current.daily
        return {
            currentValue: streakValue,
            progress: Math.min(100, (streakValue / config.targetValue) * 100),
            completed: streakValue >= config.targetValue
        }
    }
}

/**
 * 检查成就进度
 */
async function checkAchievements(userId, gameData) {
    try {
        // 并行获取数据
        // 获取用户统计
        // 获取所有活跃成就配置
        const [userStats, configs, existingAchievements] = await Promise.all([
            db.collection('duo_user_statistics').where({ userId }).get(),
            db.collection('duo_achievement_configs').where({ status: 'ACTIVE' }).get(),
            db.collection('duo_user_achievements')
                .where({ userId })
                .get()
        ]);

        if (!userStats.data.length) {
            throw new Error('User stats not found')
        }


        let existingMap;
        try {
            if (!existingAchievements) {
                console.warn('existingAchievements is null or undefined');
                existingMap = new Map();
            } else if (!Array.isArray(existingAchievements.data)) {
                console.warn('existingAchievements.data is not an array:', existingAchievements);
                existingMap = new Map();
            } else {
                existingMap = new Map(
                    existingAchievements.data.map(a => [a.achievementId, a])
                );
            }
        } catch (error) {
            console.error('Error creating existingMap:', error);
            existingMap = new Map();
        }


        const stats = userStats.data[0].stats
        const completedAchievements = []
        const newlyUnlockedAchievements = []
        const progressUpdates = []

        // 检查每个成就
        for (const config of configs.data) {
            try {
                const checkFn = achievementConditions[config.type]

                if (!checkFn) continue

                // 准备检查数据
                const checkData = {
                    ...gameData,
                    ...stats,
                    difficulty: gameData.difficulty
                }

                // 执行检查
                const result = checkFn(checkData, config)
                const existing = existingMap.get(config.id)

                // 构建进度数据
                const progressData = {
                    achievementId: config.id,
                    progress: {
                        currentValue: result.currentValue,
                        targetValue: config.targetValue,
                        percentage: result.progress
                    },
                    completed: result.completed,
                    config
                }

                if (result.completed) {
                    completedAchievements.push(progressData)

                    // 如果之前未完成或不存在，则为新解锁
                    if (!existing || !existing.unlocked) {
                        newlyUnlockedAchievements.push({
                            ...progressData,
                            unlockTime: new Date()
                        })
                    }
                }
                progressUpdates.push(progressData)
            } catch (error) {
                console.error(`Error checking achievement ${config.id}:`, error)
            }
        }

        // 批量更新成就进度
        await updateAchievementProgress(userId, progressUpdates)

        return {
            code: 0,
            data: { completedAchievements, newlyUnlockedAchievements, progressUpdates }
        }
    } catch (error) {
        console.error('Check achievements failed:', error)
        throw error
    }
}


/**
 * 更新成就进度
 */
async function updateAchievementProgress(userId, progressUpdates) {
    try {
        if (!progressUpdates.length) return;

        // 1. 批量获取现有成就记录
        const existingAchievements = await db.collection('duo_user_achievements')
            .where({
                userId,
                achievementId: _.in(progressUpdates.map(u => u.achievementId))
            })
            .get();

        // 2. 将现有记录转换为 Map 以便快速查找
        const existingMap = new Map(
            existingAchievements.data.map(a => [a.achievementId, a])
        );

        // 3. 分离新增和更新操作
        const adds = [];
        const updates = [];

        progressUpdates.forEach(update => {
            const { achievementId, progress, completed } = update;
            const existing = existingMap.get(achievementId);

            if (!existing) {
                // 新增记录
                adds.push({
                    userId,
                    achievementId,
                    unlocked: completed,
                    progress,
                    unlockTime: completed ? db.serverDate() : null,
                    createdAt: db.serverDate(),
                    updatedAt: db.serverDate()
                });
            } else {
                // 检查是否需要更新
                const needsUpdate =
                    existing.progress.percentage !== progress.percentage ||
                    existing.unlocked !== completed;

                if (needsUpdate) {
                    const updateData = {
                        progress,
                        updatedAt: db.serverDate()
                    };

                    // 如果首次解锁，添加解锁时间
                    if (completed && !existing.unlocked) {
                        updateData.unlocked = true;
                        updateData.unlockTime = db.serverDate();
                    }

                    updates.push({
                        achievementId,
                        updateData
                    });
                }
            }
        });

        // 4. 批量执行操作
        const operations = [];

        // 4.1 批量新增
        if (adds.length) {
            operations.push(
                db.collection('duo_user_achievements')
                    .add({
                        data: adds
                    })
            );
        }

        // 4.2 批量更新
        const batchSize = 20; // 微信云数据库批量更新限制
        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            const updatePromises = batch.map(({ achievementId, updateData }) =>
                db.collection('duo_user_achievements')
                    .where({
                        userId,
                        achievementId
                    })
                    .update({
                        data: updateData
                    })
            );
            operations.push(...updatePromises);
        }

        // 5. 并行执行所有操作
        const results = await Promise.all(operations);

        // 6. 记录性能日志
        console.log('Achievement updates completed:', {
            totalUpdates: progressUpdates.length,
            newRecords: adds.length,
            updatedRecords: updates.length,
            timestamp: new Date().toISOString()
        });

        return results;
    } catch (error) {
        console.error('Update achievement progress failed:', {
            error,
            userId,
            updatesCount: progressUpdates.length,
            timestamp: new Date().toISOString(),
            memoryUsage: process.memoryUsage()
        });
        throw error;
    }
}

/**
 * 获取用户成就列表
 */
async function getAchievements(userId, data = {}) {
    const { category, type } = data

    try {
        let query = db.collection('duo_user_achievements')
            .aggregate()
            .match({ userId })
            .lookup({
                from: 'duo_achievement_configs',
                localField: 'achievementId',
                foreignField: 'id',
                as: 'config'
            })
            .unwind('$config')
            .match({
                'config.status': 'ACTIVE'
            })

        // 添加分类过滤
        if (category) {
            query = query.match({
                'config.category.id': category
            })
        }

        // 添加类型过滤
        if (type) {
            query = query.match({
                'config.type': type
            })
        }

        const result = await query
            .project({
                _id: 0,
                achievementId: 1,
                unlocked: 1,
                progress: 1,
                unlockTime: 1,
                config: {
                    name: 1,
                    description: 1,
                    type: 1,
                    category: 1,
                    icon: 1,
                    points: 1,
                    rewards: 1,
                    order: 1
                }
            })
            .sort({
                'config.order': 1
            })
            .end()

        return {
            code: 0,
            data: result.list
        }
    } catch (error) {
        throw error
    }
}


/**
* 获取成就统计信息
*/
async function getAchievementStats(userId) {
    try {
        const stats = await db.collection('duo_user_achievements')
            .aggregate()
            .match({ userId })
            .lookup({
                from: 'duo_achievement_configs',
                localField: 'achievementId',
                foreignField: 'id',
                as: 'config'
            })
            .unwind('$config')
            .match({
                'config.status': 'ACTIVE'
            })
            .group({
                _id: null,
                total: $.sum(1),
                unlocked: $.sum($.cond({
                    if: '$unlocked',
                    then: 1,
                    else: 0
                })),
                totalPoints: $.sum($.cond({
                    if: '$unlocked',
                    then: '$config.points',
                    else: 0
                }))
            })
            .project({
                _id: 0,
                total: 1,
                unlocked: 1,
                totalPoints: 1,
                percentage: $.multiply([
                    $.divide(['$unlocked', '$total']),
                    100
                ])
            })
            .end()

        return {
            code: 0,
            data: stats.list[0] || {
                total: 0,
                unlocked: 0,
                totalPoints: 0,
                percentage: 0
            }
        }
    } catch (error) {
        throw error
    }
}

/**
* 获取最近解锁的成就
*/
async function getRecentUnlocks(userId, data = {}) {
    const { limit = 5 } = data

    try {
        const recent = await db.collection('duo_user_achievements')
            .aggregate()
            .match({
                userId,
                unlocked: true
            })
            .lookup({
                from: 'duo_achievement_configs',
                localField: 'achievementId',
                foreignField: 'id',
                as: 'config'
            })
            .unwind('$config')
            .sort({
                unlockTime: -1
            })
            .limit(limit)
            .project({
                _id: 0,
                achievementId: 1,
                unlockTime: 1,
                config: {
                    name: 1,
                    description: 1,
                    icon: 1,
                    points: 1,
                    category: 1
                }
            })
            .end()

        return {
            code: 0,
            data: recent.list
        }
    } catch (error) {
        throw error
    }
}


/**
* 获取分类统计
*/
async function getCategoryStats(userId) {
    try {
        const categoryStats = await db.collection('duo_user_achievements')
            .aggregate()
            .match({ userId })
            .lookup({
                from: 'duo_achievement_configs',
                localField: 'achievementId',
                foreignField: 'id',
                as: 'config'
            })
            .unwind('$config')
            .match({
                'config.status': 'ACTIVE'
            })
            .group({
                _id: {
                    categoryId: '$config.category.id',
                    categoryName: '$config.category.name'
                },
                total: $.sum(1),
                unlocked: $.sum($.cond({
                    if: '$unlocked',
                    then: 1,
                    else: 0
                })),
                points: $.sum($.cond({
                    if: '$unlocked',
                    then: '$config.points',
                    else: 0
                }))
            })
            .project({
                _id: 0,
                categoryId: '$_id.categoryId',
                categoryName: '$_id.categoryName',
                total: 1,
                unlocked: 1,
                points: 1,
                percentage: $.multiply([
                    $.divide(['$unlocked', '$total']),
                    100
                ])
            })
            .end()

        return {
            code: 0,
            data: categoryStats.list
        }
    } catch (error) {
        throw error
    }
}


/**
* 获取成就配置
*/
async function getAchievementConfigs(userId, data = {}) {
    const { type, category } = data

    try {
        let query = {
            status: 'ACTIVE'
        }

        if (type) {
            query.type = type
        }

        if (category) {
            query['category.id'] = category
        }

        const configs = await db.collection('duo_achievement_configs')
            .where(query)
            .orderBy('order', 'asc')
            .get()

        return {
            code: 0,
            data: configs.data
        }
    } catch (error) {
        throw error
    }
}


/**
 * 获取成就类别
 */
async function getCategories(userId) {
    try {
        const { data: categories } = await db.collection('duo_achievement_categories')
            .where({
                isActive: true
            })
            .orderBy('order', 'asc')
            .get()

        return {
            code: 0,
            data: categories
        }
    } catch (error) {
        console.error('Get categories failed:', error)
        return {
            code: -1,
            msg: error.message
        }
    }
}


// 云函数入口
exports.main = async (event, context) => {
    const { type, data } = event
    const { OPENID } = cloud.getWXContext()

    // 路由处理
    const handlers = {
        getAchievements,
        checkAchievements,
        getAchievementStats,
        getRecentUnlocks,
        getCategoryStats,
        getAchievementConfigs,
        getCategories
    }

    try {
        const handler = handlers[type]
        if (!handler) {
            throw new Error(`Unknown operation type: ${type}`)
        }
        return await handler(OPENID, data)
    } catch (error) {
        console.error(`[${type}] operation failed:`, error)
        return {
            code: -1,
            msg: error.message
        }
    }
}