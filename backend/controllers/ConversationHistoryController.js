/**
 * 对话历史记录控制器
 * 专门处理用户对话历史的查看、搜索、管理功能
 */

const { conversationHelper } = require('../config/postgresql');
const jwt = require('../utils/jwt');

class ConversationHistoryController {
    
    /**
     * 获取用户对话历史列表（分页+搜索+筛选）
     * GET /api/conversations/history
     */
    async getConversationHistory(req, res) {
        try {
            const userId = req.user.id;
            
            // 解析查询参数
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 20, 100), // 最大100条
                search: req.query.search?.trim() || '',
                mentorId: req.query.mentor || '',
                status: req.query.status || '',
                sortBy: req.query.sortBy || 'last_activity_at',
                sortOrder: req.query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
            };

            // 验证排序字段
            const allowedSortFields = [
                'created_at', 'updated_at', 'last_activity_at', 
                'last_message_at', 'title', 'message_count'
            ];
            
            if (!allowedSortFields.includes(options.sortBy)) {
                options.sortBy = 'last_activity_at';
            }

            // 获取对话历史
            const result = await conversationHelper.getUserConversationHistory(userId, options);

            // 处理返回数据
            const conversations = result.conversations.map(conv => ({
                id: conv.id,
                uuid: conv.uuid,
                title: conv.title,
                mentor: {
                    id: conv.mentor_id,
                    name: conv.mentor_name,
                    avatar: conv.mentor_avatar
                },
                status: conv.status,
                isFavorite: conv.is_favorite,
                isPinned: conv.is_pinned,
                messageCount: conv.message_count,
                totalTokens: conv.total_tokens,
                tags: conv.tags || [],
                satisfactionRating: conv.satisfaction_rating,
                createdAt: conv.created_at,
                updatedAt: conv.updated_at,
                lastActivityAt: conv.last_activity_at,
                lastMessageAt: conv.last_message_at,
                durationSeconds: conv.duration_seconds
            }));

