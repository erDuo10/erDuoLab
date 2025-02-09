const RED_PACKET_BASE = {
    // 基础配置
    base: {
        width: 1080,
        height: 1800,
        dpr: 2,
        ratio: 3 / 5
    },

    // 资源配置
    assets: {
        preload: true,
        images: ['gold-ingot.png', 'qrcode.jpg']
    },

    // 背景配置
    background: {
        gradient: {
            colors: ['#FF4D4F', '#FF1F1F'],
            direction: 'vertical'
        },
        radius: 0.04
    },

    // 边框配置
    border: {
        padding: 0.02,  // 相对边距
        width: 0.008,   // 相对边框宽度
        radius: 0.04,   // 相对圆角
        color: '#FFD700',
        style: 'double'
    },

    // 文字配置
    text: {
        header: {
            content: '恭贺新春',
            position: { y: 0.12 },  // 距顶部比例
            fontSize: 0.035,        // 相对字体大小
            color: '#FFD700',
            fontFamily: '"STXihei", "Microsoft YaHei", "华文细黑", sans-serif'
        },
        mainChar: {
            content: '福',
            position: { y: 0.5 },  // 中心位置
            fontSize: 0.35,         // 相对字体大小
            color: '#FFD700',
            fontFamily: '"STKaiti", "Microsoft YaHei", "楷体", serif',
            shadow: {
                offsetX: 5,
                offsetY: 5,
                blur: 10,
                color: 'rgba(0, 0, 0, 0.3)'
            }
        },
        footer: {
            content: '万事如意 阖家幸福',
            position: { y: 0.88 },  // 距顶部比例
            fontSize: 0.028,        // 相对字体大小
            color: '#FFD700',
            fontFamily: '"STXihei", "Microsoft YaHei", "华文细黑", sans-serif'
        }
    },

    // 装饰元素配置
    decorations: {
        goldIngots: [
            { x: 0.15, y: 0.25, rotation: -15 },  // 左上
            { x: 0.85, y: 0.25, rotation: 15 },   // 右上
            { x: 0.15, y: 0.75, rotation: -25 },  // 左下
            { x: 0.85, y: 0.75, rotation: 25 }    // 右下
        ],
        size: {
            width: 0.12  // 相对宽度
        }
    },

    qrcode: {
        position: {
            x: 0.05
        },
        size: 0.1,
        style: {
            backgroundColor: '#FFFFFF'
        }
    }
};

module.exports = { RED_PACKET_BASE };