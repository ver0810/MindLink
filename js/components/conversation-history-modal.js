/**
 * 对话页面历史记录模态框管理器
 * 专门用于在对话进行中查看历史记录
 */
class ConversationHistoryModal {
    constructor() {
        this.conversations = [];
        this.filteredConversations = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.isLoading = false;
        this.filters = {
            search: '',
            mentor: '',
            sort: 'updated_desc'
        };
        this.currentConversationId = null;
        
        this.initialize();
    }

    /**
     * 初始化历史记录模态框
     */
    initialize() {
        this.setupEventListeners();
        this.populateMentorFilter();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {


        // 关闭模态框
        const closeHistoryModal = document.getElementById('close-history-modal');
        if (closeHistoryModal) {
            closeHistoryModal.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // 搜索功能
        const historySearch = document.getElementById('history-search');
        if (historySearch) {
            historySearch.addEventListener('input', this.debounce(() => {
                this.filters.search = historySearch.value;
                this.currentPage = 1;
                this.loadConversations();
            }, 300));
        }

        // 导师筛选
        const mentorFilter = document.getElementById('history-mentor-filter');
        if (mentorFilter) {
            mentorFilter.addEventListener('change', () => {
                this.filters.mentor = mentorFilter.value;
                this.currentPage = 1;
                this.loadConversations();
            });
        }

        // 排序
        const historySort = document.getElementById('history-sort');
        if (historySort) {
            historySort.addEventListener('change', () => {
                this.filters.sort = historySort.value;
                this.currentPage = 1;
                this.loadConversations();
            });
        }

        // 加载更多
        const loadMoreHistory = document.getElementById('load-more-history');
        if (loadMoreHistory) {
            loadMoreHistory.addEventListener('click', () => {
                this.loadMoreConversations();
            });
        }

        // 对话详情模态框关闭
        const closeDetailModal = document.getElementById('close-detail-modal');
        if (closeDetailModal) {
            closeDetailModal.addEventListener('click', () => {
                this.closeDetailModal();
            });
        }

        // 继续对话
        const continueConversation = document.getElementById('continue-conversation');
        if (continueConversation) {
            continueConversation.addEventListener('click', () => {
                this.continueSelectedConversation();
            });
        }

        // 导出对话
        const exportConversation = document.getElementById('export-conversation');
        if (exportConversation) {
            exportConversation.addEventListener('click', () => {
                this.exportSelectedConversation();
            });
        }

        // 点击模态框外部关闭
        const historyModal = document.getElementById('history-modal');
        if (historyModal) {
            historyModal.addEventListener('click', (e) => {
                if (e.target === historyModal) {
                    this.closeModal();
                }
            });
        }

        const detailModal = document.getElementById('conversation-detail-modal');
        if (detailModal) {
            detailModal.addEventListener('click', (e) => {
                if (e.target === detailModal) {
                    this.closeDetailModal();
                }
            });
        }
    }

    /**
     * 打开历史记录模态框
     */
    async openModal() {
        const modal = document.getElementById('history-modal');
        if (modal) {
            modal.classList.remove('hidden');
            await this.loadConversations();
        }
    }

    /**
     * 关闭历史记录模态框
     */
    closeModal() {
        const modal = document.getElementById('history-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * 填充导师筛选选项
     */
    populateMentorFilter() {
        const mentorFilter = document.getElementById('history-mentor-filter');
        if (!mentorFilter || typeof mentors === 'undefined') {
            console.warn('导师筛选元素或导师数据未找到');
            return;
        }

        // 清空现有选项（保留第一个"全部导师"选项）
        mentorFilter.innerHTML = '<option value="">全部导师</option>';

        // 添加导师选项
        mentors.forEach(mentor => {
            const option = document.createElement('option');
            option.value = mentor.id;
            option.textContent = mentor.name;
            mentorFilter.appendChild(option);
        });
    }

    /**
     * 加载对话列表
     */
    async loadConversations(reset = true) {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            
            if (reset) {
                this.showLoading();
                this.hideEmpty();
                this.hideList();
            }

            // 重置对话列表
            if (reset) {
                this.conversations = [];
            }

            // 优先从本地存储加载
            await this.loadFromLocalStorage();

            // 如果用户已登录，尝试从后端加载
            const authToken = localStorage.getItem('auth_token');
            if (authToken) {
                try {
                    await this.loadFromBackend();
                } catch (error) {
                    console.warn('从后端加载历史记录失败，使用本地数据:', error);
                }
            }

            this.renderConversations();

        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.showError('加载历史记录失败，请重试');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    /**
     * 从本地存储加载对话记录
     */
    async loadFromLocalStorage() {
        try {
            const savedConversations = JSON.parse(localStorage.getItem('conversation_history') || '[]');
            
            // 转换本地存储格式到统一格式
            const localConversations = savedConversations.map(conv => ({
                id: conv.id,
                title: conv.title || this.generateTitleFromMessages(conv.messages),
                mentor_id: conv.mentor?.id || 'unknown',
                mentor_name: conv.mentor?.name || '未知导师',
                mentor_avatar: conv.mentor?.avatar || '',
                created_at: conv.createdAt || new Date().toISOString(),
                updated_at: conv.updatedAt || conv.createdAt || new Date().toISOString(),
                message_count: conv.messages?.length || 0,
                messages: conv.messages || [],
                is_favorite: conv.metadata?.isFavorite || false,
                tags: conv.metadata?.tags || [],
                source: 'local'
            }));

            this.conversations = [...this.conversations, ...localConversations];
        } catch (error) {
            console.error('从本地存储加载失败:', error);
        }
    }

    /**
     * 从后端加载对话记录
     */
    async loadFromBackend() {
        const authToken = localStorage.getItem('auth_token');
        if (!authToken) return;

        const params = new URLSearchParams({
            page: this.currentPage,
            limit: this.pageSize,
            search: this.filters.search,
            mentor: this.filters.mentor,
            sortBy: this.getSortField(),
            sortOrder: this.getSortOrder()
        });

                    const response = await fetch(`http://localhost:3000/api/conversations/history?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.conversations) {
                const backendConversations = data.data.conversations.map(conv => ({
                    id: conv.id,
                    uuid: conv.uuid,
                    title: conv.title,
                    mentor_id: conv.mentor.id,
                    mentor_name: conv.mentor.name,
                    mentor_avatar: conv.mentor.avatar,
                    created_at: conv.createdAt,
                    updated_at: conv.updatedAt,
                    last_activity_at: conv.lastActivityAt,
                    message_count: conv.messageCount,
                    messages: [], // 消息将在详情页面加载
                    is_favorite: conv.isFavorite || false,
                    tags: conv.tags || [],
                    status: conv.status,
                    satisfaction_rating: conv.satisfactionRating,
                    source: 'backend'
                }));
                
                this.conversations = [...this.conversations, ...backendConversations];
                this.totalPages = data.data.pagination?.totalPages || 1;
            }
        } else {
            throw new Error(`后端请求失败: ${response.status}`);
        }
    }

    /**
     * 渲染对话列表
     */
    renderConversations() {
        // 去重和排序
        this.processConversations();
        
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        if (this.filteredConversations.length === 0) {
            this.showEmpty();
            return;
        }

        historyList.innerHTML = '';
        
        this.filteredConversations.forEach(conversation => {
            const conversationElement = this.createConversationCard(conversation);
            historyList.appendChild(conversationElement);
        });

        this.showList();
        this.updateLoadMoreButton();
    }

    /**
     * 处理对话数据（去重、筛选、排序）
     */
    processConversations() {
        // 去重（优先保留后端数据）
        const uniqueConversations = [];
        const seenIds = new Set();
        
        this.conversations.forEach(conv => {
            if (!seenIds.has(conv.id)) {
                seenIds.add(conv.id);
                uniqueConversations.push(conv);
            } else {
                // 如果是后端数据，替换本地数据
                if (conv.source === 'backend') {
                    const index = uniqueConversations.findIndex(c => c.id === conv.id);
                    if (index !== -1) {
                        uniqueConversations[index] = conv;
                    }
                }
            }
        });

        // 筛选
        this.filteredConversations = uniqueConversations.filter(conv => {
            let matches = true;

            if (this.filters.search) {
                const searchLower = this.filters.search.toLowerCase();
                matches = matches && (
                    conv.title.toLowerCase().includes(searchLower) ||
                    conv.mentor_name.toLowerCase().includes(searchLower)
                );
            }

            if (this.filters.mentor) {
                matches = matches && conv.mentor_id === this.filters.mentor;
            }

            return matches;
        });

        // 排序
        this.filteredConversations.sort((a, b) => {
            switch (this.filters.sort) {
                case 'created_desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'messages_desc':
                    return (b.message_count || 0) - (a.message_count || 0);
                case 'updated_desc':
                default:
                    return new Date(b.updated_at) - new Date(a.updated_at);
            }
        });
    }

    /**
     * 创建对话卡片
     */
    createConversationCard(conversation) {
        const card = document.createElement('div');
        card.className = 'bg-slate-700 border border-slate-600 rounded-lg p-4 hover:bg-slate-600 transition-colors cursor-pointer';
        
        const timeStr = this.formatDate(conversation.updated_at || conversation.created_at);
        const sourceLabel = conversation.source === 'local' ? '本地' : '云端';
        
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-2">
                        ${conversation.mentor_avatar ? 
                            `<img src="${conversation.mentor_avatar}" alt="${conversation.mentor_name}" class="w-8 h-8 rounded-full">` :
                            `<div class="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center">
                                <span class="text-sm font-medium">${conversation.mentor_name.charAt(0)}</span>
                            </div>`
                        }
                        <div class="flex-1 min-w-0">
                            <h4 class="text-slate-100 font-medium truncate">${this.escapeHtml(conversation.title)}</h4>
                            <p class="text-slate-400 text-sm">${this.escapeHtml(conversation.mentor_name)}</p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between text-sm text-slate-400">
                        <span>${timeStr}</span>
                        <div class="flex items-center gap-3">
                            <span>${conversation.message_count || 0} 条消息</span>
                            <span class="px-2 py-1 bg-slate-600 rounded text-xs">${sourceLabel}</span>
                            ${conversation.is_favorite ? '<span class="text-yellow-400">★</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="ml-3 flex flex-col gap-2">
                    <button class="view-conversation text-sky-400 hover:text-sky-300 text-sm" data-id="${conversation.id}">
                        查看
                    </button>
                    <button class="continue-conversation text-green-400 hover:text-green-300 text-sm" data-id="${conversation.id}">
                        继续
                    </button>
                </div>
            </div>
        `;

        // 添加事件监听器
        const viewBtn = card.querySelector('.view-conversation');
        const continueBtn = card.querySelector('.continue-conversation');
        
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.viewConversationDetail(conversation.id);
            });
        }

        if (continueBtn) {
            continueBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.continueConversation(conversation.id);
            });
        }

        // 整个卡片点击查看详情
        card.addEventListener('click', () => {
            this.viewConversationDetail(conversation.id);
        });

        return card;
    }

    /**
     * 查看对话详情
     */
    async viewConversationDetail(conversationId) {
        this.currentConversationId = conversationId;
        
        const conversation = this.findConversationById(conversationId);
        if (!conversation) {
            console.error('未找到对话:', conversationId);
            return;
        }

        // 打开详情模态框
        const detailModal = document.getElementById('conversation-detail-modal');
        if (detailModal) {
            detailModal.classList.remove('hidden');
            
            // 设置标题
            const titleElement = document.getElementById('detail-title');
            const subtitleElement = document.getElementById('detail-subtitle');
            
            if (titleElement) titleElement.textContent = conversation.title;
            if (subtitleElement) {
                subtitleElement.textContent = `${conversation.mentor_name} • ${this.formatDate(conversation.created_at)} • ${conversation.message_count || 0} 条消息`;
            }

            // 加载消息
            await this.loadConversationMessages(conversation);
        }
    }

    /**
     * 加载对话消息
     */
    async loadConversationMessages(conversation) {
        const loadingElement = document.getElementById('detail-loading');
        const messagesElement = document.getElementById('detail-messages');
        
        if (loadingElement) loadingElement.classList.remove('hidden');
        if (messagesElement) messagesElement.classList.add('hidden');

        try {
            let messages = [];

            if (conversation.source === 'local') {
                messages = conversation.messages || [];
            } else {
                // 从后端加载完整对话详情（包含消息）
                const authToken = localStorage.getItem('auth_token');
                if (authToken) {
                    const response = await fetch(`http://localhost:3000/api/conversations/history/${conversation.id}`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data.conversation) {
                            messages = data.data.conversation.messages || [];
                        }
                    }
                }
            }

            this.renderConversationMessages(messages);

        } catch (error) {
            console.error('加载对话消息失败:', error);
            if (messagesElement) {
                messagesElement.innerHTML = '<div class="text-center text-red-400 py-8">加载消息失败，请重试</div>';
                messagesElement.classList.remove('hidden');
            }
        } finally {
            if (loadingElement) loadingElement.classList.add('hidden');
        }
    }

