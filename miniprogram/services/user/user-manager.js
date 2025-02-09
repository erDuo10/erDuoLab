/**
 * @fileoverview 用户管理器
 * @description 处理用户相关的核心业务逻辑
 */

const UserStorage = require('./user-storage')
const UserAuth = require('./user-auth')
const { globalEventManager } = require('../../utils/event/event-manager')
const EventTypes = require('../../utils/event/event-types')
const ErrorCodes = require('../../utils/constants/error-codes')
const Logger = require('../../utils/helpers/logger')

/**
 * 用户管理器类
 * @class UserManager
 */
class UserManager {
  constructor() {
    this.storage = new UserStorage()
    this.auth = new UserAuth()
    this.currentUser = null
    this.isInitialized = false
  }

  /**
   * 初始化用户管理器
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) return

    try {
      // 尝试恢复用户会话
      const sessionData = await this.storage.getSession()
      if (sessionData) {
        this.currentUser = sessionData
        globalEventManager.emit(EventTypes.USER.LOGIN, {});
      }

      this.isInitialized = true
    } catch (error) {
      Logger.error('UserManager init failed:', error)
      throw {
        ...ErrorCodes.USER.INIT_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 用户登录
   * @returns {Promise<Object>} 用户信息
   */
  async login() {
    try {
      // 获取登录凭证
      const code = await this.auth.getLoginCode()

      // 调用 duoUser 云函数进行登录
      const { result } = await wx.cloud.callFunction({
        name: 'duoUser',
        data: {
          type: 'login'
        }
      })

      if (result.code === 0) {
        this.currentUser = result.data
        // 保存会话
        await this.storage.saveSession(this.currentUser)
        globalEventManager.emit(EventTypes.USER.LOGIN, {})

        return this.currentUser
      } else {
        throw new Error(result.msg)
      }
    } catch (error) {
      Logger.error('Login failed:', error)
      throw {
        ...ErrorCodes.USER.LOGIN_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 获取用户信息
   * @returns {Promise<Object>} 用户信息
   */
  // 获取用户信息方法中调用
  async getUserInfo() {
    try {
      if (!this.currentUser) {
        throw ErrorCodes.USER.NOT_LOGGED_IN
      }

      const userInfo = await this.auth.getUserProfile()

      // 调用 duoUser 云函数更新用户信息
      const { result } = await wx.cloud.callFunction({
        name: 'duoUser',
        data: {
          type: 'updateUserData',
          updateType: 'userInfo',
          data: userInfo
        }
      })

      if (result.code === 0) {
        this.currentUser = {
          ...this.currentUser,
          ...userInfo
        }
        await this.storage.saveUserInfo(this.currentUser)
        return this.currentUser
      } else {
        throw new Error(result.msg)
      }
    } catch (error) {
      Logger.error('Get user info failed:', error)
      throw {
        ...ErrorCodes.USER.OPERATION_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 更新用户设置
   * @param {Object} settings - 用户设置
   * @returns {Promise<void>}
   */
  async updateSettings(settings) {
    try {
      if (!this.currentUser) {
        throw ErrorCodes.USER.NOT_LOGGED_IN
      }

      // 保存设置
      await this.storage.saveSettings(settings)
    } catch (error) {
      Logger.error('Update settings failed:', error)
      throw {
        ...ErrorCodes.USER.OPERATION_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 登出
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await this.storage.clearSession()
      this.currentUser = null
      globalEventManager.emit(EventTypes.USER.LOGOUT)
    } catch (error) {
      Logger.error('Logout failed:', error)
      throw {
        ...ErrorCodes.USER.OPERATION_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 检查是否已登录
   * @returns {boolean}
   */
  isLoggedIn() {
    return !!this.currentUser
  }

  /**
   * 获取当前用户
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.currentUser
  }
}

// 创建全局实例
const userManager = new UserManager()

module.exports = {
  UserManager,
  userManager
}
