/**
 * FounderMind 用户行为埋点 SDK
 * 
 * 功能特性：
 * - 轻量级事件追踪
 * - 离线数据缓存
 * - 隐私保护机制
 * - 性能监控
 * - 批量数据发送
 * 
 * @author FounderMind Team
 * @version 1.0.0
 */

class FounderMindAnalytics {
    constructor(config = {}) {
        // 默认配置
        this.config = {
            endpoint: '/api/analytics/events',
            batchSize: 10,
            flushInterval: 5000,
            enableOffline: true,
            enableDebug: false,
            privacyMode: true,
            maxRetries: 3,
            retryDelay: 1000,
            ...config
        };
        
        // 内部状态
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.eventQueue = [];
        this.isEnabled = true;
        this.isOnline = navigator.onLine;
        this.pageStartTime = Date.now();
        this.lastActivityTime = Date.now();
        
        // 存储键名
        this.storageKeys = {
            consent: 'foundermind_analytics_consent',
            offlineEvents: 'foundermind_offline_events',
            userId: 'foundermind_user_id',
            sessionId: 'foundermind_session_id'
        };
        
        this.init();
    }
    
    /**
     * 初始化埋点系统
     */
    init() {
        // 检查用户同意
        if (!this.hasUserConsent() && this.config.privacyMode) {
            this.requestConsent();
            return;
        }
        
        this.bindEvents();
        this.startHeartbeat();
        this.loadOfflineEvents();
        this.trackPageView();
        
        this.debug('FounderMind Analytics initialized', {
            sessionId: this.sessionId,
            userId: this.userId,
            config: this.config
        });
    }
    
