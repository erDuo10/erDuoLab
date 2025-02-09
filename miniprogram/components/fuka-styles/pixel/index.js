const FukaRenderer = require('../../../utils/fuka/core/renderer')

Component({
  properties: {
    fukaData: {
      type: Object,
      observer: 'onFukaDataChange'
    }
  },

  data: {
    canvasWidth: 0,
    canvasHeight: 0,
    isReady: false,
    pendingFukaData: null
  },

  lifetimes: {
    attached() {
      const renderer = new FukaRenderer()
      const { width, height } = renderer.scaler.calculatePreviewSize()
      
      this.renderer = renderer
      
      this.setData({
        canvasWidth: width,
        canvasHeight: height
      }, () => {
        this.setData({ isReady: true }, () => {
          // 检查是否有等待的数据需要渲染
          if (this.data.pendingFukaData) {
            this.onFukaDataChange(this.data.pendingFukaData)
            this.setData({ pendingFukaData: null })
          }
        })
      })
    },

    detached() {
      if (this.renderer) {
        this.renderer = null
      }
    }
  },

  methods: {
    async onFukaDataChange(newVal) {
      if (!newVal) return
      if (!this.data.isReady) {
        this.setData({ pendingFukaData: newVal })
        return
      }

      try {

        // 渲染到离屏画布
        const offscreenCanvas = await this.renderer.render(newVal, 'preview')

        // 更新预览canvas
        const query = wx.createSelectorQuery().in(this)
        query.select('#previewCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {

            if (!res || !res[0] || !res[0].node) {
              console.error('Canvas节点未找到')
              return
            }
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')

            // 设置canvas尺寸
            canvas.width = offscreenCanvas.width
            canvas.height = offscreenCanvas.height

            // 绘制内容
            ctx.drawImage(offscreenCanvas, 0, 0)
          })
      } catch (error) {
        console.error('渲染福卡预览失败:', error)
      }
    },

    // 导出像素数据供保存使用
    async getPixelData() {
      return this.data.fukaData
    }
  }
})
