const FlowerRenderer = require('../../../utils/fuka/core/rendererFlower')

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
        isReady: false,          // 新增
        pendingFukaData: null    // 新增
    },

    lifetimes: {
        attached() {
            const renderer = new FlowerRenderer()
            const { width, height } = renderer.scaler.calculatePreviewSize()

            this.renderer = renderer    // 新增：保存renderer实例

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

        detached() {             // 新增
            if (this.renderer) {
                this.renderer = null
            }
        }
    },

    methods: {
        async onFukaDataChange(newVal) {
            if (!newVal) return

            if (!this.data.isReady) {      // 新增：检查组件是否准备就绪
                this.setData({ pendingFukaData: newVal })
                return
            }

            try {
                const offscreenCanvas = await this.renderer.render(newVal, 'preview')

                this.updateCanvas(offscreenCanvas)
            } catch (error) {
                console.error('渲染花瓣福卡预览失败:', error)
            }
        },

        async updateCanvas(offscreenCanvas) {
            const query = wx.createSelectorQuery().in(this)
            query.select('#previewCanvas')
                .fields({ node: true, size: true })
                .exec((res) => {
                    if (!res || !res[0] || !res[0].node) {    // 新增：错误处理
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