const { SLOT_BASE } = require('../config/slot');
const BaseRenderer = require('./baseRenderer');
const SeededRandom = require('./SeededRandom');

class SlotRenderer extends BaseRenderer {
    constructor() {
        super();
        this.config = SLOT_BASE;
        this.imageCache = new Map();
        this.preloadedImages = new Map();
    }

    // 新增：预加载所有图片
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

    async render(data, type = 'preview') {
        this.layoutSeed = data.timestamp || Date.now();

        // 首先预加载所有图片
        await this.preloadImages();
        const { ctx, canvas, sizeInfo } = await this.createRenderContext(type);
        const { width, height, scale } = sizeInfo;

        // 应用全局缩放
        ctx.save();
        ctx.scale(scale, scale);

        const scaledWidth = width / scale;
        const scaledHeight = height / scale;

        // 1. 渲染背景
        await this.renderBackground(ctx, scaledWidth, scaledHeight);

        // 2. 渲染标题
        await this.renderHeader(ctx, scaledWidth);

        // 3. 渲染主显示区域
        await this.renderDisplay(ctx, scaledWidth, scaledHeight, type, data);

        // 4. 渲染底部按钮
        await this.renderButtons(ctx, scaledWidth, scaledHeight);

        // 5. 渲染拉杆
        await this.renderLever(ctx, scaledWidth, scaledHeight);

        ctx.restore();
        return canvas;
    }

    // 渲染背景
    async renderBackground(ctx, width, height) {
        const { background } = this.config.base;
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, background.gradient.start);
        gradient.addColorStop(1, background.gradient.end);

