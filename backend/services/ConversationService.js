/**
 * 对话服务层 - 业务逻辑处理
 * 
 * 职责：
 * - 对话生命周期管理
 * - 业务规则验证
 * - 数据转换和处理
 * - 缓存管理
 * - 事件发布
 */

const { v4: uuidv4 } = require('uuid');
const ConversationRepository = require('../repositories/ConversationRepository');
const MessageRepository = require('../repositories/MessageRepository');
const CacheService = require('./CacheService');
const EventService = require('./EventService');
const SearchService = require('./SearchService');
const ValidationService = require('./ValidationService');
const AnalyticsService = require('./AnalyticsService');

class ConversationService {
    constructor() {
        this.conversationRepo = new ConversationRepository();
        this.messageRepo = new MessageRepository();
        this.cache = new CacheService();
        this.events = new EventService();
        this.search = new SearchService();
        this.validation = new ValidationService();
        this.analytics = new AnalyticsService();
    }

    /**
     * 创建新对话
     * @param {Object} params - 创建参数
     * @param {number} params.userId - 用户ID
     * @param {string} params.title - 对话标题
     * @param {string} params.mentorId - 主导师ID
     * @param {string} params.mentorName - 主导师名称
     * @param {Array} params.mentors - 所有参与导师
     * @param {string} params.mode - 对话模式
     * @param {Object} params.metadata - 元数据
     * @returns {Object} 创建的对话对象
     */
    async createConversation(params) {
        try {
            // 1. 参数验证
            await this.validation.validateConversationCreation(params);

            // 2. 构建对话对象
            const conversationData = {
                uuid: uuidv4(),
                user_id: params.userId,
                title: this.sanitizeTitle(params.title),
                description: params.description || '',
                mode: params.mode || 'single',
                primary_mentor_id: params.mentorId,
                primary_mentor_name: params.mentorName,
                mentors: JSON.stringify(params.mentors || [params.mentorId]),
                status: 'active',
                metadata: JSON.stringify(params.metadata || {}),
                tags: params.tags || []
            };

            // 3. 保存到数据库
            const conversation = await this.conversationRepo.create(conversationData);

            // 4. 缓存新对话
            await this.cache.setConversation(conversation.id, conversation);

            // 5. 发布创建事件
            await this.events.publish('conversation.created', {
                conversationId: conversation.id,
                userId: params.userId,
                mentorId: params.mentorId
            });

            // 6. 记录分析事件
            await this.analytics.trackConversationCreated(conversation);

            return this.formatConversationResponse(conversation);

        } catch (error) {
            throw new Error(`创建对话失败: ${error.message}`);
        }
    }

    /**
     * 获取用户对话列表
     * @param {Object} params - 查询参数
     * @returns {Object} 分页的对话列表
     */
    async getUserConversations(params) {
        try {
            const {
                userId,
                page = 1,
                limit = 20,
                search,
                mentor,
                status,
                tags,
                dateFrom,
                dateTo,
                sortBy = 'last_activity_at',
                sortOrder = 'DESC'
            } = params;

            // 1. 构建查询条件
            const queryOptions = {
                userId,
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100), // 限制最大页大小
                search,
                mentor,
                status,
                tags,
                dateFrom,
                dateTo,
                sortBy,
                sortOrder
            };

            // 2. 尝试从缓存获取
            const cacheKey = this.generateListCacheKey(queryOptions);
            let cachedResult = await this.cache.getConversationList(cacheKey);
            
            if (cachedResult) {
                return cachedResult;
            }

            // 3. 从数据库查询
            const result = await this.conversationRepo.findByUser(queryOptions);

            // 4. 格式化响应数据
            const formattedResult = {
                conversations: result.conversations.map(conv => this.formatConversationResponse(conv)),
                pagination: {
                    page: queryOptions.page,
                    limit: queryOptions.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / queryOptions.limit),
                    hasNext: queryOptions.page < Math.ceil(result.total / queryOptions.limit),
                    hasPrev: queryOptions.page > 1
                },
                filters: {
                    search,
                    mentor,
                    status,
                    tags,
                    dateFrom,
                    dateTo
                }
            };

            // 5. 缓存结果（短期缓存）
            await this.cache.setConversationList(cacheKey, formattedResult, 300); // 5分钟

