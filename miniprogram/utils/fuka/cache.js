const { CACHE_KEYS } = require('./constants');

class Cache {
    // 设置缓存
    static set(key, value, expireTime = 0) {
        try {
            const data = {
                value,
                timestamp: Date.now(),
                expireTime
            };
            wx.setStorageSync(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    // 获取缓存
    static get(key) {
        try {
            const dataStr = wx.getStorageSync(key);
            if (!dataStr) return null;

            const data = JSON.parse(dataStr);
            if (data.expireTime > 0) {
                const now = Date.now();
                if (now - data.timestamp > data.expireTime) {
                    this.remove(key);
                    return null;
                }
            }
            return data.value;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    // 移除缓存
    static remove(key) {
        try {
            wx.removeStorageSync(key);
            return true;
        } catch (error) {
            console.error('Cache remove error:', error);
            return false;
        }
    }

    // 清除所有缓存
    static clear() {
        try {
            wx.clearStorageSync();
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }

    // 获取用户信息缓存
    static getUserInfo() {
        return this.get(CACHE_KEYS.USER_INFO);
    }

    // 设置用户信息缓存
    static setUserInfo(userInfo) {
        return this.set(CACHE_KEYS.USER_INFO, userInfo);
    }

    // 获取每日生成次数
    static getDailyCount() {
        return this.get(CACHE_KEYS.DAILY_COUNT) || 0;
    }

    // 更新每日生成次数
    static updateDailyCount(count) {
        // 设置过期时间为当天结束
        const now = new Date();
        const endOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        ).getTime();
        const expireTime = endOfDay - now.getTime();
        
        return this.set(CACHE_KEYS.DAILY_COUNT, count, expireTime);
    }
}

module.exports = Cache;