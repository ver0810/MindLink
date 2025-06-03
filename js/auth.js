document.addEventListener('DOMContentLoaded', function() {
    // Login modal functionality
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLogin = document.getElementById('close-login');
    const loginForm = document.getElementById('login-form');

    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            loginModal.classList.remove('hidden');
        });
    }

    if (closeLogin) {
        closeLogin.addEventListener('click', function() {
            loginModal.classList.add('hidden');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Simulate login functionality
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Simple validation
            if (email && password) {
                // Store user info in session storage
                sessionStorage.setItem('user', JSON.stringify({
                    email: email,
                    isLoggedIn: true
                }));
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                alert('请填写邮箱和密码');
            }
        });
    }

    // Register modal functionality
    const registerBtn = document.getElementById('register-btn');
    const registerModal = document.getElementById('register-modal');
    const closeRegister = document.getElementById('close-register');
    const registerForm = document.getElementById('register-form');

    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            registerModal.classList.remove('hidden');
        });
    }

    if (closeRegister) {
        closeRegister.addEventListener('click', function() {
            registerModal.classList.add('hidden');
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Simulate registration functionality
            const name = document.getElementById('name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Simple validation
            if (name && email && password) {
                if (password !== confirmPassword) {
                    alert('两次输入的密码不一致');
                    return;
                }
                
                // Store user info in session storage
                sessionStorage.setItem('user', JSON.stringify({
                    name: name,
                    email: email,
                    isLoggedIn: true
                }));
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                alert('请完整填写注册信息');
            }
        });
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.classList.add('hidden');
        }
        if (event.target === registerModal) {
            registerModal.classList.add('hidden');
        }
    });

    // Check if user is logged in
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user && user.isLoggedIn) {
        // If on login page, redirect to dashboard
        if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
            window.location.href = 'dashboard.html';
        }
    } else {
        // If trying to access protected pages without login, redirect to index
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            // In a real application, you would check for protected routes
            // For this prototype, we'll let it pass
        }
    }
});


