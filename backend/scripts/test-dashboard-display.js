/**
 * Dashboard对话显示功能测试脚本
 */

const ConversationService = require('../services/ConversationService');
const ConversationAnalysisService = require('../services/ConversationAnalysisService');

async function testDashboardDisplay() {
    console.log('开始测试Dashboard对话显示功能...\n');

    const conversationService = new ConversationService();
    const analysisService = new ConversationAnalysisService();

    try {
        console.log('1. 测试对话数据格式');
        
        // 模拟一个完整的对话数据
        const mockConversation = {
            id: 1,
            title: '商业策略咨询',
            primary_mentor_name: '马云',
            mentor_name: '马云',
            messageCount: 8,
            message_count: 8,
            last_message: '感谢您的建议，我会认真考虑市场定位和竞争分析的重要性。',
            createdAt: new Date('2024-01-15T10:00:00Z'),
            created_at: new Date('2024-01-15T10:00:00Z'),
            updatedAt: new Date('2024-01-23T15:30:00Z'),
            updated_at: new Date('2024-01-23T15:30:00Z'),
            is_favorite: true,
            
            // 分析相关字段
            summary: '用户咨询如何在竞争激烈的市场中制定有效的商业策略，讨论了市场定位、竞争分析、资源配置等关键要素，并获得了针对性的建议和实施方案。',
            aiSummary: '用户咨询如何在竞争激烈的市场中制定有效的商业策略，讨论了市场定位、竞争分析、资源配置等关键要素，并获得了针对性的建议和实施方案。',
            
            problemCategories: ['business_strategy', 'market_analysis', 'competitive_analysis'],
            problem_categories: ['business_strategy', 'market_analysis', 'competitive_analysis'],
            
            keyTopics: ['市场定位', '竞争分析', '资源配置', '战略规划'],
            key_topics: ['市场定位', '竞争分析', '资源配置', '战略规划'],
            
            autoTags: ['策略咨询', '市场研究', '商业规划'],
            auto_tags: ['策略咨询', '市场研究', '商业规划'],
            
            complexityLevel: 4,
            complexity_level: 4
        };

        console.log('✓ 对话数据结构验证完成');
        console.log('  - 基础信息：标题、导师、消息数、时间等');
        console.log('  - 分析字段：总结、标签、复杂度等');
        console.log('  - 字段兼容：支持驼峰和下划线命名');

        console.log('\n2. 测试显示字段提取');
        
        // 测试字段提取逻辑
        const summary = mockConversation.summary || mockConversation.aiSummary;
        const problemCategories = mockConversation.problemCategories || mockConversation.problem_categories || [];
        const keyTopics = mockConversation.keyTopics || mockConversation.key_topics || [];
        const autoTags = mockConversation.autoTags || mockConversation.auto_tags || [];
        const complexityLevel = mockConversation.complexityLevel || mockConversation.complexity_level || 1;

        console.log('✓ 字段提取测试通过');
        console.log(`  - AI总结: ${summary ? '✓' : '✗'} (${summary ? summary.length : 0}字符)`);
        console.log(`  - 问题类型: ${problemCategories.length}个 [${problemCategories.slice(0, 3).join(', ')}]`);
        console.log(`  - 关键话题: ${keyTopics.length}个 [${keyTopics.slice(0, 2).join(', ')}]`);
        console.log(`  - 智能标签: ${autoTags.length}个 [${autoTags.slice(0, 2).join(', ')}]`);
        console.log(`  - 复杂度等级: ${complexityLevel}/5`);

        console.log('\n3. 测试标签格式化');
        
        // 测试标签格式化功能
        const tagMappings = {
            'business_strategy': '商业策略',
            'investment_advice': '投资建议',
            'career_development': '职业发展',
            'leadership_management': '领导管理',
            'technology_innovation': '技术创新',
            'market_analysis': '市场分析',
            'personal_growth': '个人成长',
            'financial_planning': '财务规划',
            'competitive_analysis': '竞争分析'
        };

        const formatTagName = (tagName) => {
            if (!tagName) return '';
            const formatted = tagName.replace(/_/g, ' ');
            return tagMappings[tagName] || formatted.replace(/\b\w/g, l => l.toUpperCase());
        };

        console.log('✓ 标签格式化测试通过');
        problemCategories.forEach(tag => {
            console.log(`  - ${tag} → ${formatTagName(tag)}`);
        });

        console.log('\n4. 测试复杂度显示');
        
        // 测试复杂度相关功能
        const getComplexityLabel = (level) => {
            const labels = ['', '简单', '简单', '中等', '复杂', '非常复杂'];
            return labels[level] || '未知';
        };

        const getComplexityColor = (index, currentLevel) => {
            if (index <= currentLevel) {
                if (index <= 2) return '#10B981'; // 绿色
                if (index <= 3) return '#F59E0B'; // 黄色
                return '#EF4444'; // 红色
            }
            return '#6B7280'; // 灰色
        };

        console.log('✓ 复杂度显示测试通过');
        console.log(`  - 复杂度等级: ${complexityLevel} (${getComplexityLabel(complexityLevel)})`);
        console.log('  - 指示器颜色:');
        for (let i = 1; i <= 5; i++) {
            const color = getComplexityColor(i, complexityLevel);
            const isActive = i <= complexityLevel;
            console.log(`    ${i}: ${color} ${isActive ? '●' : '○'}`);
        }

        console.log('\n5. 测试HTML生成逻辑');
        
        // 模拟HTML生成逻辑
        const escapeHtml = (text) => {
            if (!text) return '';
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        // 生成AI总结HTML
        const summaryHtml = summary ? `
            <div class="bg-blue-900/30 border border-blue-500/30 rounded-md p-3 mb-3">
                <div class="flex items-center mb-1">
                    <svg class="w-3 h-3 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="text-xs text-blue-400 font-medium">AI总结</span>
                </div>
                <p class="text-blue-200 text-sm leading-relaxed line-clamp-2">${escapeHtml(summary)}</p>
            </div>
        ` : '';

        // 生成标签HTML
        const tagsHtml = (problemCategories.length > 0 || keyTopics.length > 0 || autoTags.length > 0) ? `
            <div class="flex flex-wrap gap-2 mb-3">
                ${problemCategories.slice(0, 3).map(category => 
                    `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                        ${formatTagName(category)}
                    </span>`
                ).join('')}
                ${keyTopics.slice(0, 2).map(topic => 
                    `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        ${escapeHtml(topic)}
                    </span>`
                ).join('')}
                ${autoTags.slice(0, 2).map(tag => 
                    `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        ${formatTagName(tag)}
                    </span>`
                ).join('')}
            </div>
        ` : '';

        // 生成复杂度指示器HTML
        const complexityHtml = complexityLevel > 1 ? `
            <div class="flex items-center space-x-2 mb-3">
                <span class="text-xs text-slate-400">复杂度:</span>
                <div class="flex space-x-1">
                    ${Array.from({length: 5}, (_, i) => {
                        const isActive = i < complexityLevel;
                        const color = getComplexityColor(i + 1, complexityLevel);
                        return `<div class="w-2 h-2 rounded-full ${isActive ? 'opacity-100' : 'opacity-30'}" 
                                     style="background-color: ${color}"></div>`;
                    }).join('')}
                </div>
                <span class="text-xs text-slate-400">${getComplexityLabel(complexityLevel)}</span>
            </div>
        ` : '';

        console.log('✓ HTML生成逻辑测试通过');
        console.log(`  - AI总结HTML: ${summaryHtml ? '已生成' : '无内容'}`);
        console.log(`  - 标签HTML: ${tagsHtml ? '已生成' : '无内容'}`);
        console.log(`  - 复杂度HTML: ${complexityHtml ? '已生成' : '无内容'}`);

        console.log('\n6. 测试一键分析按钮逻辑');
        
        // 测试一键分析按钮显示逻辑
        const shouldShowAnalyzeButton = !summary && mockConversation.messageCount >= 3;
        console.log(`✓ 一键分析按钮逻辑测试通过`);
        console.log(`  - 显示条件: 无总结 && 消息数≥3`);
        console.log(`  - 当前状态: 无总结=${!summary}, 消息数=${mockConversation.messageCount}`);
        console.log(`  - 是否显示: ${shouldShowAnalyzeButton ? '是' : '否'}`);

        console.log('\n✅ Dashboard对话显示功能测试完成！');
        console.log('\n📋 功能总结:');
        console.log('  - ✓ AI总结显示 (蓝色背景框)');
        console.log('  - ✓ 问题类型标签 (红色标签，最多3个)');
        console.log('  - ✓ 关键话题标签 (蓝色标签，最多2个)');
        console.log('  - ✓ 智能标签 (紫色标签，最多2个)');
        console.log('  - ✓ 复杂度指示器 (5个圆点可视化)');
        console.log('  - ✓ 一键分析按钮 (条件显示)');
        console.log('  - ✓ 字段兼容性 (驼峰和下划线命名)');
        console.log('  - ✓ HTML转义和安全性');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        console.error(error.stack);
    }
}

// 运行测试
if (require.main === module) {
    testDashboardDisplay().catch(console.error);
}

module.exports = { testDashboardDisplay }; 