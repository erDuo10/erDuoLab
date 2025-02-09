const SLOT_BASE = {
  // 基础配置
  base: {
    width: 1080,
    height: 1800,
    background: {
      gradient: {
        start: '#ff5555',
        end: '#ff3333'
      },
      borderRadius: 40
    }
  },

  // 头部配置
  header: {
    top: 100,
    width: '60%',
    height: 180,
    background: {
      gradient: {
        start: '#F5E6CA',
        end: '#F5E6BF'
      },
      borderRadius: 40
    },
    text: {
      content: '新年快乐',
      size: 100,
      gradient: {
        start: '#ffa500',
        end: '#ff8c00'
      },
      offset: 5
    }
  },

  // 显示区域配置
  display: {
    length: 0.9,
    grid: {
      rows: 4,
      cols: 4,
      gap: 30,
      padding: 40
    },
    background: {
      gradient: {
        start: '#f0f0f0',
        end: '#ffffff'
      },
      borderRadius: 45,
      border: {
        width: 12,
        color: '#FFC107'
      }
    }
  },

  // 格子配置
  reel: {
    background: {
      gradient: {
        start: '#ffffff',
        end: '#f5f5f5'
      },
      borderRadius: 15,
      glow: {
        color: '#ff8c00',
        blur: 10
      }
    },
    image: {
      size: 0.7
    }
  },

  // 文字格子配置
  textReel: {
    background: {
      gradient: {
        start: '#ff5555',
        end: '#ff3333'
      }
    },
    text: {
      size: 80,
      color: '#ffeb3b', // 更改为亮黄色
      weight: 'bold'
    }
  },

  // 底部按钮配置
  buttons: {
    layout: {
      gap: 45,
      marginTop: 50,
      marginBottom: 160
    },
    style: {
      size: 120,
      background: {
        gradient: {
          start: '#ffeb4d',
          end: '#ffd700'
        }
      },
      borderRadius: 24,
      fontSize: 60,
      color: '#ff4444'
    },
    content: ['2', '0', '2', '5']
  },

  // 拉杆配置
  lever: {
    position: {
      right: 160,
      top: '80%'
    },
    handle: {
      size: 105,
      background: {
        gradient: {
          start: '#ff4444',
          end: '#ff2222'
        }
      }
    },
    bar: {
      width: 24,
      height: 210,
      background: {
        gradient: {
          start: '#dddddd',
          end: '#cccccc'
        }
      }
    }
  },

  // 素材配置
  assets: {
    images: [
      'tangerine.png',    // 橘子
      'gold-ingot.png',   // 元宝
      'apple.png',        // 苹果
      'persimmon.png',     // 柿子
      'qrcode.jpg'         // 小程序码
    ],
    wishes: ['万', '事', '如', '意']
  }
}

module.exports = { SLOT_BASE }
