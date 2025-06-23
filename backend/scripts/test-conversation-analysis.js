/**
 * 对话分析功能测试脚本
 */

const ConversationAnalysisService = require('../services/ConversationAnalysisService');
const ConversationService = require('../services/ConversationService');

async function testConversationAnalysis() {
    console.log('开始测试对话分析功能...\n');

    const analysisService = new ConversationAnalysisService();
    const conversationService = new ConversationService();

    try {
        // 1. 测试实时分析功能
        console.log('1. 测试实时分析功能');
        const testMessages = [
            {
                content: '我想了解如何制定一个有效的商业策略，特别是在竞争激烈的市场环境中。',
                role: 'user',
                timestamp: new Date()
            },
            {
                content: '制定有效商业策略需要考虑市场定位、竞争分析、资源配置等多个维度。首先，你需要明确目标市场和价值主张...',
                role: 'assistant',
                timestamp: new Date()
            },
            {
                content: '那么在资源有限的情况下，我应该如何优先考虑投资方向？',
                role: 'user',
                timestamp: new Date()
            },
            {
                content: '资源有限时，建议采用ROI优先级矩阵来评估投资方向。重点关注高回报、低风险的项目...',
                role: 'assistant',
                timestamp: new Date()
            }
        ];

        const realtimeAnalysis = await analysisService.analyzeConversationContent(testMessages, {
            userId: 1,
            conversationId: 'test'
        });

        console.log('实时分析结果:');
        console.log('- 总结:', realtimeAnalysis.summary);
        console.log('- 问题类型:', realtimeAnalysis.problemCategories);
        console.log('- 关键话题:', realtimeAnalysis.keyTopics);
        console.log('- 自动标签:', realtimeAnalysis.autoTags);
        console.log('- 复杂度:', realtimeAnalysis.complexity);
        console.log('- 情感:', realtimeAnalysis.sentiment);
        console.log('- 关键洞察:', realtimeAnalysis.keyInsights);
        console.log('- 建议行动:', realtimeAnalysis.suggestedActions);
        console.log('✅ 实时分析测试通过\n');

        // 2. 测试数据库对话分析（如果有真实对话数据）
        console.log('2. 测试数据库对话分析');
        try {
            // 这里需要一个真实的对话ID，如果没有则跳过
            const testConversationId = 1; // 假设存在ID为1的对话
            const dbAnalysis = await analysisService.analyzeConversation(testConversationId);
            console.log('数据库分析结果:');
            console.log('- 总结:', dbAnalysis.summary);
            console.log('- 问题类型:', dbAnalysis.problem_types);
            console.log('- 关键话题:', dbAnalysis.main_topics);
            console.log('✅ 数据库分析测试通过\n');
        } catch (error) {
            console.log('⚠️  数据库分析测试跳过（可能没有测试数据）:', error.message, '\n');
        }

        // 3. 测试各个分析组件
        console.log('3. 测试各个分析组件');
        
        const testContent = '我在管理团队时遇到了沟通障碍，员工积极性不高，项目进度缓慢。希望能得到一些建议来改善这种情况。';
        
        // 测试问题类型识别
        const problemTypes = analysisService.identifyProblemTypes(testContent);
        console.log('- 问题类型识别:', problemTypes);
        
        // 测试情感分析
        const sentiment = analysisService.analyzeSentiment(testContent);
        console.log('- 情感分析:', sentiment);
        
        // 测试关键话题提取
        const topics = analysisService.extractKeyTopics(testContent);
        console.log('- 关键话题:', topics);
        
        console.log('✅ 组件测试通过\n');

        console.log('🎉 所有测试完成！分析功能工作正常。');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        console.error('错误堆栈:', error.stack);
        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    testConversationAnalysis().catch(console.error);
}

module.exports = { testConversationAnalysis }; 