/**
 * 对话分析API路由
 */

const express = require('express');
const router = express.Router();
const ConversationAnalysisService = require('../services/ConversationAnalysisService');
const { authenticateToken } = require('../middleware/auth');

const analysisService = new ConversationAnalysisService();

/**
 * 实时分析对话内容
 * POST /api/conversation-analysis/analyze
 */
router.post('/analyze', authenticateToken, async (req, res) => {
    try {
        const { messages, conversationId } = req.body;
        const userId = req.user.id;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的对话内容'
            });
        }

        // 执行实时分析
        const analysis = await analysisService.analyzeConversationContent(messages, {
            userId,
            conversationId
        });

        res.json({
            success: true,
            message: '对话分析完成',
            ...analysis
        });

    } catch (error) {
        console.error('实时对话分析失败:', error);
        res.status(500).json({
            success: false,
            message: '分析失败: ' + error.message
        });
    }
});

/**
 * 分析单个对话
 * POST /api/conversations/:id/analyze
 */
router.post('/:id/analyze', authenticateToken, async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = req.user.id;

        // 验证用户权限
        const hasAccess = await verifyConversationAccess(conversationId, userId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: '无权限访问此对话'
            });
        }

        // 执行分析
        const analysis = await analysisService.analyzeConversation(conversationId);

        res.json({
            success: true,
            message: '对话分析完成',
            data: { analysis }
        });

    } catch (error) {
        console.error('对话分析失败:', error);
        res.status(500).json({
            success: false,
            message: '分析失败: ' + error.message
        });
    }
});

/**
 * 获取对话分析结果
 * GET /api/conversations/:id/analysis
 */
router.get('/:id/analysis', authenticateToken, async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = req.user.id;

        // 验证用户权限
        const hasAccess = await verifyConversationAccess(conversationId, userId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: '无权限访问此对话'
            });
        }

        // 获取分析结果
        const analysis = await analysisService.getAnalysisResult(conversationId);

        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: '未找到分析结果，请先进行分析'
            });
        }

        res.json({
            success: true,
            data: { analysis }
        });

    } catch (error) {
        console.error('获取分析结果失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分析结果失败: ' + error.message
        });
    }
});

/**
 * 批量分析对话
 * POST /api/conversations/batch-analyze
 */
router.post('/batch-analyze', authenticateToken, async (req, res) => {
    try {
        const { conversationIds } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的对话ID列表'
            });
        }

        // 验证所有对话的访问权限
        const accessChecks = await Promise.all(
            conversationIds.map(id => verifyConversationAccess(id, userId))
        );

        const unauthorizedIds = conversationIds.filter((id, index) => !accessChecks[index]);
        if (unauthorizedIds.length > 0) {
            return res.status(403).json({
                success: false,
                message: `无权限访问对话: ${unauthorizedIds.join(', ')}`
            });
        }

        // 执行批量分析
        const results = await analysisService.batchAnalyzeConversations(conversationIds);

        res.json({
            success: true,
            message: '批量分析完成',
            data: { results }
        });

    } catch (error) {
        console.error('批量分析失败:', error);
        res.status(500).json({
            success: false,
            message: '批量分析失败: ' + error.message
        });
    }
});

/**
 * 获取标签推荐
 * GET /api/conversations/:id/tag-recommendations
 */
router.get('/:id/tag-recommendations', authenticateToken, async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = req.user.id;

        // 验证用户权限
        const hasAccess = await verifyConversationAccess(conversationId, userId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: '无权限访问此对话'
            });
        }

        // 获取标签推荐
        const recommendations = await getTagRecommendations(conversationId);

        res.json({
            success: true,
            data: { recommendations }
        });

    } catch (error) {
        console.error('获取标签推荐失败:', error);
        res.status(500).json({
            success: false,
            message: '获取标签推荐失败: ' + error.message
        });
    }
});

/**
 * 应用推荐标签
 * POST /api/conversations/:id/apply-tags
 */
