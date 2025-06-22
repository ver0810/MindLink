/**
 * 对话控制器 V2 - 增强版API接口
 * 
 * 职责：
 * - HTTP请求处理
 * - 参数验证和转换
 * - 错误处理和响应格式化
 * - 中间件协调
 * - API版本管理
 */

const ConversationService = require('../services/ConversationService');
const AuthService = require('../services/AuthService');
const ValidationService = require('../services/ValidationService');
const RateLimitService = require('../services/RateLimitService');
const LoggerService = require('../services/LoggerService');

class ConversationControllerV2 {
    constructor() {
        this.conversationService = new ConversationService();
        this.authService = new AuthService();
        this.validation = new ValidationService();
        this.rateLimit = new RateLimitService();
        this.logger = new LoggerService();
    }

    /**
     * 创建新对话
     * POST /api/v2/conversations
     */
    async createConversation(req, res) {
        try {
            // 1. 速率限制检查
            await this.rateLimit.checkLimit(req.user.id, 'create_conversation', 20, 3600);

            // 2. 参数验证
            const validationResult = await this.validation.validateRequest(req.body, {
                title: { required: true, type: 'string', maxLength: 500 },
                mentorId: { required: true, type: 'string' },
                mentorName: { required: true, type: 'string' },
                mode: { required: false, type: 'string', enum: ['single', 'group', 'roundtable'] },
                description: { required: false, type: 'string', maxLength: 2000 },
                mentors: { required: false, type: 'array' },
                tags: { required: false, type: 'array' },
                metadata: { required: false, type: 'object' }
            });

            if (!validationResult.isValid) {
                return this.sendErrorResponse(res, 400, '参数验证失败', validationResult.errors);
            }

            // 3. 准备创建参数
            const createParams = {
                userId: req.user.id,
                title: req.body.title.trim(),
                mentorId: req.body.mentorId,
                mentorName: req.body.mentorName,
                mode: req.body.mode || 'single',
                description: req.body.description,
                mentors: req.body.mentors || [req.body.mentorId],
                tags: req.body.tags || [],
                metadata: req.body.metadata || {}
            };

            // 4. 创建对话
            const conversation = await this.conversationService.createConversation(createParams);

            // 5. 记录操作日志
            await this.logger.logUserAction(req.user.id, 'conversation_created', {
                conversationId: conversation.id,
                mentorId: req.body.mentorId,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            // 6. 返回成功响应
            return this.sendSuccessResponse(res, 201, '对话创建成功', {
                conversation
            });

        } catch (error) {
            await this.logger.logError(error, {
                action: 'create_conversation',
                userId: req.user?.id,
                body: req.body
            });

            return this.handleError(res, error);
        }
    }

    /**
     * 获取对话列表
     * GET /api/v2/conversations
     */
    async getConversations(req, res) {
        try {
            // 1. 参数验证和处理
            const queryParams = {
                userId: req.user.id,
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 20, 100),
                search: req.query.search?.trim(),
                mentor: req.query.mentor,
                status: req.query.status,
                tags: req.query.tags ? req.query.tags.split(',') : undefined,
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
                sortBy: req.query.sortBy || 'last_activity_at',
                sortOrder: req.query.sortOrder || 'DESC'
            };

            // 2. 获取对话列表
            const result = await this.conversationService.getUserConversations(queryParams);

            // 3. 添加额外的元数据
            const responseData = {
                ...result,
                meta: {
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId,
                    version: 'v2'
                }
            };

            return this.sendSuccessResponse(res, 200, '获取对话列表成功', responseData);

        } catch (error) {
            await this.logger.logError(error, {
                action: 'get_conversations',
                userId: req.user?.id,
                query: req.query
            });

            return this.handleError(res, error);
        }
    }

    /**
     * 获取对话详情
     * GET /api/v2/conversations/:id
     */
    async getConversationDetail(req, res) {
        try {
            const conversationId = parseInt(req.params.id);
            
            if (!conversationId || conversationId <= 0) {
                return this.sendErrorResponse(res, 400, '无效的对话ID');
            }

            // 获取对话详情
            const conversationDetail = await this.conversationService.getConversationDetail(
                conversationId, 
                req.user.id,
                {
                    includeDeleted: req.query.includeDeleted === 'true',
                    messageLimit: parseInt(req.query.messageLimit) || 1000
                }
            );

            return this.sendSuccessResponse(res, 200, '获取对话详情成功', conversationDetail);

        } catch (error) {
            await this.logger.logError(error, {
                action: 'get_conversation_detail',
                conversationId: req.params.id,
                userId: req.user?.id
            });

            return this.handleError(res, error);
        }
    }

    /**
     * 保存消息
     * POST /api/v2/conversations/:id/messages
     */
    async saveMessage(req, res) {
        try {
            const conversationId = parseInt(req.params.id);
            
            // 1. 速率限制检查
            await this.rateLimit.checkLimit(req.user.id, 'send_message', 100, 3600);

            // 2. 参数验证
            const validationResult = await this.validation.validateRequest(req.body, {
                role: { required: true, type: 'string', enum: ['user', 'assistant', 'system'] },
                content: { required: true, type: 'string', maxLength: 50000 },
                contentType: { required: false, type: 'string', enum: ['text', 'markdown', 'html'] },
                mentorId: { required: false, type: 'string' },
                mentorName: { required: false, type: 'string' },
                parentMessageId: { required: false, type: 'number' },
                attachments: { required: false, type: 'array' },
                metadata: { required: false, type: 'object' }
            });

            if (!validationResult.isValid) {
                return this.sendErrorResponse(res, 400, '参数验证失败', validationResult.errors);
            }

            // 3. 准备消息数据
            const messageData = {
                conversationId,
                userId: req.user.id,
                role: req.body.role,
                content: req.body.content.trim(),
                contentType: req.body.contentType || 'text',
                mentorId: req.body.mentorId,
                mentorName: req.body.mentorName,
                parentMessageId: req.body.parentMessageId,
                attachments: req.body.attachments || [],
                metadata: req.body.metadata || {},
                clientInfo: {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                }
            };

            // 4. 保存消息
            const savedMessage = await this.conversationService.saveMessage(messageData);

            // 5. 返回响应
            return this.sendSuccessResponse(res, 201, '消息保存成功', {
                message: savedMessage
            });

        } catch (error) {
            await this.logger.logError(error, {
                action: 'save_message',
                conversationId: req.params.id,
                userId: req.user?.id,
                body: req.body
            });

            return this.handleError(res, error);
        }
    }

    /**
     * 更新对话信息
     * PUT /api/v2/conversations/:id
     */
    async updateConversation(req, res) {
        try {
            const conversationId = parseInt(req.params.id);

            // 参数验证
            const validationResult = await this.validation.validateRequest(req.body, {
                title: { required: false, type: 'string', maxLength: 500 },
                description: { required: false, type: 'string', maxLength: 2000 },
                status: { required: false, type: 'string', enum: ['active', 'paused', 'completed', 'archived'] },
                isFavorite: { required: false, type: 'boolean' },
                isPinned: { required: false, type: 'boolean' },
                tags: { required: false, type: 'array' },
                satisfactionRating: { required: false, type: 'number', min: 1, max: 5 },
                feedbackText: { required: false, type: 'string', maxLength: 1000 }
            });

            if (!validationResult.isValid) {
                return this.sendErrorResponse(res, 400, '参数验证失败', validationResult.errors);
            }

            // 更新对话
            const updatedConversation = await this.conversationService.updateConversation(
                conversationId,
                req.user.id,
                req.body
            );

            // 记录操作日志
            await this.logger.logUserAction(req.user.id, 'conversation_updated', {
                conversationId,
                updateFields: Object.keys(req.body),
                ip: req.ip
            });

            return this.sendSuccessResponse(res, 200, '对话更新成功', {
                conversation: updatedConversation
            });

        } catch (error) {
            await this.logger.logError(error, {
                action: 'update_conversation',
                conversationId: req.params.id,
                userId: req.user?.id,
                body: req.body
            });

            return this.handleError(res, error);
        }
    }

    /**
     * 删除对话
     * DELETE /api/v2/conversations/:id
     */
    async deleteConversation(req, res) {
        try {
            const conversationId = parseInt(req.params.id);

            // 删除对话
            await this.conversationService.deleteConversation(conversationId, req.user.id);

            // 记录操作日志
            await this.logger.logUserAction(req.user.id, 'conversation_deleted', {
                conversationId,
                ip: req.ip
            });

            return this.sendSuccessResponse(res, 200, '对话删除成功');

        } catch (error) {
            await this.logger.logError(error, {
                action: 'delete_conversation',
                conversationId: req.params.id,
                userId: req.user?.id
            });

            return this.handleError(res, error);
        }
    }

    /**
     * 搜索对话
     * GET /api/v2/conversations/search
     */
    async searchConversations(req, res) {
        try {
            // 参数验证
            if (!req.query.q || req.query.q.trim().length < 2) {
                return this.sendErrorResponse(res, 400, '搜索关键词至少需要2个字符');
            }

            const searchParams = {
                userId: req.user.id,
                query: req.query.q.trim(),
                filters: {
                    mentor: req.query.mentor,
                    status: req.query.status,
                    tags: req.query.tags ? req.query.tags.split(',') : undefined
                },
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 20, 50)
            };

            // 执行搜索
            const searchResults = await this.conversationService.searchConversations(searchParams);

            return this.sendSuccessResponse(res, 200, '搜索完成', searchResults);

        } catch (error) {
            await this.logger.logError(error, {
                action: 'search_conversations',
                userId: req.user?.id,
                query: req.query
            });

            return this.handleError(res, error);
        }
    }

