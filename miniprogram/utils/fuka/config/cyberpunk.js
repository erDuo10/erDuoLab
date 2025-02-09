const CYBERPUNK_BASE = {
  // 背景配置
  background: {
    colors: [
      { color1: '#1a0f40', color2: '#2a1f60' },
      { color1: '#201f60', color2: '#302f80' },
      { color1: '#2f1f50', color2: '#3f2f70' },
      { color1: '#251f70', color2: '#352f90' }
    ],
    rects: {
      count: 100,
      minWidth: 20,
      maxWidth: 120,
      minHeight: 30,
      maxHeight: 180,
      opacity: 0.25
    }
  },

  // 年份配置
  year: {
    position: {
      y: 0.12 // 距顶部比例
    },
    size: {
      pixel: 30,
      gap: 3,
      spacing: 40 // 数字间距
    },
    color: '#00ffff',
    glow: {
      // 简化发光配置，使用单层柔和发光
      color: 'rgba(0, 255, 255, 0.8)',
      blur: 30,
      spread: 2,
      // 环境光配置
      ambient: {
        color: 'rgba(0, 255, 255, 0.15)',
        blur: 30,
        spread: 4
      }
    },
    content: '2025'
  },

  // 文字配置
  text: {
    position: {
      y: 0.3, // 距顶部比例
      spacing: 200 // 左右文字列间距
    },
    size: {
      pixel: 20,
      gap: 3,
      charSpacing: 80  // 增加字符间距
    },
    left: {
      content: '新年快乐',
      colors: {
        primary: '#ff0088',
        secondary: '#ff69b4'
      }
    },
    right: {
      content: '万事如意',
      offset: 100, // 右侧文字向下偏移
      colors: {
        primary: '#00ffff',
        secondary: '#0066ff'
      }
    }
  },

  // 数字点阵定义
  digits: {
    '2': [
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 1]
    ],
    '0': [
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1]
    ],
    '5': [
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1]
    ]
  },
}

module.exports = { CYBERPUNK_BASE }
