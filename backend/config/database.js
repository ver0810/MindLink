/**
 * 数据库配置管理
 * 
 * 功能：
 * - 数据库连接配置
 * - 连接池管理
 * - 读写分离配置
 * - 监控和健康检查
 */

const { Pool } = require('pg');
const Redis = require('redis');

class DatabaseConfig {
    constructor() {
        this.pools = {};
        this.redisClient = null;
        this.initializeConnections();
    }

    /**
     * 初始化数据库连接
     */
    async initializeConnections() {
        try {
            // PostgreSQL 主库连接池
            this.pools.primary = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'conversation_db',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password',
                
                // 连接池配置
                max: parseInt(process.env.DB_POOL_MAX) || 20,
                min: parseInt(process.env.DB_POOL_MIN) || 5,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
                acquireTimeoutMillis: 60000,
                
                // SSL配置
                ssl: process.env.NODE_ENV === 'production' ? {
                    require: true,
                    rejectUnauthorized: false
                } : false,
                
                // 应用名称
                application_name: 'conversation-api',
                
                // 语句超时
                statement_timeout: 30000,
                query_timeout: 30000
            });

            // PostgreSQL 只读副本连接池（可选）
            if (process.env.DB_READ_HOST) {
                this.pools.replica = new Pool({
                    host: process.env.DB_READ_HOST,
                    port: process.env.DB_READ_PORT || 5432,
                    database: process.env.DB_NAME || 'conversation_db',
                    user: process.env.DB_READ_USER || process.env.DB_USER || 'postgres',
                    password: process.env.DB_READ_PASSWORD || process.env.DB_PASSWORD || 'password',
                    
                    max: parseInt(process.env.DB_READ_POOL_MAX) || 15,
                    min: parseInt(process.env.DB_READ_POOL_MIN) || 3,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 5000,
                    
                    ssl: process.env.NODE_ENV === 'production' ? {
                        require: true,
                        rejectUnauthorized: false
                    } : false,
                    
                    application_name: 'conversation-api-read'
                });
            }

            // Redis连接配置
            this.redisClient = Redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                password: process.env.REDIS_PASSWORD,
                database: parseInt(process.env.REDIS_DB) || 0,
                
                retryDelayOnFailover: 100,
                retryDelayOnClusterDown: 300,
                retryDelayOnReconnection: function(retryIndex) {
                    return Math.min(100 + retryIndex * 10, 2000);
                },
                maxRetriesPerRequest: 3,
                
