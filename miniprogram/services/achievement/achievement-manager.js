/**
 * @fileoverview 成就管理器
 * @description 处理成就系统的核心业务逻辑
 */

const { globalEventManager } = require('../../utils/event/event-manager')
const EventTypes = require('../../utils/event/event-types')
const Logger = require('../../utils/helpers/logger')
const DUO_CONFIG = require('../../duo')


/**
 * 成就管理器类
 * @class AchievementManager
 */
class AchievementManager {
  constructor() {
    this.initialized = false
    this.achievements = new Map()
    this.userAchievements = new Map()
    this.categories = new Map()
    this._eventUnsubscribers = []  // 存储取消订阅函数

    // 监听游戏相关事件
    this._initEventListeners()
  }

  /**
     * 初始化成就系统
     * @returns {Promise<void>}
     */
  async init() {
    try {
      if (this.initialized) return
      // 从云端获取成就配置和用户成就数据
      const [configResult, achievementsResult] = await Promise.all([
        wx.cloud.callFunction({
          name: 'duoAchievement',
          data: { type: 'getAchievementConfigs' }
        }),
        wx.cloud.callFunction({
          name: 'duoAchievement',
          data: { type: 'getAchievements' }
        })
      ])

      if (configResult.result.code === 0 && achievementsResult.result.code === 0) {
        this.achievements = new Map(configResult.result.data.map(config => [config.id, config]))
        this.userAchievements = new Map(achievementsResult.result.data.map(achievement => [
          achievement.achievementId,
          achievement
        ]))


        this.initialized = true

        this.categories = this._initCategories()
      }
    } catch (error) {
      Logger.error('Initialize achievements failed:', error)
      throw error
    }
  }

  /**
   * 初始化成就类别
   * @private
   * @returns {Promise<Map<string, Object>>} 成就类别映射
   */
  async _initCategories() {
    try {
      // 调用云函数获取类别数据
      const { result } = await wx.cloud.callFunction({
        name: 'duoAchievement',
        data: { type: 'getCategories' }
      })

      if (result.code !== 0) {
        Logger.error('获取成就类别失败，使用默认配置')
        return this._getDefaultCategories()
      }

      // 转换为Map格式返回
      return new Map(result.data.map(category => [category.id, category]))
    } catch (error) {
      Logger.error('初始化成就类别失败:', error)
      return this._getDefaultCategories()
    }
  }

  /**
   * 获取默认类别配置（作为降级方案）
   * @private
   * @returns {Map<string, Object>}
   */
  _getDefaultCategories() {
    return new Map([
      ['basic_progress', {
        _id: "basic_progress",
        id: "basic_progress",
        name: "基础进度",
        description: "基础游戏进度相关的成就",
        icon: "${DUO_CONFIG.cloudStorage.baseUrl}${DUO_CONFIG.cloudStorage.paths.sudoku.icons.categories}/basic-progress.png",
        order: 100,
        isActive: true,
        version: "1.0.0"
      }],
      ['difficulty', {
        _id: "difficulty",
        id: "difficulty",
        name: "难度突破",
        description: "完成不同难度的游戏",
        icon: "${DUO_CONFIG.cloudStorage.baseUrl}${DUO_CONFIG.cloudStorage.paths.sudoku.icons.categories}/difficulty.png",
        order: 200,
        isActive: true,
        version: "1.0.0"
      }],
      ['perfect', {
        _id: "perfect",
        id: "perfect",
        name: "完美通关",
        description: "完美完成游戏的成就",
        icon: "${DUO_CONFIG.cloudStorage.baseUrl}${DUO_CONFIG.cloudStorage.paths.sudoku.icons.categories}/perfect.png",
        order: 300,
        isActive: true,
        version: "1.0.0"
      }],
      ['speed', {
        _id: "speed",
        id: "speed",
        name: "速度挑战",
        description: "快速完成游戏的成就",
        icon: "${DUO_CONFIG.cloudStorage.baseUrl}${DUO_CONFIG.cloudStorage.paths.sudoku.icons.categories}/speed.png",
        order: 400,
        isActive: true,
        version: "1.0.0"
      }],
      ['streak', {
        _id: "streak",
        id: "streak",
        name: "连续成就",
        description: "与连续完成游戏相关的成就",
        icon: "${DUO_CONFIG.cloudStorage.baseUrl}${DUO_CONFIG.cloudStorage.paths.sudoku.icons.categories}/streak.png",
        order: 500,
        isActive: true,
        version: "1.0.0"
      }]
    ])
  }


