# 福卡小程序开发指南 - JavaScript 版本

## 项目概述
创建一个福卡微信小程序
使用 JavaScript 进行开发，
注重代码质量和可维护性。

## 技术栈
- 微信小程序原生开发（JavaScript）
- WXSS/LESS
- 微信云开发
- ESLint

## 项目结构
```
miniprogram/
├── pages/
│   ├── 模块名/
│   │   ├── 模块名.js            // 页面主入口
│   │   ├── 模块名-core.js       // 核心逻辑
│   │   ├── 模块名-interaction.js // 交互处理
│   │   ├── 模块名-storage.js    // 数据存储
│   │   ├── 模块名-style.js      // 样式管理
│   │   └── 模块名-ui.js         // UI交互
├── services/
│   ├── error-handler.js         // 错误处理
│   └── 其他业务服务.js
```

## 代码规范

### 1. 文件命名
```javascript
// 使用小写字母，中划线分隔
// 正确示例
game-service.js
sudoku-validator.js

// 错误示例
GameService.js
sudokuValidator.js
```

### 2. 变量命名
```javascript
// 使用驼峰命名法
const gameState = {}
let currentPuzzle = null
const MAX_HINTS = 3

// 组件实例使用 $ 前缀
const $board = this.selectComponent('#sudokuBoard')
```

### 3. 函数命名
```javascript
// 动词开头，清晰表达功能
function initGame() {}
function validateMove() {}
function handleTapCell() {}
```

### 4. 模块职责
- **core.js**: 状态管理、核心业务逻辑、生命周期管理
- **interaction.js**: 用户输入处理、事件响应、交互验证
- **storage.js**: 数据持久化、缓存管理、存档处理
- **style.js**: UI状态管理、样式更新、动画效果
- **ui.js**: 提示信息、加载状态、对话框管理

### 5. 模块通信
- 单向数据流：用户操作 -> interaction -> core -> storage/style/ui
- 状态更新：统一通过 `core.updateGameState()` 更新
- 错误处理：统一使用 `ErrorHandler`

### 6. 注释规范
```javascript
/**
 * 检查数独解法是否有效
 * @param {Array<Array<number>>} board - 数独板
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @param {number} num - 待检查的数字
 * @returns {boolean} 是否有效
 */
function isValidSolution(board, row, col, num) {
  // 实现逻辑
}

// 行内注释使用空格
// 正确示例
const result = calculate() // 计算结果

// 错误示例
const result = calculate()//计算结果
```

### 7. 代码模板

#### 7.1 页面组件
```javascript
// pages/模块名/模块名.js
Page({
  data: {
    // 数据结构清晰
    state: {
      status: 'READY',
      progress: [],
      timeSpent: 0
    },
    loading: false,
    error: null
  },

  // 生命周期函数
  onLoad(options) {
    this.initModule(options)
  },

  // 事件处理函数
  handleEvent(event) {
    ModuleInteraction.handleEvent(this, event)
  }
})
```

#### 7.2 模块导出格式
```javascript
const ModuleName = {
    // 公共方法
    publicMethod() {},
    
    // 私有方法（下划线开头）
    _privateMethod() {}
}

module.exports = ModuleName
```

#### 7.3 错误处理格式
```javascript
try {
    // 业务逻辑
} catch (error) {
    ErrorHandler.handle(error, 'methodName')
}
```

### 8. 状态管理
```javascript
// 使用不可变数据模式
const newState = {
  ...oldState,
  updatedProperty: newValue
}

// 避免频繁 setData
this.setData({
  ['state.progress']: newProgress
})
```

## 特别注意
1. 保持代码简洁，避免过度设计
2. 优先使用函数式编程方法
3. 做好错误处理和日志记录
4. 注重代码复用性
5. 保持良好的代码注释

## 输出要求
1. 代码结构清晰，遵循模块化原则
2. 实现完整的错误处理机制
3. 包含必要的注释和文档
4. 确保代码可维护性和可扩展性

--------------------------------

