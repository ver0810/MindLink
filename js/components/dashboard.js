document.addEventListener('DOMContentLoaded', function() {
    // === 页面切换功能 ===
    let conversationHistory = null;
    let mentorsSection, conversationsSection;
    
    // 初始化页面切换
    initPageSwitching();
    
    // 初始化移动端菜单
    initMobileMenu();
    
    // 初始化导师相关功能
    initMentorSection();
    
    // 检查URL哈希，如果是 #conversations 则自动切换到对话页面
    if (window.location.hash === '#conversations') {
        // 延迟执行，确保DOM已经完全加载
        setTimeout(() => {
            showConversationsSection();
        }, 100);
    }
    
    /**
     * 显示对话页面（全局可访问）
     */
    async function showConversationsSection() {
        if (mentorsSection) mentorsSection.classList.add('hidden');
        if (conversationsSection) conversationsSection.classList.remove('hidden');
        
        // 更新导航状态
        updateNavState('conversations');
        
        // 初始化对话历史功能
        if (!conversationHistory) {
            await initConversationHistory();
        }
    }
    
    /**
     * 显示导师页面（全局可访问）
     */
    function showMentorsSection() {
        if (mentorsSection) mentorsSection.classList.remove('hidden');
        if (conversationsSection) conversationsSection.classList.add('hidden');
        
        // 更新导航状态
        updateNavState('mentors');
    }
    
    /**
     * 更新导航状态（全局可访问）
     */
    function updateNavState(activeSection) {
        // 重置所有导航状态
        const allLinks = document.querySelectorAll('.sidebar-link-active, .sidebar-link-inactive');
        allLinks.forEach(link => {
            link.classList.remove('sidebar-link-active');
            link.classList.add('sidebar-link-inactive');
        });
        
        // 设置当前活跃导航
        const mentorsLink = document.getElementById('mentors-link');
        const conversationsLink = document.getElementById('my-conversations-link');
        const mobileConversationsLink = document.getElementById('mobile-conversations-link');
        
        if (activeSection === 'mentors') {
            if (mentorsLink) {
                mentorsLink.classList.remove('sidebar-link-inactive');
                mentorsLink.classList.add('sidebar-link-active');
            }
        } else if (activeSection === 'conversations') {
            const activeConversationLinks = [conversationsLink, mobileConversationsLink];
            activeConversationLinks.forEach(link => {
                if (link) {
                    link.classList.remove('sidebar-link-inactive');
                    link.classList.add('sidebar-link-active');
                }
            });
        }
    }

    /**
     * 初始化页面切换功能
     */
    function initPageSwitching() {
        // 桌面端导航
        const mentorsLink = document.getElementById('mentors-link');
        const conversationsLink = document.getElementById('my-conversations-link');
        
        // 移动端导航
        const mobileConversationsLink = document.getElementById('mobile-conversations-link');
        
        // 页面容器
        mentorsSection = document.getElementById('mentors-section');
        conversationsSection = document.getElementById('conversations-section');
        
        // 绑定导师页面切换事件
        if (mentorsLink) {
            mentorsLink.addEventListener('click', (e) => {
                e.preventDefault();
                showMentorsSection();
            });
        }
        
        // 绑定对话页面切换事件
        if (conversationsLink) {
            conversationsLink.addEventListener('click', (e) => {
                e.preventDefault();
                showConversationsSection();
            });
        }
        
        if (mobileConversationsLink) {
            mobileConversationsLink.addEventListener('click', (e) => {
                e.preventDefault();
                showConversationsSection();
                // 关闭移动端菜单
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                    mobileMenu.classList.add('hidden');
                }
            });
        }
    }

    /**
     * 初始化对话历史功能
     */
    async function initConversationHistory() {
        try {
            // 检查用户登录状态
            if (!checkAuthStatus()) {
                showLoginRequired();
                return;
            }

            // 设置对话历史功能
            conversationHistory = new DashboardConversationHistory();
            await conversationHistory.initialize();
            
        } catch (error) {
            console.error('初始化对话历史失败:', error);
            showError('加载对话记录失败，请刷新页面重试');
        }
    }

    /**
     * 检查用户认证状态
     */
    function checkAuthStatus() {
        const token = localStorage.getItem('auth_token');
        return !!token;
    }

    /**
     * 显示需要登录的提示
     */
    function showLoginRequired() {
        const container = document.getElementById('conversations-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <div class="text-slate-400 text-lg mb-4">请先登录查看历史对话</div>
                    <button id="login-prompt-btn" class="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-md font-medium transition-colors">
                        立即登录
                    </button>
                </div>
            `;
            
            const loginBtn = document.getElementById('login-prompt-btn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    // 触发登录
                    window.location.href = '../index.html';
                });
            }
        }
        
        hideElement('loading-state');
        hideElement('stats-section');
    }

    /**
     * 显示错误信息
     */
    function showError(message) {
        const container = document.getElementById('conversations-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <div class="text-red-400 text-lg mb-4">${message}</div>
                    <button onclick="location.reload()" class="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-md font-medium transition-colors">
                        重新加载
                    </button>
                </div>
            `;
        }
    }

    /**
     * 显示/隐藏元素辅助函数
     */
    function hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.classList.add('hidden');
    }

    function showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.classList.remove('hidden');
    }

    /**
     * 初始化移动端菜单
     */
    function initMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', function() {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }

    /**
     * 初始化导师相关功能
     */
    function initMentorSection() {
        if (typeof mentors === 'undefined') {
            console.error('Mentors data not loaded');
            const allMentorsContainer = document.getElementById('all-mentors');
            if (allMentorsContainer) {
                allMentorsContainer.innerHTML = '<p class="text-red-400 text-center col-span-full">导师数据加载失败，请稍后再试。</p>';
            }
            return;
        }

        populateMentors();
        initMentorModal();
        initMentorSearch();
    }

    function renderMentorCard(mentor, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const mentorCard = document.createElement('div');
        mentorCard.className = 'cool-card cool-card-hover p-6 flex flex-col items-center text-center cursor-pointer h-full'; // Added h-full for consistent card height if using grid
        mentorCard.setAttribute('data-mentor-id', mentor.id);

        mentorCard.innerHTML = `
            <img src="${mentor.avatar}" alt="${mentor.name}" class="w-24 h-24 rounded-full object-cover mb-4 border-2 border-slate-600 shadow-lg">
            <h4 class="font-semibold text-xl text-slate-100 mb-1">${mentor.name}</h4>
            <p class="text-sm text-sky-400 mb-3">${mentor.title}</p>
            <p class="text-slate-400 text-xs mb-4 line-clamp-3 flex-grow">${mentor.shortBio}</p>
            <div class="flex flex-wrap gap-2 justify-center">
                ${mentor.expertise.slice(0, 3).map(tag =>
                    `<span class="inline-block bg-slate-700 text-sky-300 text-xs px-2.5 py-1 rounded-full">${tag}</span>`
                ).join('')}
                ${mentor.expertise.length > 3 ? `<span class="inline-block text-slate-500 text-xs px-2.5 py-1">+${mentor.expertise.length - 3}更多</span>` : ''}
            </div>
        `;
        container.appendChild(mentorCard);
        mentorCard.addEventListener('click', (event) => {
            console.log('Mentor card clicked:', mentor.name);
            event.preventDefault();
            event.stopPropagation();
            openMentorModal(mentor);
        });
    }

    function populateMentors(filterTerm = '') {
        const featuredMentorsContainer = document.getElementById('featured-mentors');
        const allMentorsContainer = document.getElementById('all-mentors');
        const featuredMentorsSection = document.getElementById('featured-mentors-section');


        if (featuredMentorsContainer) featuredMentorsContainer.innerHTML = '';
        if (allMentorsContainer) allMentorsContainer.innerHTML = '';

        const searchTerm = filterTerm.toLowerCase().trim();
        let displayedMentors = mentors;

        if (searchTerm) {
            displayedMentors = mentors.filter(mentor =>
                mentor.name.toLowerCase().includes(searchTerm) ||
                mentor.title.toLowerCase().includes(searchTerm) ||
                mentor.expertise.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                mentor.shortBio.toLowerCase().includes(searchTerm)
            );
            if(featuredMentorsSection) featuredMentorsSection.classList.add('hidden'); // Hide featured section during search
        } else {
             if(featuredMentorsSection) featuredMentorsSection.classList.remove('hidden');
            // Populate featured mentors only if no search term
            if (featuredMentorsContainer) {
                const featuredMentorsList = mentors.filter(mentor => mentor.featured);
                featuredMentorsList.forEach(mentor => renderMentorCard(mentor, 'featured-mentors'));
            }
        }
        
        if (allMentorsContainer) {
            if (displayedMentors.length === 0 && searchTerm) {
                allMentorsContainer.innerHTML = `<p class="text-slate-400 text-center col-span-full py-8">未能找到与 "${filterTerm}" 相关的导师。</p>`;
            } else {
                displayedMentors.forEach(mentor => renderMentorCard(mentor, 'all-mentors'));
            }
        }
    }

    function initMentorModal() {
        const mentorModal = document.getElementById('mentor-modal');
        const closeMentorModalBtn = document.getElementById('close-mentor-modal');
        const startConversationBtn = document.getElementById('start-conversation');
        
        function closeMentorModal() {
            console.log('Closing modal...');
            if (mentorModal) {
                mentorModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        }

        if (closeMentorModalBtn) {
            closeMentorModalBtn.addEventListener('click', closeMentorModal);
        }

        if (mentorModal) {
            mentorModal.addEventListener('click', function(event) {
                if (event.target === mentorModal) { // Clicked on backdrop
                    closeMentorModal();
                }
            });
        }
        
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && mentorModal && mentorModal.classList.contains('flex')) {
                closeMentorModal();
            }
        });

        if (startConversationBtn) {
            startConversationBtn.addEventListener('click', function() {
                const mentorId = this.getAttribute('data-mentor-id');
                // Navigate to conversation setup page with initial mentor ID
                window.location.href = `conversation-setup.html?initialMentorId=${mentorId}`;
            });
        }

        // Make openMentorModal function globally accessible
        window.openMentorModal = function(mentor) {
            console.log('openMentorModal called for:', mentor.name);
            
            // 检查必要的元素是否存在
            if (!mentorModal) {
                console.error('mentorModal element not found');
                return;
            }
            
            const avatarEl = document.getElementById('modal-mentor-avatar');
            const nameEl = document.getElementById('modal-mentor-name');
            const titleEl = document.getElementById('modal-mentor-title');
            
            if (!avatarEl || !nameEl || !titleEl) {
                console.error('Modal elements not found');
                return;
            }
            
            avatarEl.src = mentor.avatar;
            nameEl.textContent = mentor.name;
            titleEl.textContent = mentor.title;
            
            try {
                const bioContainer = document.getElementById('modal-mentor-bio');
                if (bioContainer) {
                    bioContainer.innerHTML = `<p>${mentor.bio}</p>`;
                }

                const expertiseContainer = document.getElementById('modal-mentor-expertise');
                if (expertiseContainer) {
                    expertiseContainer.innerHTML = mentor.expertise.map(tag => 
                        `<span class="inline-block bg-slate-700 text-sky-300 text-sm px-3 py-1.5 rounded-full">${tag}</span>`
                    ).join(' ');
                }

                const questionsContainer = document.getElementById('modal-mentor-questions');
                if (questionsContainer) {
                    questionsContainer.innerHTML = mentor.suggestedQuestions.map(question => 
                        `<li class="flex items-start py-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-sky-400 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>${question}</span>
                        </li>`
                    ).join('');
                }
            } catch (error) {
                console.error('Error populating modal content:', error);
            }

            if (startConversationBtn) {
                startConversationBtn.setAttribute('data-mentor-id', mentor.id);
            }
            
            console.log('Showing modal...');
            
            // 直接显示modal
            mentorModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            console.log('Modal should be visible now');
        };
    }

    function initMentorSearch() {
        const searchInput = document.querySelector('input[placeholder="搜索导师或领域..."]');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                populateMentors(this.value);
            });
        }
    }
});

