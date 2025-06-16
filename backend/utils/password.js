const bcrypt = require('bcrypt');

// 密码加密配置
const SALT_ROUNDS = 10;

class PasswordUtil {
    // 加密密码
    static async hashPassword(password) {
        try {
            return await bcrypt.hash(password, SALT_ROUNDS);
        } catch (error) {
            throw new Error('密码加密失败');
        }
    }

    // 验证密码
    static async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            throw new Error('密码验证失败');
        }
    }

    // 简单密码强度检查
    static validatePassword(password) {
        const errors = [];
        
        if (!password) {
            errors.push('密码不能为空');
        }
        
        if (password.length < 6) {
            errors.push('密码长度至少6位');
        }
        
        if (password.length > 50) {
            errors.push('密码长度不能超过50位');
        }
        
        // 基础强度检查
        if (!/[a-zA-Z]/.test(password)) {
            errors.push('密码必须包含字母');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('密码必须包含数字');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = PasswordUtil; 