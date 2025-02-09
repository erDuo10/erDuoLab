交互规则满足以下 交互规则
<custom_instructions>
// AI 交互规则

### 一级规则（必须遵循）

1. **解决方案确定性**
- 不确定时必须明确告知
- 多方案时说明优劣
- 标注适用场景和限制
- 评估实现和维护成本

2. **代码分析规范**
- 绘制完整调用链路图
- 分析数据流转过程
- 检查业务逻辑完整性
- 识别代码重复和依赖
- 验证边界条件处理

3. **代码更新规范**
- 提供代码对比
- 说明修改原因
- 完善代码注释
- 评估影响范围
- 确保向后兼容
- 提供回滚方案
- 输出完整代码


4. **反馈机制**
- 及时反馈进展
- 立即通知问题
- 跟踪解决进度
- 记录解决方案

### 二级规则（按需使用）

5. **代码质量控制**
- 符合项目规范
- 控制代码复杂度
- 优化性能和内存
- 处理异步操作

6. **测试规范**
- 单元测试要求
- 集成测试规范
- 自动化测试流程

7. **安全规范**
- 数据安全处理
- 用户输入验证
- 访问控制机制

### 三级规则（参考使用）

8. **最佳实践**
- 模块化设计
- 错误处理机制
- 性能优化建议
- 文档维护规范

9. **交互优化**
- 记录交互要点
- 追踪重复问题
- 维护问题库
- 生成分析报告

### 分析报告模板

1. **调用链路**
- 相关文件列表
- 方法调用关系
- 数据流转图

2. **问题分析**
- 发现的问题
- 优化建议
- 修改示例

3. **实施建议**
- 优先级排序
- 实施步骤
- 风险评估
</custom_instructions>

当前有一个 福卡生成 微信小程序
主要功能 预览 及 保存 福卡图片

工具类目录结构
utils/
  └── fuka/
    ├─config
    │      baseConfig.js 基础配置
    │      cyberpunk.js 赛博朋克福卡配置
    │
    ├─core
    │      baseRenderer.js 基础渲染器
    │      renderercyberpunk.js 赛博朋克福卡渲染器


赛博朋克福卡组件目录结构
├─cyberpunk
│      index.js
│      index.json
│      index.wxml
│      index.wxss

预览页面目录结构
└─preview
        index.js
        index.json
        index.wxml
        index.wxss

工具类代码：
<especially_relevant_code_snippet>
文件路径: erDuoLab\miniprogram\utils\fuka\config\baseConfig.js
// 代码内容
const BASE_CONFIG = {
    base: {
        width: 1080,
        height: 1800,
        dpr: 2,
        ratio: 3 / 5      // 宽高比
    },
    qrcode: {
        position: {
            x: 0.02
        },
        size: 0.1,
        style: {
            backgroundColor: '#FFFFFF'
        }
    }
}

module.exports = { BASE_CONFIG }

</especially_relevant_code_snippet>

<especially_relevant_code_snippet>
文件路径: 
erDuoLab\miniprogram\utils\fuka\config\cyberpunk.js
// 代码内容
const CYBERPUNK_BASE = {
  // 背景配置
  background: {
    colors: [
      { color1: '#1a0f40', color2: '#2a1f60' },
      { color1: '#201f60', color2: '#302f80' },
      { color1: '#2f1f50', color2: '#3f2f70' },
      { color1: '#251f70', color2: '#352f90' }
    ],
    rects: {
      count: 100,
      minWidth: 20,
      maxWidth: 120,
      minHeight: 30,
      maxHeight: 180,
      opacity: 0.25
    }
  },

  // 年份配置
  year: {
    position: {
      y: 0.12 // 距顶部比例
    },
    size: {
      pixel: 30,
      gap: 3,
      spacing: 40 // 数字间距
    },
    color: '#00ffff',
    glow: {
      // 简化发光配置，使用单层柔和发光
      color: 'rgba(0, 255, 255, 0.8)',
      blur: 30,
      spread: 2,
      // 环境光配置
      ambient: {
        color: 'rgba(0, 255, 255, 0.15)',
        blur: 30,
        spread: 4
      }
    },
    content: '2025'
  },

  // 文字配置
  text: {
    position: {
      y: 0.3, // 距顶部比例
      spacing: 200 // 左右文字列间距
    },
    size: {
      pixel: 20,
      gap: 3,
      charSpacing: 80  // 增加字符间距
    },
    left: {
      content: '新年快乐',
      colors: {
        primary: '#ff0088',
        secondary: '#ff69b4'
      }
    },
    right: {
      content: '万事如意',
      offset: 100, // 右侧文字向下偏移
      colors: {
        primary: '#00ffff',
        secondary: '#0066ff'
      }
    }
  },

  // 数字点阵定义
  digits: {
    '2': [
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 1]
    ],
    '0': [
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1]
    ],
    '5': [
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1]
    ]
  },
}

