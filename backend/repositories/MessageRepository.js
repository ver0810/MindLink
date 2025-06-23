/**
 * 消息数据访问层 - Repository模式
 * 
 * 职责：
 * - 消息的CRUD操作
 * - 消息历史查询
 * - 消息统计
 */

const DatabaseManager = require('../utils/DatabaseManager');

class MessageRepository {
    constructor() {
        this.db = DatabaseManager.getInstance();
    }

    /**
     * 创建新消息
     * @param {Object} messageData - 消息数据
     * @returns {Object} 创建的消息对象
     */
    async create(messageData) {
        const sql = `
            INSERT INTO conversation_messages (
                uuid, conversation_id, role, content, content_type,
                message_order, mentor_id, mentor_name, total_tokens,
                completion_tokens, prompt_tokens, model_used,
                processing_time_ms, response_time_ms, attachments, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;

        const values = [
            messageData.uuid,
            messageData.conversation_id,
            messageData.role || 'user',
            messageData.content,
            messageData.content_type || 'text',
            messageData.message_order || 1,
            messageData.mentor_id,
            messageData.mentor_name,
            messageData.total_tokens || 0,
            messageData.completion_tokens || 0,
            messageData.prompt_tokens || 0,
            messageData.model_used,
            messageData.processing_time_ms || 0,
            messageData.response_time_ms || 0,
            messageData.attachments || '[]',
            messageData.metadata || '{}'
        ];

        try {
            const result = await this.db.query(sql, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`创建消息失败: ${error.message}`);
        }
    }

    /**
     * 批量创建消息
     * @param {Array} messages - 消息数组
     * @returns {Array} 创建的消息数组
     */
    async createBatch(messages) {
        if (!Array.isArray(messages) || messages.length === 0) {
            return [];
        }

        const client = await this.db.getClient();
        
        try {
            await client.query('BEGIN');
            
            const results = [];
            for (const messageData of messages) {
                const sql = `
                    INSERT INTO conversation_messages (
                        uuid, conversation_id, role, content, content_type,
                        message_order, mentor_id, mentor_name, total_tokens,
                        completion_tokens, prompt_tokens, model_used,
                        processing_time_ms, response_time_ms, attachments, metadata
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    RETURNING *
                `;

                const values = [
                    messageData.uuid,
                    messageData.conversation_id,
                    messageData.role || 'user',
                    messageData.content,
                    messageData.content_type || 'text',
                    messageData.message_order || 1,
                    messageData.mentor_id,
                    messageData.mentor_name,
                    messageData.total_tokens || 0,
                    messageData.completion_tokens || 0,
                    messageData.prompt_tokens || 0,
                    messageData.model_used,
                    messageData.processing_time_ms || 0,
                    messageData.response_time_ms || 0,
                    messageData.attachments || '[]',
                    messageData.metadata || '{}'
                ];

                const result = await client.query(sql, values);
                results.push(result.rows[0]);
            }

            await client.query('COMMIT');
            return results;

        } catch (error) {
            await client.query('ROLLBACK');
            throw new Error(`批量创建消息失败: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * 根据对话ID获取消息列表
     * @param {number} conversationId - 对话ID
     * @param {Object} options - 查询选项
     * @returns {Array} 消息列表
     */
    async findByConversationId(conversationId, options = {}) {
        const { 
            page = 1, 
            limit = 50, 
            sortBy = 'created_at', 
            sortOrder = 'ASC',
            messageType 
        } = options;

        let conditions = ['conversation_id = $1'];
        let values = [conversationId];
        let paramCount = 1;

        // 消息类型筛选
        if (messageType) {
            paramCount++;
            conditions.push(`content_type = $${paramCount}`);
            values.push(messageType);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        // 验证排序字段
        const allowedSortFields = ['created_at', 'updated_at', 'id'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        const sql = `
            SELECT 
                id, uuid, conversation_id, role, content, content_type,
                message_order, mentor_id, mentor_name, total_tokens,
                completion_tokens, prompt_tokens, model_used,
                processing_time_ms, response_time_ms, attachments,
                metadata, created_at, updated_at, is_edited
            FROM conversation_messages
            WHERE ${whereClause}
            ORDER BY ${safeSortBy} ${safeSortOrder}
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        values.push(limit, offset);

        try {
            const result = await this.db.query(sql, values);
            return result.rows;
        } catch (error) {
            throw new Error(`查询消息失败: ${error.message}`);
        }
    }

    /**
     * 获取对话消息统计
     * @param {number} conversationId - 对话ID
     * @returns {Object} 统计信息
     */
    async getStatistics(conversationId) {
        const sql = `
            SELECT 
                COUNT(*) as total_count,
                COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
                COUNT(CASE WHEN role = 'assistant' THEN 1 END) as assistant_count,
                MIN(created_at) as first_message_at,
                MAX(created_at) as last_message_at
            FROM conversation_messages
            WHERE conversation_id = $1
        `;

        try {
            const result = await this.db.query(sql, [conversationId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`获取消息统计失败: ${error.message}`);
        }
    }

    /**
     * 获取对话消息数量
     * @param {number} conversationId - 对话ID
     * @returns {number} 消息数量
     */
    async getMessageCount(conversationId) {
        const sql = `
            SELECT COUNT(*) as count
            FROM conversation_messages
            WHERE conversation_id = $1
        `;

        try {
            const result = await this.db.query(sql, [conversationId]);
            return parseInt(result.rows[0].count);
        } catch (error) {
            throw new Error(`获取消息数量失败: ${error.message}`);
        }
    }

    /**
     * 删除消息
     * @param {number} messageId - 消息ID
     * @returns {boolean} 删除结果
     */
    async delete(messageId) {
        const sql = `DELETE FROM conversation_messages WHERE id = $1`;

        try {
            const result = await this.db.query(sql, [messageId]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`删除消息失败: ${error.message}`);
        }
    }

    /**
     * 批量删除对话的所有消息
     * @param {number} conversationId - 对话ID
     * @returns {number} 删除的消息数量
     */
    async deleteByConversationId(conversationId) {
        const sql = `DELETE FROM conversation_messages WHERE conversation_id = $1`;

        try {
            const result = await this.db.query(sql, [conversationId]);
            return result.rowCount;
        } catch (error) {
            throw new Error(`删除对话消息失败: ${error.message}`);
        }
    }

    /**
     * 获取对话的最后一条消息
     * @param {number} conversationId - 对话ID
     * @returns {Object|null} 最后一条消息
     */
    async findLastMessage(conversationId) {
        const sql = `
            SELECT 
                id, uuid, conversation_id, role, content, content_type,
                message_order, mentor_id, mentor_name, total_tokens,
                completion_tokens, prompt_tokens, model_used,
                processing_time_ms, response_time_ms, attachments,
                metadata, created_at, updated_at, is_edited
            FROM conversation_messages
            WHERE conversation_id = $1
            ORDER BY message_order DESC, created_at DESC
            LIMIT 1
        `;

        try {
            const result = await this.db.query(sql, [conversationId]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`获取最后消息失败: ${error.message}`);
        }
    }

    /**
     * 更新消息
     * @param {number} messageId - 消息ID
     * @param {Object} updateData - 更新数据
     * @returns {Object} 更新后的消息
     */
    async update(messageId, updateData) {
        const allowedFields = ['content', 'metadata'];
        const updates = [];
        const values = [];
        let paramCount = 0;

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                paramCount++;
                updates.push(`${key} = $${paramCount}`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            throw new Error('没有可更新的字段');
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(messageId);

        const sql = `
            UPDATE conversation_messages 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount + 1}
            RETURNING *
        `;

        try {
            const result = await this.db.query(sql, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`更新消息失败: ${error.message}`);
        }
    }
}

module.exports = MessageRepository; 