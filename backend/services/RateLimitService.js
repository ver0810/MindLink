/**
 * 限流服务
 * 提供API限流功能
 */

class RateLimitService {
    constructor() {
        // 存储用户请求记录
        this.requestCounts = new Map();
        // 存储IP请求记录
        this.ipCounts = new Map();
        
        // 清理过期记录的定时器
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000); // 每分钟清理一次
    }

    /**
     * 检查用户限流
     * @param {string} userId - 用户ID
     * @param {Object} limits - 限流配置
     * @returns {Object} 限流结果
     */
    checkUserLimit(userId, limits = {}) {
        const {
            maxRequests = 100, // 最大请求数
            windowMs = 60000,  // 时间窗口（毫秒）
            identifier = 'default'
        } = limits;

        const key = `user:${userId}:${identifier}`;
        return this.checkLimit(key, maxRequests, windowMs, this.requestCounts);
    }

    /**
     * 检查IP限流
     * @param {string} ip - IP地址
     * @param {Object} limits - 限流配置
     * @returns {Object} 限流结果
     */
    checkIPLimit(ip, limits = {}) {
        const {
            maxRequests = 200, // IP限制相对宽松
            windowMs = 60000,
            identifier = 'default'
        } = limits;

        const key = `ip:${ip}:${identifier}`;
        return this.checkLimit(key, maxRequests, windowMs, this.ipCounts);
    }

    /**
     * 通用限流检查
     * @private
     * @param {string} key - 限流键
     * @param {number} maxRequests - 最大请求数
     * @param {number} windowMs - 时间窗口
     * @param {Map} storage - 存储对象
     * @returns {Object} 限流结果
     */
    checkLimit(key, maxRequests, windowMs, storage) {
        const now = Date.now();
        const windowStart = now - windowMs;

        // 获取或创建记录
        if (!storage.has(key)) {
            storage.set(key, []);
        }

        const requests = storage.get(key);
        
        // 清理过期请求
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        storage.set(key, validRequests);

        // 检查是否超出限制
        if (validRequests.length >= maxRequests) {
            const oldestRequest = Math.min(...validRequests);
            const resetTime = oldestRequest + windowMs;
            
            return {
                allowed: false,
                count: validRequests.length,
                limit: maxRequests,
                remaining: 0,
                resetTime: resetTime,
                retryAfter: Math.ceil((resetTime - now) / 1000)
            };
        }

        // 记录当前请求
        validRequests.push(now);
        storage.set(key, validRequests);

        return {
            allowed: true,
            count: validRequests.length,
            limit: maxRequests,
            remaining: maxRequests - validRequests.length,
            resetTime: now + windowMs,
            retryAfter: 0
        };
    }

    /**
     * 获取限流状态
     * @param {string} key - 限流键
     * @param {string} type - 类型 ('user' 或 'ip')
     * @returns {Object} 状态信息
     */
    getStatus(key, type = 'user') {
        const storage = type === 'user' ? this.requestCounts : this.ipCounts;
        const requests = storage.get(key) || [];
        const now = Date.now();
        
        return {
            totalRequests: requests.length,
            recentRequests: requests.filter(timestamp => timestamp > now - 60000).length,
            oldestRequest: requests.length > 0 ? Math.min(...requests) : null,
            newestRequest: requests.length > 0 ? Math.max(...requests) : null
        };
    }

    /**
     * 重置用户限流
     * @param {string} userId - 用户ID
     * @param {string} identifier - 标识符
     */
    resetUserLimit(userId, identifier = 'default') {
        const key = `user:${userId}:${identifier}`;
        this.requestCounts.delete(key);
    }

    /**
     * 重置IP限流
     * @param {string} ip - IP地址
     * @param {string} identifier - 标识符
     */
    resetIPLimit(ip, identifier = 'default') {
        const key = `ip:${ip}:${identifier}`;
        this.ipCounts.delete(key);
    }

    /**
     * 获取所有限流统计
     * @returns {Object} 统计信息
     */
    getStats() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        let totalUsers = 0;
        let activeUsers = 0;
        let totalIPs = 0;
        let activeIPs = 0;

        // 统计用户
        for (const [key, requests] of this.requestCounts.entries()) {
            if (key.startsWith('user:')) {
                totalUsers++;
                if (requests.some(timestamp => timestamp > oneMinuteAgo)) {
                    activeUsers++;
                }
            }
        }

        // 统计IP
        for (const [key, requests] of this.ipCounts.entries()) {
            if (key.startsWith('ip:')) {
                totalIPs++;
                if (requests.some(timestamp => timestamp > oneMinuteAgo)) {
                    activeIPs++;
                }
            }
        }

        return {
            users: {
                total: totalUsers,
                active: activeUsers
            },
            ips: {
                total: totalIPs,
                active: activeIPs
            },
            memoryUsage: {
                userRecords: this.requestCounts.size,
                ipRecords: this.ipCounts.size
            }
        };
    }

    /**
     * 清理过期记录
     * @private
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        const cutoff = now - maxAge;

        // 清理用户记录
        for (const [key, requests] of this.requestCounts.entries()) {
            const validRequests = requests.filter(timestamp => timestamp > cutoff);
            if (validRequests.length === 0) {
                this.requestCounts.delete(key);
            } else {
                this.requestCounts.set(key, validRequests);
            }
        }

        // 清理IP记录
        for (const [key, requests] of this.ipCounts.entries()) {
            const validRequests = requests.filter(timestamp => timestamp > cutoff);
            if (validRequests.length === 0) {
                this.ipCounts.delete(key);
            } else {
                this.ipCounts.set(key, validRequests);
            }
        }
    }

    /**
     * 创建Express中间件
     * @param {Object} options - 配置选项
     * @returns {Function} Express中间件
     */
    createMiddleware(options = {}) {
        const {
            userLimits = { maxRequests: 100, windowMs: 60000 },
            ipLimits = { maxRequests: 200, windowMs: 60000 },
            identifier = 'api',
            onLimitReached = null
        } = options;

        return (req, res, next) => {
            const userId = req.user?.id;
            const ip = req.ip || req.connection.remoteAddress;

            // 检查用户限流
            if (userId) {
                const userResult = this.checkUserLimit(userId, { ...userLimits, identifier });
                if (!userResult.allowed) {
                    if (onLimitReached) {
                        onLimitReached('user', userId, userResult);
                    }
                    
                    return res.status(429).json({
                        success: false,
                        message: '请求过于频繁，请稍后再试',
                        retryAfter: userResult.retryAfter,
                        limit: userResult.limit,
                        remaining: userResult.remaining
                    });
                }

                // 设置响应头
                res.set({
                    'X-RateLimit-Limit': userResult.limit,
                    'X-RateLimit-Remaining': userResult.remaining,
                    'X-RateLimit-Reset': Math.ceil(userResult.resetTime / 1000)
                });
            }

            // 检查IP限流
            if (ip) {
                const ipResult = this.checkIPLimit(ip, { ...ipLimits, identifier });
                if (!ipResult.allowed) {
                    if (onLimitReached) {
                        onLimitReached('ip', ip, ipResult);
                    }
                    
                    return res.status(429).json({
                        success: false,
                        message: 'IP请求过于频繁，请稍后再试',
                        retryAfter: ipResult.retryAfter
                    });
                }
            }

            next();
        };
    }

    /**
     * 销毁限流服务
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.requestCounts.clear();
        this.ipCounts.clear();
    }
}

// 单例实例
let instance = null;

/**
 * 获取限流服务实例
 * @returns {RateLimitService} 限流服务实例
 */
function getInstance() {
    if (!instance) {
        instance = new RateLimitService();
    }
    return instance;
}

module.exports = {
    RateLimitService,
    getInstance
}; 