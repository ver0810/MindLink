// 表单实时验证脚本
document.addEventListener('DOMContentLoaded', function() {
    // 实时验证函数
    function addFieldValidation() {
        const usernameField = document.getElementById('name');
        const emailField = document.getElementById('reg-email');
        const passwordField = document.getElementById('reg-password');
        const confirmPasswordField = document.getElementById('confirm-password');

        // 创建错误提示元素
        function createErrorElement(fieldId) {
            const errorId = fieldId + '-error';
            let errorElement = document.getElementById(errorId);
            
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = errorId;
                errorElement.className = 'text-xs text-red-500 mt-1 hidden transition-all duration-200';
                
                const field = document.getElementById(fieldId);
                if (field && field.parentNode) {
                    field.parentNode.appendChild(errorElement);
                }
            }
            
            return errorElement;
        }

        // 显示字段错误
        function showFieldError(fieldId, message) {
            const field = document.getElementById(fieldId);
            const errorElement = createErrorElement(fieldId);
            
            if (field && errorElement) {
                field.classList.add('border-red-500', 'focus:ring-red-500');
                field.classList.remove('border-gray-300', 'focus:ring-blue-500');
                errorElement.textContent = message;
                errorElement.classList.remove('hidden');
            }
        }

        // 清除字段错误
        function clearFieldError(fieldId) {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(fieldId + '-error');
            
            if (field) {
                field.classList.remove('border-red-500', 'focus:ring-red-500');
                field.classList.add('border-gray-300', 'focus:ring-blue-500');
            }
            
            if (errorElement) {
                errorElement.classList.add('hidden');
            }
        }

        // 显示字段成功状态
        function showFieldSuccess(fieldId) {
            const field = document.getElementById(fieldId);
            
            if (field) {
                field.classList.remove('border-red-500', 'focus:ring-red-500');
                field.classList.add('border-green-500', 'focus:ring-green-500');
            }
            
            clearFieldError(fieldId);
        }

        // 用户名验证
        if (usernameField) {
            usernameField.addEventListener('blur', function() {
                const value = this.value.trim();
                
                if (!value) {
                    showFieldError('name', '请输入用户名');
                } else if (value.length < 3) {
                    showFieldError('name', '用户名至少需要3个字符');
                } else if (value.length > 20) {
                    showFieldError('name', '用户名不能超过20个字符');
                } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
                    showFieldError('name', '用户名只能包含字母、数字、下划线和中文');
                } else {
                    showFieldSuccess('name');
                }
            });

            usernameField.addEventListener('input', function() {
                if (this.value.trim()) {
                    clearFieldError('name');
                }
            });
        }

        // 邮箱验证
        if (emailField) {
            emailField.addEventListener('blur', function() {
                const value = this.value.trim();
                
                if (!value) {
                    showFieldError('reg-email', '请输入邮箱地址');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    showFieldError('reg-email', '请输入有效的邮箱地址');
                } else {
                    showFieldSuccess('reg-email');
                }
            });

            emailField.addEventListener('input', function() {
                if (this.value.trim()) {
                    clearFieldError('reg-email');
                }
            });
        }

        // 密码验证
        if (passwordField) {
            passwordField.addEventListener('blur', function() {
                const value = this.value;
                
                if (!value) {
                    showFieldError('reg-password', '请输入密码');
                } else if (value.length < 6) {
                    showFieldError('reg-password', '密码长度至少需要6个字符');
                } else if (value.length > 50) {
                    showFieldError('reg-password', '密码长度不能超过50个字符');
                } else if (!/[a-zA-Z]/.test(value)) {
                    showFieldError('reg-password', '密码必须包含至少一个字母');
                } else if (!/[0-9]/.test(value)) {
                    showFieldError('reg-password', '密码必须包含至少一个数字');
                } else {
                    showFieldSuccess('reg-password');
                    
                    // 如果确认密码已填写，重新验证确认密码
                    if (confirmPasswordField && confirmPasswordField.value) {
                        confirmPasswordField.dispatchEvent(new Event('blur'));
                    }
                }
            });

            passwordField.addEventListener('input', function() {
                if (this.value) {
                    clearFieldError('reg-password');
                }
            });
        }

        // 确认密码验证
        if (confirmPasswordField) {
            confirmPasswordField.addEventListener('blur', function() {
                const value = this.value;
                const passwordValue = passwordField ? passwordField.value : '';
                
                if (!value) {
                    showFieldError('confirm-password', '请确认密码');
                } else if (value !== passwordValue) {
                    showFieldError('confirm-password', '两次输入的密码不一致');
                } else {
                    showFieldSuccess('confirm-password');
                }
            });

            confirmPasswordField.addEventListener('input', function() {
                if (this.value) {
                    clearFieldError('confirm-password');
                }
            });
        }
    }

    // 初始化验证
    addFieldValidation();

    // 监听模态框打开事件，重新初始化验证
    const registerModal = document.getElementById('register-modal');
    if (registerModal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (registerModal.classList.contains('flex')) {
                        // 模态框打开时，清除所有错误状态
                        setTimeout(() => {
                            ['name', 'reg-email', 'reg-password', 'confirm-password'].forEach(fieldId => {
                                const field = document.getElementById(fieldId);
                                if (field) {
                                    field.classList.remove('border-red-500', 'focus:ring-red-500', 'border-green-500', 'focus:ring-green-500');
                                    field.classList.add('border-gray-300', 'focus:ring-blue-500');
                                }
                                const errorElement = document.getElementById(fieldId + '-error');
                                if (errorElement) {
                                    errorElement.classList.add('hidden');
                                }
                            });
                        }, 100);
                    }
                }
            });
        });

        observer.observe(registerModal, { attributes: true });
    }
}); 