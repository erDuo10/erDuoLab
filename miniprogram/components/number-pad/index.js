/**
 * 数独键盘组件
 * @description 提供1-9数字输入和清除功能的键盘组件
 */
Component({
  /**
   * 组件属性
   */
  properties: {
    disabled: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件数据
   */
  data: {
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 数字按键点击处理
     * @param {Object} event - 点击事件对象
     * @param {Object} event.currentTarget.dataset - 包含按键数字信息
     * @param {number} event.currentTarget.dataset.number - 按键数字(0-9)
     */
    onTapNumber(event) {
      if (this.properties.disabled) {
        console.warn('Number pad is disabled');
        return;
      }

      const { number } = event.currentTarget.dataset;
      this.triggerEvent('numberselect', { number });
    }
  }
});