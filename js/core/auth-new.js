/**
 * 用户认证管理类 - 新版本
 * 提供JWT Token管理、用户状态管理等功能
 */
class AuthManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api/auth';
        this.tokenKey = 'auth_token';
        this.userKey = 'user_info';
        this.currentUser = null;
        
        // 初始化时检查已存储的认证信息
        this.initializeAuth();
    }

    /**
     * 初始化认证状态
     */
    initializeAuth() {
        const token = this.getStoredToken();
        const user = this.getStoredUser();
        
        if (token && user) {
            this.currentUser = user;
            // 可以在这里验证Token是否仍然有效
            this.verifyToken().catch(() => {
                this.clearAuth();
            });
        }
    }

    /**
     * 用户注册
     */
    async register(username, email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (data.success) {
                // 注册成功，保存认证信息
                this.saveAuth(data.data.token, data.data.user);
                return { success: true, user: data.data.user };
            } else {
                return { success: false, message: data.message, errors: data.errors };
            }
        } catch (error) {
            console.error('注册请求失败:', error);
            return { success: false, message: '网络连接失败，请检查网络设置' };
        }
    }

    /**
     * 用户登录
     */
    async login(username, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // 登录成功，保存认证信息
                this.saveAuth(data.data.token, data.data.user);
                return { success: true, user: data.data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            return { success: false, message: '网络连接失败，请检查网络设置' };
        }
    }

    /**
     * 用户退出登录
     */
    async logout(skipRedirect = false) {
        try {
            const token = this.getStoredToken();
            if (token) {
                await fetch(`${this.apiBaseUrl}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('退出登录请求失败:', error);
        } finally {
            // 无论服务器请求是否成功，都清理本地认证信息
            this.clearAuth();
            // 根据参数决定是否跳转
            if (!skipRedirect) {
                window.location.href = 'index.html';
            }
        }
    }

    /**
     * 验证Token是否有效
     */
    async verifyToken() {
        const token = this.getStoredToken();
        if (!token) {
            throw new Error('没有Token');
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return data.user;
            } else {
                throw new Error('Token验证失败');
            }
        } catch (error) {
            console.error('Token验证失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户信息
     */
    async getUserProfile() {
        const token = this.getStoredToken();
        if (!token) {
            throw new Error('用户未登录');
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
            throw error;
        }
    }

    /**
     * 检查用户是否已登录
     */
    isAuthenticated() {
        return !!(this.getStoredToken() && this.currentUser);
    }

    /**
     * 获取当前用户信息
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 保存认证信息
     */
    saveAuth(token, user) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser = user;
    }

    /**
     * 清理认证信息
     */
    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem('user'); // 清理旧的sessionStorage
        this.currentUser = null;
    }

    /**
     * 获取存储的Token
     */
    getStoredToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * 获取存储的用户信息
     */
    getStoredUser() {
        const userStr = localStorage.getItem(this.userKey);
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * 带认证的请求工具
     */
    async authenticatedFetch(url, options = {}) {
        const token = this.getStoredToken();
        
        if (!token) {
            throw new Error('用户未登录');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // 如果Token过期，自动跳转到登录页
            if (response.status === 401 || response.status === 403) {
                this.clearAuth();
                window.location.href = 'index.html';
                throw new Error('登录已过期，请重新登录');
            }

            return response;
        } catch (error) {
            console.error('认证请求失败:', error);
            throw error;
        }
    }

    /**
     * 页面访问权限检查
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            // 保存当前页面，登录后可以返回
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    /**
     * 处理登录后的重定向
     */
    handleLoginRedirect() {
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl && redirectUrl !== '/index.html') {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

// 创建全局实例
const authManager = new AuthManager();

// 导出供其他模块使用
window.AuthManager = authManager; 