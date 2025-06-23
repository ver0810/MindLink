/**
 * 对话标签管理组件
 * 负责显示、管理和分析对话标签
 */

class ConversationTagsManager {
    constructor() {
        this.tags = [];
        this.tagRecommendations = [];
        this.selectedTags = new Set();
        this.currentConversationId = null;
    }

    /**
     * 初始化标签管理器
     */
    async initialize(conversationId) {
        this.currentConversationId = conversationId;
        await this.loadTags();
        await this.loadTagRecommendations();
        this.setupEventListeners();
    }

    /**
     * 加载所有可用标签
     */
    async loadTags() {
        try {
            const response = await fetch('/api/conversation-analysis/tags', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.tags = data.data.tags;
            }
        } catch (error) {
            console.error('加载标签失败:', error);
        }
    }

    /**
     * 加载标签推荐
     */
    async loadTagRecommendations() {
        if (!this.currentConversationId) return;

        try {
            const response = await fetch(`/api/conversation-analysis/${this.currentConversationId}/tag-recommendations`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.tagRecommendations = data.data.recommendations;
            }
        } catch (error) {
            console.error('加载标签推荐失败:', error);
        }
    }

    /**
     * 渲染标签显示组件
     */
    renderTagsDisplay(conversation, container) {
        if (!container) return;

        const tagsHtml = this.createTagsDisplayHtml(conversation);
        container.innerHTML = tagsHtml;
        
        // 绑定事件
        this.bindTagEvents(container);
    }

