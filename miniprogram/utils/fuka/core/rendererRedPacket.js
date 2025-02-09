const { RED_PACKET_BASE } = require('../config/redPacket');
const BaseRenderer = require('./baseRenderer');

class FukaRedPacketRenderer extends BaseRenderer {
    constructor() {
        super();
        this.config = RED_PACKET_BASE;
        this.preloadedImages = new Map();
    }

    async render(data, type = 'preview') {
        try {
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

            // 4. 渲染各个层级
            await this.renderBackground(ctx, scaledWidth, scaledHeight);
            await this.renderBorder(ctx, scaledWidth, scaledHeight);
            await this.renderTexts(ctx, scaledWidth, scaledHeight, data);
            await this.renderDecorations(ctx, scaledWidth, scaledHeight);

            // 5. 渲染二维码（仅在保存时）
            if (type === 'save') {
                await this.renderQRCodeRedPacket(ctx, scaledWidth, scaledHeight);
            }

            ctx.restore();
            return canvas;
        } catch (error) {
            console.error('Render failed:', error);
            throw error;
        }
    }


    async renderQRCodeRedPacket(ctx, width, height) {
        const config = RED_PACKET_BASE.qrcode;
        const localPath = '/images/qrcode.jpg';  // 确保这个路径正确

        try {
            // 计算位置和大小
            const size = width * config.size;
            const x = width * config.position.x;
            const y = height - x - size;

            const qrcodeImage = this.preloadedImages.get(localPath);

            // 绘制小程序码
            await this.drawQRCode(ctx, qrcodeImage, x, y, size);

        } catch (error) {
            console.error('Failed to render QR code:', error);
        }
    }

    async renderBackground(ctx, width, height) {
        const { background } = this.config;

        // 创建渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, background.gradient.colors[0]);
        gradient.addColorStop(1, background.gradient.colors[1]);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    async renderBorder(ctx, width, height) {
        const { border } = this.config;
        const padding = width * border.padding;
        const borderWidth = width * border.width;
        const radius = width * border.radius;

        ctx.strokeStyle = border.color;
        ctx.lineWidth = borderWidth;

        // 绘制圆角矩形边框
        ctx.beginPath();
        this.roundRect(
            ctx,
            padding,
            padding,
            width - 2 * padding,
            height - 2 * padding,
            radius
        );
        ctx.stroke();

        // 绘制双线边框效果
        ctx.beginPath();
        this.roundRect(
            ctx,
            padding + borderWidth * 2,
            padding + borderWidth * 2,
            width - 4 * borderWidth - 2 * padding,
            height - 4 * borderWidth - 2 * padding,
            radius - borderWidth * 2
        );
        ctx.stroke();
    }

    async renderTexts(ctx, width, height, data) {
        const content = data.blessings;
        const { text } = this.config;

        // 渲染顶部文字
        this.renderText(ctx, {
            content: text.header.content,
            x: width / 2,
            y: height * text.header.position.y,
            fontSize: height * text.header.fontSize,
            color: text.header.color,
            fontFamily: text.header.fontFamily
        });

        // 渲染福字
        this.renderText(ctx, {
            content: text.mainChar.content,
            x: width / 2,
            y: height * text.mainChar.position.y,
            fontSize: height * text.mainChar.fontSize,
            color: text.mainChar.color,
            fontFamily: text.mainChar.fontFamily,
            shadow: text.mainChar.shadow
        });


        console.error('height * text.mainChar.fontSize:', height * text.mainChar.fontSize)

        // 渲染底部文字
        this.renderText(ctx, {
            content: `${content[0]}  ${content[1]}`,
            x: width / 2,
            y: height * text.footer.position.y,
            fontSize: height * text.footer.fontSize,
            color: text.footer.color,
            fontFamily: text.footer.fontFamily
        });
    }

    renderText(ctx, { content, x, y, fontSize, color, fontFamily, shadow = null }) {
        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (shadow) {
            ctx.shadowColor = shadow.color;
            ctx.shadowOffsetX = shadow.offsetX;
            ctx.shadowOffsetY = shadow.offsetY;
            ctx.shadowBlur = shadow.blur;
        }

        ctx.fillText(content, x, y);
        ctx.restore();
    }

    async renderDecorations(ctx, width, height) {
        const { decorations } = this.config;
        const goldIngotImage = this.preloadedImages.get('/images/gold-ingot.png');
        
        // 计算保持宽高比的尺寸
        const baseWidth = width * decorations.size.width;
        const aspectRatio = goldIngotImage.width / goldIngotImage.height;
        const decorationWidth = baseWidth;
        const decorationHeight = baseWidth / aspectRatio;  // 根据原始宽高比计算高度
    
        for (const ingot of decorations.goldIngots) {
            ctx.save();
            
            // 设置旋转中心点
            const centerX = width * ingot.x;
            const centerY = height * ingot.y;
            
            ctx.translate(centerX, centerY);
            ctx.rotate(ingot.rotation * Math.PI / 180);
            ctx.translate(-decorationWidth/2, -decorationHeight/2);  // 使用新的高度计算
    
            // 绘制金元宝，使用计算后的尺寸
            ctx.drawImage(
                goldIngotImage.image,
                0,
                0,
                decorationWidth,
                decorationHeight
            );
    
            ctx.restore();
        }
    }

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
        } catch (error) {
            console.error('Failed to preload images:', error);
            throw error;
        }
    }
}

module.exports = FukaRedPacketRenderer;