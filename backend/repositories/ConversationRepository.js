/**
 * 对话数据访问层 - Repository模式
 * 
 * 职责：
 * - 数据库查询操作
 * - SQL语句管理
 * - 数据映射转换
 * - 事务管理
 */

const DatabaseManager = require('../utils/DatabaseManager');

class ConversationRepository {
    constructor() {
        this.db = DatabaseManager.getInstance();
    }

    /**
     * 创建新对话
     * @param {Object} conversationData - 对话数据
     * @returns {Object} 创建的对话对象
     */
    async create(conversationData) {
        const sql = `
            INSERT INTO conversations (
                uuid, user_id, title, description, mode,
                primary_mentor_id, primary_mentor_name, mentors,
                status, metadata, tags
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING *
        `;

        const values = [
            conversationData.uuid,
            conversationData.user_id,
            conversationData.title,
            conversationData.description || '',
            conversationData.mode || 'single',
            conversationData.primary_mentor_id,
            conversationData.primary_mentor_name,
            conversationData.mentors,
            conversationData.status || 'active',
            conversationData.metadata || '{}',
            conversationData.tags || []
        ];

        try {
            const result = await this.db.query(sql, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`创建对话失败: ${error.message}`);
        }
    }

    /**
     * 根据ID查找对话
     * @param {number} id - 对话ID
     * @returns {Object|null} 对话对象
     */
    async findById(id) {
        const sql = `
            SELECT c.*, u.username, u.email
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1 AND c.deleted_at IS NULL
        `;

        try {
            const result = await this.db.query(sql, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`查找对话失败: ${error.message}`);
        }
    }

    /**
     * 根据UUID查找对话
     * @param {string} uuid - 对话UUID
     * @returns {Object|null} 对话对象
     */
    async findByUuid(uuid) {
        const sql = `
            SELECT c.*, u.username, u.email
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            WHERE c.uuid = $1 AND c.deleted_at IS NULL
        `;

        try {
            const result = await this.db.query(sql, [uuid]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`查找对话失败: ${error.message}`);
        }
    }

    /**
     * 查找用户的对话列表
     * @param {Object} options - 查询选项
     * @returns {Object} 查询结果和总数
     */
    async findByUser(options) {
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
        } = options;

        // 构建WHERE条件
        const conditions = ['c.user_id = $1', 'c.deleted_at IS NULL'];
        const values = [userId];
        let paramCount = 1;

        // 搜索条件
        if (search) {
            paramCount++;
            conditions.push(`(
                c.search_vector @@ plainto_tsquery('chinese', $${paramCount}) OR
                c.title ILIKE $${paramCount + 1} OR
                c.description ILIKE $${paramCount + 1}
            )`);
            values.push(search, `%${search}%`);
            paramCount++;
        }

        // 导师筛选
        if (mentor) {
            paramCount++;
            conditions.push(`c.primary_mentor_id = $${paramCount}`);
            values.push(mentor);
        }

        // 状态筛选
        if (status) {
            paramCount++;
            conditions.push(`c.status = $${paramCount}`);
            values.push(status);
        }

        // 标签筛选
        if (tags && tags.length > 0) {
            paramCount++;
            conditions.push(`c.tags && $${paramCount}`);
            values.push(tags);
        }

        // 日期范围筛选
        if (dateFrom) {
            paramCount++;
            conditions.push(`c.created_at >= $${paramCount}`);
            values.push(dateFrom);
        }

        if (dateTo) {
            paramCount++;
            conditions.push(`c.created_at <= $${paramCount}`);
            values.push(dateTo);
        }

        const whereClause = conditions.join(' AND ');

        // 验证排序字段
        const allowedSortFields = [
            'created_at', 'updated_at', 'last_activity_at', 
            'last_message_at', 'title', 'message_count'
        ];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'last_activity_at';
        const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        // 查询总数
        const countSql = `
            SELECT COUNT(*) as total
            FROM conversations c
            WHERE ${whereClause}
        `;