            res.json({
                success: true,
                data: {
                    conversations,
                    pagination: result.pagination,
                    filters: {
                        search: options.search,
                        mentor: options.mentorId,
                        status: options.status,
                        sortBy: options.sortBy,
                        sortOrder: options.sortOrder
                    }
                },
                message: `成功获取 ${conversations.length} 条对话记录`
            });

        } catch (error) {
            console.error('获取对话历史失败:', error);
            res.status(500).json({
                success: false,
                message: '获取对话历史失败',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 获取对话详情和完整消息
     * GET /api/conversations/history/:id
     */
    async getConversationDetail(req, res) {
        try {
            const conversationId = parseInt(req.params.id);
            const userId = req.user.id;

            if (!conversationId || conversationId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: '无效的对话ID'
                });
            }

            // 获取对话详情和消息
            const conversation = await conversationHelper.getConversationWithMessages(
                conversationId, 
                userId
            );

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: '对话不存在或您无权访问'
                });
            }

            // 更新对话活动时间
            await conversationHelper.updateConversationActivity(conversationId);

            // 格式化返回数据
            const formattedConversation = {
                id: conversation.id,
                uuid: conversation.uuid,
                title: conversation.title,
                description: conversation.description,
                mode: conversation.mode,
                mentor: {
                    id: conversation.primary_mentor_id,
                    name: conversation.mentor_name,
                    avatar: conversation.mentor_avatar
                },
                status: conversation.status,
                isFavorite: conversation.is_favorite,
                isPinned: conversation.is_pinned,
                visibility: conversation.visibility,
                messageCount: conversation.message_count,
                userMessageCount: conversation.user_message_count,
                assistantMessageCount: conversation.assistant_message_count,
                totalTokens: conversation.total_tokens,
                totalCharacters: conversation.total_characters,
                sessionDuration: conversation.session_duration,
                satisfactionRating: conversation.satisfaction_rating,
                feedbackText: conversation.feedback_text,
                completionStatus: conversation.completion_status,
                tags: conversation.tags || [],
                metadata: conversation.metadata || {},
                createdAt: conversation.created_at,
                updatedAt: conversation.updated_at,
                firstMessageAt: conversation.first_message_at,
                lastMessageAt: conversation.last_message_at,
                lastActivityAt: conversation.last_activity_at,
                user: {
                    username: conversation.username
                },
                messages: conversation.messages.map(msg => ({
                    id: msg.id,
                    uuid: msg.uuid,
                    role: msg.role,
                    content: msg.content,
                    contentType: msg.content_type,
                    messageOrder: msg.message_order,
                    mentorId: msg.mentor_id,
                    mentorName: msg.mentor_name,
                    modelUsed: msg.model_used,
                    totalTokens: msg.total_tokens,
                    userRating: msg.user_rating,
                    isHelpful: msg.is_helpful,
                    metadata: msg.metadata || {},
                    createdAt: msg.created_at,
                    updatedAt: msg.updated_at
                }))
            };

            res.json({
                success: true,
                data: { conversation: formattedConversation },
                message: '成功获取对话详情'
            });

        } catch (error) {
            console.error('获取对话详情失败:', error);
            res.status(500).json({
                success: false,
                message: '获取对话详情失败',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 获取用户最近的对话
     * GET /api/conversations/recent
     */
    async getRecentConversations(req, res) {
        try {
            const userId = req.user.id;
            const limit = Math.min(parseInt(req.query.limit) || 5, 20);

            const conversations = await conversationHelper.getUserRecentConversations(userId, limit);

            const formattedConversations = conversations.map(conv => ({
                id: conv.id,
                uuid: conv.uuid,
                title: conv.title,
                mentor: {
                    name: conv.mentor_name,
                    avatar: conv.mentor_avatar
                },
                lastActivityAt: conv.last_activity_at,
                messageCount: conv.message_count
            }));

            res.json({
                success: true,
                data: { conversations: formattedConversations },
                message: `成功获取 ${formattedConversations.length} 条最近对话`
            });

        } catch (error) {
            console.error('获取最近对话失败:', error);
            res.status(500).json({
                success: false,
                message: '获取最近对话失败',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 更新对话状态（收藏、置顶等）
     * PUT /api/conversations/history/:id/status
     */
    async updateConversationStatus(req, res) {
        try {
            const conversationId = parseInt(req.params.id);
            const userId = req.user.id;
            const { isFavorite, isPinned, status, satisfactionRating, feedbackText } = req.body;

            if (!conversationId || conversationId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: '无效的对话ID'
                });
            }

            // 验证对话归属
            const conversation = await conversationHelper.getConversationWithMessages(conversationId, userId);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: '对话不存在或您无权访问'
                });
            }

            // 构建更新SQL
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (typeof isFavorite === 'boolean') {
                updates.push(`is_favorite = $${paramIndex++}`);
                values.push(isFavorite);
            }

            if (typeof isPinned === 'boolean') {
                updates.push(`is_pinned = $${paramIndex++}`);
                values.push(isPinned);
            }

            if (status && ['active', 'paused', 'completed', 'archived'].includes(status)) {
                updates.push(`status = $${paramIndex++}`);
                values.push(status);
            }

            if (satisfactionRating && satisfactionRating >= 1 && satisfactionRating <= 5) {
                updates.push(`satisfaction_rating = $${paramIndex++}`);
                values.push(satisfactionRating);
            }

            if (feedbackText !== undefined) {
                updates.push(`feedback_text = $${paramIndex++}`);
                values.push(feedbackText);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '没有有效的更新字段'
                });
            }

            // 添加更新时间和条件
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(conversationId, userId);

            const updateSQL = `
                UPDATE conversations 
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
                RETURNING id, is_favorite, is_pinned, status, satisfaction_rating, feedback_text
            `;

            const result = await conversationHelper.db.query(updateSQL, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '更新失败，对话不存在'
                });
            }

            res.json({
                success: true,
                data: { conversation: result.rows[0] },
                message: '对话状态更新成功'
            });

        } catch (error) {
            console.error('更新对话状态失败:', error);
            res.status(500).json({
                success: false,
                message: '更新对话状态失败',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 删除对话（软删除）
     * DELETE /api/conversations/history/:id
     */
    async deleteConversation(req, res) {
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
            const conversation = await conversationHelper.getConversationWithMessages(conversationId, userId);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: '对话不存在或您无权访问'
                });
            }

            // 软删除对话
            await conversationHelper.db.query(`
                UPDATE conversations 
                SET deleted_at = CURRENT_TIMESTAMP,
                    status = 'archived',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND user_id = $2
            `, [conversationId, userId]);

            res.json({
                success: true,
                message: '对话删除成功'
            });

        } catch (error) {
            console.error('删除对话失败:', error);
            res.status(500).json({
                success: false,
                message: '删除对话失败',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 导出对话记录
     * GET /api/conversations/history/:id/export
     */
    async exportConversation(req, res) {
        try {
            const conversationId = parseInt(req.params.id);
            const userId = req.user.id;
            const format = req.query.format || 'json'; // json, txt, md

            if (!conversationId || conversationId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: '无效的对话ID'
                });
            }

            // 获取对话详情
            const conversation = await conversationHelper.getConversationWithMessages(conversationId, userId);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: '对话不存在或您无权访问'
                });
            }

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `conversation_${conversationId}_${timestamp}`;

            switch (format) {
                case 'txt':
                    return this.exportAsText(res, conversation, filename);
                case 'md':
                    return this.exportAsMarkdown(res, conversation, filename);
                case 'json':
                default:
                    return this.exportAsJSON(res, conversation, filename);
            }

        } catch (error) {
            console.error('导出对话失败:', error);
            res.status(500).json({
                success: false,
                message: '导出对话失败',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 导出为JSON格式
     */
    exportAsJSON(res, conversation, filename) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json({
            conversation: {
                title: conversation.title,
                mentor: conversation.mentor_name,
                createdAt: conversation.created_at,
                messageCount: conversation.message_count,
                messages: conversation.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.created_at
                }))
            },
            exportedAt: new Date().toISOString(),
            exportedBy: 'AI导师对话系统'
        });
    }

    /**
     * 导出为文本格式
     */
    exportAsText(res, conversation, filename) {
        let content = `对话记录\n`;
        content += `标题: ${conversation.title}\n`;
        content += `导师: ${conversation.mentor_name}\n`;
        content += `创建时间: ${conversation.created_at}\n`;
        content += `消息数量: ${conversation.message_count}\n`;
        content += `\n${'='.repeat(50)}\n\n`;

        conversation.messages.forEach((msg, index) => {
            const role = msg.role === 'user' ? '用户' : '导师';
            content += `[${index + 1}] ${role} (${msg.created_at})\n`;
            content += `${msg.content}\n\n`;
        });

        content += `\n${'='.repeat(50)}\n`;
        content += `导出时间: ${new Date().toISOString()}\n`;
        content += `导出来源: AI导师对话系统\n`;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
        res.send(content);
    }

    /**
     * 导出为Markdown格式
     */
    exportAsMarkdown(res, conversation, filename) {
        let content = `# ${conversation.title}\n\n`;
        content += `**导师**: ${conversation.mentor_name}  \n`;
        content += `**创建时间**: ${conversation.created_at}  \n`;
        content += `**消息数量**: ${conversation.message_count}  \n\n`;
        content += `---\n\n`;

        conversation.messages.forEach((msg, index) => {
            const role = msg.role === 'user' ? '👤 用户' : '🤖 导师';
            content += `## ${role}\n\n`;
            content += `${msg.content}\n\n`;
            content += `*时间: ${msg.created_at}*\n\n`;
        });

        content += `---\n\n`;
        content += `*导出时间: ${new Date().toISOString()}*  \n`;
        content += `*导出来源: AI导师对话系统*\n`;

        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"`);
        res.send(content);
    }
}

module.exports = ConversationHistoryController; 