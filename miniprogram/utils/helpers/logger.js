/**
 * @fileoverview 日志工具
 * @description 提供统一的日志记录功能
 */

/**
 * 日志级别枚举
 * @enum {number}
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

/**
 * 日志工具类
 * @class Logger
 */
class Logger {
  constructor() {
    this.level = LogLevel.INFO
    this.logs = []
    this.maxLogs = 1000
  }

  /**
   * 设置日志级别
   * @param {LogLevel} level - 日志级别
   */
  setLevel(level) {
    this.level = level
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {*} [data] - 附加数据
   */
  debug(message, data) {
    if (this.level <= LogLevel.DEBUG) {
      this._log('DEBUG', message, data)
    }
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {*} [data] - 附加数据
   */
  info(message, data) {
    if (this.level <= LogLevel.INFO) {
      this._log('INFO', message, data)
    }
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {*} [data] - 附加数据
   */
  warn(message, data) {
    if (this.level <= LogLevel.WARN) {
      this._log('WARN', message, data)
    }
  }

  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Error} [error] - 错误对象
   */
  error(message, error) {
    if (this.level <= LogLevel.ERROR) {
      this._log('ERROR', message, error)
    }
  }

  /**
   * 内部日志记录方法
   * @private
   */
  _log(level, message, data) {
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    }

    // 根据日志级别选择合适的控制台方法
    let consoleMethod = 'log'
    switch (level) {
    case 'DEBUG':
      consoleMethod = 'debug'
      break
    case 'INFO':
      consoleMethod = 'info'
      break
    case 'WARN':
      consoleMethod = 'warn'
      break
    case 'ERROR':
      consoleMethod = 'error'
      break
    case 'TEST':
    case 'PERF':
      consoleMethod = 'log'
      break
    default:
      consoleMethod = 'log'
    }

    // 控制台输出
    console[consoleMethod](
      `[${logEntry.timestamp}] [${level}] ${message}`,
      data || ''
    )

    // 存储日志
    this.logs.push(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // TODO: 可以添加日志上报逻辑
  }
  /**
   * 获取日志记录
   * @param {number} [count=10] - 返回的日志条数
   * @returns {Array} 日志记录
   */
  getLogs(count = 10) {
    return this.logs.slice(-count)
  }

  /**
   * 清除日志
   */
  clearLogs() {
    this.logs = []
  }

  /**
 * 测试日志（仅开发环境）
 */
  test(message, data) {
    console.group('Test Log')
    this._log('TEST', message, data)
    console.groupEnd()
  }

  /**
   * 性能日志
   */
  performance(label, data) {
    if (this.level <= LogLevel.DEBUG) {
      console.group('Performance')
      console.time(label)
      this._log('PERF', label, data)
      console.timeEnd(label)
      console.groupEnd()
    }
  }

}

// 创建全局日志实例
const logger = new Logger()

module.exports = logger 
