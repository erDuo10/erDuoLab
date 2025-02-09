// utils/event/event-data.js

/**
 * @typedef {Object} BaseEventData
 * @property {number} timestamp - 事件时间戳
 * @property {string} [source] - 事件来源
 */

/**
 * @typedef {Object} GameEventData
 * @property {number} timestamp - 事件时间戳
 * @property {string} [source] - 事件来源
 * @property {string} difficulty - 游戏难度
 * @property {number} timeSpent - 耗时
 * @property {number} errorCount - 错误次数
 * @property {number} hintsUsed - 提示使用次数
 * @property {boolean} isCompleted - 是否完成
 */

/**
 * @typedef {Object} AchievementEventData
 * @property {number} timestamp - 事件时间戳
 * @property {string} [source] - 事件来源
 * @property {string} id - 成就ID
 * @property {string} name - 成就名称
 * @property {string} description - 成就描述
 * @property {number} progress - 进度
 * @property {boolean} unlocked - 是否解锁
 * @property {Date} [unlockTime] - 解锁时间
 * @property {'achievement'} type - 类型标识
 */

/**
 * @typedef {Object} UIUpdateData
 * @property {number} timestamp - 事件时间戳
 * @property {string} [source] - 事件来源
 * @property {'achievement'|'reward'|'user'} type - 更新类型
 * @property {AchievementEventData|RewardEventData|UserEventData} data - 更新数据
 */

module.exports = {}  // 只导出类型定义，实际数据由工厂创建
