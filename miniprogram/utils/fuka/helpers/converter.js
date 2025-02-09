class UnitConverter {
    constructor() {
        const systemInfo = wx.getWindowInfo();
        this.screenWidth = systemInfo.screenWidth;
        this.screenHeight = systemInfo.screenHeight;
        this.pixelRatio = systemInfo.pixelRatio;

        this.screenRatio = this.screenHeight / this.screenWidth; // 添加屏幕比例
    }

    rpxToPx(rpx) {
        return (rpx * this.screenWidth) / 750;
    }

    pxToRpx(px) {
        return (px * 750) / this.screenWidth;
    }

    getDevicePixelRatio() {
        return this.pixelRatio;
    }
}

module.exports = UnitConverter;