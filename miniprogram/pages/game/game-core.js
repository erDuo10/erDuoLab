/**
 * 游戏核心逻辑模块
 * @module GameCore
 * @description 处理游戏的核心状态和逻辑
 */

const GameService = require('../../services/game/game')
const GameStateService = require('../../services/game/game-state')
const ErrorHandler = require('../../services/error-handler')
const GameUI = require('./game-ui')
const GameStyle = require('./game-style')
const GameStorage = require('./game-storage')
const HistoryManager = require('../../services/game/history-manager')

const { globalEventManager } = require('../../utils/event/event-manager')
const EventTypes = require('../../utils/event/event-types')
const Logger = require('../../utils/helpers/logger')

const AUTO_SAVE_INTERVAL = 30000 // 自动保存间隔(ms)
const STATE_CHECK_INTERVAL = 1000 // 1秒检查一次


const MAX_RETRY_COUNT = 3
const RETRY_DELAY = 1000

class AutoSaveManager {
  constructor() {
    this.intervalId = null
    this.lastSaveTime = null
    this.retryCount = 0
  }

  /**
   * 开始自动保存
   * @param {Page} page - 页面实例
   */
  start(page) {
    Logger.info('Starting auto save')

    // 确保先停止现有的自动保存
    this.stop()

    // 启动新的自动保存
    this.intervalId = setInterval(async () => {
      try {
        await this._performSave(page)
      } catch (error) {
        Logger.error('Auto save failed:', error)
        this._handleSaveError(page, error)
      }
    }, AUTO_SAVE_INTERVAL)

    Logger.info('Auto save started')
  }

  /**
   * 停止自动保存
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      Logger.info('Auto save stopped')
    }
  }

  /**
   * 执行保存操作
   * @private
   */
  async _performSave(page) {
    // 检查是否需要保存
    if (!this._shouldSave(page)) {
      return
    }

    try {
      await GameCore.saveGameState(page, 'autoSave')
      this.lastSaveTime = Date.now()
      this.retryCount = 0 // 重置重试计数
      Logger.info('Auto save successful')
    } catch (error) {
      throw error
    }
  }

  /**
   * 检查是否需要保存
   * @private
   */
  _shouldSave(page) {
    const { gameState } = page.data

    // 检查游戏状态
    if (gameState.status !== GameStateService.GameStatus.PLAYING) {
      Logger.debug('Skipping auto save - game not in playing state')
      return false
    }

    // 检查上次保存时间
    if (this.lastSaveTime &&
      Date.now() - this.lastSaveTime < AUTO_SAVE_INTERVAL) {
      Logger.debug('Skipping auto save - too soon since last save')
      return false
    }

    return true
  }

  /**
   * 处理保存错误
   * @private
   */
  async _handleSaveError(page, error) {
    this.retryCount++

    Logger.warn('Auto save error:', {
      error: error.message,
      retryCount: this.retryCount,
      maxRetries: MAX_RETRY_COUNT
    })

    if (this.retryCount < MAX_RETRY_COUNT) {
      // 延迟重试
      setTimeout(() => {
        this._performSave(page)
      }, RETRY_DELAY * this.retryCount)
    } else {
      // 达到最大重试次数
      Logger.error('Auto save failed after max retries')
      // 可以选择通知用户
      GameUI.showToast('自动保存失败，请手动保存游戏', 'error')
    }
  }
}

// 创建单例
const autoSaveManager = new AutoSaveManager()

