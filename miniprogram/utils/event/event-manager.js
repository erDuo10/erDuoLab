/**
 * @fileoverview 事件管理器
 * @description 实现发布订阅模式的事件管理，支持优先级
 */

const EventTypes = require('./event-types')
const Logger = require('../helpers/logger')

/**
 * 事件管理器类
 * @class EventManager
 *
 * @example
 * const eventManager = new EventManager()
 * // 高优先级监听器
 * eventManager.on('GAME_START', (data) => console.log(data), 10)
 * // 普通优先级监听器
 * eventManager.on('GAME_START', (data) => console.log(data))
 */
class EventManager {
  constructor() {
    // 存储格式: Map<eventName, Array<{callback, priority}>>
    this.listeners = new Map()
    // 存储格式: Map<eventName, Map<originalCallback, {callback, priority}>>
    this.onceListeners = new Map()

    // 仅保留时间戳记录
    this.lastEventTimestamp = new Map()
    this.minEventInterval = 1000 // 最小事件间隔(ms)
    // 添加调试信息
    this.debugInfo = new Map()
  }

  /**
   * 注册事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @param {number} [priority=0] - 优先级，数值越大优先级越高
   * @returns {Function} 取消监听的函数
   */
  on(eventName, callback, priority = 0) {
    // 添加调试信息
    this._addDebugInfo(eventName, callback)

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, [])
    }

    const listener = { callback, priority }
    const listeners = this.listeners.get(eventName)

    // 检查是否已存在相同的回调
    const existingListener = listeners.find(l => l.callback === callback)
    if (existingListener) {
      console.warn(`Duplicate listener for event: ${eventName}`, {
        stack: new Error().stack
      })
      return () => this.off(eventName, callback)
    }

    listeners.push(listener)
    // 按优先级降序排序
    listeners.sort((a, b) => b.priority - a.priority)

    return () => this.off(eventName, callback)
  }

  /**
   * 注册一次性事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @param {number} [priority=0] - 优先级
   * @returns {Function} 取消监听的函数
   */
  once(eventName, callback, priority = 0) {
    const onceWrapper = (...args) => {
      this.off(eventName, callback)
      callback.apply(this, args)
    }

    if (!this.onceListeners.has(eventName)) {
      this.onceListeners.set(eventName, new Map())
    }

    const listener = { callback: onceWrapper, priority }
    this.onceListeners.get(eventName).set(callback, listener)

    return this.on(eventName, onceWrapper, priority)
  }

  /**
   * 取消事件监听
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(eventName, callback) {
    // 移除普通监听器
    if (this.listeners.has(eventName)) {
      const listeners = this.listeners.get(eventName)
      this.listeners.set(
        eventName,
        listeners.filter(listener => listener.callback !== callback)
      )
    }

    // 移除一次性监听器
    if (this.onceListeners.has(eventName)) {
      const onceListener = this.onceListeners.get(eventName).get(callback)
      if (onceListener) {
        const listeners = this.listeners.get(eventName)
        this.listeners.set(
          eventName,
          listeners.filter(listener => listener.callback !== onceListener.callback)
        )
        this.onceListeners.get(eventName).delete(callback)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} eventName - 事件名称
   * @param {*} data - 事件数据
   */
  emit(eventName, data) {
    Logger.debug('Emitting event:', eventName, {
      listenerCount: this.listeners.get(eventName)?.length || 0,
      debugInfo: this._getDebugInfo(eventName)
    })

    try {
      // 检查事件触发间隔
      const now = Date.now()
      const lastTime = this.lastEventTimestamp.get(eventName) || 0
      const timeDiff = now - lastTime

      if (timeDiff < this.minEventInterval) {
        Logger.warn(`Event ${eventName} triggered too frequently. Ignored. Time diff: ${timeDiff}ms`)
        return
      }

      const listeners = this.listeners.get(eventName)
      Logger.debug('Found listeners:', listeners?.length || 0)

      if (listeners?.length) {
        // 更新最后触发时间
        this.lastEventTimestamp.set(eventName, now)

        // 按优先级顺序触发监听器
        listeners.forEach(({ callback }) => {
          try {
            callback(data)
          } catch (error) {
            Logger.error(`Event listener error for ${eventName}:`, error)
          }
        })
      }
    } catch (error) {
      Logger.error(`Event emit error for ${eventName}:`, error)
    }
  }

  /**
 * 设置最小事件间隔
 * @param {number} interval - 间隔时间(ms)
 */
  setMinEventInterval(interval) {
    if (typeof interval === 'number' && interval >= 0) {
      this.minEventInterval = interval
    }
  }

  /**
   * 清除所有监听器
   */
  clear() {
    this.listeners.clear()
    this.onceListeners.clear()
    this.lastEventTimestamp.clear()
  }

  /**
   * 获取事件监听器数量
   * @param {string} eventName - 事件名称
   * @returns {number} 监听器数量
   */
  listenerCount(eventName) {
    return this.listeners.get(eventName)?.length || 0
  }

  /**
   * 获取指定事件的所有监听器
   * @param {string} eventName - 事件名称
   * @returns {Array<{callback: Function, priority: number}>} 监听器列表
   */
  getListeners(eventName) {
    return this.listeners.get(eventName) || []
  }

  // 添加调试方法
  _addDebugInfo(eventName, callback) {
    if (!this.debugInfo.has(eventName)) {
      this.debugInfo.set(eventName, new Map())
    }
    this.debugInfo.get(eventName).set(callback, {
      registeredAt: new Date(),
      stack: new Error().stack
    })
  }

  _getDebugInfo(eventName) {
    return Array.from(this.debugInfo.get(eventName)?.entries() || [])
      .map(([callback, info]) => ({
        registeredAt: info.registeredAt,
        stack: info.stack
      }))
  }

  // 添加获取监听器信息的方法
  getListenerInfo(eventName) {
    return {
      listenerCount: this.listeners.get(eventName)?.length || 0,
      debugInfo: this._getDebugInfo(eventName)
    }
  }

}

// 创建全局事件管理器实例
const globalEventManager = new EventManager()

module.exports = {
  EventManager,
  globalEventManager
}