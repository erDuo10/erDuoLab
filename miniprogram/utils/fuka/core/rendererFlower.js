const BaseRenderer = require('./baseRenderer');
const { FLOWER_BASE } = require('../config/flower');

class FlowerRenderer extends BaseRenderer {
    constructor() {
        super();
        this.config = FLOWER_BASE;
        this.preloadedImages = new Map();
    }

    async render(data, type = 'preview') {
        this.layoutSeed = data.timestamp || Date.now();

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
            this.renderBackground(ctx, scaledWidth, scaledHeight);
            this.renderTitle(ctx, scaledWidth, scaledHeight);
            await this.renderFlower(ctx, scaledWidth, scaledHeight, data);
            this.renderBlessing(ctx, scaledWidth, scaledHeight, data);
            this.renderFooter(ctx, scaledWidth, scaledHeight);

            // 5. 渲染小程序码（仅保存时）
            if (type === 'save') {
                await this.renderQRCode(ctx, scaledWidth, scaledHeight);
            }

            ctx.restore();
            return canvas;

        } catch (error) {
            console.error('Render failed:', error);
            throw error;
        }
    }

    renderBackground(ctx, width, height) {
        const { background } = this.config;

        // 渲染渐变背景
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, background.gradient.colors[0]);
        gradient.addColorStop(1, background.gradient.colors[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 渲染点状图案
        const { pattern } = background;
        ctx.fillStyle = pattern.color;

        for (let x = 0; x < width; x += pattern.size) {
            for (let y = 0; y < height; y += pattern.size) {
                ctx.beginPath();
                ctx.arc(x + pattern.size / 2, y + pattern.size / 2, pattern.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    renderTitle(ctx, width, height) {
        const { title } = this.config;
        const fontSize = height * title.style.fontSize;

        ctx.save();
        ctx.font = `${title.style.fontWeight} ${fontSize}px "Microsoft YaHei"`;
        ctx.fillStyle = title.style.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // 设置阴影
        const { shadow } = title.style;
        ctx.shadowColor = shadow.color;
        ctx.shadowBlur = shadow.blur;
        ctx.shadowOffsetX = shadow.offset.x;
        ctx.shadowOffsetY = shadow.offset.y;

        ctx.fillText(title.text, width / 2, height * title.position.y);
        ctx.restore();
    }

    async renderFlower(ctx, width, height, data) {
        const { flower } = this.config;
        const flowerWidth = width * flower.size.width; // 整体花朵宽度
        const flowerHeight = height * flower.size.height; // 整体花朵高度   
        const centerX = width / 2; // 中心点x坐标
        const centerY = height * flower.position.y + flowerHeight / 2; // 中心点y坐标

        const randomIndex = Math.floor(this.seededRandom() * data.blessings.length);
        const blessingFlower = data.blessings[randomIndex];

        // 修改：优化层叠顺序
        const petalOrder = Array.from({ length: flower.petals.count }, (_, i) => i)
            .sort((a, b) => {
                // 顶部花瓣(0)始终最先渲染
                if (a === 0) return -1;
                if (b === 0) return 1;

                // 其他花瓣按顺时针顺序渲染
                return a - b;
            });

        // 增加阴影效果以增强层次感
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // 渲染花瓣
        for (const i of petalOrder) {
            await this.renderPetal(ctx, centerX, centerY, i, flowerWidth, blessingFlower);
        }

        // 清除阴影效果
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 渲染中心圆
        await this.renderFlowerCenter(ctx, centerX, centerY, flowerWidth);
    }

    async renderPetal(ctx, centerX, centerY, index, flowerWidth, blessingFlower) {
        const { petals } = this.config.flower;
        const petalWidth = flowerWidth * petals.size.width;
        const petalHeight = flowerWidth * petals.size.height;
        const angle = (360 / petals.count) * index;
        const content = petals.content[index];

        ctx.save();

        // 修改：调整旋转中心点和偏移量
        ctx.translate(centerX, centerY);
        ctx.rotate((angle * Math.PI) / 180);

        // 根据索引调整花瓣的延伸距离
        const extensionFactor = 0.85;
        ctx.translate(0, -petalHeight * extensionFactor);

        // 绘制花瓣形状
        this.drawPetalShape(ctx, petalWidth, petalHeight, petals);

        // 调整内容位置
        if (content.type === 'image') {
            await this.renderPetalImage(ctx, content, petalWidth, petalHeight);
        } else {
            let blessingFlowerVer = [...blessingFlower].reverse();

            const blessingPetal = blessingFlowerVer[index - 1];
            this.renderPetalText(ctx, content, petalWidth, petalHeight, blessingPetal);
        }

        ctx.restore();
    }

    drawPetalShape(ctx, width, height, petals) {
        ctx.beginPath();

        // 修改：使用更柔和的贝塞尔曲线控制点
        // const bottomWidth = width * 0.2; // 进一步收窄底部
        const controlPointOffset = width * 0.6; // 控制点横向偏移
        const heightControl1 = height * 0.3; // 第一控制点的纵向位置
        const heightControl2 = height * 0.7; // 第二控制点的纵向位置

        // 起点：花瓣底部中心
        ctx.moveTo(0, 0);

        // 右侧曲线 - 更圆润的曲线
        ctx.bezierCurveTo(
            controlPointOffset * 0.7, heightControl1,  // 第一控制点
            controlPointOffset, heightControl2,        // 第二控制点
            0, height                                 // 终点
        );

        // 左侧曲线 - 对称处理
        ctx.bezierCurveTo(
            -controlPointOffset, heightControl2,      // 第一控制点
            -controlPointOffset * 0.7, heightControl1, // 第二控制点
            0, 0                                      // 回到起点
        );

        // 填充和描边
        ctx.fillStyle = petals.color;
        ctx.fill();

        // 加强边框效果
        ctx.strokeStyle = petals.border.color;
        ctx.lineWidth = width * petals.border.width * 1.2; // 增加边框宽度
        ctx.stroke();
    }

    async renderPetalImage(ctx, content, petalWidth, petalHeight) {
        const image = this.preloadedImages.get(content.src);
        if (!image) return;

        const size = petalWidth * content.size;
        const x = -size / 2 + (petalWidth * (content.offsetX || 0));
        const y = petalHeight * content.offsetY;

        ctx.drawImage(image.image, x, y, size, size);
    }

    renderPetalText(ctx, content, petalWidth, petalHeight, blessingPetal) {
        const fontSize = petalWidth * 0.25;
        ctx.font = `bold ${fontSize}px "Microsoft YaHei"`;
        ctx.fillStyle = this.config.flower.center.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const x = petalWidth * (content.offsetX || 0);
        const y = petalHeight * content.offsetY;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI);
        ctx.fillText(blessingPetal, 0, 0);
        ctx.restore();
    }

    async renderFlowerCenter(ctx, centerX, centerY, flowerWidth) {
        const { center } = this.config.flower;
        const size = flowerWidth * center.size;

        // 绘制中心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = center.color;
        ctx.fill();

        // 绘制中心图片
        const image = this.preloadedImages.get(center.image.src);
        if (image) {
            const imageSize = size * center.image.size;
            const x = centerX - imageSize / 2;
            const y = centerY - imageSize / 2;
            ctx.drawImage(image.image, x, y, imageSize, imageSize);
        }
    }

    renderBlessing(ctx, width, height, data) {
        const { blessing } = this.config;
        const fontSize = height * blessing.style.fontSize;
        const lineHeight = fontSize * blessing.style.lineHeight;
        const startY = height * blessing.position.y;

        ctx.save();
        ctx.font = `${fontSize}px "Microsoft YaHei"`;
        ctx.fillStyle = blessing.style.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const formattedWishes = this.formatWishes(data.blessings);

        formattedWishes.forEach((line, index) => {
            ctx.fillText(line, width / 2, startY + index * lineHeight);
        });
        ctx.restore();
    }


    formatWishes(wishes) {
        return [
            '愿您在新的一年里',
            `${wishes[0]} ${wishes[1]}`,
            `${wishes[2]} ${wishes[3]}`,
            `${wishes[4]} ${wishes[5]}`
        ];
    }

    renderFooter(ctx, width, height) {
        const { footer } = this.config;
        const fontSize = height * footer.style.fontSize;

        ctx.save();
        ctx.font = `${footer.style.fontWeight} ${fontSize}px "Microsoft YaHei"`;
        ctx.fillStyle = footer.style.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(footer.content, width / 2, height * footer.position.y);
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

module.exports = FlowerRenderer;