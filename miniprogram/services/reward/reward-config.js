/**
 * @fileoverview 奖励配置
 * @description 定义所有奖励的配置信息
 */

const GameConstants = require('../../utils/constants/game-constants')

/**
 * 奖励配置
 * @type {Object}
 */
const RewardConfig = {
  /**
   * 奖励列表
   */
  rewards: [
    // 积分奖励
    {
      id: 'points_100',
      name: '100积分',
      description: '获得100积分',
      type: GameConstants.RewardType.POINTS,
      icon: '/images/rewards/points.png',
      value: 100
    },
    {
      id: 'points_1000',
      name: '1000积分',
      description: '获得1000积分',
      type: GameConstants.RewardType.POINTS,
      icon: '/images/rewards/points.png',
      value: 1000
    },

    // 主题奖励
    {
      id: 'theme_dark',
      name: '暗黑主题',
      description: '解锁暗黑主题',
      type: GameConstants.RewardType.THEME,
      icon: '/images/rewards/theme_dark.png',
      value: 'dark'
    },

    // 称号奖励
    {
      id: 'title_master',
      name: '数独达人',
      description: '获得"数独达人"称号',
      type: GameConstants.RewardType.TITLE,
      icon: '/images/rewards/title.png',
      value: '数独达人'
    },

    // 徽章奖励
    {
      id: 'badge_speed',
      name: '速度之星',
      description: '获得速度之星徽章',
      type: GameConstants.RewardType.BADGE,
      icon: '/images/rewards/badge_speed.png',
      value: 'speed_master'
    }
  ],

  /**
   * 奖励类型配置
   */
  types: {
    [GameConstants.RewardType.POINTS]: {
      name: '积分',
      color: '#FFC107'
    },
    [GameConstants.RewardType.THEME]: {
      name: '主题',
      color: '#9C27B0'
    },
    [GameConstants.RewardType.TITLE]: {
      name: '称号',
      color: '#2196F3'
    },
    [GameConstants.RewardType.BADGE]: {
      name: '徽章',
      color: '#4CAF50'
    }
  }
}

module.exports = RewardConfig 