module.exports = { CYBERPUNK_BASE }




</especially_relevant_code_snippet>

<especially_relevant_code_snippet>
文件路径: 
erDuoLab\miniprogram\utils\fuka\core\baseRenderer.js

// 代码内容
const FukaScaler = require('./scaler');
const { BASE_CONFIG } = require('../config/baseConfig');

class BaseRenderer {
    constructor() {
        this.scaler = new FukaScaler(BASE_CONFIG);
        this.canvas = wx.createOffscreenCanvas({
            type: '2d',
            width: 100,
            height: 100
        });
        this.layoutSeed = Date.now();
    }

    // 共用方法
    async createRenderContext(type = 'preview') {
        const sizeInfo = type === 'preview'
            ? this.scaler.calculatePreviewSize()
            : this.scaler.calculateSaveSize();

        this.canvas.width = sizeInfo.width * sizeInfo.dpr;
        this.canvas.height = sizeInfo.height * sizeInfo.dpr;

        const ctx = this.canvas.getContext('2d');
        ctx.scale(sizeInfo.dpr, sizeInfo.dpr);

        return { ctx, canvas: this.canvas, sizeInfo };
    }

    // 基础渲染方法（抽象方法）
    async render(data, type = 'preview') {
        throw new Error('Must implement render method');
    }

    // 渲染小程序码主方法
    async renderQRCode(ctx, width, height) {
        const config = BASE_CONFIG.qrcode;
        const localPath = '/images/qrcode.jpg';  // 确保这个路径正确

        try {
            // 计算位置和大小
            const size = width * config.size;
            const x = width * config.position.x;
            const y = height - x - size;

            const qrcodeImage = await this.loadLocalImage(localPath);

            // 绘制小程序码
            await this.drawQRCode(ctx, qrcodeImage, x, y, size);

        } catch (error) {
            console.error('Failed to render QR code:', error);
        }
    }

    // 加载本地图片
    async loadLocalImage(path) {
        return new Promise((resolve, reject) => {
            // 确保路径以 '/' 开头
            const fullPath = path.startsWith('/') ? path : `/${path}`;

            // 创建离屏图片对象
            const image = this.canvas.createImage();

            // 监听加载完成事件
            image.onload = () => {
                resolve({
                    image: image,
                    width: image.width,
                    height: image.height
                });
            };

            // 监听加载失败事件
            image.onerror = (error) => {
                console.error('Failed to load image:', error);
                reject(error);
            };

            // 设置图片源
            image.src = fullPath;
        });
    }

    // 绘制小程序码
    async drawQRCode(ctx, imageInfo, x, y, size) {
        try {
            ctx.save();

            if (!imageInfo || !imageInfo.image) {
                throw new Error('Invalid image data');
            }

            const config = BASE_CONFIG.qrcode;

            // 1. 直接绘制完整的二维码（方形）
            const qrSize = size;  // 使用完整尺寸
            const qrX = x;
            const qrY = y;

            // 2. 绘制白色背景（方形）
            ctx.fillStyle = config.style.backgroundColor;
            ctx.fillRect(qrX, qrY, qrSize, qrSize);

            // 3. 绘制完整的二维码
            ctx.drawImage(imageInfo.image, qrX, qrY, qrSize, qrSize);

            ctx.restore();
        } catch (error) {
            console.error('Draw QR code failed:', error);
            throw error;
        }
    }

