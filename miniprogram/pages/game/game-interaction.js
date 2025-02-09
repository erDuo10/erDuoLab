/**
 * 游戏交互模块
 * @module GameInteraction
 * @description 处理所有用户交互相关的逻辑，包括单元格选择、数字输入、提示使用等
 */

const GameCore = require('./game-core')
const GameUI = require('./game-ui')
const GameStyle = require('./game-style')
const GameStorage = require('./game-storage')
const GameStateService = require('../../services/game/game-state')
const GameService = require('../../services/game/game')

const GameInteraction = {
  /**
     * 处理单元格点击
     * @param {Page} page - 页面实例
     * @param {Object} event - 点击事件对象
     * @param {Object} event.detail - 事件详情
     * @param {number} event.detail.row - 行索引
     * @param {number} event.detail.col - 列索引
     */
  handleCellTap(page, event) {
    const { row, col, isInitialNumber } = event.detail

    const sudokuBoard = page.selectComponent('#sudokuBoard')
    if (!sudokuBoard) return

    // 清除之前的高亮
    GameStyle.clearHighlights(page)

    if (!isInitialNumber) {

      // 更新选中单元格
      this._updateSelectedCell(page, row, col)

      // 高亮相关单元格
      GameStyle.highlightRelatedCells(page, row, col)

      // 更新游戏状态
      GameCore.updateGameState(page, {
        styleState: page.data.styleState
      })
    }

    const number = page.data.gameState.userProgress[row][col]
    // 如果点击的单元格有数字，触发数字高亮
    if (number) {
      this.handleNumberTap(page, { detail: { number } })
    } else {
      GameCore.clearHighlights(page)
    }
  },

  /**
 * 处理数字点击事件
 * @param {Page} page - 页面实例
 * @param {Object} event - 事件对象
 */
  handleNumberTap(page, event) {
    const { number } = event.detail
    const currentHighlight = page.data.gameState.styleState?.highlightedNumber

    // 如果点击的是当前高亮的数字，则清除高亮
    if (currentHighlight === number) {
      GameCore.clearHighlights(page)
    } else {
      GameCore.updateNumberHighlight(page, number)
    }
  },

  /**
     * 处理数字选择
     * @param {Page} page - 页面实例
     * @param {Object} event - 选择事件对象
     * @param {Object} event.detail - 事件详情
     * @param {number} event.detail.number - 选择的数字
     */
  async handleNumberSelect(page, event) {
    // 清除之前的数字高亮
    await GameCore.clearHighlights(page)

    const { number } = event.detail
    const { selectedCell } = page.data.styleState

    // 验证输入条件
    if (!selectedCell || !this._validateInput(page, selectedCell)) {
      console.warn('无效的输入位置')
      return
    }

    try {
      // 获取当前值
      const { row, col } = selectedCell
      const currentState = JSON.parse(JSON.stringify(page.data.gameState))
      const oldValue = currentState.userProgress[row][col]

      // 如果新值与旧值相同，不处理
      if (oldValue === number) return

      // 创建操作记录
      const operation = {
        type: number === 0 ? 'DELETE' : 'INPUT',
        position: {
          row: row,
          col: col
        },
        oldValue: oldValue,
        newValue: number,
        timestamp: Date.now()
      }


      // 记录操作前检查历史管理器
      if (!page.data.historyManager) {
        const HistoryManager = require('../../services/game/history-manager')
        await page.setData({
          historyManager: HistoryManager.create()
        })
      }

      // 先记录操作
      await GameCore.recordOperation(page, operation)
      // 处理数字输入
      await this._processNumberInput(page, selectedCell, number, operation)

    } catch (error) {
      console.error('数字输入处理失败:', error)
      // 错误处理增强
      await this._handleInputError(page, error)
    }
  },

  // 新增错误处理方法
  async _handleInputError(page, error) {
    // 尝试恢复到上一个有效状态
    try {
      await GameCore.rollbackToLastValidState(page)
      GameUI.showToast('操作已撤销，请重试')
    } catch (rollbackError) {
      console.error('状态恢复失败:', rollbackError)
      GameUI.showToast('游戏状态异常，请重新开始')
    }
  },

  /**
     * 处理提示请求
     * @param {Page} page - 页面实例
     */
  handleHint(page) {
    // 检查提示次数
    if (page.data.gameState.hintsRemaining <= 0) {
      GameUI.showToast('提示次数已用完')
      return
    }

    // 显示确认对话框
    GameUI.showHintConfirmDialog(page).then(confirmed => {
      if (confirmed) {
        this._applyHint(page)
      }
    })
  },

  /**
     * 更新选中的单元格
     * @private
     * @param {Page} page - 页面实例
     * @param {number} row - 行索引
     * @param {number} col - 列索��
     */
  _updateSelectedCell(page, row, col) {
    page.setData({
      'styleState.selectedCell': { row, col }
    })

    const sudokuBoard = page.selectComponent('#sudokuBoard')
    if (sudokuBoard) {
      sudokuBoard.setSelectedCell(row, col)
    }
  },

  /**
     * 验证输入条件
     * @private
     * @param {Page} page - 页面实例
     * @param {Object} selectedCell - 选中的单元格
     * @returns {boolean} 是否验证通过
     */
  _validateInput(page, selectedCell) {
    if (!selectedCell) {
      GameUI.showToast('请先选择一个格子')
      return false
    }

    const { row, col } = selectedCell
    if (page.data.gameState.initialPuzzle[row][col] !== 0) {
      GameUI.showToast('该格子不可修改')
      return false
    }

    return true
  },

  /**
     * 处理数字输入
     * @private
     * @param {Page} page - 页面实例
     * @param {Object} selectedCell - 选中的单元格
     * @param {number} number - 输入的数字
     * @param operation
     */
  async _processNumberInput(page, selectedCell, number, operation) {
    const { row, col } = selectedCell

    try {
      // 1. 获取当前游戏状态的深拷贝
      const currentState = JSON.parse(JSON.stringify(page.data.gameState))

      // 2. 检查单元格是否可编辑
      if (currentState.initialPuzzle[row][col] !== 0) {
        GameUI.showToast('此格不可修改')
        return
      }

      // 3. 更新游戏进度
      const newProgress = GameCore.updateProgress(page, row, col, number)

      // 4. 验证移动
      const validation = GameService.validateMove(
        currentState.userProgress,
        row,
        col,
        number,
        currentState.solution
      )

      // 5. 处理错误情况
      if (!validation.isValid) {
        // 增加错误计数
        const newErrorCount = (currentState.errorCount || 0) + 1
        if (currentState.showErrors) {
          GameUI.showErrorAnimation(page)
        }
        await page.setData({
          'gameState.errorCount': newErrorCount
        })

        // 检查是否达到最大错误次数
        if (newErrorCount >= (currentState.maxErrors || 3)) {
          await GameCore.handleGameOver(page)
          return
        }
        // return validation;
      }

      // 6. 批量更新状态
      const updates = {
        'gameState.lastValidation': validation,
        'gameState.lastOperation': operation
      }

      // 7. 应用更新
      await Promise.all([
        // 更新游戏状态
        page.setData(updates),

        // 更新UI显示
        GameStyle.updateUI(page, row, col, validation)
      ])

      // 获取更新后的游戏状态
      const updatedState = page.data.gameState

      // 8. 检查游戏是否完成
      if (validation.isCorrect) {
        const isCompleted = GameService.isGameCompleted(
          updatedState.userProgress,
          updatedState.solution,
          updatedState
        )

        if (isCompleted) {
          await GameCore._handleGameComplete(page)
        }
      }
      // TODO: 手动触发一下 相同数字高亮
      this.handleNumberTap(page, { detail: { number } })

      // 9. 自动保存
      await GameStorage.autoSave(page, false)

      // 10. 返回验证结果
      return validation

    } catch (error) {
      console.error('处理数字输入失败:', error)
      GameUI.showToast('操作失败，请重试')
      throw error // 向上传递错误，由调用者处理
    }
  },

  /**
     * 应用提示
     * @private
     * @param {Page} page - 页面实例
     */
  _applyHint(page) {
    try {
      const hint = GameStateService.getHint(page.data.gameState)
      if (!hint) {
        GameUI.showToast('暂无可用提示')
        return
      }

      const { row, col, value } = hint

      // 更新进度
      this._processNumberInput(page, { row, col }, value)

      // 更新提示次数
      GameCore.updateGameState(page, {
        hintsRemaining: page.data.gameState.hintsRemaining - 1,
        hintsUsed: page.data.gameState.hintsUsed + 1
      })

      // 显示提示动画
      GameStyle.showHintAnimation(page, row, col)

    } catch (error) {
      console.error('应用提示失败:', error)
      GameUI.showToast('提示应用失败')
    }
  }
}

module.exports = GameInteraction
