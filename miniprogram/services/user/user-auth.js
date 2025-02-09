/**
 * @fileoverview 用户认证
 * @description 处理用户登录和授权相关功能
 */

const ErrorCodes = require('../../utils/constants/error-codes')
const Logger = require('../../utils/helpers/logger')

/**
 * 用户认证类
 * @class UserAuth
 */
class UserAuth {
  /**
   * 获取登录凭证
   * @returns {Promise<string>} 登录凭证
   */
  async getLoginCode() {
    try {
      const { code } = await wx.login()
      return code
    } catch (error) {
      Logger.error('Get login code failed:', error)
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
  async getUserProfile() {
    try {
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })
      return userInfo
    } catch (error) {
      Logger.error('Get user profile failed:', error)
      throw {
        ...ErrorCodes.USER.UNAUTHORIZED,
        originalError: error
      }
    }
  }

  /**
   * 检查用户授权状态
   * @param {string} scope - 授权域
   * @returns {Promise<boolean>}
   */
  async checkAuthSetting(scope) {
    try {
      const { authSetting } = await wx.getSetting()
      return !!authSetting[scope]
    } catch (error) {
      Logger.error('Check auth setting failed:', error)
      throw {
        ...ErrorCodes.USER.OPERATION_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 获取用户授权
   * @param {string} scope - 授权域
   * @returns {Promise<boolean>}
   */
  async authorize(scope) {
    try {
      await wx.authorize({ scope })
      return true
    } catch (error) {
      Logger.error('Authorize failed:', error)
      throw {
        ...ErrorCodes.USER.UNAUTHORIZED,
        originalError: error
      }
    }
  }
}

module.exports = UserAuth 