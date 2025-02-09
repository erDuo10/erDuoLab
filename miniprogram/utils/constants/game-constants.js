/**
 * @fileoverview 游戏常量定义
 * @description 定义游戏相关的常量
 */

/**
 * 游戏常量
 * @namespace GameConstants
 */
const GameConstants = {
  /** 游戏状态 */
  GameStatus: {
    /** 未开始 */
    READY: 'READY',
    /** 进行中 */
    PLAYING: 'PLAYING',
    /** 暂停 */
    PAUSED: 'PAUSED',
    /** 完成 */
    COMPLETED: 'COMPLETED',
    /** 失败 */
    FAILED: 'FAILED'
  },

  /** 游戏难度 */
  Difficulty: {
    easy: 'easy',
    medium: 'medium',
    hard: 'hard',
    EXPERT: 'EXPERT'
  },

  /** 成就类型 */
  AchievementType: {
    /** 进度类成就 */
    PROGRESS: 'PROGRESS',
    /** 技能类成就 */
    SKILL: 'SKILL',
    /** 时间类成就 */
    TIME: 'TIME',
    /** 特殊类成就 */
    SPECIAL: 'SPECIAL',
    /** 社交类成就 */
    SOCIAL: 'SOCIAL',
    /** 隐藏类成就 */
    HIDDEN: 'HIDDEN'
  },

  /** 奖励类型 */
  RewardType: {
    /** 积分奖励 */
    POINTS: 'POINTS',
    /** 主题奖励 */
    THEME: 'THEME',
    /** 称号奖励 */
    TITLE: 'TITLE',
    /** 道具奖励 */
    ITEM: 'ITEM',
    /** 徽章奖�� */
    BADGE: 'BADGE'
  },
  // 添加游戏配置验证
  validateConfig(config) {
    // 实现配置验证逻辑
  },

  // 添加难度描述
  DifficultyDescription: {
    easy: { minLevel: 1, maxTime: 600 },
    medium: { minLevel: 5, maxTime: 1200 }
  },

  // 添加成就条件
  AchievementConditions: {
    PROGRESS: { minValue: 0, maxValue: 100 },
    TIME: { minTime: 0, maxTime: 3600 }
  }
}

module.exports = GameConstants 
