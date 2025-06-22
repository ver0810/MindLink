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

            // 创建用户 - 添加salt字段以匹配数据库表结构
            const result = await pgConfig.query(
                'INSERT INTO users (username, email, password_hash, salt) VALUES ($1, $2, $3, $4) RETURNING id',
                [username, email, passwordHash, 'bcrypt_internal'] // bcrypt内置salt处理
            );

            const userId = result.rows[0].id;

            // 生成JWT Token
            const token = JWTUtil.generateToken({
                id: userId,
                username: username,
                email: email
            });

            res.status(201).json({
                success: true,
                message: '注册成功',
                data: {
                    token,
                    user: {
                        id: userId,
                        username,
                        email
                    }
                }
            });

        } catch (error) {
            console.error('注册失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误'
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
                'SELECT * FROM users WHERE username = $1 OR email = $1',
                [username]
            );

            if (userResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }

            const user = userResult.rows[0];

            // 验证密码
            const isPasswordValid = await PasswordUtil.verifyPassword(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }

            // 生成JWT Token
            const token = JWTUtil.generateToken({
                id: user.id,
                username: user.username,
                email: user.email
            });

            // 记录登录会话（清理旧会话后添加新会话）
            try {
                // 先清理该用户的旧会话
                await pgConfig.query(
                    'DELETE FROM user_sessions WHERE user_id = $1',
                    [user.id]
                );
                
                // 生成唯一的session_token（使用完整JWT + 时间戳）
                const sessionToken = token + '_' + Date.now();
                const refreshToken = 'refresh_' + Math.random().toString(36).substring(2) + Date.now();
                
                // 插入新会话
                await pgConfig.query(
                    'INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4)',
                    [user.id, sessionToken, refreshToken, new Date(Date.now() + 2 * 60 * 60 * 1000)] // 2小时后过期
                );
                
                console.log('✅ 用户会话记录成功');
            } catch (sessionError) {
                console.warn('记录会话失败:', sessionError.message);
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
                        email: user.email
                    }
                }
            });

        } catch (error) {
            console.error('登录失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
    }

    // 用户退出登录
    static async logout(req, res) {
        try {
            const userId = req.user.id; // 从认证中间件获取

            // 清理用户会话
            await pgConfig.query(
                'DELETE FROM user_sessions WHERE user_id = $1',
                [userId]
            );

            res.json({
                success: true,
                message: '退出登录成功'
            });

        } catch (error) {
            console.error('退出登录失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误'
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