                // 连接池配置
                lazyConnect: true,
                keepAlive: 30000,
                connectTimeout: 10000,
                commandTimeout: 5000
            });

            // 事件监听
            this.setupEventListeners();

            console.log('数据库连接配置完成');

        } catch (error) {
            console.error('数据库连接初始化失败:', error);
            throw error;
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // PostgreSQL主库事件
        this.pools.primary.on('connect', (client) => {
            console.log('PostgreSQL主库连接建立:', client.processID);
        });

        this.pools.primary.on('error', (err, client) => {
            console.error('PostgreSQL主库连接错误:', err);
        });

        this.pools.primary.on('remove', (client) => {
            console.log('PostgreSQL主库连接移除:', client.processID);
        });

        // PostgreSQL只读副本事件
        if (this.pools.replica) {
            this.pools.replica.on('connect', (client) => {
                console.log('PostgreSQL只读副本连接建立:', client.processID);
            });

            this.pools.replica.on('error', (err, client) => {
                console.error('PostgreSQL只读副本连接错误:', err);
            });
        }

        // Redis事件
        this.redisClient.on('connect', () => {
            console.log('Redis连接建立');
        });

        this.redisClient.on('error', (err) => {
            console.error('Redis连接错误:', err);
        });

        this.redisClient.on('reconnecting', () => {
            console.log('Redis重新连接中...');
        });

        this.redisClient.on('ready', () => {
            console.log('Redis连接就绪');
        });
    }

    /**
     * 获取PostgreSQL连接池
     */
    getPool(type = 'primary') {
        return this.pools[type] || this.pools.primary;
    }

    /**
     * 获取Redis客户端
     */
    getRedisClient() {
        return this.redisClient;
    }

    /**
     * 执行数据库查询（自动选择读写库）
     */
    async query(sql, params = [], options = {}) {
        const { 
            useReplica = false, 
            timeout = 30000,
            retryCount = 2 
        } = options;

        // 选择连接池
        let pool = this.pools.primary;
        if (useReplica && this.pools.replica && this.isReadOnlyQuery(sql)) {
            pool = this.pools.replica;
        }

        let attempt = 0;
        while (attempt <= retryCount) {
            try {
                const client = await pool.connect();
                
                try {
                    // 设置查询超时
                    await client.query('SET statement_timeout = $1', [timeout]);
                    
                    const result = await client.query(sql, params);
                    return result;
                    
                } finally {
                    client.release();
                }

            } catch (error) {
                attempt++;
                
                if (attempt > retryCount) {
                    throw error;
                }

                // 可重试的错误
                if (this.isRetryableError(error)) {
                    console.warn(`查询失败，尝试重试 ${attempt}/${retryCount}:`, error.message);
                    await this.delay(1000 * attempt);
                    continue;
                }

                throw error;
            }
        }
    }

    /**
     * 执行事务
     */
    async transaction(callback, options = {}) {
        const { timeout = 30000 } = options;
        const pool = this.pools.primary; // 事务只使用主库
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            await client.query('SET statement_timeout = $1', [timeout]);
            
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

    /**
     * 获取连接池状态
     */
    getPoolStats() {
        const stats = {};
        
        Object.keys(this.pools).forEach(poolName => {
            const pool = this.pools[poolName];
            stats[poolName] = {
                totalCount: pool.totalCount,
                idleCount: pool.idleCount,
                waitingCount: pool.waitingCount
            };
        });
        
        return stats;
    }

    /**
     * 健康检查
     */
    async healthCheck() {
        const health = {
            postgresql: { status: 'unknown', latency: null },
            redis: { status: 'unknown', latency: null }
        };

        // PostgreSQL健康检查
        try {
            const start = Date.now();
            await this.query('SELECT 1');
            health.postgresql = {
                status: 'healthy',
                latency: Date.now() - start
            };
        } catch (error) {
            health.postgresql = {
                status: 'unhealthy',
                error: error.message
            };
        }

        // Redis健康检查
        try {
            const start = Date.now();
            await this.redisClient.ping();
            health.redis = {
                status: 'healthy',
                latency: Date.now() - start
            };
        } catch (error) {
            health.redis = {
                status: 'unhealthy',
                error: error.message
            };
        }

        return health;
    }

    /**
     * 优雅关闭
     */
    async gracefulShutdown() {
        console.log('开始优雅关闭数据库连接...');
        
        const promises = [];
        
        // 关闭PostgreSQL连接池
        Object.keys(this.pools).forEach(poolName => {
            promises.push(
                this.pools[poolName].end().catch(err => 
                    console.error(`关闭${poolName}连接池失败:`, err)
                )
            );
        });
        
        // 关闭Redis连接
        if (this.redisClient) {
            promises.push(
                this.redisClient.quit().catch(err => 
                    console.error('关闭Redis连接失败:', err)
                )
            );
        }
        
        await Promise.all(promises);
        console.log('数据库连接已优雅关闭');
    }

    /**
     * 判断是否为只读查询
     */
    isReadOnlyQuery(sql) {
        const readOnlyPatterns = /^\s*(SELECT|WITH|SHOW|EXPLAIN|DESCRIBE)\s+/i;
        return readOnlyPatterns.test(sql);
    }

    /**
     * 判断是否为可重试的错误
     */
    isRetryableError(error) {
        const retryableCodes = [
            'ECONNRESET',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ENETUNREACH',
            '08000', // connection_exception
            '08003', // connection_does_not_exist
            '08006', // connection_failure
            '08001', // sqlclient_unable_to_establish_sqlconnection
            '57P01', // admin_shutdown
            '57P02', // crash_shutdown
            '57P03'  // cannot_connect_now
        ];
        
        return retryableCodes.includes(error.code) || 
               error.message.includes('connection') ||
               error.message.includes('timeout');
    }

    /**
     * 延迟工具函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取数据库配置信息（隐藏敏感信息）
     */
    getConfig() {
        return {
            postgresql: {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'conversation_db',
                poolMax: parseInt(process.env.DB_POOL_MAX) || 20,
                poolMin: parseInt(process.env.DB_POOL_MIN) || 5,
                ssl: process.env.NODE_ENV === 'production'
            },
            redis: {
                url: process.env.REDIS_URL ? process.env.REDIS_URL.replace(/\/\/.*@/, '//***:***@') : 'redis://localhost:6379',
                database: parseInt(process.env.REDIS_DB) || 0
            }
        };
    }
}

// 创建单例实例
const databaseConfig = new DatabaseConfig();

module.exports = databaseConfig; 