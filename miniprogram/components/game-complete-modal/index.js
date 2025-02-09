Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '恭喜完成！'
    },
    difficulty: {
      type: String,
      value: 'easy'
    },
    timeSpent: {
      type: Number,
      value: 0
    }
  },

  data: {
    difficultyText: '',
    timeText: ''
  },

  observers: {
    'difficulty, timeSpent': function(difficulty, timeSpent) {
      // 更新难度文本
      const difficultyMap = {
        'easy': '简单',
        'medium': '中等',
        'hard': '困难'
      };
      
      // 格式化时间
      const minutes = Math.floor(timeSpent / 60);
      const seconds = timeSpent % 60;
      const timeText = `${minutes}分${seconds}秒`;

      this.setData({
        difficultyText: difficultyMap[difficulty] || difficulty,
        timeText
      });
    }
  },

  methods: {
    onNewGame() {
      this.triggerEvent('newgame');
    },

    onBackToMenu() {
      this.triggerEvent('backtomenu');
    }
  }
}); 