    // 工具方法
    seededRandom() {
        const x = Math.sin(this.layoutSeed++) * 10000;
        return x - Math.floor(x);
    }

    // 工具方法：保存渲染信息
    saveRenderInfo(info) {
        this.lastRenderInfo = {
            ...info,
            timestamp: Date.now()
        };
    }

    // 工具方法：获取上次渲染信息
    getRenderInfo() {
        return this.lastRenderInfo;
    }

    // 工具方法：清理资源
    dispose() {
        // 清理画布
        this.canvas = null;
        // 清理缓存
        this.lastRenderInfo = null;
    }
}

module.exports = BaseRenderer;


</especially_relevant_code_snippet>

<especially_relevant_code_snippet>
文件路径: erDuoLab\miniprogram\utils\fuka\core\renderercyberpunk.js

// 代码内容
const { CYBERPUNK_BASE } = require('../config/cyberpunk');
const FukaScaler = require('./scaler');
const FukaMetrics = require('./metrics');
const BaseRenderer = require('./baseRenderer');

class FukaCyberpunkRenderer extends BaseRenderer{
    constructor() {
        super();
        this.config = CYBERPUNK_BASE;
    }

    // 主渲染方法
    async render(data, type = 'preview') {
        if (type === 'preview') {
            this.layoutSeed = Date.now();
            data._layoutSeed = this.layoutSeed;
        } else {
            this.layoutSeed = data._layoutSeed;
        }

        const { ctx, canvas, sizeInfo } = await this.createRenderContext(type);
        const { width, height, scale } = sizeInfo;

        // 应用全局缩放
        ctx.save();
        ctx.scale(scale, scale);

        // 使用缩放后的实际尺寸
        const scaledWidth = width / scale;
        const scaledHeight = height / scale;

        // 1. 渲染背景
        this.renderBackground(ctx, scaledWidth, scaledHeight);

        // 2. 渲染年份
        this.renderYear(ctx, scaledWidth, scaledHeight);

        // 3. 渲染文字
        this.renderTexts(ctx, scaledWidth, scaledHeight);

        // 4. 渲染小程序码 (仅保存时)
        if (type === 'save') {
            await this.renderQRCode(ctx, scaledWidth, scaledHeight);
        }

        ctx.restore();
        return canvas;
    }


    // 渲染背景
    renderBackground(ctx, width, height) {
        // 1. 渲染基础渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#020008');
        gradient.addColorStop(0.5, '#050312');
        gradient.addColorStop(1, '#02020f');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 2. 渲染装饰方块
        const { rects, colors } = this.config.background;
        for (let i = 0; i < rects.count; i++) {
            this.renderDecorativeRect(ctx, width, height, colors, rects);
        }
    }

    // 渲染装饰方块
    renderDecorativeRect(ctx, width, height, colors, config) {
        const rect = {
            width: this.seededRandom() * (config.maxWidth - config.minWidth) + config.minWidth,
            height: this.seededRandom() * (config.maxHeight - config.minHeight) + config.minHeight,
            left: this.seededRandom() * width,
            top: this.seededRandom() * height
        };

        const colorSet = colors[Math.floor(this.seededRandom() * colors.length)];
        const angle = Math.floor(this.seededRandom() * 360);

        ctx.save();
        ctx.globalAlpha = config.opacity;

        // 创建渐变
        const gradient = ctx.createLinearGradient(
            rect.left, rect.top,
            rect.left + rect.width * Math.cos(angle * Math.PI / 180),
            rect.top + rect.width * Math.sin(angle * Math.PI / 180)
        );
        gradient.addColorStop(0, colorSet.color1);
        gradient.addColorStop(1, colorSet.color2);

        // 绘制方块
        ctx.fillStyle = gradient;
        ctx.fillRect(rect.left, rect.top, rect.width, rect.height);

        // 添加边框和模糊效果
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

        ctx.restore();
    }