router.post('/:id/apply-tags', authenticateToken, async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const { tagIds, feedback } = req.body;
        const userId = req.user.id;

        // 验证用户权限
        const hasAccess = await verifyConversationAccess(conversationId, userId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: '无权限访问此对话'
            });
        }

        // 应用标签
        await applyTagsToConversation(conversationId, tagIds, feedback);

        res.json({
            success: true,
            message: '标签应用成功'
        });

    } catch (error) {
        console.error('应用标签失败:', error);
        res.status(500).json({
            success: false,
            message: '应用标签失败: ' + error.message
        });
    }
});

/**
 * 获取所有可用标签
 * GET /api/tags
 */
router.get('/tags', authenticateToken, async (req, res) => {
    try {
        const { type, category } = req.query;
        const tags = await getAllTags(type, category);

        res.json({
            success: true,
            data: { tags }
        });

    } catch (error) {
        console.error('获取标签列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取标签列表失败: ' + error.message
        });
    }
});

/**
 * 获取标签使用统计
 * GET /api/tags/stats
 */
router.get('/tags/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await getTagUsageStats();

        res.json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        console.error('获取标签统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取标签统计失败: ' + error.message
        });
    }
});

// 辅助函数

/**
 * 验证用户对对话的访问权限
 */
async function verifyConversationAccess(conversationId, userId) {
    const { Pool } = require('pg');
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    const client = await pool.connect();
    try {
        const query = 'SELECT id FROM conversations WHERE id = $1 AND user_id = $2';
        const result = await client.query(query, [conversationId, userId]);
        return result.rows.length > 0;
    } finally {
        client.release();
        await pool.end();
    }
}

/**
 * 获取标签推荐
 */
async function getTagRecommendations(conversationId) {
    const { Pool } = require('pg');
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                tr.id,
                tr.confidence_score,
                tr.reason,
                tr.auto_applied,
                tr.user_feedback,
                ct.name,
                ct.display_name,
                ct.color,
                ct.tag_type,
                ct.description
            FROM tag_recommendations tr
            JOIN conversation_tags ct ON tr.tag_id = ct.id
            WHERE tr.conversation_id = $1
            ORDER BY tr.confidence_score DESC
        `;
        
        const result = await client.query(query, [conversationId]);
        return result.rows;
    } finally {
        client.release();
        await pool.end();
    }
}

/**
 * 应用标签到对话
 */
async function applyTagsToConversation(conversationId, tagIds, feedback) {
    const { Pool } = require('pg');
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 添加标签关联
        for (const tagId of tagIds) {
            await client.query(`
                INSERT INTO conversation_tag_relations (conversation_id, tag_id)
                VALUES ($1, $2)
                ON CONFLICT (conversation_id, tag_id) DO NOTHING
            `, [conversationId, tagId]);

            // 更新推荐反馈
            if (feedback && feedback[tagId]) {
                await client.query(`
                    UPDATE tag_recommendations 
                    SET user_feedback = $3
                    WHERE conversation_id = $1 AND tag_id = $2
                `, [conversationId, tagId, feedback[tagId]]);
            }
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

/**
 * 获取所有标签
 */
async function getAllTags(type, category) {
    const { Pool } = require('pg');
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    const client = await pool.connect();
    try {
        let query = 'SELECT * FROM conversation_tags WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (type) {
            paramCount++;
            query += ` AND tag_type = $${paramCount}`;
            params.push(type);
        }

        if (category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            params.push(category);
        }

        query += ' ORDER BY tag_type, display_name';

        const result = await client.query(query, params);
        return result.rows;
    } finally {
        client.release();
        await pool.end();
    }
}

/**
 * 获取标签使用统计
 */
async function getTagUsageStats() {
    const { Pool } = require('pg');
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    const client = await pool.connect();
    try {
        const query = 'SELECT * FROM tag_usage_stats LIMIT 50';
        const result = await client.query(query);
        return result.rows;
    } finally {
        client.release();
        await pool.end();
    }
}

module.exports = router; 