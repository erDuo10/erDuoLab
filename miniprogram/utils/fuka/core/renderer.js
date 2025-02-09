const { CANVAS_BASE, STYLE_CONFIG } = require('../config/index');
const FukaMetrics = require('./metrics');
const BaseRenderer = require('./baseRenderer');

class FukaRenderer extends BaseRenderer {
    constructor() {
        super();
        this.metrics = new FukaMetrics(CANVAS_BASE);
        this.config = CANVAS_BASE.pixelization;
        this.pixelCache = new Map(); // 添加像素缓存
    }

    // 渲染方法
    async render(data, type = 'preview') {
        this.layoutSeed = data.timestamp || Date.now();

        const { ctx, canvas, sizeInfo } = await this.createRenderContext(type);
        const { width, height, scale } = sizeInfo;

        // 1. 渲染背景
        this.renderBackground(ctx, width, height, scale);

        // 2. 渲染内容区域
        const contentArea = this.metrics.calculateContentArea(width, height);
        this.renderContentArea(ctx, contentArea);

        // 3. 使用type参数计算布局
        const layoutParams = this.calculateLayoutParams(contentArea, scale, type);

        // 3. 渲染像素字符
        await this.renderPixelChars(ctx, data, layoutParams);

        // 4. 渲染文字
        this.renderTexts(ctx, width, height);

        // 添加小程序码渲染
        if (type === 'save') {  // 仅在保存时添加小程序码
            await this.renderQRCode(ctx, width, height);
        }

        return canvas;
    }

    // 渲染背景
    renderBackground(ctx, width, height, scale) {
        const radius = 30 * scale; // 圆角半径

        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(width - radius, 0);
        ctx.arcTo(width, 0, width, radius, radius);
        ctx.lineTo(width, height - radius);
        ctx.arcTo(width, height, width - radius, height, radius);
        ctx.lineTo(radius, height);
        ctx.arcTo(0, height, 0, height - radius, radius);
        ctx.lineTo(0, radius);
        ctx.arcTo(0, 0, radius, 0, radius);
        ctx.closePath();

        ctx.fillStyle = STYLE_CONFIG.colors.background;
        ctx.fill();
    }


    renderContentArea(ctx, contentArea) {
        const { x, y, size } = contentArea;

        // 内容背景
        ctx.fillStyle = STYLE_CONFIG.colors.contentBg;
        ctx.fillRect(x, y, size, size);

        // 装饰角落
        this.renderCorners(ctx, x, y, size);
    }

    // 渲染角落
    renderCorners(ctx, x, y, size) {
        const cornerSize = size * 0.04;  // 减小角落大小
        const margin = size * 0.01;      // 添加边距
        ctx.fillStyle = STYLE_CONFIG.colors.corner;

        // 左上角
        ctx.beginPath();
        ctx.moveTo(x + margin, y + margin);
        ctx.lineTo(x + margin + cornerSize, y + margin);
        ctx.lineTo(x + margin + cornerSize, y + margin + cornerSize);
        ctx.lineTo(x + margin, y + margin + cornerSize);
        ctx.closePath();
        ctx.fill();

        // 右上角
        ctx.beginPath();
        ctx.moveTo(x + size - margin - cornerSize, y + margin);
        ctx.lineTo(x + size - margin, y + margin);
        ctx.lineTo(x + size - margin, y + margin + cornerSize);
        ctx.lineTo(x + size - margin - cornerSize, y + margin + cornerSize);
        ctx.closePath();
        ctx.fill();

        // 左下角
        ctx.beginPath();
        ctx.moveTo(x + margin, y + size - margin - cornerSize);
        ctx.lineTo(x + margin + cornerSize, y + size - margin - cornerSize);
        ctx.lineTo(x + margin + cornerSize, y + size - margin);
        ctx.lineTo(x + margin, y + size - margin);
        ctx.closePath();
        ctx.fill();

        // 右下角
        ctx.beginPath();
        ctx.moveTo(x + size - margin - cornerSize, y + size - margin - cornerSize);
        ctx.lineTo(x + size - margin, y + size - margin - cornerSize);
        ctx.lineTo(x + size - margin, y + size - margin);
        ctx.lineTo(x + size - margin - cornerSize, y + size - margin);
        ctx.closePath();
        ctx.fill();
    }

    // 渲染文字
    renderTexts(ctx, width, height) {
        const { year, blessing } = CANVAS_BASE.text;

        // 计算实际文字大小
        const yearSize = height * year.sizeRatio;
        const blessingSize = height * blessing.sizeRatio;

        // 渲染年份
        const yearPos = this.metrics.calculateTextPosition('year', height);
        this.renderText(ctx, {
            text: year.content,
            x: width / 2,
            y: yearPos.y,
            size: yearSize,
            color: STYLE_CONFIG.colors.year
        });

        // 渲染祝福语
        const blessingPos = this.metrics.calculateTextPosition('blessing', height);
        this.renderText(ctx, {
            text: blessing.content,
            x: width / 2,
            y: blessingPos.y,
            size: blessingSize,
            color: STYLE_CONFIG.colors.blessing
        });
    }

