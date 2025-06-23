/**
 * 实时标签生成功能测试脚本
 */

const ConversationAnalysisService = require('../services/ConversationAnalysisService');

async function testRealtimeTags() {
    console.log('开始测试实时标签生成功能...\n');

    const analysisService = new ConversationAnalysisService();

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
            }
        ];

        // 不传入conversationId，避免数据库更新
        const realtimeAnalysis = await analysisService.analyzeConversationContent(testMessages, {
            userId: 1
        });

        console.log('实时分析结果:');
        console.log('- 总结:', realtimeAnalysis.summary);
        console.log('- 问题类型:', realtimeAnalysis.problemCategories);
        console.log('- 关键话题:', realtimeAnalysis.keyTopics);
        console.log('- 自动标签:', realtimeAnalysis.autoTags);
        console.log('- 复杂度:', realtimeAnalysis.complexity);
        console.log('- 情感:', realtimeAnalysis.sentiment);

        // 2. 测试不同类型的对话
        console.log('\n2. 测试不同类型的对话');
        
        const testCases = [
            {
                name: '投资咨询对话',
                messages: [
                    { content: '我想投资股票市场，但不知道如何开始。', role: 'user' },
                    { content: '投资股票需要先了解基本面分析和技术分析...', role: 'assistant' }
                ]
            },
            {
                name: '职业发展对话',
                messages: [
                    { content: '我在职业发展上遇到了瓶颈，不知道如何突破。', role: 'user' },
                    { content: '职业瓶颈很常见，关键是要找到突破点...', role: 'assistant' }
                ]
            },
            {
                name: '技术创新对话',
                messages: [
                    { content: '如何在公司推动技术创新和数字化转型？', role: 'user' },
                    { content: '技术创新需要自上而下的支持和文化变革...', role: 'assistant' }
                ]
            }
        ];

        for (const testCase of testCases) {
            console.log(`\n测试案例: ${testCase.name}`);
            
            const analysis = await analysisService.analyzeConversationContent(testCase.messages, {
                userId: 1
            });
            
            console.log(`- 问题类型: ${analysis.problemCategories.join(', ')}`);
            console.log(`- 关键话题: ${analysis.keyTopics.join(', ')}`);
            console.log(`- 复杂度: ${analysis.complexity}`);
        }

        // 3. 测试渐进式标签生成
        console.log('\n3. 测试渐进式标签生成');
        
        const progressiveMessages = [
            { content: '我想创业，但不知道从哪里开始。', role: 'user' },
            { content: '创业是一个激动人心的旅程。首先要有清晰的商业理念...', role: 'assistant' }
        ];

        console.log('2条消息的分析结果:');
        let analysis = await analysisService.analyzeConversationContent(progressiveMessages, {
            userId: 1
        });
        console.log(`- 问题类型: ${analysis.problemCategories.join(', ')}`);

        // 添加更多消息
        progressiveMessages.push(
            { content: '我担心资金不够，应该如何筹集启动资金？', role: 'user' },
            { content: '资金筹集有多种方式，包括自筹、天使投资、风险投资...', role: 'assistant' }
        );

        console.log('4条消息的分析结果:');
        analysis = await analysisService.analyzeConversationContent(progressiveMessages, {
            userId: 1
        });
        console.log(`- 问题类型: ${analysis.problemCategories.join(', ')}`);
        console.log(`- 关键话题: ${analysis.keyTopics.join(', ')}`);

        console.log('\n✅ 实时标签生成功能测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    testRealtimeTags().then(() => {
        console.log('\n🎉 所有测试通过！');
        process.exit(0);
    }).catch(error => {
        console.error('💥 测试执行失败:', error);
        process.exit(1);
    });
}

module.exports = { testRealtimeTags }; 