    // 渲染年份
    renderYear(ctx, width, height) {
        const { year } = this.config;
        const startY = height * year.position.y;
        const digits = year.content.split('');

        // 计算整体宽度以居中
        const totalWidth = (digits.length * year.size.pixel * 3) +
            ((digits.length - 1) * year.size.spacing);
        let startX = (width - totalWidth) / 2;

        digits.forEach((digit, index) => {
            const matrix = this.config.digits[digit];
            const x = startX + (index * (year.size.pixel * 3 + year.size.spacing));

            this.renderDigitMatrix(ctx, {
                matrix,
                x,
                y: startY,
                pixelSize: year.size.pixel,
                gap: year.size.gap,
                color: year.color,
                glow: year.glow
            });
        });
    }

    // 渲染数字矩阵
    renderDigitMatrix(ctx, { matrix, x, y, pixelSize, gap, color, glow }) {
        ctx.save();
    
        matrix.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    const pixelX = x + j * (pixelSize + gap);
                    const pixelY = y + i * (pixelSize + gap);
    
                    // 1. 绘制环境光晕（较大范围的柔和光晕）
                    ctx.save();
                    ctx.shadowColor = glow.ambient.color;
                    ctx.shadowBlur = glow.ambient.blur;
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
                    ctx.fillRect(
                        pixelX - glow.ambient.spread,
                        pixelY - glow.ambient.spread,
                        pixelSize + glow.ambient.spread * 2,
                        pixelSize + glow.ambient.spread * 2
                    );
                    ctx.restore();
    
                    // 2. 绘制主要发光和像素
                    ctx.save();
                    // 设置发光效果
                    ctx.shadowColor = glow.color;
                    ctx.shadowBlur = glow.blur;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
    
                    // 绘制像素主体
                    ctx.fillStyle = color;
                    ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
                    ctx.restore();
                }
            });
        });
    
        ctx.restore();
    }
    

    // 渲染文字
    renderTexts(ctx, width, height) {
        const { text } = this.config;
        const centerY = height * text.position.y;
        const centerX = width / 2;

        // 渲染左侧文字
        this.renderTextColumn(ctx, {
            text: text.left.content,
            x: centerX - text.position.spacing,
            y: centerY,
            colors: text.left.colors,
            size: text.size
        });

        // 渲染右侧文字
        this.renderTextColumn(ctx, {
            text: text.right.content,
            x: centerX + text.position.spacing,
            y: centerY + text.right.offset,
            colors: text.right.colors,
            size: text.size
        });
    }

    // 渲染文字列
    renderTextColumn(ctx, { text, x, y, colors, size }) {
        const chars = text.split('');

        const charHeight = size.pixel * 8 + size.charSpacing;

        chars.forEach((_, index) => {
            const charY = y + (index * charHeight);
            this.renderCharPixels(ctx, {
                x: x - (size.pixel * 4),
                y: charY,
                colors,
                size
            });
        });

        // 渲染原始文字（用于参考）
        this.renderOriginalText(ctx, {
            text,
            x: x + size.pixel * 6,
            y: y + charHeight * 2,
            colors
        });
    }

    // 渲染字符像素
    renderCharPixels(ctx, { x, y, colors, size }) {
        const pixelCount = 8;

        for (let i = 0; i < pixelCount; i++) {
            for (let j = 0; j < pixelCount; j++) {
                if (this.seededRandom() > 0.5) {
                    const pixelX = x + j * (size.pixel + size.gap);
                    const pixelY = y + i * (size.pixel + size.gap);

                    // 创建渐变
                    const gradient = ctx.createLinearGradient(
                        pixelX, pixelY,
                        pixelX + size.pixel, pixelY + size.pixel
                    );
                    gradient.addColorStop(0, colors.primary);
                    gradient.addColorStop(1, colors.secondary);

                    // 设置发光效果
                    ctx.shadowColor = colors.primary;
                    ctx.shadowBlur = 10;

                    // 绘制像素
                    ctx.fillStyle = gradient;
                    ctx.fillRect(pixelX, pixelY, size.pixel, size.pixel);
                }
            }
        }
    }

    // 渲染原始文字
    renderOriginalText(ctx, { text, x, y, colors }) {
        ctx.save();

        // 设置文字样式
        ctx.font = '24px "Microsoft YaHei"';
        ctx.textBaseline = 'middle';

        // 创建渐变
        const gradient = ctx.createLinearGradient(x, y, x + 24, y + text.length * 32);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.secondary);
        ctx.fillStyle = gradient;

        // 垂直书写
        text.split('').forEach((char, index) => {
            ctx.fillText(char, x, y + index * 32);
        });

        ctx.restore();
    }

    // 确定性随机数生成
    seededRandom() {
        const x = Math.sin(this.layoutSeed++) * 10000;
        return x - Math.floor(x);
    }
}

