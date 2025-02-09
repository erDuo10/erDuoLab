Page({
  data: {
    difficulties: [
      { key: 'easy', name: '简单' },
      { key: 'medium', name: '中等' },
      { key: 'hard', name: '困难' }
    ],
    statistics: null,
    achievements: null,
    coins: 0
  },

  onLoad() {
    this.loadUserData()
  },

  async loadUserData() {
    try {
      // 并行加载所有数据
      const [statistics, achievements, coins] = await Promise.all([
        wx.cloud.callFunction({
          name: 'duoGameStatistics',
          data: { $url: 'getStatistics' }
        }),
        wx.cloud.callFunction({
          name: 'duoAchievement',
          data: { type: 'getAchievementStats' }
        }),
        wx.cloud.callFunction({
          name: 'duoCoins',
          data: { action: 'getUserCoins' }
        })
      ])

      this.setData({
        statistics: statistics.result.data,
        achievements: achievements.result.data,
        coins: coins.result.data.coins
      })

    } catch (error) {
      console.error('加载用户数据失败:', error)
    }
  },

  onStartGame(event) {
    const { difficulty } = event.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/game/game?difficulty=${difficulty}`
    })
  },

  onNavigateToAchievements() {
    wx.navigateTo({
      url: '/pages/achievements/achievements'
    })
  },
  // 添加分享功能
  onShareAppMessage() {
    return {
      title: '来玩数独吧！提升逻辑思维能力的最佳游戏',
      path: '/pages/index/index',
      imageUrl: '/images/lucky.png' // 建议添加一张分享封面图
    }
  }
})