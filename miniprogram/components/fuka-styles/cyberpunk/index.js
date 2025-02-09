const CyberpunkRenderer = require('../../../utils/fuka/core/renderercyberpunk')


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
      const renderer = new CyberpunkRenderer()
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
        const offscreenCanvas = await this.renderer.render(newVal, 'preview')

        this.updateCanvas(offscreenCanvas)
      } catch (error) {
        console.error('渲染赛博朋克福卡预览失败:', error)
      }
    },

    async updateCanvas(offscreenCanvas) {
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

          canvas.width = offscreenCanvas.width
          canvas.height = offscreenCanvas.height

          ctx.drawImage(offscreenCanvas, 0, 0)
        })
    },

    async getPixelData() {
      return this.data.fukaData
    }
  }
})
