/**
 * 游戏存储管理模块
 * @module GameStorage
 * @description 处理游戏状态的保存、加载和清理
 */

const ErrorHandler = require('../../services/error-handler')
const GameStateService = require("../../services/game/game-state");
const Logger = require('../../utils/helpers/logger')

// 常量定义
const SAVE_EXPIRATION = 24 * 60 * 60 * 1000 // 存档过期时间(24小时)

const GameStorage = {
    /**
     * 自动保存游戏状态
     * @param {Page} page - 页面实例
     * @param {boolean} forceCloud - 是否强制使用云存储
     */
    async autoSave(page, forceCloud = false) {
        
        try {
            const { gameState } = page.data
            if (!gameState || gameState.status !== 'PLAYING') return
            

            // 始终进行本地存储
            await this.saveProgress(gameState)

            // 如果需要云存储
            if (forceCloud) {
                try {
                    await this.cloudSave(gameState)
                    Logger.info('云存储成功')
                } catch (cloudError) {
                    Logger.error('云存储失败，已保存到本地:', cloudError)
                }
            }
        } catch (error) {
            ErrorHandler.handle(error, 'autoSave')
        }
    },

    /**
 * 定期同步到云存储
 * @param {Object} gameState - 游戏状态
 */
    async syncToCloud(gameState) {
        try {
            if (!gameState || gameState.status !== 'PLAYING') return
            await this.cloudSave(gameState)
            Logger.info('游戏状态已同步到云端')
        } catch (error) {
            Logger.error('云同步失败:', error)
        }
    },

    /**
 * 云存储保存游戏状态
 * @param {Object} gameState - 游戏状态
 * @returns {Promise<boolean>} 保存是否成功
 */
    async cloudSave(gameState) {
        try {
            const saveData = this._prepareSaveData(gameState)
            const result = await wx.cloud.callFunction({
                name: 'duoGameState',
                data: {
                    type: 'saveGameState',
                    gameState: saveData,
                    difficulty: gameState.difficulty
                }
            })

            if (result.result.code === 0) {
                Logger.info('云存储保存成功')
                return true
            }
            throw new Error(result.result.msg)
        } catch (error) {
            Logger.error('云存储保存失败:', error)
            return false
        }
    },

    /**
 * 云存储加载游戏状态
 * @param {string} difficulty - 游戏难度
 * @returns {Promise<Object|null>} 游戏状态
 */
    async cloudLoad(difficulty) {
        try {
            const result = await wx.cloud.callFunction({
                name: 'duoGameState',
                data: {
                    type: 'loadGameState',
                    difficulty
                }
            })

            if (result.result.code === 0 && result.result.data !== null) {
                return result.result.data
            }
            return null
        } catch (error) {
            Logger.error('云存储加载失败:', error)
            return null
        }
    },

    /**
     * 保存游戏进度
     * @param {Object} gameState - 游戏状态
     */
    saveProgress(gameState) {
        try {
            const saveData = this._prepareSaveData(gameState)
            const saveKey = this._getSaveKey(gameState.difficulty)

            wx.setStorageSync(saveKey, saveData)
        } catch (error) {
            ErrorHandler.handle(error, 'saveProgress')
        }
    },

    /**
     * 加载游戏进度
     * @param {string} difficulty - 游戏难度
     * @returns {Object|null} 保存的游戏状态
     */
    async loadProgress(difficulty) {
        try {
            // 优先尝试从云存储加载
            const cloudData = await this.cloudLoad(difficulty)
            if (cloudData) {
                const gameState = cloudData.gameState
                // 确保数据格式一致
                return {
                    ...gameState,
                    timestamp: new Date(cloudData.updatedAt).getTime()
                }
            }

            // 如果云存储加载失败，则尝试从本地存储加载
            const saveKey = this._getSaveKey(difficulty)
            const saveData = wx.getStorageSync(saveKey)

            if (!saveData) {
                return null
            }

            // 检查存档是否过期
            if (this._isExpired(saveData.timestamp)) {
                wx.removeStorageSync(saveKey)
                return null
            }

            // 验证存档数据完整性
            if (!GameStateService.validateSaveData(saveData)) {
                wx.removeStorageSync(saveKey)
                return null
            }

            return saveData
        } catch (error) {
            ErrorHandler.handle(error, 'loadProgress')
            return null
        }
    },

    /**
     * 清除指定难度的进度
     * @param {string} difficulty - 游戏难度
     */
    async clearProgress(difficulty) {
        try {
            const saveKey = this._getSaveKey(difficulty)
            wx.removeStorageSync(saveKey)

            const result = await wx.cloud.callFunction({
                name: 'duoGameState',
                data: {
                    type: 'clearGameState',
                    difficulty
                }
            })
        } catch (error) {
            ErrorHandler.handle(error, 'clearProgress')
        }
    },

    /**
     * 准备保存数据
     * @private
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 处理后的保存数据
     */
    _prepareSaveData(gameState) {
        return {
            ...gameState,
            timestamp: Date.now(),
            styleState: {
                selectedCell: gameState.styleState?.selectedCell || null,
                highlightedCells: gameState.styleState?.highlightedCells || {},
                cellStatus: gameState.styleState?.cellStatus || {},
                hintCells: gameState.styleState?.hintCells || {},
                notes: gameState.styleState?.notes || {}
            }
        }
    },

    /**
     * 获取存储键名
     * @private
     * @param {string} difficulty - 游戏难度
     * @returns {string} 存储键名
     */
    _getSaveKey(difficulty) {
        return `sudoku_save_${difficulty}`
    },

    /**
     * 检查存档是否过期
     * @private
     * @param {number} timestamp - 存档时间戳
     * @returns {boolean} 是否过期
     */
    _isExpired(timestamp) {
        return Date.now() - timestamp > SAVE_EXPIRATION
    },

    /**
     * 验证存档数据完整性
     * @private
     * @param {Object} saveData - 存��数据
     * @returns {boolean} 是否完整有效
     */
    _validateSaveData(saveData) {
        return !!(
            saveData &&
            saveData.puzzle &&
            saveData.solution &&
            saveData.userProgress &&
            saveData.difficulty &&
            saveData.timestamp
        )
    }
}

module.exports = GameStorage
