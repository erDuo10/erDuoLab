/**
 * 历史记录管理服务
 * @module HistoryManager
 * @description 管理游戏操作的历史记录，支持撤销和重做功能
 */

const HistoryManager = {
  /**
     * 创建新的历史管理器实例
     * @returns {Object} 历史管理器实例
     */
  create() {
    return {
      history: [],           // 操作历史记录
      currentIndex: -1,      // 当前历史位置
      maxHistory: 50,        // 最大历史记录数

      /**
             * 添加新的操作记录
             * @param {Object} operation - 操作记录
             */
      addOperation(operation) {
        // 清除当前位置之后的历史
        if (this.currentIndex < this.history.length - 1) {
          this.history = this.history.slice(0, this.currentIndex + 1)
        }

        // 添加新操作
        this.history.push({
          ...operation,
          timestamp: Date.now()
        })

        // 维护历史长度
        if (this.history.length > this.maxHistory) {
          this.history.shift()
        } else {
          this.currentIndex = this.history.length - 1
        }
      },

      /**
             * 撤销操作
             * @returns {Object|null} 被撤销的操作
             */
      undo() {
        if (!this.canUndo()) return null
        const operation = this.history[this.currentIndex]
        this.currentIndex--
        return operation
      },

      /**
             * 重做操作
             * @returns {Object|null} 被重做的操作
             */
      redo() {
        if (!this.canRedo()) return null
        this.currentIndex++
        return this.history[this.currentIndex]
      },

      /**
             * 检查是否可以撤销
             * @returns {boolean}
             */
      canUndo() {
        return this.currentIndex >= 0
      },

      /**
             * 检查是否可以重做
             * @returns {boolean}
             */
      canRedo() {
        return this.currentIndex < this.history.length - 1
      },

      /**
             * 清空历史记录
             */
      clear() {
        this.history = []
        this.currentIndex = -1
      },

      /**
             * 获取当前历史状态
             * @returns {Object} 历史状态信息
             */
      getState() {
        return {
          totalOperations: this.history.length,
          currentPosition: this.currentIndex,
          canUndo: this.canUndo(),
          canRedo: this.canRedo()
        }
      },
      /**
             * 获取当前操作
             * @returns {Object|null} 当前操作记录
             */
      getCurrentOperation() {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
          return this.history[this.currentIndex]
        }
        return null
      },

      /**
             * 获取最后一次操作
             * @returns {Object|null} 最后一次操作记录
             */
      getLastOperation() {
        if (this.history.length > 0) {
          return this.history[this.history.length - 1]
        }
        return null
      },
    }
  }
}

module.exports = HistoryManager