/**
 * Dashboard中的对话历史管理类
 * 简化版的对话历史功能，专门用于dashboard页面
 */
class DashboardConversationHistory {
    constructor() {
        this.conversations = [];
        this.filteredConversations = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.isLoading = false;
        this.filters = {
            search: '',
            mentor: '',
            sortOrder: 'updated_desc'
        };
        this.statistics = null;
    }

    /**
     * 初始化组件
     */
    async initialize() {
        try {
            this.setupEventListeners();
            await this.loadStatistics();
            await this.loadConversations();
            await this.loadMentorFilter();
        } catch (error) {
            console.error('初始化对话历史失败:', error);
            this.showError('初始化失败，请刷新页面重试');
        }
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

        // 开始新对话事件
        const startNewBtn = document.getElementById('start-new-conversation');
        if (startNewBtn) {
            startNewBtn.addEventListener('click', () => {
                window.location.href = 'conversation-setup.html';
            });
        }

        // 模态框事件
        this.setupModalEvents();
    }

    /**
     * 设置模态框事件
     */
    setupModalEvents() {
        const modal = document.getElementById('conversation-modal');
        const closeModal = document.getElementById('close-modal');
        const toggleFavorite = document.getElementById('toggle-favorite');
        const exportBtn = document.getElementById('export-conversation');

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        if (toggleFavorite) {
            toggleFavorite.addEventListener('click', () => {
                const conversationId = toggleFavorite.getAttribute('data-conversation-id');
                const isFavorite = toggleFavorite.getAttribute('data-is-favorite') === 'true';
                this.toggleFavorite(conversationId, !isFavorite);
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const conversationId = exportBtn.getAttribute('data-conversation-id');
                const conversation = this.conversations.find(c => c.id == conversationId);
                if (conversation) {
                    this.exportConversation(conversation);
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
        
        const totalConv = document.getElementById('total-conversations');
        const totalMsg = document.getElementById('total-messages');
        const favoriteConv = document.getElementById('favorite-conversations');
        const archivedConv = document.getElementById('archived-conversations');
        
        if (totalConv) totalConv.textContent = basicStats.total_conversations || 0;
        if (totalMsg) totalMsg.textContent = basicStats.total_messages || 0;
        if (favoriteConv) favoriteConv.textContent = basicStats.favorite_conversations || 0;
        if (archivedConv) archivedConv.textContent = basicStats.archived_conversations || 0;
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

            if (response.ok) {
                const data = await response.json();
                
                if (reset) {
                    this.conversations = data.data.conversations;
                } else {
                    this.conversations = [...this.conversations, ...data.data.conversations];
                }
                
                this.totalPages = Math.ceil(data.data.total / this.pageSize);
                await this.renderConversations();
                this.updateLoadMoreButton();
            } else {
                throw new Error('Failed to load conversations');
            }
        } catch (error) {
            console.error('加载对话失败:', error);
            this.showError('加载对话记录失败');
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
        if (!container) return;

        if (this.conversations.length === 0) {
            this.showElement('empty-state');
            this.hideElement('conversations-container');
            return;
        }

        this.showElement('conversations-container');
        this.hideElement('empty-state');

        if (this.currentPage === 1) {
            container.innerHTML = '';
        }

        this.conversations.slice((this.currentPage - 1) * this.pageSize).forEach(conversation => {
            const card = this.createConversationCard(conversation);
            container.appendChild(card);
        });
    }

    /**
     * 创建对话卡片
     */
    createConversationCard(conversation) {
        const card = document.createElement('div');
        card.className = 'bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer';
        
        const mentorName = conversation.primary_mentor_name || conversation.mentor_name || '未知导师';
        const lastMessage = conversation.last_message || '暂无消息';
        const messageCount = conversation.message_count || 0;
        const updatedAt = new Date(conversation.updated_at).toLocaleString('zh-CN');
        const isFavorite = conversation.is_favorite;
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="font-semibold text-lg text-slate-100 mb-2 line-clamp-1">
                        ${this.escapeHtml(conversation.title || `与${mentorName}的对话`)}
                    </h3>
                    <div class="flex items-center space-x-4 text-sm text-slate-400 mb-3">
                        <span class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            ${this.escapeHtml(mentorName)}
                        </span>
                        <span class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            ${messageCount} 条消息
                        </span>
                        <span class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ${updatedAt}
                        </span>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    ${isFavorite ? `
                        <div class="text-yellow-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="text-slate-300 text-sm line-clamp-2 mb-4">
                ${this.escapeHtml(lastMessage)}
            </div>
            
            <div class="flex justify-between items-center">
                <div class="flex space-x-2">
                    <button class="view-conversation bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded text-sm transition-colors" 
                            data-conversation-id="${conversation.id}">
                        查看详情
                    </button>
                    <button class="toggle-favorite ${isFavorite ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-slate-600 hover:bg-slate-500'} text-white px-3 py-1 rounded text-sm transition-colors" 
                            data-conversation-id="${conversation.id}" 
                            data-is-favorite="${isFavorite}"
                            title="${isFavorite ? '取消收藏' : '添加收藏'}">
                        ${isFavorite ? '取消收藏' : '收藏'}
                    </button>
                    <button class="delete-conversation bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors" 
                            data-conversation-id="${conversation.id}">
                        删除
                    </button>
                </div>
                <div class="flex items-center space-x-2">
                    ${isFavorite ? `
                        <div class="text-yellow-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // 绑定事件
        const viewBtn = card.querySelector('.view-conversation');
        const favoriteBtn = card.querySelector('.toggle-favorite');
        const deleteBtn = card.querySelector('.delete-conversation');

        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.viewConversation(conversation.id);
            });
        }

        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(conversation.id, !isFavorite);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteConversation(conversation.id, conversation.title);
            });
        }

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

