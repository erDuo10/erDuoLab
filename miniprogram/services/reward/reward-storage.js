/**
 * @fileoverview 奖励存储
 * @description 处理奖励数据的本地存储和云同步
 */

const LocalStorage = require('../../utils/storage/local-storage')
const AppConfig = require('../../config/app-config')
const ErrorCodes = require('../../utils/constants/error-codes')
const Logger = require('../../utils/helpers/logger')

/**
 * 奖励存储类
 * @class RewardStorage
 */
class RewardStorage {
  constructor() {
    this.keys = AppConfig.storage.keys
  }

  /**
   * 保存奖励数据
   * @param {Object} reward - 奖励数据
   * @returns {Promise<void>}
   */
  async saveReward(reward) {
    try {
      // 1. 获取现有奖励数据
      const rewards = await LocalStorage.load(this.keys.REWARDS) || []

      // 2. 更新或添加新奖励
      const index = rewards.findIndex(r => r.id === reward.id)
      if (index >= 0) {
        rewards[index] = reward
      } else {
        rewards.push(reward)
      }

      // 3. 保存到本地存储
      await LocalStorage.save(this.keys.REWARDS, rewards)

      // 4. 云端同步
      await wx.cloud.callFunction({
        name: 'duoReward',
        data: {
          type: 'updateReward',
          reward
        }
      })
    } catch (error) {
      Logger.error('Save reward failed:', error)
      throw {
        ...ErrorCodes.STORAGE.SAVE_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 加载奖励数据
   * @returns {Promise<Array>} 奖励数据列表
   */
  async loadRewards() {
    try {
      // 从云端获取最新数据
      const { result } = await wx.cloud.callFunction({
        name: 'duoReward',
        data: {
          type: 'getRewards'
        }
      })

      // 更新本地存储
      if (result.code === 0) {
        await LocalStorage.save(this.keys.REWARDS, result.data.userRewards)
        return result.data.userRewards
      }

      return []
    } catch (error) {
      Logger.error('Load rewards failed:', error)
      throw error
    }
  }

  /**
   * 同步奖励数据
   * @returns {Promise<void>}
   */
  async syncRewards() {
    try {
      // 从云端获取最新数据
      const { result } = await wx.cloud.callFunction({
        name: 'duoReward',
        data: {
          type: 'getRewards'
        }
      })

      if (result.code === 0) {
        // 更新本地存储
        await LocalStorage.save(this.keys.REWARDS, result.data.userRewards)
      }
    } catch (error) {
      Logger.error('Sync rewards failed:', error)
      throw error
    }
  }

  /**
 * 批量发放奖励
 */
  async batchGrantRewards(rewards, context) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'duoReward',
        data: {
          type: 'batchGrantRewards',
          rewards,
          context
        }
      })

      if (result.code === 0) {
        // 更新本地存储
        await this.syncRewards()
      }

      return result
    } catch (error) {
      Logger.error('Batch grant rewards failed:', error)
      throw error
    }
  }


}

module.exports = RewardStorage 