module.exports = FukaCyberpunkRenderer;


</especially_relevant_code_snippet>

赛博朋克福卡组件代码

<especially_relevant_code_snippet>
文件路径: erDuoLab\miniprogram\components\fuka-styles\cyberpunk\index.js


// 代码内容
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
    canvasHeight: 0
  },

  lifetimes: {
    attached() {
      const renderer = new CyberpunkRenderer()
      const { width, height } = renderer.scaler.calculatePreviewSize()
          
      this.setData({
        canvasWidth: width,
        canvasHeight: height
      })
    }
  },

  methods: {
    async onFukaDataChange(newVal) {
      if (!newVal) return
          
      try {
        const renderer = new CyberpunkRenderer()
        const offscreenCanvas = await renderer.render(newVal, 'preview')
              
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


</especially_relevant_code_snippet>
<especially_relevant_code_snippet>
文件路径: erDuoLab\miniprogram\components\fuka-styles\cyberpunk\index.wxml
// 代码内容
<view class="cyberpunk-fuka">
    <canvas type="2d" 
            id="previewCanvas"
            style="width:{{canvasWidth}}px; height:{{canvasHeight}}px;"
            class="preview-canvas">
    </canvas>
</view>

</especially_relevant_code_snippet>

<especially_relevant_code_snippet>
文件路径: erDuoLab\miniprogram\components\fuka-styles\cyberpunk\index.wxss
// 代码内容
.cyberpunk-fuka {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: transparent;
}

.preview-canvas {
    display: block;
    margin: 0 auto;
}
</especially_relevant_code_snippet>


预览页 代码
<especially_relevant_code_snippet>
文件路径: erDuoLab\miniprogram\pages\preview\index.js
// 代码内容
const {fukaService} = require('../../services/fuka/card')
const FukaRenderer = require('../../utils/fuka/core/renderer')
const CyberpunkRenderer = require('../../utils/fuka/core/renderercyberpunk')


Page({
  data: {
    cardId: '',
    cardData: null,
    isLoading: true,
    showShareModal: false,
    canvasContext: null,
    shareImagePath: '',
    styleComponents: {
      pixel: 'fuka-pixel',
      cyberpunk: 'fuka-cyberpunk',
      slot: 'fuka-slot',
      circle: 'fuka-circle'
    }
  },

  onLoad(options) {
    this.setData({cardId: options.cardId})
    this.loadCardData()
  },

  // 加载福卡数据
  async loadCardData() {
    try {
      wx.showLoading({title: '加载中...'})
      const cardData = await fukaService.getFukaDetail(this.data.cardId)

      console.error('cardData:', cardData)

      // 添加数据校验
      if (!cardData) {
        throw new Error('获取福卡数据失败')
      }

      // 数据完整性校验
      if (!cardData.id || !cardData.style || !cardData.componentName) {
        throw new Error('福卡数据不完整')
      }

      this.setData({
        cardData,
        isLoading: false
      }, () => {
        // 检查组件加载
        const query = wx.createSelectorQuery().in(this)
        query.select('.fuka-component').fields({
          node: true,
          size: true,
          properties: ['fukaData']
        }, (res) => {
          console.error('Component Query Result:', res)
        }).exec()

      })
      // 预渲染分享图
      this.prepareShareImage()
    } catch (error) {
      console.error('加载福卡数据失败:', error)
      wx.showToast({
        title: error.message || '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 在原有代码基础上修改保存图片相关方法
  async prepareShareImage() {
    try {
      // 获取像素数据
      const pixelComponent = this.selectComponent('#fukaComponent')
      const pixelData = await pixelComponent.getPixelData()


      console.error('pixelData:', pixelData)

      // 创建渲染器
      let renderer = new FukaRenderer()
      if (pixelData.style.type === 'cyberpunk') {
        renderer = new CyberpunkRenderer()
      }

      // 渲染保存图片
      const offscreenCanvas = await renderer.render(pixelData, 'save')

      // 转换为临时文件
      const tempFilePath = await new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas: offscreenCanvas,
          success: res => resolve(res.tempFilePath),
          fail: reject
        })
      })

      this.setData({shareImagePath: tempFilePath})
      return tempFilePath
    } catch (error) {
      console.error('准备分享图失败:', error)
      throw error
    }
  },


  // 处理收藏
  async handleCollect() {
    try {
      const isCollected = await fukaService.toggleCollect(this.data.cardId)
      this.setData({
        'cardData.isCollected': isCollected
      })
      wx.showToast({
        title: isCollected ? '收藏成功' : '取消收藏',
        icon: 'success'
      })
    } catch (error) {
      console.error('收藏操作失败:', error)
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      })
    }
  },

  // 显示分享模态框
  showShareModal() {
    this.setData({showShareModal: true})
  },

  // 隐藏分享模态框
  hideShareModal() {
    this.setData({showShareModal: false})
  },

  // 分享给好友
  async onShareAppMessage() {
    const {cardData} = this.data
    await fukaService.shareFuka(this.data.cardId)
    return {
      title: `${cardData.blessing.content} - 为你送上祝福`,
      path: `/pages/preview/index?cardId=${this.data.cardId}`,
      imageUrl: this.data.shareImagePath
    }
  },

  // 保存到相册
  async handleSaveImage() {
    try {
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
  }
})

</especially_relevant_code_snippet>


<especially_relevant_code_snippet>
文件路径: erDuoLab\miniprogram\pages\preview\index.wxml
// 代码内容
<view class="preview-container">
    <!-- 加载状态 -->
    <view class="loading-wrapper" wx:if="{{isLoading}}">
        <view class="loading-icon"></view>
        <text>福卡加载中...</text>
    </view>

    <!-- 福卡内容 -->
    <block wx:else>
        <!-- 动态渲染对应样式组件 -->
        <view class="fuka-wrapper">
            <block wx:if="{{cardData.style.type === 'pixel'}}">
                <fuka-pixel
                        fukaData="{{cardData}}"
                        class="fuka-component"
                        id="fukaComponent"/>
            </block>
            <block wx:elif="{{cardData.style.type === 'cyberpunk'}}">
                <fuka-cyberpunk
                        fukaData="{{cardData}}"
                        class="fuka-component"
                        id="fukaComponent"/>
            </block>
            <!-- 添加调试信息 -->
            <view style="display: none;">
                组件类型: {{styleComponents[cardData.style.type]}}
                数据: {{cardData}}
            </view>
        </view>

        <!-- 操作按钮区 -->
        <view class="action-bar">
            <button class="action-btn collect-btn {{cardData.isCollected ? 'collected' : ''}}"
                    bindtap="handleCollect">
                <image src="/images/{{cardData.isCollected ? 'collected' : 'collect'}}.png"/>
                <text>{{cardData.isCollected ? '已收藏' : '收藏'}}</text>
            </button>
            <button class="action-btn share-btn"
                    bindtap="showShareModal">
                <image src="/images/share.png"/>
                <text>分享</text>
            </button>
        </view>

        <!-- 分享模态框 -->
        <share-modal show="{{showShareModal}}"
                     bindclose="hideShareModal"
                     bindsave="handleSaveImage"/>

        <!-- 用于生成分享图的canvas -->
        <canvas type="2d"
                id="fukaCanvas"
                class="share-canvas"
                style="width: 750px; height: 1000px;"/>
    </block>
</view>


</especially_relevant_code_snippet>


<especially_relevant_code_snippet>
文件路径: erDuoLab\miniprogram\pages\preview\index.wxss
// 代码内容
.preview-container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 20rpx;
    position: relative;

    box-sizing: border-box;
}

/* 加载状态样式 */
.loading-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.loading-icon {
    width: 80rpx;
    height: 80rpx;
    border: 6rpx solid #f3f3f3;
    border-top: 6rpx solid #1890ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* 福卡容器样式 */
.fuka-wrapper {
    margin: 40rpx auto;
    width: 600rpx;  /* 基准宽度 */
    /* height: 800rpx;  */
    background: #fff;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
    overflow: hidden;

    position: relative;
}

.fuka-component {
    width: 100%;
    height: 100%;
}

/* 操作按钮样式 */
.action-bar {
    display: flex;
    justify-content: space-around;
    padding: 40rpx;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}

.action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: none;
    border: none;
    padding: 20rpx 40rpx;
}

.action-btn image {
    width: 48rpx;
    height: 48rpx;
    margin-bottom: 10rpx;
}

.action-btn text {
    font-size: 28rpx;
    color: #666;
}

.collect-btn.collected {
    color: #1890ff;
}

.collect-btn.collected text {
    color: #1890ff;
}

/* 分享画布样式 */
.share-canvas {
    position: fixed;
    left: -9999px;
    visibility: hidden;
} 

</especially_relevant_code_snippet>


当前情况：
此文件总结了赛博朋克福卡生成的核心代码；
包括：
1. 福卡预览页面；
2. 赛博朋克福卡组件；
3. 赛博朋克福卡渲染工具类；
当前赛博朋克福卡预览页面以及生成福卡如上所示；

现在准备开发新的福卡目标：
1. 保持原来的预览页面； 
2. 新福卡生成渲染预览保存逻辑与当前赛博朋克福卡一致；
3. 基于当前赛博朋克福卡的设计 进行新福卡的开发；
4. 包括组件设计逻辑 ，渲染逻辑等；
5. 注意 scale 参数，保证 预览图片 和 图片 布局内容完全一致，等比例缩放；
6. 注意 缩放后的实际尺寸 使用 scaledWidth 和 scaledHeight 表示；
参考
<especially_relevant_code_snippet>
            // 1. 创建渲染上下文
            const { ctx, canvas, sizeInfo } = await this.createRenderContext(type);
            const { width, height, scale } = sizeInfo;

            // 2. 预加载图片资源
            if (this.config.assets.preload) {
                await this.preloadImages();
            }

            // 3. 应用缩放
            ctx.save();
            ctx.scale(scale, scale);


            // 使用缩放后的实际尺寸
            const scaledWidth = width / scale;
            const scaledHeight = height / scale;
</especially_relevant_code_snippet>

7. 配置参数 设置位置时 使用 相对位置 以实现 等比例 缩放；
8. 配置参数 设置宽度高度等数据时，使用 相对长度 以实现 等比例 缩放；
9. 配置参数 设置字体大小时 使用 相对字体大小 以实现 等比例 缩放；
10. 涉及到加载图片时，考虑原始宽高比，避免图片变形，需要根据原始图片的宽高比动态计算渲染尺寸，可以参考以下代码
<especially_relevant_code_snippet>

        // 计算保持宽高比的尺寸
        const baseWidth = width * decorations.size.width;
        const aspectRatio = goldIngotImage.width / goldIngotImage.height;
        const decorationWidth = baseWidth;
        const decorationHeight = baseWidth / aspectRatio;  // 根据原始宽高比计算高度
</especially_relevant_code_snippet>


11. 涉及到加载图片的功能，通过loadLocalImage 实现预加载， 可以参考以下代码 
<especially_relevant_code_snippet>
    async preloadImages() {
        const { assets } = this.config;
        const imagePaths = assets.images.map(img => `/images/${img}`);

        try {
            const loadPromises = imagePaths.map(async path => {
                if (this.preloadedImages.has(path)) {
                    return this.preloadedImages.get(path);
                }

                const imageInfo = await this.loadLocalImage(path);
                this.preloadedImages.set(path, imageInfo);
                return imageInfo;
            });

            await Promise.all(loadPromises);
            console.log('All images preloaded successfully');
        } catch (error) {
            console.error('Failed to preload images:', error);
            throw error;
        }
    }
</especially_relevant_code_snippet>
基于以上，梳理开发新福卡组件的流程及组件代码结构设计以及对应的代码实现；
