/**
 * 提示按钮组件
 * @description 用于显示和控制提示次数的按钮组件
 */
Component({
  /**
   * 组件属性
   */
  properties: {
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 剩余提示次数
    count: {
      type: Number,
      value: 3,
      observer: function(newVal) {
        // 确保count不小于0
        if (newVal < 0) {
          this.setData({ count: 0 });
        }
      }
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 点击事件处理
     * @description 当按钮可用且count>0时触发hint事件
     */
    onTap() {
      if (this.properties.disabled || this.properties.count <= 0) return;
      this.triggerEvent('hint');
    }
  }
});