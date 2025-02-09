// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { cardId } = event;
  
  try {
    const result = await db.collection('duo_fuka_records')
      .doc(cardId)
      .get();
      
    return {
      code: 0,
      data: result.data,
      message: 'success'
    };
  } catch (error) {
    console.error('获取福卡详情失败:', error);
    return {
      code: -1,
      data: null,
      message: error.message || '获取福卡详情失败'
    };
  }
}