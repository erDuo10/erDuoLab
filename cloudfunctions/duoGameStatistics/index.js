const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command 

// 默认统计数据结构
const DEFAULT_STATS = {
  stats: {
    gamesTotal: 0,         // 新增：游戏总局数
    gamesCompleted: 0,     // 完成的游戏数
    difficultyStats: {
      easy: { 
        total: 0,         // 新增：该难度总局数
        completed: 0, 
        perfectGames: 0, 
        bestTime: null 
      },
      medium: { 
        total: 0,         // 新增：该难度总局数
        completed: 0, 
        perfectGames: 0, 
        bestTime: null 
      },
      hard: { 
        total: 0,         // 新增：该难度总局数
        completed: 0, 
        perfectGames: 0, 
        bestTime: null 
      }
    },
    streaks: {
      current: { daily: 0, perfect: 0 },
      best: { daily: 0, perfect: 0 }
    },
    lastPlayDate: null
  }
}


// 记录游戏结果处理函数
async function handleRecordGame(OPENID, params) {
  const { difficulty, timeSpent, errors, hintsUsed, completed } = params
  try {

    // 1. 验证游戏数据
    validateGameData({
      difficulty,
      timeSpent,
      errors,
      hintsUsed,
      completed
    })

    // 2. 记录游戏数据
    const gameRecord = {
      userId: OPENID,
      score: calculateScore({
        difficulty,
        timeSpent,
        errors,
        hintsUsed,
        completed
      }),
      difficulty,
      timeSpent,
      errors,
      hintsUsed,
      completed,
      createdAt: db.serverDate()
    }

    await db.collection('duo_game_records').add({
      data: gameRecord
    })

    // 3. 更新用户统计
    await updateGameStats(OPENID, gameRecord)

    return {
      code: 0
    }
  } catch (error) {
    console.error('记录游戏结果失败:', error)
    return { code: -1, message: error.message }
  }
}

// 获取用户统计处理函数
async function handleGetStatistics(OPENID) {
  try {
    const result = await db.collection('duo_user_statistics')
      .where({ userId: OPENID })
      .get()

    return {
      code: 0,
      data: result.data[0] || { stats: initializeUserStats() }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return { code: -1, message: error.message }
  }
}

// 获取排行榜处理函数
async function handleGetLeaderboard(params) {
  const { difficulty = 'easy', limit = 10 } = params

  // 参数验证
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    return { code: -1, message: '无效的难度级别' }
  }

  try {
    const result = await db.collection('duo_user_statistics')
      .where({
        [`stats.difficultyStats.${difficulty}.completed`]: db.command.gt(0)
      })
      .orderBy(`difficultyStats.${difficulty}.bestTime`, 'asc')
      .limit(limit)
      .get()

    return {
      code: 0,
      data: result.data
    }
  } catch (error) {
    console.error('获取排行榜失败:', error)
    return { code: -1, message: error.message }
  }
}

// 获取最近游戏记录处理函数
async function handleGetRecentGames(OPENID, params) {
  const { difficulty, limit = 10 } = params

  // 参数验证
  if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
    return { code: -1, message: '无效的难度级别' }
  }

  try {
    const result = await db.collection('duo_game_records')
      .where({
        userId: OPENID,
        difficulty
      })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    return {
      code: 0,
      data: result.data
    }
  } catch (error) {
    console.error('获取最近游戏记录失败:', error)
    return { code: -1, message: error.message }
  }
}

// 计算游戏得分
function calculateScore(gameData) {
  const { difficulty, timeSpent, errors, hintsUsed, completed } = gameData

  if (!completed) return 0

  // 基础分数
  const baseScore = {
    'easy': 100,
    'medium': 200,
    'hard': 300
  }[difficulty]

  // 根据用时、错误数和提示数计算扣分
  const timePenalty = Math.floor(timeSpent / 60) * 5  // 每分钟扣5分
  const errorPenalty = errors * 10                     // 每个错误扣10分
  const hintPenalty = hintsUsed * 15                  // 每个提示扣15分

  return Math.max(0, baseScore - timePenalty - errorPenalty - hintPenalty)
}


