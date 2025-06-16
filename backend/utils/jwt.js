const jwt = require('jsonwebtoken');

// JWT配置
const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    expiresIn: '2h' // Token有效期2小时
};

class JWTUtil {
    // 生成Token
    static generateToken(payload) {
        return jwt.sign(payload, JWT_CONFIG.secret, {
            expiresIn: JWT_CONFIG.expiresIn
        });
    }

    // 验证Token
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_CONFIG.secret);
        } catch (error) {
            throw new Error('Token无效或已过期');
        }
    }

    // 解码Token（不验证）
    static decodeToken(token) {
        return jwt.decode(token);
    }

    // 检查Token是否即将过期
    static isTokenExpiringSoon(token, minutesThreshold = 30) {
        try {
            const decoded = jwt.decode(token);
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = decoded.exp - now;
            return timeLeft < (minutesThreshold * 60);
        } catch (error) {
            return true; // 解码失败，认为需要刷新
        }
    }
}

module.exports = JWTUtil; 