  /**
     * 获取所有成就类别
     * @returns {Array<Object>} 成就类别列表
     */
  getCategories() {
    try {
      // 转换为数组并按 order 排序
      return Array.from(this.categories.values())
        .sort((a, b) => a.order - b.order)
        .map(category => ({
          ...category,
          achievements: this.getAchievementsByCategory(category.id)
        }))
    } catch (error) {
      console.error('获取成就类别失败:', error)
      return []
    }
  }

  /**
     * 获取指定类别的成就列表
     * @param {string} categoryId - 类别ID
     * @returns {Array<Object>} 成就列表
     */
  getAchievementsByCategory(categoryId) {
    try {
      return Array.from(this.achievements.values())
        .filter(achievement => achievement.category === categoryId)
        .map(achievement => ({
          ...achievement,
          unlocked: this.isUnlocked(achievement.id),
          progress: this.getProgress(achievement.id)
        }))
        .sort((a, b) => {
          // 已解锁的排在前面
          if (a.unlocked !== b.unlocked) {
            return b.unlocked ? 1 : -1
          }
          // 按进度排序
          return b.progress - a.progress
        })
    } catch (error) {
      console.error('获取类别成就失败:', error)
      return []
    }
  }

  /**
     * 获取成就解锁状态
     * @param {string} achievementId - 成就ID
     * @returns {boolean} 是否解锁
     */
  isUnlocked(achievementId) {
    const achievement = this.userAchievements.get(achievementId)
    return achievement?.unlocked || false
  }

  /**
     * 获取成就进度
     * @param {string} achievementId - 成就ID
     * @returns {number} 进度值（0-100）
     */
  getProgress(achievementId) {
    const achievement = this.userAchievements.get(achievementId)
    return achievement?.progress || 0
  }

  /**
   * 检查成就完成情况
   * @param {Object} data 游戏数据
   */
  async checkAchievements(data) {

    try {
      // 1. 调用云函数检查成就
      const { result } = await wx.cloud.callFunction({
        name: 'duoAchievement',
        data: {
          type: 'checkAchievements',
          data: data
        }
      })

      if (result.code !== 0) {
        throw new Error(result.msg)
      }

      const { completedAchievements, newlyUnlockedAchievements, progressUpdates } = result.data

      // 处理进度更新
      if (progressUpdates.length > 0) {
        this._handleProgressUpdates(progressUpdates)
      }

      // 处理已完成的成就
      if (completedAchievements.length > 0) {
        this._handleCompletedAchievements(completedAchievements)
      }
      return {
        completed: completedAchievements,
        newlyUnlocked: newlyUnlockedAchievements,
        progress: progressUpdates
      }

    } catch (error) {
      Logger.error('Check achievements failed:', error)
      throw error
    }
  }

  /**
 * 处理进度更新
 * @private
 * @param {Array<Object>} progressUpdates 进度更新数据
 */
  _handleProgressUpdates(progressUpdates) {
    // 更新数据
    for (const progressData of progressUpdates) {
      const { achievementId, progress } = progressData
      this.userAchievements.set(achievementId, {
        ...this.userAchievements.get(achievementId),
        progress,
        updateTime: new Date()
      })
    }

    // 触发事件
    globalEventManager.emit(EventTypes.ACHIEVEMENT.BATCH_PROGRESS, {
      progressUpdates,
      timestamp: new Date()
    })
  }

