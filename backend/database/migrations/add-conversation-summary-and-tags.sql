-- ========================================
-- 对话记录标签化和内容总结功能迁移
-- ========================================

-- 1. 为conversations表添加总结和分析字段
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS summary TEXT,                    -- 对话内容一句话总结
ADD COLUMN IF NOT EXISTS key_topics TEXT[],               -- 关键话题数组
ADD COLUMN IF NOT EXISTS problem_categories TEXT[],       -- 问题类型分类
ADD COLUMN IF NOT EXISTS auto_tags TEXT[],                -- 自动生成的标签
ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '{}',     -- 洞察和建议
ADD COLUMN IF NOT EXISTS sentiment_analysis JSONB DEFAULT '{}', -- 情感分析
ADD COLUMN IF NOT EXISTS complexity_level INTEGER DEFAULT 1 CHECK (complexity_level >= 1 AND complexity_level <= 5), -- 复杂度等级
ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMP,  -- 总结生成时间
ADD COLUMN IF NOT EXISTS tags_generated_at TIMESTAMP;     -- 标签生成时间

-- 2. 扩展标签表，添加更多分类字段
ALTER TABLE conversation_tags 
ADD COLUMN IF NOT EXISTS tag_type VARCHAR(50) DEFAULT 'custom' CHECK (tag_type IN ('system', 'custom', 'auto', 'problem_type', 'topic', 'sentiment', 'complexity')),
ADD COLUMN IF NOT EXISTS parent_tag_id INTEGER,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;

-- 添加父标签外键约束
ALTER TABLE conversation_tags 
ADD CONSTRAINT fk_parent_tag 
FOREIGN KEY (parent_tag_id) REFERENCES conversation_tags(id) ON DELETE SET NULL;

-- 3. 创建问题类型预定义标签
INSERT INTO conversation_tags (name, display_name, description, color, tag_type, is_system, auto_generated) VALUES
-- 问题类型标签
('business_strategy', '商业策略', '关于商业策略规划和发展方向的讨论', '#FF6B6B', 'problem_type', TRUE, FALSE),
('investment_advice', '投资建议', '投资理财和资产配置相关咨询', '#4ECDC4', 'problem_type', TRUE, FALSE),
('career_development', '职业发展', '职业规划和技能提升相关问题', '#45B7D1', 'problem_type', TRUE, FALSE),
('leadership_management', '领导管理', '团队管理和领导力发展', '#96CEB4', 'problem_type', TRUE, FALSE),
('technology_innovation', '技术创新', '技术趋势和创新应用讨论', '#FFEAA7', 'problem_type', TRUE, FALSE),
('market_analysis', '市场分析', '市场趋势和竞争分析', '#DDA0DD', 'problem_type', TRUE, FALSE),
('personal_growth', '个人成长', '个人发展和自我提升', '#FFB6C1', 'problem_type', TRUE, FALSE),
('financial_planning', '财务规划', '财务管理和规划建议', '#87CEEB', 'problem_type', TRUE, FALSE),

-- 复杂度标签
('complexity_basic', '基础问题', '简单直接的问题', '#E8F5E8', 'complexity', TRUE, TRUE),
('complexity_intermediate', '中等复杂', '需要一定分析的问题', '#FFF8DC', 'complexity', TRUE, TRUE),
('complexity_advanced', '高度复杂', '需要深度分析的复杂问题', '#FFE4E1', 'complexity', TRUE, TRUE),

-- 情感标签
('sentiment_positive', '积极正面', '积极乐观的对话氛围', '#90EE90', 'sentiment', TRUE, TRUE),
('sentiment_neutral', '中性客观', '客观理性的讨论', '#F0F8FF', 'sentiment', TRUE, TRUE),
('sentiment_concerned', '关注担忧', '表达担忧或关注的对话', '#FFE4B5', 'sentiment', TRUE, TRUE),

-- 话题标签
('topic_startup', '创业话题', '创业相关讨论', '#FF7F50', 'topic', TRUE, FALSE),
('topic_ai_tech', 'AI科技', '人工智能和科技发展', '#6A5ACD', 'topic', TRUE, FALSE),
('topic_economics', '经济分析', '经济形势和分析', '#20B2AA', 'topic', TRUE, FALSE),
('topic_education', '教育培训', '教育和学习相关', '#F4A460', 'topic', TRUE, FALSE)

