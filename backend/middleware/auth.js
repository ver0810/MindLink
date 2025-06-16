const JWTUtil = require('../utils/jwt');

// JWT认证中间件
const authenticateToken = (req, res, next) => {
    try {
        // 从请求头获取Token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '缺少访问令牌'
            });
        }

        // 验证Token
        const payload = JWTUtil.verifyToken(token);
        
        // 将用户信息添加到请求对象
        req.user = payload;
        next();

    } catch (error) {
        console.error('Token验证失败:', error.message);
        return res.status(403).json({
            success: false,
            message: 'Token无效或已过期'
        });
    }
};

// 可选的认证中间件（不强制要求登录）
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const payload = JWTUtil.verifyToken(token);
            req.user = payload;
        }
        
        next();
    } catch (error) {
        // 可选认证失败不阻止请求继续
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
}; 