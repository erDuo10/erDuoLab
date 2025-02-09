// 福卡样式类型
const FUKA_STYLES = {
    PIXEL: 'pixel',
    SLOT: 'slot',
    CIRCLE: 'circle'
};

// 福卡类别
const FUKA_CATEGORIES = {
    STUDY: 'study',
    WORK: 'work',
    LOVE: 'love',
    WEALTH: 'wealth',
    HEALTH: 'health',
    FAMILY: 'family'
};

// 限制配置
const LIMITS = {
    DAILY_GENERATE: 6,    // 每日生成次数
    MAX_COLLECTION: 50,    // 最大收藏数量
    SHARE_INTERVAL: 300    // 分享间隔（秒）
};

// 缓存键
const CACHE_KEYS = {
    USER_INFO: 'USER_INFO',
    DAILY_COUNT: 'DAILY_COUNT',
    COLLECTION_LIST: 'COLLECTION_LIST',
    LAST_SHARE_TIME: 'LAST_SHARE_TIME'
};

// 错误码
const ERROR_CODES = {
    PARAM_ERROR: 1001,
    DAILY_LIMIT: 1002,
    DB_ERROR: 1003,
    NOT_FOUND: 1004,
    PERMISSION_DENIED: 1005,
    OPERATION_TOO_FREQUENT: 1006
};

module.exports = {
    FUKA_STYLES,
    FUKA_CATEGORIES,
    LIMITS,
    CACHE_KEYS,
    ERROR_CODES
};