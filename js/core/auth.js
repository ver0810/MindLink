document.addEventListener('DOMContentLoaded', function() {
    // API 配置
    const API_BASE_URL = 'http://localhost:3000/api/auth';
    
    // 在表单内部显示错误消息的函数
    function showFormMessage(message, type = 'error', formType = 'login', duration = 6000) {
        let messageElement, textElement, iconElement;
        
        if (formType === 'login') {
            messageElement = document.getElementById('login-error-message');
            textElement = document.getElementById('login-error-text');
            iconElement = document.getElementById('login-error-icon');
        } else {
            messageElement = document.getElementById('register-error-message');
            textElement = document.getElementById('register-error-text');
            iconElement = document.getElementById('register-error-icon');
        }
        
        if (!messageElement || !textElement || !iconElement) return;
        
        // 设置文本内容
        textElement.textContent = message;
        
        // 清除之前的样式
        messageElement.className = 'mb-4 p-4 rounded-lg border-2 transition-all duration-300';
        
        // 根据类型设置样式和图标
        if (type === 'error') {
            messageElement.className += ' bg-red-600 text-white border-red-800 animate-pulse';
            iconElement.innerHTML = `
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            `;
            iconElement.className = 'w-6 h-6 mr-3 flex-shrink-0 animate-bounce';
        } else if (type === 'warning') {
            messageElement.className += ' bg-yellow-600 text-white border-yellow-800';
            iconElement.innerHTML = `
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            `;
            iconElement.className = 'w-6 h-6 mr-3 flex-shrink-0';
        } else if (type === 'success') {
            messageElement.className += ' bg-green-600 text-white border-green-800';
            iconElement.innerHTML = `
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            `;
            iconElement.className = 'w-6 h-6 mr-3 flex-shrink-0';
        }
        
        // 显示消息
        messageElement.classList.remove('hidden');
        
        // 自动隐藏
        if (duration > 0) {
            setTimeout(() => {
                if (messageElement) {
                    messageElement.classList.add('hidden');
                }
            }, duration);
        }
    }
    
    // 隐藏表单错误消息
    function hideFormMessage(formType = 'login') {
        const messageElement = formType === 'login' 
            ? document.getElementById('login-error-message')
            : document.getElementById('register-error-message');
            
        if (messageElement) {
            messageElement.classList.add('hidden');
        }
    }
    
    // 通用的showMessage函数（保留用于成功消息等）
    function showMessage(message, type = 'info', duration = 4000) {
        // 移除现有消息
        const existingMessage = document.getElementById('auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 创建新消息元素
        const messageDiv = document.createElement('div');
        messageDiv.id = 'auth-message';
        messageDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 max-w-md w-full mx-4 p-4 rounded-lg shadow-xl z-50 transition-all duration-300 translate-y-0';
        
        // 根据类型设置样式
        if (type === 'success') {
            messageDiv.className += ' bg-green-600 text-white border-2 border-green-800';
            messageDiv.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-lg font-medium">${message}</span>
                </div>
            `;
        } else if (type === 'error') {
            messageDiv.className += ' bg-red-600 text-white border-2 border-red-800 animate-pulse';
            messageDiv.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-3 flex-shrink-0 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-lg font-semibold">${message}</span>
                </div>
            `;
        } else if (type === 'warning') {
            messageDiv.className += ' bg-yellow-600 text-white border-2 border-yellow-800';
            messageDiv.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-lg font-medium">${message}</span>
                </div>
            `;
        } else {
            messageDiv.className += ' bg-blue-600 text-white border-2 border-blue-800';
            messageDiv.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-lg font-medium">${message}</span>
                </div>
            `;
        }
        
        document.body.appendChild(messageDiv);
        
        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.className = 'absolute top-2 right-2 text-white hover:text-gray-200 transition-colors';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => messageDiv.remove();
        messageDiv.appendChild(closeBtn);
        
        // 自动隐藏
        setTimeout(() => {
            if (messageDiv && messageDiv.parentNode) {
                messageDiv.style.transform = 'translate(-50%, -100%)';
                messageDiv.style.opacity = '0';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, duration);
    }
    
    // 设置按钮加载状态
    function setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中...
            `;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }

    // Login modal functionality
    const loginBtn = document.getElementById('login-btn');
    const loginBtnHeader = document.getElementById('login-btn-header');
    const loginBtnMobile = document.getElementById('login-btn-mobile');
    const loginModal = document.getElementById('login-modal');
    const closeLogin = document.getElementById('close-login');
    const loginForm = document.getElementById('login-form');

    // 打开登录模态框
    function openLoginModal() {
        if (loginModal) {
            loginModal.classList.remove('hidden');
            loginModal.classList.add('flex');
            // 清空表单
            if (loginForm) loginForm.reset();
            // 隐藏错误信息
            hideFormMessage('login');
        }
    }

    // 绑定登录按钮事件
    if (loginBtn) loginBtn.addEventListener('click', openLoginModal);
    if (loginBtnHeader) loginBtnHeader.addEventListener('click', openLoginModal);
    if (loginBtnMobile) loginBtnMobile.addEventListener('click', openLoginModal);

    if (closeLogin) {
        closeLogin.addEventListener('click', function() {
            if (loginModal) {
                loginModal.classList.add('hidden');
                loginModal.classList.remove('flex');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            // 基础验证
            if (!email || !password) {
                showFormMessage('⚠️ 请填写完整的邮箱和密码', 'warning', 'login');
                return;
            }
            
            setButtonLoading(submitBtn, true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: email, password: password })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    localStorage.setItem('auth_token', data.data.token);
                    localStorage.setItem('user_info', JSON.stringify(data.data.user));
                    showMessage('登录成功！正在跳转...', 'success', 2000);
                    
                    loginModal.classList.add('hidden');
                    loginModal.classList.remove('flex');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    // 处理登录错误，特别是密码错误
                    handleLoginError(data, response);
                }
            } catch (error) {
                console.error('登录错误:', error);
                showFormMessage('🌐 网络连接失败，请检查网络设置并重试', 'error', 'login');
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    }

    // 处理登录错误的函数
    function handleLoginError(data, response) {
        let message = '';
        let type = 'error';
        
        if (response.status === 400) {
            // 处理400错误 - 后端登录逻辑返回的错误
            if (data.message) {
                if (data.message.includes('用户名或密码错误')) {
                    // 这里特别处理密码错误和用户不存在的情况
                    message = '🔐 登录失败：用户名或密码错误，请仔细检查您的输入';
                    type = 'error';
                } else if (data.message.includes('账户已被禁用')) {
                    message = '🚫 账号已被禁用，请联系管理员';
                    type = 'error';
                } else if (data.message.includes('用户名和密码都是必填项')) {
                    message = '⚠️ 请填写完整的邮箱和密码';
                    type = 'warning';
                } else if (data.message.includes('邮箱') || data.message.includes('email')) {
                    message = '📧 邮箱格式不正确，请输入有效的邮箱地址';
                    type = 'warning';
                } else {
                    message = data.message;
                }
            } else {
                message = '❌ 登录信息有误，请检查后重试';
                type = 'warning';
            }
        } else if (response.status === 401) {
            // 401 通常表示认证失败
            message = '🔒 身份验证失败，请检查您的登录信息';
            type = 'error';
        } else if (response.status === 500) {
            message = '🔧 服务器暂时无法处理您的请求，请稍后重试';
            type = 'error';
        } else if (response.status === 403) {
            message = '🔐 账号访问受限，请联系管理员';
            type = 'error';
        } else {
            // 其他错误情况
            message = data.message || '❌ 登录失败，请检查您的用户名和密码';
            type = 'error';
        }
        
        showFormMessage(message, type, 'login', 8000); // 在登录表单内部显示错误信息
    }

    // 前端验证函数
    function validateRegistrationForm(username, email, password, confirmPassword) {
        const errors = [];
        
        // 用户名验证
        if (!username) {
            errors.push('请输入用户名');
        } else if (username.length < 3) {
            errors.push('用户名至少需要3个字符');
        } else if (username.length > 20) {
            errors.push('用户名不能超过20个字符');
        } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
            errors.push('用户名只能包含字母、数字、下划线和中文');
        }
        
        // 邮箱验证
        if (!email) {
            errors.push('请输入邮箱地址');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('请输入有效的邮箱地址');
        }
        
        // 密码验证
        if (!password) {
            errors.push('请输入密码');
        } else {
            if (password.length < 6) {
                errors.push('密码长度至少需要6个字符');
            }
            if (password.length > 50) {
                errors.push('密码长度不能超过50个字符');
            }
            if (!/[a-zA-Z]/.test(password)) {
                errors.push('密码必须包含至少一个字母');
            }
            if (!/[0-9]/.test(password)) {
                errors.push('密码必须包含至少一个数字');
            }
        }
        
        // 确认密码验证
        if (!confirmPassword) {
            errors.push('请确认密码');
        } else if (password !== confirmPassword) {
            errors.push('两次输入的密码不一致');
        }
        
        return errors;
    }

    // 根据错误类型显示相应的反馈
    function handleRegistrationError(data, response) {
        let message = '';
        let type = 'error';
        
        if (response.status === 400) {
            // 处理各种400错误
            if (data.message) {
                if (data.message === '用户名已被使用') {
                    message = '🔔 该用户名已被占用，请尝试其他用户名';
                    type = 'warning';
                } else if (data.message === '邮箱已被使用') {
                    message = '📧 该邮箱已被注册，请使用其他邮箱或尝试登录';
                    type = 'warning';
                } else if (data.message.includes('用户名或邮箱已被使用')) {
                    // 兼容旧版本的通用错误信息
                    message = '⚠️ 用户名或邮箱已被使用，请尝试其他信息';
                    type = 'warning';
                } else if (data.message.includes('密码不符合要求')) {
                    message = '🔐 密码不符合要求：必须6-50位，包含字母和数字';
                    type = 'warning';
                } else if (data.errors && Array.isArray(data.errors)) {
                    message = '❌ 输入信息有误：' + data.errors.join('；');
                    type = 'warning';
                } else if (data.message.includes('用户名和密码都是必填项') || data.message.includes('必填项')) {
                    message = '⚠️ 请填写完整的注册信息';
                    type = 'warning';
                } else {
                    message = data.message;
                }
            } else {
                message = '❌ 注册信息有误，请检查后重试';
                type = 'warning';
            }
        } else if (response.status === 500) {
            message = '🔧 服务器暂时无法处理您的请求，请稍后重试';
            type = 'error';
        } else if (response.status === 409) {
            message = '⚠️ 用户已存在，请直接登录或使用其他邮箱注册';
            type = 'warning';
        } else {
            message = data.message || '❌ 注册失败，请稍后重试';
            type = 'error';
        }
        
        showFormMessage(message, type, 'register', 8000); // 在注册表单内部显示错误信息
    }

    // Register modal functionality
    const registerBtn = document.getElementById('register-btn');
    const registerModal = document.getElementById('register-modal');
    const closeRegister = document.getElementById('close-register');
    const registerForm = document.getElementById('register-form');

    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            if (registerModal) {
                registerModal.classList.remove('hidden');
                registerModal.classList.add('flex');
                // 清空表单
                if (registerForm) registerForm.reset();
                // 隐藏错误信息
                hideFormMessage('register');
            }
        });
    }

    if (closeRegister) {
        closeRegister.addEventListener('click', function() {
            if (registerModal) {
                registerModal.classList.add('hidden');
                registerModal.classList.remove('flex');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            
            // 前端验证
            const validationErrors = validateRegistrationForm(username, email, password, confirmPassword);
            if (validationErrors.length > 0) {
                showFormMessage('⚠️ 请检查输入信息：' + validationErrors.join('；'), 'warning', 'register', 8000);
                return;
            }
            
            setButtonLoading(submitBtn, true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // 注册成功
                    localStorage.setItem('auth_token', data.data.token);
                    localStorage.setItem('user_info', JSON.stringify(data.data.user));
                    showMessage('注册成功！欢迎加入 FounderMind，正在为您跳转...', 'success', 3000);
                    
                    registerModal.classList.add('hidden');
                    registerModal.classList.remove('flex');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    // 处理注册失败的各种情况
                    handleRegistrationError(data, response);
                }
            } catch (error) {
                console.error('注册错误:', error);
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    showFormMessage('🌐 无法连接到服务器，请检查网络连接或稍后重试', 'error', 'register', 8000);
                } else {
                    showFormMessage('🌐 网络异常，请检查您的网络连接并重试', 'error', 'register', 8000);
                }
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.classList.add('hidden');
            loginModal.classList.remove('flex');
        }
        if (event.target === registerModal) {
            registerModal.classList.add('hidden');
            registerModal.classList.remove('flex');
        }
    });

    // 按ESC键关闭模态框
    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            if (loginModal && loginModal.classList.contains('flex')) {
                loginModal.classList.add('hidden');
                loginModal.classList.remove('flex');
            }
            if (registerModal && registerModal.classList.contains('flex')) {
                registerModal.classList.add('hidden');
                registerModal.classList.remove('flex');
            }
        }
    });

    // 检查用户登录状态
    function checkAuthStatus() {
        const token = localStorage.getItem('auth_token');
        const userInfo = localStorage.getItem('user_info');
        
        if (token && userInfo) {
            try {
                const user = JSON.parse(userInfo);
                return { isLoggedIn: true, user: user, token: token };
            } catch (error) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                return { isLoggedIn: false };
            }
        }
        return { isLoggedIn: false };
    }

    // 退出登录函数
    window.logout = async function() {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
            try {
                await fetch(`${API_BASE_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('退出登录请求失败:', error);
            }
        }
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        showMessage('已安全退出登录', 'info', 2000);
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    };

    // 验证token是否有效
    window.verifyToken = async function() {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;
        
        try {
            const response = await fetch(`${API_BASE_URL}/verify`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Token验证失败:', error);
            return false;
        }
    };

    // 初始化页面时检查登录状态
    const authStatus = checkAuthStatus();
    window.authStatus = authStatus;

    // 如果在首页且已登录，可以显示欢迎信息但不强制跳转
    if (authStatus.isLoggedIn && (window.location.pathname.includes('index.html') || window.location.pathname === '/')) {
        showMessage(`欢迎回来，${authStatus.user.username}！`, 'info', 3000);
    }
});


