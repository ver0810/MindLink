/**
 * 检查数据库表结构脚本
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../postgresql.env') });

async function checkTables() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'ai_mentor_system',
        user: process.env.DB_USER || 'ai_mentor_user',
        password: process.env.DB_PASSWORD || 'ai_mentor_password_2024'
    });

    try {
        console.log('检查数据库表结构...\n');

        // 检查conversation_tags表
        console.log('1. conversation_tags表结构:');
        const tagsResult = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'conversation_tags' 
            ORDER BY ordinal_position
        `);

        if (tagsResult.rows.length === 0) {
            console.log('  ❌ 表不存在');
        } else {
            tagsResult.rows.forEach(row => {
                console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
        }

        // 检查是否存在tag_type字段
        const hasTagType = tagsResult.rows.some(row => row.column_name === 'tag_type');
        console.log(`  tag_type字段存在: ${hasTagType ? '✓' : '✗'}`);

        // 检查conversation_analysis表
        console.log('\n2. conversation_analysis表结构:');
        const analysisResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'conversation_analysis' 
            ORDER BY ordinal_position
        `);

        if (analysisResult.rows.length === 0) {
            console.log('  ❌ 表不存在');
        } else {
            console.log(`  ✓ 表存在，包含 ${analysisResult.rows.length} 个字段`);
        }

        // 检查conversations表的分析字段
        console.log('\n3. conversations表的分析字段:');
        const conversationsResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name IN ('summary', 'key_topics', 'problem_categories', 'auto_tags', 'complexity_level')
            ORDER BY column_name
        `);

        if (conversationsResult.rows.length === 0) {
            console.log('  ❌ 没有分析字段');
        } else {
            conversationsResult.rows.forEach(row => {
                console.log(`  - ${row.column_name}: ${row.data_type}`);
            });
        }

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    } finally {
        await pool.end();
    }
}

checkTables(); 