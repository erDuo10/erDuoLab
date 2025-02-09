Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '游戏结束'
    },
    errorCount: {
      type: Number,
      value: 0
    },
    maxErrors: {
      type: Number,
      value: 3
    }
  },

  methods: {
    onRestart() {
      this.triggerEvent('restart');
    },

    onBackToMenu() {
      this.triggerEvent('backtomenu');
    }
  }
}); 