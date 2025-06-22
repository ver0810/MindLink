/**
 * 对话路由
 * 处理对话的创建、更新、消息保存等功能
 */

const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/auth');
const { conversationHelper, pgConfig } = require('../config/postgresql');

// 所有对话相关的路由都需要身份验证
router.use(authMiddleware.authenticateToken);

// 静态路由必须在动态路由之前，避免被 /:id 拦截
// 获取对话统计信息
router.get('/stats/overview', conversationController.getStatistics);

// 获取导师列表
router.get('/mentors', conversationController.getMentors);

// 获取对话列表
router.get('/', conversationController.getConversations);

// 获取对话详情 (只匹配数字ID)
router.get('/:id(\\d+)', conversationController.getConversation);

/**
 * 创建新对话
 * POST /api/conversations
 */
router.post('/', async (req, res) => {
    try {
        console.log('创建对话请求 - req.user:', req.user);
        console.log('创建对话请求 - req.body:', req.body);
        
        const userId = req.user?.id;
        const { title, mentorId, mentorName, mode, description, tags, metadata } = req.body;

        // 验证用户ID
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '用户身份验证失败'
            });
        }

        // 参数验证
        if (!title || !mentorId || !mentorName) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：title, mentorId, mentorName'
            });
        }

        // 映射前端mode值到数据库支持的值
        const mapMode = (frontendMode) => {
            switch (frontendMode) {
                case '1v1': return 'single';
                case '1vMany': return 'roundtable';
                case 'group': return 'group';
                case 'roundtable': return 'roundtable';
                default: return 'single';
            }
        };

        // 创建对话数据
        const conversationData = {
            uuid: require('crypto').randomUUID(),
            user_id: userId,
            title: title.trim(),
            description: description || '',
            mode: mapMode(mode),
            primary_mentor_id: mentorId,
            primary_mentor_name: mentorName,
            mentors: JSON.stringify([mentorId]),
            status: 'active',
            tags: tags || [],
            metadata: JSON.stringify(metadata || {})
        };

        // 插入数据库
        const result = await pgConfig.query(`
            INSERT INTO conversations (
                uuid, user_id, title, description, mode,
                primary_mentor_id, primary_mentor_name, mentors,
                status, tags, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, uuid, title, created_at
        `, [
            conversationData.uuid,
            conversationData.user_id,
            conversationData.title,
            conversationData.description,
            conversationData.mode,
            conversationData.primary_mentor_id,
            conversationData.primary_mentor_name,
            conversationData.mentors,
            conversationData.status,
            conversationData.tags,
            conversationData.metadata
        ]);

        const conversation = result.rows[0];

        res.json({
            success: true,
            data: { conversation },
            message: '对话创建成功'
        });

    } catch (error) {
        console.error('创建对话失败:', error);
        res.status(500).json({
            success: false,
            message: '创建对话失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 更新对话
 * PUT /api/conversations/:id
 */
router.put('/:id(\\d+)', async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = req.user.id;
        const { title, description, tags, metadata } = req.body;

        if (!conversationId || conversationId <= 0) {
            return res.status(400).json({
                success: false,
                message: '无效的对话ID'
            });
        }

        // 验证对话归属
        const checkResult = await pgConfig.query(`
            SELECT id FROM conversations 
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        `, [conversationId, userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '对话不存在或您无权访问'
            });
        }

        // 构建更新语句
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(title.trim());
        }

        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(description);
        }

        if (tags !== undefined) {
            updates.push(`tags = $${paramIndex++}`);
            values.push(tags);
        }

        if (metadata !== undefined) {
            updates.push(`metadata = $${paramIndex++}`);
            values.push(JSON.stringify(metadata));
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有要更新的字段'
            });
        }

        // 添加更新时间和条件
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(conversationId, userId);

        const updateResult = await pgConfig.query(`
            UPDATE conversations 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
            RETURNING id, title, updated_at
        `, values);

        res.json({
            success: true,
            data: { conversation: updateResult.rows[0] },
            message: '对话更新成功'
        });

    } catch (error) {
        console.error('更新对话失败:', error);
        res.status(500).json({
            success: false,
            message: '更新对话失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 保存消息到对话
 * POST /api/conversations/:id/messages
 */
router.post('/:id(\\d+)/messages', async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = req.user.id;
        const { role, content, messageOrder, mentorId, mentorName, metadata } = req.body;

        // 参数验证
        if (!conversationId || conversationId <= 0) {
            return res.status(400).json({
                success: false,
                message: '无效的对话ID'
            });
        }

        if (!role || !content) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：role, content'
            });
        }

        if (!['user', 'assistant', 'system'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: '无效的消息角色'
            });
        }

        // 验证对话归属
        const conversationCheck = await pgConfig.query(`
            SELECT id, title FROM conversations 
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        `, [conversationId, userId]);

        if (conversationCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '对话不存在或您无权访问'
            });
        }

        // 获取消息顺序
        let order = messageOrder;
        if (order === undefined) {
            const orderResult = await pgConfig.query(`
                SELECT COALESCE(MAX(message_order), 0) + 1 as next_order
                FROM conversation_messages 
                WHERE conversation_id = $1
            `, [conversationId]);
            order = orderResult.rows[0].next_order;
        }

        // 插入消息
        const messageData = {
            uuid: require('crypto').randomUUID(),
            conversation_id: conversationId,
            role: role,
            content: content.trim(),
            content_type: 'text',
            message_order: order,
            mentor_id: mentorId || null,
            mentor_name: mentorName || null,
            status: 'sent',
            metadata: JSON.stringify(metadata || {})
        };

        const result = await pgConfig.query(`
            INSERT INTO conversation_messages (
                uuid, conversation_id, role, content, content_type,
                message_order, mentor_id, mentor_name, status, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, uuid, role, content, message_order, created_at
        `, [
            messageData.uuid,
            messageData.conversation_id,
            messageData.role,
            messageData.content,
            messageData.content_type,
            messageData.message_order,
            messageData.mentor_id,
            messageData.mentor_name,
            messageData.status,
            messageData.metadata
        ]);

        const message = result.rows[0];

        res.json({
            success: true,
            data: { message },
            message: '消息保存成功'
        });

    } catch (error) {
        console.error('保存消息失败:', error);
        res.status(500).json({
            success: false,
            message: '保存消息失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 获取对话消息
 * GET /api/conversations/:id/messages
 */
router.get('/:id(\\d+)/messages', async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = req.user.id;

        if (!conversationId || conversationId <= 0) {
            return res.status(400).json({
                success: false,
                message: '无效的对话ID'
            });
        }

        // 验证对话归属
        const conversationCheck = await pgConfig.query(`
            SELECT id FROM conversations 
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        `, [conversationId, userId]);

        if (conversationCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '对话不存在或您无权访问'
            });
        }

        // 获取消息
        const result = await pgConfig.query(`
            SELECT 
                id, uuid, role, content, content_type,
                message_order, mentor_id, mentor_name,
                status, metadata, created_at, updated_at
            FROM conversation_messages
            WHERE conversation_id = $1 AND deleted_at IS NULL
            ORDER BY message_order ASC
        `, [conversationId]);

        const messages = result.rows.map(msg => ({
            id: msg.id,
            uuid: msg.uuid,
            role: msg.role,
            content: msg.content,
            contentType: msg.content_type,
            messageOrder: msg.message_order,
            mentorId: msg.mentor_id,
            mentorName: msg.mentor_name,
            status: msg.status,
            metadata: msg.metadata || {},
            createdAt: msg.created_at,
            updatedAt: msg.updated_at
        }));

        res.json({
            success: true,
            data: { messages },
            message: `成功获取 ${messages.length} 条消息`
        });

    } catch (error) {
        console.error('获取消息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取消息失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 删除对话
router.delete('/:id(\\d+)', conversationController.deleteConversation);

// 切换收藏状态
router.post('/:id(\\d+)/favorite', conversationController.toggleFavorite);

module.exports = router; 