    /**
     * 创建标签显示HTML
     */
    createTagsDisplayHtml(conversation) {
        const summary = conversation.summary || conversation.aiSummary;
        const tags = conversation.autoTags || conversation.auto_tags || [];
        const problemCategories = conversation.problemCategories || conversation.problem_categories || [];
        const keyTopics = conversation.keyTopics || conversation.key_topics || [];
        const complexityLevel = conversation.complexityLevel || conversation.complexity_level || 1;

        return `
            <div class="conversation-analysis-panel bg-slate-800 rounded-lg p-4 border border-slate-700">
                <!-- 对话总结 -->
                <div class="summary-section mb-4">
                    <h3 class="text-sm font-semibold text-slate-300 mb-2 flex items-center">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        对话总结
                    </h3>
                    <div class="summary-content bg-slate-700/50 rounded-md p-3">
                        ${summary ? `
                            <p class="text-slate-200 text-sm leading-relaxed">${this.escapeHtml(summary)}</p>
                        ` : `
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400 text-sm">暂无总结</span>
                                <button class="analyze-conversation-btn text-sky-400 hover:text-sky-300 text-sm" 
                                        data-conversation-id="${conversation.id}">
                                    生成分析
                                </button>
                            </div>
                        `}
                    </div>
                </div>

                <!-- 问题类型标签 -->
                ${problemCategories.length > 0 ? `
                    <div class="problem-types-section mb-4">
                        <h4 class="text-xs font-medium text-slate-400 mb-2">问题类型</h4>
                        <div class="flex flex-wrap gap-2">
                            ${problemCategories.map(type => this.createTagElement(type, 'problem-type')).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- 关键话题 -->
                ${keyTopics.length > 0 ? `
                    <div class="key-topics-section mb-4">
                        <h4 class="text-xs font-medium text-slate-400 mb-2">关键话题</h4>
                        <div class="flex flex-wrap gap-2">
                            ${keyTopics.map(topic => this.createTagElement(topic, 'topic')).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- 自动标签 -->
                ${tags.length > 0 ? `
                    <div class="auto-tags-section mb-4">
                        <h4 class="text-xs font-medium text-slate-400 mb-2">智能标签</h4>
                        <div class="flex flex-wrap gap-2">
                            ${tags.map(tag => this.createTagElement(tag, 'auto')).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- 复杂度指示器 -->
                <div class="complexity-section mb-4">
                    <h4 class="text-xs font-medium text-slate-400 mb-2">复杂度等级</h4>
                    <div class="complexity-indicator flex items-center space-x-1">
                        ${this.createComplexityIndicator(complexityLevel)}
                        <span class="text-xs text-slate-400 ml-2">${this.getComplexityLabel(complexityLevel)}</span>
                    </div>
                </div>

                <!-- 标签推荐 -->
                ${this.tagRecommendations.length > 0 ? `
                    <div class="tag-recommendations-section">
                        <h4 class="text-xs font-medium text-slate-400 mb-2">推荐标签</h4>
                        <div class="space-y-2">
                            ${this.tagRecommendations.slice(0, 3).map(rec => this.createRecommendationElement(rec)).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- 操作按钮 -->
                <div class="actions-section mt-4 pt-3 border-t border-slate-700">
                    <div class="flex space-x-2">
                        <button class="manage-tags-btn text-xs bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded transition-colors"
                                data-conversation-id="${conversation.id}">
                            管理标签
                        </button>
                        <button class="analyze-conversation-btn text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
                                data-conversation-id="${conversation.id}">
                            重新分析
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建标签元素
     */
    createTagElement(tagName, type) {
        const tag = this.getTagInfo(tagName);
        const color = tag ? tag.color : this.getDefaultColorForType(type);
        const displayName = tag ? tag.display_name : this.formatTagName(tagName);

        return `
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}40;">
                ${this.escapeHtml(displayName)}
            </span>
        `;
    }

    /**
     * 创建复杂度指示器
     */
    createComplexityIndicator(level) {
        const maxLevel = 5;
        let indicators = '';
        
        for (let i = 1; i <= maxLevel; i++) {
            const isActive = i <= level;
            const color = this.getComplexityColor(i, level);
            indicators += `
                <div class="w-3 h-3 rounded-full ${isActive ? 'opacity-100' : 'opacity-30'}"
                     style="background-color: ${color}"></div>
            `;
        }
        
        return indicators;
    }

    /**
     * 创建推荐标签元素
     */
    createRecommendationElement(recommendation) {
        const confidence = Math.round(recommendation.confidence_score * 100);
        
        return `
            <div class="recommendation-item flex items-center justify-between bg-slate-700/30 rounded-md p-2">
                <div class="flex items-center space-x-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style="background-color: ${recommendation.color}20; color: ${recommendation.color};">
                        ${this.escapeHtml(recommendation.display_name)}
                    </span>
                    <span class="text-xs text-slate-400">${confidence}%</span>
                </div>
                <div class="flex space-x-1">
                    <button class="accept-tag-btn text-green-400 hover:text-green-300 p-1"
                            data-tag-id="${recommendation.tag_id}"
                            data-recommendation-id="${recommendation.id}"
                            title="接受推荐">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                    </button>
                    <button class="reject-tag-btn text-red-400 hover:text-red-300 p-1"
                            data-tag-id="${recommendation.tag_id}"
                            data-recommendation-id="${recommendation.id}"
                            title="拒绝推荐">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件监听器
     */
    bindTagEvents(container) {
        // 分析对话按钮
        container.querySelectorAll('.analyze-conversation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const conversationId = e.target.dataset.conversationId;
                this.analyzeConversation(conversationId);
            });
        });

        // 管理标签按钮
        container.querySelectorAll('.manage-tags-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const conversationId = e.target.dataset.conversationId;
                this.openTagManagementModal(conversationId);
            });
        });

        // 接受推荐标签
        container.querySelectorAll('.accept-tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tagId = e.target.dataset.tagId;
                const recommendationId = e.target.dataset.recommendationId;
                this.acceptTagRecommendation(tagId, recommendationId);
            });
        });

        // 拒绝推荐标签
        container.querySelectorAll('.reject-tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tagId = e.target.dataset.tagId;
                const recommendationId = e.target.dataset.recommendationId;
                this.rejectTagRecommendation(tagId, recommendationId);
            });
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 可以在这里添加全局事件监听器
    }

    /**
     * 分析对话
     */
    async analyzeConversation(conversationId) {
        try {
            this.showLoading('正在分析对话...');

            const response = await fetch(`/api/conversation-analysis/${conversationId}/analyze`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.showSuccess('对话分析完成');
                
                // 重新加载推荐
                await this.loadTagRecommendations();
                
                // 触发刷新事件
                this.dispatchEvent('analysisCompleted', { conversationId, analysis: data.data.analysis });
            } else {
                throw new Error('分析失败');
            }
        } catch (error) {
            console.error('分析对话失败:', error);
            this.showError('分析失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 接受标签推荐
     */
    async acceptTagRecommendation(tagId, recommendationId) {
        try {
            await this.applyTags([tagId], { [tagId]: 'accepted' });
            this.showSuccess('标签已应用');
            
            // 移除推荐项
            this.removeRecommendationFromUI(recommendationId);
        } catch (error) {
            console.error('应用标签失败:', error);
            this.showError('应用标签失败');
        }
    }

    /**
     * 拒绝标签推荐
     */
    async rejectTagRecommendation(tagId, recommendationId) {
        try {
            const response = await fetch(`/api/conversation-analysis/${this.currentConversationId}/apply-tags`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tagIds: [],
                    feedback: { [tagId]: 'rejected' }
                })
            });

            if (response.ok) {
                this.showSuccess('已记录反馈');
                this.removeRecommendationFromUI(recommendationId);
            }
        } catch (error) {
            console.error('记录反馈失败:', error);
        }
    }

    /**
     * 应用标签
     */
    async applyTags(tagIds, feedback = {}) {
        const response = await fetch(`/api/conversation-analysis/${this.currentConversationId}/apply-tags`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tagIds, feedback })
        });

        if (!response.ok) {
            throw new Error('应用标签失败');
        }

        return await response.json();
    }

    /**
     * 辅助方法
     */
    getTagInfo(tagName) {
        return this.tags.find(tag => tag.name === tagName);
    }

    getDefaultColorForType(type) {
        const colors = {
            'problem-type': '#FF6B6B',
            'topic': '#4ECDC4',
            'auto': '#45B7D1',
            'sentiment': '#96CEB4',
            'complexity': '#FFEAA7'
        };
        return colors[type] || '#6C7B7F';
    }

    formatTagName(tagName) {
        return tagName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getComplexityLabel(level) {
        const labels = ['', '简单', '简单', '中等', '复杂', '非常复杂'];
        return labels[level] || '未知';
    }

    getComplexityColor(index, currentLevel) {
        if (index <= currentLevel) {
            if (index <= 2) return '#10B981'; // 绿色
            if (index <= 3) return '#F59E0B'; // 黄色
            return '#EF4444'; // 红色
        }
        return '#6B7280'; // 灰色
    }

    removeRecommendationFromUI(recommendationId) {
        const element = document.querySelector(`[data-recommendation-id="${recommendationId}"]`)?.closest('.recommendation-item');
        if (element) {
            element.style.opacity = '0';
            setTimeout(() => element.remove(), 300);
        }
    }

    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(message) {
        // 实现加载提示
        console.log('Loading:', message);
    }

    hideLoading() {
        // 隐藏加载提示
    }

    showSuccess(message) {
        // 实现成功提示
        console.log('Success:', message);
    }

    showError(message) {
        // 实现错误提示
        console.error('Error:', message);
    }
}

// 导出类
window.ConversationTagsManager = ConversationTagsManager; 