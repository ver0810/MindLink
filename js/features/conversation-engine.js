/**
 * 对话引擎模块
 * 负责对话流程管理、消息处理、AI交互等核心功能
 */

class ConversationEngine {
    constructor() {
        this.currentConversation = null;
        this.conversationHistory = [];
        this.isProcessing = false;
        this.messageQueue = [];
        this.settings = {
            maxHistoryLength: 50,
            autoSave: true,
            responseTimeout: 30000,
            retryAttempts: 3
        };
        this.initialize();
    }

    /**
     * 初始化对话引擎
     */
    async initialize() {
        try {
            this.loadSettings();
            this.setupEventListeners();
            console.log('对话引擎初始化成功');
        } catch (error) {
            console.error('对话引擎初始化失败:', error);
        }
    }

    /**
     * 加载设置
     */
    loadSettings() {
        if (window.storageManager) {
            const savedSettings = window.storageManager.local.get('conversation_settings', {});
            this.settings = { ...this.settings, ...savedSettings };
        }
    }

    /**
     * 保存设置
     */
    saveSettings() {
        if (window.storageManager) {
            window.storageManager.local.set('conversation_settings', this.settings);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听导师切换事件
        document.addEventListener('mentor:mentorChanged', (event) => {
            this.handleMentorChange(event.detail.mentor);
        });

        // 监听窗口关闭事件，自动保存
        window.addEventListener('beforeunload', () => {
            if (this.settings.autoSave && this.currentConversation) {
                this.saveConversation();
            }
        });
    }

    /**
     * 创建新对话
     * @param {Object} config 对话配置
     * @returns {string} 对话ID
     */
    createConversation(config = {}) {
        const conversationId = this.generateConversationId();
        const currentMentor = window.mentorSystem?.getCurrentMentor();
        
        this.currentConversation = {
            id: conversationId,
            mentor: currentMentor,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            title: config.title || this.generateConversationTitle(),
            mode: config.mode || 'chat',
            settings: { ...this.settings, ...config.settings },
            messages: [],
            metadata: {
                messageCount: 0,
                sessionDuration: 0,
                userSatisfaction: null,
                tags: config.tags || []
            }
        };

        this.conversationHistory = [];
        this.dispatchEvent('conversationCreated', { conversation: this.currentConversation });
        
        return conversationId;
    }

    /**
     * 加载对话
     * @param {string} conversationId 对话ID
     * @returns {boolean} 加载是否成功
     */
    loadConversation(conversationId) {
        if (!window.storageManager) return false;

        const conversation = window.storageManager.conversation.load(conversationId);
        if (conversation) {
            this.currentConversation = conversation;
            this.conversationHistory = conversation.messages || [];
            this.dispatchEvent('conversationLoaded', { conversation: conversation });
            return true;
        }
        return false;
    }

    /**
     * 保存当前对话
     * @returns {boolean} 保存是否成功
     */
    saveConversation() {
        if (!this.currentConversation || !window.storageManager) return false;

        this.currentConversation.updatedAt = new Date().toISOString();
        this.currentConversation.messages = this.conversationHistory;
        this.currentConversation.metadata.messageCount = this.conversationHistory.length;

        const success = window.storageManager.conversation.save(
            this.currentConversation.id,
            this.currentConversation
        );

        if (success) {
            this.dispatchEvent('conversationSaved', { conversation: this.currentConversation });
        }

        return success;
    }

    /**
     * 发送消息
     * @param {string} content 消息内容
     * @param {Object} options 选项
     * @returns {Promise<Object>} 返回消息对象
     */
    async sendMessage(content, options = {}) {
        if (this.isProcessing) {
            console.warn('正在处理消息，请稍后再试');
            return null;
        }

        if (!content.trim()) {
            throw new Error('消息内容不能为空');
        }

        const messageObj = this.createMessageObject('user', content, options);
        this.addMessageToHistory(messageObj);

        try {
            this.isProcessing = true;
            this.dispatchEvent('messageProcessingStart', { message: messageObj });

            // 获取AI响应
            const response = await this.getAIResponse(content, options);
            const responseObj = this.createMessageObject('assistant', response, {
                ...options,
                mentor: this.currentConversation?.mentor
            });

            this.addMessageToHistory(responseObj);
            this.dispatchEvent('messageReceived', { 
                userMessage: messageObj, 
                aiResponse: responseObj 
            });

            // 自动保存
            if (this.settings.autoSave) {
                this.saveConversation();
            }

            return responseObj;

        } catch (error) {
            console.error('发送消息失败:', error);
            const errorObj = this.createMessageObject('system', `发送失败: ${error.message}`, {
                type: 'error'
            });
            this.addMessageToHistory(errorObj);
            this.dispatchEvent('messageError', { error: error, message: messageObj });
            throw error;
        } finally {
            this.isProcessing = false;
            this.dispatchEvent('messageProcessingEnd', { message: messageObj });
        }
    }

    /**
     * 获取AI响应
     * @param {string} content 用户消息
     * @param {Object} options 选项
     * @returns {Promise<string>} AI响应
     */
    async getAIResponse(content, options = {}) {
        const currentMentor = this.currentConversation?.mentor;
        if (!currentMentor) {
            throw new Error('请先选择导师');
        }

        // 构建请求参数
        const requestData = {
            messages: this.buildMessageContext(),
            mentor: currentMentor,
            options: {
                temperature: options.temperature || 0.7,
                maxTokens: options.maxTokens || 1000,
                stream: options.stream || false
            }
        };

        // 使用API服务发送请求
        if (window.apiService) {
            return await window.apiService.sendMessage(requestData);
        } else {
            // 如果没有API服务，使用模拟响应
            return await this.simulateAIResponse(content, currentMentor);
        }
    }

    /**
     * 构建消息上下文
     * @returns {Array} 消息上下文数组
     */
    buildMessageContext() {
        const contextLength = Math.min(this.conversationHistory.length, this.settings.maxHistoryLength);
        const recentMessages = this.conversationHistory.slice(-contextLength);
        
        return recentMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp
        }));
    }

    /**
     * 模拟AI响应（用于测试）
     * @param {string} content 用户消息
     * @param {Object} mentor 导师信息
     * @returns {Promise<string>} 模拟响应
     */
    async simulateAIResponse(content, mentor) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const responses = [
                    `作为${mentor.name}，我理解您的问题。让我为您详细解答...`,
                    `基于我在${mentor.expertise?.join('、')}方面的经验，我建议...`,
                    `这是一个很好的问题。从${mentor.name}的角度来看...`,
                    `让我分享一些关于"${content}"的见解...`
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                resolve(randomResponse);
            }, 1000 + Math.random() * 2000); // 1-3秒延迟
        });
    }

    /**
     * 创建消息对象
     * @param {string} role 角色：user/assistant/system
     * @param {string} content 消息内容
     * @param {Object} options 选项
     * @returns {Object} 消息对象
     */
    createMessageObject(role, content, options = {}) {
        return {
            id: this.generateMessageId(),
            role: role,
            content: content,
            timestamp: new Date().toISOString(),
            metadata: {
                type: options.type || 'text',
                mentor: options.mentor || null,
                processingTime: options.processingTime || 0,
                tokens: options.tokens || 0,
                ...options.metadata
            }
        };
    }

    /**
     * 添加消息到历史记录
     * @param {Object} message 消息对象
     */
    addMessageToHistory(message) {
        this.conversationHistory.push(message);
        
        // 限制历史记录长度
        if (this.conversationHistory.length > this.settings.maxHistoryLength * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.settings.maxHistoryLength);
        }

        this.dispatchEvent('messageAdded', { message: message });
    }

    /**
     * 获取对话历史
     * @returns {Array} 消息历史数组
     */
    getConversationHistory() {
        return [...this.conversationHistory];
    }

    /**
     * 清空对话历史
     */
    clearHistory() {
        this.conversationHistory = [];
        if (this.currentConversation) {
            this.currentConversation.messages = [];
            this.currentConversation.metadata.messageCount = 0;
        }
        this.dispatchEvent('historyCleared', {});
    }

    /**
     * 删除指定消息
     * @param {string} messageId 消息ID
     * @returns {boolean} 删除是否成功
     */
    deleteMessage(messageId) {
        const index = this.conversationHistory.findIndex(msg => msg.id === messageId);
        if (index > -1) {
            const deletedMessage = this.conversationHistory.splice(index, 1)[0];
            this.dispatchEvent('messageDeleted', { message: deletedMessage });
            return true;
        }
        return false;
    }

    /**
     * 编辑消息
     * @param {string} messageId 消息ID
     * @param {string} newContent 新内容
     * @returns {boolean} 编辑是否成功
     */
    editMessage(messageId, newContent) {
        const message = this.conversationHistory.find(msg => msg.id === messageId);
        if (message) {
            const oldContent = message.content;
            message.content = newContent;
            message.metadata.edited = true;
            message.metadata.editedAt = new Date().toISOString();
            
            this.dispatchEvent('messageEdited', { 
                message: message, 
                oldContent: oldContent,
                newContent: newContent 
            });
            return true;
        }
        return false;
    }

    /**
     * 处理导师变换
     * @param {Object} mentor 新导师信息
     */
    handleMentorChange(mentor) {
        if (this.currentConversation) {
            this.currentConversation.mentor = mentor;
            this.dispatchEvent('conversationMentorChanged', { 
                conversation: this.currentConversation, 
                mentor: mentor 
            });
        }
    }

    /**
     * 获取对话统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        if (!this.currentConversation) return null;

        const messages = this.conversationHistory;
        const userMessages = messages.filter(m => m.role === 'user');
        const aiMessages = messages.filter(m => m.role === 'assistant');
        
        return {
            conversationId: this.currentConversation.id,
            totalMessages: messages.length,
            userMessages: userMessages.length,
            aiMessages: aiMessages.length,
            averageResponseTime: this.calculateAverageResponseTime(),
            conversationDuration: this.calculateConversationDuration(),
            currentMentor: this.currentConversation.mentor?.name || 'Unknown'
        };
    }

    /**
     * 计算平均响应时间
     * @returns {number} 平均响应时间（毫秒）
     */
    calculateAverageResponseTime() {
        const responseTimes = this.conversationHistory
            .filter(m => m.role === 'assistant')
            .map(m => m.metadata.processingTime || 0)
            .filter(time => time > 0);

        if (responseTimes.length === 0) return 0;
        return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    /**
     * 计算对话持续时间
     * @returns {number} 持续时间（毫秒）
     */
    calculateConversationDuration() {
        if (!this.currentConversation || this.conversationHistory.length === 0) return 0;
        
        const firstMessage = this.conversationHistory[0];
        const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
        
        return new Date(lastMessage.timestamp) - new Date(firstMessage.timestamp);
    }

    /**
     * 生成对话ID
     * @returns {string} 对话ID
     */
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 生成消息ID
     * @returns {string} 消息ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 生成对话标题
     * @returns {string} 对话标题
     */
    generateConversationTitle() {
        const mentor = this.currentConversation?.mentor;
        const mentorName = mentor ? mentor.name : '智能助手';
        const timestamp = new Date().toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        });
        return `与${mentorName}的对话 - ${timestamp}`;
    }

    /**
     * 事件分发
     * @param {string} eventName 事件名称
     * @param {Object} data 事件数据
     */
    dispatchEvent(eventName, data) {
        const event = new CustomEvent(`conversation:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * 获取当前对话
     * @returns {Object|null} 当前对话信息
     */
    getCurrentConversation() {
        return this.currentConversation;
    }

    /**
     * 检查是否正在处理
     * @returns {boolean} 是否正在处理
     */
    isProcessingMessage() {
        return this.isProcessing;
    }

    /**
     * 设置配置
     * @param {Object} newSettings 新设置
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.dispatchEvent('settingsUpdated', { settings: this.settings });
    }
}

// 创建全局对话引擎实例
window.conversationEngine = new ConversationEngine();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationEngine;
} 