ON CONFLICT (name) DO NOTHING;

-- 4. 创建对话分析结果表
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
);

-- 5. 创建智能标签推荐表
CREATE TABLE IF NOT EXISTS tag_recommendations (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    tag_id INTEGER NOT NULL,
    
    -- 推荐信息
    confidence_score DECIMAL(3,2) NOT NULL,     -- 推荐置信度
    reason TEXT,                                -- 推荐理由
    auto_applied BOOLEAN DEFAULT FALSE,         -- 是否自动应用
    user_feedback VARCHAR(20),                  -- 用户反馈 (accepted, rejected, ignored)
    
    -- 推荐来源
    source VARCHAR(50) DEFAULT 'ai_analysis',   -- 推荐来源
    source_data JSONB DEFAULT '{}',             -- 源数据
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES conversation_tags(id) ON DELETE CASCADE,
    
    -- 唯一约束
    UNIQUE (conversation_id, tag_id)
);

-- 6. 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_conversations_summary ON conversations(summary) WHERE summary IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_key_topics ON conversations USING GIN(key_topics);
CREATE INDEX IF NOT EXISTS idx_conversations_problem_categories ON conversations USING GIN(problem_categories);
CREATE INDEX IF NOT EXISTS idx_conversations_auto_tags ON conversations USING GIN(auto_tags);
CREATE INDEX IF NOT EXISTS idx_conversations_complexity ON conversations(complexity_level);

CREATE INDEX IF NOT EXISTS idx_conversation_tags_type ON conversation_tags(tag_type);
CREATE INDEX IF NOT EXISTS idx_conversation_tags_parent ON conversation_tags(parent_tag_id);
CREATE INDEX IF NOT EXISTS idx_conversation_tags_auto ON conversation_tags(auto_generated);

CREATE INDEX IF NOT EXISTS idx_conversation_analysis_conversation ON conversation_analysis(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_sentiment ON conversation_analysis(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_complexity ON conversation_analysis(complexity_score);

CREATE INDEX IF NOT EXISTS idx_tag_recommendations_conversation ON tag_recommendations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tag_recommendations_confidence ON tag_recommendations(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_tag_recommendations_feedback ON tag_recommendations(user_feedback);

-- 7. 创建触发器自动更新相关字段
CREATE OR REPLACE FUNCTION update_conversation_analysis_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_analysis_timestamp_trigger
    BEFORE UPDATE ON conversation_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_analysis_timestamp();

-- 8. 创建视图便于查询
CREATE OR REPLACE VIEW conversation_with_analysis AS
SELECT 
    c.*,
    ca.summary as ai_summary,
    ca.key_insights,
    ca.main_topics,
    ca.problem_types,
    ca.suggested_actions,
    ca.sentiment_score,
    ca.complexity_score,
    ca.engagement_score,
    ca.auto_tags as analysis_tags,
    ca.created_at as analysis_created_at
FROM conversations c
LEFT JOIN conversation_analysis ca ON c.id = ca.conversation_id;

-- 9. 创建标签统计视图
CREATE OR REPLACE VIEW tag_usage_stats AS
SELECT 
    t.id,
    t.name,
    t.display_name,
    t.tag_type,
    t.color,
    COUNT(ctr.conversation_id) as usage_count,
    AVG(tr.confidence_score) as avg_confidence,
    COUNT(CASE WHEN tr.user_feedback = 'accepted' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN tr.user_feedback = 'rejected' THEN 1 END) as rejected_count
FROM conversation_tags t
LEFT JOIN conversation_tag_relations ctr ON t.id = ctr.tag_id
LEFT JOIN tag_recommendations tr ON t.id = tr.tag_id
GROUP BY t.id, t.name, t.display_name, t.tag_type, t.color
ORDER BY usage_count DESC;

COMMENT ON TABLE conversation_analysis IS '对话分析结果表，存储AI生成的对话总结和分析';
COMMENT ON TABLE tag_recommendations IS '智能标签推荐表，存储AI推荐的标签及用户反馈';
COMMENT ON VIEW conversation_with_analysis IS '包含分析结果的对话视图';
COMMENT ON VIEW tag_usage_stats IS '标签使用统计视图'; 