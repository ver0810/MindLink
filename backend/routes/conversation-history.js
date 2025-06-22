/**
 * 对话历史记录路由
 * 处理用户对话历史的API路由
 */

const express = require('express');
const router = express.Router();
const ConversationHistoryController = require('../controllers/ConversationHistoryController');
const { authenticateToken } = require('../middleware/auth');

// 创建控制器实例
const conversationHistoryController = new ConversationHistoryController();

/**
 * @route GET /api/conversations/history
 * @desc 获取用户对话历史列表（分页+搜索+筛选）
 * @access Private
 * @query {number} page - 页码（默认1）
 * @query {number} limit - 每页数量（默认20，最大100）
 * @query {string} search - 搜索关键词
 * @query {string} mentor - 导师ID筛选
 * @query {string} status - 状态筛选（active, paused, completed, archived）
 * @query {string} sortBy - 排序字段（created_at, updated_at, last_activity_at等）
 * @query {string} sortOrder - 排序方向（ASC, DESC）
 */
router.get('/history', authenticateToken, conversationHistoryController.getConversationHistory);

/**
 * @route GET /api/conversations/history/:id
 * @desc 获取指定对话的详情和完整消息
 * @access Private
 * @param {number} id - 对话ID
 */
router.get('/history/:id', authenticateToken, conversationHistoryController.getConversationDetail);

/**
 * @route GET /api/conversations/recent
 * @desc 获取用户最近的对话列表
 * @access Private
 * @query {number} limit - 返回数量（默认5，最大20）
 */
router.get('/recent', authenticateToken, conversationHistoryController.getRecentConversations);

/**
 * @route PUT /api/conversations/history/:id/status
 * @desc 更新对话状态（收藏、置顶、评分等）
 * @access Private
 * @param {number} id - 对话ID
 * @body {boolean} isFavorite - 是否收藏
 * @body {boolean} isPinned - 是否置顶
 * @body {string} status - 状态（active, paused, completed, archived）
 * @body {number} satisfactionRating - 满意度评分（1-5）
 * @body {string} feedbackText - 反馈文本
 */
router.put('/history/:id/status', authenticateToken, conversationHistoryController.updateConversationStatus);

/**
 * @route DELETE /api/conversations/history/:id
 * @desc 删除对话（软删除）
 * @access Private
 * @param {number} id - 对话ID
 */
router.delete('/history/:id', authenticateToken, conversationHistoryController.deleteConversation);

/**
 * @route GET /api/conversations/history/:id/export
 * @desc 导出对话记录
 * @access Private
 * @param {number} id - 对话ID
 * @query {string} format - 导出格式（json, txt, md）
 */
router.get('/history/:id/export', authenticateToken, conversationHistoryController.exportConversation);

module.exports = router; 