async function updateGameStats(userId, gameData) {
  try {
    const { difficulty, timeSpent, errors, hintsUsed, completed } = gameData
    
    // 获取当前统计
    const userStats = await db.collection('duo_user_statistics')
      .where({ userId })
      .get()
    
    const currentStats = userStats.data[0]?.stats || initializeUserStats()
    const isPerfectGame = errors === 0 && hintsUsed === 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 计算连续记录
    let newDailyStreak = currentStats.streaks.current.daily
    let newPerfectStreak = currentStats.streaks.current.perfect

    // 只在完成游戏时更新连续记录
    if (completed) {
      // 计算每日连续记录
      if (!currentStats.lastPlayDate) {
        newDailyStreak = 1
      } else {
        const lastPlay = new Date(currentStats.lastPlayDate)
        lastPlay.setHours(0, 0, 0, 0)
        const daysDiff = Math.floor((today - lastPlay) / (1000 * 60 * 60 * 24))

        if (daysDiff === 1) {
          newDailyStreak += 1
        } else if (daysDiff > 1) {
          newDailyStreak = 1
        }
        // daysDiff === 0 表示同一天的游戏，保持当前连续记录
      }

      // 计算完美游戏连续记录
      newPerfectStreak = isPerfectGame ? newPerfectStreak + 1 : 0
    }

    // 计算新的统计数据
    const newStats = {
      gamesTotal: currentStats.gamesTotal + 1,
      gamesCompleted: completed ? currentStats.gamesCompleted + 1 : currentStats.gamesCompleted,
      difficultyStats: {
        ...currentStats.difficultyStats,
        [difficulty]: {
          total: (currentStats.difficultyStats[difficulty]?.total || 0) + 1,
          completed: completed ? (currentStats.difficultyStats[difficulty]?.completed || 0) + 1 : (currentStats.difficultyStats[difficulty]?.completed || 0),
          perfectGames: completed && isPerfectGame ? (currentStats.difficultyStats[difficulty]?.perfectGames || 0) + 1 : (currentStats.difficultyStats[difficulty]?.perfectGames || 0),
          bestTime: completed ? Math.min(timeSpent, currentStats.difficultyStats[difficulty]?.bestTime || Infinity) : currentStats.difficultyStats[difficulty]?.bestTime
        }
      },
      streaks: {
        current: {
          daily: newDailyStreak,
          perfect: newPerfectStreak
        },
        best: {
          daily: Math.max(currentStats.streaks.best.daily || 0, newDailyStreak),
          perfect: Math.max(currentStats.streaks.best.perfect || 0, newPerfectStreak)
        }
      },
      lastPlayDate: completed ? today : currentStats.lastPlayDate
    }

    // 执行更新或创建
    if (!userStats.data.length) {
      await db.collection('duo_user_statistics').add({
        data: {
          userId,
          stats: newStats,
          updatedAt: db.serverDate()
        }
      })
    } else {
      await db.collection('duo_user_statistics')
        .where({ userId })
        .update({
          data: {
            stats: newStats,
            updatedAt: db.serverDate()
          }
        })
    }

    return { code: 0 }
  } catch (error) {
    console.error('Update game stats failed:', error)
    throw error
  }
}


// 初始化用户统计数据
function initializeUserStats() {
  return JSON.parse(JSON.stringify(DEFAULT_STATS.stats))
}

// 数据验证函数
function validateGameData(data) {
  const schema = {
    difficulty: (val) => typeof val === 'string' && ['easy', 'medium', 'hard'].includes(val),
    timeSpent: (val) => typeof val === 'number' && val >= 0,
    hintsUsed: (val) => typeof val === 'number' && val >= 0,
    errors: (val) => typeof val === 'number' && val >= 0,
    completed: (val) => typeof val === 'boolean'
  }

  const errors = []
  for (const [key, validator] of Object.entries(schema)) {
    if (data[key] === undefined || !validator(data[key])) {
      errors.push(`Invalid ${key}: ${data[key]}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Data validation failed: ${errors.join(', ')}`)
  }
}

// 路由配置
const ROUTE_HANDLERS = {
  recordGame: handleRecordGame,
  getStatistics: handleGetStatistics,
  getLeaderboard: handleGetLeaderboard,
  getRecentGames: handleGetRecentGames
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { $url, ...params } = event

  // 获取对应的处理函数
  const handler = ROUTE_HANDLERS[$url]

  if (!handler) {
    return { code: -1, message: '无效的操作' }
  }

  try {
    // 调用对应的处理函数
    return await handler(OPENID, params)
  } catch (error) {
    console.error(`处理 ${$url} 请求失败:`, error)
    return { code: -1, message: '操作失败' }
  }
}
