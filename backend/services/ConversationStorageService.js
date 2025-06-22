/**
 * 对话存储服务
 * 处理对话记录的持久化存储，支持多种数据库类型
 */

class ConversationStorageService {
    constructor(database, options = {}) {
        this.db = database;
        this.options = {
            enableCache: options.enableCache || false,
            cacheProvider: options.cacheProvider || null,
            enableArchiving: options.enableArchiving || false,
            archiveAfterDays: options.archiveAfterDays || 365,
            enableCompression: options.enableCompression || false,
            ...options
        };
        
        // 初始化缓存
        if (this.options.enableCache && this.options.cacheProvider) {
            this.cache = this.options.cacheProvider;
        }
    }

    /**
     * 创建新对话
     */
    async createConversation(conversationData) {
        const conversation = {
            user_id: conversationData.user_id,
            title: conversationData.title || '新对话',
            mentor_id: conversationData.mentor_id,
            mentor_name: conversationData.mentor_name,
            mode: conversationData.mode || 'single',
            status: 'active',
            visibility: conversationData.visibility || 'private',
            message_count: 0,
            total_tokens: 0,
            session_duration: 0,
            tags: conversationData.tags || '',
            metadata: JSON.stringify(conversationData.metadata || {}),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this.db.run(
                `INSERT INTO conversations (
                    user_id, title, mentor_id, mentor_name, mode, status, 
                    visibility, message_count, total_tokens, session_duration,
                    tags, metadata, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    conversation.user_id, conversation.title, conversation.mentor_id,
                    conversation.mentor_name, conversation.mode, conversation.status,
                    conversation.visibility, conversation.message_count, conversation.total_tokens,
                    conversation.session_duration, conversation.tags, conversation.metadata,
                    conversation.created_at, conversation.updated_at
                ]
            );

            const createdConversation = {
                id: result.lastID,
                ...conversation
            };

            // 缓存新创建的对话
            await this._cacheConversation(createdConversation);

            return createdConversation;
        } catch (error) {
            console.error('创建对话失败:', error);
            throw new Error(`Failed to create conversation: ${error.message}`);
        }
    }

    /**
     * 添加消息到对话
     */
    async addMessage(conversationId, messageData) {
        const message = {
            conversation_id: conversationId,
            role: messageData.role,
            content: messageData.content,
            content_type: messageData.content_type || 'text',
            message_order: messageData.message_order,
            model_used: messageData.model_used || '',
            mentor_id: messageData.mentor_id || '',
            mentor_name: messageData.mentor_name || '',
            tokens: messageData.tokens || 0,
            status: messageData.status || 'sent',
            attachments: JSON.stringify(messageData.attachments || []),
            metadata: JSON.stringify(messageData.metadata || {}),
            created_at: new Date().toISOString()
        };

        try {
            // 开始事务
            await this.db.run('BEGIN TRANSACTION');

            // 插入消息
            const messageResult = await this.db.run(
                `INSERT INTO conversation_messages (
                    conversation_id, role, content, content_type, message_order,
                    tokens, status, attachments, metadata, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    message.conversation_id, message.role, message.content,
                    message.content_type, message.message_order, message.tokens,
                    message.status, message.attachments, message.metadata,
                    message.created_at
                ]
            );

            // 更新对话统计信息
            await this.db.run(
                `UPDATE conversations SET 
                    message_count = message_count + 1,
                    total_tokens = total_tokens + ?,
                    updated_at = ?
                WHERE id = ?`,
                [message.tokens, message.created_at, conversationId]
            );

            await this.db.run('COMMIT');

            const createdMessage = {
                id: messageResult.lastID,
                ...message
            };

            // 清除对话缓存，触发重新加载
            await this._invalidateConversationCache(conversationId);

            return createdMessage;
        } catch (error) {
            await this.db.run('ROLLBACK');
            console.error('添加消息失败:', error);
            throw new Error(`Failed to add message: ${error.message}`);
        }
    }

