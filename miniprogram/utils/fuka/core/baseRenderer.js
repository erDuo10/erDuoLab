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

    // 工具方法：圆角矩形
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
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