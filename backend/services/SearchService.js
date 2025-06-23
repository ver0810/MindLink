/**
 * 搜索服务
 * 提供对话和消息的搜索功能
 */

const DatabaseManager = require('../utils/DatabaseManager');

class SearchService {
    constructor() {
        this.db = DatabaseManager.getInstance();
    }

    /**
     * 搜索对话
     * @param {Object} params - 搜索参数
     * @returns {Object} 搜索结果
     */
    async searchConversations(params) {
        const {
            userId,
            query,
            mentorId,
            tags,
            dateFrom,
            dateTo,
            status,
            page = 1,
            limit = 20
        } = params;

        // 构建搜索条件
        const conditions = ['c.user_id = $1', 'c.deleted_at IS NULL'];
        const values = [userId];
        let paramCount = 1;

        // 关键词搜索
        if (query && query.trim()) {
            paramCount++;
            conditions.push(`(
                c.search_vector @@ plainto_tsquery('chinese', $${paramCount}) OR
                c.title ILIKE $${paramCount + 1} OR
                c.description ILIKE $${paramCount + 1}
            )`);
            values.push(query.trim(), `%${query.trim()}%`);
            paramCount++;
        }

        // 导师筛选
        if (mentorId) {
            paramCount++;
            conditions.push(`c.primary_mentor_id = $${paramCount}`);
            values.push(mentorId);
        }

        // 标签筛选
        if (tags && tags.length > 0) {
            paramCount++;
            conditions.push(`c.tags && $${paramCount}`);
            values.push(tags);
        }

        // 状态筛选
        if (status) {
            paramCount++;
            conditions.push(`c.status = $${paramCount}`);
            values.push(status);
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
        const offset = (page - 1) * limit;

        try {
            // 查询总数
            const countSql = `
                SELECT COUNT(*) as total
                FROM conversations c
                WHERE ${whereClause}
            `;

            // 查询数据
            const dataSql = `
                SELECT 
                    c.id,
                    c.uuid,
                    c.title,
                    c.description,
                    c.mode,
                    c.primary_mentor_id,
                    c.primary_mentor_name,
                    c.status,
                    c.tags,
                    c.created_at,
                    c.updated_at,
                    c.last_message_at,
                    c.message_count
                FROM conversations c
                WHERE ${whereClause}
                ORDER BY 
                    CASE 
                        WHEN $${paramCount + 3} IS NOT NULL THEN 
                            ts_rank(c.search_vector, plainto_tsquery('chinese', $${paramCount + 3}))
                        ELSE 0
                    END DESC,
                    c.last_message_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            values.push(limit, offset, query?.trim() || null);

            const [countResult, dataResult] = await Promise.all([
                this.db.query(countSql, values.slice(0, -3)),
                this.db.query(dataSql, values)
            ]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / limit);

            return {
                conversations: dataResult.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };

        } catch (error) {
            throw new Error(`搜索对话失败: ${error.message}`);
        }
    }

    /**
     * 搜索消息
     * @param {Object} params - 搜索参数
     * @returns {Object} 搜索结果
     */
    async searchMessages(params) {
        const {
            userId,
            query,
            conversationId,
            senderType,
            messageType,
            dateFrom,
            dateTo,
            page = 1,
            limit = 50
        } = params;

        // 构建搜索条件
        const conditions = [];
        const values = [];
        let paramCount = 0;

        // 如果指定了conversationId，直接搜索该对话
        if (conversationId) {
            paramCount++;
            conditions.push(`m.conversation_id = $${paramCount}`);
            values.push(conversationId);
        } else if (userId) {
            // 否则搜索用户的所有对话
            paramCount++;
            conditions.push(`m.conversation_id IN (
                SELECT id FROM conversations 
                WHERE user_id = $${paramCount} AND deleted_at IS NULL
            )`);
            values.push(userId);
        }

        // 关键词搜索
        if (query && query.trim()) {
            paramCount++;
            conditions.push(`m.content ILIKE $${paramCount}`);
            values.push(`%${query.trim()}%`);
        }

        // 发送者类型筛选
        if (senderType) {
            paramCount++;
            conditions.push(`m.sender_type = $${paramCount}`);
            values.push(senderType);
        }

        // 消息类型筛选
        if (messageType) {
            paramCount++;
            conditions.push(`m.message_type = $${paramCount}`);
            values.push(messageType);
        }

        // 日期范围筛选
        if (dateFrom) {
            paramCount++;
            conditions.push(`m.created_at >= $${paramCount}`);
            values.push(dateFrom);
        }

        if (dateTo) {
            paramCount++;
            conditions.push(`m.created_at <= $${paramCount}`);
            values.push(dateTo);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const offset = (page - 1) * limit;

        try {
            // 查询总数
            const countSql = `
                SELECT COUNT(*) as total
                FROM messages m
                ${whereClause}
            `;

            // 查询数据
            const dataSql = `
                SELECT 
                    m.id,
                    m.conversation_id,
                    m.content,
                    m.sender_type,
                    m.sender_name,
                    m.message_type,
                    m.created_at,
                    c.title as conversation_title,
                    c.uuid as conversation_uuid
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                ${whereClause}
                ORDER BY m.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            values.push(limit, offset);

            const [countResult, dataResult] = await Promise.all([
                this.db.query(countSql, values.slice(0, -2)),
                this.db.query(dataSql, values)
            ]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / limit);

            return {
                messages: dataResult.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };

        } catch (error) {
            throw new Error(`搜索消息失败: ${error.message}`);
        }
    }

    /**
     * 全文搜索
     * @param {Object} params - 搜索参数
     * @returns {Object} 搜索结果
     */
    async fullTextSearch(params) {
        const {
            userId,
            query,
            searchType = 'all', // 'conversations', 'messages', 'all'
            page = 1,
            limit = 20
        } = params;

        if (!query || !query.trim()) {
            return {
                conversations: [],
                messages: [],
                pagination: {
                    page: 1,
                    limit,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        const results = {};

        try {
            if (searchType === 'conversations' || searchType === 'all') {
                results.conversations = await this.searchConversations({
                    userId,
                    query,
                    page,
                    limit: searchType === 'all' ? Math.floor(limit / 2) : limit
                });
            }

            if (searchType === 'messages' || searchType === 'all') {
                results.messages = await this.searchMessages({
                    userId,
                    query,
                    page,
                    limit: searchType === 'all' ? Math.floor(limit / 2) : limit
                });
            }

            return results;

        } catch (error) {
            throw new Error(`全文搜索失败: ${error.message}`);
        }
    }

    /**
     * 获取搜索建议
     * @param {Object} params - 参数
     * @returns {Array} 建议列表
     */
    async getSearchSuggestions(params) {
        const { userId, query, limit = 10 } = params;

        if (!query || query.trim().length < 2) {
            return [];
        }

        try {
            const sql = `
                SELECT DISTINCT title
                FROM conversations
                WHERE user_id = $1 
                    AND title ILIKE $2 
                    AND deleted_at IS NULL
                ORDER BY title
                LIMIT $3
            `;

            const result = await this.db.query(sql, [
                userId,
                `%${query.trim()}%`,
                limit
            ]);

            return result.rows.map(row => row.title);

        } catch (error) {
            throw new Error(`获取搜索建议失败: ${error.message}`);
        }
    }

    /**
     * 获取热门搜索关键词
     * @param {Object} params - 参数
     * @returns {Array} 热门关键词
     */
    async getPopularKeywords(params) {
        const { userId, limit = 10 } = params;

        try {
            const sql = `
                SELECT 
                    unnest(tags) as tag,
                    COUNT(*) as count
                FROM conversations
                WHERE user_id = $1 
                    AND deleted_at IS NULL
                    AND array_length(tags, 1) > 0
                GROUP BY tag
                ORDER BY count DESC
                LIMIT $2
            `;

            const result = await this.db.query(sql, [userId, limit]);

            return result.rows.map(row => ({
                keyword: row.tag,
                count: parseInt(row.count)
            }));

        } catch (error) {
            throw new Error(`获取热门关键词失败: ${error.message}`);
        }
    }
}

// 单例实例
let instance = null;

/**
 * 获取搜索服务实例
 * @returns {SearchService} 搜索服务实例
 */
function getInstance() {
    if (!instance) {
        instance = new SearchService();
    }
    return instance;
}

module.exports = {
    SearchService,
    getInstance
}; 