const UnitConverter = require('../helpers/converter');

class FukaScaler {
    constructor(baseConfig) {
        this.baseConfig = baseConfig;
        this.converter = new UnitConverter();
    }

    calculatePreviewSize() {
        const maxPreviewWidth = this.converter.rpxToPx(600);
        const screenWidth = this.converter.screenWidth;
        const screenHeight = this.converter.screenHeight;
        
        // 1. 计算基准宽度
        const baseWidth = Math.min(maxPreviewWidth, screenWidth * 0.8);
        
        // 2. 计算期望高度
        const expectedHeight = baseWidth * (this.baseConfig.base.height / this.baseConfig.base.width);
        
        // 3. 检查是否超出屏幕高度限制
        const maxHeight = screenHeight * 0.8; // 预留20%边距
        
        // 4. 如果超出高度限制，重新计算宽度
        let finalWidth = baseWidth;
        let finalHeight = expectedHeight;
        
        if (expectedHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight / (this.baseConfig.base.height / this.baseConfig.base.width);
        }
        

        return {
            width: finalWidth,
            height: finalHeight,
            scale: finalWidth / this.baseConfig.base.width,
            dpr: this.converter.getDevicePixelRatio()
        };
    }

    calculateSaveSize() {
        const { width, height, dpr } = this.baseConfig.base;
        return { width, height, scale: 1, dpr };
    }
}

module.exports = FukaScaler;