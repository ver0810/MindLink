-- ========================================
-- PostgreSQL数据库架构设计
-- 针对对话记录后端系统的完整数据库方案
-- ========================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ========================================
-- 1. 用户管理
-- ========================================

-- 用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    
    -- 用户资料
    profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{
        "language": "zh-CN",
        "theme": "auto",
        "notifications": true,
        "default_mentor": null
    }',
    
    -- 状态管理
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- 时间追踪
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 用户会话表
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- 设备信息
    device_id VARCHAR(100),
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    location JSONB DEFAULT '{}',
    
    -- 状态管理
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- 2. 导师系统
-- ========================================

-- 导师表
CREATE TABLE mentors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(200),
    
    -- 基础信息
    avatar_url TEXT,
    short_bio TEXT,
    bio TEXT,
    
    -- 专业领域
    expertise TEXT[],
    categories TEXT[],
    
    -- 显示控制
    featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    -- 配置信息
    suggested_questions JSONB DEFAULT '[]',
    prompt_template TEXT,
    personality_config JSONB DEFAULT '{}',
    
    -- 统计信息
    conversation_count INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 3. 对话系统
-- ========================================

-- 对话会话表
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL,
    
    -- 基础信息
    title VARCHAR(500) NOT NULL,
    description TEXT,
    mode VARCHAR(20) DEFAULT 'single' CHECK (mode IN ('single', 'group', 'roundtable')),
    
    -- 导师信息
    primary_mentor_id VARCHAR(50) NOT NULL,
    primary_mentor_name VARCHAR(100) NOT NULL,
    mentors JSONB DEFAULT '[]', -- 多导师支持
    
    -- 状态管理
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    is_favorite BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public')),
    
    -- 统计信息
    message_count INTEGER DEFAULT 0,
    user_message_count INTEGER DEFAULT 0,
    assistant_message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_characters INTEGER DEFAULT 0,
    
    -- 时间追踪
    session_duration INTEGER DEFAULT 0, -- 秒
    first_message_at TIMESTAMP,
    last_message_at TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 质量评估
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback_text TEXT,
    completion_status VARCHAR(20) DEFAULT 'ongoing' CHECK (completion_status IN ('ongoing', 'resolved', 'unresolved')),
    
    -- 元数据
    tags TEXT[], -- PostgreSQL数组类型
    metadata JSONB DEFAULT '{}',
    search_vector TSVECTOR, -- 全文搜索
    
    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (primary_mentor_id) REFERENCES mentors(id) ON DELETE RESTRICT
);

-- 对话消息表
CREATE TABLE conversation_messages (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    conversation_id BIGINT NOT NULL,
    
    -- 消息基础信息
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'function')),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'markdown', 'html', 'json')),
    
    -- 消息序列
    message_order INTEGER NOT NULL,
    thread_id UUID, -- 支持消息分支
    parent_message_id BIGINT, -- 消息树结构
    
    -- AI相关信息
    model_used VARCHAR(100),
    mentor_id VARCHAR(50),
    mentor_name VARCHAR(100),
    prompt_template TEXT,
    completion_tokens INTEGER DEFAULT 0,
    prompt_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- 消息状态
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('draft', 'sending', 'sent', 'delivered', 'failed', 'deleted')),
    is_edited BOOLEAN DEFAULT FALSE,
    edit_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    
    -- 附件和媒体
    attachments JSONB DEFAULT '[]',
    media_urls JSONB DEFAULT '[]',
    
    -- 质量评估
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    is_helpful BOOLEAN,
    feedback_reason TEXT,
    
    -- 性能指标
    processing_time_ms INTEGER,
    response_time_ms INTEGER,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    client_info JSONB DEFAULT '{}', -- 客户端信息
    
    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- 外键约束
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES conversation_messages(id) ON DELETE SET NULL,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE SET NULL
);

-- ========================================
-- 4. 标签和分类系统
-- ========================================

-- 对话标签表
CREATE TABLE conversation_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    category VARCHAR(50) DEFAULT 'custom',
    is_system BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 对话-标签关联表
