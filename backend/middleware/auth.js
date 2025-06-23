const JWTUtil = require('../utils/jwt');

// 认证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        console.warn('⚠️ 缺少访问令牌，IP:', req.ip);
        return res.status(401).json({
            success: false,
            message: '缺少访问令牌'
        });
    }

    try {
        const decodedUser = JWTUtil.verifyToken(token);
        
        // 验证解码后的用户信息
        if (!decodedUser || !decodedUser.id) {
            console.error('❌ Token解码成功但用户信息无效:', decodedUser);
            return res.status(403).json({
                success: false,
                message: 'Token中用户信息无效'
            });
        }

        // 统一ID类型处理 - 确保数据库查询一致性
        let userId;
        if (typeof decodedUser.id === 'string') {
            // 如果是字符串，检查是否为数字字符串
            if (/^\d+$/.test(decodedUser.id)) {
                userId = parseInt(decodedUser.id);
            } else {
                userId = decodedUser.id; // 保持字符串类型（UUID等）
            }
        } else if (typeof decodedUser.id === 'number') {
            userId = decodedUser.id;
        } else {
            console.error('❌ 用户ID类型无效:', { id: decodedUser.id, type: typeof decodedUser.id });
            return res.status(403).json({
                success: false,
                message: '用户ID格式无效'
            });
        }

        // 进一步验证数字ID的有效性
        if (typeof userId === 'number' && (!userId || userId <= 0)) {
            console.error('❌ 数字用户ID无效:', { original: decodedUser.id, parsed: userId });
            return res.status(403).json({
                success: false,
                message: '用户ID无效'
            });
        }

        // 创建标准化的用户对象
        req.user = {
            id: userId, // 保持原始类型，让数据库层处理
            username: decodedUser.username || '',
            email: decodedUser.email || '',
            role: decodedUser.role || 'user'
        };

        console.log('✅ 用户认证成功:', {
            id: req.user.id,
            idType: typeof req.user.id,
            username: req.user.username,
            ip: req.ip
        });

        next();
    } catch (error) {
        console.error('❌ Token验证失败:', {
            error: error.message,
            token: token.substring(0, 20) + '...',
            ip: req.ip
        });
        
        return res.status(403).json({
            success: false,
            message: error.message || 'Token无效或已过期'
        });
    }
};

// 可选的认证中间件（Token无效时不会阻止请求）
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decodedUser = JWTUtil.verifyToken(token);
            
            if (decodedUser && decodedUser.id) {
                // 使用与主认证中间件相同的ID处理逻辑
                let userId;
                if (typeof decodedUser.id === 'string') {
                    if (/^\d+$/.test(decodedUser.id)) {
                        userId = parseInt(decodedUser.id);
                    } else {
                        userId = decodedUser.id;
                    }
                } else if (typeof decodedUser.id === 'number') {
                    userId = decodedUser.id;
                } else {
                    req.user = null;
                    console.warn('⚠️ 可选认证 - 用户ID类型无效:', typeof decodedUser.id);
                    return next();
                }
                
                if (typeof userId === 'number' && userId > 0) {
                    req.user = {
                        id: userId,
                        username: decodedUser.username || '',
                        email: decodedUser.email || '',
                        role: decodedUser.role || 'user'
                    };
                    
                    console.log('✅ 可选认证成功:', { 
                        id: req.user.id, 
                        idType: typeof req.user.id,
                        username: req.user.username 
                    });
                } else if (typeof userId === 'string') {
                    req.user = {
                        id: userId,
                        username: decodedUser.username || '',
                        email: decodedUser.email || '',
                        role: decodedUser.role || 'user'
                    };
                    
                    console.log('✅ 可选认证成功 (UUID):', { 
                        id: req.user.id, 
                        idType: typeof req.user.id,
                        username: req.user.username 
                    });
                } else {
                    req.user = null;
                    console.warn('⚠️ 可选认证 - 用户ID无效:', userId);
                }
            } else {
                req.user = null;
                console.warn('⚠️ 可选认证 - Token中无用户信息');
            }
        } catch (error) {
            // Token无效，但不阻止请求继续
            req.user = null;
            console.warn('⚠️ 可选认证 - Token无效:', error.message);
        }
    } else {
        req.user = null;
    }
    
    next();
};

// 管理员权限验证
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: '请先登录'
        });
    }

    if (req.user.role !== 'admin') {
        console.warn('⚠️ 非管理员尝试访问管理功能:', {
            userId: req.user.id,
            username: req.user.username,
            role: req.user.role,
            ip: req.ip
        });
        
        return res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
    }

    next();
};

// 用户身份验证（确保用户只能访问自己的资源）
const requireSelfOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: '请先登录'
        });
    }

    // 获取目标用户ID，支持多种参数来源
    let targetUserId = req.params.userId || req.body.userId || req.query.userId;
    
    // 尝试从URL路径中提取ID（如 /api/conversations/123）
    if (!targetUserId && req.params.id) {
        targetUserId = req.params.id;
    }
    
    // 统一ID类型处理
    if (typeof targetUserId === 'string' && /^\d+$/.test(targetUserId)) {
        targetUserId = parseInt(targetUserId);
    }
    
    // 比较用户ID（支持数字和字符串类型）
    const isOwner = req.user.id === targetUserId || 
                   (typeof req.user.id === 'number' && typeof targetUserId === 'string' && req.user.id.toString() === targetUserId) ||
                   (typeof req.user.id === 'string' && typeof targetUserId === 'number' && req.user.id === targetUserId.toString());
    
    if (req.user.role === 'admin' || isOwner) {
        next();
    } else {
        console.warn('⚠️ 用户尝试访问他人资源:', {
            currentUserId: req.user.id,
            currentUserIdType: typeof req.user.id,
            targetUserId: targetUserId,
            targetUserIdType: typeof targetUserId,
            ip: req.ip
        });
        
        return res.status(403).json({
            success: false,
            message: '无权访问该资源'
        });
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireAdmin,
    requireSelfOrAdmin
}; 