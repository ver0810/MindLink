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
    },
    
    // 创建文件上传组件
    createFileUploadArea() {
        const uploadArea = document.createElement('div');
        uploadArea.className = 'file-upload-area border-2 border-dashed border-slate-600 rounded-lg p-4 mb-3 transition-colors hover:border-sky-400';
        uploadArea.innerHTML = `
            <div class="flex items-center justify-center space-x-3">
                <button type="button" class="file-select-btn flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                    </svg>
                    <span class="text-sm text-slate-300">添加附件</span>
                </button>
                <span class="text-xs text-slate-400">或拖拽文件到此处</span>
            </div>
            <input type="file" class="file-input hidden" multiple accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.csv,.ppt,.pptx">
        `;

        // 添加拖拽功能
        this.addDragDropHandlers(uploadArea);
        
        // 添加文件选择功能
        const fileInput = uploadArea.querySelector('.file-input');
        const selectBtn = uploadArea.querySelector('.file-select-btn');
        
        selectBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelection(e.target.files, uploadArea));

        return uploadArea;
    },

    // 添加拖拽处理器
    addDragDropHandlers(uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('border-sky-400', 'bg-sky-400/10');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('border-sky-400', 'bg-sky-400/10');
            });
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelection(files, uploadArea);
        });
    },

    // 处理文件选择
    handleFileSelection(files, uploadArea) {
        const fileArray = Array.from(files);
        const validFiles = this.validateFiles(fileArray);
        
        if (validFiles.length > 0) {
            this.displaySelectedFiles(validFiles, uploadArea);
        }
    },

    // 文件验证
    validateFiles(files) {
        const validFiles = [];
        const errors = [];

        files.forEach(file => {
            // 检查文件大小
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`文件 "${file.name}" 超过10MB限制`);
                return;
            }

            // 检查文件类型
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            const allSupportedTypes = Object.values(SUPPORTED_FILE_TYPES).flat();
            
            if (!allSupportedTypes.includes(fileExtension)) {
                errors.push(`文件 "${file.name}" 格式不支持`);
                return;
            }

            validFiles.push(file);
        });

        // 显示错误
        if (errors.length > 0) {
            this.showNotification(errors.join('\n'), 'error');
        }

        return validFiles;
    },

    // 显示选中的文件
    displaySelectedFiles(files, uploadArea) {
        // 移除或隐藏上传提示
        const uploadPrompt = uploadArea.querySelector('.file-select-btn').parentElement;
        uploadPrompt.style.display = 'none';

        // 创建文件列表容器
        let fileList = uploadArea.querySelector('.file-list');
        if (!fileList) {
            fileList = document.createElement('div');
            fileList.className = 'file-list space-y-2';
            uploadArea.appendChild(fileList);
        }

        files.forEach(file => {
            const fileItem = this.createFilePreview(file);
            fileList.appendChild(fileItem);
        });

        // 添加清除按钮
        if (!uploadArea.querySelector('.clear-files-btn')) {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'clear-files-btn text-xs text-slate-400 hover:text-slate-300 mt-2';
            clearBtn.textContent = '清除所有文件';
            clearBtn.addEventListener('click', () => this.clearFiles(uploadArea));
            uploadArea.appendChild(clearBtn);
        }
    },

    // 创建文件预览
    createFilePreview(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-preview flex items-center justify-between p-2 bg-slate-700 rounded-lg';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex items-center space-x-3 flex-1 min-w-0';

        // 文件图标
        const fileIcon = this.getFileIcon(file.name);
        fileInfo.appendChild(fileIcon);

        // 文件信息
        const fileDetails = document.createElement('div');
        fileDetails.className = 'min-w-0 flex-1';
        fileDetails.innerHTML = `
            <div class="text-sm text-slate-200 truncate">${file.name}</div>
            <div class="text-xs text-slate-400">${this.formatFileSize(file.size)}</div>
        `;
        fileInfo.appendChild(fileDetails);

        // 删除按钮
        const removeBtn = document.createElement('button');
        removeBtn.className = 'text-slate-400 hover:text-red-400 transition-colors';
        removeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        `;
        removeBtn.addEventListener('click', () => fileItem.remove());

        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);

        // 存储文件对象
        fileItem.fileObject = file;

        return fileItem;
    },

    // 获取文件图标
    getFileIcon(fileName) {
        const extension = '.' + fileName.split('.').pop().toLowerCase();
        const icon = document.createElement('div');
        icon.className = 'w-8 h-8 rounded flex items-center justify-center text-xs font-semibold';

        if (SUPPORTED_FILE_TYPES.documents.includes(extension)) {
            icon.className += ' bg-blue-500 text-white';
            icon.textContent = 'DOC';
        } else if (SUPPORTED_FILE_TYPES.images.includes(extension)) {
            icon.className += ' bg-green-500 text-white';
            icon.textContent = 'IMG';
        } else if (SUPPORTED_FILE_TYPES.spreadsheets.includes(extension)) {
            icon.className += ' bg-yellow-500 text-white';
            icon.textContent = 'XLS';
        } else if (SUPPORTED_FILE_TYPES.presentations.includes(extension)) {
            icon.className += ' bg-purple-500 text-white';
            icon.textContent = 'PPT';
        } else {
            icon.className += ' bg-slate-500 text-white';
            icon.textContent = 'FILE';
        }

        return icon;
    },

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 清除文件
    clearFiles(uploadArea) {
        const fileList = uploadArea.querySelector('.file-list');
        const clearBtn = uploadArea.querySelector('.clear-files-btn');
        const uploadPrompt = uploadArea.querySelector('.file-select-btn').parentElement;
        
        if (fileList) fileList.remove();
        if (clearBtn) clearBtn.remove();
        uploadPrompt.style.display = '';
    },

    // 获取选中的文件
    getSelectedFiles(uploadArea) {
        const fileList = uploadArea.querySelector('.file-list');
        if (!fileList) return [];
        
        const filePreviews = fileList.querySelectorAll('.file-preview');
        return Array.from(filePreviews).map(preview => preview.fileObject);
    },

    // 创建带附件的聊天气泡
    createChatBubbleWithAttachments(content, isUser = false, mentor = null, attachments = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in-up`;
        
        if (isUser) {
            messageDiv.innerHTML = `
                <div class="chat-bubble-user max-w-[85%] lg:max-w-[75%] rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
                    ${attachments.length > 0 ? this.createAttachmentList(attachments, true) : ''}
                    ${content ? `<p class="text-white text-sm md:text-base leading-relaxed whitespace-pre-wrap${attachments.length > 0 ? ' mt-2' : ''}">${content}</p>` : ''}
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

    // 创建附件列表
    createAttachmentList(attachments, isUser = false) {
        const attachmentList = attachments.map(attachment => {
            return `
                <div class="attachment-item flex items-center space-x-2 p-2 ${isUser ? 'bg-sky-600/20' : 'bg-slate-600/20'} rounded-lg mb-1 last:mb-0">
                    <div class="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${this.getAttachmentIconClass(attachment.name)}">
                        ${this.getAttachmentIconText(attachment.name)}
                    </div>
                    <span class="text-xs ${isUser ? 'text-sky-100' : 'text-slate-300'} truncate">${attachment.name}</span>
                    <span class="text-xs ${isUser ? 'text-sky-200' : 'text-slate-400'} flex-shrink-0">${this.formatFileSize(attachment.size)}</span>
                </div>
            `;
        }).join('');

        return `<div class="attachments-list space-y-1">${attachmentList}</div>`;
    },

    // 获取附件图标类名
    getAttachmentIconClass(fileName) {
        const extension = '.' + fileName.split('.').pop().toLowerCase();
        if (SUPPORTED_FILE_TYPES.documents.includes(extension)) return 'bg-blue-400 text-white';
        if (SUPPORTED_FILE_TYPES.images.includes(extension)) return 'bg-green-400 text-white';
        if (SUPPORTED_FILE_TYPES.spreadsheets.includes(extension)) return 'bg-yellow-400 text-white';
        if (SUPPORTED_FILE_TYPES.presentations.includes(extension)) return 'bg-purple-400 text-white';
        return 'bg-slate-400 text-white';
    },

    // 获取附件图标文本
    getAttachmentIconText(fileName) {
        const extension = '.' + fileName.split('.').pop().toLowerCase();
        if (SUPPORTED_FILE_TYPES.documents.includes(extension)) return 'DOC';
        if (SUPPORTED_FILE_TYPES.images.includes(extension)) return 'IMG';
        if (SUPPORTED_FILE_TYPES.spreadsheets.includes(extension)) return 'XLS';
        if (SUPPORTED_FILE_TYPES.presentations.includes(extension)) return 'PPT';
        return 'FILE';
    }
};