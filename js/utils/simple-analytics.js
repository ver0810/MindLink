/**
 * FounderMind 简化版埋点系统
 * 专注收集基础用户行为数据
 */

class SimpleAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.generateUserId();
        this.pageStartTime = Date.now();
        this.events = [];
        
        this.init();
    }
    
    /**
     * 初始化
     */
    init() {
        this.trackPageView();
        this.bindEvents();
        console.log('简化版埋点系统已启动');
    }
    
    /**
     * 生成会话ID
     */
    generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    /**
     * 生成用户ID
     */
    generateUserId() {
        let userId = localStorage.getItem('simple_analytics_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            localStorage.setItem('simple_analytics_user_id', userId);
        }
        return userId;
    }
    
    /**
     * 记录事件
     */
    track(eventName, data = {}) {
        const event = {
            event: eventName,
            data: data,
            timestamp: Date.now(),
            session_id: this.sessionId,
            user_id: this.userId,
            page: window.location.pathname.split('/').pop() || 'index'
        };
        
        this.events.push(event);
        console.log('📊 埋点记录:', eventName, data);
        
        // 简单的本地存储（实际项目中应该发送到服务器）
        this.saveToLocal();
    }
    
    /**
     * 保存到本地存储
     */
    saveToLocal() {
        try {
            const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            stored.push(...this.events);
            
            // 只保留最近的1000条记录
            const recentEvents = stored.slice(-1000);
            localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
            
            this.events = []; // 清空当前缓存
        } catch (error) {
            console.error('保存埋点数据失败:', error);
        }
    }
    
    /**
     * 绑定页面事件
     */
    bindEvents() {
        // 页面离开时记录停留时间
        window.addEventListener('beforeunload', () => {
            this.trackPageDuration();
        });
        
        // 点击事件
        document.addEventListener('click', (e) => {
            this.trackClick(e);
        });
        
        // 滚动事件（防抖）
        let scrollTimer;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.trackScroll();
            }, 500);
        });
    }
    
    /**
     * 记录页面访问
     */
    trackPageView() {
        this.track('page_view', {
            page_title: document.title,
            page_url: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            screen_size: `${screen.width}x${screen.height}`,
            browser_language: navigator.language
        });
    }
    
    /**
     * 记录页面停留时间
     */
    trackPageDuration() {
        const duration = Math.round((Date.now() - this.pageStartTime) / 1000);
        this.track('page_duration', {
            duration_seconds: duration,
            scroll_depth: this.getScrollDepth()
        });
    }
    
    /**
     * 记录点击事件
     */
    trackClick(event) {
        const element = event.target;
        
        // 获取元素信息
        const elementInfo = {
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            classes: element.className || null,
            text: element.textContent ? element.textContent.substring(0, 50) : null
        };
        
        // 特殊处理一些重要的点击
        if (element.closest('[data-mentor-id]')) {
            // 导师卡片点击
            const mentorId = element.closest('[data-mentor-id]').dataset.mentorId;
            this.track('mentor_click', {
                mentor_id: mentorId,
                element: elementInfo
            });
        } else if (element.closest('.btn') || element.type === 'button') {
            // 按钮点击
            this.track('button_click', {
                button_text: element.textContent,
                element: elementInfo
            });
        } else {
            // 普通点击
            this.track('element_click', {
                element: elementInfo
            });
        }
    }
    
    /**
     * 记录滚动行为
     */
    trackScroll() {
        this.track('page_scroll', {
            scroll_depth: this.getScrollDepth(),
            scroll_position: window.pageYOffset
        });
    }
    
    /**
     * 获取滚动深度
     */
    getScrollDepth() {
        const scrollTop = window.pageYOffset;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        return documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
    }
    
    /**
     * 记录导师选择
     */
    trackMentorSelect(mentorId, mentorName, mode = 'one_on_one') {
        this.track('mentor_select', {
            mentor_id: mentorId,
            mentor_name: mentorName,
            mode: mode
        });
    }
    
    /**
     * 记录对话开始
     */
    trackChatStart(mentorIds, mode) {
        this.track('chat_start', {
            mentor_ids: mentorIds,
            mode: mode,
            mentor_count: mentorIds.length
        });
    }
    
    /**
     * 记录消息发送
     */
    trackMessageSend(messageLength, messageType = 'user_input') {
        this.track('message_send', {
            message_length: messageLength,
            message_type: messageType
        });
    }
    
    /**
     * 记录消息接收
     */
    trackMessageReceive(mentorId, responseTime, responseLength, source = 'api') {
        this.track('message_receive', {
            mentor_id: mentorId,
            response_time_ms: responseTime,
            response_length: responseLength,
            source: source
        });
    }
    
    /**
     * 记录功能使用
     */
    trackFeatureUse(featureName, success = true) {
        this.track('feature_use', {
            feature_name: featureName,
            success: success
        });
    }
    
    /**
     * 记录错误
     */
    trackError(errorMessage, errorType = 'javascript') {
        this.track('error_occurred', {
            error_message: errorMessage,
            error_type: errorType,
            page_url: window.location.href
        });
    }
    
    /**
     * 获取收集的数据统计
     */
    getStats() {
        try {
            const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            const stats = {
                total_events: storedEvents.length,
                session_id: this.sessionId,
                user_id: this.userId,
                recent_events: storedEvents.slice(-10) // 最近10条
            };
            
            // 按事件类型统计
            const eventTypes = {};
            storedEvents.forEach(event => {
                eventTypes[event.event] = (eventTypes[event.event] || 0) + 1;
            });
            stats.event_types = eventTypes;
            
            return stats;
        } catch (error) {
            console.error('获取统计数据失败:', error);
            return null;
        }
    }
    
    /**
     * 清除存储的数据
     */
    clearData() {
        localStorage.removeItem('analytics_events');
        localStorage.removeItem('simple_analytics_user_id');
        this.events = [];
        console.log('埋点数据已清除');
    }
    
    /**
     * 导出数据（用于调试）
     */
    exportData() {
        try {
            const data = {
                events: JSON.parse(localStorage.getItem('analytics_events') || '[]'),
                stats: this.getStats()
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `foundermind_analytics_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            console.log('数据已导出');
        } catch (error) {
            console.error('导出数据失败:', error);
        }
    }
}

// 全局函数，方便在页面中直接调用
window.trackMentorSelect = function(mentorId, mentorName, mode) {
    if (window.simpleAnalytics) {
        window.simpleAnalytics.trackMentorSelect(mentorId, mentorName, mode);
    }
};

window.trackChatStart = function(mentorIds, mode) {
    if (window.simpleAnalytics) {
        window.simpleAnalytics.trackChatStart(mentorIds, mode);
    }
};

window.trackMessageSend = function(messageLength, messageType) {
    if (window.simpleAnalytics) {
        window.simpleAnalytics.trackMessageSend(messageLength, messageType);
    }
};

window.trackMessageReceive = function(mentorId, responseTime, responseLength, source) {
    if (window.simpleAnalytics) {
        window.simpleAnalytics.trackMessageReceive(mentorId, responseTime, responseLength, source);
    }
};

window.trackFeatureUse = function(featureName, success) {
    if (window.simpleAnalytics) {
        window.simpleAnalytics.trackFeatureUse(featureName, success);
    }
};

// 调试函数
window.getAnalyticsStats = function() {
    if (window.simpleAnalytics) {
        return window.simpleAnalytics.getStats();
    }
    return null;
};

window.exportAnalyticsData = function() {
    if (window.simpleAnalytics) {
        window.simpleAnalytics.exportData();
    }
};

window.clearAnalyticsData = function() {
    if (window.simpleAnalytics) {
        window.simpleAnalytics.clearData();
    }
};

// 自动初始化
document.addEventListener('DOMContentLoaded', function() {
    if (!window.simpleAnalytics) {
        window.simpleAnalytics = new SimpleAnalytics();
        console.log('✅ FounderMind 简化版埋点系统已启动');
        console.log('📊 使用 getAnalyticsStats() 查看统计数据');
        console.log('📁 使用 exportAnalyticsData() 导出数据');
        console.log('🗑️ 使用 clearAnalyticsData() 清除数据');
    }
});

// 错误监听
window.addEventListener('error', function(event) {
    if (window.simpleAnalytics) {
        window.simpleAnalytics.trackError(event.message, 'javascript_error');
    }
});