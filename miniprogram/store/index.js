class Store {
    constructor() {
        this._state = {
            userInfo: null,
            dailyCount: 0,
            collections: [],
            currentFuka: null,
            settings: {}
        };
        this._listeners = new Map();
        this._listenerIdCounter = 0;
    }

    // 获取状态
    getState() {
        return { ...this._state };
    }

    // 更新状态
    setState(newState) {
        const oldState = { ...this._state };
        this._state = {
            ...this._state,
            ...newState
        };
        this._notifyListeners(oldState);
    }

    // 添加监听器
    subscribe(listener) {
        const id = this._listenerIdCounter++;
        this._listeners.set(id, listener);
        return () => {
            this._listeners.delete(id);
        };
    }

    // 通知监听器
    _notifyListeners(oldState) {
        this._listeners.forEach(listener => {
            listener(this._state, oldState);
        });
    }

    // 重置状态
    reset() {
        this._state = {
            userInfo: null,
            dailyCount: 0,
            collections: [],
            currentFuka: null,
            settings: {}
        };
        this._notifyListeners({});
    }
}

const store = new Store();
module.exports = store;