const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  try {
    // 1. 获取系统配置
    const configDoc = await db.collection('duo_system_config')
      .doc('fuka_daily_limit')
      .get()

    const config = configDoc.data

    // 2. 获取用户数据
    const userDoc = await db.collection('duo_users')
      .where({ openId: OPENID })
      .get()

    // 3. 处理用户数据和日期检查
    const user = userDoc.data[0]
    const now = new Date()
    const isNewDay = !user?.fuka?.lastGenerateTime ||
      new Date(user.fuka.lastGenerateTime).toDateString() !== now.toDateString()

    // 4. 初始化计数器（考虑新用户和跨天重置）
    const dailyCount = isNewDay ? 0 : (user?.fuka?.daily || 0)
    const dailyAdTimes = isNewDay ? 0 : (user?.fuka?.dailyAdTimes || 0)
    const totalAvailableCount = config.freeCount + (config.adRewardCount * dailyAdTimes)

    // 5. 验证逻辑实现
    if (dailyAdTimes >= config.maxAdTimes) {
      // 验证逻辑1: 观看广告次数 >= 每日最大看广告次数
      if (dailyCount >= totalAvailableCount) {
        return {
          success: true,
          needAd: false,
          dailyCountToLimit: true
        }
      }
    } else if (dailyCount < totalAvailableCount) {
      // 验证逻辑2: 每日生成次数 < 每日免费次数 + 看广告奖励次数 * 看广告次数
      // 验证通过，继续处理
    } else {
      // 验证逻辑3: 其他情况需要观看广告
      return {
        success: true,
        needAd: true,
        dailyCountToLimit: false,
        data: {
          dailyCount,
          dailyAdTimes,
          maxAdTimes: config.maxAdTimes,
          totalAvailableCount
        }
      }
    }

    // 6. 生成福卡逻辑
    const transaction = await db.startTransaction()
    try {
      // 创建福卡记录
      const fukaData = {
        userId: OPENID,
        blessing: event.blessings,
        style: event.style,
        category: event.category,
        createTime: db.serverDate()
      }

      const recordResult = await transaction.collection('duo_fuka_records')
        .add({ data: fukaData })

      // 7. 更新或创建用户记录
      if (user) {
        // 更新现有用户
        await transaction.collection('duo_users')
          .where({ openId: OPENID })
          .update({
            data: {
              'fuka.daily': isNewDay ? 1 : db.command.inc(1),
              'fuka.total': db.command.inc(1),
              'fuka.lastGenerateTime': db.serverDate(),
              'fuka.dailyAdTimes': dailyAdTimes
            }
          })
      } else {
        // 创建新用户
        await transaction.collection('duo_users')
          .add({
            data: {
              openId: OPENID,
              fuka: {
                daily: 1,
                total: 1,
                dailyAdTimes: 0,
                lastGenerateTime: db.serverDate()
              },
              createdAt: db.serverDate()
            }
          })
      }

      await transaction.commit()

      return {
        success: true,
        needAd: false,
        dailyCountToLimit: false,
        data: {
          recordId: recordResult._id,
          ...fukaData,
          dailyCount: isNewDay ? 1 : dailyCount + 1,
          dailyAdTimes,
          maxAdTimes: config.maxAdTimes,
          totalAvailableCount
        }
      }

    } catch (error) {
      await transaction.rollback()
      throw error
    }

  } catch (error) {
    return {
      success: false,
      needAd: false,
      dailyCountToLimit: false,
      error: error.message,
      data: {
        errorType: error.name,
        errorMessage: error.message
      }
    }
  }
}
