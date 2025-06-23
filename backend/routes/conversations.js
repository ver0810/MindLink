/**
 * 对话路由
 * 处理对话的创建、更新、消息保存等功能
 */

const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/ConversationControllerV2');
const authMiddleware = require('../middleware/auth');
const { conversationHelper, pgConfig } = require('../config/postgresql');
const IDHandler = require('../utils/id-handler');

// 所有对话相关的路由都需要身份验证
router.use(authMiddleware.authenticateToken);

// 静态路由必须在动态路由之前，避免被 /:id 拦截
// 获取对话统计信息
router.get('/stats/overview', (req, res) => conversationController.getStatistics(req, res));

// 获取导师列表
router.get('/mentors', (req, res) => conversationController.getMentors(req, res));

// 获取对话列表
router.get('/', (req, res) => conversationController.getConversations(req, res));

// 获取对话详情 - 使用IDHandler进行安全的ID处理
router.get('/:id(\\d+)', async (req, res) => {
    try {
        // 安全地提取和验证ID
        const conversationId = IDHandler.extractConversationId(req);
        const userId = IDHandler.extractUserId(req);

        console.log(`📋 获取对话详情 - ${IDHandler.formatForLog(conversationId, '对话ID')}, ${IDHandler.formatForLog(userId, '用户ID')}`);

        // 查询对话基本信息
        const conversationResult = await pgConfig.query(`
            SELECT c.*, u.username, u.email
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1 AND c.user_id = $2 AND c.deleted_at IS NULL
        `, [conversationId, userId]);

        if (conversationResult.rows.length === 0) {
            console.log(`❌ 对话不存在或无权访问 - ${IDHandler.formatForLog(conversationId, '对话ID')}, ${IDHandler.formatForLog(userId, '用户ID')}`);
            return res.status(404).json({
                success: false,
                message: '对话不存在或您无权访问'
            });
        }

        const conversation = conversationResult.rows[0];
        console.log(`✅ 找到对话: ${conversation.title}`);

        // 查询对话消息
        const messagesResult = await pgConfig.query(`
            SELECT 
                id, uuid, conversation_id, role, content, content_type,
                message_order, mentor_id, mentor_name, total_tokens,
                completion_tokens, prompt_tokens, model_used,
                processing_time_ms, response_time_ms, attachments,
                metadata, created_at, updated_at, is_edited
            FROM conversation_messages
            WHERE conversation_id = $1 AND deleted_at IS NULL
            ORDER BY created_at ASC
            LIMIT 1000 OFFSET 0
        `, [conversationId]);

        // 更新最后活动时间
        try {
            await pgConfig.query(`
                UPDATE conversations 
                SET last_activity_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND deleted_at IS NULL
            `, [conversationId]);
        } catch (updateError) {
            console.warn('更新最后活动时间失败:', updateError.message);
        }

        // 格式化响应数据
        const responseData = {
            conversation: {
                ...conversation,
                messages: messagesResult.rows || [],
                message_count: messagesResult.rows?.length || 0
            }
        };

        console.log(`✅ 返回对话详情，包含 ${messagesResult.rows?.length || 0} 条消息`);

        res.json({
            success: true,
            data: responseData,
            message: '获取对话详情成功'
        });

    } catch (error) {
        console.error('❌ 获取对话详情失败:', error);
        
        // 根据错误类型返回不同的状态码
        if (error.message.includes('ID验证失败') || error.message.includes('格式无效')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('未认证')) {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: '获取对话详情失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 创建新对话
 * POST /api/conversations
 */
router.post('/', async (req, res) => {
    try {
        console.log('创建对话请求 - req.user:', req.user);
        console.log('创建对话请求 - req.body:', req.body);
        
        // 安全地提取用户ID
        const userId = IDHandler.extractUserId(req);
        const { title, mentorId, mentorName, mode, description, tags, metadata } = req.body;

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

        console.log(`✅ 对话创建成功 - ${IDHandler.formatForLog(conversation.id, '对话ID')}, ${IDHandler.formatForLog(userId, '用户ID')}`);

        res.json({
            success: true,
            data: { conversation },
            message: '对话创建成功'
        });

    } catch (error) {
        console.error('创建对话失败:', error);
        
        // 根据错误类型返回不同的状态码
        if (error.message.includes('未认证')) {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }
        
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
        const conversationId = IDHandler.extractConversationId(req);
        const userId = IDHandler.extractUserId(req);
        const { title, description, tags, metadata } = req.body;

        console.log(`📝 更新对话 - ${IDHandler.formatForLog(conversationId, '对话ID')}, ${IDHandler.formatForLog(userId, '用户ID')}`);

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

        console.log(`✅ 对话更新成功 - ${IDHandler.formatForLog(conversationId, '对话ID')}`);

        res.json({
            success: true,
            data: { conversation: updateResult.rows[0] },
            message: '对话更新成功'
        });

    } catch (error) {
        console.error('更新对话失败:', error);
        
        if (error.message.includes('ID验证失败') || error.message.includes('未认证')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: '更新对话失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 删除对话
 * DELETE /api/conversations/:id
 */
router.delete('/:id(\\d+)', async (req, res) => {
    try {
        const conversationId = IDHandler.extractConversationId(req);
        const userId = IDHandler.extractUserId(req);

        console.log(`🗑️ 删除对话 - ${IDHandler.formatForLog(conversationId, '对话ID')}, ${IDHandler.formatForLog(userId, '用户ID')}`);

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

        // 软删除对话
        await pgConfig.query(`
            UPDATE conversations 
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
        `, [conversationId, userId]);

        console.log(`✅ 对话删除成功 - ${IDHandler.formatForLog(conversationId, '对话ID')}`);

        res.json({
            success: true,
            message: '对话删除成功'
        });

    } catch (error) {
        console.error('删除对话失败:', error);
        
        if (error.message.includes('ID验证失败') || error.message.includes('未认证')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: '删除对话失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 保存消息
 * POST /api/conversations/:id/messages
 */
router.post('/:id(\\d+)/messages', async (req, res) => {
    try {
        const conversationId = IDHandler.extractConversationId(req);
        const userId = IDHandler.extractUserId(req);
        const { role, content, mentorId, mentorName } = req.body;

        if (!role || !content) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：role, content'
            });
        }

        console.log(`💬 保存消息 - ${IDHandler.formatForLog(conversationId, '对话ID')}, ${IDHandler.formatForLog(userId, '用户ID')}`);

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

        // 获取消息顺序
        const orderResult = await pgConfig.query(`
            SELECT COALESCE(MAX(message_order), 0) + 1 as next_order
            FROM conversation_messages
            WHERE conversation_id = $1
        `, [conversationId]);

        const messageOrder = orderResult.rows[0].next_order;

        // 插入消息
        const messageResult = await pgConfig.query(`
            INSERT INTO conversation_messages (
                uuid, conversation_id, role, content, content_type,
                message_order, mentor_id, mentor_name, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            RETURNING id, uuid, created_at
        `, [
            require('crypto').randomUUID(),
            conversationId,
            role,
            content.trim(),
            'text',
            messageOrder,
            mentorId || null,
            mentorName || null
        ]);

        // 更新对话的消息统计
        await pgConfig.query(`
            UPDATE conversations 
            SET 
                message_count = message_count + 1,
                last_message_at = CURRENT_TIMESTAMP,
                last_activity_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [conversationId]);

        const message = messageResult.rows[0];

        console.log(`✅ 消息保存成功 - ${IDHandler.formatForLog(message.id, '消息ID')}`);

        res.json({
            success: true,
            data: { message },
            message: '消息保存成功'
        });

    } catch (error) {
        console.error('保存消息失败:', error);
        
        if (error.message.includes('ID验证失败') || error.message.includes('未认证')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: '保存消息失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 切换收藏状态
 * POST /api/conversations/:id/favorite
 */
router.post('/:id(\\d+)/favorite', async (req, res) => {
    try {
        const conversationId = IDHandler.extractConversationId(req);
        const userId = IDHandler.extractUserId(req);
        const { is_favorite } = req.body;

        console.log(`⭐ 切换收藏状态 - ${IDHandler.formatForLog(conversationId, '对话ID')}, 收藏: ${is_favorite}`);

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

        // 更新收藏状态
        await pgConfig.query(`
            UPDATE conversations 
            SET is_favorite = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND user_id = $3
        `, [is_favorite, conversationId, userId]);

        console.log(`✅ 收藏状态更新成功 - ${IDHandler.formatForLog(conversationId, '对话ID')}`);

        res.json({
            success: true,
            data: { is_favorite },
            message: is_favorite ? '已添加到收藏' : '已取消收藏'
        });

    } catch (error) {
        console.error('切换收藏状态失败:', error);
        
        if (error.message.includes('ID验证失败') || error.message.includes('未认证')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: '操作失败，请重试',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 