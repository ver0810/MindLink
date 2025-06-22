const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // 加载环境变量

// 导入PostgreSQL配置
const { pgConfig } = require('./config/postgresql');

// 导入路由
const authRoutes = require('./routes/auth');
const databaseRoutes = require('./routes/database');
const conversationRoutes = require('./routes/conversations');
const conversationHistoryRoutes = require('./routes/conversation-history');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 静态文件服务（可选）
app.use(express.static(path.join(__dirname, '../public')));
app.use('/pages', express.static(path.join(__dirname, '../pages')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/conversations', conversationHistoryRoutes); // 对话历史API (放在前面，优先匹配)
app.use('/api/conversations', conversationRoutes);

// 健康检查接口
app.get('/health', async (req, res) => {
    try {
        // 检查PostgreSQL连接状态
        const dbHealth = await pgConfig.healthCheck();
        
        res.json({
            success: true,
            message: '服务器运行正常',
            timestamp: new Date().toISOString(),
            database: dbHealth,
            version: '1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '服务器健康检查失败',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 启动服务器
async function startServer() {
    try {
        // 初始化PostgreSQL连接
        console.log('🔧 正在初始化PostgreSQL连接...');
        await pgConfig.initialize();
        
        // 导入导师数据
        console.log('📥 正在导入导师数据...');
        await pgConfig.importMentorData();
        
        // 启动HTTP服务器
        app.listen(PORT, () => {
            console.log(`🎉 AI导师对话系统启动成功！`);
            console.log(`📍 服务地址: http://localhost:${PORT}`);
            console.log(`🔗 API接口:`);
            console.log(`   - 认证: http://localhost:${PORT}/api/auth`);
            console.log(`   - 对话: http://localhost:${PORT}/api/conversations`);
            console.log(`   - 历史: http://localhost:${PORT}/api/conversations/history`);
            console.log(`   - 数据库: http://localhost:${PORT}/api/database`);
            console.log(`💓 健康检查: http://localhost:${PORT}/health`);
            console.log(`🗄️  数据库: PostgreSQL ${process.env.DB_NAME || 'ai_mentor_system'}`);
        });
        
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🛑 正在关闭服务器...');
    try {
        await pgConfig.close();
        console.log('✅ PostgreSQL连接已关闭');
        process.exit(0);
    } catch (error) {
        console.error('❌ 关闭过程中出错:', error);
        process.exit(1);
    }
});

// 启动服务器
startServer();

module.exports = app; 