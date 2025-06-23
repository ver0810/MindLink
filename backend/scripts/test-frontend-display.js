/**
 * 测试前端标签和总结显示功能
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// 创建测试服务器
const app = express();
app.use(cors());
app.use(express.json());

// 模拟对话数据
const mockConversations = [
    {
        id: '1',
        title: '关于AI创业的讨论',
        mentorName: '马云',
        mentor_name: '马云',
        primary_mentor_name: '马云',
        messageCount: 15,
        message_count: 15,
        createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
        created_at: new Date('2024-01-15T10:30:00Z').toISOString(),
        updatedAt: new Date('2024-01-16T14:20:00Z').toISOString(),
        updated_at: new Date('2024-01-16T14:20:00Z').toISOString(),
        is_favorite: true,
        is_archived: false,
        
        // AI分析数据
        summary: '探讨了AI创业的机遇与挑战，重点分析了技术门槛、市场定位和团队建设等关键因素。',
        aiSummary: '探讨了AI创业的机遇与挑战，重点分析了技术门槛、市场定位和团队建设等关键因素。',
        problemCategories: ['business_strategy', 'technology_innovation'],
        problem_categories: ['business_strategy', 'technology_innovation'],
        keyTopics: ['AI创业', '技术创新', '市场分析'],
        key_topics: ['AI创业', '技术创新', '市场分析'],
        autoTags: ['sentiment_positive', 'complexity_advanced'],
        auto_tags: ['sentiment_positive', 'complexity_advanced'],
        complexityLevel: 4,
        complexity_level: 4,
        keyInsights: [
            'AI创业需要深厚的技术积累和市场洞察力',
            '团队的技术能力是成功的关键因素',
            '需要关注AI伦理和数据安全问题'
        ],
        key_insights: [
            'AI创业需要深厚的技术积累和市场洞察力',
            '团队的技术能力是成功的关键因素',
            '需要关注AI伦理和数据安全问题'
        ],
        suggestedActions: [
            '制定详细的技术路线图',
            '建立核心技术团队',
            '进行市场调研和用户验证'
        ],
        suggested_actions: [
            '制定详细的技术路线图',
            '建立核心技术团队',
            '进行市场调研和用户验证'
        ]
    },
    {
        id: '2',
        title: '投资理财建议咨询',
        mentorName: '沃伦·巴菲特',
        mentor_name: '沃伦·巴菲特',
        primary_mentor_name: '沃伦·巴菲特',
        messageCount: 8,
        message_count: 8,
        createdAt: new Date('2024-01-14T09:15:00Z').toISOString(),
        created_at: new Date('2024-01-14T09:15:00Z').toISOString(),
        updatedAt: new Date('2024-01-14T16:45:00Z').toISOString(),
        updated_at: new Date('2024-01-14T16:45:00Z').toISOString(),
        is_favorite: false,
        is_archived: false,
        
        // AI分析数据
        summary: '讨论了长期投资策略和风险管理，强调价值投资理念和分散投资的重要性。',
        aiSummary: '讨论了长期投资策略和风险管理，强调价值投资理念和分散投资的重要性。',
        problemCategories: ['investment_advice', 'financial_planning'],
        problem_categories: ['investment_advice', 'financial_planning'],
        keyTopics: ['价值投资', '风险管理', '长期规划'],
        key_topics: ['价值投资', '风险管理', '长期规划'],
        autoTags: ['sentiment_neutral', 'complexity_intermediate'],
        auto_tags: ['sentiment_neutral', 'complexity_intermediate'],
        complexityLevel: 3,
        complexity_level: 3,
        keyInsights: [
            '长期投资比短期投机更能创造价值',
            '分散投资可以有效降低风险',
            '投资前需要深入了解公司基本面'
        ],
        key_insights: [
            '长期投资比短期投机更能创造价值',
            '分散投资可以有效降低风险',
            '投资前需要深入了解公司基本面'
        ],
        suggestedActions: [
            '制定个人投资计划',
            '学习财务分析基础知识',
            '建立应急基金'
        ],
        suggested_actions: [
            '制定个人投资计划',
            '学习财务分析基础知识',
            '建立应急基金'
        ]
    },
    {
        id: '3',
        title: '职业发展规划讨论',
        mentorName: '李嘉诚',
        mentor_name: '李嘉诚',
        primary_mentor_name: '李嘉诚',
        messageCount: 12,
        message_count: 12,
        createdAt: new Date('2024-01-13T14:20:00Z').toISOString(),
        created_at: new Date('2024-01-13T14:20:00Z').toISOString(),
        updatedAt: new Date('2024-01-13T18:30:00Z').toISOString(),
        updated_at: new Date('2024-01-13T18:30:00Z').toISOString(),
        is_favorite: true,
        is_archived: false,
        
        // AI分析数据
        summary: '探讨了职业发展的不同路径，重点讨论了技能提升、人脉建设和机会把握等关键要素。',
        problemCategories: ['career_development', 'personal_growth'],
        problem_categories: ['career_development', 'personal_growth'],
        keyTopics: ['职业规划', '技能发展', '人际关系'],
        key_topics: ['职业规划', '技能发展', '人际关系'],
        autoTags: ['sentiment_positive'],
        auto_tags: ['sentiment_positive'],
        complexityLevel: 2,
        complexity_level: 2,
        keyInsights: [
            '持续学习是职业发展的基础',
            '人脉关系在职业成长中起重要作用',
            '要善于抓住机会并勇于承担责任'
        ],
        key_insights: [
            '持续学习是职业发展的基础',
            '人脉关系在职业成长中起重要作用',
            '要善于抓住机会并勇于承担责任'
        ],
        suggestedActions: [
            '制定5年职业发展计划',
            '参加相关行业培训',
            '扩展专业人脉网络'
        ],
        suggested_actions: [
            '制定5年职业发展计划',
            '参加相关行业培训',
            '扩展专业人脉网络'
        ]
    }
];

// API路由
app.get('/api/conversations/history', (req, res) => {
    console.log('📋 请求对话历史列表');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedConversations = mockConversations.slice(startIndex, endIndex);
    
    res.json({
        success: true,
        data: {
            conversations: paginatedConversations,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(mockConversations.length / limit),
                totalItems: mockConversations.length,
                hasMore: endIndex < mockConversations.length
            }
        }
    });
});

app.get('/api/conversations/history/:id', (req, res) => {
    console.log(`📋 请求对话详情: ${req.params.id}`);
    
    const conversation = mockConversations.find(c => c.id === req.params.id);
    
    if (!conversation) {
        return res.status(404).json({
            success: false,
            message: '对话不存在'
        });
    }
    
    // 添加模拟消息
    const conversationWithMessages = {
        ...conversation,
        messages: [
            {
                id: '1',
                role: 'user',
                content: '你好，我想了解一下关于创业的建议。',
                createdAt: conversation.createdAt,
                created_at: conversation.createdAt
            },
            {
                id: '2',
                role: 'assistant',
                content: '很高兴为您提供创业建议。创业是一个充满挑战但也充满机遇的过程...',
                createdAt: new Date(Date.parse(conversation.createdAt) + 5 * 60 * 1000).toISOString(),
                created_at: new Date(Date.parse(conversation.createdAt) + 5 * 60 * 1000).toISOString()
            }
        ]
    };
    
    res.json({
        success: true,
        data: {
            conversation: conversationWithMessages
        }
    });
});

app.get('/api/conversations/statistics', (req, res) => {
    console.log('📊 请求统计信息');
    
    res.json({
        success: true,
        data: {
            totalConversations: mockConversations.length,
            totalMessages: mockConversations.reduce((sum, c) => sum + c.messageCount, 0),
            favoriteConversations: mockConversations.filter(c => c.is_favorite).length,
            archivedConversations: mockConversations.filter(c => c.is_archived).length,
            mentorStats: [
                { mentor_name: '马云', conversation_count: 1 },
                { mentor_name: '沃伦·巴菲特', conversation_count: 1 },
                { mentor_name: '李嘉诚', conversation_count: 1 }
            ]
        }
    });
});

// 启动测试服务器
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 测试服务器启动成功！`);
    console.log(`📍 地址: http://localhost:${PORT}`);
    console.log(`\n🔧 测试步骤:`);
    console.log(`1. 打开浏览器访问对话历史页面`);
    console.log(`2. 修改前端API配置指向端口 ${PORT}`);
    console.log(`3. 检查标签和总结是否正确显示`);
    console.log(`\n📋 可用的API端点:`);
    console.log(`- GET /api/conversations/history - 获取对话列表`);
    console.log(`- GET /api/conversations/history/:id - 获取对话详情`);
    console.log(`- GET /api/conversations/statistics - 获取统计信息`);
    console.log(`\n💡 提示: 按 Ctrl+C 停止测试服务器\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 测试服务器已关闭');
    process.exit(0);
});

module.exports = app; 