CREATE TABLE conversation_tag_relations (
    conversation_id BIGINT NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (conversation_id, tag_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES conversation_tags(id) ON DELETE CASCADE
);

-- ========================================
-- 5. 分享和协作
-- ========================================

-- 对话分享表
CREATE TABLE conversation_shares (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    share_token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    shared_by BIGINT NOT NULL,
    
    -- 分享设置
    share_type VARCHAR(20) DEFAULT 'read_only' CHECK (share_type IN ('read_only', 'comment', 'collaborative')),
    password_hash VARCHAR(255),
    max_views INTEGER,
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- 6. 审计和日志
-- ========================================

-- 用户活动日志表
CREATE TABLE user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(30) NOT NULL,
    resource_id BIGINT,
    
    -- 详细信息
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 系统配置表
CREATE TABLE system_configs (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- 7. 索引优化
-- ========================================

-- 用户相关索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status) WHERE status = 'active';
CREATE INDEX idx_users_created_at ON users(created_at);

-- 会话相关索引
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, last_activity_at) WHERE is_active = TRUE;

-- 导师相关索引
CREATE INDEX idx_mentors_featured ON mentors(featured, display_order) WHERE featured = TRUE;
CREATE INDEX idx_mentors_active ON mentors(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_mentors_expertise ON mentors USING GIN(expertise);

-- 对话相关索引
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_last_activity ON conversations(last_activity_at DESC);
CREATE INDEX idx_conversations_mentor ON conversations(primary_mentor_id);
CREATE INDEX idx_conversations_favorite ON conversations(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_conversations_tags ON conversations USING GIN(tags);
CREATE INDEX idx_conversations_search ON conversations USING GIN(search_vector);
CREATE INDEX idx_conversations_user_activity ON conversations(user_id, last_activity_at DESC);

-- 消息相关索引
CREATE INDEX idx_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_messages_order ON conversation_messages(conversation_id, message_order);
CREATE INDEX idx_messages_role ON conversation_messages(role);
CREATE INDEX idx_messages_created_at ON conversation_messages(created_at DESC);
CREATE INDEX idx_messages_thread ON conversation_messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_messages_status ON conversation_messages(status);

-- 日志相关索引
CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON user_activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_resource ON user_activity_logs(resource_type, resource_id);

-- ========================================
-- 8. 触发器和函数
-- ========================================

-- 更新updated_at字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为相关表创建更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversation_messages_updated_at BEFORE UPDATE ON conversation_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentors_updated_at BEFORE UPDATE ON mentors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 更新对话统计信息的触发器函数
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations SET
            message_count = message_count + 1,
            user_message_count = CASE WHEN NEW.role = 'user' THEN user_message_count + 1 ELSE user_message_count END,
            assistant_message_count = CASE WHEN NEW.role = 'assistant' THEN assistant_message_count + 1 ELSE assistant_message_count END,
            total_tokens = total_tokens + COALESCE(NEW.total_tokens, 0),
            total_characters = total_characters + LENGTH(NEW.content),
            last_message_at = NEW.created_at,
            last_activity_at = NEW.created_at,
            first_message_at = CASE WHEN first_message_at IS NULL THEN NEW.created_at ELSE first_message_at END
        WHERE id = NEW.conversation_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations SET
            message_count = message_count - 1,
            user_message_count = CASE WHEN OLD.role = 'user' THEN user_message_count - 1 ELSE user_message_count END,
            assistant_message_count = CASE WHEN OLD.role = 'assistant' THEN assistant_message_count - 1 ELSE assistant_message_count END,
            total_tokens = total_tokens - COALESCE(OLD.total_tokens, 0),
            total_characters = total_characters - LENGTH(OLD.content)
        WHERE id = OLD.conversation_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建统计触发器
CREATE TRIGGER update_conversation_stats_trigger 
    AFTER INSERT OR DELETE ON conversation_messages 
    FOR EACH ROW EXECUTE FUNCTION update_conversation_stats();

-- 更新对话搜索向量的触发器函数
CREATE OR REPLACE FUNCTION update_conversation_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(NEW.primary_mentor_name, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建搜索向量触发器
CREATE TRIGGER update_conversation_search_trigger 
    BEFORE INSERT OR UPDATE OF title, description, primary_mentor_name, tags ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_conversation_search_vector();

-- ========================================
-- 9. 视图定义
-- ========================================

-- 对话摘要视图
CREATE VIEW conversation_summary AS
SELECT 
    c.id,
    c.uuid,
    c.title,
    c.status,
    c.is_favorite,
    c.message_count,
    c.last_activity_at,
    c.created_at,
    u.username,
    u.email,
    m.name as mentor_name,
    m.avatar_url as mentor_avatar,
    c.tags,
    c.satisfaction_rating
FROM conversations c
JOIN users u ON c.user_id = u.id
JOIN mentors m ON c.primary_mentor_id = m.id
WHERE c.deleted_at IS NULL AND u.status = 'active';

-- 用户活动统计视图
CREATE VIEW user_activity_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(c.id) as total_conversations,
    COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_conversations,
    SUM(c.message_count) as total_messages,
    AVG(c.satisfaction_rating) as avg_satisfaction,
    MAX(c.last_activity_at) as last_conversation_activity,
    u.created_at as user_created_at
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id AND c.deleted_at IS NULL
WHERE u.status = 'active'
GROUP BY u.id, u.username, u.email, u.created_at;

-- ========================================
-- 10. 初始数据
-- ========================================

-- 插入系统配置
INSERT INTO system_configs (key, value, description, is_public) VALUES
('app_version', '"1.0.0"', '应用版本', TRUE),
('max_conversation_length', '100', '单个对话最大消息数', FALSE),
('default_mentor', '"buffett"', '默认导师ID', TRUE),
('feature_flags', '{"conversation_sharing": true, "multi_mentor": false}', '功能开关', FALSE);

-- 插入系统标签
INSERT INTO conversation_tags (name, display_name, description, color, is_system) VALUES
('business', '商业策略', '关于商业策略和运营的对话', '#10B981', TRUE),
('investment', '投资理财', '关于投资和理财的对话', '#F59E0B', TRUE),
('technology', '科技创新', '关于技术和创新的对话', '#3B82F6', TRUE),
('leadership', '领导力', '关于领导力和管理的对话', '#8B5CF6', TRUE),
('career', '职业发展', '关于职业规划和发展的对话', '#EF4444', TRUE),
('startup', '创业', '关于创业相关的对话', '#06B6D4', TRUE);

-- 完成
COMMENT ON DATABASE postgres IS 'AI导师对话系统数据库'; 