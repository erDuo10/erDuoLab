const FLOWER_BASE = {
  // 基础配置
  base: {
    width: 1080,
    height: 1800,
    dpr: 2,
    ratio: 3 / 5
  },

  // 背景配置
  background: {
    gradient: {
      angle: 135,
      colors: ['#FF4B4B', '#FF6B6B']
    },
    pattern: {
      type: 'dot',
      size: 30,
      radius: 2,
      color: 'rgba(255, 255, 255, 0.1)'
    }
  },

  // 标题配置
  title: {
    text: '新春快乐',
    position: { y: 0.086 }, // 100/1800
    style: {
      color: '#FFFFFF',
      fontSize: 0.044,     // 80/1800
      fontWeight: 'bold',
      shadow: {
        color: 'rgba(0, 0, 0, 0.3)',
        blur: 6,
        offset: { x: 3, y: 3 }
      }
    }
  },

  flower: {
    position: { y: 0.167 },
    size: {
      width: 0.85,    // 整体花朵宽度比例
      height: 0.52    // 整体花朵高度比例
    },
    center: {
      size: 0.25,    // 增大中心圆尺寸
      color: '#FFC107',
      image: {
        src: '/images/lucky.png',
        size: 0.75
      }
    },
    petals: {
      count: 6,
      size: {
        width: 0.35,   // 单个花瓣宽度比例
        height: 0.55,  // 单个花瓣宽度比例
        curve: {
          topRadius: 0.5,  // 顶部弧度
          bottomRadius: 0.2,  // 底部弧度
          controlPoint: {
            x: 1.4,    // 控制点X轴范围
            y: 0.85   // 控制点Y轴范围
          }
        }
      },
      color: '#F44336',
      border: {
        width: 0.03,   // 适当调整边框宽度
        color: '#FFC107'
      },
      content: [
        { type: 'image', src: '/images/tangerine.png', size: 0.375, offsetY: 0.25, offsetX: 0 },
        { type: 'text', content: '意', offsetY: 0.35, offsetX: 0 },
        { type: 'text', content: '如', offsetY: 0.35, offsetX: 0 },
        { type: 'text', content: '事', offsetY: 0.35, offsetX: 0 },
        { type: 'text', content: '万', offsetY: 0.35, offsetX: 0 },
        { type: 'image', src: '/images/gold-ingot.png', size: 0.375, offsetY: 0.25, offsetX: 0 }
      ]
    }
  },

  // 祝福语配置
  blessing: {
    position: { y: 0.76 },  // 1600/1800
    style: {
      color: '#FFFFFF',
      fontSize: 0.022,       // 40/1800
      lineHeight: 1.8,
      padding: 0.093         // 100/1080
    },
    content: [
      '愿您在新的一年里',
      '福星高照 万事如意',
      '阖家欢乐 吉祥安康',
      '事业腾达 心想事成'
    ]
  },

  // 底部年份配置
  footer: {
    position: { y: 0.944 },  // 1700/1800
    style: {
      color: '#FFC107',
      fontSize: 0.017,       // 30/1800
      fontWeight: 'bold'
    },
    content: '乙巳蛇年 · 2025'
  },

  // 资源配置
  assets: {
    images: [
      'lucky.png',
      'tangerine.png',
      'gold-ingot.png'
    ],
    preload: true
  }
}

module.exports = { FLOWER_BASE }
