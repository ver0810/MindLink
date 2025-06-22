-- SQLite 数据库初始化脚本
-- AI导师对话系统 - 数据库表结构

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建导师表
CREATE TABLE IF NOT EXISTS mentors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    expertise TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建对话表
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    mode TEXT DEFAULT 'single',
    primary_mentor_id TEXT,
    primary_mentor_name TEXT,
    status TEXT DEFAULT 'active',
    tags TEXT DEFAULT '[]',
    metadata TEXT DEFAULT '{}',
    message_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (primary_mentor_id) REFERENCES mentors(id)
);

-- 创建对话消息表
CREATE TABLE IF NOT EXISTS conversation_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text',
    message_order INTEGER NOT NULL,
    mentor_id TEXT,
    mentor_name TEXT,
    status TEXT DEFAULT 'sent',
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_uuid ON conversations(uuid);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_uuid ON conversation_messages(uuid);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_role ON conversation_messages(role);

-- 插入默认导师数据
INSERT OR IGNORE INTO mentors (id, name, title, description, expertise) VALUES
('mayun', '马云', '阿里巴巴创始人', '电商与创业导师', '创业,电商,管理'),
('lijiacheng', '李嘉诚', '长江实业集团主席', '投资与商业导师', '投资,商业,房地产'),
('buffett', '沃伦·巴菲特', '伯克希尔·哈撒韦CEO', '投资大师', '投资,价值投资,股票'),
('zhangxiaolong', '张小龙', '微信之父', '产品设计专家', '产品设计,互联网,用户体验'),
('sheryl-sandberg', '谢丽尔·桑德伯格', '前Facebook COO', '科技领导力专家', '领导力,科技,管理'),
('sam-altman', '萨姆·奥特曼', 'OpenAI CEO', 'AI与创业导师', 'AI,创业,科技创新');

-- 创建默认测试用户（密码: 123456）
INSERT OR IGNORE INTO users (username, email, password_hash) VALUES
('testuser', 'test@example.com', '$2b$10$rOGaHnOQyhpZ1AwDhS5YBOyF6Gy7Ux0ZF5JzKWY6gRJbf4Q.NxX4m');

-- 触发器：自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_conversations_updated_at 
    AFTER UPDATE ON conversations
    FOR EACH ROW
BEGIN
    UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 触发器：自动更新对话消息计数
CREATE TRIGGER IF NOT EXISTS update_conversation_message_count_insert
    AFTER INSERT ON conversation_messages
    FOR EACH ROW
BEGIN
    UPDATE conversations 
    SET message_count = message_count + 1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.conversation_id;
END;

CREATE TRIGGER IF NOT EXISTS update_conversation_message_count_delete
    AFTER DELETE ON conversation_messages
    FOR EACH ROW
BEGIN
    UPDATE conversations 
    SET message_count = message_count - 1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = OLD.conversation_id;
END; 