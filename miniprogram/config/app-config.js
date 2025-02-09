/**
 * @fileoverview 应用全局配置
 * @description 定义应用级别的配置项
 */

/**
 * @typedef {Object} AppConfig
 * @property {GameConfig} game - 游戏相关配置
 * @property {StorageConfig} storage - 存储相关配置
 * @property {UIConfig} ui - UI相关配置
 */

/**
 * 应用配置
 * @type {AppConfig}
 */
const AppConfig = {
  /** 游戏配置 */
  game: {
    /** 游戏难度配置 */
    difficulties: {
      easy: {
        name: '简单',
        emptyCount: 30,
        scoreBase: 100
      },
      medium: {
        name: '中等',
        emptyCount: 40,
        scoreBase: 200
      },
      hard: {
        name: '困难',
        emptyCount: 50,
        scoreBase: 300
      },
      EXPERT: {
        name: '专家',
        emptyCount: 60,
        scoreBase: 500
      }
    },
    
    /** 游戏设置 */
    settings: {
      maxHints: 3,
      timeLimit: 3600, // 1小时
      perfectScoreTimeLimit: 300 // 5分钟
    }
  },

  /** 存储配置 */
  storage: {
    /** 本地存储键名 */
    keys: {
      USER_DATA: 'userData',
      GAME_STATS: 'gameStats',
      SETTINGS: 'settings',
      ACHIEVEMENTS: 'achievements'
    },
    
    /** 缓存配置 */
    cache: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      checkInterval: 60 * 60 * 1000 // 1小时
    }
  },

  /** UI配置 */
  ui: {
    /** 主题配置 */
    themes: {
      DEFAULT: 'default',
      DARK: 'dark',
      LIGHT: 'light'
    },
    
    /** 动画配置 */
    animation: {
      duration: 300,
      timingFunction: 'ease'
    }
  }
}

module.exports = AppConfig 
