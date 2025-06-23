/**
 * 认证服务
 * 提供用户认证相关功能
 */

const JWTUtil = require('../utils/jwt');
const bcrypt = require('bcrypt');

class AuthService {
    constructor() {
        this.saltRounds = 10;
    }

    /**
     * 生成JWT Token
     * @param {Object} payload - 用户信息
     * @returns {string} JWT Token
     */
    generateToken(payload) {
        return JWTUtil.generateToken(payload);
    }

    /**
     * 验证JWT Token
     * @param {string} token - JWT Token
     * @returns {Object} 解码后的用户信息
     */
    verifyToken(token) {
        return JWTUtil.verifyToken(token);
    }

    /**
     * 加密密码
     * @param {string} password - 明文密码
     * @returns {Promise<string>} 加密后的密码
     */
    async hashPassword(password) {
        return await bcrypt.hash(password, this.saltRounds);
    }

    /**
     * 验证密码
     * @param {string} password - 明文密码
     * @param {string} hashedPassword - 加密后的密码
     * @returns {Promise<boolean>} 验证结果
     */
    async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    /**
     * 验证用户权限
     * @param {Object} user - 用户信息
     * @param {string} permission - 权限名称
     * @returns {boolean} 是否有权限
     */
    hasPermission(user, permission) {
        // 简单的权限验证逻辑
        if (!user || !user.role) {
            return false;
        }

        // 管理员拥有所有权限
        if (user.role === 'admin') {
            return true;
        }

        // 其他权限验证逻辑
        const permissions = {
            'user': ['read:own', 'write:own'],
            'moderator': ['read:own', 'write:own', 'read:others'],
            'admin': ['*']
        };

        const userPermissions = permissions[user.role] || [];
        return userPermissions.includes(permission) || userPermissions.includes('*');
    }

    /**
     * 检查Token是否即将过期
     * @param {string} token - JWT Token
     * @returns {boolean} 是否即将过期
     */
    isTokenExpiringSoon(token) {
        return JWTUtil.isTokenExpiringSoon(token);
    }

    /**
     * 刷新Token
     * @param {string} oldToken - 旧Token
     * @returns {string} 新Token
     */
    refreshToken(oldToken) {
        try {
            const decoded = this.verifyToken(oldToken);
            // 移除过期时间相关字段
            delete decoded.iat;
            delete decoded.exp;
            
            return this.generateToken(decoded);
        } catch (error) {
            throw new Error('Token刷新失败');
        }
    }

    /**
     * 生成随机字符串
     * @param {number} length - 长度
     * @returns {string} 随机字符串
     */
    generateRandomString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 验证邮箱格式
     * @param {string} email - 邮箱地址
     * @returns {boolean} 是否有效
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 验证密码强度
     * @param {string} password - 密码
     * @returns {Object} 验证结果
     */
    validatePasswordStrength(password) {
        const result = {
            isValid: true,
            strength: 'weak',
            issues: []
        };

        if (password.length < 6) {
            result.isValid = false;
            result.issues.push('密码长度至少6位');
        }

        if (password.length < 8) {
            result.issues.push('建议密码长度至少8位');
        }

        if (!/[a-z]/.test(password)) {
            result.issues.push('建议包含小写字母');
        }

        if (!/[A-Z]/.test(password)) {
            result.issues.push('建议包含大写字母');
        }

        if (!/[0-9]/.test(password)) {
            result.issues.push('建议包含数字');
        }

        if (!/[^a-zA-Z0-9]/.test(password)) {
            result.issues.push('建议包含特殊字符');
        }

        // 计算强度
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score >= 4) {
            result.strength = 'strong';
        } else if (score >= 2) {
            result.strength = 'medium';
        }

        return result;
    }
}

// 单例实例
let instance = null;

/**
 * 获取认证服务实例
 * @returns {AuthService} 认证服务实例
 */
function getInstance() {
    if (!instance) {
        instance = new AuthService();
    }
    return instance;
}

module.exports = {
    AuthService,
    getInstance
}; 