/**
 * 日志服务
 * 提供日志记录功能
 */

const fs = require('fs');
const path = require('path');

class LoggerService {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = this.logLevels.INFO;
        this.logDir = path.join(__dirname, '..', 'logs');
        
        // 确保日志目录存在
        this.ensureLogDirectory();
    }

    /**
     * 确保日志目录存在
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            try {
                fs.mkdirSync(this.logDir, { recursive: true });
            } catch (error) {
                console.error('创建日志目录失败:', error);
            }
        }
    }

    /**
     * 设置日志级别
     * @param {string} level - 日志级别
     */
    setLevel(level) {
        const upperLevel = level.toUpperCase();
        if (this.logLevels.hasOwnProperty(upperLevel)) {
            this.currentLevel = this.logLevels[upperLevel];
        }
    }

    /**
     * 格式化日志消息
     * @param {string} level - 日志级别
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     * @returns {string} 格式化后的消息
     */
    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
        return `[${timestamp}] [${level}] ${message} ${metaStr}`.trim();
    }

    /**
     * 写入日志文件
     * @param {string} level - 日志级别
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    writeToFile(level, message, meta = {}) {
        try {
            const logMessage = this.formatMessage(level, message, meta);
            const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
            
            fs.appendFileSync(logFile, logMessage + '\n');
        } catch (error) {
            console.error('写入日志文件失败:', error);
        }
    }

    /**
     * 输出到控制台
     * @param {string} level - 日志级别
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    writeToConsole(level, message, meta = {}) {
        const logMessage = this.formatMessage(level, message, meta);
        
        switch (level) {
            case 'ERROR':
                console.error(logMessage);
                break;
            case 'WARN':
                console.warn(logMessage);
                break;
            case 'INFO':
                console.info(logMessage);
                break;
            case 'DEBUG':
                console.debug(logMessage);
                break;
            default:
                console.log(logMessage);
        }
    }

    /**
     * 记录日志
     * @param {string} level - 日志级别
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    log(level, message, meta = {}) {
        const levelValue = this.logLevels[level.toUpperCase()];
        
        if (levelValue <= this.currentLevel) {
            this.writeToConsole(level, message, meta);
            
            // 在生产环境中写入文件
            if (process.env.NODE_ENV === 'production') {
                this.writeToFile(level, message, meta);
            }
        }
    }

    /**
     * 错误日志
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    error(message, meta = {}) {
        this.log('ERROR', message, meta);
    }

    /**
     * 警告日志
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    warn(message, meta = {}) {
        this.log('WARN', message, meta);
    }

    /**
     * 信息日志
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    info(message, meta = {}) {
        this.log('INFO', message, meta);
    }

    /**
     * 调试日志
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    debug(message, meta = {}) {
        this.log('DEBUG', message, meta);
    }

    /**
     * 记录HTTP请求
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     * @param {number} duration - 请求持续时间
     */
    logRequest(req, res, duration) {
        const meta = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        this.info(`${req.method} ${req.url}`, meta);
    }

    /**
     * 记录数据库查询
     * @param {string} query - SQL查询
     * @param {number} duration - 查询持续时间
     * @param {Object} params - 查询参数
     */
    logQuery(query, duration, params = []) {
        const meta = {
            query: query.replace(/\s+/g, ' ').trim(),
            duration: `${duration}ms`,
            params: params
        };

        this.debug('数据库查询', meta);
    }

    /**
     * 记录错误
     * @param {Error} error - 错误对象
     * @param {Object} context - 上下文信息
     */
    logError(error, context = {}) {
        const meta = {
            message: error.message,
            stack: error.stack,
            ...context
        };

        this.error(`错误: ${error.message}`, meta);
    }

    /**
     * 清理过期日志文件
     * @param {number} days - 保留天数
     */
    cleanupLogs(days = 7) {
        try {
            const files = fs.readdirSync(this.logDir);
            const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime.getTime() < cutoffTime) {
                    fs.unlinkSync(filePath);
                    this.info(`删除过期日志文件: ${file}`);
                }
            });
        } catch (error) {
            this.error('清理日志文件失败', { error: error.message });
        }
    }

    /**
     * 获取日志统计
     * @returns {Object} 统计信息
     */
    getStats() {
        try {
            const files = fs.readdirSync(this.logDir);
            const stats = {};

            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stat = fs.statSync(filePath);
                stats[file] = {
                    size: stat.size,
                    created: stat.birthtime,
                    modified: stat.mtime
                };
            });

            return stats;
        } catch (error) {
            this.error('获取日志统计失败', { error: error.message });
            return {};
        }
    }
}

// 单例实例
let instance = null;

/**
 * 获取日志服务实例
 * @returns {LoggerService} 日志服务实例
 */
function getInstance() {
    if (!instance) {
        instance = new LoggerService();
    }
    return instance;
}

module.exports = {
    LoggerService,
    getInstance
}; 