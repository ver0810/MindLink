/**
 * 导师管理系统模块
 * 负责导师选择、信息管理、推荐算法等功能
 */

class MentorSystem {
    constructor() {
        this.mentors = [];
        this.currentMentor = null;
        this.userPreferences = {};
        this.initialize();
    }

    /**
     * 初始化导师系统
     */
    async initialize() {
        try {
            await this.loadMentors();
            this.loadUserPreferences();
            console.log('导师系统初始化成功');
        } catch (error) {
            console.error('导师系统初始化失败:', error);
        }
    }

    /**
     * 加载导师数据
     */
    async loadMentors() {
        try {
            // 从数据文件加载导师信息
            if (window.mentorsData) {
                this.mentors = window.mentorsData;
            } else {
                // 动态加载导师数据
                const response = await fetch('./assets/data/mentors.js');
                const script = await response.text();
                eval(script);
                this.mentors = window.mentorsData || [];
            }
        } catch (error) {
            console.error('加载导师数据失败:', error);
            this.mentors = [];
        }
    }

    /**
     * 加载用户偏好设置
     */
    loadUserPreferences() {
        if (window.storageManager) {
            this.userPreferences = window.storageManager.local.get('mentor_preferences', {
                favoriteCategories: [],
                excludedMentors: [],
                interactionHistory: {}
            });
        }
    }

    /**
     * 保存用户偏好设置
     */
    saveUserPreferences() {
        if (window.storageManager) {
            window.storageManager.local.set('mentor_preferences', this.userPreferences);
        }
    }

    /**
     * 获取所有导师列表
     * @returns {Array} 导师列表
     */
    getAllMentors() {
        return this.mentors.filter(mentor => !this.userPreferences.excludedMentors.includes(mentor.id));
    }

    /**
     * 根据类别获取导师
     * @param {string} category 导师类别
     * @returns {Array} 筛选后的导师列表
     */
    getMentorsByCategory(category) {
        return this.getAllMentors().filter(mentor => 
            mentor.category === category || mentor.tags?.includes(category)
        );
    }

    /**
     * 根据ID获取导师信息
     * @param {string} mentorId 导师ID
     * @returns {Object|null} 导师信息
     */
    getMentorById(mentorId) {
        return this.mentors.find(mentor => mentor.id === mentorId) || null;
    }

    /**
     * 搜索导师
     * @param {string} query 搜索关键词
     * @returns {Array} 搜索结果
     */
    searchMentors(query) {
        const queryLower = query.toLowerCase();
        return this.getAllMentors().filter(mentor => 
            mentor.name.toLowerCase().includes(queryLower) ||
            mentor.description?.toLowerCase().includes(queryLower) ||
            mentor.expertise?.some(skill => skill.toLowerCase().includes(queryLower)) ||
            mentor.tags?.some(tag => tag.toLowerCase().includes(queryLower))
        );
    }

    /**
     * 推荐导师算法
     * @param {number} limit 推荐数量限制
     * @returns {Array} 推荐的导师列表
     */
    getRecommendedMentors(limit = 5) {
        const allMentors = this.getAllMentors();
        const { favoriteCategories, interactionHistory } = this.userPreferences;

        // 计算导师推荐分数
        const scoredMentors = allMentors.map(mentor => {
            let score = 0;

            // 基于用户喜好类别加分
            if (favoriteCategories.includes(mentor.category)) {
                score += 30;
            }

            // 基于标签匹配加分
            if (mentor.tags) {
                const tagMatches = mentor.tags.filter(tag => favoriteCategories.includes(tag));
                score += tagMatches.length * 10;
            }

            // 基于历史交互加分
            const interactions = interactionHistory[mentor.id] || 0;
            score += Math.min(interactions * 5, 25); // 最多加25分

            // 基于导师评级加分
            if (mentor.rating) {
                score += mentor.rating * 2;
            }

            // 随机因子，增加推荐多样性
            score += Math.random() * 10;

            return { ...mentor, recommendScore: score };
        });

        // 按分数排序并返回前N个
        return scoredMentors
            .sort((a, b) => b.recommendScore - a.recommendScore)
            .slice(0, limit);
    }

