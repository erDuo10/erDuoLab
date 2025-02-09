// tests/setup.js
// 模拟小程序环境
global.wx = {
    getStorageSync: jest.fn(),
    setStorageSync: jest.fn(),
    showToast: jest.fn(),
    showModal: jest.fn()
  };
  
  // 其他全局设置
  global.getCurrentPages = jest.fn(() => []);