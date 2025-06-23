/**
 * 缓存服务
 * 提供基本的内存缓存功能
 */

class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttlMap = new Map();
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000); // 每分钟清理一次过期缓存
    }

    /**
     * 设置缓存
     * @param {string} key - 缓存键
     * @param {any} value - 缓存值
     * @param {number} ttl - 过期时间（秒），默认1小时
     */
    set(key, value, ttl = 3600) {
        this.cache.set(key, value);
        this.ttlMap.set(key, Date.now() + (ttl * 1000));
    }

    /**
     * 获取缓存
     * @param {string} key - 缓存键
     * @returns {any} 缓存值，如果不存在或已过期返回null
     */
    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        const expireTime = this.ttlMap.get(key);
        if (expireTime && Date.now() > expireTime) {
            this.delete(key);
            return null;
        }

        return this.cache.get(key);
    }

    /**
     * 删除缓存
     * @param {string} key - 缓存键
     * @returns {boolean} 是否删除成功
     */
    delete(key) {
        const existed = this.cache.has(key);
        this.cache.delete(key);
        this.ttlMap.delete(key);
        return existed;
    }

    /**
     * 检查缓存是否存在
     * @param {string} key - 缓存键
     * @returns {boolean} 是否存在且未过期
     */
    has(key) {
        if (!this.cache.has(key)) {
            return false;
        }

        const expireTime = this.ttlMap.get(key);
        if (expireTime && Date.now() > expireTime) {
            this.delete(key);
            return false;
        }

        return true;
    }

    /**
     * 清空所有缓存
     */
    clear() {
        this.cache.clear();
        this.ttlMap.clear();
    }

    /**
     * 获取缓存大小
     * @returns {number} 缓存项数量
     */
    size() {
        return this.cache.size;
    }

    /**
     * 获取所有缓存键
     * @returns {Array} 缓存键数组
     */
    keys() {
        return Array.from(this.cache.keys());
    }

    /**
     * 清理过期的缓存项
     */
    cleanup() {
        const now = Date.now();
        for (const [key, expireTime] of this.ttlMap.entries()) {
            if (expireTime && now > expireTime) {
                this.delete(key);
            }
        }
    }

    /**
     * 获取缓存统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        let expired = 0;
        const now = Date.now();
        
        for (const expireTime of this.ttlMap.values()) {
            if (expireTime && now > expireTime) {
                expired++;
            }
        }

        return {
            total: this.cache.size,
            expired: expired,
            active: this.cache.size - expired
        };
    }

    /**
     * 获取对话列表缓存
     * @param {string} key - 缓存键
     * @returns {any} 缓存值
     */
    getConversationList(key) {
        return this.get(key);
    }

    /**
     * 设置对话列表缓存
     * @param {string} key - 缓存键
     * @param {any} value - 缓存值
     * @param {number} ttl - 过期时间（秒）
     */
    setConversationList(key, value, ttl = 300) {
        return this.set(key, value, ttl);
    }

    /**
     * 获取对话缓存
     * @param {string} key - 缓存键
     * @returns {any} 缓存值
     */
    getConversation(key) {
        return this.get(`conversation:${key}`);
    }

    /**
     * 设置对话缓存
     * @param {string} key - 缓存键
     * @param {any} value - 缓存值
     * @param {number} ttl - 过期时间（秒）
     */
    setConversation(key, value, ttl = 1800) {
        return this.set(`conversation:${key}`, value, ttl);
    }

    /**
     * 获取对话消息缓存
     * @param {string} key - 缓存键
     * @returns {any} 缓存值
     */
    getConversationMessages(key) {
        return this.get(key);
    }

    /**
     * 设置对话消息缓存
     * @param {string} key - 缓存键
     * @param {any} value - 缓存值
     * @param {number} ttl - 过期时间（秒）
     */
    setConversationMessages(key, value, ttl = 1800) {
        return this.set(key, value, ttl);
    }

    /**
     * 销毁缓存服务
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
    }
}

// 单例实例
let instance = null;

/**
 * 获取缓存服务实例
 * @returns {CacheService} 缓存服务实例
 */
function getInstance() {
    if (!instance) {
        instance = new CacheService();
    }
    return instance;
}

module.exports = {
    CacheService,
    getInstance
}; 