    /**
     * 设置当前导师
     * @param {string} mentorId 导师ID
     * @returns {boolean} 设置是否成功
     */
    setCurrentMentor(mentorId) {
        const mentor = this.getMentorById(mentorId);
        if (mentor) {
            this.currentMentor = mentor;
            this.recordInteraction(mentorId);
            
            // 触发导师切换事件
            this.dispatchEvent('mentorChanged', { mentor: mentor });
            return true;
        }
        return false;
    }

    /**
     * 获取当前导师
     * @returns {Object|null} 当前导师信息
     */
    getCurrentMentor() {
        return this.currentMentor;
    }

    /**
     * 记录用户与导师的交互
     * @param {string} mentorId 导师ID
     */
    recordInteraction(mentorId) {
        if (!this.userPreferences.interactionHistory[mentorId]) {
            this.userPreferences.interactionHistory[mentorId] = 0;
        }
        this.userPreferences.interactionHistory[mentorId]++;
        this.saveUserPreferences();
    }

    /**
     * 添加收藏类别
     * @param {string} category 类别名称
     */
    addFavoriteCategory(category) {
        if (!this.userPreferences.favoriteCategories.includes(category)) {
            this.userPreferences.favoriteCategories.push(category);
            this.saveUserPreferences();
        }
    }

    /**
     * 移除收藏类别
     * @param {string} category 类别名称
     */
    removeFavoriteCategory(category) {
        const index = this.userPreferences.favoriteCategories.indexOf(category);
        if (index > -1) {
            this.userPreferences.favoriteCategories.splice(index, 1);
            this.saveUserPreferences();
        }
    }

    /**
     * 排除导师
     * @param {string} mentorId 导师ID
     */
    excludeMentor(mentorId) {
        if (!this.userPreferences.excludedMentors.includes(mentorId)) {
            this.userPreferences.excludedMentors.push(mentorId);
            this.saveUserPreferences();
        }
    }

    /**
     * 取消排除导师
     * @param {string} mentorId 导师ID
     */
    unexcludeMentor(mentorId) {
        const index = this.userPreferences.excludedMentors.indexOf(mentorId);
        if (index > -1) {
            this.userPreferences.excludedMentors.splice(index, 1);
            this.saveUserPreferences();
        }
    }

    /**
     * 获取导师统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        const totalMentors = this.mentors.length;
        const availableMentors = this.getAllMentors().length;
        const categories = [...new Set(this.mentors.map(m => m.category))];
        const mostInteractedMentor = this.getMostInteractedMentor();

        return {
            totalMentors,
            availableMentors,
            excludedCount: totalMentors - availableMentors,
            categories: categories.length,
            favoriteCategories: this.userPreferences.favoriteCategories.length,
            mostInteractedMentor
        };
    }

    /**
     * 获取交互最多的导师
     * @returns {Object|null} 导师信息
     */
    getMostInteractedMentor() {
        const { interactionHistory } = this.userPreferences;
        if (Object.keys(interactionHistory).length === 0) return null;

        const mostInteractedId = Object.keys(interactionHistory)
            .reduce((a, b) => interactionHistory[a] > interactionHistory[b] ? a : b);

        return this.getMentorById(mostInteractedId);
    }

    /**
     * 事件分发
     * @param {string} eventName 事件名称
     * @param {Object} data 事件数据
     */
    dispatchEvent(eventName, data) {
        const event = new CustomEvent(`mentor:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * 重置用户偏好
     */
    resetPreferences() {
        this.userPreferences = {
            favoriteCategories: [],
            excludedMentors: [],
            interactionHistory: {}
        };
        this.saveUserPreferences();
        this.dispatchEvent('preferencesReset', {});
    }
}

// 创建全局导师系统实例
window.mentorSystem = new MentorSystem();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MentorSystem;
} 