    /**
     * 获取统计信息
     * GET /api/v2/conversations/statistics
     */
    async getStatistics(req, res) {
        try {
            const statistics = await this.conversationService.getUserStatistics(req.user.id);

            return this.sendSuccessResponse(res, 200, '获取统计信息成功', {
                statistics
            });

        } catch (error) {
            await this.logger.logError(error, {
                action: 'get_statistics',
                userId: req.user?.id
            });

            return this.handleError(res, error);
        }
    }

    /**
     * 导出对话
     * POST /api/v2/conversations/:id/export
     */
    async exportConversation(req, res) {
        try {
            const conversationId = parseInt(req.params.id);
            const format = req.body.format || 'markdown';

            // 速率限制检查
            await this.rateLimit.checkLimit(req.user.id, 'export_conversation', 10, 3600);

            // 导出对话
            const exportResult = await this.conversationService.exportConversation(
                conversationId,
                req.user.id,
                format
            );

            // 设置响应头
            res.setHeader('Content-Type', this.getContentType(format));
            res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
            res.setHeader('Content-Length', exportResult.size);

            // 返回文件数据
            return res.send(exportResult.data);

        } catch (error) {
            await this.logger.logError(error, {
                action: 'export_conversation',
                conversationId: req.params.id,
                userId: req.user?.id,
                format: req.body.format
            });

            return this.handleError(res, error);
        }
    }

