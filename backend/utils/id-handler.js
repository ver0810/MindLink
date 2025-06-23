/**
 * ID处理工具
 * 统一处理用户ID、对话ID等的类型转换和验证
 */

class IDHandler {
    /**
     * 将ID转换为数据库兼容的格式
     * @param {string|number} id - 输入ID
     * @param {string} idType - ID类型描述（用于错误信息）
     * @returns {number|string} 处理后的ID
     */
    static toDbFormat(id, idType = 'ID') {
        if (id === null || id === undefined) {
            throw new Error(`${idType}不能为空`);
        }

        // 如果是数字，直接返回
        if (typeof id === 'number') {
            if (!Number.isInteger(id) || id <= 0) {
                throw new Error(`${idType}必须是正整数`);
            }
            return id;
        }

        // 如果是字符串
        if (typeof id === 'string') {
            // 检查是否为纯数字字符串
            if (/^\d+$/.test(id)) {
                const numId = parseInt(id, 10);
                if (numId <= 0) {
                    throw new Error(`${idType}必须是正整数`);
                }
                return numId;
            }
            
            // 检查是否为UUID格式
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
                return id; // 返回UUID字符串
            }
            
            throw new Error(`${idType}格式无效`);
        }

        throw new Error(`${idType}类型无效`);
    }

    /**
     * 验证用户ID
     * @param {string|number} userId - 用户ID
     * @returns {number} 验证后的用户ID
     */
    static validateUserId(userId) {
        try {
            const validId = this.toDbFormat(userId, '用户ID');
            if (typeof validId !== 'number') {
                throw new Error('用户ID必须是数字');
            }
            return validId;
        } catch (error) {
            throw new Error(`用户ID验证失败: ${error.message}`);
        }
    }

    /**
     * 验证对话ID
     * @param {string|number} conversationId - 对话ID
     * @returns {number} 验证后的对话ID
     */
    static validateConversationId(conversationId) {
        try {
            const validId = this.toDbFormat(conversationId, '对话ID');
            if (typeof validId !== 'number') {
                throw new Error('对话ID必须是数字');
            }
            return validId;
        } catch (error) {
            throw new Error(`对话ID验证失败: ${error.message}`);
        }
    }

    /**
     * 安全地从请求参数中提取用户ID
     * @param {Object} req - Express请求对象
     * @returns {number} 用户ID
     */
    static extractUserId(req) {
        if (!req.user || !req.user.id) {
            throw new Error('用户未认证或认证信息无效');
        }
        return this.validateUserId(req.user.id);
    }

    /**
     * 安全地从请求参数中提取对话ID
     * @param {Object} req - Express请求对象
     * @param {string} paramName - 参数名称，默认为'id'
     * @returns {number} 对话ID
     */
    static extractConversationId(req, paramName = 'id') {
        const conversationId = req.params[paramName];
        if (!conversationId) {
            throw new Error(`缺少参数: ${paramName}`);
        }
        return this.validateConversationId(conversationId);
    }

    /**
     * 批量验证ID数组
     * @param {Array} ids - ID数组
     * @param {string} idType - ID类型描述
     * @returns {Array} 验证后的ID数组
     */
    static validateIdArray(ids, idType = 'ID') {
        if (!Array.isArray(ids)) {
            throw new Error(`${idType}列表必须是数组`);
        }

        if (ids.length === 0) {
            throw new Error(`${idType}列表不能为空`);
        }

        return ids.map((id, index) => {
            try {
                return this.toDbFormat(id, `${idType}[${index}]`);
            } catch (error) {
                throw new Error(`${idType}列表第${index + 1}项无效: ${error.message}`);
            }
        });
    }

    /**
     * 创建标准化的ID响应
     * @param {number|string} id - ID值
     * @returns {Object} 标准化的ID对象
     */
    static createIdResponse(id) {
        return {
            id: id,
            type: typeof id,
            string: String(id),
            number: typeof id === 'number' ? id : (typeof id === 'string' && /^\d+$/.test(id) ? parseInt(id, 10) : null)
        };
    }

    /**
     * 比较两个ID是否相等（支持类型转换）
     * @param {number|string} id1 - 第一个ID
     * @param {number|string} id2 - 第二个ID
     * @returns {boolean} 是否相等
     */
    static idsEqual(id1, id2) {
        // 直接比较
        if (id1 === id2) return true;
        
        // 类型转换比较
        if (typeof id1 === 'number' && typeof id2 === 'string') {
            return id1.toString() === id2;
        }
        
        if (typeof id1 === 'string' && typeof id2 === 'number') {
            return id1 === id2.toString();
        }
        
        // 数字字符串比较
        if (typeof id1 === 'string' && typeof id2 === 'string') {
            if (/^\d+$/.test(id1) && /^\d+$/.test(id2)) {
                return parseInt(id1, 10) === parseInt(id2, 10);
            }
        }
        
        return false;
    }

    /**
     * 格式化ID用于日志输出
     * @param {number|string} id - ID值
     * @param {string} label - ID标签
     * @returns {string} 格式化的字符串
     */
    static formatForLog(id, label = 'ID') {
        if (id === null || id === undefined) {
            return `${label}: null`;
        }
        return `${label}: ${id} (${typeof id})`;
    }
}

module.exports = IDHandler; 