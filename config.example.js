// FounderMind 配置示例文件
// 
// 🔑 GitHub Pages 部署配置示例
// 复制这个文件到 js/config.js 并修改API_KEY

const CONFIG = {
    // API 配置
    API: {
        URL: 'https://api.siliconflow.cn/v1/chat/completions',
        MODEL: 'Pro/deepseek-ai/DeepSeek-V3',
        
        // 🔥 将下面的API密钥替换为您的实际密钥
        // 获取方式：https://cloud.siliconflow.cn
        API_KEY: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        
        MAX_TOKENS: 1000,
        TEMPERATURE: 0.7,
        TIMEOUT: 30000
    },
    
    // 环境检测
    ENVIRONMENT: {
        isGitHubPages: window.location.hostname.includes('github.io'),
        isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        isDevelopment: window.location.protocol === 'http:' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
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
            ONE_ON_ONE: '你是{mentor_name}，{mentor_title}。请以{mentor_name}的身份、经验和思维方式回答用户的问题。你的专业领域包括：{expertise}。个人简介：{bio}。\n\n请遵循以下原则：\n1. 始终用中文回答\n2. 体现{mentor_name}的独特见解和风格\n3. 结合你的实际经历和案例\n4. 提供实用且具有启发性的建议\n5. 保持简洁而深刻的表达方式',
            ROUNDTABLE: '你正在主持一场圆桌讨论，参与的导师包括：{mentors_info}。请综合这些导师可能的观点来回答用户的问题，可以突出不同导师的不同见解，或者提供集体的智慧。\n\n请遵循以下原则：\n1. 始终用中文回答\n2. 体现多位导师的综合观点\n3. 指出不同导师可能的分歧和共识\n4. 提供多角度的分析和建议\n5. 营造圆桌讨论的氛围'
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
        // 优先使用写死的API Key（用于GitHub Pages）
        if (CONFIG.API.API_KEY && CONFIG.API.API_KEY !== 'sk-your-hardcoded-api-key-here') {
            return CONFIG.API.API_KEY;
        }
        
        let apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
        
        // 如果没有API密钥，根据环境提供不同的提示
        if (!apiKey) {
            if (CONFIG.ENVIRONMENT.isGitHubPages) {
                apiKey = this._promptForApiKeyOnGitHubPages();
            } else {
                apiKey = this._promptForApiKey();
            }
        }
        
        return apiKey;
    },
    
    // GitHub Pages环境下的API Key提示
    _promptForApiKeyOnGitHubPages() {
        const message = `
🔑 首次使用需要配置API密钥

由于这是GitHub Pages演示版本，您需要：
1. 获取SiliconFlow API密钥（免费额度）
2. 访问：https://cloud.siliconflow.cn
3. 注册并获取API密钥
4. 在下方输入您的密钥

注意：密钥仅存储在您的浏览器本地，绝对安全！
        `.trim();
        
        alert(message);
        
        const apiKey = prompt('请输入您的SiliconFlow API密钥：');
        if (apiKey?.trim()) {
            this.setApiKey(apiKey.trim());
            return apiKey.trim();
        }
        
        alert('未设置API密钥，将使用预设回复模式。');
        return null;
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
        // 检查硬编码的API Key
        if (CONFIG.API.API_KEY && CONFIG.API.API_KEY !== 'sk-your-hardcoded-api-key-here') {
            return true;
        }
        return !!localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
    },
    
    // 显示配置信息
    showConfig() {
        let apiKey = this.getApiKey();
        const maskedKey = apiKey ? apiKey.substring(0, 8) + '...' : '未设置';
        const source = (CONFIG.API.API_KEY && CONFIG.API.API_KEY !== 'sk-your-hardcoded-api-key-here') ? '（硬编码）' : '（本地存储）';
        alert(`当前配置：\nAPI Key: ${maskedKey} ${source}\nAPI Model: ${CONFIG.API.MODEL}`);
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