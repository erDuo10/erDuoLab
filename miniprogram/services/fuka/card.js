const { LIMITS, ERROR_CODES } = require('../../utils/fuka/constants');
const Cache = require('../../utils/fuka/cache');
const Logger = require('../../utils/fuka/logger');

class FukaService {
    // 生成福卡
    static async generateFuka(params) {
        try {
            Logger.info('Generating fuka', params);
            const startTime = Date.now();

            // 检查每日限制
            const dailyCount = Cache.getDailyCount();
            if (dailyCount >= LIMITS.DAILY_GENERATE) {
                throw new Error('已达到每日生成上限');
            }

            // 调用云函数生成福卡
            const result = await wx.cloud.callFunction({
                name: 'generateFuka',
                data: params
            });

            if (result.result.code !== 0) {
                throw new Error(result.result.msg);
            }

            // 更新本地缓存
            Cache.updateDailyCount(dailyCount + 1);

            Logger.performance('Generate Fuka', startTime);
            return result.result.data;
        } catch (error) {
            Logger.error('Generate fuka failed', error);
            throw error;
        }
    }

    // 获取福卡详情
    static async getFukaDetail(cardId) {
        try {
            const result = await wx.cloud.callFunction({
                name: 'getFukaDetail',
                data: { cardId }
            });

            if (result.result.code !== 0) {
                throw new Error(result.result.msg);
            }

            //return result.result.data;

            // 确保数据结构完整性
            const cardData = result.result.data;
            if (!cardData || !cardData.style) {
                throw new Error('福卡数据格式错误');
            }

            // 补充组件名称
            return {
                ...cardData,
                componentName: `fuka-${cardData.style.type}`
            };

        } catch (error) {
            Logger.error('Get fuka detail failed', error);
            throw error;
        }
    }

    // 收藏福卡
    static async toggleCollect(cardId) {
        try {
            // 获取收藏列表
            const collections = await this.getCollections();
            const isCollected = collections.includes(cardId);

            if (!isCollected && collections.length >= LIMITS.MAX_COLLECTION) {
                throw new Error('收藏数量已达上限');
            }

            // 调用云函数更新收藏状态
            const result = await wx.cloud.callFunction({
                name: 'updateUserStats',
                data: {
                    action: 'toggleCollection',
                    cardId
                }
            });

            if (result.result.code !== 0) {
                throw new Error(result.result.msg);
            }

            // 更新本地缓存
            const newCollections = isCollected
                ? collections.filter(id => id !== cardId)
                : [...collections, cardId];
            Cache.set('COLLECTION_LIST', newCollections);

            return !isCollected;
        } catch (error) {
            Logger.error('Toggle collection failed', error);
            throw error;
        }
    }

    // 获取收藏列表
    static async getCollections() {
        try {
            // 先从缓存获取
            let collections = Cache.get('COLLECTION_LIST');
            if (!collections) {
                // 从云端获取
                const result = await wx.cloud.callFunction({
                    name: 'getUserStats',
                    data: { type: 'collections' }
                });

                if (result.result.code !== 0) {
                    throw new Error(result.result.msg);
                }

                collections = result.result.data.collections;
                Cache.set('COLLECTION_LIST', collections);
            }
            return collections;
        } catch (error) {
            Logger.error('Get collections failed', error);
            return [];
        }
    }

    // 分享福卡
    static async shareFuka(cardId) {
        try {
            const lastShareTime = Cache.get('LAST_SHARE_TIME');
            if (lastShareTime && Date.now() - lastShareTime < LIMITS.SHARE_INTERVAL * 1000) {
                throw new Error('分享太频繁，请稍后再试');
            }

            const result = await wx.cloud.callFunction({
                name: 'updateUserStats',
                data: {
                    action: 'share',
                    cardId
                }
            });

            if (result.result.code !== 0) {
                throw new Error(result.result.msg);
            }

            Cache.set('LAST_SHARE_TIME', Date.now());
            return true;
        } catch (error) {
            Logger.error('Share fuka failed', error);
            throw error;
        }
    }

    // 获取历史记录
    static async getHistory(page = 1, pageSize = 10) {
        try {
            const result = await wx.cloud.callFunction({
                name: 'getFukaList',
                data: {
                    type: 'history',
                    page,
                    pageSize
                }
            });

            if (result.result.code !== 0) {
                throw new Error(result.result.msg);
            }

            return result.result.data;
        } catch (error) {
            Logger.error('Get history failed', error);
            throw error;
        }
    }
}

module.exports = {
    fukaService: FukaService
};