/**
 * 修复conversation_tags表结构脚本
 */

const { Pool } = require("pg");
require("dotenv").config({
  path: require("path").join(__dirname, "../postgresql.env"),
});

async function fixConversationTags() {
  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "ai_mentor_system",
    user: process.env.DB_USER || "ai_mentor_user",
    password: process.env.DB_PASSWORD || "ai_mentor_password_2024",
  });

  try {
    console.log("开始修复conversation_tags表结构...\n");

    // 1. 添加缺失的字段
    console.log("1. 添加缺失的字段...");

    const alterQueries = [
      "ALTER TABLE conversation_tags ADD COLUMN IF NOT EXISTS tag_type VARCHAR(50) DEFAULT 'custom' CHECK (tag_type IN ('system', 'custom', 'auto', 'problem_type', 'topic', 'sentiment', 'complexity'))",
      "ALTER TABLE conversation_tags ADD COLUMN IF NOT EXISTS parent_tag_id INTEGER",
      "ALTER TABLE conversation_tags ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0",
      "ALTER TABLE conversation_tags ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE",
    ];

    for (const query of alterQueries) {
      try {
        await pool.query(query);
        console.log(`  ✓ ${query.split(" ")[5]} 字段添加成功`);
      } catch (error) {
        if (error.message.includes("already exists")) {
          console.log(`  - ${query.split(" ")[5]} 字段已存在`);
        } else {
          console.warn(
            `  ⚠️ ${query.split(" ")[5]} 字段添加警告: ${error.message}`
          );
        }
      }
    }

    // 2. 添加外键约束
    console.log("\n2. 添加外键约束...");
    try {
      await pool.query(`
                ALTER TABLE conversation_tags
                ADD CONSTRAINT fk_parent_tag
                FOREIGN KEY (parent_tag_id) REFERENCES conversation_tags(id) ON DELETE SET NULL
            `);
      console.log("  ✓ 外键约束添加成功");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("  - 外键约束已存在");
      } else {
        console.warn(`  ⚠️ 外键约束添加警告: ${error.message}`);
      }
    }

    // 3. 插入预定义标签
    console.log("\n3. 插入预定义标签...");

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

    try {
      const result = await pool.query(tagInsertQuery);
      console.log("  ✓ 预定义标签插入成功");
    } catch (error) {
      console.warn(`  ⚠️ 标签插入警告: ${error.message}`);
    }

    // 4. 创建其他必要的表
    console.log("\n4. 创建其他必要的表...");

    // conversation_tag_relations表
    try {
      await pool.query(`
                CREATE TABLE IF NOT EXISTS conversation_tag_relations (
                    id SERIAL PRIMARY KEY,
                    conversation_id BIGINT NOT NULL,
                    tag_id INTEGER NOT NULL,

                    applied_by VARCHAR(50) DEFAULT 'system',
                    confidence_score DECIMAL(3,2),
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES conversation_tags(id) ON DELETE CASCADE,

                    UNIQUE (conversation_id, tag_id)
                )
            `);
      console.log("  ✓ conversation_tag_relations表创建成功");
    } catch (error) {
      console.warn(
        `  ⚠️ conversation_tag_relations表创建警告: ${error.message}`
      );
    }

    // tag_recommendations表
    try {
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
      console.log("  ✓ tag_recommendations表创建成功");
    } catch (error) {
      console.warn(`  ⚠️ tag_recommendations表创建警告: ${error.message}`);
    }

    // 5. 创建索引
    console.log("\n5. 创建索引...");
    const indexQueries = [
      "CREATE INDEX IF NOT EXISTS idx_conversation_tags_type ON conversation_tags(tag_type)",
      "CREATE INDEX IF NOT EXISTS idx_conversation_tags_parent ON conversation_tags(parent_tag_id)",
      "CREATE INDEX IF NOT EXISTS idx_conversation_tags_auto ON conversation_tags(auto_generated)",
      "CREATE INDEX IF NOT EXISTS idx_tag_relations_conversation ON conversation_tag_relations(conversation_id)",
      "CREATE INDEX IF NOT EXISTS idx_tag_relations_tag ON conversation_tag_relations(tag_id)",
      "CREATE INDEX IF NOT EXISTS idx_tag_recommendations_conversation ON tag_recommendations(conversation_id)",
      "CREATE INDEX IF NOT EXISTS idx_tag_recommendations_confidence ON tag_recommendations(confidence_score DESC)",
    ];

    for (const query of indexQueries) {
      try {
        await pool.query(query);
      } catch (error) {
        console.warn(`  ⚠️ 索引创建警告: ${error.message}`);
      }
    }
    console.log("  ✓ 索引创建完成");

    // 6. 验证修复结果
    console.log("\n6. 验证修复结果...");

    const verifyResult = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'conversation_tags'
            AND column_name IN ('tag_type', 'parent_tag_id', 'priority', 'auto_generated')
            ORDER BY column_name
        `);

    console.log("  ✓ 新增字段验证:");
    verifyResult.rows.forEach((row) => {
      console.log(`    - ${row.column_name}: ${row.data_type}`);
    });

    // 验证标签数量
    const tagsCount = await pool.query(`
            SELECT COUNT(*) as count, tag_type
            FROM conversation_tags
            WHERE is_system = TRUE
            GROUP BY tag_type
            ORDER BY tag_type
        `);

    console.log("  ✓ 预定义标签统计:");
    tagsCount.rows.forEach((row) => {
      console.log(`    - ${row.tag_type}: ${row.count}个`);
    });

    console.log("\n✅ conversation_tags表修复完成！");
    console.log("现在可以正常使用对话分析功能了。");
  } catch (error) {
    console.error("❌ 修复失败:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixConversationTags();