const GameCore = {
  /**
     * 创建初始游戏状态
     * @returns {Object} 初始游戏状态
     */
  createInitialState() {
    return {
      puzzle: Array(9).fill().map(() => Array(9).fill(0)),
      solution: Array(9).fill().map(() => Array(9).fill(0)),
      userProgress: Array(9).fill().map(() => Array(9).fill(0)),
      initialPuzzle: Array(9).fill().map(() => Array(9).fill(0)),
      difficulty: 'easy',
      status: GameStateService.GameStatus.READY,
      timeSpent: 0,
      hintsRemaining: 3,
      hintsUsed: 0,
      isNoteMode: false,
      errorCount: 0,        // 错误次数
      maxErrors: 3,         // 最大允许错误次数
      showErrors: true,     // 是否显示错误提示
      styleState: {         // 添加 highlightedNumber 到现有的 styleState
        selectedCell: null,
        highlightedCells: {},
        cellStatus: {},
        hintCells: {},
        notes: {},
        highlightedNumber: null  // 新增：当前高亮的数字
      }
    }
  },

  /**
     * 初始化游戏
     * @param {Page} page - 页面实例
     * @param {string} difficulty - 游戏难度
     * @param {boolean} [isNewGame=false] - 是否开始新游戏
     */
  async initializeGame(page, difficulty, isNewGame = false) {
    Logger.error('开始初始化游戏:', { difficulty, isNewGame })
    try {
      Logger.error('检查游戏存档...')

      // 检查是否有存档
      const savedProgress = !isNewGame ? await GameStorage.loadProgress(difficulty) : null

      if (savedProgress) {
        page.setData({
          'pageState.showLoadSaveDialog': true
        })

        const timeStr = new Date(savedProgress.timestamp).toLocaleString()

        const result = await GameUI.showLoadSaveDialog(
          page,
          difficulty,
          timeStr,
          savedProgress.timeSpent
        )

        if (result && result.confirm) {
          this.restoreGameState(page, savedProgress)
          return
        }

        // 如果不加载存档，清除它
        await GameStorage.clearProgress(difficulty)
      }

      // 创建新游戏
      const gameData = await GameService.createNewGame(difficulty)

      // 更新游戏状态
      this.updateGameState(page, {
        puzzle: gameData.puzzle,
        solution: gameData.solution,
        userProgress: gameData.puzzle.map(row => [...row]),
        initialPuzzle: gameData.puzzle.map(row => [...row]),
        difficulty,
        status: GameStateService.GameStatus.PLAYING,
        timeSpent: 0,
        hintsRemaining: this._getInitialHints(difficulty),
        hintsUsed: 0,
        isNoteMode: false
      })

      // 开始自动保存
      this.startAutoSave(page)

      // 确保历史管理器已初始化
      if (!page.data.historyManager) {
        const HistoryManager = require('../../services/game/history-manager')
        page.setData({
          historyManager: HistoryManager.create()
        })
      }


    } catch (error) {
      ErrorHandler.handle(error, '_initializeGame')
      throw error
    }
  },

  /**
     * 更新游戏状态
     * @param {Page} page - 页面实例
     * @param {Object} updates - 状态更新
     */
  async updateGameState(page, updates) {
    try {
      const newGameState = {
        ...page.data.gameState,
        ...updates
      }

      await page.setData({
        gameState: newGameState
      })

      return newGameState
    } catch (error) {
      console.error('更新游戏状态失败:', error)
      throw error
    }
  },

  /**
     * 更新游戏进度
     * @param {Page} page - 页面实例
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {number} number - 填入的数字
     * @returns {Array<Array<number>>} 更新后的进度
     */
  updateProgress(page, row, col, number) {
    const newProgress = page.data.gameState.userProgress.map(row => [...row])
    newProgress[row][col] = number

    this.updateGameState(page, {
      userProgress: newProgress
    })

    return newProgress
  },

  /**
     * 验证移动
     * @param {Page} page - 页面实例
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {number} number - 填入的数字
     * @returns {Object} 验证结果
     */
  validateMove(page, row, col, number) {
    const { userProgress, solution } = page.data.gameState
    return GameService.validateMove(userProgress, row, col, number, solution)
  },

  /**
     * 开始自动保存
     * @param {Page} page - 页面实例
     */
  startAutoSave(page) {
    autoSaveManager.start(page)
  },

  /**
     * 停止自动保存
     * @param {Page} page - 页面实例
     */
  stopAutoSave(page) {
    autoSaveManager.stop()
  },


  /**
     * 保存游戏状态
     * @param {Page} page - 页面实例
     */
  saveGameState(page, x) {
    const { gameState } = page.data

    if (gameState.status === GameStateService.GameStatus.READY || gameState.status === GameStateService.GameStatus.COMPLETED || gameState.status === GameStateService.GameStatus.GAME_OVER) {
      return
    }

    const saveData = {
      puzzle: gameState.puzzle,
      solution: gameState.solution,
      userProgress: gameState.userProgress,
      initialPuzzle: gameState.initialPuzzle,
      difficulty: gameState.difficulty,
      hintsRemaining: gameState.hintsRemaining,
      hintsUsed: gameState.hintsUsed,
      errorCount: gameState.errorCount,
      isNoteMode: gameState.isNoteMode,
      status: gameState.status,
      timeSpent: gameState.timeSpent,
      styleState: {
        selectedCell: gameState.styleState?.selectedCell,
        highlightedCells: gameState.styleState?.highlightedCells || {},
        cellStatus: gameState.styleState?.cellStatus || {},
        hintCells: gameState.styleState?.hintCells || {},
        notes: gameState.styleState?.notes || {}
      },
      timestamp: Date.now()
    }

    GameStorage.saveProgress(saveData)
  },

  /**
     * 恢复游戏状态
     * @param {Page} page - 页面实例
     * @param {Object} savedData - 保存的游戏数据
     */
  restoreGameState(page, savedData) {
    try {
      // 1. 清理所有状态
      const sudokuBoard = page.selectComponent('#sudokuBoard')
      if (sudokuBoard) {
        sudokuBoard.clearAllStatus()  // 使用完整的清理方法
      }

      // 2. 更新游戏数据
      this.updateGameState(page, {
        puzzle: savedData.puzzle,
        solution: savedData.solution,
        userProgress: savedData.userProgress,
        initialPuzzle: savedData.initialPuzzle,
        difficulty: savedData.difficulty,
        hintsRemaining: savedData.hintsRemaining,
        hintsUsed: savedData.hintsUsed,
        errorCount: savedData.errorCount,
        isNoteMode: savedData.isNoteMode,
        status: savedData.status,
        timeSpent: savedData.timeSpent,

        // 避免 多次加载进度后 某次 无操作 导致 之前 的 进度样式 丢失
        styleState: savedData.styleState
      })

      // 3. 恢复样式状态（使用回调确保顺序）
      page.setData({
        styleState: savedData.styleState || {}
      }, () => {
        GameStyle.restoreBoardStyle(page)

        // 恢复数字高亮状态
        if (savedData.styleState?.highlightedNumber) {
          const sudokuBoard = page.selectComponent('#sudokuBoard')
          if (sudokuBoard) {
            sudokuBoard.highlightSameNumber(savedData.styleState.highlightedNumber)
          }
        }
      })

      // 4. 恢复游戏状态
      if (savedData.status === GameStateService.GameStatus.PLAYING) {
        this.startAutoSave(page)
      }


    } catch (error) {
      console.error('恢复游戏状态失败:', error)
      GameUI.showError(error, '恢复游戏')
    }
  },

  /**
     * 重置游戏状态
     * @private
     */
  resetGameState(page) {
    const sudokuBoard = page.selectComponent('#sudokuBoard')
    if (sudokuBoard) {
      sudokuBoard.resetStyles()
    }

    page.setData({
      styleState: {
        selectedCell: null,
        highlightedCells: {},
        cellStatus: {},
        hintCells: {},
        notes: {},
        highlightedNumber: null
      }
    })
  },

  /**
     * 处理页面卸载
     * @param {Page} page - 页面实例
     */
  handlePageUnload(page) {
    try {
      // 1. 停止所有定时器
      this.stopAutoSave(page)
      // 2. 保存最终状态
      this.saveGameState(page, 'handlePageUnload')

      // 3. 清理其他资源（如果有）
      this._cleanupResources(page)
    } catch (error) {
      ErrorHandler.handle(error, 'handlePageUnload')
    }
  },

  _cleanupResources(page) {
    // 清理其他可能的资源
    // 例如：取消未完成的请求等
  },


  /**
     * 处理游戏完成
     * @private
     * @param {Page} page - 页面实例
     */
  async _handleGameComplete(page) {
    try {
      GameUI.showLoading('游戏结算中...')

      // 1. 停止计时器和自动保存
      this.stopAutoSave(page)

      // 2. 更新游戏状态
      await this.updateGameState(page, {
        status: GameStateService.GameStatus.COMPLETED
      })

      // 3. 记录游戏结果到云端
      const { difficulty, timeSpent, errorCount, hintsUsed } = page.data.gameState

      await wx.cloud.callFunction({
        name: 'duoGameStatistics',
        data: {
          $url: 'recordGame',
          difficulty,
          timeSpent,
          errors: errorCount,
          hintsUsed,
          completed: true
        }
      })

      // 2. 等待成就检查完成
      const achievementResult = await GameService.checkGameComplete(page.data.gameState)


      // 2. 清理游戏数据
      await this._cleanupGameData(page)
      // 3. 更新UI
      await this._updateCompleteUI(page, achievementResult)

    } catch (error) {
      GameUI.hideLoading()
      console.error('处理游戏完成失败:', error)
      throw error
    } finally {
      GameUI.hideLoading()
    }
  },

  /**
     * 清理游戏数据
     * @private
     * @param {Page} page - 页面实例
     */
  async _cleanupGameData(page) {
    const { difficulty } = page.data.gameState
    await GameStorage.clearProgress(difficulty)
  },


  /**
     * 更新完成UI
     * @private
     * @param {Page} page - 页面实例
     * @param {Object} achievementResult - 成就结果
     */
  async _updateCompleteUI(page, achievementResult) {
    try {
      GameUI.hideLoading()
      // 1. 如果有成就完成，先显示成就弹窗
      if (achievementResult?.newlyUnlocked?.length > 0) {
        // 触发成就解锁事件并等待显示完成
        globalEventManager.emit(EventTypes.ACHIEVEMENT.BATCH_UNLOCK, {
          achievements: achievementResult.newlyUnlocked,
          timestamp: new Date()
        })
      }

      // 2. 显示游戏完成弹窗
      await this._updateGameCompleteUI(page)
    } catch (error) {
      GameUI.hideLoading()
      console.error('更新完成UI失败:', error)
      // 确保即使成就显示失败，游戏完成弹窗也能正常显示
      await this._updateGameCompleteUI(page)
    }
  },

  /**
     * 更新游戏完成UI
     * @private
     * @param {Page} page - 页面实例
     */
  async _updateGameCompleteUI(page) {
    // 2. 显示游戏完成对话框
    const result = await GameUI.showGameCompleteDialog(page)

    // 3. 处理对话框结果
    if (result.confirm) {
      wx.navigateBack()
    } else {
      wx.redirectTo({
        url: `/pages/game/game?difficulty=${page.data.gameState.difficulty}&newGame=true`
      })
    }
  },

  /**
     * 获取初始提示次数
     * @private
     * @param {string} difficulty - 游戏难度
     * @returns {number} 提示次��
     */
  _getInitialHints(difficulty) {
    const hintCounts = {
      easy: 5,
      medium: 3,
      hard: 1
    }
    return hintCounts[difficulty] || 3
  },

  /**
     * 初始化历史记录管理
     * @param {Page} page - 页面实例
     */
  initHistory(page) {
    page.data.historyManager = HistoryManager.create()
    this.updateUndoRedoState(page)
  },

  /**
     * 记录操作
     * @param {Page} page - 页面实例
     * @param {Object} operation - 操作记录
     */
  async recordOperation(page, operation) {
    try {
      if (!operation || !operation.position) {
        console.error('无效的操作记录')
        return
      }

      const historyManager = page.data.historyManager
      if (!historyManager) {
        console.error('历史管理器未初始化')
        return
      }

      // 添加操作到历史记录
      historyManager.addOperation(operation)

      // 更新撤销/重做状态
      await this.updateUndoRedoState(page)

    } catch (error) {
      console.error('记录操作失败:', error)
      throw error
    }
  },

  /**
     * 执行撤销操作
     * @param {Page} page - 页面实例
     */
  async undo(page) {
    try {
      const { historyManager } = page.data
      if (!historyManager?.canUndo()) return

      const operation = historyManager.undo()
      if (operation) {
        await this._applyOperation(page, operation, true)
        this.updateUndoRedoState(page)
      }
    } catch (error) {
      ErrorHandler.handle(error, 'undo')
    }
  },

  /**
     * 执行重做操作
     * @param {Page} page - 页面实例
     */
  async redo(page) {
    try {
      const { historyManager } = page.data
      if (!historyManager?.canRedo()) return

      const operation = historyManager.redo()
      if (operation) {
        await this._applyOperation(page, operation, false)
        this.updateUndoRedoState(page)
      }
    } catch (error) {
      ErrorHandler.handle(error, 'redo')
    }
  },

  /**
     * 更新撤销/重做按钮状态
     * @param {Page} page - 页面实例
     */
  updateUndoRedoState(page) {
    const { historyManager } = page.data
    if (historyManager) {
      const canUndo = historyManager.canUndo()
      const canRedo = historyManager.canRedo()

      // 更新按钮状态
      page.setData({
        canUndo,
        canRedo
      })
    }
  },

  /**
     * 应用操作
     * @private
     * @param {Page} page - 页面实例
     * @param {Object} operation - 操作记录
     * @param {boolean} isUndo - 是否是撤销操作
     */
  async _applyOperation(page, operation, isUndo = false) {
    const { position, oldValue, newValue } = operation
    const value = isUndo ? oldValue : newValue
    const sudokuBoard = page.selectComponent('#sudokuBoard')

    if (!sudokuBoard) {
      throw new Error('找不到数独棋盘组件')
    }

    try {
      // 1. 获取当前状态
      const currentState = page.data.gameState
      const newProgress = [...currentState.userProgress]
      newProgress[position.row][position.col] = value

      // 2. 验证移动
      const validation = await this._validateMove(
        newProgress,
        position,
        value,
        currentState.solution
      )

      // 3. 统一更新状态
      await this._updateGameState(page, {
        progress: newProgress,
        operation: operation,
        validation: validation,
        position: position,
        value: value
      })

      // 4. 检查游戏完成
      if (value !== 0 && validation.isCorrect) {
        await this._checkGameCompletion(page, newProgress, currentState.solution)
      }

    } catch (error) {
      console.error('应用操作失败:', error)
      await this._handleOperationError(page, operation, error)
      throw error
    }
  },

  // 拆分验证逻辑
  async _validateMove(progress, position, value, solution) {
    return GameService.validateMove(
      progress,
      position.row,
      position.col,
      value,
      solution
    )
  },

  // 统一状态更新
  async _updateGameState(page, { progress, operation, validation, position, value }) {
    const sudokuBoard = page.selectComponent('#sudokuBoard')
    const updates = {
      'gameState.userProgress': progress,
      'gameState.lastOperation': operation,
      'gameState.lastValidation': validation
    }

    await Promise.all([
      page.setData(updates),
      sudokuBoard.updateCell(position.row, position.col, value),
      GameStyle.updateUI(page, position.row, position.col, validation),
      this.updateUndoRedoState(page)
    ])
  },

  // 检查游戏完成
  async _checkGameCompletion(page, progress, solution) {
    const isCompleted = GameService.isGameCompleted(progress, solution, page.data.gameState)
    if (isCompleted) {
      await this._handleGameComplete(page)
    }
  },

  // 新增错误处理方法
  async _handleOperationError(page, operation, error) {
    try {
      // 记录错误
      ErrorHandler.handle(error, '_applyOperation')

      // 回滚到上一个有效状态
      await this.rollbackToLastValidState(page)

      // 更新UI状态
      const sudokuBoard = page.selectComponent('#sudokuBoard')
      if (sudokuBoard) {
        await sudokuBoard.refresh()
      }
    } catch (rollbackError) {
      console.error('状态回滚失败:', rollbackError)
      // 如果回滚也失败，强制重置游戏状态
      await this.resetGameState(page)
    }
  },

  // 新增状态回滚方法
  async rollbackToLastValidState(page) {
    const historyManager = page.data.historyManager
    if (!historyManager || !historyManager.canUndo()) {
      return
    }

    // 获取上一个有效状态
    const lastOperation = historyManager.undo()
    if (lastOperation) {
      await this._applyOperation(page, lastOperation, true)
    }
  },

  /**
     * 应用数字操作
     * @private
     * @param {Page} page - 页面实例
     * @param {Object} position - 位置信息
     * @param {number} value - 数字值
     */
  async _applyNumberOperation(page, position, value) {
    const { row, col } = position
    const sudokuBoard = page.selectComponent('#sudokuBoard')

    // 更新游戏状态
    const newProgress = [...page.data.gameState.userProgress]
    newProgress[row][col] = value

    // 更新UI
    await page.setData({
      'gameState.userProgress': newProgress
    })

    // 更新棋盘显示
    if (sudokuBoard) {
      sudokuBoard.updateCell(row, col, value)
    }
  },

  /**
     * 应用笔记操作
     * @private
     * @param {Page} page - 页面实例
     * @param {Object} position - 位置信息
     * @param {Array<number>} notes - 笔记数据
     */
  async _applyNoteOperation(page, position, notes) {
    const { row, col } = position
    const sudokuBoard = page.selectComponent('#sudokuBoard')

    if (sudokuBoard) {
      await sudokuBoard.setNotes(row, col, notes)
    }
  },

  /**
     * 应用提示操作
     * @private
     * @param {Page} page - 页面实例
     * @param {Object} position - 位置信息
     * @param {number} value - 提示值
     */
  async _applyHintOperation(page, position, value) {
    const { row, col } = position
    const sudokuBoard = page.selectComponent('#sudokuBoard')

    // 更新游戏状态
    const newProgress = [...page.data.gameState.userProgress]
    newProgress[row][col] = value

    // 更新UI
    await page.setData({
      'gameState.userProgress': newProgress
    })

    // 更新棋盘显示
    if (sudokuBoard) {
      sudokuBoard.updateCell(row, col, value)
      sudokuBoard.showHintAnimation(row, col)
    }
  },
  /**
     * 处理游戏结束
     * @param {Page} page - 页面实例
     */
  async handleGameOver(page) {
    try {

      // 1. 停止计时器和自动保存
      this.stopAutoSave(page)

      // 2. 更新游戏状态
      await this.updateGameState(page, {
        status: GameStateService.GameStatus.GAME_OVER
      })


      // 3. 记录游戏结果到云端
      const { difficulty, timeSpent, errorCount, hintsUsed } = page.data.gameState

      await wx.cloud.callFunction({
        name: 'duoGameStatistics',
        data: {
          $url: 'recordGame',
          difficulty,
          timeSpent,
          errors: errorCount,
          hintsUsed,
          completed: false
        }
      })


      // 显示游戏结束对话框
      const result = await GameUI.showGameOverDialog(page)

      // 处理用户选择
      if (result.confirm) {
        // 重新开始游戏
        // 获取当前难度
        const { difficulty } = page.data.gameState

        // 显示加载动画
        GameUI.showLoading('准备新游戏...')

        // 重定向到新游戏
        wx.redirectTo({
          url: `/pages/game/game?difficulty=${difficulty}&newGame=true`,
          success: () => {
            // 重定向成功后隐藏加载动画
            GameUI.hideLoading()
          },
          fail: (error) => {
            console.error('重定向失败:', error)
            GameUI.hideLoading()
            GameUI.showToast('开始新游戏失败，请重试')
          }
        })
      } else {
        // 清理游戏数据
        await this._cleanupGameData(page)
        // 返回主菜单
        wx.navigateBack()
      }
    } catch (error) {
      GameUI.hideLoading()// 确保加载动画被关闭
      console.error('处理游戏结束失败:', error)
      GameUI.showToast('操作失败，请重试')
      throw error
    }
  },
  /**
   * 更新数字高亮状态
   * @param {Page} page - 页面实例
   * @param {number|null} number - 要高亮的数字，null 表示清除高亮
   */
  async updateNumberHighlight(page, number) {
    try {
      // 1. 获取当前游戏状态
      const currentState = page.data.gameState

      // 2. 准备新的样式状态
      const newStyleState = {
        ...(currentState.styleState || {}),
        highlightedNumber: number
      }

      // 3. 更新游戏状态
      await this.updateGameState(page, {
        styleState: newStyleState
      })

      // 4. 更新棋盘组件显示
      const sudokuBoard = page.selectComponent('#sudokuBoard')
      if (sudokuBoard) {
        if (number === null) {
          sudokuBoard.clearSameNumberHighlight()
        } else {
          sudokuBoard.highlightSameNumber(number)
        }
      }

      return true
    } catch (error) {
      console.error('更新数字高亮状态失败:', error)
      return false
    }
  },

  /**
   * 清除所有高亮状态
   * @param {Page} page - 页面实例
   */
  async clearHighlights(page) {
    return this.updateNumberHighlight(page, null)
  }



}

module.exports = GameCore
