/**
 * 数独游戏主页面
 * @description 整合游戏核心逻辑、交互、样式、存储和UI模块
 */

// 模块导入
const GameCore = require('./game-core')
const GameInteraction = require('./game-interaction')
const GameUI = require('./game-ui')
const Logger = require('../../utils/helpers/logger')
const GameStorage = require('./game-storage')
const DUO_CONFIG = require('../../duo')

Page({
  /**
     * 页面初始数据
     */
  data: {
    // 游戏状态
    gameState: GameCore.createInitialState(),
    // 样式状态
    styleState: {
      selectedCell: null,
      highlightedCells: {},
      cellStatus: {},
      hintCells: {},
      notes: {}
    },
    error: null,
    autoSaveInterval: null,
    cloudSyncInterval: null,
    lastInput: Date.now(),
    achievementNotification: {
      show: false,
      data: null
    },
    gameCompleteModal: {
      visible: false,
      difficulty: '',
      timeSpent: 0
    },
    gameRestartModal: {
      visible: false,
      errorCount: 0,
      maxErrors: 3
    },
    loadSaveModal: {
      visible: false,
      difficulty: '',
      saveTime: '',
      gameTime: 0
    },
    pageState: {
      isInitializing: true,
      showLoadSaveDialog: false,
      showGameUI: false,
      loadingText: '准备中...'
    },
    showAd: false,
    adUnitId: DUO_CONFIG.ads.game.bannerAdId,
    adLoadError: false
  },

  /**
     * =========== 生命周期函数 ===========
     */
  async onLoad(options) {

    try {
      const app = getApp()

      // 等待系统初始化完成
      await app.waitForSystemReady()

      // 添加重试机制
      await this.initializeGameWithRetry(options)

      // 根据条件决定是否显示广告
      this.initAd()

      // 记录游戏次数
      this.recordGameCount()

      this.setupAutoSave()
      this.setupCloudSync()

    } catch (error) {
      Logger.error('Game initialization failed:', error)
      GameUI.showError('游戏初始化失败，请重试', {
        duration: 2000,
        complete: () => {
          setTimeout(() => wx.navigateBack(), 2000)
        }
      })
    } finally {
      GameUI.hideLoading()
    }
  },

  onUnload() {
    GameCore.handlePageUnload(this)

    // 清理历史记录
    if (this.data.historyManager) {
      this.data.historyManager.clear()
    }


    if (this.achievementNotification) {
      this.achievementNotification.clearNotification()
    }

    // 清理定时器
    if (this.data.autoSaveInterval) {
      clearInterval(this.data.autoSaveInterval)
    }
    if (this.data.cloudSyncInterval) {
      clearInterval(this.data.cloudSyncInterval)
    }
    // 退出时强制云存储
    GameStorage.autoSave(this, true)
  },

  setupAutoSave() {
    // 本地自动保存 - 较频繁（每30秒）
    const autoSaveInterval = setInterval(() => {
      GameStorage.autoSave(this, false) // 使用本地存储
    }, 30000)

    this.setData({ autoSaveInterval })
  },

  setupCloudSync() {
    // 云同步 - 较少（每5分钟）
    const cloudSyncInterval = setInterval(() => {
      if (this.data.gameState) {
        GameStorage.syncToCloud(this.data.gameState)
      }
    }, 5 * 60000)

    this.setData({ cloudSyncInterval })
  },

  initAd() {
    // 根据条件决定是否显示广告
    if (this.checkAdConditions()) {
      this.setData({
        showAd: true,
        adLoadError: false
      })
    } else {
      this.setData({
        showAd: false,
        adLoadError: false
      })
    }
  },


  /**
   * 记录游戏次数
   * @description 仅在游戏开始时增加计数，每日0点重置
   */
  recordGameCount() {
    try {
      const storageKey = 'sudoku_game_count'
      const lastUpdateKey = 'sudoku_game_count_date'

      // 获取当前日期（年-月-日格式）
      const today = new Date().toISOString().split('T')[0]
      const lastUpdate = wx.getStorageSync(lastUpdateKey)

      // 检查是否需要重置计数（日期变化）
      if (lastUpdate !== today) {
        // 新的一天，重置计数
        wx.setStorageSync(storageKey, 1)  // 当前这局算第一局
        wx.setStorageSync(lastUpdateKey, today)
        Logger.info('游戏次数已重置，新的一天第1局')
        return 1
      }

      // 同一天，增加计数
      const gameCount = wx.getStorageSync(storageKey) || 0
      wx.setStorageSync(storageKey, gameCount + 1)

      Logger.info('游戏次数已更新:', gameCount + 1)
      return gameCount + 1

    } catch (error) {
      Logger.error('记录游戏次数失败:', error)
      return 0
    }
  },

  /**
   * 获取今日游戏次数
   */
  getGameCount() {
    try {
      const storageKey = 'sudoku_game_count'
      const lastUpdateKey = 'sudoku_game_count_date'

      // 检查日期是否是今天
      const today = new Date().toISOString().split('T')[0]
      const lastUpdate = wx.getStorageSync(lastUpdateKey)

      // 如果不是今天的数据，返回0
      if (lastUpdate !== today) {
        return 0
      }

      return wx.getStorageSync(storageKey) || 0
    } catch (error) {
      Logger.error('获取游戏次数失败:', error)
      return 0
    }
  },

  /**
   * 检查是否满足显示广告的条件
   * @returns {boolean} 是否显示广告
   */
  checkAdConditions() {
    try {
      // 1. 获取全局配置
      const app = getApp()
      const { adConfig } = app.globalData

      // 2. 基础条件检查
      if (!adConfig?.enabled) return false  // 广告功能总开关

      // 3. 游戏相关条件
      const { gameState } = this.data
      if (!gameState) return false

      // 4. 频率控制
      const now = Date.now()
      const lastAdTime = wx.getStorageSync('lastAdShowTime') || 0
      const minInterval = adConfig?.minInterval || 5 * 60 * 1000  // 默认5分钟
      if (now - lastAdTime < minInterval) return false

      // 5. 游戏进度条件
      // 获取游戏次数进行判断
      const gameCount = this.getGameCount()
      const minGames = 3  // 至少玩3局后显示广告
      if (gameCount < minGames) return false

      // 6. 时间段控制
      const hour = new Date().getHours()
      if (hour < 7 || hour > 23) return false  // 避免深夜显示广告

      // 9. 随机因素（控制整体显示概率）
      const showProbability = adConfig?.probability || 0.7  // 默认70%概率
      if (Math.random() > showProbability) return false

      // 10. 记录广告时间
      wx.setStorageSync('lastAdShowTime', now)

      return true

    } catch (error) {
      Logger.error('检查广告条件时出错:', error)
      return false  // 出错时不显示广告
    }
  },

  onAdError(err) {
    this.setData({
      showAd: false,
      adLoadError: true
    })
  },

  onAdLoad() {
    this.setData({
      adLoadError: false,
      showAd: true
    })
  },

  // 新增：带重试机制的游戏初始化
  async initializeGameWithRetry(options, maxRetries = 3) {
    let retryCount = 0

    while (retryCount < maxRetries) {
      try {
        await this.initializeGameComponents(options)
        return
      } catch (error) {
        retryCount++
        Logger.warn(`Game initialization attempt ${retryCount} failed:`, error)

        if (retryCount === maxRetries) {
          throw new Error(`Failed to initialize game after ${maxRetries} attempts`)
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }
  },

  // 优化初始化游戏组件的方法
  async initializeGameComponents(options) {
    const app = getApp()

    this.setData({
      'pageState.isInitializing': true,
      'pageState.showLoadSaveDialog': false,
      'pageState.showGameUI': false,
      error: null
    })

    try {
      // 系统就绪检查
      if (!app.isSystemReady()) {
        throw new Error('系统未就绪，请稍后重试')
      }

      // 初始化状态检查
      const initStatus = {
        achievementSystem: false,
        gameState: false,
        gameCore: false
      }

      // 初始化成就通知
      this.achievementNotification = app.globalData.achievementNotification
      initStatus.achievementSystem = true

      initStatus.gameState = true

      // 获取游戏参数
      const difficulty = options.difficulty || 'easy'
      const isNewGame = options.newGame === 'true'

      // 初始化游戏核心（不设置超时）
      await GameCore.initializeGame(this, difficulty, isNewGame)
      initStatus.gameCore = true

      // 更新页面标题
      GameUI.updatePageTitle(difficulty)

      // 初始化历史记录
      GameCore.initHistory(this)

      // 设置完成状态
      this.setData({
        'pageState.isInitializing': false,
        'pageState.showGameUI': true
      })

    } catch (error) {
      Logger.error('游戏初始化失败:', error)

      // 显示具体错误信息
      this.setData({
        error: error.message || '游戏初始化失败，请重试'
      })

      // 只有在非用户交互相关错误时才自动返回
      if (!error.message?.includes('用户交互') && !error.message?.includes('加载存档')) {
        setTimeout(() => {
          wx.navigateBack()
        }, 2000)
      }

      throw error
    }
  },

  /**
     * =========== 事件处理函数 ===========
     */


  // 处理模态框的新游戏按钮点击
  handleModalNewGame() {
    this.setData({
      'achievementNotification.show': false
    })
    GameUI.hideGameCompleteDialog(this, { confirm: false })
  },

  // 处理模态框的返回菜单按钮点击
  handleModalBackToMenu() {
    this.setData({
      'achievementNotification.show': false
    })
    GameUI.hideGameCompleteDialog(this, { confirm: true })
  },

  // 处理重新开始
  handleModalRestart() {
    GameUI.hideGameOverDialog(this, { confirm: true })
  },

  // 处理返回菜单
  handleModalRestartBackToMenu() {
    GameUI.hideGameOverDialog(this, { confirm: false })
  },


  // 处理继续游戏
  handleLoadSaveContinue() {
    GameUI.hideLoadSaveDialog(this, { confirm: true })
  },

  // 处理新游戏
  handleLoadSaveNew() {
    GameUI.hideLoadSaveDialog(this, { confirm: false })
  },

  onAchievementNotificationHide() {
    // 检查页面是否已经卸载
    if (!this || !this.setData) return

    try {
      this.setData({
        'achievementNotification.show': false
      })
    } catch (error) {
      Logger.error('Failed to hide achievement notification:', error)
    }
  },

  // 单元格点击
  handleCellTap(event) {
    if (this._isProcessing) return

    try {
      this._isProcessing = true
      GameInteraction.handleCellTap(this, event)
    } finally {
      setTimeout(() => {
        this._isProcessing = false
      }, 100)
    }
  },

  // 数字选择
  handleNumberSelect(event) {
    // 添加防重复点击
    if (this._isProcessing) return

    try {
      this._isProcessing = true
      GameInteraction.handleNumberSelect(this, event)
    } finally {
      // 确保处理完成后重置状态
      setTimeout(() => {
        this._isProcessing = false
      }, 100) // 添加小延迟防止连击
    }
  },

  // 提示按钮点击
  handleHint() {
    GameInteraction.handleHint(this)
  },

  // 计时器 更新 触发器
  handleTimeUpdate(event) {
    const { seconds } = event.detail
    this.setData({
      'gameState.timeSpent': seconds
    });
  },

  // 暂停按钮点击
  handlePause() {
    GameCore.pauseGame(this)
  },

  // 继续游戏
  handleResume() {
    GameCore.resumeGame(this)
  },

  // 重新开始
  handleRestart() {
    GameCore.restartGame(this)
  },

  // 返回菜单
  handleBackToMenu() {
    GameUI.showModal({
      title: '确认返回',
      content: '当前进度将会保存，确定要返回吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  },

  /**
     * =========== 组件事件处理 ===========
     */

  // 计时器更新
  onTimerUpdate(event) {
    const { timeSpent } = event.detail
    GameCore.updateGameState(this, { timeSpent })
  },

  // 笔记模式切换
  onNoteModeChange(event) {
    const { isNoteMode } = event.detail
    GameCore.updateGameState(this, { isNoteMode })
  },

  /**
     * =========== 自定义方法 ===========
     */

  // 更新游戏状态
  updateGameState(updates) {
    GameCore.updateGameState(this, updates)
  },

  // 显示提示
  showToast(message, type = 'none') {
    GameUI.showToast(message, type)
  },

  /**
 * 处理撤销操作
 */
  handleUndo() {
    GameCore.undo(this)
  },

  /**
     * 处理重做操作
     */
  handleRedo() {
    GameCore.redo(this)
  },


  // 添加分享到朋友圈的配置（可选）
  onShareTimeline() {
    const { gameState } = this.data
    const difficulty = gameState?.difficulty || 'easy'

    return {
      title: `来挑战数独吧！`,
      query: `difficulty=${difficulty}&newGame=true`,
      imageUrl: '/images/sudoku-game.png'
    }
  },

  // 添加小程序分享配置
  onShareAppMessage() {
    const { gameState } = this.data
    const difficulty = gameState?.difficulty || 'easy'
    const timeSpent = gameState?.timeSpent || 0

    return {
      title: `我正在玩数独游戏，用时${this.formatTime(timeSpent)}，来挑战吧！`,
      path: `/pages/game/game?difficulty=${difficulty}&newGame=true`,
      imageUrl: '/images/sudoku-game.png' // 确保添加分享图片
    }
  },

  // 获取难度的中文描述
  getDifficultyText(difficulty) {
    const difficultyMap = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
      expert: '专家'
    }
    return difficultyMap[difficulty] || '简单'
  },

  // 格式化时间
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }


})
