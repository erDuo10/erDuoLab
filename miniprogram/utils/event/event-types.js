// utils/event/event-types.js

/**
 * @typedef {Object} GameEvents
 * @property {'GAME_COMPLETED'} COMPLETED
 */

/**
 * @typedef {Object} AchievementEvents
 * @property {'ACHIEVEMENT_UNLOCK'} UNLOCK
 * @property {'ACHIEVEMENT_PROGRESS'} PROGRESS
 * @property {'ACHIEVEMENT_COMPLETE'} COMPLETE
 * @property {'ACHIEVEMENT_NOTIFICATION'} NOTIFICATION
 * @property {'ACHIEVEMENT_REWARD'} REWARD
 */

/**
 * @typedef {Object} UIEvents
 * @property {'UI_UPDATE'} UPDATE
 */

/**
 * @typedef {Object} EventTypes
 * @property {GameEvents} GAME
 * @property {AchievementEvents} ACHIEVEMENT
 * @property {UIEvents} UI
 */

const EventTypes = {
  GAME: {
    COMPLETED: 'GAME_COMPLETED'
  },
  ACHIEVEMENT: {
    BATCH_UNLOCK: 'ACHIEVEMENT_BATCH_UNLOCK',
    BATCH_PROGRESS: 'ACHIEVEMENT_BATCH_PROGRESS',
    REWARD: 'ACHIEVEMENT_REWARD'
  },
  UI: {
    UPDATE: 'UI_UPDATE'
  },  /** 用户事件 */
  USER: {
    /** 登录成功 */
    LOGIN: 'USER_LOGIN',
    /** 登出成功 */
    LOGOUT: 'USER_LOGOUT',

  },
}

module.exports = EventTypes


