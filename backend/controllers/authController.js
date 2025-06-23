const { pgConfig } = require('../config/postgresql');
const PasswordUtil = require('../utils/password');
const JWTUtil = require('../utils/jwt');

class AuthController {
    // 用户注册
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;

            // 基础验证
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: '用户名、邮箱和密码都是必填项'
                });
            }

            // 验证用户名格式
            if (username.length < 3 || username.length > 30) {
                return res.status(400).json({
                    success: false,
                    message: '用户名长度必须在3-30个字符之间'
                });
            }

            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱格式不正确'
                });
            }

            // 密码强度验证
            const passwordValidation = PasswordUtil.validatePassword(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '密码不符合要求',
                    errors: passwordValidation.errors
                });
            }

            // 检查用户名是否已存在
            const existingUsername = await pgConfig.query(
                'SELECT id FROM users WHERE username = $1',
                [username]
            );

            if (existingUsername.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '用户名已被使用'
                });
            }

            // 检查邮箱是否已存在
            const existingEmail = await pgConfig.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );

            if (existingEmail.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱已被使用'
                });
            }

            // 加密密码
            const passwordHash = await PasswordUtil.hashPassword(password);

            // 创建用户 - 确保返回完整的用户信息
            const result = await pgConfig.query(
                `INSERT INTO users (username, email, password_hash, salt, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
                 RETURNING id, username, email, created_at`,
                [username, email, passwordHash, 'bcrypt_internal'] // bcrypt内置salt处理
            );

            if (result.rows.length === 0) {
                throw new Error('用户创建失败');
            }

            const newUser = result.rows[0];
            console.log('✅ 新用户创建成功:', { id: newUser.id, username: newUser.username, email: newUser.email });

            // 生成JWT Token - 确保包含正确的用户信息
            const tokenPayload = {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: 'user', // 默认角色
                iat: Math.floor(Date.now() / 1000) // 签发时间
            };
            
            const token = JWTUtil.generateToken(tokenPayload);
            console.log('✅ JWT Token 生成成功，用户ID:', newUser.id);

            // 记录用户会话
            try {
                const sessionToken = `session_${newUser.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                const refreshToken = `refresh_${newUser.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                
                await pgConfig.query(
                    `INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, created_at) 
                     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
                    [newUser.id, sessionToken, refreshToken, new Date(Date.now() + 2 * 60 * 60 * 1000)] // 2小时后过期
                );
                
                console.log('✅ 用户会话记录成功，用户ID:', newUser.id);
            } catch (sessionError) {
                console.warn('⚠️ 记录用户会话失败:', sessionError.message);
                // 不阻止注册，继续执行
            }

            res.status(201).json({
                success: true,
                message: '注册成功',
                data: {
                    token,
                    user: {
                        id: newUser.id,
                        username: newUser.username,
                        email: newUser.email,
                        createdAt: newUser.created_at
                    }
                }
            });

        } catch (error) {
            console.error('❌ 注册失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误',
                debug: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // 用户登录
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            // 基础验证
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: '用户名和密码都是必填项'
                });
            }

            // 查找用户（支持用户名或邮箱登录）
            const userResult = await pgConfig.query(
                'SELECT * FROM users WHERE (username = $1 OR email = $1) AND deleted_at IS NULL',
                [username]
            );

            if (userResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '用户名或邮箱不存在'
                });
            }

            const user = userResult.rows[0];
            console.log('🔍 找到用户:', { id: user.id, username: user.username, email: user.email });

            // 验证密码
            const isPasswordValid = await PasswordUtil.verifyPassword(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: '密码错误'
                });
            }

            console.log('✅ 密码验证成功，用户ID:', user.id);

            // 生成JWT Token - 确保包含正确的用户信息
            const tokenPayload = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'user',
                iat: Math.floor(Date.now() / 1000)
            };
            
            const token = JWTUtil.generateToken(tokenPayload);
            console.log('✅ JWT Token 生成成功，用户ID:', user.id);

            // 更新最后登录时间
            try {
                await pgConfig.query(
                    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [user.id]
                );
            } catch (updateError) {
                console.warn('⚠️ 更新最后登录时间失败:', updateError.message);
            }

            // 记录登录会话（清理旧会话后添加新会话）
            try {
                // 先清理该用户的旧会话
                await pgConfig.query(
                    'DELETE FROM user_sessions WHERE user_id = $1',
                    [user.id]
                );
                
                // 创建唯一的session标识
                const sessionToken = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                const refreshToken = `refresh_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                
                // 插入新会话
                await pgConfig.query(
                    `INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, created_at) 
                     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
                    [user.id, sessionToken, refreshToken, new Date(Date.now() + 2 * 60 * 60 * 1000)] // 2小时后过期
                );
                
                console.log('✅ 用户会话记录成功，用户ID:', user.id);
            } catch (sessionError) {
                console.warn('⚠️ 记录会话失败:', sessionError.message);
                // 不阻止登录，继续执行
            }

            res.json({
                success: true,
                message: '登录成功',
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role || 'user',
                        lastLoginAt: new Date().toISOString()
                    }
                }
            });

        } catch (error) {
            console.error('❌ 登录失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误',
                debug: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // 用户退出登录
    static async logout(req, res) {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: '用户未登录或token无效'
                });
            }

            const userId = req.user.id;
            console.log('🚪 用户退出登录，用户ID:', userId);

            // 清理用户会话
            try {
                const result = await pgConfig.query(
                    'DELETE FROM user_sessions WHERE user_id = $1',
                    [userId]
                );
                console.log('✅ 清理用户会话成功，删除记录数:', result.rowCount);
            } catch (sessionError) {
                console.warn('⚠️ 清理用户会话失败:', sessionError.message);
            }

            res.json({
                success: true,
                message: '退出登录成功'
            });

        } catch (error) {
            console.error('❌ 退出登录失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误',
                debug: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // 获取用户信息
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const userResult = await pgConfig.query(
                'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            const user = userResult.rows[0];

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        createdAt: user.created_at,
                        updatedAt: user.updated_at
                    }
                }
            });

        } catch (error) {
            console.error('获取用户信息失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
    }
}

module.exports = AuthController; 