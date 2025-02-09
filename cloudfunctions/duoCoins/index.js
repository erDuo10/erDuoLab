const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext() // 直接获取调用者的 OPENID
  const { action, data } = event

  switch (action) {
    case 'batchAddCoins':
      return await batchAddCoins({ userId: OPENID, ...data })
    case 'getUserCoins':
      return await getUserCoins({ userId: OPENID })
    case 'getCoinRecords':  // 新增获取记录方法
      return await getCoinRecords({ userId: OPENID, ...data })
    default:
      throw new Error('未知的操作类型')
  }
}

/**
 * 批量添加金币记录
 */
async function batchAddCoins({ userId, rewards }) {
  const batch = rewards.map(reward => ({
    userId,  // 使用云函数获取的 OPENID
    coins: reward.rewards[0].value,
    achievementId: reward.achievementId,
    achievementName: reward.achievementName,
    createdAt: new Date(),
    updatedAt: new Date()
  }))

  try {
    return await db.collection('duo_user_coins').add({
      data: batch
    })
  } catch (error) {
    console.error('批量添加金币失败:', error)
    throw error
  }
}

/**
 * 获取用户总金币
 */
async function getUserCoins({ userId }) {
  try {
    const { list } = await db.collection('duo_user_coins')
      .aggregate()
      .match({
        userId: userId
      })
      .group({
        _id: null,
        total: db.command.aggregate.sum('$coins')
      })
      .end()

    // 如果没有记录，返回0
    const total = list && list[0] ? list[0].total : 0

    return {
      code: 0,
      data: {
        coins: total
      }
    }
  } catch (error) {
    console.error('获取用户金币失败:', error)
    return {
      code: -1,
      message: error.message
    }
  }
}

/**
 * 获取用户金币记录
 * @param {Object} params
 * @param {string} params.userId - 用户ID
 * @param {number} params.page - 页码，从1开始
 * @param {number} params.pageSize - 每页记录数
 * @returns {Promise<Object>} 返回分页数据
 */
async function getCoinRecords({ userId, page = 1, pageSize = 20 }) {
  try {
    const collection = db.collection('duo_user_coins')

    // 获取总记录数
    const { total } = await collection.where({ userId }).count()

    // 获取分页数据
    const records = await collection
      .where({ userId })
      .orderBy('createdAt', 'desc')  // 按时间倒序
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      total,
      page,
      pageSize,
      records: records.data.map(record => ({
        ...record,
        createdAt: record.createdAt.toISOString(),  // 格式化时间
        updatedAt: record.updatedAt.toISOString()
      }))
    }
  } catch (error) {
    console.error('获取金币记录失败:', error)
    throw error
  }
}