- Windows系统显示所有文件和文件夹
tree /F

cloudfunctions
│  config.json
│
├─duoAchievement
│      config.json
│      index.js
│      package-lock.json
│      package.json
│
├─duoGameState
│      config.json
│      index.js
│      package-lock.json
│      package.json
│
├─duoGameStatistics
│      config.json
│      index.js
│      package-lock.json
│      package.json
│
├─duoReward
│      config.json
│      index.js
│      package.json
│
└─duoUser
        config.json
        index.js
        package.json

miniprogram:
│  app.js
│  app.json
│  app.wxss
│  envList.js
│  uploadCloudFunction.bat
│  uploadError.txt
│
├─components
│  ├─achievement-notification
│  │      index.js
│  │      index.json
│  │      index.wxml
│  │      index.wxss
│  │
│  ├─game-complete-modal
│  │      index.js
│  │      index.json
│  │      index.wxml
│  │      index.wxss
│  │
│  ├─game-load-save-modal
│  │      index.js
│  │      index.json
│  │      index.wxml
│  │      index.wxss
│  │
│  ├─game-restart-modal
│  │      index.js
│  │      index.json
│  │      index.wxml
│  │      index.wxss
│  │
│  ├─hint-button
│  │      index.js
│  │      index.json
│  │      index.wxml
│  │      index.wxss
│  │
│  ├─number-pad
│  │      index.js
│  │      index.json
│  │      index.wxml
│  │      index.wxss
│  │
│  ├─sudoku-board
│  │      index.js
│  │      index.json
│  │      index.wxml
│  │      index.wxss
│  │      utils.wxs
│  │
│  └─timer
│          index.js
│          index.json
│          index.wxml
│          index.wxss
│
├─config
│      app-config.js
│
├─images
│      about-active.png
│      about.png
│      achievement.png
│      arrow.svg
│      coin.png
│      logo.png
│      sudoku-active.png
│      sudoku-game.png
│      sudoku-index.png
│      sudoku.png
│
├─pages
│  ├─about
│  │      about.js
│  │      about.json
│  │      about.wxml
│  │      about.wxss
│  │
│  ├─achievements
│  │      achievements.js
│  │      achievements.wxml
│  │      achievements.wxss
│  │
│  ├─game
│  │      game-core.js
│  │      game-interaction.js
│  │      game-storage.js
│  │      game-style.js
│  │      game-ui.js
│  │      game.js
│  │      game.json
│  │      game.wxml
│  │      game.wxss
│  │
│  └─index
│          index.js
│          index.wxml
│          index.wxss
│
├─services
│  │  error-handler.js
│  │
│  ├─achievement
│  │      achievement-manager.js
│  │      achievement-notification.js
│  │
│  ├─game
│  │      game-state.js
│  │      game.js
│  │      history-manager.js
│  │
│  ├─reward
│  │      reward-config.js
│  │      reward-handler.js
│  │      reward-manager.js
│  │      reward-storage.js
│  │
│  └─user
│          user-auth.js
│          user-manager.js
│          user-storage.js
│
├─tests
│      setup.js
│
└─utils
    ├─constants
    │      error-codes.js
    │      game-constants.js
    │
    ├─event
    │      event-data.js
    │      event-manager.js
    │      event-types.js
    │
    ├─helpers
    │      logger.js
    │
    ├─storage
    │      local-storage.js
    │
    └─wxs
            format.wxs