            return formattedResult;

        } catch (error) {
            throw new Error(`获取对话列表失败: ${error.message}`);
        }
    }

    /**
     * 获取对话详情
     * @param {number} conversationId - 对话ID
     * @param {number} userId - 用户ID
     * @param {Object} options - 选项
     * @returns {Object} 对话详情
     */
    async getConversationDetail(conversationId, userId, options = {}) {
        try {
            // 1. 权限验证
            await this.validateConversationAccess(conversationId, userId);

            // 2. 尝试从缓存获取
            let conversation = await this.cache.getConversation(conversationId);
            
            if (!conversation) {
                // 3. 从数据库获取
                conversation = await this.conversationRepo.findById(conversationId);
                
                if (!conversation) {
                    throw new Error('对话不存在');
                }

                // 4. 缓存对话信息
                await this.cache.setConversation(conversationId, conversation);
            }

            // 5. 获取消息列表
            const messages = await this.getConversationMessages(conversationId, {
                includeDeleted: options.includeDeleted || false,
                limit: options.messageLimit || 1000
            });

            // 6. 更新最后访问时间
            await this.updateLastActivity(conversationId);

            // 7. 记录访问事件
            await this.analytics.trackConversationViewed(conversationId, userId);

            return {
                conversation: this.formatConversationResponse(conversation),
                messages: messages.map(msg => this.formatMessageResponse(msg)),
                statistics: await this.getConversationStatistics(conversationId)
            };

        } catch (error) {
            throw new Error(`获取对话详情失败: ${error.message}`);
        }
    }

    /**
     * 保存消息
     * @param {Object} messageData - 消息数据
     * @returns {Object} 保存的消息
     */
    async saveMessage(messageData) {
        try {
            // 1. 参数验证
            await this.validation.validateMessage(messageData);

            // 2. 权限验证
            await this.validateConversationAccess(messageData.conversationId, messageData.userId);

            // 3. 获取下一个消息序号
            const messageOrder = await this.getNextMessageOrder(messageData.conversationId);

            // 4. 构建消息对象
            const message = {
                uuid: uuidv4(),
                conversation_id: messageData.conversationId,
                role: messageData.role,
                content: messageData.content,
                content_type: messageData.contentType || 'text',
                message_order: messageOrder,
                thread_id: messageData.threadId || uuidv4(),
                parent_message_id: messageData.parentMessageId,
                model_used: messageData.modelUsed,
                mentor_id: messageData.mentorId,
                mentor_name: messageData.mentorName,
                completion_tokens: messageData.completionTokens || 0,
                prompt_tokens: messageData.promptTokens || 0,
                total_tokens: messageData.totalTokens || 0,
                processing_time_ms: messageData.processingTime,
                response_time_ms: messageData.responseTime,
                attachments: JSON.stringify(messageData.attachments || []),
                metadata: JSON.stringify(messageData.metadata || {}),
                client_info: JSON.stringify(messageData.clientInfo || {})
            };

            // 5. 保存消息
            const savedMessage = await this.messageRepo.create(message);

            // 6. 更新对话活动时间
            await this.updateLastActivity(messageData.conversationId);

            // 7. 清除相关缓存
            await this.cache.deleteConversation(messageData.conversationId);
            await this.cache.deleteConversationMessages(messageData.conversationId);

            // 8. 发布消息事件
            await this.events.publish('message.created', {
                messageId: savedMessage.id,
                conversationId: messageData.conversationId,
                role: messageData.role,
                userId: messageData.userId
            });

            // 9. 记录分析事件
            await this.analytics.trackMessageCreated(savedMessage);

            // 10. 异步处理
            this.processMessageAsync(savedMessage).catch(console.error);

            return this.formatMessageResponse(savedMessage);

        } catch (error) {
            throw new Error(`保存消息失败: ${error.message}`);
        }
    }

    /**
     * 更新对话信息
     * @param {number} conversationId - 对话ID
     * @param {number} userId - 用户ID
     * @param {Object} updateData - 更新数据
     * @returns {Object} 更新后的对话
     */
    async updateConversation(conversationId, userId, updateData) {
        try {
            // 1. 权限验证
            await this.validateConversationAccess(conversationId, userId);

            // 2. 参数验证
            await this.validation.validateConversationUpdate(updateData);

            // 3. 构建更新数据
            const updateFields = {};
            
            if (updateData.title) {
                updateFields.title = this.sanitizeTitle(updateData.title);
            }
            
            if (updateData.description !== undefined) {
                updateFields.description = updateData.description;
            }
            
            if (updateData.status) {
                updateFields.status = updateData.status;
            }
            
            if (updateData.isFavorite !== undefined) {
                updateFields.is_favorite = updateData.isFavorite;
            }
            
            if (updateData.isPinned !== undefined) {
                updateFields.is_pinned = updateData.isPinned;
            }
            
            if (updateData.tags) {
                updateFields.tags = updateData.tags;
            }
            
            if (updateData.satisfactionRating) {
                updateFields.satisfaction_rating = updateData.satisfactionRating;
            }
            
            if (updateData.feedbackText) {
                updateFields.feedback_text = updateData.feedbackText;
            }

            updateFields.updated_at = new Date();

            // 4. 执行更新
            const updatedConversation = await this.conversationRepo.update(conversationId, updateFields);

            // 5. 清除缓存
            await this.cache.deleteConversation(conversationId);

            // 6. 发布更新事件
            await this.events.publish('conversation.updated', {
                conversationId,
                userId,
                updateFields: Object.keys(updateFields)
            });

            return this.formatConversationResponse(updatedConversation);

        } catch (error) {
            throw new Error(`更新对话失败: ${error.message}`);
        }
    }

    /**
     * 删除对话（软删除）
     * @param {number} conversationId - 对话ID
     * @param {number} userId - 用户ID
     * @returns {boolean} 删除是否成功
     */
    async deleteConversation(conversationId, userId) {
        try {
            // 1. 权限验证
            await this.validateConversationAccess(conversationId, userId);

            // 2. 软删除对话
            await this.conversationRepo.softDelete(conversationId);

            // 3. 清除所有相关缓存
            await this.cache.deleteConversation(conversationId);
            await this.cache.deleteConversationMessages(conversationId);

            // 4. 发布删除事件
            await this.events.publish('conversation.deleted', {
                conversationId,
                userId
            });

            return true;

        } catch (error) {
            throw new Error(`删除对话失败: ${error.message}`);
        }
    }

    /**
     * 搜索对话
     * @param {Object} params - 搜索参数
     * @returns {Object} 搜索结果
     */
    async searchConversations(params) {
        try {
            const {
                userId,
                query,
                filters = {},
                page = 1,
                limit = 20
            } = params;

            // 使用搜索服务进行全文搜索
            const results = await this.search.searchConversations({
                userId,
                query,
                filters,
                page,
                limit
            });

            return {
                results: results.conversations.map(conv => this.formatConversationResponse(conv)),
                pagination: results.pagination,
                query,
                filters,
                searchStats: results.stats
            };

        } catch (error) {
            throw new Error(`搜索对话失败: ${error.message}`);
        }
    }

    /**
     * 获取用户统计信息
     * @param {number} userId - 用户ID
     * @returns {Object} 统计信息
     */
    async getUserStatistics(userId) {
        try {
            // 尝试从缓存获取
            const cacheKey = `user_stats:${userId}`;
            let stats = await this.cache.get(cacheKey);
            
            if (stats) {
                return stats;
            }

            // 从数据库获取统计信息
            stats = await this.conversationRepo.getUserStatistics(userId);

            // 缓存统计信息（较长时间）
            await this.cache.set(cacheKey, stats, 3600); // 1小时

            return stats;

        } catch (error) {
            throw new Error(`获取用户统计信息失败: ${error.message}`);
        }
    }

    /**
     * 导出对话
     * @param {number} conversationId - 对话ID
     * @param {number} userId - 用户ID
     * @param {string} format - 导出格式
     * @returns {Object} 导出数据
     */
    async exportConversation(conversationId, userId, format = 'markdown') {
        try {
            // 1. 权限验证
            await this.validateConversationAccess(conversationId, userId);

            // 2. 获取完整对话数据
            const conversationDetail = await this.getConversationDetail(conversationId, userId, {
                includeDeleted: false,
                messageLimit: 10000
            });

            // 3. 根据格式导出
            let exportData;
            switch (format.toLowerCase()) {
                case 'markdown':
                    exportData = await this.exportToMarkdown(conversationDetail);
                    break;
                case 'json':
                    exportData = await this.exportToJSON(conversationDetail);
                    break;
                case 'pdf':
                    exportData = await this.exportToPDF(conversationDetail);
                    break;
                default:
                    throw new Error(`不支持的导出格式: ${format}`);
            }

            // 4. 记录导出事件
            await this.analytics.trackConversationExported(conversationId, userId, format);

            return {
                format,
                data: exportData,
                filename: this.generateExportFilename(conversationDetail.conversation, format),
                size: Buffer.byteLength(exportData, 'utf8')
            };

        } catch (error) {
            throw new Error(`导出对话失败: ${error.message}`);
        }
    }

    // =====================================
    // 私有辅助方法
    // =====================================

    /**
     * 验证对话访问权限
     */
    async validateConversationAccess(conversationId, userId) {
        const conversation = await this.conversationRepo.findById(conversationId);
        
        if (!conversation) {
            throw new Error('对话不存在');
        }
        
        if (conversation.user_id !== userId) {
            throw new Error('无权访问此对话');
        }
        
        if (conversation.deleted_at) {
            throw new Error('对话已删除');
        }
        
        return conversation;
    }

    /**
     * 获取对话消息列表
     */
    async getConversationMessages(conversationId, options = {}) {
        // 尝试从缓存获取
        const cacheKey = `messages:${conversationId}`;
        let messages = await this.cache.getConversationMessages(cacheKey);
        
        if (!messages) {
            // 从数据库获取
            messages = await this.messageRepo.findByConversationId(conversationId, options);
            
            // 缓存消息列表
            await this.cache.setConversationMessages(cacheKey, messages, 1800); // 30分钟
        }
        
        return messages;
    }

    /**
     * 获取下一个消息序号
     */
    async getNextMessageOrder(conversationId) {
        const lastMessage = await this.messageRepo.findLastMessage(conversationId);
        return lastMessage ? lastMessage.message_order + 1 : 1;
    }

    /**
     * 更新对话最后活动时间
     */
    async updateLastActivity(conversationId) {
        await this.conversationRepo.updateLastActivity(conversationId);
    }

    /**
     * 异步处理消息
     */
    async processMessageAsync(message) {
        try {
            // 更新搜索索引
            await this.search.indexMessage(message);
            
            // 分析消息内容
            await this.analytics.analyzeMessage(message);
            
            // 其他异步处理...
        } catch (error) {
            console.error('异步处理消息失败:', error);
        }
    }

    /**
     * 格式化对话响应
     */
    formatConversationResponse(conversation) {
        return {
            id: conversation.id,
            uuid: conversation.uuid,
            title: conversation.title,
            description: conversation.description,
            mode: conversation.mode,
            mentorId: conversation.primary_mentor_id,
            mentorName: conversation.primary_mentor_name,
            mentors: this.safeParseJSON(conversation.mentors, []),
            status: conversation.status,
            isFavorite: conversation.is_favorite,
            isPinned: conversation.is_pinned,
            messageCount: conversation.message_count,
            lastMessageAt: conversation.last_message_at,
            lastActivityAt: conversation.last_activity_at,
            createdAt: conversation.created_at,
            updatedAt: conversation.updated_at,
            tags: conversation.tags || [],
            metadata: this.safeParseJSON(conversation.metadata, {})
        };
    }

    /**
     * 格式化消息响应
     */
    formatMessageResponse(message) {
        return {
            id: message.id,
            uuid: message.uuid,
            role: message.role,
            content: message.content,
            contentType: message.content_type,
            messageOrder: message.message_order,
            mentorId: message.mentor_id,
            mentorName: message.mentor_name,
            tokens: {
                completion: message.completion_tokens,
                prompt: message.prompt_tokens,
                total: message.total_tokens
            },
            timing: {
                processing: message.processing_time_ms,
                response: message.response_time_ms
            },
            attachments: this.safeParseJSON(message.attachments, []),
            metadata: this.safeParseJSON(message.metadata, {}),
            createdAt: message.created_at,
            isEdited: message.is_edited
        };
    }

    /**
     * 安全的JSON解析
     */
    safeParseJSON(jsonString, defaultValue = null) {
        try {
            return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        } catch (error) {
            return defaultValue;
        }
    }

    /**
     * 清理标题
     */
    sanitizeTitle(title) {
        return title.trim().substring(0, 500);
    }

    /**
     * 生成列表缓存键
     */
    generateListCacheKey(options) {
        const keyParts = [
            'conv_list',
            options.userId,
            options.page,
            options.limit,
            options.search || '',
            options.mentor || '',
            options.status || '',
            (options.tags || []).join(','),
            options.sortBy,
            options.sortOrder
        ];
        
        return keyParts.join(':');
    }

    /**
     * 生成导出文件名
     */
    generateExportFilename(conversation, format) {
        const date = new Date().toISOString().split('T')[0];
        const safeName = conversation.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_');
        return `conversation_${safeName}_${date}.${format}`;
    }

    /**
     * 导出为Markdown格式
     */
    async exportToMarkdown(conversationDetail) {
        const { conversation, messages } = conversationDetail;
        
        let markdown = `# ${conversation.title}\n\n`;
        markdown += `**导师**: ${conversation.mentorName}\n`;
        markdown += `**创建时间**: ${new Date(conversation.createdAt).toLocaleString()}\n`;
        markdown += `**消息数量**: ${conversation.messageCount}\n\n`;
        markdown += `---\n\n`;
        
        messages.forEach(message => {
            const role = message.role === 'user' ? '👤 用户' : `🤖 ${message.mentorName || 'AI导师'}`;
            const time = new Date(message.createdAt).toLocaleString();
            
            markdown += `## ${role} (${time})\n\n`;
            markdown += `${message.content}\n\n`;
            
            if (message.attachments && message.attachments.length > 0) {
                markdown += `**附件**: ${message.attachments.map(att => att.name).join(', ')}\n\n`;
            }
        });
        
        return markdown;
    }

    /**
     * 导出为JSON格式
     */
    async exportToJSON(conversationDetail) {
        return JSON.stringify(conversationDetail, null, 2);
    }

    /**
     * 获取对话统计信息
     */
    async getConversationStatistics(conversationId) {
        return await this.conversationRepo.getConversationStatistics(conversationId);
    }
}

module.exports = ConversationService; 