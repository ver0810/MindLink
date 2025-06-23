const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * PostgreSQL数据库配置和管理
 * 专门为AI导师对话系统优化的PostgreSQL连接
 */
class PostgreSQLConfig {
    constructor() {
        this.pool = null;
        this.initialized = false;
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'ai_mentor_system',
            user: process.env.DB_USER || 'ai_mentor_user',
            password: process.env.DB_PASSWORD || 'ai_mentor_password_2024',
            
            // 连接池配置 - 针对对话系统优化
            max: 20,                    // 最大连接数
            idleTimeoutMillis: 30000,   // 空闲超时
            connectionTimeoutMillis: 5000, // 连接超时
            
            // PostgreSQL特定配置
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            application_name: 'ai_mentor_conversation_system',
            
            // 针对对话查询优化
            statement_timeout: 30000,    // 语句超时30秒
            query_timeout: 25000,       // 查询超时25秒
            idle_in_transaction_session_timeout: 60000 // 事务空闲超时
        };
    }

    /**
     * 初始化数据库连接池
     */
    async initialize() {
        if (this.initialized) {
            return true;
        }

        try {
            this.pool = new Pool(this.config);
            
            // 测试连接
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
            client.release();
            
            console.log('✅ PostgreSQL连接成功');
            console.log(`📅 服务器时间: ${result.rows[0].current_time}`);
            console.log(`🔧 PostgreSQL版本: ${result.rows[0].pg_version}`);
            
            // 设置连接池事件监听
            this.setupPoolEvents();
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ PostgreSQL连接失败:', error);
            this.pool = null;
            this.initialized = false;
            throw error;
        }
    }

    /**
     * 设置连接池事件监听
     */
    setupPoolEvents() {
        if (!this.pool) return;

        this.pool.on('connect', (client) => {
            console.log('🔗 新的PostgreSQL连接已建立');
        });

        this.pool.on('error', (err, client) => {
            console.error('❌ PostgreSQL连接池错误:', err);
        });

        this.pool.on('remove', (client) => {
            console.log('🔌 PostgreSQL连接已移除');
        });
    }

    /**
     * 获取数据库连接
     */
    async getConnection() {
        if (!this.pool) {
            await this.initialize();
        }
        return this.pool;
    }

    /**
     * 执行查询 - 针对对话查询优化
     */
    async query(text, params = []) {
        if (!this.pool) {
            console.error('❌ 数据库连接池未初始化');
            throw new Error('数据库连接池未初始化，请先启动PostgreSQL服务');
        }

        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            // 记录慢查询（超过1秒）
            if (duration > 1000) {
                console.warn(`🐌 慢查询检测 (${duration}ms):`, text.substring(0, 100));
            }
            
            console.log(`执行查询: ${JSON.stringify({ text: text.trim(), duration, rows: result.rowCount })}`);
            
            return result;
        } catch (error) {
            console.error('❌ 查询执行失败:', error);
            console.error('📝 查询语句:', text);
            console.error('📋 查询参数:', params);
            throw error;
        }
    }

    /**
     * 执行事务
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * 关闭连接池
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('✅ PostgreSQL连接池已关闭');
        }
    }

    /**
     * 检查数据库健康状态
     */
    async healthCheck() {
        try {
            const result = await this.query(`
                SELECT 
                    COUNT(*) as total_connections,
                    COUNT(CASE WHEN state = 'active' THEN 1 END) as active_connections,
                    COUNT(CASE WHEN state = 'idle' THEN 1 END) as idle_connections
                FROM pg_stat_activity 
                WHERE datname = $1
            `, [this.config.database]);

            const stats = result.rows[0];
            
            return {
                status: 'healthy',
                database: this.config.database,
                connections: {
                    total: parseInt(stats.total_connections),
                    active: parseInt(stats.active_connections),
                    idle: parseInt(stats.idle_connections)
                },
                pool: {
                    total: this.pool.totalCount,
                    idle: this.pool.idleCount,
                    waiting: this.pool.waitingCount
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 获取对话统计信息
     */
    async getConversationStats() {
        try {
            const result = await this.query(`
                SELECT 
                    COUNT(*) as total_conversations,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations,
                    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as conversations_today,
                    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as conversations_week,
                    SUM(message_count) as total_messages,
                    AVG(message_count) as avg_messages_per_conversation,
                    COUNT(DISTINCT user_id) as unique_users
                FROM conversations 
                WHERE deleted_at IS NULL
            `);

            return result.rows[0];
        } catch (error) {
            console.error('获取对话统计失败:', error);
            throw error;
        }
    }

    /**
     * 优化数据库性能
     */
    async optimizeDatabase() {
        try {
            console.log('🔧 开始数据库性能优化...');
            
            // 更新表统计信息
            await this.query('ANALYZE conversations');
            await this.query('ANALYZE conversation_messages');
            await this.query('ANALYZE users');
            
            // 重建索引（如果需要）
            await this.query('REINDEX INDEX CONCURRENTLY idx_conversations_user_activity');
            await this.query('REINDEX INDEX CONCURRENTLY idx_messages_conversation_id');
            
            console.log('✅ 数据库优化完成');
            return true;
        } catch (error) {
            console.error('❌ 数据库优化失败:', error);
            return false;
        }
    }

    /**
     * 导入导师数据
     */
    async importMentorData() {
        try {
            console.log('📥 开始导入导师数据...');
            
            // 读取导师数据文件
            const mentorsPath = path.join(__dirname, '../../assets/data/mentors.js');
            if (!fs.existsSync(mentorsPath)) {
                console.log('⚠️  导师数据文件不存在，跳过导入');
                return false;
            }

            // 动态导入导师数据
            delete require.cache[require.resolve(mentorsPath)];
            const { mentors } = require(mentorsPath);

            // 批量插入导师数据
            for (const mentor of mentors) {
                await this.query(`
                    INSERT INTO mentors (
                        id, name, title, avatar_url, short_bio, bio,
                        expertise, categories, featured, is_active,
                        display_order, suggested_questions, personality_config
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        title = EXCLUDED.title,
                        avatar_url = EXCLUDED.avatar_url,
                        short_bio = EXCLUDED.short_bio,
                        bio = EXCLUDED.bio,
                        expertise = EXCLUDED.expertise,
                        categories = EXCLUDED.categories,
                        featured = EXCLUDED.featured,
                        is_active = EXCLUDED.is_active,
                        display_order = EXCLUDED.display_order,
                        suggested_questions = EXCLUDED.suggested_questions,
                        personality_config = EXCLUDED.personality_config,
                        updated_at = CURRENT_TIMESTAMP
                `, [
                    mentor.id,
                    mentor.name,
                    mentor.title,
                    mentor.avatar,
                    mentor.shortBio,
                    mentor.bio,
                    mentor.expertise || [],
                    mentor.categories || [],
                    mentor.featured || false,
                    mentor.isActive !== false,
                    mentor.displayOrder || 0,
                    JSON.stringify(mentor.suggestedQuestions || []),
                    JSON.stringify(mentor.personalityConfig || {})
                ]);
            }

            console.log(`✅ 成功导入 ${mentors.length} 个导师数据`);
            return true;
        } catch (error) {
            console.error('❌ 导入导师数据失败:', error);
            return false;
        }
    }
}

/**
 * 数据库助手类 - 提供常用的对话查询方法
 */
class ConversationDatabaseHelper {
    constructor(pgConfig) {
        this.db = pgConfig;
    }

    /**
     * 获取用户的对话历史（分页）
     */
    async getUserConversationHistory(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            search = '',
            mentorId = '',
            status = '',
            sortBy = 'last_activity_at',
            sortOrder = 'DESC'
        } = options;

        const offset = (page - 1) * limit;
        
        let whereConditions = ['c.user_id = $1', 'c.deleted_at IS NULL'];
        let params = [userId];
        let paramIndex = 2;

        // 搜索条件
        if (search) {
            whereConditions.push(`(c.title ILIKE $${paramIndex} OR c.search_vector @@ plainto_tsquery($${paramIndex}))`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        // 导师筛选
        if (mentorId) {
            whereConditions.push(`c.primary_mentor_id = $${paramIndex}`);
            params.push(mentorId);
            paramIndex++;
        }

        // 状态筛选
        if (status) {
            whereConditions.push(`c.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // 查询总数
        const countQuery = `
            SELECT COUNT(*) as total
            FROM conversations c
            WHERE ${whereClause}
        `;

        // 查询数据
        const dataQuery = `
            SELECT 
                c.id,
                c.uuid,
                c.title,
                c.primary_mentor_id as mentor_id,
                c.primary_mentor_name as mentor_name,
                m.avatar_url as mentor_avatar,
                c.status,
                c.is_favorite,
                c.is_pinned,
                c.message_count,
                c.total_tokens,
                c.tags,
                c.satisfaction_rating,
                c.created_at,
                c.updated_at,
                c.last_activity_at,
                c.last_message_at,
                EXTRACT(EPOCH FROM (c.last_message_at - c.first_message_at)) as duration_seconds
            FROM conversations c
            LEFT JOIN mentors m ON c.primary_mentor_id = m.id
            WHERE ${whereClause}
            ORDER BY c.${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limit, offset);

        try {
            const [countResult, dataResult] = await Promise.all([
                this.db.query(countQuery, params.slice(0, -2)),
                this.db.query(dataQuery, params)
            ]);

            return {
                conversations: dataResult.rows,
                pagination: {
                    total: parseInt(countResult.rows[0].total),
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil(countResult.rows[0].total / limit)
                }
            };
        } catch (error) {
            console.error('获取用户对话历史失败:', error);
            throw error;
        }
    }

    /**
     * 获取对话详情和消息
     */
    async getConversationWithMessages(conversationId, userId) {
        try {
            // 获取对话基本信息
            const conversationQuery = `
                SELECT 
                    c.*,
                    m.name as mentor_name,
                    m.avatar_url as mentor_avatar,
                    u.username
                FROM conversations c
                LEFT JOIN mentors m ON c.primary_mentor_id = m.id
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.id = $1 AND c.user_id = $2 AND c.deleted_at IS NULL
            `;

            // 获取对话消息
            const messagesQuery = `
                SELECT 
                    id,
                    uuid,
                    role,
                    content,
                    content_type,
                    message_order,
                    mentor_id,
                    mentor_name,
                    model_used,
                    total_tokens,
                    user_rating,
                    is_helpful,
                    metadata,
                    created_at,
                    updated_at
                FROM conversation_messages
                WHERE conversation_id = $1 AND deleted_at IS NULL
                ORDER BY message_order ASC
            `;

            const [conversationResult, messagesResult] = await Promise.all([
                this.db.query(conversationQuery, [conversationId, userId]),
                this.db.query(messagesQuery, [conversationId])
            ]);

            if (conversationResult.rows.length === 0) {
                return null;
            }

            const conversation = conversationResult.rows[0];
            conversation.messages = messagesResult.rows;

            return conversation;
        } catch (error) {
            console.error('获取对话详情失败:', error);
            throw error;
        }
    }

    /**
     * 更新对话活动时间
     */
    async updateConversationActivity(conversationId) {
        try {
            await this.db.query(`
                UPDATE conversations 
                SET last_activity_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [conversationId]);
        } catch (error) {
            console.error('更新对话活动时间失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户最近的对话
     */
    async getUserRecentConversations(userId, limit = 5) {
        try {
            const result = await this.db.query(`
                SELECT 
                    c.id,
                    c.uuid,
                    c.title,
                    c.primary_mentor_name as mentor_name,
                    m.avatar_url as mentor_avatar,
                    c.last_activity_at,
                    c.message_count
                FROM conversations c
                LEFT JOIN mentors m ON c.primary_mentor_id = m.id
                WHERE c.user_id = $1 AND c.deleted_at IS NULL
                ORDER BY c.last_activity_at DESC
                LIMIT $2
            `, [userId, limit]);

            return result.rows;
        } catch (error) {
            console.error('获取用户最近对话失败:', error);
            throw error;
        }
    }
}

// 创建全局实例
const pgConfig = new PostgreSQLConfig();
const conversationHelper = new ConversationDatabaseHelper(pgConfig);

module.exports = {
    PostgreSQLConfig,
    ConversationDatabaseHelper,
    pgConfig,
    conversationHelper
}; 