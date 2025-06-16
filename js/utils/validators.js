// FounderMind Platform - 数据验证工具
// 提供各种数据验证功能

const Validators = {
    // 验证API密钥格式
    isValidApiKey(apiKey) {
        if (!apiKey) return false;
        // OpenAI API密钥格式: sk-... 长度为51个字符
        return /^sk-[A-Za-z0-9]{48}$/.test(apiKey);
    },

    // 验证文件类型
    isValidFileType(file, allowedTypes) {
        if (!file || !allowedTypes) return false;
        const extension = Utils.getFileExtension(file.name).toLowerCase();
        return allowedTypes.includes(extension);
    },

    // 验证文件大小
    isValidFileSize(file, maxSizeInMB) {
        if (!file || !maxSizeInMB) return false;
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        return file.size <= maxSizeInBytes;
    },

    // 验证邮箱格式
    isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // 验证URL格式
    isValidUrl(url) {
        if (!url) return false;
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    },

    // 验证手机号格式（中国大陆）
    isValidPhoneNumber(phone) {
        if (!phone) return false;
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    },

    // 验证密码强度
    isStrongPassword(password) {
        if (!password) return false;
        // 至少8位，包含大小写字母、数字和特殊字符
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    },

    // 验证用户名格式
    isValidUsername(username) {
        if (!username) return false;
        // 3-20位字母、数字、下划线
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    },

    // 验证身份证号格式（中国大陆）
    isValidIdCard(idCard) {
        if (!idCard) return false;
        const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        return idCardRegex.test(idCard);
    },

    // 验证日期格式
    isValidDate(date) {
        if (!date) return false;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) return false;
        
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        
        return dateObj.getFullYear() === year &&
               dateObj.getMonth() === month - 1 &&
               dateObj.getDate() === day;
    },

    // 验证JSON字符串
    isValidJSON(str) {
        if (!str) return false;
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    },

    // 验证数组
    isValidArray(arr, options = {}) {
        if (!Array.isArray(arr)) return false;
        
        if (options.minLength !== undefined && arr.length < options.minLength) return false;
        if (options.maxLength !== undefined && arr.length > options.maxLength) return false;
        
        if (options.type) {
            return arr.every(item => typeof item === options.type);
        }
        
        return true;
    },

    // 验证对象
    isValidObject(obj, schema) {
        if (!obj || typeof obj !== 'object') return false;
        
        for (const [key, rules] of Object.entries(schema)) {
            const value = obj[key];
            
            // 检查必填字段
            if (rules.required && (value === undefined || value === null || value === '')) {
                return false;
            }
            
            // 如果字段存在，检查类型
            if (value !== undefined && value !== null) {
                if (rules.type && typeof value !== rules.type) {
                    return false;
                }
                
                // 检查数组
                if (rules.type === 'array' && !this.isValidArray(value, rules.arrayOptions)) {
                    return false;
                }
                
                // 检查对象
                if (rules.type === 'object' && rules.schema && !this.isValidObject(value, rules.schema)) {
                    return false;
                }
                
                // 检查自定义验证函数
                if (rules.validate && !rules.validate(value)) {
                    return false;
                }
            }
        }
        
        return true;
    }
};

// 导出验证工具
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
} else {
    window.Validators = Validators;
} 