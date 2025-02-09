// jest.config.js
module.exports = {
    // 测试环境
    testEnvironment: 'jsdom',
  
    // 测试文件匹配
    testMatch: [
      "**/tests/**/*.test.js"
    ],
  
    // 覆盖率配置
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'html', 'lcov'],
    
    // 忽略的文件
    testPathIgnorePatterns: [
      "/node_modules/"
    ],
  
    // 模块路径别名
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/miniprogram/$1"
    },
  
    // 测试启动前的设置文件
    setupFiles: [
      "<rootDir>/miniprogram/tests/setup.js"
    ],
  
    // 转换器配置
    transform: {
      "^.+\\.js$": "babel-jest"
    },
  
    // 模块文件扩展名
    moduleFileExtensions: ['js', 'json'],
  
    // 覆盖率收集范围
    collectCoverageFrom: [
      "miniprogram/**/*.js",
      "!miniprogram/node_modules/**",
      "!miniprogram/vendor/**"
    ]
  };