// FounderMind 简化配置文件
const CONFIG = {
    // API 配置
    API: {
        // URL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        // MODEL: 'deepseek-v3-250324',
        URL: 'https://api.siliconflow.cn/v1/chat/completions',
        MODEL: 'Pro/deepseek-ai/DeepSeek-V3',
        API_KEY: 'sk-tadwvjacxxdddynmbevczahgiruvpximvvgblwrxeutqqity', // 在这里填入您的API Key
        MAX_TOKENS: 1000,
        TEMPERATURE: 0.7,
        TIMEOUT: 30000 // 30秒超时
    },
    
    // 本地存储 key
    STORAGE_KEYS: {
        API_KEY: 'foundermind_api_key',
        EMBEDDING_KEY: 'foundermind_embedding_api_key',
        USER_PREFERENCES: 'foundermind_preferences'
    },
    
    // 对话设置
    CONVERSATION: {
        MAX_HISTORY: 10,
        TYPING_DELAY: 1000,
        SYSTEM_PROMPTS: {
            ONE_ON_ONE: '你是{mentor_name}，{mentor_title}。请以{mentor_name}的身份、经验和思维方式回答用户的问题。你的专业领域包括：{expertise}。个人简介：{bio}。请始终用中文回答，体现{mentor_name}的独特见解和风格。',
            ROUNDTABLE: '你正在主持一场圆桌讨论，参与的导师包括：{mentors_info}。请综合这些导师可能的观点来回答用户的问题，可以突出不同导师的不同见解，或者提供集体的智慧。请始终用中文回答，并体现多位导师的综合观点。'
        }
    },
    
    // UI 配置
    UI: {
        MAX_MENTORS_DISPLAY: 4,
        MOBILE_BREAKPOINT: 768,
        CHAT_SCROLL_DELAY: 100
    }
};

// 简化的 API 管理器
const ApiManager = {
    // 获取 API Key
    getApiKey() {
        let apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
        
        if (!apiKey) {
            apiKey = this._promptForApiKey();
        }
        
        return apiKey;
    },
    
    // 私有方法：提示用户输入 API Key
    _promptForApiKey() {
        const apiKey = prompt('请输入您的API Key：');
        if (apiKey?.trim()) {
            this.setApiKey(apiKey.trim());
            return apiKey.trim();
        }
        alert('未设置API Key，部分功能可能无法使用。');
        return null;
    },
    
    // 设置 API Key
    setApiKey(key) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, key);
    },
    
    // 清除 API Key
    clearApiKey() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.API_KEY);
        alert('API Key已清除');
    },
    
    // 检查是否有 API Key
    hasApiKey() {
        return !!localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
    },
    
    // 显示配置信息
    showConfig() {
        const apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
        const maskedKey = apiKey ? apiKey.substring(0, 8) + '...' : '未设置';
        alert(`当前配置：\nAPI Key: ${maskedKey}\nAPI Model: ${CONFIG.API.MODEL}`);
    }
};

// 工具函数
const Utils = {
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 格式化文本 - 替换模板变量
    formatTemplate(template, variables) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return variables[key] || match;
        });
    },
    
    // 截断文本
    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    
    // 滚动到元素底部
    scrollToBottom(element, delay = CONFIG.UI.CHAT_SCROLL_DELAY) {
        if (!element) return;
        
        setTimeout(() => {
            element.scrollTo({
                top: element.scrollHeight,
                behavior: 'smooth'
            });
        }, delay);
    }
};

// 向后兼容的别名
const SettingsManager = ApiManager;
