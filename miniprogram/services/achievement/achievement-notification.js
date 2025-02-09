/**
 * @fileoverview 成就通知管理器
 * @description 处理成就相关的通知展示，支持批量成就同时显示
 */

const { globalEventManager } = require('../../utils/event/event-manager')
const EventTypes = require('../../utils/event/event-types')
const Logger = require('../../utils/helpers/logger')

class AchievementNotification {
  constructor() {
    // 通知状态
    this.activeNotification = null
    this.pageInstance = null

    // 默认配置
    this.config = {
      displayDuration: 10000, // 显示时长
      animations: {
        enter: 'slideIn',
        exit: 'slideOut'
      },
      vibrate: true, // 是否震动
      useNativeToast: false // 是否使用原生toast作为降级方案
    }

    this._eventUnsubscribers = []  // 存储取消订阅函数
    this._initEventListeners()
  }

  /**
   * 显示批量成就解锁通知
   * @param {Array} achievements 成就数组
   * @param {Object} options 通知选项
   */
  async showBatchUnlockNotification(achievements, options = {}) {
    try {
      // 震动反馈
      if (this.config.vibrate) {
        await this._vibrateDevice()
      }

      // 确保 achievements 是数组
      const achievementsArray = Array.isArray(achievements) ? achievements : [achievements]

      // 创建批量通知数据
      const notificationData = {
        type: 'batch_unlock',
        title: '成就解锁',
        achievements: achievementsArray,
        timestamp: Date.now(),
        ...options
      }

      await this._showNotification(notificationData)


    } catch (error) {
      Logger.error('Show batch unlock notification failed:', error)
    }
  }

  /**
   * 显示通知
   * @private
   * @param {Object} notification 通知数据
   */
  async _showNotification(notification) {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]

    // 检查页面实例是否有效
    if (!currentPage || !currentPage.setData) {
      Logger.warn('No valid page instance found for notification')
      return
    }

    this.pageInstance = currentPage
    this.activeNotification = notification

    try {
      // 尝试使用组件显示通知
      await this._showComponentNotification(notification)
    } catch (error) {
      Logger.error('Component notification failed:', error)
      // 降级到原生Toast
      await this._showFallbackNotification(notification)
    } finally {
      this.activeNotification = null
    }
  }

  /**
   * 使用自定义组件显示通知
   * @private
   * @param {Object} notification 通知数据
   */
  async _showComponentNotification(notification) {
    if (!this.pageInstance) {
      throw new Error('No valid page instance');
    }

    return new Promise((resolve, reject) => {
      try {
        wx.nextTick(() => {
          // 显示通知
          this.pageInstance.setData({
            'achievementNotification.show': true,
            'achievementNotification.data': notification
          }, () => {
            // 设置自动隐藏
            setTimeout(() => {
              this._hideNotification().then(resolve).catch(reject);
            }, this.config.displayDuration);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // 添加隐藏通知的方法
  async _hideNotification() {
    if (this.pageInstance && this.pageInstance.setData) {
      return new Promise((resolve) => {
        this.pageInstance.setData({
          'achievementNotification.show': false,
          'achievementNotification.data': null
        }, resolve);
      });
    }
  }

  /**
   * 显示降级通知（使用原生toast）
   * @private
   * @param {Object} notification 通知数据
   */
  async _showFallbackNotification(notification) {
    const { achievements } = notification

    // 构建通知内容
    const content = `解锁${achievements.length}个成就！`

    await wx.showToast({
      title: content,
      icon: 'none',
      duration: this.config.displayDuration,
      mask: true
    })
  }

  /**
   * 设备震动
   * @private
   */
  async _vibrateDevice() {
    try {
      // 使用较短的震动
      await wx.vibrateShort({
        type: 'light'
      });
    } catch (error) {
      Logger.error('Vibrate device failed:', error);
    }
  }

  /**
   * 初始化事件监听
   * @private
   */
  _initEventListeners() {
    // 监听批量成就解锁事件
    this._eventUnsubscribers.push(
      globalEventManager.on(EventTypes.ACHIEVEMENT.BATCH_UNLOCK, async ({ achievements }) => {

        await this.showBatchUnlockNotification(achievements)
      })
    )
  }

  /**
   * 清理通知状态
   */
  clearNotification() {
    this.activeNotification = null
    this.pageInstance = null
  }

  destroy() {
    // 执行所有取消订阅函数
    this._eventUnsubscribers.forEach(unsubscribe => unsubscribe())
    this._eventUnsubscribers = []

    // 清理其他状态
    this.activeNotification = null
    this.pageInstance = null
  }

  /**
   * 更新配置
   * @param {Object} newConfig 新配置
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    }
  }

  /**
   * 获取当前活动通知
   * @returns {Object|null} 当前活动通知
   */
  getActiveNotification() {
    return this.activeNotification
  }

  /**
   * 检查页面实例是否有效
   * @returns {boolean} 是否有效
   */
  isPageInstanceValid() {
    return !!(this.pageInstance && this.pageInstance.setData)
  }
}

// 创建全局实例
const achievementNotification = new AchievementNotification()

module.exports = {
  AchievementNotification,
  achievementNotification
}