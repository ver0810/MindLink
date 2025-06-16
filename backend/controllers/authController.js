const database = require('../utils/database');
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
            const existingUsername = await database.get(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );

            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: '用户名已被使用'
                });
            }

            // 检查邮箱是否已存在
            const existingEmail = await database.get(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱已被使用'
                });
            }

            // 加密密码
            const passwordHash = await PasswordUtil.hashPassword(password);

            // 创建用户
            const result = await database.run(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, passwordHash]
            );

            // 生成JWT Token
            const token = JWTUtil.generateToken({
                userId: result.id,
                username: username,
                email: email
            });

            res.status(201).json({
                success: true,
                message: '注册成功',
                data: {
                    token,
                    user: {
                        id: result.id,
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
            const user = await database.get(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, username]
            );

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }

            // 验证密码
            const isPasswordValid = await PasswordUtil.verifyPassword(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }

            // 检查用户状态
            if (user.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: '账户已被禁用'
                });
            }

            // 生成JWT Token
            const token = JWTUtil.generateToken({
                userId: user.id,
                username: user.username,
                email: user.email
            });

            // 记录登录会话（可选）
            await database.run(
                'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
                [user.id, token.substring(0, 50), new Date(Date.now() + 2 * 60 * 60 * 1000)] // 2小时后过期
            );

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
            const { userId } = req.user; // 从认证中间件获取

            // 清理用户会话
            await database.run(
                'DELETE FROM user_sessions WHERE user_id = ?',
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
            const { userId } = req.user;

            const user = await database.get(
                'SELECT id, username, email, created_at FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            res.json({
                success: true,
                data: user
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