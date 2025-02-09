
/**
 * Copyright (c) 2025 erDuoLab
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import GameStateService from './services/game/game-state'
const { achievementManager } = require('./services/achievement/achievement-manager')
const { achievementNotification } = require('./services/achievement/achievement-notification')
const Logger = require('./utils/helpers/logger')
const DUO_CONFIG = require('./duo')


const ACHIEVEMENT_CONFIG = {
  displayDuration: 10000,
  animations: {
    enter: 'bounceIn',
    exit: 'fadeOut'
  },
  sound: true,
  vibrate: true
}

App({
  async onLaunch() {
    this.initializationPromise = this._initializeAllSystems()
  },

  // 添加 onUnload 生命周期函数
  onUnload() {
    // 当小程序被销毁时，清理所有资源
    if (achievementManager) {
      achievementManager.destroy()
    }

    if (achievementNotification) {
      achievementNotification.destroy()
    }
  },

  async _initializeAllSystems(maxRetries = 3) {
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // 1. 首先初始化云环境（基础依赖）
        await this._initCloudEnvironment();

        // 2. 其他三个系统可以并行初始化
        await Promise.all([
          this._initUserSystem(),
          this._initAchievementSystem(),
          this._initStorageSystem()  // 现在是并行的
        ]);

        return true;
      } catch (error) {
        retryCount++;
        Logger.warn(`System initialization attempt ${retryCount} failed:`, error);

        if (retryCount === maxRetries) {
          this._handleInitializationError(error);
          return false;
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
  },


  // 新增：等待系统初始化完成的方法
  async waitForSystemReady() {
    try {
      const result = await this.initializationPromise
      if (!result) {
        throw new Error('System initialization failed')
      }
      return true
    } catch (error) {
      Logger.error('waitForSystemReady failed:', error)
      throw error
    }
  },

  _handleInitializationError(error) {
    // 记录失败状态
    const failedSystem = this._getFailedSystem()
    Logger.error(`System initialization failed at: ${failedSystem}`, error)

    // 更新状态
    this.globalData.systemStatus.initializationError = {
      system: failedSystem,
      error: error.message,
      timestamp: Date.now()
    }

    // 显示错误提示
    wx.showToast({
      title: '应用初始化失败，请重试',
      icon: 'none'
    })
  },

  _getFailedSystem() {
    const { systemStatus } = this.globalData
    if (!systemStatus.cloudReady) return 'cloud'
    if (!systemStatus.userReady) return 'user'
    if (!systemStatus.achievementReady) return 'achievement'
    if (!systemStatus.storageReady) return 'storage'
    return 'unknown'
  },

  async _initCloudEnvironment() {
    // 已初始化则直接返回
    if (this.globalData.systemStatus.cloudReady) {
      return;
    }
    try {
      if (!wx.cloud) {
        throw new Error('请使用 2.2.3 或以上的基础库以使用云能力')
      }

      const result = await wx.cloud.init(DUO_CONFIG.cloud)

      this.globalData.systemStatus.cloudReady = true
      Logger.info('Cloud environment initialized')
      return result
    } catch (error) {
      this.globalData.systemStatus.cloudReady = false
      throw error
    }
  },

  async _initUserSystem() {
    // 已初始化则直接返回
    if (this.globalData.systemStatus.userReady) {
      return;
    }
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'duoUser',
        data: {
          type: 'login'
        }
      })
      this.globalData.systemStatus.userReady = true
      Logger.info('User system initialized')
    } catch (error) {
      this.globalData.systemStatus.userReady = false
      throw error
    }
  },

  async _initAchievementSystem() {
    // 已初始化则直接返回
    if (this.globalData.systemStatus.achievementReady) {
      return;
    }

    try {
      await achievementManager.init()
      this.globalData.achievementNotification = achievementNotification

      achievementNotification.updateConfig(ACHIEVEMENT_CONFIG)

      this.globalData.systemStatus.achievementReady = true
      Logger.info('Achievement system initialized')
    } catch (error) {
      this.globalData.systemStatus.achievementReady = false
      throw error
    }
  },

  async _initStorageSystem() {
    // 已初始化则直接返回
    if (this.globalData.systemStatus.storageReady) {
      return;
    }
    try {
      await GameStateService.cleanupExpiredSaves()
      this.globalData.systemStatus.storageReady = true
      Logger.info('Storage system initialized')
    } catch (error) {
      this.globalData.systemStatus.storageReady = false
      throw error
    }
  },

  // 提供系统状态检查方法
  isSystemReady() {
    const { systemStatus } = this.globalData
    return (
      systemStatus.cloudReady &&
      systemStatus.userReady &&
      systemStatus.achievementReady &&
      systemStatus.storageReady
    )
  },

  globalData: {
    openid: null,
    achievementNotification: null,

    // 系统状态标志
    systemStatus: {
      cloudReady: false,
      userReady: false,
      achievementReady: false,
      storageReady: false,
      initializationError: null,
      lastUpdate: Date.now()
    },
    adConfig: {
      enabled: true,         // 广告功能总开关
      minInterval: 300000,   // 最小间隔（5分钟）
      minGames: 3,          // 最小游戏局数
      probability: 0.7      // 显示概率
    }
  }
})
