const { LIMITS } = require('./constants');

const helper = {
    // 生成唯一ID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // 格式化时间
    formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    // 检查分享频率限制
    checkShareLimit(lastShareTime) {
        if (!lastShareTime) return true;
        const now = Date.now();
        return (now - lastShareTime) >= (LIMITS.SHARE_INTERVAL * 1000);
    },

    // 随机选择
    randomSelect(items, count = 1) {
        const result = [];
        const temp = [...items];
        
        for (let i = 0; i < count && temp.length > 0; i++) {
            const index = Math.floor(Math.random() * temp.length);
            result.push(temp.splice(index, 1)[0]);
        }
        
        return count === 1 ? result[0] : result;
    },

    // 防抖函数
    debounce(fn, delay = 500) {
        let timer = null;
        return function(...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    },

    // 节流函数
    throttle(fn, interval = 500) {
        let last = 0;
        return function(...args) {
            const now = Date.now();
            if (now - last >= interval) {
                last = now;
                fn.apply(this, args);
            }
        };
    },

    // 深拷贝
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        
        const clone = Array.isArray(obj) ? [] : {};
        
        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clone[key] = this.deepClone(obj[key]);
            }
        }
        
        return clone;
    },

    // 检查权限
    async checkPermission(scope) {
        try {
            const res = await wx.getSetting();
            if (!res.authSetting[`scope.${scope}`]) {
                await wx.authorize({ scope: `scope.${scope}` });
            }
            return true;
        } catch (error) {
            console.error('Permission check failed:', error);
            return false;
        }
    },

    // 显示加载提示
    showLoading(title = '加载中...') {
        wx.showLoading({
            title,
            mask: true
        });
    },

    // 隐藏加载提示
    hideLoading() {
        wx.hideLoading();
    },

    // 显示提示
    showToast(options) {
        const defaultOptions = {
            icon: 'none',
            duration: 2000,
            mask: false
        };
        wx.showToast({
            ...defaultOptions,
            ...options
        });
    },

    // 显示确认对话框
    showConfirm(options) {
        const defaultOptions = {
            title: '提示',
            cancelText: '取消',
            confirmText: '确定',
            confirmColor: '#1890ff'
        };
        return new Promise((resolve, reject) => {
            wx.showModal({
                ...defaultOptions,
                ...options,
                success: (res) => {
                    if (res.confirm) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                },
                fail: reject
            });
        });
    }
};

module.exports = helper;