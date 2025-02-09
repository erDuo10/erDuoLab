const STYLE_CONFIG = {
  // 黄色: #FFF697, #FCA91B,
  colors: {
    main: ['#F44336', '#E53935', '#D32F2F'],     // 主要像素点颜色
    related: [ '#FFC107', '#FFB300', '#FFC107'],   // 相关像素点颜色 FCA91B
    background: '#F44336',                         // 背景色
    contentBg: '#F5E6CA',                          // 内容区域背景色
    corner: '#F44336',                             // 角落装饰颜色
    year: '#FFF697',                               // 年份文字颜色 #FCA91B
    blessing: '#FFF697'                            // 祝福语文字颜色
  },
  decoration: {
    density: 0.2,    // 装饰点密度
    minSize: 0.4,    // 最小尺寸（相对于主像素）
    maxSize: 0.8     // 最大尺寸（相对于主像素）
  },
  fonts: {
    family: '"PingFang SC", "Microsoft YaHei", sans-serif',
    weight: 'bold'
  },
  animation: {
    duration: 300,  // 动画持续时间(ms)
    delay: 50      // 像素点动画延迟(ms)
  }
}

module.exports = { STYLE_CONFIG }
