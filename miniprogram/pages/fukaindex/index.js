const CARDS_CACHE_KEY = 'cards_cache'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000

// 定义常量
const GENERATE_CONFIG = {
  ERROR_MESSAGES: {
    INVALID_INPUT: '请选择福卡样式和类型',
    NETWORK_ERROR: '网络异常，请重试',
    GENERATE_ERROR: '生成失败，请重试'
  }
}

// 验证器
const FukaValidator = {
  validateInputs(style, category) {
    return Boolean(style && category)
  }
}

const DUO_CONFIG = require('../../duo')

Page({
  data: {
    videoAd: null,
    currentIndex: 0, // 当前卡片索引
    selectedStyle: 'pixel',
    selectedCategory: 'all', // 当前选择的分类
    categories: [
      { id: 'all', name: '全部' },
      { id: 'health', name: '健康' },
      { id: 'family', name: '家庭' },
      { id: 'wealth', name: '财富' },
      { id: 'work', name: '事业' },
      { id: 'friendship', name: '友情' },
      { id: 'love', name: '爱情' },
      { id: 'study', name: '学业' }
    ],
    cards: [], // 将从云存储加载
    currentBlessings: [], // 当前卡片对应的祝福语列表
    blessingsCache: {},
    isRefreshing: false,
    isLoading: true,
    imageLoadStatus: {}, // 记录图片加载状态
    fukaGenerateAdId: DUO_CONFIG.ads.fuka.generateAdId,
    shareConfig: {
      title: '福卡设计师 - 定制你的新年祝福',
      path: '/pages/fukaindex/index'
    }
  },
  async onLoad() {
    const randomIndex = Math.floor(Math.random() * 6)

    this.setData({
      currentIndex: randomIndex,
      selectedStyle: ['pixel', 'cyberpunk', 'slot', 'ink', 'flower', 'redPacket'][randomIndex]
    })

    wx.showLoading({ title: '加载中...' })
    try {
      await this.loadCloudResources()
      await this.loadBlessings('all')
      await this.updateBlessings(randomIndex)

      await this.initVideoAd()
    } catch (error) {
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
      this.setData({ isLoading: false })
    }
  },

  getRandomInt() {
    return Math.floor(Math.random() * 6) // 返回 0-5 的随机整数
  },

  // 加载云存储资源
  async loadCloudResources() {
    try {
      // 1. 检查缓存
      const cachedCards = this.getCardsFromCache()
      if (cachedCards) {
        this.setData({ cards: cachedCards })
        // 预加载当前和下一张图片
        this.preloadInitialImages(cachedCards)
        return
      }

      // 2. 从云端获取
      const cards = [
        { id: 'pixel', cloudPath: 'pixel.png', wordsNum: 1 },
        { id: 'cyberpunk', cloudPath: 'cyberpunk.png', wordsNum: 2 },
        { id: 'slot', cloudPath: 'slot.png', wordsNum: 1 },
        { id: 'ink', cloudPath: 'ink.png', wordsNum: 4 },
        { id: 'flower', cloudPath: 'flower.png', wordsNum: 6 },
        { id: 'redPacket', cloudPath: 'redPacket.png', wordsNum: 2 }
      ]

      // 3. 获取临时访问链接
      const cardsWithUrls = await Promise.all(cards.map(async card => {
        const fileID = `${DUO_CONFIG.cloudStorage.baseUrl}${DUO_CONFIG.cloudStorage.paths.fuka.fukaindex}/${card.cloudPath}`
        
        const { fileList } = await wx.cloud.getTempFileURL({ fileList: [fileID] })
        return {
          ...card,
          imageUrl: fileList[0].tempFileURL
        }
      }))

      // 4. 更新状态和缓存
      this.setData({ cards: cardsWithUrls })
      this.saveCardsToCache(cardsWithUrls)

      // 5. 预加载当前和下一张图片
      this.preloadInitialImages(cardsWithUrls)

    } catch (error) {
      console.error('加载云资源失败:', error)
      throw error
    }
  },

  // 预加载初始显示需要的图片
  preloadInitialImages(cards) {
    if (!cards.length) return

    // 预加载当前图片
    this.preloadSingleImage(cards[0])

    // 预加载下一张图片
    if (cards.length > 1) {
      this.preloadSingleImage(cards[1])
    }
  },

  // 预加载单张图片
  preloadSingleImage(card) {
    // 如果已经加载过，就不重复加载
    if (this.data.imageLoadStatus[card.id] === 'loaded') {
      return Promise.resolve()
    }

    // 更新加载状态为加载中
    this.setData({
      [`imageLoadStatus.${card.id}`]: 'loading'
    })

    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: card.imageUrl,
        success: () => {
          this.setData({
            [`imageLoadStatus.${card.id}`]: 'loaded'
          })
          resolve()
        },
        fail: (error) => {
          this.setData({
            [`imageLoadStatus.${card.id}`]: 'failed'
          })
          reject(error)
        }
      })
    })
  },

  // 从缓存获取卡片数据
  getCardsFromCache() {
    const cacheData = wx.getStorageSync(CARDS_CACHE_KEY)
    if (cacheData && Date.now() - cacheData.timestamp < CACHE_EXPIRY) {
      return cacheData.data
    }
    return null
  },

  // 保存卡片数据到缓存
  saveCardsToCache(cards) {
    wx.setStorageSync(CARDS_CACHE_KEY, {
      timestamp: Date.now(),
      data: cards
    })
  },

  // 加载祝福语数据
  async loadBlessings(category) {
    // 检查缓存是否过期
    const cacheKey = `blessings_${category}`
    const cachedData = wx.getStorageSync(cacheKey)

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
      return cachedData.data
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'getBlessings',
        data: { category }
      })

      const blessings = result.result.data.map(item => item.content)

      // 更新缓存
      wx.setStorageSync(cacheKey, {
        timestamp: Date.now(),
        data: blessings
      })

      return blessings
    } catch (error) {
      console.error('加载祝福语失败:', error)
      throw error
    }
  },


  async onSwiperChange(e) {
    const current = e.detail.current
    const currentCard = this.data.cards[current]
    this.setData({
      currentIndex: current,
      selectedStyle: currentCard.id
    })
    // 更新祝福语列表
    await this.updateBlessings(current)

    // 预加载下一张图片
    const nextIndex = (current + 1) % this.data.cards.length
    const nextCard = this.data.cards[nextIndex]
    if (nextCard && this.data.imageLoadStatus[nextCard.id] !== 'loaded') {
      this.preloadSingleImage(nextCard).catch(console.error)
    }
  },

  // 更新祝福语方法
  async updateBlessings(index) {
    try {
      const currentCard = this.data.cards[index]
      const category = this.data.selectedCategory

      // 从缓存获取祝福语
      const blessings = await this.loadBlessings(category)

      if (!blessings || !blessings.length) {
        wx.showToast({
          title: '暂无祝福语',
          icon: 'none'
        })
        return
      }

      // 随机选择指定数量的祝福语
      const selectedBlessings = this.shuffleArray([...blessings])
        .slice(0, currentCard.wordsNum)

      this.setData({
        currentBlessings: selectedBlessings
      })
    } catch (error) {
      console.error('更新祝福语失败:', error)
      wx.showToast({
        title: '更新祝福语失败',
        icon: 'none'
      })
    }
  },

  async onCategorySelect(e) {
    const categoryId = e.currentTarget.dataset.id

    // 如果正在加载中或者选中的是当前分类，则不处理
    if (this.data.isLoading || categoryId === this.data.selectedCategory) {
      return
    }

    this.setData({ isLoading: true })
    wx.showLoading({
      title: '加载中...',
      mask: true  // 添加蒙层防止重复点击
    })

    try {
      await this.loadBlessings(categoryId)
      this.setData({
        selectedCategory: categoryId
      })
      await this.updateBlessings(this.data.currentIndex)
    } catch (error) {
      console.error('分类切换失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
      wx.hideLoading()
    }
  },

  /**
   * 处理福卡生成
   * @returns {Promise<void>}
   */
  async handleGenerate() {
    // 防重复点击
    if (this.data.isGenerating) {
      return
    }

    try {
      if (!FukaValidator.validateInputs(
        this.data.selectedStyle,
        this.data.selectedCategory
      )) {
        throw new Error(GENERATE_CONFIG.ERROR_MESSAGES.INVALID_INPUT)
      }

      // 2. 更新状态
      this.setData({ isGenerating: true })
      wx.showLoading({
        title: '福卡生成中...',
        mask: true // 防止用户触摸穿透
      })


      // 3. 准备生成数据
      const generateData = {
        style: this.data.selectedStyle,
        blessings: this.data.currentBlessings,
        category: this.data.selectedCategory,
        from: 'generate',
        timestamp: Date.now()
      }

      // 4. 生成福卡
      const generateResult = await wx.cloud.callFunction({
        name: 'generateFuka',
        data: generateData
      })


      if (generateResult.result.needAd) {
        wx.showModal({
          title: '友情提示',
          content: '今日免费次数已用完，观看广告获取更多机会',
          confirmText: '观看广告',
          cancelText: '明天再来',
          success: (res) => {
            if (res.confirm) {
              this.showVideoAd()
            }
          }
        })
        return
      }

      if (generateResult.result.dailyCountToLimit) {
        wx.showToast({
          title: '今日生成次数已达上限, 明天再来吧',
          icon: 'none'
        })
        return
      }

      const result = generateResult.result

      if (!result || !result.data.recordId) {
        throw new Error(GENERATE_CONFIG.ERROR_MESSAGES.GENERATE_ERROR)
      }
      generateData.cardId = result.data.recordId

      // 使用全局数据存储
      getApp().globalData = getApp().globalData || {}
      const previewKey = `preview_${Date.now()}`
      getApp().globalData[previewKey] = generateData

      // 6. 跳转预览页
      await wx.navigateTo({
        url: `/pages/preview/index?from=generate&key=${previewKey}`
      })

      // 设置数据清理定时器（5分钟后清理）
      setTimeout(() => {
        if (getApp().globalData[previewKey]) {
          delete getApp().globalData[previewKey]
        }
      }, 5 * 60 * 1000)

    } catch (error) {
      console.error('生成福卡失败:', error)

      // 错误处理
      wx.showToast({
        title: error.message || GENERATE_CONFIG.ERROR_MESSAGES.NETWORK_ERROR,
        icon: 'none',
        duration: 2000
      })

    } finally {
      // 状态重置
      this.setData({ isGenerating: false })
      wx.hideLoading()
    }
  },


  async onRefreshBlessings() {
    // 设置刷新状态，触发动画
    this.setData({ isRefreshing: true })

    try {
      const currentCard = this.data.cards[this.data.currentIndex]
      const category = this.data.selectedCategory

      // 获取祝福语
      const blessings = await this.loadBlessings(category)

      if (!blessings || !blessings.length) {
        wx.showToast({
          title: '暂无祝福语',
          icon: 'none'
        })
        return
      }

      // 随机选择指定数量的祝福语
      const selectedBlessings = this.shuffleArray([...blessings])
        .slice(0, currentCard.wordsNum)

      this.setData({
        currentBlessings: selectedBlessings,
        selectedBlessing: null
      })

    } catch (error) {
      console.error('刷新祝福语失败:', error)
      wx.showToast({
        title: '刷新失败，请重试',
        icon: 'none'
      })
    } finally {
      // 800ms后重置刷新状态（与动画时长相匹配）
      setTimeout(() => {
        this.setData({ isRefreshing: false })
      }, 800)
    }
  },

  onRefreshBlessingsWithDebounce() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
    }

    this.refreshTimeout = setTimeout(() => {
      this.onRefreshBlessings()
    }, 100)
  },

  /**
 * 优化的数组随机打乱方法
 * @param {Array} array - 要打乱的数组
 * @returns {Array} 打乱后的数组
 */
  shuffleArray(array) {
    if (!Array.isArray(array) || array.length <= 1) return array

    const shuffled = [...array]
    const length = shuffled.length

    // Fisher-Yates 算法
    for (let i = length - 1; i > 0; i--) {
      const rand = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[rand]] = [shuffled[rand], shuffled[i]]
    }

    return shuffled
  },


  // 广告相关
  async initVideoAd() {
    if (wx.createRewardedVideoAd) {
      this.videoAd = wx.createRewardedVideoAd({
        adUnitId: this.data.fukaGenerateAdId
      })

      this.videoAd.onLoad(() => {
        console.log('激励视频广告加载成功')
      })

      this.videoAd.onError((err) => {
        console.error('激励视频广告加载失败', err)
      })

      this.videoAd.onClose((res) => {
        if (res && res.isEnded) {
          this.handleAdSuccess()
        } else {
          wx.showToast({
            title: '需要完整观看广告才能获得奖励',
            icon: 'none'
          })
        }
      })
    }
  },

  // 处理广告观看成功
  async handleAdSuccess() {
    wx.showLoading({ title: '领取奖励中...' })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'updateUserAdReward',
        data: {
          timestamp: Date.now()
        }
      })

      if (result.success) {
        setTimeout(() => {
          wx.showToast({
            title: `获得${result.data.adRewardCount}次生成机会`,
            icon: 'success'
          })
        }, 100)
      }
    } catch (error) {
      console.error('更新广告奖励失败:', error)
      setTimeout(() => {
        wx.showToast({
          title: '领取奖励失败',
          icon: 'none'
        })
      }, 100)
    } finally {
      wx.hideLoading()
    }
  },


  async showVideoAd() {
    if (!this.videoAd) {
      wx.showToast({
        title: '广告组件未初始化',
        icon: 'none'
      })
      return
    }

    try {
      await this.videoAd.show()
    } catch (error) {
      await this.videoAd.load()
      await this.videoAd.show()
    }
  },


  /**
 * 用户点击右上角分享
 */
  onShareAppMessage() {
    return {
      title: this.data.shareConfig.title,
      path: this.data.shareConfig.path,
      imageUrl: `${DUO_CONFIG.cloudStorage.baseUrl}${DUO_CONFIG.cloudStorage.paths.fuka.share}/friends/${this.data.selectedStyle}.png`,
      success: () => {
        wx.showToast({
          title: '分享成功',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '分享失败',
          icon: 'none'
        })
      }
    }
  }

})
