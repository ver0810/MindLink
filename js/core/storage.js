/**
 * 数据存储管理模块
 * 提供本地存储、会话存储的统一接口
 */

class StorageManager {
    constructor() {
        this.isAvailable = this.checkStorageAvailability();
    }

    /**
     * 检查存储可用性
     * @returns {boolean}
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('LocalStorage not available:', e);
            return false;
        }
    }

    /**
     * 本地存储操作
     */
    local = {
        set: (key, value) => {
            if (!this.isAvailable) return false;
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error saving to localStorage:', e);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            if (!this.isAvailable) return defaultValue;
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return defaultValue;
            }
        },

        remove: (key) => {
            if (!this.isAvailable) return false;
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage:', e);
                return false;
            }
        },

        clear: () => {
            if (!this.isAvailable) return false;
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Error clearing localStorage:', e);
                return false;
            }
        }
    };

    /**
     * 会话存储操作
     */
    session = {
        set: (key, value) => {
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error saving to sessionStorage:', e);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            try {
                const item = sessionStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Error reading from sessionStorage:', e);
                return defaultValue;
            }
        },

        remove: (key) => {
            try {
                sessionStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from sessionStorage:', e);
                return false;
            }
        },

        clear: () => {
            try {
                sessionStorage.clear();
                return true;
            } catch (e) {
                console.error('Error clearing sessionStorage:', e);
                return false;
            }
        }
    };

    /**
     * 用户数据管理
     */
    user = {
        save: (userData) => {
            return this.local.set('user_data', userData);
        },

        load: () => {
            return this.local.get('user_data', {});
        },

        clear: () => {
            return this.local.remove('user_data');
        }
    };

    /**
     * 对话历史管理
     */
    conversation = {
        save: (conversationId, data) => {
            const conversations = this.local.get('conversations', {});
            conversations[conversationId] = {
                ...data,
                lastModified: new Date().toISOString()
            };
            return this.local.set('conversations', conversations);
        },

        load: (conversationId) => {
            const conversations = this.local.get('conversations', {});
            return conversations[conversationId] || null;
        },

        loadAll: () => {
            return this.local.get('conversations', {});
        },

        remove: (conversationId) => {
            const conversations = this.local.get('conversations', {});
            delete conversations[conversationId];
            return this.local.set('conversations', conversations);
        },

        clear: () => {
            return this.local.remove('conversations');
        }
    };

    /**
     * 设置管理
     */
    settings = {
        save: (settings) => {
            return this.local.set('app_settings', settings);
        },

        load: () => {
            return this.local.get('app_settings', {
                theme: 'light',
                language: 'zh',
                autoSave: true,
                notifications: true
            });
        },

        update: (key, value) => {
            const settings = this.settings.load();
            settings[key] = value;
            return this.settings.save(settings);
        }
    };
}

// 创建全局存储实例
window.storageManager = new StorageManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
} 