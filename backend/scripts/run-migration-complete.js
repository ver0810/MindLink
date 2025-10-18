/**
 * 完整数据库迁移脚本 - 创建所有分析相关的表和字段
 */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// 加载环境变量
require("dotenv").config({ path: path.join(__dirname, "../postgresql.env") });

async function runCompleteMigration() {
  console.log("开始运行完整数据库迁移...\n");

  // 数据库连接配置
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "ai_mentor_system",
    user: process.env.DB_USER || "ai_mentor_user",
    password: process.env.DB_PASSWORD || "ai_mentor_password_2024",
  };

  console.log("数据库连接配置:");
  console.log(`  - 主机: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`  - 数据库: ${dbConfig.database}`);
  console.log(`  - 用户: ${dbConfig.user}`);
  console.log("");

  const pool = new Pool(dbConfig);

  try {
    // 1. 测试数据库连接
    console.log("1. 测试数据库连接...");
    const testResult = await pool.query("SELECT NOW() as current_time");
    console.log(
      `✓ 数据库连接成功，当前时间: ${testResult.rows[0].current_time}`
    );

    // 2. 创建conversation_tags表（如果不存在）
    console.log("2. 创建conversation_tags表...");
    await pool.query(`
            CREATE TABLE IF NOT EXISTS conversation_tags (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                display_name VARCHAR(200) NOT NULL,
                description TEXT,
                color VARCHAR(20) DEFAULT '#6B7280',

                -- 标签分类
                tag_type VARCHAR(50) DEFAULT 'custom' CHECK (tag_type IN ('system', 'custom', 'auto', 'problem_type', 'topic', 'sentiment', 'complexity')),
                parent_tag_id INTEGER,
                priority INTEGER DEFAULT 0,
                auto_generated BOOLEAN DEFAULT FALSE,

                -- 系统字段
                is_system BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (parent_tag_id) REFERENCES conversation_tags(id) ON DELETE SET NULL
            )
        `);
    console.log("✓ conversation_tags表创建完成");

    // 3. 创建conversation_tag_relations表
    console.log("3. 创建conversation_tag_relations表...");
    await pool.query(`
            CREATE TABLE IF NOT EXISTS conversation_tag_relations (
                id SERIAL PRIMARY KEY,
                conversation_id BIGINT NOT NULL,
                tag_id INTEGER NOT NULL,

                -- 关联信息
                applied_by VARCHAR(50) DEFAULT 'system',
                confidence_score DECIMAL(3,2),
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES conversation_tags(id) ON DELETE CASCADE,

                UNIQUE (conversation_id, tag_id)
            )
        `);
    console.log("✓ conversation_tag_relations表创建完成");

    // 4. 创建conversation_analysis表
    console.log("4. 创建conversation_analysis表...");
    await pool.query(`
            CREATE TABLE IF NOT EXISTS conversation_analysis (
                id BIGSERIAL PRIMARY KEY,
                conversation_id BIGINT NOT NULL,

                -- 分析结果
                summary TEXT NOT NULL,
                key_insights TEXT[],
                main_topics TEXT[],
                problem_types TEXT[],
                suggested_actions TEXT[],

                -- 分析指标
                sentiment_score DECIMAL(3,2),
                complexity_score INTEGER,
                engagement_score DECIMAL(3,2),

                -- 自动生成的标签
                auto_tags JSONB DEFAULT '[]',
                confidence_scores JSONB DEFAULT '{}',

                -- 元数据
                analysis_version VARCHAR(20) DEFAULT 'v1.0',
                model_used VARCHAR(100),
                processing_time_ms INTEGER,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                UNIQUE (conversation_id)
            )
        `);
    console.log("✓ conversation_analysis表创建完成");

    // 5. 创建tag_recommendations表
    console.log("5. 创建tag_recommendations表...");
    await pool.query(`
            CREATE TABLE IF NOT EXISTS tag_recommendations (
                id BIGSERIAL PRIMARY KEY,
                conversation_id BIGINT NOT NULL,
                tag_id INTEGER NOT NULL,

                confidence_score DECIMAL(3,2) NOT NULL,
                reason TEXT,
                auto_applied BOOLEAN DEFAULT FALSE,
                user_feedback VARCHAR(20),

                source VARCHAR(50) DEFAULT 'ai_analysis',
                source_data JSONB DEFAULT '{}',

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES conversation_tags(id) ON DELETE CASCADE,

                UNIQUE (conversation_id, tag_id)
            )
        `);
    console.log("✓ tag_recommendations表创建完成");

    // 6. 为conversations表添加分析字段
    console.log("6. 为conversations表添加分析字段...");
    const alterQueries = [
      "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT",
      "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS key_topics TEXT[]",
      "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS problem_categories TEXT[]",
      "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS auto_tags TEXT[]",
      "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '{}'",
      "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sentiment_analysis JSONB DEFAULT '{}'",
      "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS complexity_level INTEGER DEFAULT 1 CHECK (complexity_level >= 1 AND complexity_level <= 5)",
      "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMP",
      "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags_generated_at TIMESTAMP",
    ];

    for (const query of alterQueries) {
      try {
        await pool.query(query);
      } catch (error) {
        if (!error.message.includes("already exists")) {
          console.warn(`警告: ${error.message}`);
        }
      }
    }
    console.log("✓ conversations表字段添加完成");

    // 7. 插入预定义标签
    console.log("7. 插入预定义标签...");
    const tagInsertQuery = `
            INSERT INTO conversation_tags (name, display_name, description, color, tag_type, is_system, auto_generated) VALUES
            -- 问题类型标签
            ('learning_strategy', '学习策略', '关于学习方法和学习规划的讨论', '#FF6B6B', 'problem_type', TRUE, FALSE),
            ('memory_retention', '记忆巩固', '记忆技巧和遗忘曲线相关咨询', '#4ECDC4', 'problem_type', TRUE, FALSE),
            ('exam_preparation', '考试备考', '考试准备和应试技巧相关问题', '#45B7D1', 'problem_type', TRUE, FALSE),
            ('concept_understanding', '概念理解', '知识点理解和概念辨析', '#96CEB4', 'problem_type', TRUE, FALSE),
            ('knowledge_application', '知识应用', '知识实践和项目应用讨论', '#FFEAA7', 'problem_type', TRUE, FALSE),
            ('study_habits', '学习习惯', '学习习惯养成和时间管理', '#DDA0DD', 'problem_type', TRUE, FALSE),
            ('personal_growth', '个人成长', '个人发展和自我提升', '#FFB6C1', 'problem_type', TRUE, FALSE),
            ('learning_difficulties', '学习困难', '学习障碍和难点突破', '#87CEEB', 'problem_type', TRUE, FALSE),

            -- 复杂度标签
            ('complexity_basic', '基础问题', '简单直接的问题', '#E8F5E8', 'complexity', TRUE, TRUE),
            ('complexity_intermediate', '中等复杂', '需要一定分析的问题', '#FFF8DC', 'complexity', TRUE, TRUE),
            ('complexity_advanced', '高度复杂', '需要深度分析的复杂问题', '#FFE4E1', 'complexity', TRUE, TRUE),

            -- 情感标签
            ('sentiment_positive', '积极正面', '积极乐观的对话氛围', '#90EE90', 'sentiment', TRUE, TRUE),
            ('sentiment_neutral', '中性客观', '客观理性的讨论', '#F0F8FF', 'sentiment', TRUE, TRUE),
            ('sentiment_concerned', '关注担忧', '表达担忧或关注的对话', '#FFE4B5', 'sentiment', TRUE, TRUE),

            -- 话题标签
            ('topic_education', '教育话题', '教育理论和教学方法讨论', '#FF7F50', 'topic', TRUE, FALSE),
            ('topic_learning_science', '学习科学', '学习心理学和认知科学', '#6A5ACD', 'topic', TRUE, FALSE),
            ('topic_skill_development', '技能发展', '技能提升和能力培养', '#20B2AA', 'topic', TRUE, FALSE),
            ('topic_knowledge_management', '知识管理', '知识整理和体系构建', '#F4A460', 'topic', TRUE, FALSE)

            ON CONFLICT (name) DO NOTHING
        `;

    await pool.query(tagInsertQuery);
    console.log("✓ 预定义标签插入完成");

    // 8. 创建索引
    console.log("8. 创建索引...");
    const indexQueries = [
      // conversation_analysis表索引
      "CREATE INDEX IF NOT EXISTS idx_conversation_analysis_conversation ON conversation_analysis(conversation_id)",
      "CREATE INDEX IF NOT EXISTS idx_conversation_analysis_sentiment ON conversation_analysis(sentiment_score)",
      "CREATE INDEX IF NOT EXISTS idx_conversation_analysis_complexity ON conversation_analysis(complexity_score)",

      // conversation_tags表索引
      "CREATE INDEX IF NOT EXISTS idx_conversation_tags_type ON conversation_tags(tag_type)",
      "CREATE INDEX IF NOT EXISTS idx_conversation_tags_parent ON conversation_tags(parent_tag_id)",
      "CREATE INDEX IF NOT EXISTS idx_conversation_tags_auto ON conversation_tags(auto_generated)",

      // conversation_tag_relations表索引
      "CREATE INDEX IF NOT EXISTS idx_tag_relations_conversation ON conversation_tag_relations(conversation_id)",
      "CREATE INDEX IF NOT EXISTS idx_tag_relations_tag ON conversation_tag_relations(tag_id)",

      // tag_recommendations表索引
      "CREATE INDEX IF NOT EXISTS idx_tag_recommendations_conversation ON tag_recommendations(conversation_id)",
      "CREATE INDEX IF NOT EXISTS idx_tag_recommendations_confidence ON tag_recommendations(confidence_score DESC)",

      // conversations表分析字段索引
      "CREATE INDEX IF NOT EXISTS idx_conversations_summary ON conversations(summary) WHERE summary IS NOT NULL",
      "CREATE INDEX IF NOT EXISTS idx_conversations_key_topics ON conversations USING GIN(key_topics)",
      "CREATE INDEX IF NOT EXISTS idx_conversations_problem_categories ON conversations USING GIN(problem_categories)",
      "CREATE INDEX IF NOT EXISTS idx_conversations_auto_tags ON conversations USING GIN(auto_tags)",
      "CREATE INDEX IF NOT EXISTS idx_conversations_complexity ON conversations(complexity_level)",
    ];

    for (const query of indexQueries) {
      try {
        await pool.query(query);
      } catch (error) {
        console.warn(`索引创建警告: ${error.message}`);
      }
    }
    console.log("✓ 索引创建完成");

    // 9. 创建触发器
    console.log("9. 创建触发器...");
    try {
      // conversation_analysis表更新时间触发器
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

      // conversation_tags表更新时间触发器
      await pool.query(`
                DROP TRIGGER IF EXISTS update_conversation_tags_timestamp_trigger ON conversation_tags
            `);

      await pool.query(`
                CREATE TRIGGER update_conversation_tags_timestamp_trigger
                    BEFORE UPDATE ON conversation_tags
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column()
            `);

      console.log("✓ 触发器创建完成");
    } catch (error) {
      console.warn(`触发器创建警告: ${error.message}`);
    }

    // 10. 验证所有表结构
    console.log("10. 验证表结构...");

    const tables = [
      "conversation_tags",
      "conversation_analysis",
      "conversation_tag_relations",
      "tag_recommendations",
    ];

    for (const tableName of tables) {
      const result = await pool.query(
        `
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `,
        [tableName]
      );

      console.log(`✓ ${tableName}表结构:`);
      result.rows.forEach((row) => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }

    // 11. 验证预定义标签
    console.log("\n11. 验证预定义标签...");
    const tagsResult = await pool.query(`
            SELECT name, display_name, tag_type, color
            FROM conversation_tags
            WHERE is_system = TRUE
            ORDER BY tag_type, name
        `);

    console.log(`✓ 已插入 ${tagsResult.rows.length} 个预定义标签:`);
    tagsResult.rows.forEach((row) => {
      console.log(`  - ${row.name} (${row.tag_type}): ${row.display_name}`);
    });

    console.log("\n✅ 完整数据库迁移完成！");
    console.log("现在可以正常使用对话分析功能了。");
  } catch (error) {
    console.error("❌ 迁移失败:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 运行迁移
if (require.main === module) {
  runCompleteMigration().catch((error) => {
    console.error("迁移执行失败:", error);
    process.exit(1);
  });
}

module.exports = { runCompleteMigration };
