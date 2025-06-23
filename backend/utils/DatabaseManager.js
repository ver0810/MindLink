const { Client, Pool } = require('pg');
const path = require('path');

class DatabaseManager {
    constructor() {
        if (DatabaseManager.instance) {
            return DatabaseManager.instance;
        }

        this.pool = null;
        this.connected = false;
        DatabaseManager.instance = this;
    }

    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    async connect() {
        if (this.connected && this.pool) {
            return this.pool;
        }

        try {
            // 数据库配置
            const dbConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'conversation_app',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password',
                max: 20, // 连接池最大连接数
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };

            this.pool = new Pool(dbConfig);

            // 测试连接
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.connected = true;
            console.log('数据库连接成功');
            return this.pool;

        } catch (error) {
            console.error('数据库连接失败:', error);
            throw error;
        }
    }

    async query(text, params = []) {
        if (!this.connected || !this.pool) {
            await this.connect();
        }

        try {
            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            // 在开发环境下记录查询日志
            if (process.env.NODE_ENV === 'development') {
                console.log('执行查询:', { text, duration, rows: result.rowCount });
            }
            
            return result;
        } catch (error) {
            console.error('数据库查询错误:', error);
            throw error;
        }
    }

    async getClient() {
        if (!this.connected || !this.pool) {
            await this.connect();
        }
        return await this.pool.connect();
    }

    async transaction(callback) {
        const client = await this.getClient();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.connected = false;
            console.log('数据库连接已关闭');
        }
    }

    // 健康检查
    async healthCheck() {
        try {
            await this.query('SELECT 1');
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (error) {
            return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
        }
    }
}

module.exports = DatabaseManager; 