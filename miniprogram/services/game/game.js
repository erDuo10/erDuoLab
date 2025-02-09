
const { achievementManager } = require('../../services/achievement/achievement-manager')
/**
 * 游戏服务
 * 处理数独游戏的核心逻辑
 */
const GameService = {
  /**
     * 创建新游戏
     * @param {string} difficulty - 难度级别
     * @returns {Promise<Object>} 包含谜题和解法的对象
     */
  async createNewGame(difficulty) {
    try {
      const puzzle = await this.generatePuzzle(difficulty)
      const solution = await this.solveSudoku([...puzzle.map(row => [...row])])
      return {
        puzzle,
        solution
      }
    } catch (error) {
      console.error('创建游戏失败:', error)
      throw error
    }
  },

  /**
     * 生成数独谜题
     * @param {string} difficulty - 难度级别
     * @returns {Array<Array<number>>} 生成的数独谜题
     */
  async generatePuzzle(difficulty) {
    try {
      // 随机选择生成策略
      const strategies = ['standard', 'diagonal', 'symmetric']
      const strategy = strategies[Math.floor(Math.random() * strategies.length)]

      const solution = await this._generateSolution()
      let puzzle

      switch (strategy) {
      case 'diagonal':
        puzzle = this._removeDiagonalNumbers(solution, difficulty)
        break
      case 'symmetric':
        puzzle = this._removeSymmetricNumbers(solution, difficulty)
        break
      default:
        puzzle = this._removeNumbers(solution, difficulty)
      }

      return puzzle
    } catch (error) {
      console.error('生成数独谜题失败:', error)
      throw error
    }
  },

  /**
     * 对角线方式移除数字
     * @private
     * @param {Array<Array<number>>} solution - 完整解决方案
     * @param {string} difficulty - 难度级别
     * @returns {Array<Array<number>>} 生成的谜题
     */
  _removeDiagonalNumbers(solution, difficulty) {
    const puzzle = solution.map(row => [...row])
    const cellsToRemove = this._getDifficultyRemovalCount(difficulty)

    // 获取对角线位置
    const diagonalPositions = []
    for (let i = 0; i < 9; i++) {
      // 主对角线
      diagonalPositions.push([i, i])
      // 副对角线
      diagonalPositions.push([i, 8 - i])
    }

    // 随机打乱对角线位置
    this._shuffleArray(diagonalPositions)

    // 首先移除对角线上的数字
    let removed = 0
    for (const [row, col] of diagonalPositions) {
      if (removed >= cellsToRemove) break

      const temp = puzzle[row][col]
      puzzle[row][col] = 0

      if (this._hasUniqueSolution(puzzle)) {
        removed++
      } else {
        puzzle[row][col] = temp
      }
    }

    // 如果还需要移除更多数字，随机移除非对角线位置的数字
    if (removed < cellsToRemove) {
      const remainingPositions = []
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (!diagonalPositions.some(([r, c]) => r === i && c === j)) {
            remainingPositions.push([i, j])
          }
        }
      }

      this._shuffleArray(remainingPositions)

      for (const [row, col] of remainingPositions) {
        if (removed >= cellsToRemove) break

        const temp = puzzle[row][col]
        puzzle[row][col] = 0

        if (this._hasUniqueSolution(puzzle)) {
          removed++
        } else {
          puzzle[row][col] = temp
        }
      }
    }

    return puzzle
  },

  /**
     * 对称方式移除数字
     * @private
     * @param {Array<Array<number>>} solution - 完整解决方案
     * @param {string} difficulty - 难度级别
     * @returns {Array<Array<number>>} 生成的谜题
     */
  _removeSymmetricNumbers(solution, difficulty) {
    const puzzle = solution.map(row => [...row])
    const cellsToRemove = this._getDifficultyRemovalCount(difficulty)
    let removed = 0

    // 获取所有可能的对称位置对
    const symmetricPairs = []
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        // 计算对称位置
        const symRow = 8 - i
        const symCol = 8 - j
        // 避免重复添加对称对
        if (i < symRow || (i === symRow && j < symCol)) {
          symmetricPairs.push([[i, j], [symRow, symCol]])
        }
      }
    }

    // 随机打乱对称对的顺序
    this._shuffleArray(symmetricPairs)

    // 尝试移除对称位置的数字
    for (const [[row1, col1], [row2, col2]] of symmetricPairs) {
      if (removed >= cellsToRemove) break

      const temp1 = puzzle[row1][col1]
      const temp2 = puzzle[row2][col2]

      // 同时移除对称位置的数字
      puzzle[row1][col1] = 0
      puzzle[row2][col2] = 0

      if (this._hasUniqueSolution(puzzle)) {
        removed += 2
      } else {
        // 如果没有唯一解，恢复数字
        puzzle[row1][col1] = temp1
        puzzle[row2][col2] = temp2
      }
    }

    return puzzle
  },

  /**
     * 打乱数组顺序
     * @private
     * @param {Array} array - 要打乱的数组
     */
  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  },

  /**
     * 解决数独谜题
     * @param {Array<Array<number>>} board - 数独谜题
     * @returns {Array<Array<number>>} 解决方案
     */
  async solveSudoku(board) {
    if (this._solve(board)) {
      return board
    }
    throw new Error('无法解决此数独谜题')
  },

  /**
     * 验证移动是否有效
     * @param {Array<Array<number>>} board - 当前棋盘
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {number} value - 填入的值
     * @param {Array<Array<number>>} solution - 解决方案
     * @returns {Object} 验证结果
     */
  validateMove(board, row, col, value, solution) {
    const matchesSolution = this.validateAgainstSolution(row, col, value, solution)
    const basicRulesValid = matchesSolution ? matchesSolution : this.validateBasicRules(board, row, col, value)

    return {
      isValid: basicRulesValid,
      isCorrect: matchesSolution,
      details: {
        rulesValid: basicRulesValid,
        matchesSolution: matchesSolution
      }
    }
  },

  /**
     * 验证基本规则
     * @private
     */
  validateBasicRules(board, row, col, value) {
    return this._checkRow(board, row, col, value) &&
            this._checkColumn(board, row, col, value) &&
            this._checkBox(board, row, col, value)
  },

  /**
     * 验证是否符合解法
     * @private
     */
  validateAgainstSolution(row, col, value, solution) {
    return Number(solution[row][col]) === Number(value)
  },

  /**
     * 生成完整的数独解
     * @private
     * @returns {Array<Array<number>>}
     */
  _generateSolution() {
    const board = Array(9).fill().map(() => Array(9).fill(0))

    // 随机填充第一行
    const firstRow = this._getRandomPermutation([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (let i = 0; i < 9; i++) {
      board[0][i] = firstRow[i]
    }

    // 解决剩余部分
    if (this._solve(board)) {
      return board
    }

    // 如果解决失败，重试
    return this._generateSolution()
  },

  /**
     * 获取数组的随机排列
     * @private
     */
  _getRandomPermutation(arr) {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]]
    }
    return result
  },
  /**
     * 解数独的递归算法
     * @private
     */
  _solve(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (this.validateBasicRules(board, row, col, num)) {
              board[row][col] = num
              if (this._solve(board)) {
                return true
              }
              board[row][col] = 0
            }
          }
          return false
        }
      }
    }
    return true
  },

  /**
     * 根据难度移除数字
     * @private
     */
  _removeNumbers(solution, difficulty) {
    const puzzle = solution.map(row => [...row])
    const cellsToRemove = this._getDifficultyRemovalCount(difficulty)
    const positions = this._getRandomPositions(81, cellsToRemove)

    for (const pos of positions) {
      const row = Math.floor(pos / 9)
      const col = pos % 9
      const temp = puzzle[row][col]
      puzzle[row][col] = 0

      // 验证是否仍然只有一个解
      if (!this._hasUniqueSolution(puzzle)) {
        puzzle[row][col] = temp // 恢复数字
      }
    }

    return puzzle
  },

  _hasUniqueSolution(puzzle) {
    // 实现一个方法来验证数独是否有唯一解
    // 可以使用回溯算法来尝试解决数独，并计数解的数量
    let solutionCount = 0

    const solve = (board) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (this.validateBasicRules(board, row, col, num)) {
                board[row][col] = num
                solve(board)
                board[row][col] = 0
              }
            }
            return
          }
        }
      }
      solutionCount++
    }

    solve(puzzle)
    return solutionCount === 1
  },

  /**
     * 获取难度对应的移除数字数量
     * @private
     * @param {string} difficulty - 难度级别
     * @returns {number} 要移除的数字数量
     */
  _getDifficultyRemovalCount(difficulty) {
    // TODO: 根据难度级别计算移除数字数量
    const baseCounts = {
      easy: 30,
      medium: 40,
      hard: 50
    }

    const variation = 5 // 随机变化范围
    const baseCount = baseCounts[difficulty] || baseCounts.easy
    return baseCount + Math.floor(Math.random() * variation * 2) - variation
  },

  /**
     * 获取随机位置
     * @private
     */
  _getRandomPositions(total, count) {
    const positions = Array.from({ length: total }, (_, i) => i)
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]
    }
    return positions.slice(0, count)
  },

  /**
     * 检查行
     * @private
     */
  _checkRow(board, row, currentCol, value) {
    for (let col = 0; col < 9; col++) {
      if (col === currentCol) continue
      if (Number(board[row][col]) === Number(value)) return false
    }
    return true
  },

  /**
     * 检查列
     * @private
     */
  _checkColumn(board, currentRow, col, value) {
    for (let row = 0; row < 9; row++) {
      if (row === currentRow) continue
      if (Number(board[row][col]) === Number(value)) return false
    }
    return true
  },

  /**
     * 检查3x3宫格
     * @private
     */
  _checkBox(board, currentRow, currentCol, value) {
    const boxRow = Math.floor(currentRow / 3) * 3
    const boxCol = Math.floor(currentCol / 3) * 3

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (boxRow + row === currentRow && boxCol + col === currentCol) continue
        if (Number(board[boxRow + row][boxCol + col]) === Number(value)) return false
      }
    }
    return true
  },
  /**
     * 检查游戏是否完成
     * @param {Array<Array<number>>} userProgress - 当前游戏进度
     * @param {Array<Array<number>>} solution - 正确解法
     * @param {Object} gameState - 游戏状态
     * @returns {boolean} 是否完成
     */
  isGameCompleted(userProgress, solution, gameState) {
    try {
      // 检查是否有空格
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (userProgress[row][col] === 0) {
            return false
          }
        }
      }

      // 检查是否与解法匹配
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (Number(userProgress[row][col]) !== Number(solution[row][col])) {
            return false
          }
        }
      }

      return true
    } catch (error) {
      console.error('检查游戏完成状态失败:', error)
      return false
    }
  },

  async checkGameComplete(gameState) {
    return await achievementManager.checkAchievements(gameState)
  }

}

module.exports = GameService
