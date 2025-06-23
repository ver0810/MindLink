/**
 * 分析服务
 * 提供基本的数据分析功能
 */

class AnalyticsService {
    constructor() {
        this.events = [];
        this.startTime = Date.now();
    }

    /**
     * 记录事件
     * @param {string} eventName - 事件名称
     * @param {Object} data - 事件数据
     */
    track(eventName, data = {}) {
        const event = {
            name: eventName,
            data: data,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };

        this.events.push(event);

        // 只保留最近1000个事件
        if (this.events.length > 1000) {
            this.events.shift();
        }
    }

    /**
     * 获取基本统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const now = Date.now();
        const uptime = now - this.startTime;

        return {
            uptime: uptime,
            uptimeFormatted: this.formatUptime(uptime),
            totalEvents: this.events.length,
            eventsInLastHour: this.getEventCountInLastHours(1),
            eventsInLastDay: this.getEventCountInLastHours(24),
            mostFrequentEvents: this.getMostFrequentEvents()
        };
    }

    /**
     * 获取指定时间内的事件数量
     * @param {number} hours - 小时数
     * @returns {number} 事件数量
     */
    getEventCountInLastHours(hours) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.events.filter(event => event.timestamp > cutoff).length;
    }

    /**
     * 获取最频繁的事件
     * @param {number} limit - 限制数量
     * @returns {Array} 事件统计
     */
    getMostFrequentEvents(limit = 10) {
        const eventCounts = {};
        
        this.events.forEach(event => {
            eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
        });

        return Object.entries(eventCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * 格式化运行时间
     * @param {number} ms - 毫秒数
     * @returns {string} 格式化的时间
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}天 ${hours % 24}小时 ${minutes % 60}分钟`;
        } else if (hours > 0) {
            return `${hours}小时 ${minutes % 60}分钟`;
        } else if (minutes > 0) {
            return `${minutes}分钟 ${seconds % 60}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    /**
     * 记录对话创建事件
     * @param {Object} conversation - 对话对象
     */
    trackConversationCreated(conversation) {
        this.track('conversation_created', {
            conversationId: conversation.id,
            mentorId: conversation.primary_mentor_id,
            mode: conversation.mode
        });
    }

    /**
     * 记录对话查看事件
     * @param {number} conversationId - 对话ID
     * @param {number} userId - 用户ID
     */
    trackConversationViewed(conversationId, userId) {
        this.track('conversation_viewed', {
            conversationId,
            userId
        });
    }

    /**
     * 记录对话导出事件
     * @param {number} conversationId - 对话ID
     * @param {number} userId - 用户ID
     * @param {string} format - 导出格式
     */
    trackConversationExported(conversationId, userId, format) {
        this.track('conversation_exported', {
            conversationId,
            userId,
            format
        });
    }

    /**
     * 记录消息创建事件
     * @param {Object} message - 消息对象
     */
    trackMessageCreated(message) {
        this.track('message_created', {
            messageId: message.id,
            conversationId: message.conversation_id,
            role: message.role,
            contentLength: message.content ? message.content.length : 0
        });
    }

    /**
     * 分析消息内容
     * @param {Object} message - 消息对象
     */
    analyzeMessage(message) {
        // 基本的消息分析
        this.track('message_analyzed', {
            messageId: message.id,
            role: message.role,
            contentType: message.content_type,
            tokens: message.total_tokens
        });
    }

    /**
     * 清理事件数据
     */
    clear() {
        this.events = [];
    }
}

// 单例实例
let instance = null;

/**
 * 获取分析服务实例
 * @returns {AnalyticsService} 分析服务实例
 */
function getInstance() {
    if (!instance) {
        instance = new AnalyticsService();
    }
    return instance;
}

module.exports = {
    AnalyticsService,
    getInstance
}; 