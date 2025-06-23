/**
 * 事件服务
 * 提供事件发布订阅功能
 */

const EventEmitter = require('events');

class EventService extends EventEmitter {
    constructor() {
        super();
        this.maxListeners = 100; // 设置最大监听器数量
        this.setMaxListeners(this.maxListeners);
        this.eventHistory = new Map(); // 存储事件历史
        this.eventStats = new Map(); // 事件统计
    }

    /**
     * 发布事件
     * @param {string} eventName - 事件名称
     * @param {any} data - 事件数据
     */
    publish(eventName, data = null) {
        try {
            // 记录事件历史
            this.recordEvent(eventName, data);
            
            // 发布事件
            this.emit(eventName, data);
            
            // 更新统计
            this.updateStats(eventName);
            
        } catch (error) {
            console.error(`发布事件失败 [${eventName}]:`, error);
        }
    }

    /**
     * 订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} listener - 事件监听器
     */
    subscribe(eventName, listener) {
        this.on(eventName, listener);
    }

    /**
     * 订阅事件（只监听一次）
     * @param {string} eventName - 事件名称
     * @param {Function} listener - 事件监听器
     */
    subscribeOnce(eventName, listener) {
        this.once(eventName, listener);
    }

    /**
     * 取消订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} listener - 事件监听器
     */
    unsubscribe(eventName, listener) {
        this.off(eventName, listener);
    }

    /**
     * 取消所有事件订阅
     * @param {string} eventName - 事件名称
     */
    unsubscribeAll(eventName) {
        this.removeAllListeners(eventName);
    }

    /**
     * 记录事件历史
     * @private
     * @param {string} eventName - 事件名称
     * @param {any} data - 事件数据
     */
    recordEvent(eventName, data) {
        if (!this.eventHistory.has(eventName)) {
            this.eventHistory.set(eventName, []);
        }

        const history = this.eventHistory.get(eventName);
        history.push({
            timestamp: new Date(),
            data: data
        });

        // 只保留最近的50条记录
        if (history.length > 50) {
            history.shift();
        }
    }

    /**
     * 更新事件统计
     * @private
     * @param {string} eventName - 事件名称
     */
    updateStats(eventName) {
        if (!this.eventStats.has(eventName)) {
            this.eventStats.set(eventName, {
                count: 0,
                lastEmitted: null
            });
        }

        const stats = this.eventStats.get(eventName);
        stats.count++;
        stats.lastEmitted = new Date();
    }

    /**
     * 获取事件历史
     * @param {string} eventName - 事件名称
     * @param {number} limit - 限制返回数量
     * @returns {Array} 事件历史
     */
    getEventHistory(eventName, limit = 10) {
        const history = this.eventHistory.get(eventName) || [];
        return history.slice(-limit);
    }

    /**
     * 获取事件统计
     * @param {string} eventName - 事件名称
     * @returns {Object} 事件统计
     */
    getEventStats(eventName) {
        return this.eventStats.get(eventName) || {
            count: 0,
            lastEmitted: null
        };
    }

    /**
     * 获取所有事件统计
     * @returns {Object} 所有事件统计
     */
    getAllStats() {
        const stats = {};
        for (const [eventName, stat] of this.eventStats.entries()) {
            stats[eventName] = stat;
        }
        return stats;
    }

    /**
     * 获取当前监听器信息
     * @returns {Object} 监听器信息
     */
    getListenersInfo() {
        const info = {};
        const eventNames = this.eventNames();
        
        for (const eventName of eventNames) {
            info[eventName] = {
                listenerCount: this.listenerCount(eventName),
                listeners: this.listeners(eventName).length
            };
        }
        
        return info;
    }

    /**
     * 清理事件历史
     * @param {string} eventName - 事件名称，如果不指定则清理所有
     */
    clearHistory(eventName = null) {
        if (eventName) {
            this.eventHistory.delete(eventName);
        } else {
            this.eventHistory.clear();
        }
    }

    /**
     * 清理事件统计
     * @param {string} eventName - 事件名称，如果不指定则清理所有
     */
    clearStats(eventName = null) {
        if (eventName) {
            this.eventStats.delete(eventName);
        } else {
            this.eventStats.clear();
        }
    }

    /**
     * 销毁事件服务
     */
    destroy() {
        this.removeAllListeners();
        this.eventHistory.clear();
        this.eventStats.clear();
    }
}

// 单例实例
let instance = null;

/**
 * 获取事件服务实例
 * @returns {EventService} 事件服务实例
 */
function getInstance() {
    if (!instance) {
        instance = new EventService();
    }
    return instance;
}

// 预定义的事件类型
const EVENT_TYPES = {
    // 对话相关事件
    CONVERSATION_CREATED: 'conversation:created',
    CONVERSATION_UPDATED: 'conversation:updated',
    CONVERSATION_DELETED: 'conversation:deleted',
    
    // 消息相关事件
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_DELETED: 'message:deleted',
    
    // 用户相关事件
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_REGISTERED: 'user:registered',
    
    // 系统相关事件
    SYSTEM_ERROR: 'system:error',
    SYSTEM_WARNING: 'system:warning',
    SYSTEM_INFO: 'system:info'
};

module.exports = {
    EventService,
    getInstance,
    EVENT_TYPES
}; 