/**
 * 历史对话组件
 * 负责对话记录的展示、搜索、筛选等功能
 */
class ConversationHistory {
    constructor() {
        this.conversations = [];
        this.filteredConversations = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 1;
        this.isLoading = false;
        this.filters = {
            search: '',
            mentor: '',
            sortOrder: 'updated_desc'
        };
        this.statistics = null;
        
        this.initialize();
    }

    /**
     * 初始化组件
     */
    async initialize() {
        try {
            // 检查用户登录状态
            if (!this.checkAuthStatus()) {
                return;
            }

            this.setupEventListeners();
            await this.loadStatistics();
            await this.loadConversations();
        } catch (error) {
            console.error('初始化历史对话组件失败:', error);
            this.showError('初始化失败，请刷新页面重试');
        }
    }

    /**
     * 检查用户认证状态
     */
    checkAuthStatus() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            this.showLoginRequired();
            return false;
        }
        return true;
    }

    /**
     * 显示需要登录的提示
     */
    showLoginRequired() {
        const container = document.getElementById('conversations-container');
        container.innerHTML = `
            <div class="text-center py-16">
                <div class="text-gray-400 text-lg mb-4">请先登录查看历史对话</div>
                <button id="login-prompt-btn" class="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium">
                    立即登录
                </button>
            </div>
        `;
        
        document.getElementById('login-prompt-btn').addEventListener('click', () => {
            document.getElementById('login-btn-header').click();
        });
        
        this.hideElement('loading-state');
        this.hideElement('stats-section');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 搜索框事件
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.loadConversations();
            }, 500));
        }

        // 导师筛选事件
        const mentorFilter = document.getElementById('mentor-filter');
        if (mentorFilter) {
            mentorFilter.addEventListener('change', () => {
                this.filters.mentor = mentorFilter.value;
                this.currentPage = 1;
                this.loadConversations();
            });
        }

        // 排序事件
        const sortOrder = document.getElementById('sort-order');
        if (sortOrder) {
            sortOrder.addEventListener('change', () => {
                this.filters.sortOrder = sortOrder.value;
                this.currentPage = 1;
                this.loadConversations();
            });
        }

        // 清除筛选事件
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // 加载更多事件
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreConversations();
            });
        }

        // 模态框事件
        const closeModal = document.getElementById('close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // 点击模态框外部关闭
        const modal = document.getElementById('conversation-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    /**
     * 加载统计信息
     */
    async loadStatistics() {
        try {
            const response = await fetch('http://localhost:3000/api/conversations/stats/overview', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.statistics = data.data;
                this.renderStatistics();
            }
        } catch (error) {
            console.error('加载统计信息失败:', error);
        }
    }

    /**
     * 渲染统计信息
     */
    renderStatistics() {
        if (!this.statistics) return;

        const { basicStats } = this.statistics;
        
        document.getElementById('total-conversations').textContent = basicStats.total_conversations || 0;
        document.getElementById('total-messages').textContent = basicStats.total_messages || 0;
        document.getElementById('favorite-conversations').textContent = basicStats.favorite_conversations || 0;
        document.getElementById('archived-conversations').textContent = basicStats.archived_conversations || 0;
    }

    /**
     * 加载对话列表
     */
    async loadConversations(reset = true) {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            
            if (reset) {
                this.showElement('loading-state');
                this.hideElement('empty-state');
                this.hideElement('conversations-container');
            }

            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                ...this.filters
            });

            const response = await fetch(`http://localhost:3000/api/conversations?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('加载对话失败');
            }

            const data = await response.json();
            
            if (reset) {
                this.conversations = data.data.conversations;
            } else {
                this.conversations = [...this.conversations, ...data.data.conversations];
            }

            this.totalPages = data.data.pagination.totalPages;
            
            await this.renderConversations();
            this.updateLoadMoreButton();
            
        } catch (error) {
            console.error('加载对话失败:', error);
            this.showError('加载对话失败，请重试');
        } finally {
            this.isLoading = false;
            this.hideElement('loading-state');
        }
    }

    /**
     * 加载更多对话
     */
    async loadMoreConversations() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            await this.loadConversations(false);
        }
    }

    /**
     * 渲染对话列表
     */
    async renderConversations() {
        const container = document.getElementById('conversations-container');
        
        if (this.conversations.length === 0) {
            this.showElement('empty-state');
            this.hideElement('conversations-container');
            return;
        }

        this.showElement('conversations-container');
        this.hideElement('empty-state');

        // 如果是重新加载，清空容器
        if (this.currentPage === 1) {
            container.innerHTML = '';
        }

        // 渲染每个对话项
        this.conversations.forEach(conversation => {
            const existingCard = container.querySelector(`[data-conversation-id="${conversation.id}"]`);
            if (!existingCard) {
                const conversationCard = this.createConversationCard(conversation);
                container.appendChild(conversationCard);
            }
        });

        // 更新导师筛选选项
        this.updateMentorFilter();
    }

    /**
     * 创建对话卡片
     */
    createConversationCard(conversation) {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-primary transition-colors cursor-pointer';
        card.setAttribute('data-conversation-id', conversation.id);

        const createdAt = new Date(conversation.createdAt || conversation.created_at).toLocaleString('zh-CN');
        const updatedAt = new Date(conversation.updatedAt || conversation.updated_at || conversation.createdAt || conversation.created_at).toLocaleString('zh-CN');
        
        // 获取分析数据
        const summary = conversation.summary || conversation.aiSummary;
        const problemCategories = conversation.problemCategories || conversation.problem_categories || [];
        const keyTopics = conversation.keyTopics || conversation.key_topics || [];
        const autoTags = conversation.autoTags || conversation.auto_tags || [];
        const complexityLevel = conversation.complexityLevel || conversation.complexity_level || 1;
        
        card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-white mb-2">${this.escapeHtml(conversation.title)}</h3>
                    <div class="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
                            </svg>
                            ${this.escapeHtml(conversation.primary_mentor_name || conversation.mentor_name || '未知导师')}
                        </span>
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
                            </svg>
                            ${conversation.messageCount || conversation.message_count || 0} 条消息
                        </span>
                        <span>更新于 ${updatedAt}</span>
                    </div>
                    
                    <!-- AI总结显示 -->
                    ${summary ? `
                        <div class="bg-gray-700/50 rounded-md p-3 mb-3">
                            <div class="flex items-center mb-1">
                                <svg class="w-3 h-3 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span class="text-xs text-blue-400 font-medium">AI总结</span>
                            </div>
                            <p class="text-gray-200 text-sm leading-relaxed">${this.escapeHtml(summary)}</p>
                        </div>
                    ` : ''}
                    
                    <!-- 标签显示 -->
                    ${(problemCategories.length > 0 || keyTopics.length > 0 || autoTags.length > 0) ? `
                        <div class="flex flex-wrap gap-2 mb-3">
                            ${problemCategories.slice(0, 3).map(category => 
                                `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    ${this.formatTagName(category)}
                                </span>`
                            ).join('')}
                            ${keyTopics.slice(0, 2).map(topic => 
                                `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M7 7a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V7zM9 9a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V9z"/>
                                    </svg>
                                    ${this.escapeHtml(topic)}
                                </span>`
                            ).join('')}
                            ${autoTags.slice(0, 2).map(tag => 
                                `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                                    </svg>
                                    ${this.formatTagName(tag)}
                                </span>`
                            ).join('')}
                            ${(problemCategories.length + keyTopics.length + autoTags.length > 7) ? 
                                `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                    +${problemCategories.length + keyTopics.length + autoTags.length - 7}个标签
                                </span>` : ''
                            }
                        </div>
                    ` : ''}
                    
                    <!-- 复杂度指示器 -->
                    ${complexityLevel > 1 ? `
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="text-xs text-gray-400">复杂度:</span>
                            <div class="flex space-x-1">
                                ${Array.from({length: 5}, (_, i) => {
                                    const isActive = i < complexityLevel;
                                    const color = this.getComplexityColor(i + 1, complexityLevel);
                                    return `<div class="w-2 h-2 rounded-full ${isActive ? 'opacity-100' : 'opacity-30'}" 
                                                 style="background-color: ${color}"></div>`;
                                }).join('')}
                            </div>
                            <span class="text-xs text-gray-400">${this.getComplexityLabel(complexityLevel)}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="flex items-center space-x-2">
                    ${conversation.is_favorite ? '<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>' : ''}
                    ${conversation.is_archived ? '<span class="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">已归档</span>' : ''}
                </div>
            </div>
            <div class="flex justify-between items-center">
                <div class="text-sm text-gray-500">
                    创建于 ${createdAt}
                </div>
                <div class="flex space-x-2">
                    <button class="view-conversation bg-primary hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium" 
                            data-conversation-id="${conversation.id}">
                        查看详情
                    </button>
                    ${!summary && conversation.messageCount >= 3 ? `
                        <button class="analyze-conversation bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-medium" 
                                data-conversation-id="${conversation.id}">
                            一键分析
                        </button>
                    ` : ''}
                    <button class="favorite-conversation ${conversation.is_favorite ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-500'} text-white px-3 py-1 rounded text-sm font-medium" 
                            data-conversation-id="${conversation.id}" data-is-favorite="${conversation.is_favorite}">
                        ${conversation.is_favorite ? '取消收藏' : '收藏'}
                    </button>
                    <button class="delete-conversation bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium" 
                            data-conversation-id="${conversation.id}">
                        删除
                    </button>
                </div>
            </div>
        `;

        // 添加事件监听器
        card.querySelector('.view-conversation').addEventListener('click', (e) => {
            e.stopPropagation();
            this.viewConversation(conversation.id);
        });

        const analyzeBtn = card.querySelector('.analyze-conversation');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.analyzeConversation(conversation.id);
            });
        }

        card.querySelector('.favorite-conversation').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(conversation.id, !conversation.is_favorite);
        });

        card.querySelector('.delete-conversation').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteConversation(conversation.id, conversation.title);
        });

        card.addEventListener('click', () => {
            this.viewConversation(conversation.id);
        });

        return card;
    }

    /**
     * 查看对话详情
     */
    async viewConversation(conversationId) {
        try {
                            const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('获取对话详情失败');
            }

            const data = await response.json();
            this.showConversationModal(data.data.conversation);
        } catch (error) {
            console.error('查看对话详情失败:', error);
            this.showError('加载对话详情失败，请重试');
        }
    }

    /**
     * 显示对话详情模态框
     */
    showConversationModal(conversation) {
        const modal = document.getElementById('conversation-modal');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');

        title.textContent = conversation.title;

        // 获取分析数据
        const summary = conversation.summary || conversation.aiSummary;
        const problemCategories = conversation.problemCategories || conversation.problem_categories || [];
        const keyTopics = conversation.keyTopics || conversation.key_topics || [];
        const autoTags = conversation.autoTags || conversation.auto_tags || [];
        const complexityLevel = conversation.complexityLevel || conversation.complexity_level || 1;
        const keyInsights = conversation.keyInsights || conversation.key_insights || [];
        const suggestedActions = conversation.suggestedActions || conversation.suggested_actions || [];

        // 渲染对话消息
        content.innerHTML = `
            <div class="mb-6">
                <div class="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                    <span>导师: ${this.escapeHtml(conversation.mentorName || conversation.mentor_name)}</span>
                    <span>创建时间: ${new Date(conversation.createdAt || conversation.created_at).toLocaleString('zh-CN')}</span>
                    <span>消息数: ${conversation.messages ? conversation.messages.length : 0}</span>
                </div>
                
                <!-- 对话分析面板 -->
                ${(summary || problemCategories.length > 0 || keyTopics.length > 0) ? `
                    <div class="bg-gray-700/30 rounded-lg p-4 mb-4 border border-gray-600">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <svg class="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            对话分析
                        </h4>
                        
                        <!-- AI总结 -->
                        ${summary ? `
                            <div class="mb-4">
                                <h5 class="text-xs font-medium text-gray-400 mb-2">总结</h5>
                                <p class="text-gray-200 text-sm leading-relaxed bg-gray-800/50 rounded-md p-3">${this.escapeHtml(summary)}</p>
                            </div>
                        ` : ''}
                        
                        <!-- 问题类型 -->
                        ${problemCategories.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-xs font-medium text-gray-400 mb-2">问题类型</h5>
                                <div class="flex flex-wrap gap-2">
                                    ${problemCategories.map(category => 
                                        `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                            ${this.formatTagName(category)}
                                        </span>`
                                    ).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- 关键话题 -->
                        ${keyTopics.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-xs font-medium text-gray-400 mb-2">关键话题</h5>
                                <div class="flex flex-wrap gap-2">
                                    ${keyTopics.map(topic => 
                                        `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                            ${this.escapeHtml(topic)}
                                        </span>`
                                    ).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- 自动标签 -->
                        ${autoTags.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-xs font-medium text-gray-400 mb-2">智能标签</h5>
                                <div class="flex flex-wrap gap-2">
                                    ${autoTags.map(tag => 
                                        `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                            ${this.formatTagName(tag)}
                                        </span>`
                                    ).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- 复杂度 -->
                        ${complexityLevel > 1 ? `
                            <div class="mb-4">
                                <h5 class="text-xs font-medium text-gray-400 mb-2">复杂度等级</h5>
                                <div class="flex items-center space-x-2">
                                    <div class="flex space-x-1">
                                        ${Array.from({length: 5}, (_, i) => {
                                            const isActive = i < complexityLevel;
                                            const color = this.getComplexityColor(i + 1, complexityLevel);
                                            return `<div class="w-3 h-3 rounded-full ${isActive ? 'opacity-100' : 'opacity-30'}" 
                                                         style="background-color: ${color}"></div>`;
                                        }).join('')}
                                    </div>
                                    <span class="text-xs text-gray-300">${this.getComplexityLabel(complexityLevel)}</span>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- 关键洞察 -->
                        ${keyInsights.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="text-xs font-medium text-gray-400 mb-2">关键洞察</h5>
                                <ul class="text-sm text-gray-300 space-y-1">
                                    ${keyInsights.map(insight => 
                                        `<li class="flex items-start">
                                            <svg class="w-3 h-3 mr-2 mt-0.5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                            </svg>
                                            ${this.escapeHtml(insight)}
                                        </li>`
                                    ).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <!-- 建议行动 -->
                        ${suggestedActions.length > 0 ? `
                            <div>
                                <h5 class="text-xs font-medium text-gray-400 mb-2">建议行动</h5>
                                <ul class="text-sm text-gray-300 space-y-1">
                                    ${suggestedActions.map(action => 
                                        `<li class="flex items-start">
                                            <svg class="w-3 h-3 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                            </svg>
                                            ${this.escapeHtml(action)}
                                        </li>`
                                    ).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
            
            <!-- 对话消息 -->
            <div class="space-y-4 max-h-96 overflow-y-auto">
                <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center border-t border-gray-600 pt-3">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                    </svg>
                    对话记录
                </h4>
                ${conversation.messages ? conversation.messages.map(message => this.renderMessage(message)).join('') : '<p class="text-gray-400">暂无消息</p>'}
            </div>
        `;

        // 设置继续对话按钮
        const continueBtn = document.getElementById('continue-conversation');
        continueBtn.onclick = () => {
            // 这里可以跳转到对话页面并加载该对话
            window.location.href = `../pages/conversation.html?id=${conversation.id}`;
        };

        // 设置导出按钮
        const exportBtn = document.getElementById('export-conversation');
        exportBtn.onclick = () => {
            this.exportConversation(conversation);
        };

        // 设置删除按钮
        const deleteBtn = document.getElementById('delete-conversation-modal');
        deleteBtn.onclick = () => {
            this.closeModal();
            this.deleteConversation(conversation.id, conversation.title);
        };

        modal.classList.remove('hidden');
    }

    /**
     * 渲染单条消息
     */
    renderMessage(message) {
        const isUser = message.role === 'user';
        const time = new Date(message.createdAt || message.created_at).toLocaleString('zh-CN');
        
        return `
            <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isUser ? 'bg-primary text-white' : 'bg-gray-700 text-gray-100'}">
                    <div class="text-sm mb-1">${this.escapeHtml(message.content)}</div>
                    <div class="text-xs ${isUser ? 'text-blue-100' : 'text-gray-400'}">${time}</div>
                </div>
            </div>
        `;
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.getElementById('conversation-modal');
        modal.classList.add('hidden');
    }

    /**
     * 分析对话
     */
    async analyzeConversation(conversationId) {
        try {
            // 找到对应的按钮并显示加载状态
            const analyzeBtn = document.querySelector(`[data-conversation-id="${conversationId}"].analyze-conversation`);
            if (analyzeBtn) {
                const originalText = analyzeBtn.textContent;
                analyzeBtn.textContent = '分析中...';
                analyzeBtn.disabled = true;
            }

            // 调用分析API
            const response = await fetch(`http://localhost:3000/api/conversation-analysis/${conversationId}/analyze`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('分析请求失败');
            }

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('对话分析完成！');
                // 重新加载对话列表以显示分析结果
                await this.loadConversations(false);
            } else {
                throw new Error(result.message || '分析失败');
            }

        } catch (error) {
            console.error('分析对话失败:', error);
            this.showError('分析失败: ' + error.message);
            
            // 恢复按钮状态
            const analyzeBtn = document.querySelector(`[data-conversation-id="${conversationId}"].analyze-conversation`);
            if (analyzeBtn) {
                analyzeBtn.textContent = '一键分析';
                analyzeBtn.disabled = false;
            }
        }
    }

    /**
     * 切换收藏状态
     */
    async toggleFavorite(conversationId, isFavorite) {
        try {
            const response = await fetch(`/api/conversations/${conversationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ is_favorite: isFavorite })
            });

            if (!response.ok) {
                throw new Error('更新收藏状态失败');
            }

            // 更新本地数据
            const conversation = this.conversations.find(c => c.id == conversationId);
            if (conversation) {
                conversation.is_favorite = isFavorite;
            }

            // 重新渲染
            await this.renderConversations();
            await this.loadStatistics();
            
            this.showSuccess(isFavorite ? '已添加到收藏' : '已取消收藏');
        } catch (error) {
            console.error('切换收藏状态失败:', error);
            this.showError('操作失败，请重试');
        }
    }

    /**
     * 删除对话
     */
    async deleteConversation(conversationId, conversationTitle) {
        // 显示自定义确认对话框
        const confirmed = await this.showDeleteConfirmDialog(conversationTitle);
        
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '删除对话失败');
            }

            // 从本地数据中移除
            this.conversations = this.conversations.filter(c => c.id != conversationId);
            
            // 重新渲染列表
            await this.renderConversations();
            await this.loadStatistics();
            
            this.showSuccess('对话删除成功');
        } catch (error) {
            console.error('删除对话失败:', error);
            this.showError('删除对话失败：' + error.message);
        }
    }

    /**
     * 显示删除确认对话框
     */
    showDeleteConfirmDialog(conversationTitle) {
        return new Promise((resolve) => {
            // 创建确认对话框
            const confirmModal = document.createElement('div');
            confirmModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]';
            
            confirmModal.innerHTML = `
                <div class="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
                    <div class="flex items-center mb-4">
                        <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-medium text-white">确认删除对话</h3>
                        </div>
                    </div>
                    <div class="mb-6">
                        <p class="text-gray-300 mb-2">确定要删除以下对话吗？</p>
                        <p class="text-white font-medium bg-gray-700 p-3 rounded border-l-4 border-red-500">"${this.escapeHtml(conversationTitle)}"</p>
                        <p class="text-red-400 text-sm mt-3">⚠️ 此操作不可撤销，将永久删除该对话及其所有消息记录。</p>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button id="cancel-delete" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">
                            取消
                        </button>
                        <button id="confirm-delete" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
                            确认删除
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmModal);

            // 绑定事件
            const cancelBtn = confirmModal.querySelector('#cancel-delete');
            const confirmBtn = confirmModal.querySelector('#confirm-delete');

            const cleanup = () => {
                document.body.removeChild(confirmModal);
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            // 点击背景取消
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    cleanup();
                    resolve(false);
                }
            });

            // ESC键取消
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    document.removeEventListener('keydown', escHandler);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', escHandler);
        });
    }

    /**
     * 导出对话
     */
    exportConversation(conversation) {
        const content = `# ${conversation.title}

**导师**: ${conversation.mentor_name}
**创建时间**: ${new Date(conversation.created_at).toLocaleString('zh-CN')}
**更新时间**: ${new Date(conversation.updated_at).toLocaleString('zh-CN')}
**消息数**: ${conversation.messages ? conversation.messages.length : 0}

---

${conversation.messages ? conversation.messages.map(message => {
    const role = message.role === 'user' ? '用户' : '导师';
    const time = new Date(message.created_at).toLocaleString('zh-CN');
    return `**${role}** (${time}):\n${message.content}\n`;
}).join('\n') : '暂无消息内容'}
`;

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${conversation.title}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('对话已导出到下载文件夹');
    }

    /**
     * 更新导师筛选选项
     */
    updateMentorFilter() {
        const mentorFilter = document.getElementById('mentor-filter');
        if (!mentorFilter || !this.statistics) return;

        const { mentorStats } = this.statistics;
        if (!mentorStats) return;

        // 保存当前选择的值
        const currentValue = mentorFilter.value;
        
        // 清空现有选项
        mentorFilter.innerHTML = '<option value="">全部导师</option>';
        
        // 添加导师选项
        mentorStats.forEach(mentor => {
            const option = document.createElement('option');
            option.value = mentor.mentor_name;
            option.textContent = `${mentor.mentor_name} (${mentor.conversation_count})`;
            mentorFilter.appendChild(option);
        });
        
        // 恢复选择的值
        mentorFilter.value = currentValue;
    }

    /**
     * 更新加载更多按钮
     */
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            if (this.currentPage < this.totalPages) {
                loadMoreBtn.classList.remove('hidden');
            } else {
                loadMoreBtn.classList.add('hidden');
            }
        }
    }

    /**
     * 清除筛选条件
     */
    clearFilters() {
        this.filters = {
            search: '',
            mentor: '',
            sortOrder: 'updated_desc'
        };

        document.getElementById('search-input').value = '';
        document.getElementById('mentor-filter').value = '';
        document.getElementById('sort-order').value = 'updated_desc';

        this.currentPage = 1;
        this.loadConversations();
    }

    /**
     * 工具方法
     */
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
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * 格式化标签名称
     */
    formatTagName(tagName) {
        if (!tagName) return '';
        
        // 处理下划线分隔的标签名
        const formatted = tagName.replace(/_/g, ' ');
        
        // 处理特殊标签名映射
        const tagMappings = {
            'business_strategy': '商业策略',
            'investment_advice': '投资建议',
            'career_development': '职业发展',
            'leadership_management': '领导管理',
            'technology_innovation': '技术创新',
            'market_analysis': '市场分析',
            'personal_growth': '个人成长',
            'financial_planning': '财务规划',
            'sentiment_positive': '积极正面',
            'sentiment_neutral': '中性客观',
            'sentiment_concerned': '关注担忧',
            'complexity_basic': '基础问题',
            'complexity_intermediate': '中等复杂',
            'complexity_advanced': '高度复杂'
        };
        
        return tagMappings[tagName] || formatted.replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * 获取复杂度标签
     */
    getComplexityLabel(level) {
        const labels = ['', '简单', '简单', '中等', '复杂', '非常复杂'];
        return labels[level] || '未知';
    }

    /**
     * 获取复杂度颜色
     */
    getComplexityColor(index, currentLevel) {
        if (index <= currentLevel) {
            if (index <= 2) return '#10B981'; // 绿色
            if (index <= 3) return '#F59E0B'; // 黄色
            return '#EF4444'; // 红色
        }
        return '#6B7280'; // 灰色
    }

    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    }

    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    }

    showError(message) {
        // 这里可以使用现有的消息显示系统
        console.error(message);
        alert(message); // 临时使用alert，后续可以改为更好的UI
    }

    showSuccess(message) {
        // 这里可以使用现有的消息显示系统
        console.log(message);
        // 可以显示成功提示
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.conversationHistory = new ConversationHistory();
}); 