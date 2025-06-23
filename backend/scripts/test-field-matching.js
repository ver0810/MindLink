/**
 * 测试数据库字段和前端字段匹配情况
 */

const ConversationService = require('../services/ConversationService');
const { Pool } = require('pg');

// 加载环境变量
require('dotenv').config({ path: '../postgresql.env' });

// 数据库连接配置
const pool = new Pool({
    user: process.env.DB_USER || 'ai_mentor_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ai_mentor_system',
    password: process.env.DB_PASSWORD || 'ai_mentor_password_2024',
    port: process.env.DB_PORT || 5432,
});

async function testFieldMatching() {
    console.log('🔍 开始测试数据库字段和前端字段匹配情况...\n');
    
    try {
        // 1. 测试数据库连接
        const client = await pool.connect();
        console.log('✅ 数据库连接成功');
        
        // 2. 查询一个对话记录
        const conversationQuery = `
            SELECT 
                id, uuid, title, description, mode,
                primary_mentor_id, primary_mentor_name, mentors,
                status, is_favorite, is_pinned, message_count,
                last_message_at, last_activity_at, created_at, updated_at,
                tags, metadata
            FROM conversations 
            WHERE message_count > 0 
            LIMIT 1
        `;
        
        const conversationResult = await client.query(conversationQuery);
        
        if (conversationResult.rows.length === 0) {
            console.log('⚠️  没有找到对话记录，创建测试数据...');
            
            // 创建测试用户
            const userResult = await client.query(`
                INSERT INTO users (username, email, password_hash, salt)
                VALUES ('test_user', 'test@example.com', 'test_hash', 'test_salt')
                ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
                RETURNING id
            `);
            
            const userId = userResult.rows[0].id;
            
            // 创建测试对话
            const testConversationResult = await client.query(`
                INSERT INTO conversations (
                    user_id, title, primary_mentor_id, primary_mentor_name,
                    mode, status, message_count
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [userId, '测试对话', 'buffett', '沃伦·巴菲特', 'single', 'active', 5]);
            
            console.log('✅ 创建测试对话成功');
            
            // 重新查询
            const retryResult = await client.query(conversationQuery);
            if (retryResult.rows.length > 0) {
                console.log('✅ 找到测试对话记录');
            }
        }
        
        // 3. 测试ConversationService格式化
        const conversationService = new ConversationService();
        const rawConversation = conversationResult.rows[0] || 
            (await client.query(conversationQuery)).rows[0];
        
        if (!rawConversation) {
            console.log('❌ 无法获取对话记录');
            return;
        }
        
        console.log('\n📊 原始数据库记录：');
        console.log('- ID:', rawConversation.id);
        console.log('- 标题:', rawConversation.title);
        console.log('- 消息数量 (message_count):', rawConversation.message_count);
        console.log('- 创建时间 (created_at):', rawConversation.created_at);
        console.log('- 更新时间 (updated_at):', rawConversation.updated_at);
        console.log('- 导师名称 (primary_mentor_name):', rawConversation.primary_mentor_name);
        
        // 4. 格式化响应
        const formattedResponse = conversationService.formatConversationResponse(rawConversation);
        
        console.log('\n🔄 格式化后的响应：');
        console.log('- ID:', formattedResponse.id);
        console.log('- 标题:', formattedResponse.title);
        console.log('- 消息数量 (messageCount):', formattedResponse.messageCount);
        console.log('- 消息数量 (message_count):', formattedResponse.message_count);
        console.log('- 创建时间 (createdAt):', formattedResponse.createdAt);
        console.log('- 创建时间 (created_at):', formattedResponse.created_at);
        console.log('- 导师名称 (mentorName):', formattedResponse.mentorName);
        console.log('- 导师名称 (mentor_name):', formattedResponse.mentor_name);
        
        // 5. 验证字段匹配
        console.log('\n✅ 字段匹配验证：');
        
        const checks = [
            {
                name: '消息数量字段',
                condition: formattedResponse.messageCount === formattedResponse.message_count,
                expected: rawConversation.message_count,
                actual: formattedResponse.messageCount
            },
            {
                name: '创建时间字段',
                condition: formattedResponse.createdAt === formattedResponse.created_at,
                expected: rawConversation.created_at,
                actual: formattedResponse.createdAt
            },
            {
                name: '导师名称字段',
                condition: formattedResponse.mentorName === formattedResponse.mentor_name,
                expected: rawConversation.primary_mentor_name,
                actual: formattedResponse.mentorName
            }
        ];
        
        let allPassed = true;
        checks.forEach(check => {
            if (check.condition) {
                console.log(`  ✅ ${check.name}: 匹配成功`);
            } else {
                console.log(`  ❌ ${check.name}: 不匹配`);
                console.log(`     期望: ${check.expected}`);
                console.log(`     实际: ${check.actual}`);
                allPassed = false;
            }
        });
        
        if (allPassed) {
            console.log('\n🎉 所有字段匹配检查通过！');
        } else {
            console.log('\n⚠️  存在字段不匹配问题');
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        await pool.end();
    }
}

// 运行测试
if (require.main === module) {
    testFieldMatching();
}

module.exports = { testFieldMatching }; 