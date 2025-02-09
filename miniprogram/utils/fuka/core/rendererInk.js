const BaseRenderer = require('./baseRenderer');
const { INK_BASE } = require('../config/ink');

class InkRenderer extends BaseRenderer {
    constructor() {
        super();
        this.config = INK_BASE;
        this.preloadedImages = new Map();
    }

    async render(data, type = 'preview') {
        // 预加载图片资源
        await this.preloadImages();

        const { ctx, canvas, sizeInfo } = await this.createRenderContext(type);
        const { width, height, scale } = sizeInfo;

        // 应用全局缩放
        ctx.save();
        ctx.scale(scale, scale);

        // 使用缩放后的实际尺寸
        const scaledWidth = width / scale;
        const scaledHeight = height / scale;

        // 渲染各个层级
        this.renderBackground(ctx, scaledWidth, scaledHeight);
        this.renderBorder(ctx, scaledWidth, scaledHeight);
        await this.renderClouds(ctx, scaledWidth, scaledHeight);
        await this.renderFishes(ctx, scaledWidth, scaledHeight);
        this.renderFu(ctx, scaledWidth, scaledHeight);
        this.renderGreeting(ctx, scaledWidth, scaledHeight, data);

        // 渲染小程序码（仅在保存时）
        if (type === 'save') {
            await this.renderQRCode(ctx, scaledWidth, scaledHeight);
        }

        ctx.restore();
        return canvas;
    }

    renderBackground(ctx, width, height) {
        const { background } = this.config;

        // 填充白色背景
        ctx.fillStyle = background.color;
        ctx.fillRect(0, 0, width, height);

        // 创建水墨渐变效果
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        background.gradient.stops.forEach(stop => {
            gradient.addColorStop(stop.offset, stop.color);
        });

        ctx.globalAlpha = background.gradient.opacity;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
    }

    renderBorder(ctx, width, height) {
        const { border } = this.config.layout;
        const padding = width * border.padding;

        ctx.strokeStyle = border.borderColor;
        ctx.lineWidth = border.borderWidth;
        ctx.strokeRect(
            padding,
            padding,
            width - padding * 2,
            height - padding * 2
        );
    }

    async renderClouds(ctx, width, height) {
        const { clouds } = this.config.layout;

        for (const cloud of clouds) {
            const cloudImage = this.preloadedImages.get('/images/cloud300.png');
            if (cloudImage) {
                ctx.save();
                ctx.globalAlpha = cloud.opacity;

                // 计算位置和尺寸（保持原始比例）
                const w = width * cloud.width;
                const h = w * (cloudImage.height / cloudImage.width); // 根据原始比例计算高度
                const x = width * cloud.position.x;
                const y = height * cloud.position.y;

                // 应用变换
                ctx.translate(x + w / 2, y + h / 2);
                ctx.rotate(cloud.transform.rotate * Math.PI / 180);
                ctx.scale(cloud.transform.scale, cloud.transform.scale);
                ctx.translate(-(x + w / 2), -(y + h / 2));

                ctx.drawImage(cloudImage.image, x, y, w, h);
                ctx.restore();
            }
        }
    }

    async renderFishes(ctx, width, height) {
        const { fishes } = this.config.layout;

        for (const fish of fishes) {
            const fishImage = this.preloadedImages.get('/images/fish300.png');
            if (fishImage) {
                ctx.save();
                ctx.globalAlpha = fish.opacity;

                // 计算位置和尺寸（保持原始比例）
                const w = width * fish.width;
                const h = w * (fishImage.height / fishImage.width); // 根据原始比例计算高度
                const x = width * fish.position.x;
                const y = height * fish.position.y;

                // 应用变换
                ctx.translate(x + w / 2, y + h / 2);
                ctx.rotate(fish.transform.rotate * Math.PI / 180);
                ctx.scale(fish.transform.scale, fish.transform.scale);
                ctx.translate(-(x + w / 2), -(y + h / 2));

                ctx.drawImage(fishImage.image, x, y, w, h);
                ctx.restore();
            }
        }
    }

    renderFuText(ctx, width, height) {
        const { fu } = this.config.layout;

        ctx.save();

        // 修改字体设置
        const fontSize = height * fu.size;
        ctx.font = `${fu.weight} ${fontSize}px "${fu.fontFamily}"`;
        ctx.fillStyle = fu.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 增强阴影效果
        ctx.shadowColor = fu.shadow.color;
        ctx.shadowBlur = fu.shadow.blur;
        ctx.shadowOffsetX = fu.shadow.offset.x;
        ctx.shadowOffsetY = fu.shadow.offset.y;

        // 添加描边效果
        if (fu.stroke) {
            ctx.strokeStyle = fu.stroke.color;
            ctx.lineWidth = fu.stroke.width;
            ctx.strokeText('福', width * fu.position.x, height * fu.position.y);
        }

        ctx.fillText('福', width * fu.position.x, height * fu.position.y);
        ctx.restore();
    }


    // ... existing code ...

    renderFu(ctx, width, height) {
        const { fu } = this.config.layout;

        ctx.save();

        const fuImage = this.preloadedImages.get('/images/lucky.png');
        if (fuImage) {
            // 计算尺寸（保持原始比例）
            const w = width * fu.size * 2; // 由于原来是文字，这里需要调整尺寸系数
            const h = w * (fuImage.height / fuImage.width);
            const x = width * fu.position.x - w / 2; // 居中绘制
            const y = height * fu.position.y - h / 2;

            // 设置阴影
            ctx.shadowColor = fu.shadow.color;
            ctx.shadowBlur = fu.shadow.blur;
            ctx.shadowOffsetX = fu.shadow.offset.x;
            ctx.shadowOffsetY = fu.shadow.offset.y;

            ctx.drawImage(fuImage.image, x, y, w, h);
        }

        ctx.restore();
    }

    // ... existing code ...

    renderGreeting(ctx, width, height, data) {
        const { greeting } = this.config.layout;

        ctx.save();

        // 更新字体设置
        const fontSize = height * greeting.size;
        ctx.font = `${greeting.weight} ${fontSize}px "${greeting.fontFamily}"`;
        ctx.fillStyle = greeting.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 设置阴影
        ctx.shadowColor = greeting.shadow.color;
        ctx.shadowBlur = greeting.shadow.blur;
        ctx.shadowOffsetX = greeting.shadow.offset.x;
        ctx.shadowOffsetY = greeting.shadow.offset.y;

        // 计算起始位置
        const x = width * greeting.position.x;
        let y = height * greeting.position.y;

        // 垂直书写祝福语
        const lines = data.blessings;
        lines.forEach((line, index) => {
            const lineY = y + index * fontSize * greeting.lineHeight;

            // 垂直书写处理
            const chars = line.split('');
            chars.forEach((char, charIndex) => {
                const charY = lineY + charIndex * fontSize * greeting.letterSpacing;
                ctx.fillText(char, x, charY);
            });
        });

        ctx.restore();
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

module.exports = InkRenderer;