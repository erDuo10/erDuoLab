const store = require('./index');
const { userService } = require('../services/fuka/user');
const Logger = require('../utils/logger');

class UserStore {
    // 初始化用户状态
    static async initUserState() {
        try {
            const userInfo = await userService.getUserInfo();
            const stats = await userService.getUserStats();
            
            store.setState({
                userInfo,
                dailyCount: stats.fuka.daily,
                collections: stats.collections
            });
            
            return true;
        } catch (error) {
            Logger.error('Init user state failed', error);
            return false;
        }
    }

    // 更新用户信息
    static async updateUserInfo(userInfo) {
        try {
            await userService.updateUserInfo(userInfo);
            store.setState({ userInfo });
            return true;
        } catch (error) {
            Logger.error('Update user info failed', error);
            return false;
        }
    }

    // 更新每日计数
    static updateDailyCount(count) {
        store.setState({ dailyCount: count });
    }

    // 更新收藏列表
    static updateCollections(collections) {
        store.setState({ collections });
    }

    // 重置用户状态
    static resetUserState() {
        store.reset();
    }
}

module.exports = UserStore;