/**
 * 计时器组件
 * @description 提供计时功能的组件，支持开始、暂停和重置
 */
Component({
  /**
   * 组件属性
   */
  properties: {
    running: {
      type: Boolean,
      value: false,
      observer: function (newVal) {
        if (newVal) {
          this._startTimer();
        } else {
          this._stopTimer();
        }
      }
    },
    // 添加初始时间属性
    initialSeconds: {
      type: Number,
      value: 0,
      observer: function (newVal) {
        // 只需更新 seconds，displayTime 会自动更新
        this.setData({ seconds: newVal });
      }
    }
  },

  /**
   * 组件数据
   */
  data: {
    seconds: 0,
    displayTime: '00:00'
  },

  observers: {
    // 添加数据监听器，当 seconds 变化时自动更新 displayTime
    'seconds': function (seconds) {
      this.setData({
        displayTime: this._formatTime(seconds)
      });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件加载时只需设置 seconds
      this.setData({ seconds: this.properties.initialSeconds });
    },

    detached() {
      this._stopTimer();
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 启动计时器
     * @private
     */
    _startTimer() {
      if (this._timer) return;

      this._timer = setInterval(() => {
        const newSeconds = this.data.seconds + 1;
        // this.setData({
        //   seconds: newSeconds,
        //   displayTime: this._formatTime(newSeconds)
        // });
        this.setData({ seconds: newSeconds });
        this.triggerEvent('timeupdate', { seconds: newSeconds });
      }, 1000);
    },

    /**
     * 停止计时器
     * @private
     */
    _stopTimer() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
    },

    /**
     * 格式化时间
     * @private
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串 (MM:SS)
     */
    _formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * 重置计时器
     * @public
     */
    reset() {
      this.setData({
        seconds: 0,
        // displayTime: '00:00'
      });
    }
  }
});
