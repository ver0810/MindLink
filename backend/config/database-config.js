/**
 * 数据库配置管理
 * 支持 SQLite、PostgreSQL、MySQL 等多种数据库类型
 */

const path = require('path');

// 数据库配置
const databaseConfigs = {
    // SQLite 配置（当前使用，适合开发和小规模部署）
    sqlite: {
        type: 'sqlite',
        database: path.join(__dirname, '../database/auth.db'),
        options: {
            // 性能优化选项
            journal_mode: 'WAL',      // Write-Ahead Logging
            synchronous: 'NORMAL',    // 平衡性能和安全
            cache_size: -64000,       // 64MB缓存
            temp_store: 'MEMORY',     // 临时数据存内存
            mmap_size: 268435456,     // 256MB内存映射
            
            // 连接选项
            timeout: 30000,           // 30秒超时
            verbose: process.env.NODE_ENV === 'development'
        },
        // 数据表配置
        tables: {
            enableWAL: true,          // 启用WAL模式
            enableForeignKeys: true,  // 启用外键约束
            enableTriggers: true      // 启用触发器
        }
    },

    // PostgreSQL 配置（推荐用于生产环境）
    postgresql: {
        type: 'postgresql',
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        database: process.env.PG_DATABASE || 'conversation_db',
        username: process.env.PG_USERNAME || 'postgres',
        password: process.env.PG_PASSWORD || '',
        options: {
            // 连接池配置
            pool: {
                min: 2,               // 最小连接数
                max: 20,              // 最大连接数
                idle: 10000,          // 空闲超时
                acquire: 60000,       // 获取连接超时
                evict: 1000          // 驱逐检查间隔
            },
            
            // 性能配置
            dialectOptions: {
                statement_timeout: 30000,  // 语句超时
                idle_in_transaction_session_timeout: 30000
            },
            
            // 日志配置
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            
            // SSL配置
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        
        // 扩展功能
        extensions: {
            enableUUID: true,         // UUID扩展
            enableFullTextSearch: true, // 全文搜索
            enableJSONB: true,        // JSONB支持
            enableArrays: true        // 数组支持
        }
    },

    // MySQL 配置（备选方案）
    mysql: {
        type: 'mysql',
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        database: process.env.MYSQL_DATABASE || 'conversation_db',
        username: process.env.MYSQL_USERNAME || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        options: {
            // 连接池配置
            pool: {
                min: 2,
                max: 15,
                idle: 10000,
                acquire: 60000
            },
            
            // 字符集配置
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
            timezone: '+08:00',
            
            // 性能配置
            dialectOptions: {
                connectTimeout: 30000,
                acquireTimeout: 30000,
                timeout: 30000
            }
        }
    },

    // MongoDB 配置（NoSQL选项）
    mongodb: {
        type: 'mongodb',
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017/conversation_db',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 20,
            minPoolSize: 2,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 30000,
            
            // 读写配置
            readPreference: 'primary',
            writeConcern: {
                w: 'majority',
                j: true,
                wtimeout: 30000
            }
        }
    }
};

// 获取当前数据库配置
function getCurrentConfig() {
    const dbType = process.env.DATABASE_TYPE || 'sqlite';
    const config = databaseConfigs[dbType];
    
    if (!config) {
        throw new Error(`不支持的数据库类型: ${dbType}`);
    }
    
    return {
        type: dbType,
        ...config
    };
}

// 数据库选择建议
const databaseRecommendations = {
    development: {
        primary: 'sqlite',
        reasons: ['部署简单', '无需额外服务', '便于调试', '文件备份方便']
    },
    
    small_scale: {
        // < 1000 用户
        primary: 'sqlite',
        alternative: 'postgresql',
        reasons: ['成本低', '维护简单', '性能足够']
    },
    
    medium_scale: {
        // 1000-10000 用户
        primary: 'postgresql',
        alternative: 'mysql',
        reasons: ['并发性能好', 'JSON支持强', '全文搜索', '扩展性强']
    },
    
    large_scale: {
        // > 10000 用户
        primary: 'postgresql',
        with_cache: 'redis',
        with_search: 'elasticsearch',
        reasons: ['高并发', '复杂查询', '分析功能', '水平扩展']
    }
};

// 数据存储策略配置
const storageStrategies = {
    // 单一数据库策略
    single_database: {
        description: '所有数据存储在单一数据库中',
        suitable_for: '小到中等规模应用',
        advantages: ['架构简单', '维护容易', '事务一致性'],
        disadvantages: ['扩展性有限', '单点故障风险']
    },
    
    // 读写分离策略
    read_write_split: {
        description: '主库写入，从库读取',
        suitable_for: '读多写少的场景',
        advantages: ['提高读性能', '减少主库压力', '可用性提升'],
        disadvantages: ['数据延迟', '复杂度增加']
    },
    
    // 分库分表策略
    sharding: {
        description: '按用户ID或时间维度分片',
        suitable_for: '大规模高并发场景',
        advantages: ['水平扩展', '性能线性增长', '故障隔离'],
        disadvantages: ['复杂度高', '跨分片查询困难', '维护成本高']
    },
    
    // 混合存储策略
    hybrid_storage: {
        description: '关系型数据库+缓存+对象存储',
        suitable_for: '企业级应用',
        components: {
            primary_db: 'PostgreSQL - 结构化数据',
            cache: 'Redis - 热点数据缓存',
            object_storage: 'S3/OSS - 附件和归档',
            search_engine: 'Elasticsearch - 全文搜索',
            message_queue: 'RabbitMQ/Kafka - 异步处理'
        }
    }
};

// 迁移建议
const migrationPlan = {
    from_sqlite_to_postgresql: {
        steps: [
            '1. 备份现有SQLite数据',
            '2. 安装和配置PostgreSQL',
            '3. 创建新的数据库和表结构',
            '4. 编写数据迁移脚本',
            '5. 测试数据完整性',
            '6. 更新应用配置',
            '7. 执行切换',
            '8. 监控和验证'
        ],
        estimated_time: '1-2 天',
        risk_level: '中等',
        rollback_plan: '保留SQLite备份，快速回滚'
    }
};

// 性能监控指标
const performanceMetrics = {
    database_metrics: [
        'connection_count',      // 连接数
        'query_response_time',   // 查询响应时间
        'slow_query_count',      // 慢查询数量
        'database_size',         // 数据库大小
        'table_scan_ratio',      // 全表扫描比例
        'index_usage_ratio'      // 索引使用率
    ],
    
    application_metrics: [
        'conversation_create_rate',    // 对话创建速率
        'message_send_rate',           // 消息发送速率
        'search_response_time',        // 搜索响应时间
        'cache_hit_ratio',             // 缓存命中率
        'error_rate'                   // 错误率
    ]
};

module.exports = {
    databaseConfigs,
    getCurrentConfig,
    databaseRecommendations,
    storageStrategies,
    migrationPlan,
    performanceMetrics
}; 