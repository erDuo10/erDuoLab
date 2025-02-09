/**
 * @fileoverview 本地存储工具
 * @description 封装微信小程序本地存储API
 */

const AppConfig = require('../../config/app-config')
const ErrorCodes = require('../constants/error-codes')
const Logger = require('../helpers/logger')

/**
 * 本地存储工具类
 * @class LocalStorage
 */
class LocalStorage {
  /**
   * 保存数据
   * @param {string} key - 存储键名
   * @param {any} data - 存储数据
   * @param {Object} [options] - 存储选项
   * @param {number} [options.expireTime] - 过期时间(ms)
   * @returns {Promise<void>}
   */
  static async save(key, data, options = {}) {
    try {
      const saveData = {
        data,
        timestamp: Date.now(),
        expireTime: options.expireTime || AppConfig.storage.cache.maxAge,
        version: AppConfig.version // 添加版本信息
      }
      await wx.setStorage({
        key,
        data: JSON.stringify(saveData) // 统一使用 JSON 字符串存储
      })
    } catch (error) {
      Logger.error('LocalStorage save failed:', error)
      throw {
        ...ErrorCodes.STORAGE.SAVE_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 读取数据
   * @param {string} key - 存储键名
   * @param {Object} [options] - 读取选项
   * @param {any} [options.defaultValue] - 默认值
   * @param {boolean} [options.ignoreExpiration] - 是否忽略过期检查
   * @returns {Promise<any>}
   */
  static async load(key, options = {}) {
    try {
      const { data: storageData } = await wx.getStorage({ key })
      
      // 处理非 JSON 格式的历史数据
      let parsedData;
      try {
        parsedData = JSON.parse(storageData)
      } catch {
        return storageData // 返回原始数据
      }

      const { data, timestamp, expireTime, version } = parsedData

      // 版本检查
      if (version && version !== AppConfig.version) {
        await this.remove(key)
        return options.defaultValue ?? null
      }

      // 过期检查
      if (!options.ignoreExpiration && Date.now() - timestamp > expireTime) {
        await this.remove(key)
        return options.defaultValue ?? null
      }

      return data
    } catch (error) {
      // 处理数据不存在的情况
      if (error.errMsg?.includes('data not found') || 
          error.errMsg?.includes('not exist')) {
        return options.defaultValue ?? null
      }

      Logger.error('LocalStorage load failed:', error)
      throw {
        ...ErrorCodes.STORAGE.LOAD_FAILED,
        originalError: error
      }
    }
  }

    /**
   * 检查数据是否存在
   * @param {string} key - 存储键名
   * @returns {Promise<boolean>}
   */
    static async exists(key) {
      try {
        const { keys } = await wx.getStorageInfo()
        return keys.includes(key)
      } catch (error) {
        Logger.error('LocalStorage check exists failed:', error)
        return false
      }
    }
  
    /**
     * 安全获取数据
     * @param {string} key - 存储键名
     * @param {any} defaultValue - 默认值
     * @returns {Promise<any>}
     */
    static async safeLoad(key, defaultValue = null) {
      try {
        const data = await this.load(key, { defaultValue })
        return data
      } catch {
        return defaultValue
      }
    }

  /**
   * 移除数据
   * @param {string} key - 存储键名
   * @returns {Promise<void>}
   * @throws {Error} 移除失败时抛出异常
   */
  static async remove(key) {
    try {
      await wx.removeStorage({ key })
    } catch (error) {
      Logger.error('LocalStorage remove failed:', error)
      throw {
        ...ErrorCodes.STORAGE.OPERATION_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 清除所有数据
   * @returns {Promise<void>}
   * @throws {Error} 清除失败时抛出异常
   */
  static async clear() {
    try {
      await wx.clearStorage()
    } catch (error) {
      Logger.error('LocalStorage clear failed:', error)
      throw {
        ...ErrorCodes.STORAGE.OPERATION_FAILED,
        originalError: error
      }
    }
  }

  /**
   * 获取存储信息
   * @returns {Promise<WechatMiniprogram.GetStorageInfoSuccessCallbackOption>}
   */
  static async info() {
    try {
      return await wx.getStorageInfo()
    } catch (error) {
      Logger.error('LocalStorage getInfo failed:', error)
      throw {
        ...ErrorCodes.STORAGE.OPERATION_FAILED,
        originalError: error
      }
    }
  }
  /**
   * 批量保存数据
   * @param {Array<{key: string, data: any}>} items 
   * @returns {Promise<Array<{key: string, success: boolean, error?: Error}>>}
   */
  static async batchSave(items) {
    const results = [];
    for (const item of items) {
      try {
        await this.save(item.key, item.data);
        results.push({ key: item.key, success: true });
      } catch (error) {
        Logger.error(`BatchSave failed for key: ${item.key}`, error);
        results.push({
          key: item.key,
          success: false,
          error: {
            ...ErrorCodes.STORAGE.SAVE_FAILED,
            originalError: error
          }
        });
      }
    }
    return results;
  }

  /**
 * 批量读取数据
 * @param {Array<string>} keys 
 * @returns {Promise<Array<{key: string, data: any, success: boolean}>>}
 */
  static async batchLoad(keys) {
    const results = [];
    for (const key of keys) {
      try {
        const data = await this.load(key);
        results.push({ key, data, success: true });
      } catch (error) {
        Logger.error(`BatchLoad failed for key: ${key}`, error);
        results.push({ key, data: null, success: false });
      }
    }
    return results;
  }

  /**
   * 存储空间管理
   * @param {number} maxSize 最大存储空间(KB)
   */
  static async manageStorage(maxSize) {
    try {
      const info = await this.info();
      if (info.currentSize > maxSize) {
        const keys = info.keys;
        // 按时间戳排序，删除最旧的数据
        const items = await this.batchLoad(keys);
        items.sort((a, b) => a.data?.timestamp - b.data?.timestamp);

        while (info.currentSize > maxSize && items.length > 0) {
          const item = items.shift();
          await this.remove(item.key);
        }
      }
    } catch (error) {
      Logger.error('Storage management failed:', error);
      throw {
        ...ErrorCodes.STORAGE.OPERATION_FAILED,
        originalError: error
      }
    }
  }
}

module.exports = LocalStorage 