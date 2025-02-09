/**
 * 游戏样式管理模块
 * @module GameStyle
 * @description 处理游戏界面的样式、动画和视觉效果
 */

const GameStyle = {
  /**
     * 更新UI状态
     * @param {Page} page - 页面实例
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {Object} validation - 验证结果
     * @param {boolean} validation.isValid - 是否符合规则
     * @param {boolean} validation.isCorrect - 是否正确
     */
  async updateUI(page, row, col, validation) {
    const sudokuBoard = this._getSudokuBoard(page)
    if (!sudokuBoard) return

    try {
      const status = this._getStatusFromValidation(validation)

      // 批量更新状态
      const updates = {
        [`styleState.cellStatus.${row}-${col}`]: status
      }

      await page.setData(updates)
      await sudokuBoard.setCellStatus(row, col, status)

    } catch (error) {
      console.error('更新UI失败:', error)
      throw error
    }
  },

  /**
     * 高亮相关单元格
     * @param {Page} page - 页面实例
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     */
  highlightRelatedCells(page, row, col) {
    const sudokuBoard = this._getSudokuBoard(page)
    if (!sudokuBoard) return

    const newHighlightedCells = {}

    // 高亮同行
    this._highlightRow(sudokuBoard, row, col, newHighlightedCells)

    // 高亮同列
    this._highlightColumn(sudokuBoard, row, col, newHighlightedCells)

    // 高亮同宫格
    this._highlightBox(sudokuBoard, row, col, newHighlightedCells)

    // 更新高亮状态
    page.setData({
      'styleState.highlightedCells': newHighlightedCells
    })
  },

  /**
     * 清除所有高亮
     * @param {Page} page - 页面实例
     */
  clearHighlights(page) {
    const sudokuBoard = this._getSudokuBoard(page)
    if (!sudokuBoard) return

    page.setData({
      'styleState.highlightedCells': {},
      'styleState.highlightedNumber': null
    })

    sudokuBoard.clearHighlight()
  },

  /**
     * 显示提示动画
     * @param {Page} page - 页面实例
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     */
  showHintAnimation(page, row, col) {
    const sudokuBoard = this._getSudokuBoard(page)
    if (sudokuBoard) {
      sudokuBoard.showCellAnimation(row, col, 'hint')
    }
  },

  /**
     * 恢复棋盘样式
     * @param {Page} page - 页面实例
     */
  restoreBoardStyle(page) {
    const sudokuBoard = this._getSudokuBoard(page)
    if (!sudokuBoard) {
      console.error('找不到数独棋盘组件')
      return
    }

    const { styleState } = page.data

    try {
      // 按特定顺序恢复样式
      this._restoreCellStatus(sudokuBoard, styleState)    // 恢复单元格状态
      this._restoreHighlightedCells(sudokuBoard, styleState)  // 恢复高亮
      this._restoreSelectedCell(sudokuBoard, styleState)   // 恢复选中状态
      this._restoreHintCells(sudokuBoard, styleState)     // 恢复提示
      this._restoreNotes(sudokuBoard, styleState)         // 恢复笔记

      // 强制刷新棋盘
      sudokuBoard.forceUpdate()
    } catch (error) {
      console.error('恢复棋盘样式失败:', error)
    }
  },


  /**
     * 获取数独棋盘组件
     * @private
     * @param {Page} page - 页面实例
     * @returns {Component|null} 数独棋盘组件实例
     */
  _getSudokuBoard(page) {
    return page.selectComponent('#sudokuBoard')
  },

  /**
     * 根据验证结果获取状态
     * @private
     * @param {Object} validation - 验证结果
     * @returns {string} 状态字符串
     */
  _getStatusFromValidation(validation) {
    if (!validation.isValid) return 'error'
    if (!validation.isCorrect) return 'warning'
    return 'correct'
  },

  /**
     * 高亮同行单元格
     * @private
     * @param {Component} sudokuBoard - 数独棋盘组件
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {Object} highlightedCells - 高亮状态记录
     */
  _highlightRow(sudokuBoard, row, col, highlightedCells) {
    for (let i = 0; i < 9; i++) {
      highlightedCells[`${row}-${i}`] = true
      sudokuBoard.highlightCell(row, i)
    }
  },

  /**
     * 高亮同列单元格
     * @private
     * @param {Component} sudokuBoard - 数独棋盘组件
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {Object} highlightedCells - 高亮状态记录
     */
  _highlightColumn(sudokuBoard, row, col, highlightedCells) {
    for (let i = 0; i < 9; i++) {
      highlightedCells[`${i}-${col}`] = true
      sudokuBoard.highlightCell(i, col)
    }
  },

  /**
     * 高亮同宫格单元格
     * @private
     * @param {Component} sudokuBoard - 数独棋盘组件
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {Object} highlightedCells - 高亮状态记录
     */
  _highlightBox(sudokuBoard, row, col, highlightedCells) {
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        highlightedCells[`${boxRow + i}-${boxCol + j}`] = true
        sudokuBoard.highlightCell(boxRow + i, boxCol + j)
      }
    }
  },

  /**
     * 恢复选中单元格
     * @private
     * @param {Component} sudokuBoard - 数独棋盘组件
     * @param {Object} styleState - 样式状态
     */
  _restoreSelectedCell(sudokuBoard, styleState) {
    if (styleState.selectedCell) {
      const { row, col } = styleState.selectedCell
      sudokuBoard.setSelectedCell(row, col)
    }
  },

  /**
     * 恢复单元格状态
     * @private
     * @param {Component} sudokuBoard - 数独棋盘组件
     * @param {Object} styleState - 样式状态
     */
  _restoreCellStatus(sudokuBoard, styleState) {
    if (!styleState.cellStatus) return

    Object.entries(styleState.cellStatus).forEach(([cellKey, status]) => {
      const [row, col] = cellKey.split('-').map(Number)
      if (!isNaN(row) && !isNaN(col)) {
        sudokuBoard.setCellStatus(row, col, status)
      }
    })
  },

  /**
     * 恢复提示单元格
     * @private
     * @param {Component} sudokuBoard - 数独棋盘组件
     * @param {Object} styleState - 样式状态
     */
  _restoreHintCells(sudokuBoard, styleState) {
    Object.entries(styleState.hintCells).forEach(([cellKey, isHint]) => {
      if (isHint) {
        const [row, col] = cellKey.split('-').map(Number)

        sudokuBoard.setCellStatus(row, col, {
          status: 'correct',
          isHint: true  // 明确设置提示标记
        })
      }
    })
  },

  /**
     * 恢复高亮单元格
     * @private
     * @param {Component} sudokuBoard - 数独棋盘组件
     * @param {Object} styleState - 样式状态
     */
  _restoreHighlightedCells(sudokuBoard, styleState) {
    Object.entries(styleState.highlightedCells).forEach(([cellKey, isHighlighted]) => {
      if (isHighlighted) {
        const [row, col] = cellKey.split('-').map(Number)
        sudokuBoard.highlightCell(row, col)
      }
    })
  },

  /**
     * 恢复笔记
     * @private
     * @param {Component} sudokuBoard - 数独棋盘组件
     * @param {Object} styleState - 样式状态
     */
  _restoreNotes(sudokuBoard, styleState) {
    Object.entries(styleState.notes).forEach(([cellKey, notes]) => {
      if (notes) {
        const [row, col] = cellKey.split('-').map(Number)
        sudokuBoard.setNotes(row, col, notes)
      }
    })
  }
}

module.exports = GameStyle