        // 查询数据
        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT 
                c.*,
                EXTRACT(EPOCH FROM (c.last_message_at - c.first_message_at)) as duration_seconds
            FROM conversations c
            WHERE ${whereClause}
            ORDER BY c.${safeSortBy} ${safeSortOrder}
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        try {
            // 执行查询
            const [countResult, dataResult] = await Promise.all([
                this.db.query(countSql, values),
                this.db.query(dataSql, [...values, limit, offset])
            ]);

            return {
                conversations: dataResult.rows,
                total: parseInt(countResult.rows[0].total)
            };

        } catch (error) {
            throw new Error(`查询用户对话列表失败: ${error.message}`);
        }
    }

    /**
     * 更新对话
     * @param {number} id - 对话ID
     * @param {Object} updateData - 更新数据
     * @returns {Object} 更新后的对话
     */
    async update(id, updateData) {
        const fields = [];
        const values = [];
        let paramCount = 0;

        // 构建动态更新字段
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                paramCount++;
                fields.push(`${key} = $${paramCount}`);
                values.push(updateData[key]);
            }
        });

        if (fields.length === 0) {
            throw new Error('没有提供更新字段');
        }

        paramCount++;
        values.push(id);

        const sql = `
            UPDATE conversations 
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount} AND deleted_at IS NULL
            RETURNING *
        `;

        try {
            const result = await this.db.query(sql, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`更新对话失败: ${error.message}`);
        }
    }

    /**
     * 软删除对话
     * @param {number} id - 对话ID
     * @returns {boolean} 删除是否成功
     */
    async softDelete(id) {
        const sql = `
            UPDATE conversations 
            SET deleted_at = CURRENT_TIMESTAMP, status = 'deleted'
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING id
        `;

        try {
            const result = await this.db.query(sql, [id]);
            return result.rows.length > 0;
        } catch (error) {
            throw new Error(`软删除对话失败: ${error.message}`);
        }
    }

    /**
     * 硬删除对话（谨慎使用）
     * @param {number} id - 对话ID
     * @returns {boolean} 删除是否成功
     */
    async hardDelete(id) {
        const client = await this.db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // 删除消息
            await client.query(
                'DELETE FROM conversation_messages WHERE conversation_id = $1',
                [id]
            );
            
            // 删除对话
            const result = await client.query(
                'DELETE FROM conversations WHERE id = $1 RETURNING id',
                [id]
            );
            
            await client.query('COMMIT');
            return result.rows.length > 0;
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw new Error(`硬删除对话失败: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * 更新最后活动时间
     * @param {number} id - 对话ID
     * @returns {boolean} 更新是否成功
     */
    async updateLastActivity(id) {
        const sql = `
            UPDATE conversations 
            SET last_activity_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND deleted_at IS NULL
        `;

        try {
            const result = await this.db.query(sql, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`更新最后活动时间失败: ${error.message}`);
        }
    }

    /**
     * 批量更新对话状态
     * @param {Array} ids - 对话ID数组
     * @param {string} status - 新状态
     * @returns {number} 更新的记录数
     */
    async batchUpdateStatus(ids, status) {
        if (!ids || ids.length === 0) {
            return 0;
        }

        const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
        const sql = `
            UPDATE conversations 
            SET status = $${ids.length + 1}, updated_at = CURRENT_TIMESTAMP
            WHERE id IN (${placeholders}) AND deleted_at IS NULL
        `;

        try {
            const result = await this.db.query(sql, [...ids, status]);
            return result.rowCount;
        } catch (error) {
            throw new Error(`批量更新对话状态失败: ${error.message}`);
        }
    }

    /**
     * 获取用户统计信息
     * @param {number} userId - 用户ID
     * @returns {Object} 统计信息
     */
    async getUserStatistics(userId) {
        const sql = `
            SELECT 
                COUNT(*) as total_conversations,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_conversations,
                COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_conversations,
                COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorite_conversations,
                COALESCE(SUM(message_count), 0) as total_messages,
                COALESCE(SUM(total_tokens), 0) as total_tokens,
                AVG(satisfaction_rating) as avg_satisfaction_rating,
                MIN(created_at) as first_conversation_date,
                MAX(last_activity_at) as last_activity_date
            FROM conversations 
            WHERE user_id = $1 AND deleted_at IS NULL
        `;

        try {
            const result = await this.db.query(sql, [userId]);
            const stats = result.rows[0];
            
            // 处理空值和格式化
            return {
                basicStats: {
                    total_conversations: parseInt(stats.total_conversations) || 0,
                    active_conversations: parseInt(stats.active_conversations) || 0,
                    completed_conversations: parseInt(stats.completed_conversations) || 0,
                    archived_conversations: parseInt(stats.archived_conversations) || 0,
                    favorite_conversations: parseInt(stats.favorite_conversations) || 0,
                    total_messages: parseInt(stats.total_messages) || 0,
                    total_tokens: parseInt(stats.total_tokens) || 0,
                    avg_satisfaction_rating: parseFloat(stats.avg_satisfaction_rating) || null,
                    first_conversation_date: stats.first_conversation_date,
                    last_activity_date: stats.last_activity_date
                }
            };

        } catch (error) {
            throw new Error(`获取用户统计信息失败: ${error.message}`);
        }
    }

    /**
     * 获取对话统计信息
     * @param {number} conversationId - 对话ID
     * @returns {Object} 对话统计信息
     */
    async getConversationStatistics(conversationId) {
        const sql = `
            SELECT 
                c.id,
                c.message_count,
                c.total_tokens,
                c.session_duration,
                c.satisfaction_rating,
                EXTRACT(EPOCH FROM (c.last_message_at - c.first_message_at)) as conversation_duration_seconds,
                
                -- 消息类型统计
                COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages,
                COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as assistant_messages,
                COUNT(CASE WHEN m.role = 'system' THEN 1 END) as system_messages,
                
                -- 令牌统计
                SUM(m.total_tokens) as actual_total_tokens,
                SUM(m.prompt_tokens) as total_prompt_tokens,
                SUM(m.completion_tokens) as total_completion_tokens,
                
                -- 时间统计
                AVG(m.processing_time_ms) as avg_processing_time,
                AVG(m.response_time_ms) as avg_response_time,
                MAX(m.processing_time_ms) as max_processing_time,
                MIN(m.processing_time_ms) as min_processing_time,
                
                -- 内容统计
                AVG(LENGTH(m.content)) as avg_message_length,
                MAX(LENGTH(m.content)) as max_message_length,
                SUM(LENGTH(m.content)) as total_characters
                
            FROM conversations c
            LEFT JOIN conversation_messages m ON c.id = m.conversation_id AND m.deleted_at IS NULL
            WHERE c.id = $1 AND c.deleted_at IS NULL
            GROUP BY c.id
        `;

        try {
            const result = await this.db.query(sql, [conversationId]);
            const stats = result.rows[0];
            
            if (!stats) {
                throw new Error('对话不存在');
            }
            
            return {
                conversationId: stats.id,
                messageCount: parseInt(stats.message_count) || 0,
                totalTokens: parseInt(stats.total_tokens) || 0,
                sessionDuration: parseInt(stats.session_duration) || 0,
                satisfactionRating: stats.satisfaction_rating,
                conversationDuration: parseFloat(stats.conversation_duration_seconds) || 0,
                messageStats: {
                    user: parseInt(stats.user_messages) || 0,
                    assistant: parseInt(stats.assistant_messages) || 0,
                    system: parseInt(stats.system_messages) || 0
                },
                tokenStats: {
                    total: parseInt(stats.actual_total_tokens) || 0,
                    prompt: parseInt(stats.total_prompt_tokens) || 0,
                    completion: parseInt(stats.total_completion_tokens) || 0
                },
                performanceStats: {
                    avgProcessingTime: parseFloat(stats.avg_processing_time) || 0,
                    avgResponseTime: parseFloat(stats.avg_response_time) || 0,
                    maxProcessingTime: parseInt(stats.max_processing_time) || 0,
                    minProcessingTime: parseInt(stats.min_processing_time) || 0
                },
                contentStats: {
                    avgMessageLength: parseFloat(stats.avg_message_length) || 0,
                    maxMessageLength: parseInt(stats.max_message_length) || 0,
                    totalCharacters: parseInt(stats.total_characters) || 0
                }
            };

        } catch (error) {
            throw new Error(`获取对话统计信息失败: ${error.message}`);
        }
    }

    /**
     * 搜索对话（全文搜索）
     * @param {Object} params - 搜索参数
     * @returns {Object} 搜索结果
     */
    async search(params) {
        const {
            userId,
            query,
            filters = {},
            page = 1,
            limit = 20
        } = params;

        const conditions = ['c.user_id = $1', 'c.deleted_at IS NULL'];
        const values = [userId];
        let paramCount = 1;

        // 全文搜索
        if (query) {
            paramCount++;
            conditions.push(`(
                c.search_vector @@ plainto_tsquery('chinese', $${paramCount}) OR
                EXISTS (
                    SELECT 1 FROM conversation_messages m 
                    WHERE m.conversation_id = c.id 
                    AND m.content ILIKE $${paramCount + 1}
                    AND m.deleted_at IS NULL
                )
            )`);
            values.push(query, `%${query}%`);
            paramCount++;
        }

        // 添加其他筛选条件
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null) {
                paramCount++;
                conditions.push(`c.${key} = $${paramCount}`);
                values.push(filters[key]);
            }
        });

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        // 使用相关性排序
        const sql = `
            SELECT 
                c.*,
                ts_rank(c.search_vector, plainto_tsquery('chinese', $2)) as relevance_score
            FROM conversations c
            WHERE ${whereClause}
            ORDER BY 
                CASE WHEN $2 IS NOT NULL THEN ts_rank(c.search_vector, plainto_tsquery('chinese', $2)) END DESC NULLS LAST,
                c.last_activity_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        const countSql = `
            SELECT COUNT(*) as total
            FROM conversations c
            WHERE ${whereClause}
        `;

        try {
            const [dataResult, countResult] = await Promise.all([
                this.db.query(sql, [...values, limit, offset]),
                this.db.query(countSql, values)
            ]);

            return {
                conversations: dataResult.rows,
                total: parseInt(countResult.rows[0].total),
                page,
                limit
            };

        } catch (error) {
            throw new Error(`搜索对话失败: ${error.message}`);
        }
    }

    /**
     * 获取热门标签
     * @param {number} userId - 用户ID（可选）
     * @param {number} limit - 限制数量
     * @returns {Array} 标签列表
     */
    async getPopularTags(userId = null, limit = 20) {
        let sql, values;

        if (userId) {
            sql = `
                SELECT 
                    unnest(tags) as tag_name,
                    COUNT(*) as usage_count
                FROM conversations
                WHERE user_id = $1 AND deleted_at IS NULL AND tags IS NOT NULL
                GROUP BY unnest(tags)
                ORDER BY usage_count DESC
                LIMIT $2
            `;
            values = [userId, limit];
        } else {
            sql = `
                SELECT 
                    unnest(tags) as tag_name,
                    COUNT(*) as usage_count
                FROM conversations
                WHERE deleted_at IS NULL AND tags IS NOT NULL
                GROUP BY unnest(tags)
                ORDER BY usage_count DESC
                LIMIT $1
            `;
            values = [limit];
        }

        try {
            const result = await this.db.query(sql, values);
            return result.rows;
        } catch (error) {
            throw new Error(`获取热门标签失败: ${error.message}`);
        }
    }

    /**
     * 清理过期的已删除记录
     * @param {number} daysOld - 删除多少天前的记录
     * @returns {number} 清理的记录数
     */
    async cleanupDeletedRecords(daysOld = 30) {
        const sql = `
            DELETE FROM conversations 
            WHERE deleted_at IS NOT NULL 
            AND deleted_at < NOW() - INTERVAL '${daysOld} days'
            RETURNING id
        `;

        try {
            const result = await this.db.query(sql);
            return result.rowCount;
        } catch (error) {
            throw new Error(`清理过期记录失败: ${error.message}`);
        }
    }
}

module.exports = ConversationRepository; 