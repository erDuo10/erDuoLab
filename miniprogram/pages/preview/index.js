const { fukaService } = require('../../services/fuka/card')
const FukaRenderer = require('../../utils/fuka/core/renderer')
const CyberpunkRenderer = require('../../utils/fuka/core/renderercyberpunk')
const SlotRenderer = require('../../utils/fuka/core/rendererSlot')
const InkRenderer = require('../../utils/fuka/core/rendererInk')
const FlowerRenderer = require('../../utils/fuka/core/rendererFlower')
const RedPacketRenderer = require('../../utils/fuka/core/rendererRedPacket')

Page({
  data: {
    style: '',
    blessings: [],
    category: '',
    cardId: '',
    from: '',
    cardData: null,
    isLoading: true,
    canvasContext: null,
    shareImagePath: '',
    styleComponents: {
      pixel: 'fuka-pixel',
      cyberpunk: 'fuka-cyberpunk',
      slot: 'fuka-slot',
      ink: 'fuka-ink',
      flower: 'fuka-flower',
      redPacket: 'fuka-red-packet'
    },
    buttonIcons: {
      share: '/images/lucky.png',  // 假设有一个制作/创建的图标
      generate: '/images/back.png'  // 原有的返回图标
    }
  },


  onLoad(options) {
    const { key, cardId, from } = options

    this.setData({ from })

    if (!key && !cardId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '加载中...' })

    try {
      if (from === 'generate') {
        // 从生成页面进入
        this.loadFromGenerate(key)
      } else {
        // 从分享进入
        this.loadFromShare(cardId)
      }
    } catch (error) {
      console.error('加载预览数据失败:', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 从生成页面加载数据
  async loadFromGenerate(key) {
    const previewData = getApp().globalData[key]
    if (!previewData) {
      throw new Error('预览数据已失效')
    }

    this.setData({
      cardData: previewData,
      cardId: previewData.cardId,
      isLoading: false
    }, () => {
      this.waitForComponentReady()
    })

    // 使用完立即删除全局数据
    delete getApp().globalData[key]
  },

  // 从分享页面加载数据
  async loadFromShare(cardId) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getFukaDetail',
        data: { cardId }
      })

      if (!result || !result.data) {
        throw new Error('福卡数据不存在')
      }

      // 转换数据格式
      const previewData = {
        style: result.data.style,
        blessings: result.data.blessing,
        category: result.data.category,
        from: 'share',
        timestamp: new Date(result.data.createTime).getTime(),
        cardId: result.data._id
      }

      this.setData({
        cardData: previewData,
        cardId: cardId,
        isLoading: false
      }, () => {
        this.waitForComponentReady()
      })

    } catch (error) {
      console.error('获取福卡详情失败:', error)
      throw new Error('获取福卡详情失败')
    }
  },


  onUnload() {
    // 页面卸载时确保清理数据
    const { key } = this.options
    if (key && getApp().globalData[key]) {
      delete getApp().globalData[key]
    }
  },


  // 新增：等待组件就绪的方法
  waitForComponentReady(retryCount = 0, maxRetries = 10) {
    const component = this.selectComponent('#fukaComponent')

    if (component && component.getPixelData) {
      this.prepareShareImage()
      return
    }

    if (retryCount >= maxRetries) {
      console.error('Component failed to load after maximum retries')
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      return
    }

    // 使用递增的延迟时间，从 100ms 开始，每次增加 100ms
    const delay = 100 * (retryCount + 1)

    setTimeout(() => {
      this.waitForComponentReady(retryCount + 1, maxRetries)
    }, delay)
  },

  // 在原有代码基础上修改保存图片相关方法
  async prepareShareImage() {

    try {
      // 获取像素数据
      const pixelComponent = this.selectComponent('#fukaComponent')

      if (!pixelComponent || !pixelComponent.getPixelData) {
        throw new Error('Component is not properly initialized')
      }


      const pixelData = await pixelComponent.getPixelData()

      // 创建渲染器
      let renderer = new FukaRenderer()
      if (pixelData.style === 'pixel') {
        renderer = new FukaRenderer()
      } else if (pixelData.style === 'cyberpunk') {
        renderer = new CyberpunkRenderer()
      } else if (pixelData.style === 'slot') {
        renderer = new SlotRenderer()
      } else if (pixelData.style === 'ink') {
        renderer = new InkRenderer()
      } else if (pixelData.style === 'flower') {
        renderer = new FlowerRenderer()
      } else if (pixelData.style === 'redPacket') {
        renderer = new RedPacketRenderer()
      }

      // 渲染保存图片
      const offscreenCanvas = await renderer.render(pixelData, 'save')

      // 转换为临时文件
      const tempFilePath = await new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas: offscreenCanvas,
          success: res => {
            resolve(res.tempFilePath)
          },
          fail: error => {
            console.error('Temp file path:', error)
            reject(error)
          },
        })
      })

      this.setData({ shareImagePath: tempFilePath })
      return tempFilePath
    } catch (error) {
      console.error('准备分享图失败:', error)
      throw error
    }
  },


  handleBack() {
    if (this.data.from === 'share') {
      // 从分享进入时跳转到首页
      wx.reLaunch({
        url: '/pages/fukaindex/index'
      })
    } else {
      // 保持原有返回逻辑
      wx.navigateBack({
        delta: 1
      })
    }
  },


  async onShareAppMessage() {
    const { cardData, cardId } = this.data
    const blessing = cardData.blessings[0]

    return {
      title: `祝福你:${blessing}`,
      path: `/pages/preview/index?cardId=${cardId}&from=share`,
      imageUrl: this.data.shareImagePath
    }
  },

  // 保存到相册
  async handleSaveImage() {
    try {
      // 检查权限
      const setting = await wx.getSetting()
      
      if (!setting.authSetting['scope.writePhotosAlbum']) {
        // 判断是否第一次授权
        if (setting.authSetting['scope.writePhotosAlbum'] === false) {
          // 用户曾经拒绝过，引导去设置页
          const modalResult = await wx.showModal({
            title: '提示',
            content: '需要您授权保存图片到相册。请在设置页面打开权限',
            confirmText: '去设置',
            cancelText: '取消'
          })
          
          if (modalResult.confirm) {
            // 用户点击去设置，显示设置按钮
            this.setData({
              showSettingBtn: true
            })
          } else {
            // 用户点击取消
            wx.showToast({
              title: '您取消了授权',
              icon: 'none'
            })
          }
          return
        } else {
          // 首次请求权限
          await wx.authorize({ scope: 'scope.writePhotosAlbum' })
        }
      }

      await wx.saveImageToPhotosAlbum({
        filePath: this.data.shareImagePath
      })
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('保存图片失败:', error)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    }
  },

  // 处理打开设置的方法
  handleOpenSetting(e) {
    if (e.detail.authSetting['scope.writePhotosAlbum']) {
      this.setData({
        showSettingBtn: false
      }, () => {
        // 权限获取成功后，自动执行保存
        this.handleSaveImage()
      })
    }
  }

})