    renderText(ctx, { text, x, y, size, color }) {
        // 添加文字阴影以提升清晰度
        ctx.shadowColor = color;
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0.5;
        ctx.shadowOffsetY = 0.5;

        // 使用更清晰的字体
        ctx.font = `bold ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 文字描边
        ctx.strokeStyle = color;
        ctx.lineWidth = size * 0.02;
        ctx.strokeText(text, x, y);

        // 填充文字
        ctx.fillText(text, x, y);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }


    // 渲染像素字符
    async renderPixelChars(ctx, data, layoutParams) {

        const content = data.blessings[0];

        // 随机选择一个字符作为主字符
        const randomIndex = Math.floor(this.seededRandom() * content.length);
        const mainChar = content[randomIndex];
        // 获取除主字符外的其他字符
        const relatedChars = Array.from(content).filter((_, index) => index !== randomIndex);

        // 2. 渲染主字符
        const mainCharInfo = this.renderMainCharPrepare(mainChar, layoutParams);
        await this.renderMainChar(ctx, mainChar, layoutParams);

        // 3. 计算并渲染相关字符
        await this.renderRelatedChars(ctx, relatedChars, layoutParams, mainCharInfo);
    }

    // 修改布局参数计算方法
    calculateLayoutParams(contentArea, scale, type = 'preview') {
        const { pixelChar } = CANVAS_BASE;
        const { x, y, size } = contentArea;

        return {
            center: {
                x: x + size / 2,
                y: y + size / 2
            },
            contentSize: size,
            scale: scale,
            // 3. 使用确定性的随机半径
            baseRadius: size * (
                pixelChar.layout.baseRadiusBaseFactor +
                this.seededRandom() * pixelChar.layout.baseRadiusRandomFactor
            )
        };
    }

    // 渲染主字符 准备
    renderMainCharPrepare(char, layoutParams) {
        const { center, scale } = layoutParams;
        const { main } = CANVAS_BASE.pixelChar;

        const mainCharSize = main.size * scale;
        const mainCharInfo = {
            char,
            position: center,
            size: mainCharSize,
            bounds: this.calculateCharBounds(center, mainCharSize)
        };

        return mainCharInfo;
    }

    // 渲染主字符
    async renderMainChar(ctx, char, layoutParams) {
        const { center, scale } = layoutParams;
        const { main } = CANVAS_BASE.pixelChar;

        await this.renderPixelChar(ctx, {
            char: char,
            x: center.x,
            y: center.y,
            size: main.size * scale,
            gap: main.gap * scale,
            colors: STYLE_CONFIG.colors.main,
            preset: 'main'
        });
    }

    // 1. 提取角度计算逻辑
    calculateAngle(index, total, seed) {
        const baseAngle = (2 * Math.PI * index) / total;
        const random = this.seededRandom();
        return baseAngle + (random - 0.5) * CANVAS_BASE.pixelChar.layout.angleVariation;
    }

    // 2. 提取半径计算逻辑
    calculateRadius(contentSize, seed) {
        const { baseRadiusBaseFactor, baseRadiusRandomFactor, distributionRadiusFactor } = CANVAS_BASE.pixelChar.layout;
        const baseRadius = contentSize * distributionRadiusFactor;
        // 使用种子随机数
        const random = this.seededRandom();
        return baseRadius * (baseRadiusBaseFactor + random * baseRadiusRandomFactor);
    }

    // 3. 提取位置计算逻辑
    calculatePosition(center, angle, radius) {
        // 使用极坐标转笛卡尔坐标
        return {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius
        };
    }

    // 4. 提取边界检查逻辑
    constrainPosition(position, { charSize, contentSize }) {
        // 确保字符在内容区域内
        return {
            x: Math.max(charSize, Math.min(contentSize - charSize, position.x)),
            y: Math.max(charSize, Math.min(contentSize - charSize, position.y))
        };
    }

    // 5. 提取抖动计算逻辑
    applyJitter(position, contentSize, seed) {
        const jitter = contentSize * CANVAS_BASE.pixelChar.layout.jitterFactor;
        // 使用种子随机数
        const randomX = this.seededRandom();
        const randomY = this.seededRandom();
        return {
            x: position.x + (randomX - 0.5) * jitter,
            y: position.y + (randomY - 0.5) * jitter
        };
    }

    // 渲染相关字符
    async renderRelatedChars(ctx, chars, layoutParams, mainCharInfo) {
        const { related } = CANVAS_BASE.pixelChar;
        const positions = [];
        const { contentSize } = layoutParams;
        const baseSeed = this.layoutSeed;

        // 计算主字符的边界范围
        const mainCharBounds = mainCharInfo.bounds;
        const mainCharCenter = {
            x: (mainCharBounds.left + mainCharBounds.right) / 2,
            y: (mainCharBounds.top + mainCharBounds.bottom) / 2
        };


        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const charSeed = baseSeed + i * 1000; // 为每个字符生成唯一种子

            // 1. 计算角度 (均匀分布 + 随机偏移)
            const angle = this.calculateAngle(i, chars.length, charSeed);
            // 2. 计算半径 (基础半径 + 随机偏移)
            const radius = this.calculateRadius(layoutParams.contentSize, charSeed + 1);
            // 3. 计算缩放比例 (随机范围内)
            const charScale = this.getRandomScale(charSeed + 2);
            const charSize = related.size * layoutParams.scale * charScale;

            // 4. 计算初始位置
            let position = this.calculatePosition(mainCharCenter, angle, radius);

            // 5. 约束位置在内容区域内
            position = this.constrainPosition(position, { charSize, contentSize });

            // 6. 添加随机抖动
            position = this.applyJitter(position, contentSize, charSeed + 3);

            // 渲染字符
            await this.renderPixelChar(ctx, {
                char,
                x: position.x,
                y: position.y,
                size: charSize,
                gap: related.gap * layoutParams.scale,
                colors: STYLE_CONFIG.colors.related,
                preset: 'related'
            });

            positions.push({
                position,
                size: charSize,
                bounds: this.calculateCharBounds(position, charSize)
            });
        }
    }

    // 计算字符边界
    calculateCharBounds(position, size) {
        const halfSize = size / 2;
        return {
            left: position.x - halfSize,
            right: position.x + halfSize,
            top: position.y - halfSize,
            bottom: position.y + halfSize
        };
    }

    // 获取随机缩放比例
    getRandomScale(seed) {
        const { minScale, maxScale } = CANVAS_BASE.pixelChar.related;
        // 使用种子随机数
        const random = this.seededRandom();
        return minScale + random * (maxScale - minScale);
    }

    // 0. 提取矩阵起始点计算逻辑
    calculateStartPosition(x, y, size, gap, matrixLength) {
        const totalSize = (size + gap) * matrixLength;
        return {
            startX: Math.round(x - totalSize / 2),
            startY: Math.round(y - totalSize / 2)
        };
    }

    // 1. 提取位置计算逻辑
    calculatePixelPosition(startX, startY, i, j, size, gap) {
        return {
            x: startX + j * (size + gap),
            y: startY + i * (size + gap)
        };
    }

    // 2. 提取像素大小计算逻辑
    calculatePixelSize(baseSize, pixelValue) {
        const sizeMap = {
            2: baseSize * 1.8,
            1: baseSize * 1.1,
            0: baseSize
        };
        return sizeMap[pixelValue] || baseSize;
    }

    // 3. 提取颜色索引计算逻辑
    getColorIndex(pixelValue) {
        const indexMap = {
            2: 0,
            1: 1,
            0: 2
        };
        // 使用 in 运算符检查属性是否存在
        return pixelValue in indexMap ? indexMap[pixelValue] : 2;
    }

    // 4. 提取绘制逻辑
    drawPixel(ctx, { x, y, size, color }) {
        ctx.beginPath();
        ctx.rect(x, y, size, size);
        ctx.fillStyle = color;
        ctx.fill();
    }

    // 优化像素渲染方法
    async renderPixelChar(ctx, { char, x, y, size, gap, colors, preset }) {
        const pixels = await this.getCharPixels(char, preset);
        // 添加边缘平滑处理
        const smoothPixels = this.smoothPixelEdges(pixels);

        // 计算整个像素矩阵的起始位置
        const { startX, startY } = this.calculateStartPosition(
            x,
            y,
            size,
            gap,
            smoothPixels.length
        );

        // 优化像素渲染
        smoothPixels.forEach((row, i) => {
            row.forEach((pixel, j) => {
                if (pixel) {
                    // 基于起始位置计算每个像素点的位置
                    const position = this.calculatePixelPosition(
                        startX,
                        startY,
                        i,
                        j,
                        size,
                        gap
                    );

                    const pixelSize = this.calculatePixelSize(size, pixel);
                    const colorIndex = this.getColorIndex(pixel);

                    // TODO: 颜色处理 验证一下 输出了多少次
                    // console.error('colorIndex:', colorIndex);    

                    this.drawPixel(ctx, {
                        x: position.x,
                        y: position.y,
                        size: pixelSize,
                        color: colors[colorIndex]
                    });
                }
            });
        });
    }

    // 添加边缘平滑处理方法
    smoothPixelEdges(pixels) {
        const height = pixels.length;
        const width = pixels[0]?.length || 0;

        return pixels.map((row, i) =>
            row.map((pixel, j) => {
                if (!pixel) return 0;
                // 安全的边界检查
                const surroundings = this.getSurroundingSum(pixels, i, j, width, height);
                return this.adjustPixelValue(pixel, surroundings);
            })
        );
    }

    // 获取像素字符
    async getCharPixels(char, preset = 'main') {

        const cacheKey = `${char}_${preset}`;
        if (this.pixelCache.has(cacheKey)) {
            return this.pixelCache.get(cacheKey);
        }

        const options = this.config.presets[preset];

        const {
            canvasSize,
            sampleRate,
            fontSize,
            threshold
        } = options;

        const tempCanvas = wx.createOffscreenCanvas({
            type: '2d',
            width: canvasSize,
            height: canvasSize
        });
        const tempCtx = tempCanvas.getContext('2d');

        // 使用配置中的字体设置
        tempCtx.textBaseline = 'middle';
        tempCtx.textAlign = 'center';
        tempCtx.font = `${this.config.font.weight} ${fontSize}px ${this.config.font.family}`;

        tempCtx.fillStyle = '#000';
        tempCtx.fillText(char, canvasSize / 2, canvasSize / 2);

        const imageData = tempCtx.getImageData(0, 0, canvasSize, canvasSize);
        const pixels = [];

        for (let i = 0; i < canvasSize; i += sampleRate) {
            const row = [];
            for (let j = 0; j < canvasSize; j += sampleRate) {
                const idx = (i * canvasSize + j) * 4;
                const alpha = imageData.data[idx + 3];
                if (alpha > threshold) {
                    row.push(alpha > threshold * this.config.threshold.thick ? 2 : 1);
                } else {
                    row.push(0);
                }
            }
            pixels.push(row);
        }

        this.pixelCache.set(cacheKey, pixels);
        return pixels;
    }


    /**
     * 获取周围像素值的总和
     * @param {Array<Array<number>>} pixels - 像素矩阵
     * @param {number} row - 当前行
     * @param {number} col - 当前列
     * @returns {Object} 周围像素的统计信息
     */
    getSurroundingSum(pixels, row, col) {
        const surroundings = {
            strong: 0,  // 值为2的像素数量
            normal: 0,  // 值为1的像素数量
            total: 0    // 总的非0像素数量
        };

        // 检查8个方向的相邻像素
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;

            // 检查边界
            if (newRow >= 0 && newRow < pixels.length &&
                newCol >= 0 && newCol < pixels[0].length) {
                const value = pixels[newRow][newCol];
                if (value === 2) {
                    surroundings.strong++;
                } else if (value === 1) {
                    surroundings.normal++;
                }
                if (value > 0) {
                    surroundings.total++;
                }
            }
        }

        return surroundings;
    }

    /**
     * 根据周围像素调整当前像素值
     * @param {number} currentValue - 当前像素值
     * @param {Object} surroundings - 周围像素的统计信息
     * @returns {number} 调整后的像素值
     */
    adjustPixelValue(currentValue, surroundings) {
        // 定义调整规则
        const rules = {
            // 主笔画强化规则
            strengthenMain: {
                minStrong: 3,    // 周围至少3个强像素
                minTotal: 5      // 周围至少5个非空像素
            },
            // 次笔画强化规则
            strengthenSecondary: {
                minNormal: 4,    // 周围至少4个普通像素
                minTotal: 6      // 周围至少6个非空像素
            },
            // 弱化规则
            weaken: {
                maxTotal: 2      // 周围最多2个非空像素
            }
        };

        // 应用规则
        if (currentValue === 2) {
            // 主笔画处理
            if (surroundings.strong >= rules.strengthenMain.minStrong &&
                surroundings.total >= rules.strengthenMain.minTotal) {
                return 2;  // 保持强笔画
            } else if (surroundings.total <= rules.weaken.maxTotal) {
                return 1;  // 降级为普通笔画
            }
        } else if (currentValue === 1) {
            // 次笔画处理
            if (surroundings.normal >= rules.strengthenSecondary.minNormal &&
                surroundings.total >= rules.strengthenSecondary.minTotal) {
                return 2;  // 升级为强笔画
            } else if (surroundings.total <= rules.weaken.maxTotal) {
                return 0;  // 移除孤立像素
            }
        }

        return currentValue;  // 保持原值
    }
}

module.exports = FukaRenderer;