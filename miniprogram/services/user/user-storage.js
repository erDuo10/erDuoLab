/**
 * @fileoverview 用户数据存储
 * @description 处理用户数据的本地存储和云同步
 */

const LocalStorage = require('../../utils/storage/local-storage')
const AppConfig = require('../../config/app-config')
const ErrorCodes = require('../../utils/constants/error-codes')
const Logger = require('../../utils/helpers/logger')

/**
 * 用户数据存储类
 * @class UserStorage
 */
class UserStorage {
  constructor() {
    this.keys = AppConfig.storage.keys
  }

  /**
   * 保存会话数据
   * @param {Object} sessionData - 会话数据
   * @returns {Promise<void>}
   */
  async saveSession(sessionData) {
    try {
      await LocalStorage.save(this.keys.USER_DATA, sessionData)
    } catch (error) {
      Logger.error('Save session failed:', error)
      throw {
        ...ErrorCodes.STORAGE.SAVE_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 获取会话数据
   * @returns {Promise<Object|null>}
   */
  async getSession() {
    try {
      return await LocalStorage.load(this.keys.USER_DATA)
    } catch (error) {
      Logger.error('Get session failed:', error)
      throw {
        ...ErrorCodes.STORAGE.LOAD_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 清除会话数据
   * @returns {Promise<void>}
   */
  async clearSession() {
    try {
      await LocalStorage.remove(this.keys.USER_DATA)
    } catch (error) {
      Logger.error('Clear session failed:', error)
      throw {
        ...ErrorCodes.STORAGE.OPERATION_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 保存用户信息
   * @param {Object} userInfo - 用户信息
   * @returns {Promise<void>}
   */
  async saveUserInfo(userInfo) {
    try {
      // 本地存储
      await LocalStorage.save(this.keys.USER_DATA, userInfo)

      // 调用 duoUser 云函数同步到云端
      await wx.cloud.callFunction({
        name: 'duoUser',
        data: {
          type: 'updateUserData',
          updateType: 'userInfo',
          data: userInfo
        }
      })
    } catch (error) {
      Logger.error('Save user info failed:', error)
      throw {
        ...ErrorCodes.STORAGE.SAVE_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 保存用户设置
   * @param {Object} settings - 用户设置
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    try {
      // 本地存储
      await LocalStorage.save(this.keys.SETTINGS, settings)

      // 调用 duoUser 云函数同步到云端
      await wx.cloud.callFunction({
        name: 'duoUser',
        data: {
          type: 'updateUserData',
          updateType: 'settings',
          data: settings
        }
      })
    } catch (error) {
      Logger.error('Save settings failed:', error)
      throw {
        ...ErrorCodes.STORAGE.SAVE_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 获取用户设置
   * @returns {Promise<Object>}
   */
  async getSettings() {
    try {
      // 先尝试从本地获取
      const localSettings = await LocalStorage.load(this.keys.SETTINGS)
      if (localSettings) return localSettings

      // 如果本地没有，从云端获取
      const { result } = await wx.cloud.callFunction({
        name: 'duoUser',
        data: {
          type: 'getUserData',
          fields: ['settings']
        }
      })

      if (result.code === 0 && result.data?.settings) {
        // 保存到本地
        await LocalStorage.save(this.keys.SETTINGS, result.data.settings)
        return result.data.settings
      }

      return {}
    } catch (error) {
      Logger.error('Get settings failed:', error)
      throw {
        ...ErrorCodes.STORAGE.LOAD_FAILED,
        originalError: error
      }
    }
  }
}

module.exports = UserStorage 