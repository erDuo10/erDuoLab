const INK_BASE = {
    // 基础配置
    base: {
        width: 1080,
        height: 1800,
        dpr: 2,
        ratio: 3 / 5
    },

    // 资源配置
    assets: {
        images: [
            'lucky.png', // 福字图案
            'cloud300.png',    // 祥云图片
            'fish300.png',     // 鲤鱼图片
            'qrcode.jpg'       // 小程序码
        ]
    },

    // 布局配置
    layout: {
        // 边框配置
        border: {
            padding: 0.02,     // 边距为2%
            borderWidth: 2,
            borderColor: 'rgba(0, 0, 0, 0.1)'
        },

        // 祥云配置
        clouds: [
            {
                position: { x: 0.037, y: 0.022 },  // 距离左上角3.7%, 2.2%
                width: 0.22,
                transform: { rotate: -5, scale: 0.9 },
                opacity: 0.7
            },
            {
                position: { x: 0.745, y: 0.033 },  // 距离右上角
                width: 0.22,
                transform: { rotate: 5, scale: 0.8 },
                opacity: 0.5
            }
        ],

        // 鲤鱼配置
        fishes: [
            {
                position: { x: 0.74, y: 0.65 },   // 从右下角算起
                width: 0.22,
                transform: { rotate: 15, scale: 1 },
                opacity: 0.9
            },
            {
                position: { x: 0.59, y: 0.56 }, 
                width: 0.22,
                transform: { rotate: -12, scale: 0.8 },
                opacity: 0.9
            },
            {
                position: { x: 0.18, y: 0.45 },
                width: 0.22,
                transform: { rotate: 75, scale: 0.9 },
                opacity: 0.9
            }
        ],

        // 福字配置
        fu: {
            position: { x: 0.5, y: 0.23 },
            size: 0.16,
            fontFamily: 'PingFang SC, -apple-system-font, Microsoft YaHei, sans-serif',            
            weight: 'bold',
            color: '#e60012',
            shadow: {
                offset: { x: 3, y: 3 },
                blur: 6,
                color: 'rgba(0, 0, 0, 0.2)'
            },
            stroke: {
                color: 'rgba(255, 255, 255, 0.3)',
                width: 1
            }
        },

        // 祝福语配置
        greeting: {
            position: { x: 0.5, y: 0.37 },
            size: 0.024,
            fontFamily: 'PingFang SC, -apple-system-font, Microsoft YaHei, sans-serif',            
            weight: '300',
            lineHeight: 5.7,
            letterSpacing: 1.25, // 调整字间距
            color: '#1a1a1a',
            shadow: {
                offset: { x: 1, y: 1 },
                blur: 2,
                color: 'rgba(0, 0, 0, 0.1)'
            },
            vertical: true
        },

        // 小程序码配置
        qrcode: {
            position: { x: 0.037, y: 0.978 },  // 左下角
            size: 0.093,                       // 宽度为画布宽度的9.3%
            padding: 10,
            borderRadius: 10,
            background: '#FFFFFF',
            shadow: {
                offset: { x: 0, y: 2 },
                blur: 10,
                color: 'rgba(0, 0, 0, 0.1)'
            }
        }
    },

    // 背景配置
    background: {
        color: '#FFFFFF',
        gradient: {
            angle: 45,
            stops: [
                { offset: 0, color: 'rgba(0, 0, 0, 0.02)' },
                { offset: 1, color: 'rgba(0, 0, 0, 0.1)' }
            ],
            opacity: 0.8
        }
    }
};

module.exports = { INK_BASE };