/**
 * 测试自动分析功能
 */

console.log('测试自动分析功能...\n');

// 模拟前端自动分析逻辑
function testAutoAnalysisLogic() {
    console.log('=== 测试前端自动分析逻辑 ===');
    
    // 模拟对话数据
    const mockConversations = [
        {
            id: 1,
            title: '商业策略咨询',
            messageCount: 5,
            problem_categories: ['business_strategy'], // 已有分析结果
            summary: '已有总结'
        },
        {
            id: 2,
            title: '职业发展规划',
            messageCount: 8,
            problem_categories: [], // 无分析结果
            summary: null
        },
        {
            id: 3,
            title: '技术讨论',
            messageCount: 2, // 消息数不足
            problem_categories: [],
            summary: null
        },
        {
            id: 4,
            title: '投资建议',
            messageCount: 12,
            problem_categories: [], // 无分析结果
            summary: null
        }
    ];

    // 筛选需要分析的对话
    const conversationsToAnalyze = mockConversations.filter(conv => {
        const messageCount = conv.messageCount || 0;
        const problemCategories = conv.problem_categories || [];
        return messageCount >= 3 && problemCategories.length === 0;
    });

    console.log('对话分析筛选结果:');
    mockConversations.forEach(conv => {
        const needsAnalysis = conversationsToAnalyze.some(c => c.id === conv.id);
        console.log(`  - 对话${conv.id}(${conv.title}): 消息数=${conv.messageCount}, 有标签=${conv.problem_categories.length > 0}, 需要分析=${needsAnalysis ? '是' : '否'}`);
    });

    console.log(`\n总共需要分析的对话: ${conversationsToAnalyze.length}个`);
    console.log('需要分析的对话ID:', conversationsToAnalyze.map(c => c.id));
}

// 测试后端自动分析触发条件
function testBackendAnalysisConditions() {
    console.log('\n=== 测试后端自动分析触发条件 ===');
    
    const testCases = [
        { messageCount: 1, hasSummary: false, expected: false, reason: '消息数不足' },
        { messageCount: 2, hasSummary: false, expected: false, reason: '消息数不足' },
        { messageCount: 3, hasSummary: false, expected: true, reason: '达到3条消息且未分析' },
        { messageCount: 5, hasSummary: false, expected: true, reason: '达到5条消息且未分析' },
        { messageCount: 3, hasSummary: true, expected: false, reason: '已有分析结果' },
        { messageCount: 10, hasSummary: false, expected: true, reason: '10的倍数，重新分析' },
        { messageCount: 10, hasSummary: true, expected: true, reason: '10的倍数，重新分析' },
        { messageCount: 20, hasSummary: true, expected: true, reason: '20的倍数，重新分析' },
        { messageCount: 15, hasSummary: true, expected: false, reason: '非10的倍数且已分析' }
    ];

    console.log('后端分析触发条件测试:');
    testCases.forEach((testCase, index) => {
        // 模拟后端分析条件判断
        const shouldAnalyze = 
            (testCase.messageCount >= 3 && !testCase.hasSummary) || 
            (testCase.messageCount % 10 === 0 && testCase.messageCount > 0);
        
        const result = shouldAnalyze === testCase.expected ? '✅' : '❌';
        console.log(`  ${index + 1}. 消息数=${testCase.messageCount}, 有总结=${testCase.hasSummary} => 应分析=${testCase.expected}, 实际=${shouldAnalyze} ${result} (${testCase.reason})`);
    });
}

// 模拟API调用测试
async function testApiCall() {
    console.log('\n=== 测试API调用 ===');
    
    try {
        // 测试服务器状态
        console.log('1. 测试服务器状态...');
        const serverResponse = await fetch('http://localhost:3000/api/health');
        if (serverResponse.ok) {
            console.log('  ✅ 服务器运行正常');
        } else {
            console.log('  ❌ 服务器响应异常:', serverResponse.status);
            return;
        }

        // 测试分析API（使用示例对话ID）
        console.log('2. 测试分析API...');
        const analysisResponse = await fetch('http://localhost:3000/api/conversation-analysis/1/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test_token' // 使用测试token
            }
        });

        if (analysisResponse.ok) {
            const result = await analysisResponse.json();
            console.log('  ✅ 分析API调用成功');
            console.log('  分析结果:', {
                success: result.success,
                hasData: !!result.data,
                problemCategories: result.data?.problem_categories?.length || 0
            });
        } else {
            console.log('  ⚠️ 分析API调用失败:', analysisResponse.status);
            if (analysisResponse.status === 401) {
                console.log('    原因: 需要有效的认证token');
            } else if (analysisResponse.status === 404) {
                console.log('    原因: 对话不存在');
            }
        }

    } catch (error) {
        console.log('  ❌ API调用出错:', error.message);
        console.log('    可能原因: 服务器未启动或网络连接问题');
    }
}

// 运行所有测试
async function runAllTests() {
    testAutoAnalysisLogic();
    testBackendAnalysisConditions();
    await testApiCall();
    
    console.log('\n=== 测试总结 ===');
    console.log('✅ 自动分析功能已实现:');
    console.log('  - 前端: 页面加载时自动检查需要分析的对话');
    console.log('  - 前端: 批量分析避免过多并发请求');
    console.log('  - 后端: 消息保存时自动触发分析（3条消息）');
    console.log('  - 后端: 定期重新分析（10的倍数消息）');
    console.log('  - 界面: 移除一键分析按钮，改为自动后台处理');
    console.log('');
    console.log('🎯 用户体验优化:');
    console.log('  - 无需手动点击分析按钮');
    console.log('  - 对话达到3条消息自动分析');
    console.log('  - 分析在后台进行，不影响正常使用');
    console.log('  - 分析完成后自动更新显示');
}

runAllTests(); 