    /**
     * 批量操作对话
     * POST /api/v2/conversations/batch
     */
    async batchOperations(req, res) {
        try {
            // 参数验证
            const validationResult = await this.validation.validateRequest(req.body, {
                operation: { required: true, type: 'string', enum: ['delete', 'archive', 'favorite', 'unfavorite'] },
                conversationIds: { required: true, type: 'array', minLength: 1, maxLength: 100 }
            });

            if (!validationResult.isValid) {
                return this.sendErrorResponse(res, 400, '参数验证失败', validationResult.errors);
            }

            // 速率限制检查
            await this.rateLimit.checkLimit(req.user.id, 'batch_operation', 5, 3600);

            const { operation, conversationIds } = req.body;

            // 执行批量操作
            const results = await this.conversationService.batchOperations(
                req.user.id,
                operation,
                conversationIds
            );

            // 记录操作日志
            await this.logger.logUserAction(req.user.id, 'batch_operation', {
                operation,
                conversationIds,
                affectedCount: results.successCount,
                ip: req.ip
            });

            return this.sendSuccessResponse(res, 200, '批量操作完成', results);

        } catch (error) {
            await this.logger.logError(error, {
                action: 'batch_operations',
                userId: req.user?.id,
                body: req.body
            });

            return this.handleError(res, error);
        }
    }

    // =====================================
    // 辅助方法
    // =====================================

    /**
     * 发送成功响应
     */
    sendSuccessResponse(res, statusCode, message, data = null) {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString(),
            data
        };

        return res.status(statusCode).json(response);
    }

    /**
     * 发送错误响应
     */
    sendErrorResponse(res, statusCode, message, errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
            errors
        };

        return res.status(statusCode).json(response);
    }

    /**
     * 统一错误处理
     */
    handleError(res, error) {
        // 业务错误
        if (error.name === 'ValidationError') {
            return this.sendErrorResponse(res, 400, error.message);
        }

        if (error.name === 'AuthenticationError') {
            return this.sendErrorResponse(res, 401, error.message);
        }

        if (error.name === 'AuthorizationError') {
            return this.sendErrorResponse(res, 403, error.message);
        }

        if (error.name === 'NotFoundError') {
            return this.sendErrorResponse(res, 404, error.message);
        }

        if (error.name === 'RateLimitError') {
            return this.sendErrorResponse(res, 429, error.message);
        }

        // 数据库错误
        if (error.code === '23505') { // 唯一约束违反
            return this.sendErrorResponse(res, 409, '数据已存在');
        }

        if (error.code === '23503') { // 外键约束违反
            return this.sendErrorResponse(res, 400, '关联数据不存在');
        }

        // 系统错误
        console.error('系统错误:', error);
        return this.sendErrorResponse(res, 500, '服务器内部错误');
    }

    /**
     * 获取内容类型
     */
    getContentType(format) {
        const contentTypes = {
            'markdown': 'text/markdown',
            'json': 'application/json',
            'pdf': 'application/pdf',
            'txt': 'text/plain'
        };

        return contentTypes[format] || 'application/octet-stream';
    }
}

module.exports = ConversationControllerV2; 