    /**
     * 绑定系统事件
     */
    bindEvents() {
        // 页面卸载时保存数据
        window.addEventListener('beforeunload', () => {
            this.trackPageDuration();
            this.saveOfflineEvents();
        });
        
        // 网络状态变化
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.loadOfflineEvents();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        // 用户活动追踪
        ['click', 'scroll', 'keydown', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivityTime = Date.now();
            }, { passive: true });
        });
        
        // 错误监控
        window.addEventListener('error', (event) => {
            this.trackError(event);
        });
        
        // 性能监控
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                setTimeout(() => this.trackPerformance(), 1000);
            });
        }
    }
    
    /**
     * 开始心跳检测
     */
    startHeartbeat() {
        setInterval(() => {
            if (this.eventQueue.length > 0) {
                this.flush();
            }
        }, this.config.flushInterval);
    }
    
    /**
     * 追踪事件
     * @param {string} eventName 事件名称
     * @param {object} properties 事件属性
     */
    track(eventName, properties = {}) {
        if (!this.isEnabled || !this.hasUserConsent()) {
            return;
        }
        
        const event = this.buildEvent(eventName, properties);
        this.eventQueue.push(event);
        
        this.debug('Event tracked:', event);
        
        // 如果队列满了，立即发送
        if (this.eventQueue.length >= this.config.batchSize) {
            this.flush();
        }
    }
    
    /**
     * 构建事件对象
     * @param {string} eventName 事件名称
     * @param {object} properties 事件属性
     */
    buildEvent(eventName, properties) {
        return {
            event: eventName,
            properties: {
                ...properties,
                page_name: this.getPageName(),
                page_url: window.location.href,
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            timestamp: Date.now(),
            session_id: this.sessionId,
            user_id: this.userId
        };
    }
    
    /**
     * 批量发送事件
     */
    async flush() {
        if (this.eventQueue.length === 0) return;
        
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        if (this.isOnline) {
            try {
                await this.sendEvents(events);
                this.debug('Events sent successfully:', events.length);
            } catch (error) {
                this.debug('Failed to send events:', error);
                // 发送失败，重新加入队列
                this.eventQueue.unshift(...events);
                this.saveOfflineEvents();
            }
        } else {
            // 离线状态，保存到本地
            this.saveOfflineEvents(events);
        }
    }
    
    /**
     * 发送事件到服务器
     * @param {Array} events 事件数组
     */
    async sendEvents(events) {
        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ events })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    /**
     * 保存离线事件
     * @param {Array} events 事件数组
     */
    saveOfflineEvents(events = null) {
        if (!this.config.enableOffline) return;
        
        try {
            const offlineEvents = this.getOfflineEvents();
            const newEvents = events || this.eventQueue;
            
            const allEvents = [...offlineEvents, ...newEvents];
            
            // 限制离线事件数量，避免存储过多
            const maxOfflineEvents = 1000;
            const eventsToStore = allEvents.slice(-maxOfflineEvents);
            
            localStorage.setItem(
                this.storageKeys.offlineEvents,
                JSON.stringify(eventsToStore)
            );
            
            this.debug('Offline events saved:', eventsToStore.length);
        } catch (error) {
            this.debug('Failed to save offline events:', error);
        }
    }
    
    /**
     * 加载离线事件
     */
    loadOfflineEvents() {
        if (!this.config.enableOffline || !this.isOnline) return;
        
        try {
            const offlineEvents = this.getOfflineEvents();
            
            if (offlineEvents.length > 0) {
                this.debug('Loading offline events:', offlineEvents.length);
                this.sendEvents(offlineEvents).then(() => {
                    localStorage.removeItem(this.storageKeys.offlineEvents);
                    this.debug('Offline events sent and cleared');
                }).catch(error => {
                    this.debug('Failed to send offline events:', error);
                });
            }
        } catch (error) {
            this.debug('Failed to load offline events:', error);
        }
    }
    
    /**
     * 获取离线事件
     */
    getOfflineEvents() {
        try {
            const stored = localStorage.getItem(this.storageKeys.offlineEvents);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            this.debug('Failed to parse offline events:', error);
            return [];
        }
    }
    
    /**
     * 生成会话ID
     */
    generateSessionId() {
        const stored = sessionStorage.getItem(this.storageKeys.sessionId);
        if (stored) return stored;
        
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(this.storageKeys.sessionId, sessionId);
        return sessionId;
    }
    
    /**
     * 获取用户ID
     */
    getUserId() {
        let userId = localStorage.getItem(this.storageKeys.userId);
        if (!userId) {
            userId = `user_anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(this.storageKeys.userId, userId);
        }
        return userId;
    }
    
    /**
     * 获取页面名称
     */
    getPageName() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop().replace('.html', '') || 'index';
        return pageName;
    }
    
    /**
     * 追踪页面访问
     */
    trackPageView() {
        this.track('page_view', {
            page_title: document.title,
            referrer: document.referrer,
            load_time: this.getLoadTime()
        });
    }
    
    /**
     * 追踪页面停留时间
     */
    trackPageDuration() {
        const duration = Math.round((Date.now() - this.pageStartTime) / 1000);
        const scrollDepth = this.getScrollDepth();
        
        this.track('page_duration', {
            duration,
            scroll_depth: scrollDepth
        });
    }
    
    /**
     * 获取页面加载时间
     */
    getLoadTime() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            return timing.loadEventEnd - timing.navigationStart;
        }
        return 0;
    }
    
    /**
     * 获取滚动深度
     */
    getScrollDepth() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        return documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
    }
    
    /**
     * 追踪性能指标
     */
    trackPerformance() {
        if (!window.performance) return;
        
        const timing = window.performance.timing;
        const navigation = window.performance.navigation;
        
        const metrics = {
            navigation_type: navigation.type,
            redirect_count: navigation.redirectCount,
            dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
            tcp_connect: timing.connectEnd - timing.connectStart,
            request_response: timing.responseEnd - timing.requestStart,
            dom_parse: timing.domContentLoadedEventEnd - timing.domLoading,
            dom_ready: timing.domContentLoadedEventEnd - timing.navigationStart,
            page_load: timing.loadEventEnd - timing.navigationStart,
            first_paint: this.getFirstPaint(),
            memory_usage: this.getMemoryUsage()
        };
        
        this.track('performance_metric', { metrics });
    }
    
    /**
     * 获取首次绘制时间
     */
    getFirstPaint() {
        if (window.performance && window.performance.getEntriesByType) {
            const paintEntries = window.performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            return firstPaint ? firstPaint.startTime : 0;
        }
        return 0;
    }
    
    /**
     * 获取内存使用量
     */
    getMemoryUsage() {
        if (window.performance && window.performance.memory) {
            return Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        return 0;
    }
    
    /**
     * 追踪错误
     * @param {ErrorEvent} event 错误事件
     */
    trackError(event) {
        this.track('error_occurred', {
            error_type: 'javascript_error',
            error_message: event.message,
            error_filename: event.filename,
            error_line: event.lineno,
            error_column: event.colno,
            error_stack: event.error ? event.error.stack : null,
            user_action: 'unknown'
        });
    }
    
    /**
     * 追踪API调用
     * @param {string} endpoint API端点
     * @param {string} method HTTP方法
     * @param {number} startTime 开始时间
     * @param {number} endTime 结束时间
     * @param {boolean} success 是否成功
     * @param {number} statusCode HTTP状态码
     * @param {string} errorType 错误类型
     */
    trackApiCall(endpoint, method, startTime, endTime, success, statusCode, errorType = null) {
        this.track('api_call', {
            api_endpoint: endpoint,
            api_method: method,
            response_time: endTime - startTime,
            status_code: statusCode,
            success,
            error_type: errorType
        });
    }
    
    /**
     * 追踪导师选择
     * @param {object} mentorData 导师数据
     * @param {string} mode 选择模式
     */
    trackMentorSelection(mentorData, mode) {
        this.track('mentor_select', {
            mentor_id: mentorData.id,
            mentor_name: mentorData.name,
            selection_mode: mode,
            selected_mentors: mode === 'roundtable' ? mentorData.selectedMentors : [mentorData.id]
        });
    }
    
    /**
     * 追踪对话开始
     * @param {string} mode 对话模式
     * @param {Array} mentorIds 导师ID列表
     */
    trackChatStart(mode, mentorIds) {
        this.track('chat_start', {
            conversation_mode: mode,
            mentor_ids: mentorIds
        });
    }
    
    /**
     * 追踪消息发送
     * @param {number} messageLength 消息长度
     * @param {string} messageType 消息类型
     * @param {number} conversationTurn 对话轮次
     */
    trackMessageSend(messageLength, messageType, conversationTurn) {
        this.track('message_send', {
            message_length: messageLength,
            message_type: messageType,
            conversation_turn: conversationTurn,
            time_since_last: Date.now() - this.lastActivityTime
        });
    }
    
    /**
     * 追踪消息接收
     * @param {string} mentorId 导师ID
     * @param {number} responseTime 响应时间
     * @param {number} responseLength 回复长度
     * @param {string} responseSource 回复来源
     * @param {number} conversationTurn 对话轮次
     */
    trackMessageReceive(mentorId, responseTime, responseLength, responseSource, conversationTurn) {
        this.track('message_receive', {
            mentor_id: mentorId,
            response_time: responseTime,
            response_length: responseLength,
            response_source: responseSource,
            conversation_turn: conversationTurn
        });
    }
    
    /**
     * 追踪功能使用
     * @param {string} featureName 功能名称
     * @param {string} featureAction 功能操作
     * @param {boolean} success 是否成功
     * @param {string} errorMessage 错误信息
     */
    trackFeatureUse(featureName, featureAction, success = true, errorMessage = null) {
        this.track('feature_use', {
            feature_name: featureName,
            feature_action: featureAction,
            success,
            error_message: errorMessage
        });
    }
    
    /**
     * 用户同意追踪
     */
    enableTracking() {
        localStorage.setItem(this.storageKeys.consent, 'true');
        this.isEnabled = true;
        this.init();
        this.debug('Tracking enabled by user');
    }
    
    /**
     * 用户拒绝追踪
     */
    disableTracking() {
        localStorage.setItem(this.storageKeys.consent, 'false');
        this.isEnabled = false;
        this.clearStoredData();
        this.debug('Tracking disabled by user');
    }
    
    /**
     * 检查用户同意状态
     */
    hasUserConsent() {
        const consent = localStorage.getItem(this.storageKeys.consent);
        return consent === 'true';
    }
    
    /**
     * 请求用户同意
     */
    requestConsent() {
        // 这里可以显示同意弹窗，简化版本直接提示
        if (confirm('FounderMind 想要收集匿名使用数据以改善产品体验，是否同意？')) {
            this.enableTracking();
        } else {
            this.disableTracking();
        }
    }
    
    /**
     * 清除存储的数据
     */
    clearStoredData() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        this.eventQueue = [];
    }
    
    /**
     * 调试日志
     * @param {string} message 消息
     * @param {any} data 数据
     */
    debug(message, data = null) {
        if (this.config.enableDebug) {
            console.log(`[FounderMind Analytics] ${message}`, data);
        }
    }
    
    /**
     * 获取当前统计信息
     */
    getStats() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            isEnabled: this.isEnabled,
            isOnline: this.isOnline,
            eventQueueLength: this.eventQueue.length,
            offlineEventsCount: this.getOfflineEvents().length,
            pageStartTime: this.pageStartTime,
            lastActivityTime: this.lastActivityTime
        };
    }
}

/**
 * 隐私管理器
 */
class PrivacyManager {
    static enableTracking() {
        if (window.analytics) {
            window.analytics.enableTracking();
        }
    }
    
    static disableTracking() {
        if (window.analytics) {
            window.analytics.disableTracking();
        }
    }
    
    static hasConsent() {
        return window.analytics ? window.analytics.hasUserConsent() : false;
    }
    
    static showPrivacyPolicy() {
        const policy = `
FounderMind 隐私政策

我们收集的信息：
• 页面访问统计（不包含个人身份信息）
• 功能使用情况（匿名化处理）
• 技术性能数据（用于产品优化）
• 错误报告（帮助修复问题）

我们不会收集：
• 您的对话内容
• 个人身份信息
• 敏感数据

您可以随时：
• 查看收集的数据类型
• 拒绝数据收集
• 删除已收集的数据

联系我们：如有疑问请联系开发团队
        `;
        
        alert(policy);
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否已经初始化
    if (!window.analytics) {
        window.analytics = new FounderMindAnalytics({
            enableDebug: window.location.hostname === 'localhost'
        });
        
        // 全局暴露隐私管理器
        window.PrivacyManager = PrivacyManager;
        
        console.log('FounderMind Analytics initialized');
    }
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FounderMindAnalytics, PrivacyManager };
}