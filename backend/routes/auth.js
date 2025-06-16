const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

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