        ctx.fillStyle = gradient;
        this.roundRect(ctx, 0, 0, width, height, background.borderRadius);
        ctx.fill();
    }

    // 渲染标题
    async renderHeader(ctx, width) {
        const { header } = this.config;
        const headerWidth = width * 0.5;
        const headerX = (width - headerWidth) / 2;

        // 渲染标题背景
        const bgGradient = ctx.createLinearGradient(headerX, 0, headerX + headerWidth, header.height);
        bgGradient.addColorStop(0, header.background.gradient.start);
        bgGradient.addColorStop(1, header.background.gradient.end);

        ctx.fillStyle = bgGradient;
        this.roundRect(ctx, headerX, header.top, headerWidth, header.height, header.background.borderRadius);
        ctx.fill();

        // 渲染文字
        const textGradient = ctx.createLinearGradient(headerX, 0, headerX + headerWidth, header.height);
        textGradient.addColorStop(0, header.text.gradient.start);
        textGradient.addColorStop(1, header.text.gradient.end);

        ctx.fillStyle = textGradient;
        ctx.font = `bold ${header.text.size}px "Microsoft YaHei"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(header.text.content, width / 2, header.top + header.height / 2);
    }

    // 渲染显示区域
    async renderDisplay(ctx, width, height, type, data) {
        const { display, reel } = this.config;
        const grid = this.generateGrid(this.layoutSeed, data);

        const displayWidth = width * display.length;
        const displayHeight = displayWidth;
        const displayX = (width - displayWidth) / 2;
        const displayY = height * 0.2;

        // 渲染显示区域背景
        const bgGradient = ctx.createLinearGradient(displayX, displayY, displayX + displayWidth, displayY + displayHeight);
        bgGradient.addColorStop(0, display.background.gradient.start);
        bgGradient.addColorStop(1, display.background.gradient.end);

        ctx.fillStyle = bgGradient;
        ctx.strokeStyle = display.background.border.color;
        ctx.lineWidth = display.background.border.width;

        this.roundRect(ctx, displayX, displayY, displayWidth, displayHeight, display.background.borderRadius);
        ctx.fill();
        ctx.stroke();

        // 渲染格子
        const cellWidth = (displayWidth - display.grid.padding * 2 - display.grid.gap * (display.grid.cols - 1)) / display.grid.cols;
        const cellHeight = (displayHeight - display.grid.padding * 2 - display.grid.gap * (display.grid.rows - 1)) / display.grid.rows;

        grid.forEach((item, index) => {
            const row = Math.floor(index / display.grid.cols);
            const col = index % display.grid.cols;
            const x = displayX + display.grid.padding + col * (cellWidth + display.grid.gap);
            const y = displayY + display.grid.padding + row * (cellHeight + display.grid.gap);

            this.renderCell(ctx, item, x, y, cellWidth, cellHeight);
        });
    }


    async renderCell(ctx, item, x, y, width, height) {
        const { reel, textReel } = this.config;

        ctx.save();

        // 添加发光效果
        ctx.shadowColor = reel.background.glow.color;
        ctx.shadowBlur = reel.background.glow.blur;

        // 基础样式设置保持不变...
        const isWish = item.type === 'wish';
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);

        if (isWish) {
            gradient.addColorStop(0, textReel.background.gradient.start);
            gradient.addColorStop(1, textReel.background.gradient.end);
        } else {
            gradient.addColorStop(0, reel.background.gradient.start);
            gradient.addColorStop(1, reel.background.gradient.end);
        }

        // 绘制背景
        ctx.fillStyle = gradient;
        this.roundRect(ctx, x, y, width, height, reel.background.borderRadius);
        ctx.fill();

        // 渲染内容
        if (isWish) {
            // 文字渲染保持不变...
            ctx.font = `${textReel.text.size}px "Microsoft YaHei"`;
            ctx.fillStyle = textReel.text.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.content, x + width / 2, y + height / 2);
        } else if (item.type === 'image') {
            const imagePath = `/images/${item.content}`;
            const imageInfo = this.preloadedImages.get(imagePath);

            if (imageInfo && imageInfo.image) {
                let size = Math.min(width, height) * reel.image.size;
                if (item.content === 'qrcode.jpg') {
                    // 取消阴影效果，这样后续的内容渲染就不会有发光效果
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    size = Math.min(width, height) * 0.8;
                }

                const imageX = x + (width - size) / 2;
                const imageY = y + (height - size) / 2;

                ctx.drawImage(imageInfo.image, imageX, imageY, size, size);
            } else {
                this.renderFallbackContent(ctx, x, y, width, height);
            }
        }

        ctx.restore();
    }


    // 新增：降级内容渲染
    renderFallbackContent(ctx, x, y, width, height) {
        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + width / 2, y + height / 2);
    }

    // 重写 dispose 方法
    // 清理资源时同时清理预加载的图片
    dispose() {
        this.preloadedImages.clear();
        this.clearImageCache();
        this.clearGridCache();
        super.dispose();
    }

    // 新增：获取加载进度
    getLoadingProgress() {
        const total = this.config.assets.images.length;
        const loaded = this.preloadedImages.size;
        return {
            loaded,
            total,
            progress: total > 0 ? (loaded / total) * 100 : 0
        };
    }

    // 渲染底部按钮
    async renderButtons(ctx, width, height) {
        const { buttons } = this.config;
        const totalWidth = buttons.content.length * buttons.style.size + (buttons.content.length - 1) * buttons.layout.gap;
        let startX = (width - totalWidth) / 2;
        const startY = height - buttons.style.size - buttons.layout.marginBottom;

        buttons.content.forEach((content, index) => {
            const x = startX + index * (buttons.style.size + buttons.layout.gap);

            // 渲染按钮背景
            const gradient = ctx.createLinearGradient(x, startY, x + buttons.style.size, startY + buttons.style.size);
            gradient.addColorStop(0, buttons.style.background.gradient.start);
            gradient.addColorStop(1, buttons.style.background.gradient.end);

            ctx.fillStyle = gradient;
            this.roundRect(ctx, x, startY, buttons.style.size, buttons.style.size, buttons.style.borderRadius);
            ctx.fill();

            // 渲染按钮文字
            ctx.font = `bold ${buttons.style.fontSize}px Arial`;
            ctx.fillStyle = buttons.style.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(content, x + buttons.style.size / 2, startY + buttons.style.size / 2);
        });
    }

    // 渲染拉杆
    async renderLever(ctx, width, height) {
        const { lever } = this.config;
        const handleX = width - lever.position.right;
        const handleY = height * 0.8;

        // 渲染拉杆杆身
        ctx.fillStyle = lever.bar.background.gradient.start;
        ctx.fillRect(
            handleX + (lever.handle.size - lever.bar.width) / 2,
            handleY + lever.handle.size / 2,
            lever.bar.width,
            lever.bar.height
        );

        // 渲染拉杆手柄
        const handleGradient = ctx.createRadialGradient(
            handleX + lever.handle.size / 2,
            handleY + lever.handle.size / 2,
            0,
            handleX + lever.handle.size / 2,
            handleY + lever.handle.size / 2,
            lever.handle.size / 2
        );
        handleGradient.addColorStop(0, lever.handle.background.gradient.start);
        handleGradient.addColorStop(1, lever.handle.background.gradient.end);

        ctx.fillStyle = handleGradient;
        ctx.beginPath();
        ctx.arc(
            handleX + lever.handle.size / 2,
            handleY + lever.handle.size / 2,
            lever.handle.size / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }


    /**
 * 生成网格布局
 * @param {number} seed - 随机种子，默认使用当前时间戳
 * @returns {Array} 网格数据
 */
    generateGrid(seed = Date.now(), data) {

        const content = data.blessings[0];

        // 初始化随机数生成器
        const random = new SeededRandom(seed);
        const { assets } = this.config;
        const gridSize = 16;
        let grid = new Array(gridSize);

        // 1. 定义"万事如意"的位置区间
        const wishIntervals = [
            { start: 0, end: 3 },     // "万"的位置区间
            { start: 4, end: 7 },     // "事"的位置区间
            { start: 8, end: 11 },    // "如"的位置区间
            { start: 12, end: 15 }    // "意"的位置区间
        ];

        // 记录已使用的位置
        const usedPositions = new Set();

        // 2. 放置"万事如意"
        const wishPositions = [];
        Array.from(content).forEach((wish, index) => {
            const interval = wishIntervals[index];
            const availablePositions = [];

            // 获取区间内可用位置
            for (let i = interval.start; i <= interval.end; i++) {
                if (!usedPositions.has(i)) {
                    availablePositions.push(i);
                }
            }

            // 随机选择位置
            const randomIndex = random.getRandomInt(0, availablePositions.length - 1);
            const selectedPos = availablePositions[randomIndex];

            // 记录使用的位置
            usedPositions.add(selectedPos);
            wishPositions.push(selectedPos);

            // 设置网格内容
            grid[selectedPos] = {
                type: 'wish',
                content: wish
            };
        });

        // 3. 获取剩余可用位置
        const remainingPositions = [];
        for (let i = 0; i < gridSize; i++) {
            if (!usedPositions.has(i)) {
                remainingPositions.push(i);
            }
        }

        // 4. 处理普通图片
        const normalImages = assets.images.filter(img => img !== 'qrcode.jpg');

        // 确保每个普通图标至少出现一次
        normalImages.forEach(image => {
            const randomIndex = random.getRandomInt(0, remainingPositions.length - 1);
            const pos = remainingPositions.splice(randomIndex, 1)[0];
            grid[pos] = {
                type: 'image',
                content: image
            };
        });

        // 5. 放置二维码
        const qrcodePos = remainingPositions.splice(
            random.getRandomInt(0, remainingPositions.length - 1),
            1
        )[0];
        grid[qrcodePos] = {
            type: 'image',
            content: 'qrcode.jpg'
        };

        // 6. 填充剩余位置
        remainingPositions.forEach(pos => {
            const randomImage = normalImages[random.getRandomInt(0, normalImages.length - 1)];
            grid[pos] = {
                type: 'image',
                content: randomImage
            };
        });

        return grid;
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
}

module.exports = SlotRenderer;