// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { category } = event
  const _ = db.command
  
  try {
    let query = {
      isActive: true,
      category: category
    }
    
    const { data } = await db.collection('duo_blessings')
      .where(query)
      .field({
        content: true,
        order: true
      })
      .orderBy('order', 'asc')
      .get()
    
    return {
      code: 0,
      data,
      message: 'success'
    }
  } catch (error) {
    return {
      code: -1,
      data: null,
      message: error.message
    }
  }
}