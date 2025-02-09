class FukaMetrics {
    constructor(baseConfig) {
        this.config = baseConfig;
    }

    calculateContentArea(canvasWidth, canvasHeight) {
        const { ratio } = this.config.content;
        const minSize = Math.min(canvasWidth, canvasHeight);
        const contentSize = minSize * ratio;

        // 验证最终比例
        const actualRatio = contentSize / minSize;
        if (Math.abs(actualRatio - ratio) > 0.01) {
            console.warn(`Content area ratio mismatch: expected ${ratio}, got ${actualRatio}`);
        }

        // 验证内容区域为正方形
        if (Math.abs(contentSize - contentSize) > 0.01) {
            console.warn('Content area is not square');
        }

        return {
            size: contentSize,
            x: (canvasWidth - contentSize) / 2,
            y: (canvasHeight - contentSize) / 2
        };
    }

    calculateTextPosition(type, canvasHeight) {
        const { position, size } = this.config.text[type];
        return {
            y: canvasHeight * position,
            size
        };
    }
}

module.exports = FukaMetrics;