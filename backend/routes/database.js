const express = require('express');
const router = express.Router();
// 使用PostgreSQL配置而不是SQLite
const { pgConfig } = require('../config/postgresql');

// 获取数据库统计信息
router.get('/stats', async (req, res) => {
    try {
        // 获取用户统计
        const userStats = await pgConfig.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
                COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users
            FROM users
        `);

        // 获取会话统计
        const sessionStats = await pgConfig.query(`
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_sessions,
                COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_sessions
            FROM user_sessions
        `);

        // 获取最近注册用户（过去7天）
        const recentUsers = await pgConfig.query(`
            SELECT COUNT(*) as recent_registrations
            FROM users 
            WHERE created_at >= NOW() - INTERVAL '7 days'
        `);

        // 获取每日注册统计（过去30天）
        const dailyRegistrations = await pgConfig.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM users 
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        `);

        // 获取用户状态分布
        const userStatusDistribution = await pgConfig.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM users
            GROUP BY status
        `);

        // 获取对话统计
        const conversationStats = await pgConfig.query(`
            SELECT 
                COUNT(*) as total_conversations,
                COUNT(CASE WHEN message_count > 0 THEN 1 END) as active_conversations,
                SUM(message_count) as total_messages
            FROM conversations
            WHERE deleted_at IS NULL
        `);

        res.json({
            success: true,
            data: {
                userStats: userStats.rows[0],
                sessionStats: sessionStats.rows[0],
                recentUsers: recentUsers.rows[0],
                conversationStats: conversationStats.rows[0],
                dailyRegistrations: dailyRegistrations.rows,
                userStatusDistribution: userStatusDistribution.rows
            }
        });
    } catch (error) {
        console.error('获取数据库统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取数据库统计失败'
        });
    }
});

// 获取用户列表
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const users = await pgConfig.query(`
            SELECT 
                id,
                username,
                email,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const totalCount = await pgConfig.query('SELECT COUNT(*) as count FROM users');

        res.json({
            success: true,
            data: {
                users: users.rows,
                pagination: {
                    page,
                    limit,
                    total: totalCount.rows[0].count,
                    totalPages: Math.ceil(totalCount.rows[0].count / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
});

// 获取会话列表
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await pgConfig.query(`
            SELECT 
                s.id,
                s.user_id,
                u.username,
                u.email,
                s.expires_at,
                s.created_at,
                CASE 
                    WHEN s.expires_at > NOW() THEN 'active'
                    ELSE 'expired'
                END as status
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
            LIMIT 50
        `);

        res.json({
            success: true,
            data: { sessions: sessions.rows }
        });
    } catch (error) {
        console.error('获取会话列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取会话列表失败'
        });
    }
});

// 获取所有用户的对话记录
router.get('/conversations', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const userId = req.query.userId || '';

        let whereClause = 'WHERE c.deleted_at IS NULL';
        let queryParams = [limit, offset];
        let paramIndex = 3;

        if (search) {
            whereClause += ` AND (c.title ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (userId) {
            whereClause += ` AND c.user_id = $${paramIndex}`;
            queryParams.push(userId);
            paramIndex++;
        }

        const conversations = await pgConfig.query(`
            SELECT 
                c.id,
                c.title,
                c.mode,
                c.primary_mentor_name,
                c.message_count,
                c.created_at,
                c.updated_at,
                u.id as user_id,
                u.username,
                u.email
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            ${whereClause}
            ORDER BY c.updated_at DESC
            LIMIT $1 OFFSET $2
        `, queryParams);

        // 获取总数
        const totalQuery = `
            SELECT COUNT(*) as count
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            ${whereClause}
        `;
        const totalParams = queryParams.slice(2); // 移除limit和offset参数
        const totalCount = await pgConfig.query(totalQuery, totalParams);

        res.json({
            success: true,
            data: {
                conversations: conversations.rows,
                pagination: {
                    page,
                    limit,
                    total: parseInt(totalCount.rows[0].count),
                    totalPages: Math.ceil(totalCount.rows[0].count / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取对话记录失败:', error);
        res.status(500).json({
            success: false,
            message: '获取对话记录失败'
        });
    }
});

// 获取特定对话的详细消息
router.get('/conversations/:id/messages', async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        
        if (!conversationId) {
            return res.status(400).json({
                success: false,
                message: '无效的对话ID'
            });
        }

        // 获取对话基本信息
        const conversation = await pgConfig.query(`
            SELECT 
                c.id,
                c.title,
                c.mode,
                c.primary_mentor_name,
                c.message_count,
                c.created_at,
                c.updated_at,
                u.id as user_id,
                u.username,
                u.email
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1 AND c.deleted_at IS NULL
        `, [conversationId]);

        if (conversation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '对话不存在'
            });
        }

        // 获取对话消息
        const messages = await pgConfig.query(`
            SELECT 
                id,
                role,
                content,
                content_type,
                message_order,
                mentor_name,
                created_at
            FROM conversation_messages
            WHERE conversation_id = $1 AND deleted_at IS NULL
            ORDER BY message_order ASC
        `, [conversationId]);

        res.json({
            success: true,
            data: {
                conversation: conversation.rows[0],
                messages: messages.rows
            }
        });
    } catch (error) {
        console.error('获取对话消息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取对话消息失败'
        });
    }
});

// 获取数据库表信息
router.get('/tables', async (req, res) => {
    try {
        const tables = await pgConfig.query(`
            SELECT 
                tablename as name,
                schemaname as schema
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);

        const tableInfo = [];
        for (const table of tables.rows) {
            const info = await pgConfig.query(`
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position
            `, [table.name]);
            
            const rowCount = await pgConfig.query(`SELECT COUNT(*) as count FROM ${table.name}`);
            
            tableInfo.push({
                name: table.name,
                schema: table.schema,
                columns: info.rows,
                rowCount: parseInt(rowCount.rows[0].count)
            });
        }

        res.json({
            success: true,
            data: { tables: tableInfo }
        });
    } catch (error) {
        console.error('获取表信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取表信息失败'
        });
    }
});

module.exports = router; 