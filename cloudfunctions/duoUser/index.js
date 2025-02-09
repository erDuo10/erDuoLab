// duoUser/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 登录
exports.login = async (event, context) => {
  const { OPENID, UNIONID } = cloud.getWXContext()
  
  try {
    const userResult = await db.collection('duo_users')
      .where({ openId: OPENID })
      .get()
    
    if (!userResult.data.length) {
      // 新用户注册
      await db.collection('duo_users').add({
        data: {
          openId: OPENID,
          unionId: UNIONID || '',
          sessionData: {
            lastLoginTime: db.serverDate(),
            loginCount: 1
          },
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    } else {
      // 更新登录信息
      await db.collection('duo_users').where({
        openId: OPENID
      }).update({
        data: {
          'sessionData.lastLoginTime': db.serverDate(),
          'sessionData.loginCount': db.command.inc(1),
          updatedAt: db.serverDate()
        }
      })
    }

    return {
      code: 0,
      data: { 
        openId: OPENID, 
        unionId: UNIONID,
        userInfo: userResult.data[0]?.userInfo,
        settings: userResult.data[0]?.settings
      }
    }
  } catch (error) {
    return { code: -1, msg: error.message }
  }
}

// 更新用户数据（统一处理用户信息、设置和会话数据的更新）
exports.updateUserData = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { type, data } = event
  
  try {
    const updateData = {}
    
    switch(type) {
      case 'userInfo':
        updateData.userInfo = data
        break
      case 'settings':
        updateData.settings = data
        break
      case 'session':
        updateData.sessionData = {
          ...data,
          lastLoginTime: db.serverDate()
        }
        break
      default:
        throw new Error('Invalid update type')
    }
    
    updateData.updatedAt = db.serverDate()
    
    await db.collection('duo_users').where({
      openId: OPENID
    }).update({
      data: updateData
    })
    
    return { code: 0, msg: 'success' }
  } catch (error) {
    return { code: -1, msg: error.message }
  }
}

// 获取用户数据
exports.getUserData = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { fields = [] } = event
  
  try {
    const query = db.collection('duo_users').where({ openId: OPENID })
    
    // 如果指定了字段，只返回指定字段
    if (fields.length > 0) {
      const fieldObj = fields.reduce((acc, field) => {
        acc[field] = 1
        return acc
      }, {})
      query.field(fieldObj)
    }
    
    const result = await query.get()
    
    return {
      code: 0,
      data: result.data[0] || null
    }
  } catch (error) {
    return { code: -1, msg: error.message }
  }
}

// 添加主函数
exports.main = async (event, context) => {
  const { type } = event
  
  switch (type) {
    case 'login':
      return await exports.login(event, context)
    case 'updateUserData':
      return await exports.updateUserData(event, context)
    case 'getUserData':
      return await exports.getUserData(event, context)
    default:
      return {
        code: -1,
        msg: 'Invalid operation type'
      }
  }
}
