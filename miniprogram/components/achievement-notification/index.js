Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    data: {
      type: Object,
      value: null
    }
  },

  data: {
    displayAchievements: [],
    remainingCount: 0,
    animationData: {},
    isAnimating: false
  },

  lifetimes: {
    attached() {
      this._initAnimation()
    },

    detached() {
      // 清理动画相关资源
      if (this.animation) {
        this.animation = null
      }
    }
  },

  observers: {
    'show,data': function(show, data) {
      console.error('Achievement notification state changed:', {
        show,
        data
      })

      if (show && data) {
        this._processAchievements(data)
      }

      if (this.data.isAnimating) return

      if (show) {
        this.showNotification()
      } else {
        this.hideNotification()
      }
    }
  },

  methods: {
    _processAchievements(data) {
      if (!data || !data.achievements) return

      const achievements = Array.isArray(data.achievements)
        ? data.achievements
        : [data.achievements]

      // 最多显示3个成就
      const displayAchievements = achievements.slice(0, 3)
      let remainingCount = Math.max(0, achievements.length - 3)


      this.setData({
        displayAchievements,
        remainingCount
      })
    },

    _initAnimation() {
      this.animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease'
      })
    },

    async showNotification() {
      if (!this.animation) return

      this.setData({ isAnimating: true })

      try {
        const animation = this.animation
          .opacity(1)
          .translateY(0)
          .step()

        this.setData({
          animationData: animation.export()
        })

        await this._waitForAnimation()
        this.setData({ isAnimating: false })
      } catch (error) {
        console.error('Show notification animation failed:', error)
        this.setData({ isAnimating: false })
      }
    },

    async hideNotification() {
      if (!this.animation) return

      this.setData({ isAnimating: true })

      try {
        const animation = this.animation
          .opacity(0)
          .translateY(-100)
          .step()

        this.setData({
          animationData: animation.export()
        })

        await this._waitForAnimation()
        this.triggerEvent('hide')
        this.setData({
          isAnimating: false,
          displayAchievements: [],
          remainingCount: 0
        })
      } catch (error) {
        console.error('Hide notification animation failed:', error)
        this.setData({ isAnimating: false })
      }
    },

    _waitForAnimation() {
      return new Promise(resolve => setTimeout(resolve, 300))
    },

    // 点击成就图标时触发
    onAchievementTap(e) {
      const { achievement } = e.currentTarget.dataset
      this.triggerEvent('achievementTap', { achievement })
    },

    // 点击更多徽章时触发
    onMoreBadgeTap() {
      if (this.data.remainingCount > 0) {
        this.triggerEvent('moreTap', {
          totalCount: this.data.displayAchievements.length + this.data.remainingCount
        })
      }
    }
  }
})