  /**
 * 处理成就完成
 * @private
 * @param {Array<Object>} completedAchievements 完成的成就
 */
  _handleCompletedAchievements(completedAchievements) {
    // 更新数据
    this._updateAchievementUnlockStatus(completedAchievements)
  }

  // 统一的更新逻辑
  _updateAchievementUnlockStatus(achievements, timestamp = new Date()) {
    for (const achievement of achievements) {
      this.userAchievements.set(achievement.achievementId, {
        ...achievement,
        unlocked: true,
        unlockTime: timestamp
      })
    }
  }

  /**
 * 获取分类统计
 */
  async getCategoryStats() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'duoAchievement',
        data: {
          type: 'getCategoryStats'
        }
      })

      return result.code === 0 ? result.data : []
    } catch (error) {
      Logger.error('Get category stats failed:', error)
      throw error
    }
  }

  /**
 * 获取最近解锁的成就
 */
  async getRecentUnlocks(limit = 5) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'duoAchievement',
        data: {
          type: 'getRecentUnlocks',
          data: { limit }
        }
      })

      return result.code === 0 ? result.data : []
    } catch (error) {
      Logger.error('Get recent unlocks failed:', error)
      throw error
    }
  }

  /**
   * 触发UI更新事件
   * @private
   */
  async _emitUIUpdate() {
    globalEventManager.emit(EventTypes.UI.UPDATE, {
      type: 'achievement',
    }
    )
  }

  /**
     * 获取所有成就
     * @returns {Array<Object>} 成就列表
     */
  getAllAchievements() {
    return Array.from(this.achievements.values())
  }

  /**
     * 获取用户成就
     * @returns {Array<Object>} 用户成就列表
     */
  getUserAchievements() {
    return Array.from(this.userAchievements.values())
  }

  /**
     * 初始化事件监听
     * @private
     */
  _initEventListeners() {
    try {
      // 添加批量解锁事件监听
      this._eventUnsubscribers.push(
        globalEventManager.on(EventTypes.ACHIEVEMENT.BATCH_UNLOCK, async (data) => {
          try {
            await this._emitUIUpdate()

          } catch (error) {
            Logger.error('Batch achievement unlock handling failed:', error)
          }
        })
      )


      // 成就进度事件 - 批量处理
      this._eventUnsubscribers.push(
        globalEventManager.on(EventTypes.ACHIEVEMENT.BATCH_PROGRESS, async (data) => {
          try {
            // 更新内存数据
            for (const progressData of data.progressUpdates) {
              const { achievementId, progress } = progressData
              this.userAchievements.set(achievementId, {
                ...this.userAchievements.get(achievementId),
                progress,
                updateTime: new Date()
              })
            }

            // 触发 UI 更新
            await this._emitUIUpdate()
          } catch (error) {
            Logger.error('Batch achievement progress handling failed:', error)
          }
        })
      )

    } catch (error) {
      Logger.error('Failed to initialize event listeners:', error)
    }
  }

  // 添加销毁方法
  destroy() {
    // 执行所有取消订阅函数
    this._eventUnsubscribers.forEach(unsubscribe => unsubscribe())
    this._eventUnsubscribers = []
  }

  /**
     * 获取成就统计信息
     * @returns {Object} 统计信息
     */
  async getAchievementStats() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'duoAchievement',
        data: {
          type: 'getAchievementStats'
        }
      })

      return result.code === 0 ? result.data : null
    } catch (error) {
      Logger.error('Get achievement stats failed:', error)
      throw error
    }
  }

  /**
     * 获取成就建议
     * @returns {Array} 建议列表
     */
  getAchievementSuggestions() {
    const suggestions = []
    for (const [id, achievement] of this.achievements) {
      const userAchievement = this.userAchievements.get(id)
      if (!userAchievement?.unlocked) {
        suggestions.push({
          achievement,
          progress: userAchievement?.progress || 0
        })
      }
    }
    return suggestions.sort((a, b) => b.progress - a.progress)
  }
}

// 创建全局实例
const achievementManager = new AchievementManager()

module.exports = {
  AchievementManager,
  achievementManager
}