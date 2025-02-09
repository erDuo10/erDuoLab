const { CYBERPUNK_BASE } = require('../config/cyberpunk');
const BaseRenderer = require('./baseRenderer');

class FukaCyberpunkRenderer extends BaseRenderer{
    constructor() {
        super();
        this.config = CYBERPUNK_BASE;
    }

    // 主渲染方法
    async render(data, type = 'preview') {
        this.layoutSeed = data.timestamp || Date.now();

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
        this.renderTexts(ctx, scaledWidth, scaledHeight, data);

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
    renderTexts(ctx, width, height, data) {

        const content = data.blessings;

        const { text } = this.config;
        const centerY = height * text.position.y;
        const centerX = width / 2;

        // 渲染左侧文字
        this.renderTextColumn(ctx, {
            text: content[0],
            x: centerX - text.position.spacing,
            y: centerY,
            colors: text.left.colors,
            size: text.size
        });

        // 渲染右侧文字
        this.renderTextColumn(ctx, {
            text: content[1],
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
}

module.exports = FukaCyberpunkRenderer;