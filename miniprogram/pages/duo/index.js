const DUO_CONFIG = require('../../duo')

Page({
  data: {
    duo: `${DUO_CONFIG.cloudStorage.baseUrl}${DUO_CONFIG.cloudStorage.paths.duo.base}`,
    icons: {
      logo: '',
      openSource: '',
      update: '',
      community: '',
      github: '',
      wechat: '',
      bilibili: ''
    },
    socialLinks: {
      github: '',
      wechat: '',
      bilibili: ''
    }
  },

  onLoad() {
    this.loadIcons()
    this.loadSocialLinks()
  },

  // 加载云存储图标
  async loadIcons() {
    try {
      const fileIDs = {
        logo: `${this.data.duo}/logo.png`,
        openSource: `${this.data.duo}/open-source.png`,
        update: `${this.data.duo}/update.png`,
        community: `${this.data.duo}/community.png`,
        github: `${this.data.duo}/github-icon.png`,
        wechat: `${this.data.duo}/wechat-icon.png`,
        bilibili: `${this.data.duo}/bilibili-icon.png`
      }
      
      const fileList = Object.values(fileIDs)
      const result = await wx.cloud.getTempFileURL({
        fileList: fileList
      })

      const icons = {}
      result.fileList.forEach((file, index) => {
        const key = Object.keys(fileIDs)[index]
        icons[key] = file.tempFileURL
      })

      this.setData({ icons })
    } catch (error) {
      console.error('加载图标失败:', error)
      wx.showToast({
        title: '加载图标失败',
        icon: 'none'
      })
    }
  },

  // 加载社交链接配置
  async loadSocialLinks() {
    try {
      const db = wx.cloud.database()
      const result = await db.collection('duo_config').doc('social_links').get()
      this.setData({
        socialLinks: result.data
      })
    } catch (error) {
      console.error('加载配置失败:', error)
      wx.showToast({
        title: '加载配置失败',
        icon: 'none'
      })
    }
  },

  // 获取图片临时链接
  async getImageUrl(fileID) {
    try {
      const { tempFileURL } = await wx.cloud.getTempFileURL({
        fileList: [fileID]
      })
      return tempFileURL[0]
    } catch (error) {
      console.error('获取图片链接失败:', error)
      return ''
    }
  },

  // 导航到数独游戏
  navigateToSudoku() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 导航到福卡设计
  navigateToFuka() {
    wx.switchTab({
      url: '/pages/fukaindex/index'
    })
  },

  // 打开GitHub仓库
  openGithub() {
    wx.setClipboardData({
      data: this.data.socialLinks.github,
      success: () => {
        wx.showToast({
          title: 'GitHub链接已复制',
          icon: 'success'
        })
      }
    })
  },

  // 复制公众号
  copyOfficialAccount() {
    wx.setClipboardData({
      data: this.data.socialLinks.wechat,
      success: () => {
        wx.showToast({
          title: '公众号已复制',
          icon: 'success'
        })
      }
    })
  },

  // 打开Bilibili
  openBilibili() {
    wx.setClipboardData({
      data: this.data.socialLinks.bilibili,
      success: () => {
        wx.showToast({
          title: 'Bilibili账号已复制',
          icon: 'success'
        })
      }
    })
  }
})
