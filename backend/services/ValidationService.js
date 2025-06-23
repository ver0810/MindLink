/**
 * 验证服务
 * 提供数据验证功能
 */

class ValidationService {
    constructor() {
        // 基本验证规则
        this.rules = {
            required: (value) => value !== null && value !== undefined && value !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            minLength: (value, min) => value && value.length >= min,
            maxLength: (value, max) => value && value.length <= max,
            numeric: (value) => !isNaN(value) && !isNaN(parseFloat(value)),
            positive: (value) => parseFloat(value) > 0
        };
    }

    /**
     * 验证对话数据
     * @param {Object} data - 对话数据
     * @returns {Object} 验证结果
     */
    validateConversation(data) {
        const errors = [];

        // 验证标题
        if (!this.rules.required(data.title)) {
            errors.push('标题不能为空');
        } else if (!this.rules.maxLength(data.title, 200)) {
            errors.push('标题长度不能超过200字符');
        }

        // 验证导师ID
        if (!this.rules.required(data.mentorId)) {
            errors.push('导师ID不能为空');
        }

        // 验证导师名称
        if (!this.rules.required(data.mentorName)) {
            errors.push('导师名称不能为空');
        }

        // 验证模式
        const validModes = ['single', 'roundtable', 'group'];
        if (data.mode && !validModes.includes(data.mode)) {
            errors.push('无效的对话模式');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证消息数据
     * @param {Object} data - 消息数据
     * @returns {Object} 验证结果
     */
    validateMessage(data) {
        const errors = [];

        // 验证内容
        if (!this.rules.required(data.content)) {
            errors.push('消息内容不能为空');
        } else if (!this.rules.maxLength(data.content, 5000)) {
            errors.push('消息内容长度不能超过5000字符');
        }

        // 验证对话ID
        if (!this.rules.required(data.conversationId)) {
            errors.push('对话ID不能为空');
        } else if (!this.rules.numeric(data.conversationId)) {
            errors.push('对话ID必须是数字');
        }

        // 验证发送者类型
        const validSenderTypes = ['user', 'assistant', 'system'];
        if (data.senderType && !validSenderTypes.includes(data.senderType)) {
            errors.push('无效的发送者类型');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证用户数据
     * @param {Object} data - 用户数据
     * @returns {Object} 验证结果
     */
    validateUser(data) {
        const errors = [];

        // 验证用户名
        if (!this.rules.required(data.username)) {
            errors.push('用户名不能为空');
        } else if (!this.rules.minLength(data.username, 3)) {
            errors.push('用户名长度至少3个字符');
        } else if (!this.rules.maxLength(data.username, 50)) {
            errors.push('用户名长度不能超过50个字符');
        }

        // 验证邮箱
        if (data.email && !this.rules.email(data.email)) {
            errors.push('邮箱格式无效');
        }

        // 验证密码
        if (data.password) {
            if (!this.rules.minLength(data.password, 6)) {
                errors.push('密码长度至少6个字符');
            }
            if (!this.rules.maxLength(data.password, 100)) {
                errors.push('密码长度不能超过100个字符');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证分页参数
     * @param {Object} params - 分页参数
     * @returns {Object} 验证结果
     */
    validatePagination(params) {
        const errors = [];

        // 验证页码
        if (params.page !== undefined) {
            if (!this.rules.numeric(params.page)) {
                errors.push('页码必须是数字');
            } else if (!this.rules.positive(params.page)) {
                errors.push('页码必须大于0');
            }
        }

        // 验证每页数量
        if (params.limit !== undefined) {
            if (!this.rules.numeric(params.limit)) {
                errors.push('每页数量必须是数字');
            } else if (!this.rules.positive(params.limit)) {
                errors.push('每页数量必须大于0');
            } else if (parseInt(params.limit) > 100) {
                errors.push('每页数量不能超过100');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 清理和格式化数据
     * @param {Object} data - 原始数据
     * @param {Array} fields - 需要处理的字段
     * @returns {Object} 清理后的数据
     */
    sanitizeData(data, fields) {
        const sanitized = {};

        fields.forEach(field => {
            if (data[field] !== undefined) {
                let value = data[field];
                
                // 字符串类型去除首尾空格
                if (typeof value === 'string') {
                    value = value.trim();
                }
                
                // 数字类型转换
                if (field.includes('Id') || field.includes('Count')) {
                    value = parseInt(value);
                }
                
                sanitized[field] = value;
            }
        });

        return sanitized;
    }

    /**
     * 验证对话创建数据
     * @param {Object} data - 对话创建数据
     * @returns {Object} 验证结果
     */
    validateConversationCreation(data) {
        const errors = [];

        // 验证用户ID
        if (!this.rules.required(data.userId)) {
            errors.push('用户ID不能为空');
        } else if (!this.rules.numeric(data.userId)) {
            errors.push('用户ID必须是数字');
        }

        // 验证标题
        if (!this.rules.required(data.title)) {
            errors.push('标题不能为空');
        } else if (!this.rules.maxLength(data.title, 500)) {
            errors.push('标题长度不能超过500字符');
        }

        // 验证导师ID
        if (!this.rules.required(data.mentorId)) {
            errors.push('导师ID不能为空');
        }

        // 验证导师名称
        if (!this.rules.required(data.mentorName)) {
            errors.push('导师名称不能为空');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证对话更新数据
     * @param {Object} data - 对话更新数据
     * @returns {Object} 验证结果
     */
    validateConversationUpdate(data) {
        const errors = [];

        // 验证标题（如果提供）
        if (data.title !== undefined) {
            if (!this.rules.required(data.title)) {
                errors.push('标题不能为空');
            } else if (!this.rules.maxLength(data.title, 500)) {
                errors.push('标题长度不能超过500字符');
            }
        }

        // 验证描述长度
        if (data.description !== undefined && data.description) {
            if (!this.rules.maxLength(data.description, 2000)) {
                errors.push('描述长度不能超过2000字符');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证请求数据
     * @param {Object} data - 请求数据
     * @param {Object} rules - 验证规则
     * @returns {Object} 验证结果
     */
    validateRequest(data, rules) {
        const errors = [];

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];

            // 必填字段检查
            if (rule.required && !this.rules.required(value)) {
                errors.push(`${field} 不能为空`);
                continue;
            }

            // 类型检查
            if (value !== undefined && rule.type) {
                switch (rule.type) {
                    case 'string':
                        if (typeof value !== 'string') {
                            errors.push(`${field} 必须是字符串`);
                        }
                        break;
                    case 'number':
                        if (!this.rules.numeric(value)) {
                            errors.push(`${field} 必须是数字`);
                        }
                        break;
                    case 'array':
                        if (!Array.isArray(value)) {
                            errors.push(`${field} 必须是数组`);
                        }
                        break;
                    case 'object':
                        if (typeof value !== 'object' || Array.isArray(value)) {
                            errors.push(`${field} 必须是对象`);
                        }
                        break;
                }
            }

            // 长度检查
            if (value !== undefined && rule.maxLength) {
                if (!this.rules.maxLength(value, rule.maxLength)) {
                    errors.push(`${field} 长度不能超过 ${rule.maxLength}`);
                }
            }

            if (value !== undefined && rule.minLength) {
                if (!this.rules.minLength(value, rule.minLength)) {
                    errors.push(`${field} 长度不能少于 ${rule.minLength}`);
                }
            }

            // 枚举值检查
            if (value !== undefined && rule.enum) {
                if (!rule.enum.includes(value)) {
                    errors.push(`${field} 必须是以下值之一: ${rule.enum.join(', ')}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证ID参数
     * @param {any} id - ID值
     * @param {string} name - 参数名称
     * @returns {Object} 验证结果
     */
    validateId(id, name = 'ID') {
        const errors = [];

        if (!this.rules.required(id)) {
            errors.push(`${name}不能为空`);
        } else if (!this.rules.numeric(id)) {
            errors.push(`${name}必须是数字`);
        } else if (!this.rules.positive(id)) {
            errors.push(`${name}必须大于0`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// 单例实例
let instance = null;

/**
 * 获取验证服务实例
 * @returns {ValidationService} 验证服务实例
 */
function getInstance() {
    if (!instance) {
        instance = new ValidationService();
    }
    return instance;
}

module.exports = {
    ValidationService,
    getInstance
}; 