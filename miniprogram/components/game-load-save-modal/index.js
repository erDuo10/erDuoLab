Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    difficulty: {
      type: String,
      value: 'easy'
    },
    saveTime: {
      type: String,
      value: ''
    },
    gameTime: {
      type: Number,
      value: 0
    }
  },

  data: {
    difficultyText: ''
  },

  observers: {
    'difficulty': function(difficulty) {
      const difficultyMap = {
        'easy': '简单',
        'medium': '中等',
        'hard': '困难'
      }
      this.setData({
        difficultyText: difficultyMap[difficulty] || difficulty
      })
    }
  },

  methods: {
    onContinueGame() {
      this.triggerEvent('continue')
    },

    onNewGame() {
      this.triggerEvent('newgame')
    },

    _formatTime(seconds) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}分${remainingSeconds}秒`
    }
  }
})
