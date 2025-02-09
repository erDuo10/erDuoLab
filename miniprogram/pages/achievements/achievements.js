Page({
    data: {
      categories: [
        { id: 'basic_progress', name: '基础进度' },
        { id: 'difficulty', name: '难度突破' },
        { id: 'perfect', name: '完美通关' },
        { id: 'speed', name: '速度挑战' },
        { id: 'streak', name: '连续成就' }
      ],
      achievements: {},
      stats: {
        totalPoints: 0,
        earnedPoints: 0,
        totalCount: 0,
        unlockedCount: 0
      },
      currentTab: 0
    },
  
    onLoad() {
      this.loadAchievements()
    },
  
    async loadAchievements() {
      try {
        const { result } = await wx.cloud.callFunction({
          name: 'duoAchievement',
          data: {
            type: 'getAchievements'
          }
        })

        if (result.code === 0) {
          const achievements = this.groupAchievementsByCategory(result.data)
          const stats = this.calculateStats(result.data)
          this.setData({ 
            achievements,
            stats
          })
        }
      } catch (error) {
        console.error('加载成就失败:', error)
      }
    },
  
    groupAchievementsByCategory(achievements) {
      return achievements.reduce((acc, achievement) => {
        const categoryId = achievement.config.category.id
        if (!acc[categoryId]) {
          acc[categoryId] = []
        }
        acc[categoryId].push(achievement)
        return acc
      }, {})
    },
  
    calculateStats(achievements) {
      return achievements.reduce((stats, achievement) => {
        stats.totalPoints += achievement.config.points
        stats.totalCount++
        if (achievement.unlocked) {
          stats.earnedPoints += achievement.config.points
          stats.unlockedCount++
        }
        return stats
      }, {
        totalPoints: 0,
        earnedPoints: 0,
        totalCount: 0,
        unlockedCount: 0
      })
    },
    switchTab(e) {
        const index = e.currentTarget.dataset.index
        this.setData({
          currentTab: index
        })
      }
  })