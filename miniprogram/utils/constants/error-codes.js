/**
 * @fileoverview 错误码定义
 * @description 定义系统所有错误码
 */

/**
 * 错误码常量
 * @namespace ErrorCodes
 */
const ErrorCodes = {
  /** 通用错误 (1000-1999) */
  COMMON: {
    /** 未知错误 */
    UNKNOWN: { code: 1000, message: '未知错误' },
    /** 参数错误 */
    INVALID_PARAMS: { code: 1001, message: '参数错误' },
    /** 操作失败 */
    OPERATION_FAILED: { code: 1002, message: '操作失败' }
  },

  /** 用户相关错误 (2000-2999) */
  USER: {
    /** 未登录 */
    NOT_LOGGED_IN: { code: 2000, message: '用户未登录' },
    /** 登录失败 */
    LOGIN_FAILED: { code: 2001, message: '登录失败' },
    /** 未授权 */
    UNAUTHORIZED: { code: 2002, message: '用户未授权' }
  },

  /** 游戏相关错误 (3000-3999) */
  GAME: {
    /** 游戏未开始 */
    NOT_STARTED: { code: 3000, message: '游戏未开始' },
    /** 无效移动 */
    INVALID_MOVE: { code: 3001, message: '无效的移动' },
    /** 游戏已结束 */
    GAME_OVER: { code: 3002, message: '游戏已结束' }
  },

  /** 存储相关错误 (4000-4999) */
  STORAGE: {
    /** 存储失败 */
    SAVE_FAILED: { code: 4000, message: '存储失败' },
    /** 读取失败 */
    LOAD_FAILED: { code: 4001, message: '读取失败' },
    /** 同步失败 */
    SYNC_FAILED: { code: 4002, message: '同步失败' }
  },

  /** 网络相关错误 (5000-5999) */
  NETWORK: {
    /** 网络错误 */
    NETWORK_ERROR: { code: 5000, message: '网络错误' },
    /** 请求超时 */
    TIMEOUT: { code: 5001, message: '请求超时' },
    /** 服务器错误 */
    SERVER_ERROR: { code: 5002, message: '服务器错误' }
  },
  // 添加错误处理建议
  getErrorHandler(code) {
    const errorInfo = this.findErrorByCode(code);
    return {
      ...errorInfo,
      suggestion: this.getErrorSuggestion(code),
      retry: this.isRetryable(code)
    };
  },

  // 添加错误分类方法
  isNetworkError(code) {
    return code >= 5000 && code < 6000;
  },

  // 添加错误恢复建议
  getErrorSuggestion(code) {
    // 实现错误建议逻辑
  }
}

module.exports = ErrorCodes 