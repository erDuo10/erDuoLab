/**
 * @fileoverview 奖励管理器
 * @description 处理奖励系统的核心业务逻辑
 */

const RewardStorage = require('./reward-storage')
const RewardConfig = require('./reward-config')
const RewardHandler = require('./reward-handler')
const { userManager } = require('../user/user-manager')
const { globalEventManager } = require('../../utils/event/event-manager')
const EventTypes = require('../../utils/event/event-types')
const ErrorCodes = require('../../utils/constants/error-codes')
const Logger = require('../../utils/helpers/logger')

/**
 * 奖励管理器类
 * @class RewardManager
 */
class RewardManager {
  constructor() {
    this.storage = new RewardStorage()
    this.handler = new RewardHandler()
    this.rewards = new Map()
    this.userRewards = new Map()
    this.isInitialized = false

    // 监听成就相关事件
    this._initEventListeners()
  }

  /**
   * 初始化奖励系统
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) return

    try {
      // 加载奖励配置
      this.rewards = new Map(
        RewardConfig.rewards.map(reward => [reward.id, reward])
      )

      // 加载用户奖励数据
      if (userManager.isLoggedIn()) {
        await this._loadUserRewards()
      }

      this.isInitialized = true
    } catch (error) {
      Logger.error('RewardManager init failed:', error)
      throw {
        ...ErrorCodes.COMMON.INIT_FAILED,
        originalError: error
      }
    }
  }


  /**
 * 获取当前用户总金币数
 * @returns {Promise<number>} 返回用户总金币数
 */
  async getUserTotalCoins() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'duoCoins',
        data: {
          action: 'getUserCoins'
        }
      })

      return result.coins
    } catch (error) {
      console.error('获取用户金币失败:', error)
      throw error
    }
  }


  /**
 * 获取金币记录
 * @param {Object} params
 * @param {number} params.page - 页码，从1开始
 * @param {number} params.pageSize - 每页记录数
 * @returns {Promise<Object>} 返回分页数据
 */
  async getCoinRecords({ page = 1, pageSize = 20 } = {}) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'duoCoins',
        data: {
          action: 'getCoinRecords',
          data: { page, pageSize }
        }
      })

      return result
    } catch (error) {
      console.error('获取金币记录失败:', error)
      throw error
    }
  }

  /**
   * 发放奖励
   * @param {string} rewardId - 奖励ID
   * @param {Object} [context] - 奖励上下文
   * @returns {Promise<void>}
   */
  async grantReward(rewardId, context = {}) {
    try {
      const reward = this.rewards.get(rewardId)
      if (!reward) {
        throw new Error(`Reward ${rewardId} not found`)
      }

      // 检查是否已领取
      if (this.userRewards.get(rewardId)?.claimed) {
        return
      }

      // 处理奖励
      await this.handler.handleReward(reward, context)

      // 更新奖励状态
      const rewardData = {
        id: rewardId,
        claimed: true,
        claimTime: new Date(),
        context
      }

      // 保存奖励数据
      await this.storage.saveReward(rewardData)
      this.userRewards.set(rewardId, rewardData)

      globalEventManager.emit(EventTypes.ACHIEVEMENT.REWARD, {});
      globalEventManager.emit(EventTypes.UI.UPDATE, {
        type: 'reward',
      }
      );

    } catch (error) {
      Logger.error('Grant reward failed:', error)
      throw {
        ...ErrorCodes.COMMON.OPERATION_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 获取所有奖励
   * @returns {Array<Object>} 奖励列表
   */
  getAllRewards() {
    return Array.from(this.rewards.values())
  }

  /**
   * 获取用户奖励
   * @returns {Array<Object>} 用户奖励列表
   */
  getUserRewards() {
    return Array.from(this.userRewards.values())
  }

  /**
   * 加载用户奖励数据
   * @private
   */
  async _loadUserRewards() {
    const rewards = await this.storage.loadRewards()
    this.userRewards = new Map(
      rewards.map(reward => [reward.id, reward])
    )
  }

  /**
   * 初始化事件监听
   * @private
   */
  _initEventListeners() {
    // 监听成就解锁事件
    globalEventManager.on(EventTypes.ACHIEVEMENT.BATCH_UNLOCK, async (data) => {
      const { achievements } = data

      const rewards = achievements.map(achievement => ({
        achievementId: achievement.achievementId,
        achievementName: achievement.config.name,
        rewards: achievement.config.rewards
      }))

      try {
        // 调用云函数发放金币,不需要传 userId
        const result = await wx.cloud.callFunction({
          name: 'duoCoins',
          data: {
            action: 'batchAddCoins',
            data: { rewards }
          }
        })

      } catch (error) {
        console.error('金币发放失败:', error)
      }
    })

    // 监听用户登录事件
    globalEventManager.on(EventTypes.USER.LOGIN, async () => {
      await this._loadUserRewards()
    })

    // 监听用户登出事件
    globalEventManager.on(EventTypes.USER.LOGOUT, () => {
      this.userRewards.clear()
    })
  }
}

// 创建全局实例
const rewardManager = new RewardManager()

module.exports = {
  RewardManager,
  rewardManager
}
