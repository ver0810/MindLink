/**
 * 数据库迁移脚本 - 创建conversation_analysis表
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../postgresql.env') });

async function runMigration() {
    console.log('开始运行数据库迁移...\n');

    // 数据库连接配置 - 使用环境变量或默认值
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'ai_mentor_system',
        user: process.env.DB_USER || 'ai_mentor_user',
        password: process.env.DB_PASSWORD || 'ai_mentor_password_2024'
    };

    console.log('数据库连接配置:');
    console.log(`  - 主机: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`  - 数据库: ${dbConfig.database}`);
    console.log(`  - 用户: ${dbConfig.user}`);
    console.log('');

    const pool = new Pool(dbConfig);

    try {
        // 1. 测试数据库连接
        console.log('1. 测试数据库连接...');
        const testResult = await pool.query('SELECT NOW() as current_time');
        console.log(`✓ 数据库连接成功，当前时间: ${testResult.rows[0].current_time}`);

        // 2. 检查conversation_analysis表是否存在
        console.log('2. 检查conversation_analysis表是否存在...');
        const checkResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'conversation_analysis'
        `);

        if (checkResult.rows.length > 0) {
            console.log('✓ conversation_analysis表已存在，无需迁移');
            
            // 检查表结构
            const columnsResult = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'conversation_analysis' 
                ORDER BY ordinal_position
            `);
            
            console.log('✓ 当前表结构:');
            columnsResult.rows.forEach(row => {
                console.log(`  - ${row.column_name}: ${row.data_type}`);
            });
            return;
        }

        console.log('✗ conversation_analysis表不存在，开始创建...\n');

        // 3. 直接创建conversation_analysis表（核心表）
        console.log('3. 创建conversation_analysis表...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS conversation_analysis (
                id BIGSERIAL PRIMARY KEY,
                conversation_id BIGINT NOT NULL,
                
                -- 分析结果
                summary TEXT NOT NULL,                      -- 一句话总结
                key_insights TEXT[],                        -- 关键洞察
                main_topics TEXT[],                         -- 主要话题
                problem_types TEXT[],                       -- 问题类型
                suggested_actions TEXT[],                   -- 建议行动
                
                -- 分析指标
                sentiment_score DECIMAL(3,2),               -- 情感得分 (-1 到 1)
                complexity_score INTEGER,                   -- 复杂度得分 (1-5)
                engagement_score DECIMAL(3,2),              -- 参与度得分 (0-1)
                
                -- 自动生成的标签
                auto_tags JSONB DEFAULT '[]',               -- 自动标签
                confidence_scores JSONB DEFAULT '{}',       -- 置信度得分
                
                -- 元数据
                analysis_version VARCHAR(20) DEFAULT 'v1.0',
                model_used VARCHAR(100),
                processing_time_ms INTEGER,
                
                -- 审计字段
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- 外键约束
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                
                -- 唯一约束：每个对话只有一个最新分析
                UNIQUE (conversation_id)
            )
        `);
        console.log('✓ conversation_analysis表创建成功');

        // 4. 为conversations表添加缺失的分析字段
        console.log('4. 为conversations表添加分析字段...');
        
        const alterQueries = [
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT",
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS key_topics TEXT[]",
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS problem_categories TEXT[]",
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS auto_tags TEXT[]",
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '{}'",
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sentiment_analysis JSONB DEFAULT '{}'",
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS complexity_level INTEGER DEFAULT 1 CHECK (complexity_level >= 1 AND complexity_level <= 5)",
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMP",
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags_generated_at TIMESTAMP"
        ];

        for (const query of alterQueries) {
            try {
                await pool.query(query);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.warn(`警告: ${error.message}`);
                }
            }
        }
        console.log('✓ conversations表字段添加完成');

        // 5. 创建索引
        console.log('5. 创建索引...');
        const indexQueries = [
            "CREATE INDEX IF NOT EXISTS idx_conversation_analysis_conversation ON conversation_analysis(conversation_id)",
            "CREATE INDEX IF NOT EXISTS idx_conversation_analysis_sentiment ON conversation_analysis(sentiment_score)",
            "CREATE INDEX IF NOT EXISTS idx_conversation_analysis_complexity ON conversation_analysis(complexity_score)",
            "CREATE INDEX IF NOT EXISTS idx_conversations_summary ON conversations(summary) WHERE summary IS NOT NULL",
            "CREATE INDEX IF NOT EXISTS idx_conversations_key_topics ON conversations USING GIN(key_topics)",
            "CREATE INDEX IF NOT EXISTS idx_conversations_problem_categories ON conversations USING GIN(problem_categories)",
            "CREATE INDEX IF NOT EXISTS idx_conversations_auto_tags ON conversations USING GIN(auto_tags)",
            "CREATE INDEX IF NOT EXISTS idx_conversations_complexity ON conversations(complexity_level)"
        ];

        for (const query of indexQueries) {
            try {
                await pool.query(query);
            } catch (error) {
                console.warn(`索引创建警告: ${error.message}`);
            }
        }
        console.log('✓ 索引创建完成');

        // 6. 创建更新时间触发器
        console.log('6. 创建触发器...');
        try {
            await pool.query(`
                CREATE OR REPLACE FUNCTION update_conversation_analysis_timestamp()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql
            `);

            await pool.query(`
                DROP TRIGGER IF EXISTS update_conversation_analysis_timestamp_trigger ON conversation_analysis
            `);

            await pool.query(`
                CREATE TRIGGER update_conversation_analysis_timestamp_trigger
                    BEFORE UPDATE ON conversation_analysis
                    FOR EACH ROW
                    EXECUTE FUNCTION update_conversation_analysis_timestamp()
            `);
            console.log('✓ 触发器创建完成');
        } catch (error) {
            console.warn(`触发器创建警告: ${error.message}`);
        }

        // 7. 验证表结构
        console.log('7. 验证表结构...');
        const verifyResult = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'conversation_analysis' 
            ORDER BY ordinal_position
        `);

        console.log('✓ conversation_analysis表结构:');
        verifyResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // 8. 验证conversations表的新字段
        console.log('\n8. 验证conversations表的分析字段...');
        const conversationsFields = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name IN ('summary', 'key_topics', 'problem_categories', 'auto_tags', 'complexity_level')
            ORDER BY column_name
        `);

        console.log('✓ conversations表分析字段:');
        conversationsFields.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });

        console.log('\n✅ 数据库迁移完成！');
        console.log('现在可以使用对话分析功能了。');

    } catch (error) {
        console.error('❌ 迁移失败:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// 运行迁移
if (require.main === module) {
    runMigration().catch(error => {
        console.error('迁移执行失败:', error);
        process.exit(1);
    });
}

module.exports = { runMigration }; 