const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// API信息接口
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: '认证API服务正常',
        endpoints: {
            'POST /register': '用户注册',
            'POST /login': '用户登录',
            'POST /logout': '用户退出登录（需要认证）',
            'GET /profile': '获取用户信息（需要认证）',
            'GET /verify': 'Token验证（需要认证）'
        },
        version: '1.0.0'
    });
});

// 用户注册
router.post('/register', AuthController.register);

// 用户登录
router.post('/login', AuthController.login);

// 用户退出登录（需要认证）
router.post('/logout', authenticateToken, AuthController.logout);

// 获取用户信息（需要认证）
router.get('/profile', authenticateToken, AuthController.getProfile);

// Token验证接口
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token有效',
        user: req.user
    });
});

module.exports = router; 