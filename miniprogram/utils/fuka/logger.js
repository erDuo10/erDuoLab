const { formatDate } = require('./helper');

class Logger {
    static levels = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    static currentLevel = Logger.levels.INFO;

    static setLevel(level) {
        if (level in Logger.levels) {
            Logger.currentLevel = Logger.levels[level];
        }
    }

    static format(level, message, data = null) {
        const timestamp = formatDate(new Date());
        const dataStr = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
        return `[${timestamp}] [${level}] ${message}${dataStr}`;
    }

    static debug(message, data = null) {
        if (Logger.currentLevel <= Logger.levels.DEBUG) {
            console.debug(Logger.format('DEBUG', message, data));
        }
    }

    static info(message, data = null) {
        if (Logger.currentLevel <= Logger.levels.INFO) {
            console.info(Logger.format('INFO', message, data));
        }
    }

    static warn(message, data = null) {
        if (Logger.currentLevel <= Logger.levels.WARN) {
            console.warn(Logger.format('WARN', message, data));
        }
    }

    static error(message, error = null) {
        if (Logger.currentLevel <= Logger.levels.ERROR) {
            console.error(Logger.format('ERROR', message, {
                message: error?.message,
                stack: error?.stack
            }));
        }
    }

    // 性能日志
    static performance(label, startTime) {
        const duration = Date.now() - startTime;
        Logger.info(`Performance [${label}]: ${duration}ms`);
    }

    // 用户行为日志
    static trackUserAction(action, params = {}) {
        Logger.info('User Action', {
            action,
            params,
            timestamp: Date.now()
        });
    }

    // 错误上报
    static reportError(error, context = {}) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now()
        };
        
        Logger.error('Error Report', errorInfo);
        
        // 可以在这里添加错误上报逻辑
        // wx.request({
        //     url: 'error-reporting-endpoint',
        //     data: errorInfo
        // });
    }
}

module.exports = Logger;