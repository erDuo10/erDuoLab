db.collection('duo_achievement_configs')
    .add({
        data:
            [
                {
                    _id: "gc_first_win",
                    id: "FIRST_WIN",
                    name: "初次胜利",
                    description: "完成第一局数独游戏",
                    type: "GAME_COMPLETION",
                    category: {
                        id: "basic_progress",
                        name: "基础进度"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/first-win.png",
                    targetValue: 1,
                    difficulty: "ANY",
                    points: 10,
                    rewards: [{
                        type: "COINS",
                        value: 100  // 10倍
                    }],
                    order: 100,
                    isMilestone: false,
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },

                {
                    _id: "gc_sudoku_novice",
                    id: "SUDOKU_NOVICE",
                    name: "数独新手",
                    description: "完成10局数独游戏",
                    type: "GAME_COMPLETION",
                    category: {
                        id: "basic_progress",
                        name: "基础进度"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/sudoku-novice.png",
                    targetValue: 10,
                    difficulty: "ANY",
                    points: 20,
                    rewards: [{
                        type: "COINS",
                        value: 200  // 10倍
                    }],
                    order: 101,
                    isMilestone: false,
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "gc_sudoku_master",
                    id: "SUDOKU_MASTER",
                    name: "数独大师",
                    description: "完成100局数独游戏",
                    type: "GAME_COMPLETION",
                    category: {
                        id: "basic_progress",
                        name: "基础进度"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/sudoku-master.png",
                    targetValue: 100,
                    difficulty: "ANY",
                    points: 50,
                    rewards: [{
                        type: "COINS",
                        value: 1000  // 20倍，里程碑奖励
                    }],
                    order: 102,
                    isMilestone: true,
                    milestoneType: "MASTER",
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "diff_medium_challenger",
                    id: "MEDIUM_CHALLENGER",
                    name: "挑战中等",
                    description: "首次完成中等难度",
                    type: "DIFFICULTY",
                    category: {
                        id: "difficulty",
                        name: "难度突破"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/medium-challenger.png",
                    targetValue: 1,
                    difficulty: "medium",
                    points: 30,
                    rewards: [{
                        type: "COINS",
                        value: 300  // 10倍
                    }],
                    order: 200,
                    isMilestone: false,
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "diff_hard_challenger",
                    id: "HARD_CHALLENGER",
                    name: "挑战困难",
                    description: "首次完成困难难度",
                    type: "DIFFICULTY",
                    category: {
                        id: "difficulty",
                        name: "难度突破"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/hard-challenger.png",
                    targetValue: 1,
                    difficulty: "hard",
                    points: 40,
                    rewards: [{
                        type: "COINS",
                        value: 400  // 调整为10倍
                    }],
                    order: 201,
                    isMilestone: false,
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "diff_hard_master",
                    id: "HARD_MASTER",
                    name: "困难大师",
                    description: "完成10局困难难度",
                    type: "DIFFICULTY",
                    category: {
                        id: "difficulty",
                        name: "难度突破"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/hard-master.png",
                    targetValue: 10,
                    difficulty: "hard",
                    points: 100,
                    rewards: [{
                        type: "COINS",
                        value: 2000  // 20倍，里程碑奖励
                    }],
                    order: 202,
                    isMilestone: true,
                    milestoneType: "MASTER",
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "perfect_easy",
                    id: "PERFECT_EASY",
                    name: "完美新手",
                    description: "无错误且不使用提示完成简单难度",
                    type: "PERFECT_GAME",
                    category: {
                        id: "perfect",
                        name: "完美通关"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/perfect-easy.png",
                    difficulty: "easy",
                    conditions: {
                        errors: 0,
                        hints: 0
                    },
                    points: 40,
                    rewards: [{
                        type: "COINS",
                        value: 400
                    }],
                    order: 300,
                    isMilestone: false,
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "perfect_master",
                    id: "PERFECT_MASTER",
                    name: "完美大师",
                    description: "无错误且不使用提示完成困难难度",
                    type: "PERFECT_GAME",
                    category: {
                        id: "perfect",
                        name: "完美通关"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/perfect-master.png",
                    difficulty: "hard",
                    conditions: {
                        errors: 0,
                        hints: 0
                    },
                    points: 100,
                    rewards: [{
                        type: "COINS",
                        value: 2000
                    }],
                    order: 301,
                    isMilestone: true,
                    milestoneType: "PERFECT",
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "speed_easy",
                    id: "SPEED_EASY",
                    name: "速战速决",
                    description: "3分钟内完成简单难度",
                    type: "SPEED",
                    category: {
                        id: "speed",
                        name: "速度挑战"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/speed-easy.png",
                    targetValue: 180,
                    difficulty: "easy",
                    points: 30,
                    rewards: [{
                        type: "COINS",
                        value: 300  // 10倍
                    }],
                    order: 400,
                    isMilestone: false,
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "speed_medium",
                    id: "SPEED_MEDIUM",
                    name: "快速大师",
                    description: "5分钟内完成中等难度",
                    type: "SPEED",
                    category: {
                        id: "speed",
                        name: "速度挑战"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/speed-medium.png",
                    targetValue: 300,
                    difficulty: "medium",
                    points: 50,
                    rewards: [{
                        type: "COINS",
                        value: 500  // 10倍
                    }],
                    order: 401,
                    isMilestone: false,
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "speed_hard",
                    id: "SPEED_HARD",
                    name: "闪电大师",
                    description: "10分钟内完成困难难度",
                    type: "SPEED",
                    category: {
                        id: "speed",
                        name: "速度挑战"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/speed-hard.png",
                    targetValue: 600,
                    difficulty: "hard",
                    points: 100,
                    rewards: [{
                        type: "COINS",
                        value: 2000  // 20倍，里程碑奖励
                    }],
                    order: 402,
                    isMilestone: true,
                    milestoneType: "MASTER",
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "streak_daily_3",
                    id: "DAILY_STREAK_3",
                    name: "坚持不懈",
                    description: "连续3天完成游戏",
                    type: "STREAK",
                    subType: "DAILY",
                    category: {
                        id: "streak",
                        name: "连续成就"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/daily-streak-3.png",
                    targetValue: 3,
                    points: 30,
                    rewards: [{
                        type: "COINS",
                        value: 300  // 10倍
                    }],
                    order: 500,
                    isMilestone: false,
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "streak_daily_7",
                    id: "DAILY_STREAK_7",
                    name: "一周达人",
                    description: "连续7天完成游戏",
                    type: "STREAK",
                    subType: "DAILY",
                    category: {
                        id: "streak",
                        name: "连续成就"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/daily-streak-7.png",
                    targetValue: 7,
                    points: 70,
                    rewards: [{
                        type: "COINS",
                        value: 1400  // 20倍，里程碑奖励
                    }],
                    order: 501,
                    isMilestone: true,
                    milestoneType: "STREAK",
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "streak_perfect_3",
                    id: "PERFECT_STREAK_3",
                    name: "完美连胜",
                    description: "连续3局无错误完成游戏",
                    type: "STREAK",
                    subType: "PERFECT",
                    category: {
                        id: "streak",
                        name: "连续成就"
                    },
                    icon: "云资源路径/duo/sudoku/icons/achievements/perfect-streak-3.png",
                    targetValue: 3,
                    points: 50,
                    rewards: [{
                        type: "COINS",
                        value: 500  // 10倍
                    }],
                    order: 502,
                    isMilestone: false,
                    status: "ACTIVE",
                    version: "1.0.0",
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ]
    })