    /**
     * 渲染对话消息
     */
    renderConversationMessages(messages) {
        const messagesElement = document.getElementById('detail-messages');
        if (!messagesElement) return;

        messagesElement.innerHTML = '';

        if (messages.length === 0) {
            messagesElement.innerHTML = '<div class="text-center text-slate-400 py-8">这个对话还没有消息</div>';
        } else {
            messages.forEach((message, index) => {
                const messageElement = this.createMessageElement(message, index);
                messagesElement.appendChild(messageElement);
            });
        }

        messagesElement.classList.remove('hidden');
    }

    /**
     * 创建消息元素
     */
    createMessageElement(message, index) {
        const messageDiv = document.createElement('div');
        const isUser = message.role === 'user';
        
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;
        
        const content = message.content || '';
        const timestamp = message.timestamp || message.created_at;
        
        messageDiv.innerHTML = `
            <div class="max-w-[80%] ${isUser ? 'bg-sky-600' : 'bg-slate-600'} rounded-lg p-4">
                <div class="text-slate-100 whitespace-pre-wrap">${this.escapeHtml(content)}</div>
                ${timestamp ? `<div class="text-xs text-slate-300 mt-2 opacity-70">${this.formatDate(timestamp)}</div>` : ''}
            </div>
        `;

        return messageDiv;
    }

