/**
 * 错误处理服务
 */
const ErrorHandler = {
  /**
   * 错误类型枚举
   */
  ErrorTypes: {
    NETWORK: 'NETWORK_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    GAME: 'GAME_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
  },

  /**
   * 处理错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误发生的上下文
   */
  handle(error, context = '') {
    console.error(`Error in ${context}:`, error)
    
    const message = this._getErrorMessage(error)
    this._showErrorToast(message)
    
    // 可以在这里添加错误上报逻辑
  },

  /**
   * 获取用户友好的错误消息
   * @private
   * @param {Error} error 
   * @returns {string}
   */
  _getErrorMessage(error) {
    const messageMap = {
      [this.ErrorTypes.NETWORK]: '网络连接失败，请检查网络后重试',
      [this.ErrorTypes.VALIDATION]: '输入数据无效',
      [this.ErrorTypes.GAME]: '游戏出现错误，请重新开始',
      [this.ErrorTypes.UNKNOWN]: '发生未知错误，请重试'
    }
    
    return messageMap[error.type] || messageMap[this.ErrorTypes.UNKNOWN]
  },

  /**
   * 显示错误提示
   * @private
   * @param {string} message 
   */
  _showErrorToast(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })
  },

  /**
   * 创建错误对象
   * @param {string} type - 错误类型
   * @param {string} message - 错误消息
   * @returns {Error}
   */
  createError(type, message) {
    const error = new Error(message)
    error.type = type
    return error
  }
}

module.exports = ErrorHandler 