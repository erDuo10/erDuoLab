const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();
  
  try {
    // 1. 获取系统配置
    const configDoc = await db.collection('duo_system_config')
      .doc('fuka_daily_limit')
      .get();
    const config = configDoc.data;

    // 2. 获取用户数据
    const userDoc = await db.collection('duo_users')
      .where({ openId: OPENID })
      .get();
    
    const user = userDoc.data[0];
    const now = new Date();
    const isNewDay = !user?.fuka?.lastAdTime || 
      new Date(user.fuka.lastAdTime).toDateString() !== now.toDateString();

    // 3. 初始化计数
    const dailyAdTimes = isNewDay ? 1 : (user?.fuka?.dailyAdTimes || 0) + 1;

    // 5. 更新用户数据
    const updateData = {
      'fuka.dailyAdTimes': dailyAdTimes,
      'fuka.lastAdTime': db.serverDate(),
      'fuka.totalAdTimes': db.command.inc(1)
    };

    await db.collection('duo_users')
    .where({ openId: OPENID })
    .update({ data: updateData });

    // 6. 返回更新后的数据
    return {
      success: true,
      data: {
        adRewardCount: config.adRewardCount
      }
    };

  } catch (error) {
    console.error('更新用户广告奖励失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};