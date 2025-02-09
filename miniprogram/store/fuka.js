const store = require('./index');
const { fukaService } = require('../services/fuka/card');
const Logger = require('../utils/logger');

class FukaStore {
    // 设置当前福卡
    static setCurrentFuka(fuka) {
        store.setState({ currentFuka: fuka });
    }

    // 清除当前福卡
    static clearCurrentFuka() {
        store.setState({ currentFuka: null });
    }

    // 更新福卡收藏状态
    static async updateFukaCollection(cardId) {
        try {
            const isCollected = await fukaService.toggleCollect(cardId);
            const { collections, currentFuka } = store.getState();

            // 更新收藏列表
            const newCollections = isCollected
                ? [...collections, cardId]
                : collections.filter(id => id !== cardId);

            // 更新当前福卡状态
            if (currentFuka && currentFuka._id === cardId) {
                currentFuka.isCollected = isCollected;
            }

            store.setState({
                collections: newCollections,
                currentFuka: { ...currentFuka }
            });

            return isCollected;
        } catch (error) {
            Logger.error('Update fuka collection failed', error);
            throw error;
        }
    }

    // 更新福卡分享状态
    static async updateFukaShare(cardId) {
        try {
            await fukaService.shareFuka(cardId);
            const { currentFuka } = store.getState();

            if (currentFuka && currentFuka._id === cardId) {
                currentFuka.shareCount = (currentFuka.shareCount || 0) + 1;
                store.setState({ currentFuka: { ...currentFuka } });
            }

            return true;
        } catch (error) {
            Logger.error('Update fuka share failed', error);
            throw error;
        }
    }
}

module.exports = FukaStore;