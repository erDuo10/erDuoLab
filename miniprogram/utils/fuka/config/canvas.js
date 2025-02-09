const CANVAS_BASE = {
  // 内容区域大小
  content: {
    ratio: 0.96,     // 内容区域占整体画布的比例
  },
  // 文字配置
  text: {
    year: {
      sizeRatio: 0.08,  // 年份文字大小（相对于画布高度）
      position: 0.12,     // 年份文字位置（相对于画布高度）
      content: '2025'    // 年份内容
    },
    blessing: {
      sizeRatio: 0.06,  // 祝福语文字大小
      position: 0.90,    // 祝福语位置
      content: '新年快乐' // 祝福语内容
    }
  },
  pixelization: {
    // 字体配置
    font: {
      size: 160,          // 基础字体大小
      family: '"PingFang SC", "Microsoft YaHei", sans-serif',
      weight: 'bold'
    },

    // 阈值配置
    threshold: {
      thick: 1.8          // 增加粗笔画倍数,加强笔画对比
    },

    // 预设方案
    presets: {
      main: {
        canvasSize: 200,    // 平衡性能和质量的基准大小
        sampleRate: 4,      // 中等采样率
        fontSize: 140,      // 字体大小约为画布的60%
        threshold: 128      // 标准阈值(0-255的中间值)
      },

      related: {
        canvasSize: 160,    // 平衡性能和质量的基准大小
        sampleRate: 6,      // 中等采样率
        fontSize: 130,      // 字体大小约为画布的60%
        threshold: 128      // 标准阈值(0-255的中间值)
      }
    }
  },
  // 更新像素字符配置
  pixelChar: {
    main: {
      matrix: 64,    // 主字符像素矩阵大小（影响清晰度）
      size: 10,      // 主字符像素点基础大小
      gap: 10,       // 主字符像素点间距
      scale: 1,      // 主字符整体缩放比例
    },
    related: {
      matrix: 8,      // 相关字符像素矩阵大小（较小以区分主次）
      size: 8,        // 相关字符像素点基础大小
      gap: 5,         // 相关字符像素点间距
      scale: 0.55,    // 相关字符默认缩放比例
      minScale: 0.45, // 最小缩放比例
      maxScale: 0.7   // 最大缩放比例
    },

    layout: {
      baseSize: 1080,  // 布局基准尺寸

      // 4.1 分布半径控制 
      distributionRadiusFactor: 0.55,  // 分布范围因子 整体分布范围 (相对于内容区域的45%)
      // 作用：控制相关字符分布的整体范围
      // 值越大，字符分布越分散；值越小，字符分布越集中

      baseRadiusBaseFactor: 0.5,      // 基础半径因子 (相对于内容区域的55%)
      // 作用：控制相关字符到主字符的基础距离
      // 值越大，相关字符离主字符越远

      baseRadiusRandomFactor: 0.2,    // 随机半径因子 随机半径变化范围 (±35%)
      // 作用：为距离添加随机变化
      // 值越大，字符间距的随机性越强

      // 4.2 位置微调控制
      jitterFactor: 0.02,              // 抖动因子 位置抖动范围 (相对于内容区域的2%)
      // 作用：为字符位置添加细微随机偏移
      // 值越大，位置偏移越明显

      angleVariation: Math.PI / 6    // 角度变化范围
      // 作用：控制字符分布的角度随机范围
      // 值越大，角度分布越随机
    }


  }
}

module.exports = { CANVAS_BASE }
