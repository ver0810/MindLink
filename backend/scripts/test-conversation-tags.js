/**
 * 测试对话标签和总结功能
 */

const ConversationAnalysisService = require('../services/ConversationAnalysisService');
const { Pool } = require('pg');

// 加载环境变量
require('dotenv').config({ path: '../postgresql.env' });

async function testConversationAnalysis() {
    console.log('🔍 开始测试对话标签和总结功能...\n');
    
    const analysisService = new ConversationAnalysisService();
    
    try {
        // 1. 连接数据库
        const pool = new Pool({
            user: process.env.DB_USER || 'ai_mentor_user',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'ai_mentor_system',
            password: process.env.DB_PASSWORD || 'ai_mentor_password_2024',
            port: process.env.DB_PORT || 5432,
        });
        
        const client = await pool.connect();
        console.log('✅ 数据库连接成功');
        
        // 2. 查询现有对话
        const conversationsQuery = `
            SELECT id, title, primary_mentor_name 
            FROM conversations 
            WHERE message_count > 0 
            ORDER BY created_at DESC 
            LIMIT 5
        `;
        
        const conversationsResult = await client.query(conversationsQuery);
        console.log(`📋 找到 ${conversationsResult.rows.length} 个对话记录`);
        
        if (conversationsResult.rows.length === 0) {
            console.log('⚠️  没有找到对话记录，请先创建一些对话');
            client.release();
            await pool.end();
            return;
        }
        
        // 3. 测试分析功能
        for (const conversation of conversationsResult.rows) {
            console.log(`\n🔍 分析对话: ${conversation.title} (ID: ${conversation.id})`);
            
            try {
                const analysis = await analysisService.analyzeConversation(conversation.id);
                
                console.log('✅ 分析完成:');
                console.log(`  📝 总结: ${analysis.summary}`);
                console.log(`  🏷️  问题类型: ${analysis.problem_types.join(', ')}`);
                console.log(`  📊 主要话题: ${analysis.main_topics.join(', ')}`);
                console.log(`  🎯 复杂度: ${analysis.complexity_score}/5`);
                console.log(`  😊 情感得分: ${analysis.sentiment_score}`);
                console.log(`  🔥 参与度: ${analysis.engagement_score}`);
                console.log(`  🏷️  自动标签: ${analysis.auto_tags.join(', ')}`);
                
                if (analysis.key_insights.length > 0) {
                    console.log(`  💡 关键洞察:`);
                    analysis.key_insights.forEach(insight => {
                        console.log(`    - ${insight}`);
                    });
                }
                
                if (analysis.suggested_actions.length > 0) {
                    console.log(`  📋 建议行动:`);
                    analysis.suggested_actions.forEach(action => {
                        console.log(`    - ${action}`);
                    });
                }
                
            } catch (error) {
                console.error(`❌ 分析失败: ${error.message}`);
            }
        }
        
        // 4. 测试标签推荐
        console.log(`\n🏷️  测试标签推荐功能...`);
        
        const firstConversation = conversationsResult.rows[0];
        const recommendationsQuery = `
            SELECT 
                tr.confidence_score,
                tr.reason,
                ct.display_name,
                ct.tag_type
            FROM tag_recommendations tr
            JOIN conversation_tags ct ON tr.tag_id = ct.id
            WHERE tr.conversation_id = $1
            ORDER BY tr.confidence_score DESC
        `;
        
        const recommendationsResult = await client.query(recommendationsQuery, [firstConversation.id]);
        
        if (recommendationsResult.rows.length > 0) {
            console.log(`✅ 找到 ${recommendationsResult.rows.length} 个标签推荐:`);
            recommendationsResult.rows.forEach(rec => {
                console.log(`  🏷️  ${rec.display_name} (${rec.tag_type}) - 置信度: ${Math.round(rec.confidence_score * 100)}%`);
                console.log(`     理由: ${rec.reason}`);
            });
        } else {
            console.log('⚠️  没有找到标签推荐');
        }
        
        // 5. 测试分析结果查询
        console.log(`\n📊 测试分析结果查询...`);
        
        const analysisQuery = `
            SELECT 
                c.title,
                c.summary,
                c.key_topics,
                c.problem_categories,
                c.auto_tags,
                c.complexity_level,
                ca.sentiment_score,
                ca.engagement_score
            FROM conversations c
            LEFT JOIN conversation_analysis ca ON c.id = ca.conversation_id
            WHERE c.summary IS NOT NULL
            LIMIT 3
        `;
        
        const analysisResult = await client.query(analysisQuery);
        
        if (analysisResult.rows.length > 0) {
            console.log(`✅ 找到 ${analysisResult.rows.length} 个已分析的对话:`);
            analysisResult.rows.forEach(row => {
                console.log(`\n  📋 ${row.title}:`);
                console.log(`    📝 总结: ${row.summary}`);
                console.log(`    🏷️  话题: ${row.key_topics ? row.key_topics.join(', ') : '无'}`);
                console.log(`    📊 类型: ${row.problem_categories ? row.problem_categories.join(', ') : '无'}`);
                console.log(`    🎯 复杂度: ${row.complexity_level || 1}/5`);
                if (row.sentiment_score !== null) {
                    console.log(`    😊 情感: ${row.sentiment_score}`);
                }
                if (row.engagement_score !== null) {
                    console.log(`    🔥 参与度: ${row.engagement_score}`);
                }
            });
        } else {
            console.log('⚠️  没有找到已分析的对话');
        }
        
        client.release();
        await pool.end();
        
        console.log('\n🎉 测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    testConversationAnalysis();
}

module.exports = { testConversationAnalysis }; 