            if (response.ok) {
                const data = await response.json();
                this.showConversationModal(data.data.conversation);
            } else {
                this.showError('加载对话详情失败');
            }
        } catch (error) {
            console.error('查看对话失败:', error);
            this.showError('加载对话详情失败');
        }
    }

    /**
     * 显示对话详情模态框
     */
    showConversationModal(conversation) {
        const modal = document.getElementById('conversation-modal');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');
        const toggleFavorite = document.getElementById('toggle-favorite');
        const exportBtn = document.getElementById('export-conversation');

        if (!modal || !title || !content) return;

        title.textContent = conversation.title || `与${conversation.primary_mentor_name || conversation.mentor_name}的对话`;
        
        // 设置按钮属性
        if (toggleFavorite) {
            toggleFavorite.setAttribute('data-conversation-id', conversation.id);
            toggleFavorite.setAttribute('data-is-favorite', conversation.is_favorite);
            
            const svg = toggleFavorite.querySelector('svg');
            if (svg) {
                if (conversation.is_favorite) {
                    svg.setAttribute('fill', 'currentColor');
                    toggleFavorite.classList.add('text-yellow-400');
                } else {
                    svg.setAttribute('fill', 'none');
                    toggleFavorite.classList.remove('text-yellow-400');
                }
            }
        }

        if (exportBtn) {
            exportBtn.setAttribute('data-conversation-id', conversation.id);
        }

        // 渲染消息
        const messages = conversation.messages || [];
        content.innerHTML = messages.length > 0 
            ? messages.map(message => this.renderMessage(message)).join('')
            : '<div class="text-center text-slate-500 py-8">暂无消息记录</div>';

        modal.classList.remove('hidden');
    }

    /**
     * 渲染消息
     */
    renderMessage(message) {
        const isUser = (message.role || message.sender_type) === 'user';
        const timestamp = new Date(message.created_at).toLocaleString('zh-CN');
        
        return `
            <div class="flex ${isUser ? 'justify-end' : 'justify-start'} mb-6">
                <div class="max-w-[80%] ${isUser ? 'order-2' : 'order-1'}">
                    <div class="${isUser ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-100'} rounded-2xl px-4 py-3 ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}">
                        <div class="text-sm leading-relaxed">${this.escapeHtml(message.content).replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : 'text-left'}">
                        ${timestamp}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.getElementById('conversation-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * 切换收藏状态
     */
    async toggleFavorite(conversationId, isFavorite) {
        try {
            const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}/favorite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ is_favorite: isFavorite })
            });

            if (response.ok) {
                // 更新本地数据
                const conversation = this.conversations.find(c => c.id == conversationId);
                if (conversation) {
                    conversation.is_favorite = isFavorite;
                }
                
                // 重新渲染
                await this.renderConversations();
                await this.loadStatistics();
                
                this.showSuccess(isFavorite ? '已添加到收藏' : '已取消收藏');
            } else {
                this.showError('操作失败，请重试');
            }
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
                <div class="bg-slate-800 rounded-lg max-w-md w-full p-6 border border-slate-700">
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
                        <p class="text-slate-300 mb-2">确定要删除以下对话吗？</p>
                        <p class="text-white font-medium bg-slate-700 p-3 rounded border-l-4 border-red-500">"${this.escapeHtml(conversationTitle || '未命名对话')}"</p>
                        <p class="text-red-400 text-sm mt-3">⚠️ 此操作不可撤销，将永久删除该对话及其所有消息记录。</p>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button id="cancel-delete" class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors">
                            取消
                        </button>
                        <button id="confirm-delete" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">
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
        const content = [
            `# ${conversation.title || `与${conversation.primary_mentor_name || conversation.mentor_name}的对话`}`,
            '',
            `**导师**: ${conversation.primary_mentor_name || conversation.mentor_name}`,
            `**创建时间**: ${new Date(conversation.created_at).toLocaleString('zh-CN')}`,
            `**更新时间**: ${new Date(conversation.updated_at).toLocaleString('zh-CN')}`,
            `**消息数量**: ${conversation.message_count}`,
            '',
            '---',
            '',
            ...(conversation.messages || []).map(message => {
                const timestamp = new Date(message.created_at).toLocaleString('zh-CN');
                const isUser = (message.role || message.sender_type) === 'user';
                const sender = isUser ? '**用户**' : `**${conversation.primary_mentor_name || conversation.mentor_name}**`;
                return `${sender} (${timestamp}):\n\n${message.content}\n`;
            })
        ].join('\n');

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${conversation.title || '对话记录'}_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('对话已导出');
    }

    /**
     * 加载导师筛选选项
     */
    async loadMentorFilter() {
        const mentorFilter = document.getElementById('mentor-filter');
        if (!mentorFilter) return;

        try {
            const response = await fetch('http://localhost:3000/api/conversations/mentors', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const mentors = data.data;
                
                mentors.forEach(mentor => {
                    const option = document.createElement('option');
                    option.value = mentor.mentor_id;
                    option.textContent = mentor.mentor_name;
                    mentorFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('加载导师列表失败:', error);
        }
    }

    /**
     * 更新加载更多按钮
     */
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (!loadMoreBtn) return;

        if (this.currentPage < this.totalPages && this.conversations.length > 0) {
            loadMoreBtn.classList.remove('hidden');
        } else {
            loadMoreBtn.classList.add('hidden');
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
        
        const searchInput = document.getElementById('search-input');
        const mentorFilter = document.getElementById('mentor-filter');
        const sortOrder = document.getElementById('sort-order');
        
        if (searchInput) searchInput.value = '';
        if (mentorFilter) mentorFilter.value = '';
        if (sortOrder) sortOrder.value = 'updated_desc';
        
        this.currentPage = 1;
        this.loadConversations();
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

    /**
     * HTML转义
     */
    escapeHtml(text) {
        if (!text) return '';
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
     * 显示元素
     */
    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.classList.remove('hidden');
    }

    /**
     * 隐藏元素
     */
    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.classList.add('hidden');
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        // 可以使用toast通知或者其他方式显示错误
        console.error(message);
        alert(message); // 临时使用alert，可以后续改为更好的提示方式
    }

    /**
     * 显示成功信息
     */
    showSuccess(message) {
        // 可以使用toast通知或者其他方式显示成功信息
        console.log(message);
        // 临时使用简单的提示，可以后续改为更好的提示方式
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

