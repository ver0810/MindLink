/**
 * 增强版对话引擎模块
 * 支持与后端数据库集成，自动保存对话记录
 */
class ConversationEngineEnhanced {
    constructor() {
        this.currentConversation = null;
        this.conversationHistory = [];
        this.isProcessing = false;
        this.messageQueue = [];
        this.settings = {
            maxHistoryLength: 50,
            autoSave: true,
            responseTimeout: 30000,
            retryAttempts: 3,
            saveToDatabase: false // 暂时禁用数据库保存功能
        };
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.authToken = null;
        this.initialize();
    }

    /**
     * 初始化对话引擎
     */
    async initialize() {
        try {
            this.loadSettings();
            this.setupEventListeners();
            this.checkAuthStatus();
            console.log('增强版对话引擎初始化成功');
        } catch (error) {
            console.error('对话引擎初始化失败:', error);
        }
    }

    /**
     * 检查认证状态
     */
    checkAuthStatus() {
        this.authToken = localStorage.getItem('auth_token');
        if (!this.authToken) {
            console.warn('用户未登录，将无法保存对话记录到数据库');
            this.settings.saveToDatabase = false;
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

        // 监听用户登录事件
        document.addEventListener('auth:loginSuccess', (event) => {
            this.authToken = event.detail.token;
            this.settings.saveToDatabase = true;
            console.log('用户登录成功，启用数据库保存功能');
        });

        // 监听用户登出事件
        document.addEventListener('auth:logout', () => {
            this.authToken = null;
            this.settings.saveToDatabase = false;
            console.log('用户登出，禁用数据库保存功能');
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
    async createConversation(config = {}) {
        const conversationId = this.generateConversationId();
        
        // 优先使用配置中的导师信息，否则尝试从mentorSystem获取
        const currentMentor = config.mentors?.[0] || window.mentorSystem?.getCurrentMentor();
        
        console.log('创建对话时的导师信息:', {
            configMentors: config.mentors,
            currentMentor: currentMentor,
            mentorSystemExists: !!window.mentorSystem,
            mentorSystemCurrent: window.mentorSystem?.getCurrentMentor()
        });
        
        this.currentConversation = {
            id: conversationId,
            mentor: currentMentor,
            mentors: config.mentors || [currentMentor],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            title: config.title || this.generateConversationTitle(),
            mode: config.mode || 'single',
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

        // 尝试保存到数据库，失败时不影响本地对话创建
        if (this.settings.saveToDatabase && this.authToken) {
            try {
                await this.createConversationInDatabase();
                console.log('对话记录已保存到数据库');
            } catch (error) {
                console.error('创建数据库对话记录失败:', error);
                console.log('将继续使用本地存储');
                // 不影响本地对话创建
            }
        } else {
            console.log('数据库保存功能未启用，对话记录将保存到本地存储');
        }

        this.dispatchEvent('conversationCreated', { conversation: this.currentConversation });
        
        return conversationId;
    }

    /**
     * 在数据库中创建对话记录
     */
    async createConversationInDatabase() {
        if (!this.currentConversation || !this.authToken) {
            console.warn('无法创建数据库对话记录: 缺少对话信息或认证令牌');
            return;
        }

        // 确保导师信息存在
        if (!this.currentConversation.mentor) {
            console.warn('导师信息缺失，使用默认值');
            this.currentConversation.mentor = {
                id: 'default',
                name: '默认导师'
            };
        }

        console.log('正在创建数据库对话记录...', {
            title: this.currentConversation.title,
            mentorId: this.currentConversation.mentor?.id,
            mentorName: this.currentConversation.mentor?.name,
            mentor_object: this.currentConversation.mentor
        });

        const response = await fetch(`${this.apiBaseUrl}/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify({
                title: this.currentConversation.title,
                mentorId: this.currentConversation.mentor?.id || 'default',
                mentorName: this.currentConversation.mentor?.name || '默认导师',
                mode: this.currentConversation.mode || 'single',
                metadata: this.currentConversation.metadata || {}
            })
        });

        if (response.ok) {
            const data = await response.json();
            this.currentConversation.databaseId = data.data.conversation.id;
            console.log('数据库对话记录创建成功, ID:', this.currentConversation.databaseId);
        } else {
            const errorText = await response.text();
            console.error('创建数据库对话记录失败:', response.status, errorText);
            throw new Error(`创建数据库对话记录失败: ${response.status}`);
        }
    }

    /**
     * 加载对话
     * @param {string} conversationId 对话ID（本地或数据库ID）
     * @returns {boolean} 加载是否成功
     */
    async loadConversation(conversationId) {
        // 首先尝试从数据库加载
        if (this.settings.saveToDatabase && this.authToken) {
            try {
                const conversation = await this.loadConversationFromDatabase(conversationId);
                if (conversation) {
                    this.currentConversation = this.convertDatabaseConversation(conversation);
                    this.conversationHistory = this.currentConversation.messages || [];
                    this.dispatchEvent('conversationLoaded', { conversation: this.currentConversation });
                    return true;
                }
            } catch (error) {
                console.error('从数据库加载对话失败:', error);
            }
        }

        // 如果数据库加载失败，尝试从本地存储加载
        if (window.storageManager) {
            const conversation = window.storageManager.conversation.load(conversationId);
            if (conversation) {
                this.currentConversation = conversation;
                this.conversationHistory = conversation.messages || [];
                this.dispatchEvent('conversationLoaded', { conversation: conversation });
                return true;
            }
        }

        return false;
    }

    /**
     * 从数据库加载对话
     */
    async loadConversationFromDatabase(conversationId) {
        const response = await fetch(`${this.apiBaseUrl}/conversations/${conversationId}`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.data.conversation;
        }
        return null;
    }

    /**
     * 转换数据库对话格式为本地格式
     */
    convertDatabaseConversation(dbConversation) {
        return {
            id: dbConversation.id.toString(),
            databaseId: dbConversation.id,
            mentor: {
                id: dbConversation.mentor_id,
                name: dbConversation.mentor_name
            },
            createdAt: dbConversation.created_at,
            updatedAt: dbConversation.updated_at,
            title: dbConversation.title,
            mode: 'single',
            settings: this.settings,
            messages: dbConversation.messages || [],
            metadata: dbConversation.metadata ? JSON.parse(dbConversation.metadata) : {}
        };
    }

    /**
     * 保存当前对话
     * @returns {boolean} 保存是否成功
     */
    async saveConversation() {
        if (!this.currentConversation) return false;

        this.currentConversation.updatedAt = new Date().toISOString();
        this.currentConversation.messages = this.conversationHistory;
        this.currentConversation.metadata.messageCount = this.conversationHistory.length;

        let databaseSaved = false;
        let localSaved = false;

        // 保存到数据库
        if (this.settings.saveToDatabase && this.authToken) {
            try {
                await this.saveConversationToDatabase();
                databaseSaved = true;
            } catch (error) {
                console.error('保存到数据库失败:', error);
            }
        }

        // 保存到本地存储
        if (window.storageManager) {
            localSaved = window.storageManager.conversation.save(
                this.currentConversation.id,
                this.currentConversation
            );
        }

        const success = databaseSaved || localSaved;
        if (success) {
            this.dispatchEvent('conversationSaved', { 
                conversation: this.currentConversation,
                savedToDatabase: databaseSaved,
                savedLocally: localSaved
            });
        }

        return success;
    }

    /**
     * 保存对话到数据库
     */
    async saveConversationToDatabase() {
        if (!this.currentConversation || !this.authToken) return;

        // 如果还没有数据库ID，先创建对话记录
        if (!this.currentConversation.databaseId) {
            await this.createConversationInDatabase();
        }

        // 更新对话信息
        const response = await fetch(`${this.apiBaseUrl}/conversations/${this.currentConversation.databaseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify({
                title: this.currentConversation.title,
                metadata: JSON.stringify(this.currentConversation.metadata)
            })
        });

        if (!response.ok) {
            throw new Error('更新数据库对话记录失败');
        }
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

        // 如果没有当前对话，创建一个
        if (!this.currentConversation) {
            await this.createConversation();
        }

        const messageObj = this.createMessageObject('user', content, options);
        this.addMessageToHistory(messageObj);

        // 保存用户消息到数据库
        if (this.settings.saveToDatabase && this.authToken && this.currentConversation.databaseId) {
            try {
                await this.saveMessageToDatabase(messageObj);
            } catch (error) {
                console.error('保存用户消息到数据库失败:', error);
            }
        }

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

            // 保存AI回复到数据库
            if (this.settings.saveToDatabase && this.authToken && this.currentConversation.databaseId) {
                try {
                    await this.saveMessageToDatabase(responseObj);
                } catch (error) {
                    console.error('保存AI回复到数据库失败:', error);
                }
            }

            this.dispatchEvent('messageReceived', { 
                userMessage: messageObj, 
                aiResponse: responseObj 
            });

            // 自动保存对话
            if (this.settings.autoSave) {
                await this.saveConversation();
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
     * 保存消息到数据库
     */
    async saveMessageToDatabase(message) {
        if (!this.currentConversation.databaseId || !this.authToken) return;

        const response = await fetch(`${this.apiBaseUrl}/conversations/${this.currentConversation.databaseId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify({
                role: message.role,
                content: message.content,
                message_order: this.conversationHistory.length - 1,
                metadata: JSON.stringify(message.metadata || {})
            })
        });

        if (!response.ok) {
            throw new Error('保存消息到数据库失败');
        }

        const data = await response.json();
        message.databaseId = data.data.message.id;
    }

    /**
     * 获取AI响应
     * @param {string} content 用户输入
     * @param {Object} options 选项
     * @returns {Promise<string>} AI响应
     */
    async getAIResponse(content, options = {}) {
        const startTime = Date.now();
        
        try {
            // 构建消息上下文
            const context = this.buildMessageContext();
            const mentor = this.currentConversation?.mentor;
            
            // 这里可以调用实际的AI API
            // 目前使用模拟响应
            const response = await this.simulateAIResponse(content, mentor);
            
            const processingTime = Date.now() - startTime;
            
            // 在响应对象中记录处理时间
            if (options.recordProcessingTime !== false) {
                options.processingTime = processingTime;
            }
            
            return response;
        } catch (error) {
            console.error('获取AI响应失败:', error);
            throw new Error('AI服务暂时不可用，请稍后再试');
        }
    }

    /**
     * 构建消息上下文
     * @returns {Array} 格式化的消息历史
     */
    buildMessageContext() {
        return this.conversationHistory
            .slice(-10) // 只保留最近10条消息作为上下文
            .map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }));
    }

    /**
     * 模拟AI响应
     * @param {string} content 用户输入
     * @param {Object} mentor 导师信息
     * @returns {Promise<string>} 模拟响应
     */
    async simulateAIResponse(content, mentor) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const mentorName = mentor ? mentor.name : '智能助手';
        const responses = [
            `作为${mentorName}，我认为您提出的问题很有价值。`,
            `基于我的经验，我建议您考虑以下几个方面...`,
            `这是一个很好的观点，让我们深入探讨一下...`,
            `从我的角度来看，这个问题需要综合考虑...`,
            `我理解您的困惑，让我为您详细解释一下...`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * 创建消息对象
     * @param {string} role 角色
     * @param {string} content 内容
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
                processingTime: options.processingTime || 0,
                mentor: options.mentor || null,
                edited: false,
                type: options.type || 'normal',
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
        if (this.conversationHistory.length > this.settings.maxHistoryLength) {
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
}

// 创建全局增强版对话引擎实例
window.conversationEngineEnhanced = new ConversationEngineEnhanced();

// 为了兼容性，也设置为原来的名称
window.conversationEngine = window.conversationEngineEnhanced;

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationEngineEnhanced;
} 