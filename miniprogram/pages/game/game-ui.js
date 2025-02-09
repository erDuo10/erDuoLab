/**
 * 游戏UI管理模块
 * @module GameUI
 * @description 处理游戏中所有的UI交互，包括提示、对话框、加载状态等
 */
const Logger = require('../../utils/helpers/logger')
const GameUI = {
  /**
     * 显示Toast提示
     * @param {string} title - 提示文本
     * @param {string} [icon='none'] - 图标类型
     * @param {number} [duration=1500] - 显示时长
     */
  showToast(title, icon = 'none', duration = 1500) {
    wx.showToast({
      title,
      icon,
      duration,
      fail: () => {
        // 降级处理：如果showToast失败，尝试使用showModal
        this.showModal({
          title: '提示',
          content: title,
          showCancel: false
        })
      }
    })
  },

  /**
     * 显示加载提示
     * @param {string} [title='加载中...'] - 加载提示文本
     * @param {boolean} [mask=true] - 是否显示遮罩
     */
  showLoading(title = '加载中...', mask = true) {
    wx.showLoading({
      title,
      mask
    })
  },

  /**
     * 隐藏加载提示
     */
  hideLoading() {
    wx.hideLoading()
  },

  /**
     * 显示错误提示
     * @param {Error} error - 错误对象
     * @param {string} [context='操作'] - 错误发生的上下文
     */
  showError(error, context = '操作') {
    this.showToast(`${context}失败，请重试`, 'error')
  },

  /**
     * 显示对话框
     * @param {Object} options - 对话框配置
     * @returns {Promise<Object>}
     */
  showModal(options) {
    return new Promise((resolve) => {
      wx.showModal({
        ...options,
        success: resolve,
        fail: () => resolve({ confirm: false, cancel: true })
      })
    })
  },

  /**
     * 更新页面标题
     * @param {string} difficulty - 游戏难度
     */
  updatePageTitle(difficulty) {
    const difficultyText = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    }
    wx.setNavigationBarTitle({
      title: `数独 - ${difficultyText[difficulty] || difficulty}`
    })
  },
  /**
     * 显示游戏完成对话框
     * @param {Page} page - 页面实例
     * @returns {Promise<void>}
     */
  async showGameCompleteDialog(page) {
    Logger.info('显示游戏完成对话框');

    return new Promise((resolve) => {
      try {
        // 检查页面实例
        if (!page || typeof page.setData !== 'function') {
          throw new Error('Invalid page instance');
        }

        page.setData({
          'gameCompleteModal.visible': true,
          'gameCompleteModal.difficulty': page.data.gameState.difficulty,
          'gameCompleteModal.timeSpent': page.data.gameState.timeSpent
        }, () => {
          // 在回调中保存resolve
          page._gameCompleteModalResolve = resolve;
        });
      } catch (error) {
        Logger.error('showGameCompleteDialog 显示游戏完成对话框失败:', error);
        resolve(false);
      }
    });
  },

  /**
 * 隐藏游戏完成对话框
 * @param {Page} page - 页面实例
 * @param {Object} result - 对话框结果
 */
  hideGameCompleteDialog(page, result) {
    page.setData({
      'gameCompleteModal.visible': false
    })

    // 调用保存的resolve函数
    if (page._gameCompleteModalResolve) {
      page._gameCompleteModalResolve(result)
      page._gameCompleteModalResolve = null
    }
  },

  /**
     * 显示提示确认对话框
     * @param {Page} page - 页面实例
     * @returns {Promise<boolean>} 用户是否确认使用提示
     */
  async showHintConfirmDialog(page) {
    const result = await this.showModal({
      title: '使用提示',
      content: `还剩${page.data.gameState.hintsRemaining}次提示机会，是否使用？`,
      confirmText: '使用',
      cancelText: '取消'
    })

    return result.confirm
  },

  /**
     * 格式化时间
     * @private
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串
     */
  _formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  },
  /**
 * 显示游戏结束对话框
 * @param {Page} page - 页面实例
 * @returns {Promise<Object>}
 */
  async showGameOverDialog(page) {
    return new Promise((resolve) => {
      page.setData({
        'gameRestartModal.visible': true,
        'gameRestartModal.errorCount': page.data.gameState.errorCount,
        'gameRestartModal.maxErrors': page.data.gameState.maxErrors
      })

      // 保存resolve函数，供后续回调使用
      page._gameRestartModalResolve = resolve
    })
  },

  /**
 * 隐藏游戏结束对话框
 * @param {Page} page - 页面实例
 * @param {Object} result - 对话框结果
 */
  hideGameOverDialog(page, result) {
    page.setData({
      'gameRestartModal.visible': false
    })

    // 调用保存的resolve函数
    if (page._gameRestartModalResolve) {
      page._gameRestartModalResolve(result)
      page._gameRestartModalResolve = null
    }
  },
  /**
     * 显示加载存档对话框
     * @param {Page} page - 页面实例
     * @param {string} difficulty - 游戏难度
     * @param {string} timeStr - 保存时间字符串
     * @param {number} gameTime - 游戏时长
     * @returns {Promise<Object>} 用户是否选择继续存档
     */
  async showLoadSaveDialog(page, difficulty, timeStr, gameTime) {
    return new Promise((resolve) => {
      try {
        // 检查页面实例
        if (!page || typeof page.setData !== 'function') {
          throw new Error('Invalid page instance');
        }

        page.setData({
          'loadSaveModal.visible': true,
          'loadSaveModal.difficulty': difficulty,
          'loadSaveModal.saveTime': timeStr,
          'loadSaveModal.gameTime': gameTime
        }, () => {
          // 在回调中保存resolve
          page._loadSaveModalResolve = resolve;
        });
      } catch (error) {
        Logger.error('showLoadSaveDialog 显示加载存档对话框失败:', error);
        resolve(false);
      }
    });
  },

  hideLoadSaveDialog(page, result) {
    page.setData({
      'loadSaveModal.visible': false
    })

    // 调用保存的resolve函数
    if (page._loadSaveModalResolve) {
      page._loadSaveModalResolve(result)
      page._loadSaveModalResolve = null
    }
  },

  /**
     * 显示错误动画
     * @param {Page} page - 页面实例
     */
  showErrorAnimation(page) {
    wx.vibrateShort() // 震动提示

    // 显示错误提示
    this.showToast('答案错误', 'error')
  }
}

module.exports = GameUI