    /**
     * 继续对话
     */
    continueConversation(conversationId) {
        const conversation = this.findConversationById(conversationId);
        if (!conversation) {
            console.error('未找到对话:', conversationId);
            return;
        }

        // 关闭模态框
        this.closeModal();
        this.closeDetailModal();

        // 加载对话到当前会话
        if (window.conversationEngine && typeof window.conversationEngine.loadConversation === 'function') {
            window.conversationEngine.loadConversation(conversationId);
        } else {
            // 如果没有对话引擎，重新加载页面并设置参数
            sessionStorage.setItem('loadConversationId', conversationId);
            window.location.reload();
        }
    }

    /**
     * 继续选中的对话
     */
    continueSelectedConversation() {
        if (this.currentConversationId) {
            this.continueConversation(this.currentConversationId);
        }
    }

    /**
     * 导出选中的对话
     */
    exportSelectedConversation() {
        if (!this.currentConversationId) return;

        const conversation = this.findConversationById(this.currentConversationId);
        if (!conversation) return;

        this.exportConversation(conversation);
    }

    /**
     * 导出对话为Markdown格式
     */
    exportConversation(conversation) {
        const messages = conversation.messages || [];
        let markdown = `# ${conversation.title}\n\n`;
        markdown += `**导师**: ${conversation.mentor_name}\n`;
        markdown += `**创建时间**: ${this.formatDate(conversation.created_at)}\n`;
        markdown += `**消息数量**: ${messages.length} 条\n\n`;
        markdown += `---\n\n`;

        messages.forEach((message, index) => {
            const role = message.role === 'user' ? '用户' : '导师';
            const timestamp = message.timestamp || message.created_at;
            
            markdown += `## ${role} ${timestamp ? `(${this.formatDate(timestamp)})` : ''}\n\n`;
            markdown += `${message.content || ''}\n\n`;
        });

        // 下载文件
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${conversation.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 加载更多对话
     */
    async loadMoreConversations() {
        if (this.currentPage >= this.totalPages) return;
        
        this.currentPage++;
        await this.loadConversations(false);
    }

    /**
     * 关闭详情模态框
     */
    closeDetailModal() {
        const modal = document.getElementById('conversation-detail-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.currentConversationId = null;
    }

    /**
     * 根据ID查找对话
     */
    findConversationById(id) {
        return this.conversations.find(conv => conv.id === id) || null;
    }

    /**
     * 从消息生成标题
     */
    generateTitleFromMessages(messages) {
        if (!messages || messages.length === 0) {
            return '新对话';
        }

        const firstUserMessage = messages.find(msg => msg.role === 'user');
        if (firstUserMessage && firstUserMessage.content) {
            const title = firstUserMessage.content.substring(0, 50);
            return title.length < firstUserMessage.content.length ? title + '...' : title;
        }

        return '新对话';
    }

    /**
     * 获取排序字段
     */
    getSortField() {
        const sortMap = {
            'updated_desc': 'updated_at',
            'created_desc': 'created_at',
            'messages_desc': 'message_count'
        };
        return sortMap[this.filters.sort] || 'updated_at';
    }

    /**
     * 获取排序顺序
     */
    getSortOrder() {
        return this.filters.sort.includes('desc') ? 'DESC' : 'ASC';
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        const element = document.getElementById('history-loading');
        if (element) element.classList.remove('hidden');
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const element = document.getElementById('history-loading');
        if (element) element.classList.add('hidden');
    }

    /**
     * 显示空状态
     */
    showEmpty() {
        const element = document.getElementById('history-empty');
        if (element) element.classList.remove('hidden');
    }

    /**
     * 隐藏空状态
     */
    hideEmpty() {
        const element = document.getElementById('history-empty');
        if (element) element.classList.add('hidden');
    }

    /**
     * 显示列表
     */
    showList() {
        const element = document.getElementById('history-list');
        if (element) element.classList.remove('hidden');
    }

    /**
     * 隐藏列表
     */
    hideList() {
        const element = document.getElementById('history-list');
        if (element) element.classList.add('hidden');
    }

    /**
     * 更新加载更多按钮状态
     */
    updateLoadMoreButton() {
        const container = document.getElementById('history-load-more');
        const button = document.getElementById('load-more-history');
        
        if (container && button) {
            if (this.currentPage < this.totalPages) {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        }
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        console.error(message);
        // 可以在这里添加更友好的错误显示
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            } else if (diffDays === 1) {
                return '昨天';
            } else if (diffDays < 7) {
                return `${diffDays}天前`;
            } else {
                return date.toLocaleDateString('zh-CN');
            }
        } catch (error) {
            return '-';
        }
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 防抖函数
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
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 确保在其他组件初始化之后再初始化历史记录模态框
    setTimeout(() => {
        if (!window.conversationHistoryModal) {
            window.conversationHistoryModal = new ConversationHistoryModal();
            console.log('对话历史记录模态框已初始化');
        }
    }, 1000);
}); 