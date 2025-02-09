/**
 * 游戏状态管理服务
 */
const GameStateService = {
  /**
     * 游戏状态枚举
     */
  GameStatus: {
    READY: 'READY',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    GAME_OVER: 'GAME_OVER'
  },

  /**
     * 获取提示
     * @param {Object} gameState
     * @returns {Object|null} 提��信息
     */
  getHint(gameState) {
    try {
      if (!gameState?.solution || !gameState?.userProgress) {
        throw new Error('Invalid game state')
      }
      // ... 现有逻辑

      const {solution, userProgress, hintsRemaining, selectedCell} = gameState

      if (hintsRemaining <= 0) return null

      // 优先考虑当前选中的格子
      if (selectedCell) {
        const {row, col} = selectedCell
        if (userProgress[row][col] !== solution[row][col]) {
          return {row, col, value: solution[row][col]}
        }
      }

      // 寻找最有价值的提示（例如：通过难度评估）
      return this._findStrategicHint(userProgress, solution)

    } catch (error) {
      console.error('获取提示失败:', error)
      return null
    }


  },

  /**
     * 寻找策略性提示
     * @private
     * @param {Array<Array<number>>} userProgress - 当前游戏进度
     * @param {Array<Array<number>>} solution - 完整解答
     * @returns {Object|null} - 提示信息 {row, col, value}
     */
  _findStrategicHint(userProgress, solution) {
    // 1. 收集所有可能的提示
    const possibleHints = []

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (userProgress[row][col] !== solution[row][col]) {
          // 计算此位置的策略价值
          const strategyValue = this._calculateStrategyValue(userProgress, row, col, solution[row][col])

          possibleHints.push({
            row,
            col,
            value: solution[row][col],
            strategyValue
          })
        }
      }
    }

    if (possibleHints.length === 0) return null

    // 2. 根据策略价值排序
    possibleHints.sort((a, b) => b.strategyValue - a.strategyValue)

    // 3. 返回最有价值的提示
    const {row, col, value} = possibleHints[0]
    return {row, col, value}
  },

  /**
     * 计算提示位置的策略价值
     * @private
     * @param {Array<Array<number>>} board - 当前游戏板
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {number} value - 正确值
     * @returns {number} - 策略价值分数
     */
  _calculateStrategyValue(board, row, col, value) {
    let score = 0

    // 1. 检查数字的唯一性（该数字在行/列/宫格中是否为唯一可能）
    const uniquenessScore = this._checkUniqueness(board, row, col, value)
    score += uniquenessScore * 3 // 权重最高

    // 2. 检查填充度（优先提示周围已填充较多的区域）
    const fillScore = this._checkFillRate(board, row, col)
    score += fillScore * 2

    // 3. 检查影响范围（填入此数字后能帮助确定其他位置）
    const impactScore = this._checkImpact(board, row, col, value)
    score += impactScore

    return score
  },

  /**
     * 检查数字在行/列/宫格中的唯一性
     * @private
     */
  _checkUniqueness(userProgress, row, col, correctValue) {
    let score = 0

    // 检查行唯一可能性
    if (this._isUniqueInRow(userProgress, row, correctValue)) {
      score += 3
    }

    // 检查列唯一可能性
    if (this._isUniqueInColumn(userProgress, col, correctValue)) {
      score += 3
    }

    // 检查宫格唯一可能性
    if (this._isUniqueInBox(userProgress, row, col, correctValue)) {
      score += 3
    }

    return score
  },

  /**
     * 检查数字在行中的唯一性
     * @private
     */
  _isUniqueInRow(userProgress, row, correctValue) {
    let possiblePositions = 0
    let possibleCols = []

    // 遍历这一行
    for (let col = 0; col < 9; col++) {
      // 检查空位置是否可以放置正确答案
      if (!userProgress[row][col] && this._isValidMove(userProgress, row, col, correctValue)) {
        possiblePositions++
        possibleCols.push(col)
      }
    }

    return possiblePositions === 1  // 只有一个可能位置时返回true
  },

  /**
     * 检查数字在列中的唯一性
     * @private
     */
  _isUniqueInColumn(userProgress, col, correctValue) {
    let possiblePositions = 0
    let possibleRows = []

    // 遍历这一列
    for (let row = 0; row < 9; row++) {
      // 检查空位置是否可以放置正确答案
      if (!userProgress[row][col] && this._isValidMove(userProgress, row, col, correctValue)) {
        possiblePositions++
        possibleRows.push(row)
      }
    }

    return possiblePositions === 1  // 只有一个可能位置时返回true
  },


  /**
     * 检查数字在宫格中的唯一性
     * @private
     */
  _isUniqueInBox(userProgress, row, col, correctValue) {
    const boxRowStart = Math.floor(row / 3) * 3
    const boxColStart = Math.floor(col / 3) * 3
    let possiblePositions = 0
    let possibleCells = []

    // 遍历3x3宫格
    for (let r = boxRowStart; r < boxRowStart + 3; r++) {
      for (let c = boxColStart; c < boxColStart + 3; c++) {
        // 检查空位置是否可以放置正确答案
        if (!userProgress[r][c] && this._isValidMove(userProgress, r, c, correctValue)) {
          possiblePositions++
          possibleCells.push({row: r, col: c})
        }
      }
    }

    return possiblePositions === 1  // 只有一个可能位置时返回true
  },

  /**
     * 检查周围区域的填充率
     * @private
     */
  _checkFillRate(board, row, col) {
    let filledCount = 0
    const totalCells = 20 // 相关单元格总数（行8 + 列8 + 宫格4）

    // 检查行
    for (let c = 0; c < 9; c++) {
      if (c !== col && board[row][c] !== 0) filledCount++
    }

    // 检查列
    for (let r = 0; r < 9; r++) {
      if (r !== row && board[r][col] !== 0) filledCount++
    }

    // 检查3x3宫格
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && board[r][c] !== 0) filledCount++
      }
    }

    return (filledCount / totalCells) * 10 // 返回0-10的分数
  },

  /**
     * 检查填入数字后的影响范围
     * @private
     */
  _checkImpact(board, row, col, value) {
    let impactScore = 0
    const tempBoard = JSON.parse(JSON.stringify(board))
    tempBoard[row][col] = value

    // 检查填入此数字后，是否有其他位置变得更容易解决
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (tempBoard[r][c] === 0) {
          const possibilities = this._getPossibleValues(tempBoard, r, c)
          // 如果某个位置的可能性减少到很少，说明影响较大
          if (possibilities.length === 1) impactScore += 2
          else if (possibilities.length === 2) impactScore += 1
        }
      }
    }

    return impactScore
  },

  /**
     * 获取某个位置的所有可能值
     * @private
     */
  _getPossibleValues(board, row, col) {
    const possibilities = []
    for (let num = 1; num <= 9; num++) {
      if (this._isValidMove(board, row, col, num)) {
        possibilities.push(num)
      }
    }
    return possibilities
  },

  /**
     * 检查移动是否有效
     * @private
     */
  _isValidMove(board, row, col, value) {
    // 检查行
    for (let c = 0; c < 9; c++) {
      if (c !== col && board[row][c] === value) return false
    }

    // 检查列
    for (let r = 0; r < 9; r++) {
      if (r !== row && board[r][col] === value) return false
    }

    // 检查3x3宫格
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && board[r][c] === value) return false
      }
    }

    return true
  },


  /**
     * 获取存档key
     * @private
     * @param {string} difficulty - 游戏难度
     * @returns {string} 存档key
     */
  _getSaveKey(difficulty) {
    return `sudoku_progress_${difficulty}`
  },

  /**
     * 验证存档数据
     * @param {Object} saveData - 存档数据
     * @returns {boolean} 是否有效
     */
  validateSaveData(saveData) {
    return !!(
      saveData &&
            Array.isArray(saveData.puzzle) &&
            Array.isArray(saveData.solution) &&
            Array.isArray(saveData.userProgress) &&
            typeof saveData.difficulty === 'string' &&
            typeof saveData.timeSpent === 'number' &&
            saveData.styleState
    )
  },

  /**
     * 清理过期存档
     */
  cleanupExpiredSaves() {
    const difficulties = ['easy', 'medium', 'hard']
    difficulties.forEach(difficulty => {
      const saveKey = `sudoku_save_${difficulty}`
      const saveData = wx.getStorageSync(saveKey)
      if (saveData && Date.now() - saveData.timestamp > 24 * 60 * 60 * 1000) {
        wx.removeStorageSync(saveKey)
      }
    })
  }

}

module.exports = GameStateService
