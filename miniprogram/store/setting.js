const store = require('./index');
const Cache = require('../utils/cache');

const DEFAULT_SETTINGS = {
    theme: 'light',
    fontSize: 'medium',
    animation: true,
    sound: true,
    vibration: true,
    autoSave: false
};

class SettingsStore {
    // 初始化设置
    static initSettings() {
        const savedSettings = Cache.get('APP_SETTINGS');
        const settings = {
            ...DEFAULT_SETTINGS,
            ...savedSettings
        };
        store.setState({ settings });
        return settings;
    }

    // 更新设置
    static updateSettings(newSettings) {
        const { settings } = store.getState();
        const updatedSettings = {
            ...settings,
            ...newSettings
        };
        store.setState({ settings: updatedSettings });
        Cache.set('APP_SETTINGS', updatedSettings);
        return updatedSettings;
    }

    // 重置设置
    static resetSettings() {
        store.setState({ settings: DEFAULT_SETTINGS });
        Cache.set('APP_SETTINGS', DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    }

    // 获取主题设置
    static getTheme() {
        const { settings } = store.getState();
        return settings.theme || DEFAULT_SETTINGS.theme;
    }

    // 获取字体大小设置
    static getFontSize() {
        const { settings } = store.getState();
        return settings.fontSize || DEFAULT_SETTINGS.fontSize;
    }

    // 检查功能是否启用
    static isFeatureEnabled(feature) {
        const { settings } = store.getState();
        return settings[feature] ?? DEFAULT_SETTINGS[feature];
    }
}

module.exports = SettingsStore;