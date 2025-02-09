

好的，我来帮您组织与 Composer 的交互内容。我们按批次进行：

### 第一批：基础配置和常量

````markdown
参考 系统整体设计 文档
请生成以下文件的完整代码：

miniprogram/
├── config/
│   ├── app-config.js        # 应用配置
│   └── api-config.js        # API配置
└── utils/constants/
    ├── game-constants.js    # 游戏常量
    ├── error-codes.js       # 错误码
    └── event-types.js       # 事件类型

文件依赖关系：
- 这些是基础配置和常量定义
- 被其他模块引用
- 不依赖其他模块

代码要求：
1. 使用 ES6 模块语法
2. 添加完整的 JSDoc 注释
3. 包含详细的常量说明
4. 使用 module.exports 导出

相关上下文：
1. 项目类型：微信小程序
2. 项目功能：数独游戏成就系统
3. 开发语言：JavaScript (ES6+)
4. 运行环境：微信小程序环境
````

### 第二批：工具类

````markdown
参考 系统整体设计 文档
请生成以下文件的完整代码：

miniprogram/utils/
├── storage/
│   ├── local-storage.js     # 本地存储工具
│   └── cloud-storage.js     # 云存储工具
├── event/
│   ├── event-manager.js     # 事件管理
│   └── event-types.js       # 事件类型定义
└── helpers/
    ├── formatter.js         # 格式化工具
    ├── validator.js         # 验证工具
    └── logger.js           # 日志工具

文件依赖关系：
- 依赖于 config/ 和 constants/ 中的配置
- 被服务层和UI层使用
- storage 依赖于 logger 进行错误日志记录
- event-manager 依赖于 event-types

代码要求：
1. 包含错误处理机制
2. 添加完整的单元测试注释
3. 包含使用示例注释
4. 异步操作使用 Promise
````

### 第三批：核心服务层

````markdown
参考 系统整体设计 文档
请生成以下文件的完整代码：

miniprogram/services/
├── user/
│   ├── user-manager.js      # 用户管理
│   ├── user-storage.js      # 用户数据存储
│   └── user-auth.js         # 用户认证
├── achievement/
│   ├── achievement-manager.js     # 成就管理
│   ├── achievement-storage.js     # 成就存储
│   ├── achievement-config.js      # 成就配置
│   └── achievement-checker.js     # 成就检查器
└── reward/
    ├── reward-manager.js    # 奖励管理
    ├── reward-storage.js    # 奖励存储
    ├── reward-config.js     # 奖励配置
    └── reward-handler.js    # 奖励处理器

文件依赖关系：
- 依赖于 utils/ 中的所有工具
- achievement-manager 依赖于 user-manager
- reward-manager 依赖于 achievement-manager
- 所有 storage 类依赖于 storage 工具

代码要求：
1. 实现完整的业务逻辑
2. 包含事件触发机制
3. 完整的错误处理
4. 数据同步机制
````


### 第四批：UI组件和页面

````markdown
参考 系统整体设计 文档
请生成以下文件的完整代码：

miniprogram/
├── components/
│   ├── achievement-panel/    # 成就面板
│   │   ├── index.js         # 组件逻辑
│   │   ├── index.wxml       # 组件模板
│   │   └── index.wxss       # 组件样式
│   └── reward-panel/        # 奖励面板
│       ├── index.js         # 组件逻辑
│       ├── index.wxml       # 组件模板
│       └── index.wxss       # 组件样式
└── pages/
    ├── profile/            # 个人资料页
    │   ├── profile.js      # 页面逻辑
    │   ├── profile.wxml    # 页面模板
    │   ├── profile.wxss    # 页面样式
    │   ├── profile-core.js # 核心业务逻辑
    │   └── profile-ui.js   # UI交互逻辑
    │
    ├── achievements/       # 成就页面
    │   ├── achievements.js      # 页面逻辑
    │   ├── achievements.wxml    # 页面模板
    │   ├── achievements.wxss    # 页面样式
    │   ├── achievements-core.js # 核心业务逻辑
    │   └── achievements-ui.js   # UI交互逻辑
    │
    └── rewards/           # 奖励页面
        ├── rewards.js         # 页面逻辑
        ├── rewards.wxml       # 页面模板
        ├── rewards.wxss       # 页面样式
        ├── rewards-core.js    # 核心业务逻辑
        └── rewards-ui.js      # UI交互逻辑

文件依赖关系：
- 依赖于 services/ 中的对应服务
- 依赖于 utils/ 中的工具
- 页面可能使用自定义组件
- core.js 包含业务逻辑，ui.js 处理界面交互
- wxml 依赖于对应的 js 中定义的数据和方法
- wxss 定义页面和组件的样式

代码要求：
1. 遵循微信小程序组件开发规范
2. 实现完整的生命周期函数
3. 包含适当的注释
4. 实现错误提示和加载状态
5. WXML 需包含完整的视图结构
6. WXSS 需要适配不同屏幕尺寸
7. 实现页面间的正确跳转
8. 包含合适的动画效果

UI/UX要求：
1. 遵循微信小程序设计规范
2. 实现响应式布局
3. 合理的空间布局
4. 适当的交互反馈
5. 加载状态的展示
6. 错误状态的处理
7. 空状态的展示
````
