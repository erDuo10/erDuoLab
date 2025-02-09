// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 保存游戏状态
async function saveGameState(event, context) {
  const { OPENID } = cloud.getWXContext()
  const { gameState, difficulty } = event
  
  try {
    const saveData = {
      userId: OPENID,
      difficulty,
      gameState,
      updatedAt: db.serverDate(),
      expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    // 先查询是否存在记录
    const existingRecord = await db.collection('duo_game_saves')
      .where({
        userId: OPENID,
        difficulty
      })
      .limit(1)
      .get()

    if (existingRecord.data.length > 0) {
      // 更新现有记录
      await db.collection('duo_game_saves').where({
        userId: OPENID,
        difficulty
      }).update({
        data: saveData
      })
    } else {
      // 插入新记录
      await db.collection('duo_game_saves').add({
        data: saveData
      })
    }

    return { code: 0, msg: 'success' }
  } catch (error) {
    return { code: -1, msg: error.message }
  }
}


// 加载游戏状态
async function loadGameState(event, context){
  const { OPENID } = cloud.getWXContext()
  const { difficulty } = event
  
  try {
    const result = await db.collection('duo_game_saves')
      .where({
        userId: OPENID,
        difficulty,
        expireAt: db.command.gt(new Date())
      })
      .limit(1)
      .get()
      
    return {
      code: 0,
      data: result.data[0] || null
    }
  } catch (error) {
    return { code: -1, msg: error.message }
  }
}


async function clearGameState(event) {
  const { difficulty } = event
  const { OPENID } = cloud.getWXContext()

  try {
      await db.collection('duo_game_saves').where({
        userId: OPENID,
        difficulty: difficulty
      }).remove()

      return {
          code: 0,
          msg: 'success'
      }
  } catch (error) {
      return {
          code: -1,
          msg: error.message
      }
  }
}

// 主入口函数
exports.main = async (event, context) => {
  const { type } = event
  
  switch (type) {
    case 'saveGameState':
      return await saveGameState(event, context)
    case 'loadGameState':
      return await loadGameState(event, context)
    case 'clearGameState':
      return await clearGameState(event, context)
    default:
      return { code: -1, msg: 'Invalid operation type' }
  }
}