    /**
     * 获取用户的对话列表
     */
    async getUserConversations(userId, options = {}) {
        const {
            limit = 50,
            offset = 0,
            status = 'active',
            search = '',
            sortBy = 'updated_at',
            sortOrder = 'DESC'
        } = options;

        try {
            let query = `
                SELECT 
                    id, title, mentor_id, mentor_name, status,
                    message_count, total_tokens, is_favorite, 
                    tags, created_at, updated_at
                FROM conversations 
                WHERE user_id = ? AND status != 'deleted'
            `;
            const params = [userId];

            // 添加搜索条件
            if (search) {
                query += ` AND (title LIKE ? OR mentor_name LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
            }

            // 添加排序
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
            
            // 添加分页
            query += ` LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const conversations = await this.db.all(query, params);
            
            // 解析JSON字段
            const parsedConversations = conversations.map(conv => ({
                ...conv,
                tags: conv.tags ? conv.tags.split(',') : [],
                is_favorite: Boolean(conv.is_favorite)
            }));

            return parsedConversations;
        } catch (error) {
            console.error('获取用户对话列表失败:', error);
            throw new Error(`Failed to get user conversations: ${error.message}`);
        }
    }

    /**
     * 获取对话详情（包含消息）
     */
    async getConversationWithMessages(conversationId, userId, options = {}) {
        const {
            messageLimit = 100,
            messageOffset = 0
        } = options;

        try {
            // 获取对话基本信息
            const conversation = await this.db.get(
                `SELECT * FROM conversations WHERE id = ? AND user_id = ?`,
                [conversationId, userId]
            );

            if (!conversation) {
                throw new Error('对话不存在或无权访问');
            }

            // 获取消息列表
            const messages = await this.db.all(`
                SELECT 
                    id, role, content, message_order, tokens,
                    status, attachments, metadata, created_at
                FROM conversation_messages 
                WHERE conversation_id = ?
                ORDER BY message_order ASC 
                LIMIT ? OFFSET ?`,
                [conversationId, messageLimit, messageOffset]
            );

            // 解析JSON字段
            const parsedMessages = messages.map(msg => ({
                ...msg,
                attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
                metadata: msg.metadata ? JSON.parse(msg.metadata) : {}
            }));

            const result = {
                ...conversation,
                tags: conversation.tags ? conversation.tags.split(',') : [],
                metadata: conversation.metadata ? JSON.parse(conversation.metadata) : {},
                is_favorite: Boolean(conversation.is_favorite),
                messages: parsedMessages
            };

            return result;
        } catch (error) {
            console.error('获取对话详情失败:', error);
            throw new Error(`Failed to get conversation details: ${error.message}`);
        }
    }

    /**
     * 更新对话信息
     */
    async updateConversation(conversationId, userId, updateData) {
        const allowedFields = [
            'title', 'status', 'is_favorite', 'visibility', 
            'tags', 'metadata', 'satisfaction_rating'
        ];
        
        const updateFields = [];
        const updateValues = [];

        // 过滤允许更新的字段
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                if (key === 'metadata') {
                    updateValues.push(JSON.stringify(updateData[key]));
                } else if (key === 'tags' && Array.isArray(updateData[key])) {
                    updateValues.push(updateData[key].join(','));
                } else {
                    updateValues.push(updateData[key]);
                }
            }
        });

        if (updateFields.length === 0) {
            throw new Error('没有可更新的字段');
        }

        // 添加更新时间
        updateFields.push('updated_at = ?');
        updateValues.push(new Date().toISOString());
        updateValues.push(conversationId, userId);

        try {
            const result = await this.db.run(
                `UPDATE conversations SET ${updateFields.join(', ')} 
                 WHERE id = ? AND user_id = ?`,
                updateValues
            );

            if (result.changes === 0) {
                throw new Error('对话不存在或无权修改');
            }

            // 清除缓存
            await this._invalidateConversationCache(conversationId);

            return { success: true, changes: result.changes };
        } catch (error) {
            console.error('更新对话失败:', error);
            throw new Error(`Failed to update conversation: ${error.message}`);
        }
    }

    /**
     * 删除对话（软删除）
     */
    async deleteConversation(conversationId, userId) {
        try {
            const result = await this.db.run(
                `UPDATE conversations SET 
                    status = 'deleted',
                    updated_at = ?
                WHERE id = ? AND user_id = ?`,
                [new Date().toISOString(), conversationId, userId]
            );

            if (result.changes === 0) {
                throw new Error('对话不存在或无权删除');
            }

            // 清除缓存
            await this._invalidateConversationCache(conversationId);

            return { success: true };
        } catch (error) {
            console.error('删除对话失败:', error);
            throw new Error(`Failed to delete conversation: ${error.message}`);
        }
    }

    /**
     * 获取对话统计信息
     */
    async getConversationStats(userId, timeRange = '30d') {
        const cacheKey = `conversation_stats:${userId}:${timeRange}`;
        
        if (this.cache) {
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }

        try {
            const timeCondition = this._getTimeCondition(timeRange);
            
            const stats = await this.db.get(`
                SELECT 
                    COUNT(*) as total_conversations,
                    SUM(message_count) as total_messages,
                    SUM(total_tokens) as total_tokens,
                    SUM(session_duration) as total_duration,
                    AVG(satisfaction_rating) as avg_rating,
                    COUNT(CASE WHEN is_favorite = 1 THEN 1 END) as favorite_count
                FROM conversations 
                WHERE user_id = ? AND status != 'deleted' ${timeCondition}`,
                [userId]
            );

            // 获取最活跃的导师
            const topMentors = await this.db.all(`
                SELECT 
                    mentor_name,
                    COUNT(*) as conversation_count,
                    SUM(message_count) as total_messages
                FROM conversations 
                WHERE user_id = ? AND status != 'deleted' ${timeCondition}
                GROUP BY mentor_id
                ORDER BY conversation_count DESC
                LIMIT 5`,
                [userId]
            );

            const result = {
                ...stats,
                avg_rating: stats.avg_rating ? parseFloat(stats.avg_rating.toFixed(2)) : null,
                top_mentors: topMentors
            };

            // 缓存1小时
            if (this.cache) {
                await this.cache.setex(cacheKey, 3600, JSON.stringify(result));
            }

            return result;
        } catch (error) {
            console.error('获取对话统计失败:', error);
            throw new Error(`Failed to get conversation stats: ${error.message}`);
        }
    }

    /**
     * 搜索对话内容
     */
    async searchConversations(userId, searchTerm, options = {}) {
        const { limit = 20, offset = 0 } = options;

        try {
            const query = `
                SELECT DISTINCT c.id, c.title, c.mentor_name, c.created_at, 
                       c.message_count, c.is_favorite
                FROM conversations c
                LEFT JOIN conversation_messages m ON c.id = m.conversation_id
                WHERE c.user_id = ? AND c.status != 'deleted' 
                AND (c.title LIKE ? OR m.content LIKE ?)
                ORDER BY c.updated_at DESC 
                LIMIT ? OFFSET ?
            `;
            
            const results = await this.db.all(query, [
                userId, `%${searchTerm}%`, `%${searchTerm}%`, limit, offset
            ]);
            
            return results.map(row => ({
                ...row,
                is_favorite: Boolean(row.is_favorite)
            }));
        } catch (error) {
            console.error('搜索对话失败:', error);
            throw new Error(`Failed to search conversations: ${error.message}`);
        }
    }

    // 私有方法
    async _cacheConversation(conversation) {
        // 缓存实现
        if (this.cache) {
            const cacheKey = `conversation:${conversation.id}`;
            await this.cache.set(cacheKey, JSON.stringify(conversation));
        }
    }

    async _invalidateConversationCache(conversationId) {
        // 缓存失效实现
        if (this.cache) {
            await this.cache.del(`conversation:${conversationId}`);
        }
    }

    _getTimeCondition(timeRange) {
        const now = new Date();
        let date;
        
        switch (timeRange) {
            case '7d':
                date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                date = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '365d':
                date = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                return '';
        }
        
        return `AND created_at >= '${date.toISOString()}'`;
    }
}

module.exports = ConversationStorageService; 