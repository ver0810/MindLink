// FounderMind UI 组件库
const UIComponents = {
    // 创建导师头像组件
    createMentorAvatar(mentor, size = 'medium') {
        const sizeClasses = {
            small: 'w-8 h-8',
            medium: 'w-10 h-10 md:w-12 md:h-12',
            large: 'w-16 h-16'
        };
        
        const avatar = document.createElement('img');
        avatar.src = mentor.avatar;
        avatar.alt = mentor.name;
        avatar.className = `${sizeClasses[size]} rounded-full border-2 border-slate-600 object-cover`;
        return avatar;
    },
    
    // 创建导师卡片
    createMentorCard(mentor, onClick) {
        const card = document.createElement('div');
        card.className = 'cool-card cool-card-hover p-6 cursor-pointer';
        
        card.innerHTML = `
            <div class="flex items-center space-x-4 mb-4">
                <img src="${mentor.avatar}" alt="${mentor.name}" 
                     class="w-16 h-16 rounded-full object-cover border-2 border-slate-700">
                <div>
                    <h3 class="text-lg font-semibold text-slate-100">${mentor.name}</h3>
                    <p class="text-sm text-slate-400">${mentor.title}</p>
                </div>
            </div>
            <p class="text-slate-300 text-sm mb-3 line-clamp-2">${mentor.shortBio}</p>
            <div class="flex flex-wrap gap-2">
                ${mentor.expertise.slice(0, 3).map(skill => 
                    `<span class="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">${skill}</span>`
                ).join('')}
            </div>
        `;
        
        if (onClick) {
            card.addEventListener('click', () => onClick(mentor));
        }
        
        return card;
    },
    
    // 创建聊天消息气泡
    createChatBubble(content, isUser = false, mentor = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in-up`;
        
        if (isUser) {
            messageDiv.innerHTML = `
                <div class="chat-bubble-user max-w-[85%] lg:max-w-[75%] rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
                    <p class="text-white text-sm md:text-base leading-relaxed whitespace-pre-wrap">${content}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="flex space-x-3 max-w-[90%] lg:max-w-[85%] w-full">
                    <img src="${mentor.avatar}" alt="${mentor.name}" 
                         class="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-slate-600 flex-shrink-0 mt-1">
                    <div class="chat-bubble-mentor flex-1 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
                        <div class="flex items-center mb-2">
                            <span class="text-sky-400 text-xs font-medium">${mentor.name}</span>
                        </div>
                        <div class="prose prose-sm md:prose-base prose-slate max-w-none">
                            <p class="text-slate-100 text-sm md:text-base leading-relaxed whitespace-pre-wrap m-0">${content}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return messageDiv;
    },
    
    // 创建打字指示器
    createTypingIndicator(mentor) {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'flex justify-start mb-6 typing-indicator animate-fade-in-up';
        
        typingDiv.innerHTML = `
            <div class="flex space-x-3 max-w-[90%] lg:max-w-[85%] w-full">
                <img src="${mentor.avatar}" alt="${mentor.name}" 
                     class="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-slate-600 flex-shrink-0 mt-1">
                <div class="chat-bubble-mentor flex-1 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
                    <div class="flex items-center mb-2">
                        <span class="text-sky-400 text-xs font-medium">${mentor.name}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                            <div class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
                            <div class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
                        </div>
                        <span class="text-slate-400 text-sm">正在思考...</span>
                    </div>
                </div>
            </div>
        `;
        
        return typingDiv;
    },
    
    // 创建流式消息容器
    createStreamingMessage(mentor) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex justify-start mb-6 animate-fade-in-up streaming-message';
        
        messageDiv.innerHTML = `
            <div class="flex space-x-3 max-w-[90%] lg:max-w-[85%] w-full">
                <img src="${mentor.avatar}" alt="${mentor.name}" 
                     class="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-slate-600 flex-shrink-0 mt-1">
                <div class="chat-bubble-mentor flex-1 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
                    <div class="flex items-center mb-2">
                        <span class="text-sky-400 text-xs font-medium">${mentor.name}</span>
                    </div>
                    <div class="prose prose-sm md:prose-base prose-slate max-w-none">
                        <p class="text-slate-100 text-sm md:text-base leading-relaxed whitespace-pre-wrap m-0 streaming-text"></p>
                        <span class="streaming-cursor inline-block w-0.5 h-4 bg-sky-400 ml-1 animate-pulse"></span>
                    </div>
                </div>
            </div>
        `;
        
        return messageDiv;
    },
    
    // 流式输出文本效果
    async streamText(element, text, speed = 30) {
        const textElement = element.querySelector('.streaming-text');
        const cursor = element.querySelector('.streaming-cursor');
        
        if (!textElement) return;
        
        textElement.textContent = '';
        
        // 添加打字机效果
        for (let i = 0; i < text.length; i++) {
            await new Promise(resolve => setTimeout(resolve, speed));
            textElement.textContent += text[i];
            
            // 实时滚动到底部（流式输出时）
            const container = element.closest('#chat-messages');
            if (container) {
                // 检查是否需要滚动（只有在接近底部时才滚动）
                const shouldScroll = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                if (shouldScroll) {
                    Utils.scrollToBottom(container, 0);
                }
            }
        }
        
        // 移除光标
        if (cursor) {
            cursor.remove();
        }
        
        // 移除流式标记
        element.classList.remove('streaming-message');
    },
    
    // 创建建议问题按钮
    createSuggestedQuestion(question, onClick) {
        const button = document.createElement('button');
        button.className = 'text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 text-sm transition-colors';
        button.textContent = question;
        
        if (onClick) {
            button.addEventListener('click', () => onClick(question));
        }
        
        return button;
    },
    
    // 创建模态框
    createModal(title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm hidden';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700';
        
        modalContent.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-slate-100">${title}</h3>
                <button class="text-slate-400 hover:text-slate-200 close-modal">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="text-slate-300 mb-6">${content}</div>
            <div class="flex justify-end space-x-3">
                ${actions.map(action => 
                    `<button class="px-4 py-2 ${action.primary ? 'bg-sky-600 hover:bg-sky-700' : 'bg-slate-600 hover:bg-slate-700'} text-white rounded-lg transition-colors" data-action="${action.action}">${action.text}</button>`
                ).join('')}
            </div>
        `;
        
        modal.appendChild(modalContent);
        
        // 关闭模态框事件
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('close-modal')) {
                this.hideModal(modal);
            }
        });
        
        // 动作按钮事件
        actions.forEach(action => {
            const button = modalContent.querySelector(`[data-action="${action.action}"]`);
            if (button && action.handler) {
                button.addEventListener('click', action.handler);
            }
        });
        
        return modal;
    },
    
    // 显示模态框
    showModal(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },
    
    // 隐藏模态框
    hideModal(modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    },
    
    // 创建加载状态
    createLoadingSpinner(text = '加载中...') {
        const spinner = document.createElement('div');
        spinner.className = 'flex items-center justify-center space-x-2 text-slate-400';
        
        spinner.innerHTML = `
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
            <span class="text-sm">${text}</span>
        `;
        
        return spinner;
    },
    
    // 创建通知提示
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        const colors = {
            info: 'bg-blue-600',
            success: 'bg-green-600',
            warning: 'bg-yellow-600',
            error: 'bg-red-600'
        };
        
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}; 