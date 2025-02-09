/**
 * @fileoverview 奖励处理器
 * @description 处理不同类型奖励的发放逻辑
 */

const GameConstants = require('../../utils/constants/game-constants')
const { userManager } = require('../user/user-manager')
const Logger = require('../../utils/helpers/logger')

/**
 * 奖励处理器类
 * @class RewardHandler
 */
class RewardHandler {
  /**
   * 处理奖励
   * @param {Object} reward - 奖励配置
   * @param {Object} context - 奖励上下文
   * @returns {Promise<void>}
   */
  async handleReward(reward, context) {
    try {
      switch (reward.type) {
        case GameConstants.RewardType.POINTS:
          await this._handlePointsReward(reward, context)
          break
        case GameConstants.RewardType.THEME:
          await this._handleThemeReward(reward, context)
          break
        case GameConstants.RewardType.TITLE:
          await this._handleTitleReward(reward, context)
          break
        case GameConstants.RewardType.BADGE:
          await this._handleBadgeReward(reward, context)
          break
        default:
          Logger.warn(`Unknown reward type: ${reward.type}`)
      }
    } catch (error) {
      Logger.error('Handle reward failed:', error)
      throw error
    }
  }

  /**
   * 处理积分奖励
   * @private
   */
  async _handlePointsReward(reward, context) {
    const points = reward.value
    await userManager.updatePoints(points, {
      source: 'reward',
      rewardId: reward.id,
      ...context
    })
  }

  /**
   * 处理主题奖励
   * @private
   */
  async _handleThemeReward(reward, context) {
    const theme = reward.value
    await userManager.updateSettings({
      theme
    })
  }

  /**
   * 处理称号奖励
   * @private
   */
  async _handleTitleReward(reward, context) {
    const title = reward.value
    await userManager.updateProfile({
      title
    })
  }

  /**
   * 处理徽章奖励
   * @private
   */
  async _handleBadgeReward(reward, context) {
    const badge = reward.value
    const currentUser = userManager.getCurrentUser()
    const badges = new Set(currentUser.badges || [])
    badges.add(badge)
    
    await userManager.updateProfile({
      badges: Array.from(badges)
    })
  }
}

module.exports = RewardHandler 