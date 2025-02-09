const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

/**
 * 获取奖励列表
 */
async function getRewards(event, context) {
  const { OPENID } = cloud.getWXContext()
  
  try {
    // 获取所有激活的奖励配置
    const configs = await db.collection('duo_reward_configs')
      .where({
        status: 'ACTIVE'
      })
      .get()
      
    // 获取用户已领取的奖励
    const userRewards = await db.collection('duo_user_rewards')
      .where({
        userId: OPENID
      })
      .get()
      
    return {
      code: 0,
      data: {
        configs: configs.data,
        userRewards: userRewards.data
      }
    }
  } catch (error) {
    return {
      code: -1,
      error
    }
  }
}

/**
 * 更新奖励状态
 */
async function updateReward(event, context) {
  const { OPENID } = cloud.getWXContext()
  const { reward } = event
  
  try {
    // 检查奖励是否存在且激活
    const config = await db.collection('duo_reward_configs')
      .where({
        id: reward.id,
        status: 'ACTIVE'
      })
      .get()
      
    if (!config.data.length) {
      throw new Error('Reward not found or inactive')
    }
    
    // 更新或创建用户奖励记录
    const result = await db.collection('duo_user_rewards')
      .where({
        userId: OPENID,
        rewardId: reward.id
      })
      .update({
        data: {
          claimed: reward.claimed,
          claimTime: reward.claimTime,
          context: reward.context,
          updatedAt: db.serverDate()
        }
      })
      
    if (!result.updated) {
      // 如果记录不存在，创建新记录
      await db.collection('duo_user_rewards').add({
        data: {
          userId: OPENID,
          rewardId: reward.id,
          claimed: reward.claimed,
          claimTime: reward.claimTime,
          context: reward.context,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    }
    
    return {
      code: 0,
      data: reward
    }
  } catch (error) {
    return {
      code: -1,
      error
    }
  }
}

/**
 * 批量发放奖励
 */
async function batchGrantRewards(event, context) {
  const { OPENID } = cloud.getWXContext()
  const { rewards, context } = event
  
  try {
    const tasks = rewards.map(rewardId => {
      return db.collection('duo_user_rewards').add({
        data: {
          userId: OPENID,
          rewardId,
          claimed: true,
          claimTime: db.serverDate(),
          context,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    })
    
    await Promise.all(tasks)
    
    return {
      code: 0,
      data: {
        success: true
      }
    }
  } catch (error) {
    return {
      code: -1,
      error
    }
  }
}

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
  const { type } = event
  
  // 根据操作类型调用对应的处理函数
  switch (type) {
    case 'getRewards':
      return await getRewards(event, context)
    case 'updateReward':
      return await updateReward(event, context)
    case 'batchGrantRewards':
      return await batchGrantRewards(event, context)
    default:
      return {
        code: -1,
        error: 'Unknown operation type'
      }
  }
}