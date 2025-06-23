// FounderMind Platform - 增强的对话系统
document.addEventListener('DOMContentLoaded', function() {
    // 初始化移动端菜单
    initMobileMenu();
    
    // 检查导师数据
    if (!checkMentorsData()) return;
    
    // 初始化增强版对话引擎
    initEnhancedConversationEngine();
    
    // 初始化对话系统
    initConversationSystem();
});

// 初始化增强版对话引擎
function initEnhancedConversationEngine() {
    if (typeof ConversationEngineEnhanced !== 'undefined') {
        window.conversationEngine = new ConversationEngineEnhanced();
        console.log('增强版对话引擎已初始化');
    } else {
        console.warn('增强版对话引擎未加载，使用简化版功能');
    }
}

// 初始化移动端菜单duo
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    }
}

// 检查导师数据是否加载
function checkMentorsData() {
    if (typeof mentors === 'undefined') {
        console.error('Mentors data not loaded');
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '<p class="text-red-400 text-center p-4">导师数据加载失败，请返回重试。</p>';
        }
        return false;
    }
    return true;
}

// 初始化对话系统
function initConversationSystem() {

    const conversationMode = sessionStorage.getItem('conversationMode') || '1v1';
    let currentMentorsInfo = []; // Array to hold one or more mentor objects
    let primaryMentorForUI = null; // For avatar in group chat, and suggested questions
    let conversationHistory = []; // 存储对话历史

    if (conversationMode === '1v1') {
        const mentorId = sessionStorage.getItem('selectedMentor');
        if (!mentorId) {
            alert('未选择导师，将返回导师选择页面。');
            window.location.href = 'dashboard.html';
            return;
        }
        const mentor = mentors.find(m => m.id === mentorId);
        if (!mentor) {
            alert('选择的导师信息未找到，将返回导师选择页面。');
            window.location.href = 'dashboard.html'; 
            return;
        }
        currentMentorsInfo.push(mentor);
        primaryMentorForUI = mentor;
    } else { // 1vMany
        const mentorIdsString = sessionStorage.getItem('selectedMentors');
        if (!mentorIdsString) {
            alert('未选择圆桌导师，将返回设置页面。');
            window.location.href = 'conversation-setup.html'; 
            return;
        }
        try {
            const mentorIds = JSON.parse(mentorIdsString);
            mentorIds.forEach(id => {
                const mentor = mentors.find(m => m.id === id);
                if (mentor) currentMentorsInfo.push(mentor);
            });
            if (currentMentorsInfo.length === 0) {
                alert('圆桌导师信息加载失败。');
                window.location.href = 'conversation-setup.html'; 
                return;
            }
            primaryMentorForUI = currentMentorsInfo[0]; // First selected mentor is primary for UI elements
        } catch (e) {
            console.error("Error parsing selected mentors:", e);
            alert('加载圆桌导师信息时出错。');
            window.location.href = 'conversation-setup.html'; 
            return;
        }
    }
    
    updateChatHeader(currentMentorsInfo, conversationMode);
    initializeChat(currentMentorsInfo, conversationMode, primaryMentorForUI);
    populateSuggestedQuestions(primaryMentorForUI);
    
    // 创建增强版对话记录
    initializeEnhancedConversation(currentMentorsInfo, conversationMode); // Use primary mentor's questions

    const selectedQuestionTemplate = sessionStorage.getItem('selectedQuestion');
    if (selectedQuestionTemplate) {
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.value = selectedQuestionTemplate;
            messageInput.style.height = 'auto';
            messageInput.style.height = (messageInput.scrollHeight) + 'px';
            sessionStorage.removeItem('selectedQuestion');
        }
    }

    // "How to Ask" Modal Logic
    const howToAskBtn = document.getElementById('how-to-ask-btn');
    const howToAskModal = document.getElementById('how-to-ask-modal');
    const gotItHowToAskBtn = document.getElementById('got-it-how-to-ask-modal');

    if (howToAskBtn && howToAskModal && gotItHowToAskBtn) {
        howToAskBtn.addEventListener('click', () => {
            howToAskModal.classList.remove('hidden');
        });

        gotItHowToAskBtn.addEventListener('click', () => {
            howToAskModal.classList.add('hidden');
        });

        // 点击遮罩关闭
        howToAskModal.addEventListener('click', (e) => {
            if (e.target === howToAskModal) {
                howToAskModal.classList.add('hidden');
            }
        });
    }



    // API Configuration Modal Logic
    const apiConfigBtn = document.getElementById('api-config-btn');
    const apiConfigModal = document.getElementById('api-config-modal');
    const closeApiConfigBtn = document.getElementById('close-api-config');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const testApiKeyBtn = document.getElementById('test-api-key');
    const apiKeyInput = document.getElementById('api-key-input');
    const apiStatus = document.getElementById('api-status');

    if (apiConfigBtn && apiConfigModal) {
        apiConfigBtn.addEventListener('click', () => {
            openApiConfigModal();
        });

        if (closeApiConfigBtn) {
            closeApiConfigBtn.addEventListener('click', () => {
                apiConfigModal.classList.add('hidden');
            });
        }

        if (saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', () => {
                saveApiKey();
            });
        }

        if (testApiKeyBtn) {
            testApiKeyBtn.addEventListener('click', () => {
                testApiConnection();
            });
        }

        // 点击遮罩关闭
        apiConfigModal.addEventListener('click', (e) => {
            if (e.target === apiConfigModal) {
                apiConfigModal.classList.add('hidden');
            }
        });
    }

    // 检查API状态并显示环境提示
    checkApiStatus();

    // 初始化对话分析面板
    initConversationAnalysisPanel();

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && howToAskModal && howToAskModal.classList.contains('flex')) {
            howToAskModal.classList.replace('flex', 'hidden');
        }
    });
}

// 初始化增强版对话记录
async function initializeEnhancedConversation(mentorsInfo, mode) {
    if (!window.conversationEngine) {
        console.warn('增强版对话引擎未初始化');
        return;
    }
    
    try {
        // 检查用户是否登录，决定是否启用数据库保存
        const authToken = localStorage.getItem('auth_token');
        if (authToken) {
            window.conversationEngine.settings.saveToDatabase = true;
            console.log('用户已登录，对话记录将自动保存到数据库');
        } else {
            window.conversationEngine.settings.saveToDatabase = false;
            console.log('用户未登录，对话记录仅保存到本地存储');
        }
        
        // 创建对话记录
        const primaryMentor = mentorsInfo[0];
        const conversationTitle = mode === '1v1' 
            ? `与${primaryMentor.name}的对话` 
            : `圆桌对话：${mentorsInfo.map(m => m.name).join('、')}`;
        
        // 将前端mode值映射为数据库支持的值
        const dbMode = mode === '1v1' ? 'single' : (mode === '1vMany' ? 'roundtable' : mode);
        
        const conversationId = await window.conversationEngine.createConversation({
            title: conversationTitle,
            mode: dbMode,
            mentors: mentorsInfo,
            tags: [mode, ...mentorsInfo.map(m => m.name)]
        });
        
        console.log('本地对话记录已创建, ID:', conversationId);
    } catch (error) {
        console.error('创建对话记录失败:', error);
        // 即使对话引擎创建失败，也不影响基本对话功能
    }
}

function updateChatHeader(mentorsInfo, mode) {
    const avatarsDiv = document.getElementById('chat-header-avatars');
    const titleEl = document.getElementById('chat-header-title');
    const subtitleEl = document.getElementById('chat-header-subtitle');
    
    avatarsDiv.innerHTML = '';
    
    mentorsInfo.slice(0, 4).forEach((mentor, index) => {
        const avatar = document.createElement('img');
        avatar.src = mentor.avatar;
        avatar.alt = mentor.name;
        avatar.className = `w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-slate-600 object-cover`;
        if (index > 0) avatar.style.marginLeft = '-0.5rem';
        avatarsDiv.appendChild(avatar);
    });
    
    if (mentorsInfo.length > 4) {
        const moreIndicator = document.createElement('div');
        moreIndicator.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-slate-600 bg-slate-700 flex items-center justify-center text-white text-sm font-semibold';
        moreIndicator.style.marginLeft = '-0.5rem';
        moreIndicator.textContent = `+${mentorsInfo.length - 4}`;
        avatarsDiv.appendChild(moreIndicator);
    }

    if (mode === '1v1') {
        titleEl.textContent = `与 ${mentorsInfo[0].name} 对话`;
        subtitleEl.textContent = `${mentorsInfo[0].title} | ${mentorsInfo[0].expertise.slice(0, 2).join('、')}`;
    } else {
        titleEl.textContent = '圆桌研讨';
        const mentorNames = mentorsInfo.map(m => m.name).join(', ');
        subtitleEl.textContent = `与 ${mentorNames.substring(0, 50)}${mentorNames.length > 50 ? '...' : ''} 交流`;
    }
}

function initializeChat(mentorsInfo, mode, primaryMentor) {
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    const attachmentBtn = document.getElementById('attachment-btn');
    const fileUploadContainer = document.getElementById('file-upload-container');

    // 初始化对话历史
    initializeConversationHistory(mentorsInfo, mode);
    
    // 文件上传功能
    let fileUploadArea = null;
    let selectedFiles = [];

    let greeting = "";
    if (mode === '1v1') {
        greeting = `你好！我是${primaryMentor.name}。很高兴能与你交流，请问有什么我可以帮助你的吗？或者，可以从下面的建议问题开始。`;
    } else {
        // 圆桌讨论模式：为每个导师生成问候语
        const greetings = mentorsInfo.map(mentor => 
            `**${mentor.name}**：你好！我是${mentor.name}，${mentor.title}。很高兴参加这次圆桌讨论。`
        );
        greetings.push(`**主持人**：欢迎大家参加本次圆桌研讨会。请提出你的问题，各位导师将从不同角度为你提供见解。`);
        greeting = greetings.join('\n\n');
    }
    
    // 显示初始问候语
    setTimeout(async () => {
        if (mode === '1vMany' || mode === 'roundtable') {
            // 圆桌讨论模式：解析问候语并为每个导师显示
            await addRoundtableMessageStreaming(chatMessages, mentorsInfo, greeting);
        } else {
            // 1对1模式：使用原有方式
            await addMentorMessageStreaming(chatMessages, primaryMentor, greeting);
        }
    }, 500);

    // 附件按钮功能
    if (attachmentBtn) {
        attachmentBtn.addEventListener('click', () => {
            toggleFileUpload();
        });
    }

    function toggleFileUpload() {
        if (fileUploadContainer.classList.contains('hidden')) {
            // 显示文件上传区域
            if (!fileUploadArea) {
                fileUploadArea = UIComponents.createFileUploadArea();
                fileUploadContainer.appendChild(fileUploadArea);
            }
            fileUploadContainer.classList.remove('hidden');
            attachmentBtn.classList.add('text-sky-400');
        } else {
            // 隐藏文件上传区域
            fileUploadContainer.classList.add('hidden');
            attachmentBtn.classList.remove('text-sky-400');
        }
    }

    async function sendMessage() {
        const messageText = messageInput.value.trim();
        const hasFiles = fileUploadArea && UIComponents.getSelectedFiles(fileUploadArea).length > 0;
        
        if (messageText === '' && !hasFiles) return;

        // 获取选中的文件
        if (hasFiles) {
            selectedFiles = UIComponents.getSelectedFiles(fileUploadArea);
        }

        // 准备消息内容
        let finalMessageText = messageText;
        let attachmentsForDisplay = [];

        if (selectedFiles.length > 0) {
            // 处理文件内容
            try {
                const processedFiles = await FileManager.prepareFilesForAI(selectedFiles);
                finalMessageText = FileManager.buildMessageWithFiles(messageText, processedFiles);
                
                // 准备显示用的附件信息
                attachmentsForDisplay = selectedFiles.map(file => ({
                    name: file.name,
                    size: file.size,
                    type: file.type
                }));
            } catch (error) {
                console.error('文件处理失败:', error);
                UIComponents.showNotification('文件处理失败，仅发送文本消息', 'warning');
            }
        }

        // 显示用户消息（带附件显示）
        if (attachmentsForDisplay.length > 0) {
            addUserMessageWithAttachments(chatMessages, messageText, attachmentsForDisplay);
        } else {
            addUserMessage(chatMessages, messageText);
        }
        
        // 清空输入
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // 清空文件
        if (fileUploadArea) {
            UIComponents.clearFiles(fileUploadArea);
            fileUploadContainer.classList.add('hidden');
            attachmentBtn.classList.remove('text-sky-400');
        }
        selectedFiles = [];

        // 添加到对话历史（使用包含文件内容的完整消息）
        await addToConversationHistory('user', finalMessageText);

        simulateMentorTyping(chatMessages, primaryMentor);

        try {
            const response = await generateMentorResponseWithAPI(mentorsInfo, messageText, mode, primaryMentor);
            const typingIndicator = chatMessages.querySelector('.typing-indicator');
            if (typingIndicator) typingIndicator.remove();
            
            // 根据模式选择不同的显示方式
            if (mode === '1vMany' || mode === 'roundtable') {
                // 圆桌讨论模式：为每个导师单独显示发言
                await addRoundtableMessageStreaming(chatMessages, mentorsInfo, response);
            } else {
                // 1对1模式：使用原有的显示方式
                await addMentorMessageStreaming(chatMessages, primaryMentor, response);
            }
            
            // 添加助手回复到对话历史
            await addToConversationHistory('assistant', response);
            
        } catch (error) {
            console.error('Error generating response:', error);
            const typingIndicator = chatMessages.querySelector('.typing-indicator');
            if (typingIndicator) typingIndicator.remove();
            
            // 显示错误通知
            UIComponents.showNotification('API调用失败，使用预设回复', 'warning');
            
            // 如果API调用失败，回退到预设回复
            const fallbackResponse = await generateMentorResponseFallback(mentorsInfo, messageText, mode, primaryMentor);
            
            // 根据模式选择不同的显示方式
            if (mode === '1vMany' || mode === 'roundtable') {
                await addRoundtableMessageStreaming(chatMessages, mentorsInfo, fallbackResponse);
            } else {
                await addMentorMessageStreaming(chatMessages, primaryMentor, fallbackResponse);
            }
            
            await addToConversationHistory('assistant', fallbackResponse);
        }
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

// 初始化对话历史
function initializeConversationHistory(mentorsInfo, mode) {
    conversationHistory = [];
    
    // 添加系统提示词
    const systemPrompt = buildSystemPrompt(mentorsInfo, mode);
    conversationHistory.push({
        role: 'system',
        content: systemPrompt
    });
}

// 构建系统提示词
function buildSystemPrompt(mentorsInfo, mode) {
    let template = '';
    let prompt = '';
    
    if (mode === '1v1') {
        template = CONFIG.CONVERSATION.SYSTEM_PROMPTS.ONE_ON_ONE;
        const mentor = mentorsInfo[0];
        prompt = Utils.formatTemplate(template, {
            mentor_name: mentor.name,
            mentor_title: mentor.title,
            expertise: mentor.expertise.join('、'),
            bio: mentor.shortBio || mentor.bio
        });
    } else {
        template = CONFIG.CONVERSATION.SYSTEM_PROMPTS.ROUNDTABLE;
        const mentorsInfo_str = mentorsInfo.map(m => 
            `${m.name}（${m.title}，${m.expertise.slice(0,2).join('/')}专家）`
        ).join('、');
        prompt = Utils.formatTemplate(template, {
            mentors_info: mentorsInfo_str
        });
    }
    
    return prompt;
}

// 添加消息到对话历史
async function addToConversationHistory(role, content) {
    conversationHistory.push({
        role: role,
        content: content
    });
    
    // 保存消息到数据库功能
    if (window.conversationEngine && role !== 'system') {
        try {
            const messageObj = {
                role: role === 'user' ? 'user' : 'assistant',
                content: content,
                metadata: {
                    timestamp: new Date().toISOString(),
                    source: role === 'user' ? 'user_input' : 'ai_response'
                }
            };
            await window.conversationEngine.saveMessageToDatabase(messageObj);
            console.log(`消息已保存到数据库: ${role}`);
        } catch (error) {
            console.error('保存消息到数据库失败:', error);
        }
    }
    
    // 保存到本地存储
    if (window.conversationEngine && role !== 'system') {
        window.conversationEngine.addMessageToHistory({
            role: role === 'user' ? 'user' : 'assistant',
            content: content,
            timestamp: new Date().toISOString(),
            metadata: {
                source: role === 'user' ? 'user_input' : 'ai_response'
            }
        });
        console.log(`消息已保存到本地存储: ${role}`);
    }
    
    // 保持历史记录在合理范围内
    if (conversationHistory.length > CONFIG.CONVERSATION.MAX_HISTORY * 2 + 1) {
        // 保留系统消息和最近的MAX_HISTORY轮对话
        const systemMessage = conversationHistory[0];
        const recentMessages = conversationHistory.slice(-CONFIG.CONVERSATION.MAX_HISTORY * 2);
        conversationHistory = [systemMessage, ...recentMessages];
    }
}

// 使用OpenAI API生成回复
async function generateMentorResponseWithAPI(mentorsInfo, userMessage, mode, primaryMentor) {
    try {
        // 动态获取API密钥
        const apiKey = ApiManager.getApiKey();
        if (!apiKey) {
            throw new Error('API密钥未设置');
        }
        
        const response = await fetch(CONFIG.API.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: CONFIG.API.MODEL,
                messages: conversationHistory,
                max_tokens: CONFIG.API.MAX_TOKENS,
                temperature: CONFIG.API.TEMPERATURE
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
        } else {
            throw new Error('API返回格式错误');
        }
        
    } catch (error) {
        console.error('API调用失败：', error);
        throw error;
    }
}

// 回退方案：使用预设回复（改进版 - 支持多导师独立回复）
async function generateMentorResponseFallback(mentorsInfo, userMessage, mode, primaryMentor) {
    if (mode === '1vMany') {
        // 多导师模式：为每个导师生成独立回复
        return generateMultiMentorFallbackResponse(mentorsInfo, userMessage);
    } else {
        // 单导师模式：使用原有逻辑
        return generateSingleMentorFallbackResponse(primaryMentor, userMessage);
    }
}

// 生成多导师回退回复
function generateMultiMentorFallbackResponse(mentorsInfo, userMessage) {
    const mentorResponses = [];
    
    // 为每个导师生成独立的回复
    mentorsInfo.forEach(mentor => {
        const response = getMentorSpecificResponse(mentor, userMessage);
        mentorResponses.push(`**${mentor.name}**：${response}`);
    });
    
    return mentorResponses.join('\n\n');
}

// 生成单导师回退回复
function generateSingleMentorFallbackResponse(mentor, userMessage) {
    return getMentorSpecificResponse(mentor, userMessage);
}

// 获取导师特定回复
function getMentorSpecificResponse(mentor, userMessage) {
    const mentorResponses = {
        'buffett': {
            '融资': "对于融资，我的建议是保持谨慎。过度负债会削弱企业的抗风险能力。确保每一笔资金都能创造价值，选择那些真正理解你业务的投资者。",
            '投资': "投资需要耐心和长远眼光。最好的投资是在伟大的企业中购买小部分股权。专注于企业的内在价值，而不是短期的市场波动。",
            'ai': "对于AI投资，我会关注那些有实际盈利能力的公司，而不是仅仅概念炒作。技术必须转化为可持续的商业价值。",
            'default': "成功的关键是找到有护城河的业务。专注于长期价值创造，保持理性投资思维。"
        },
        'lika': {
            '融资': "融资是把双刃剑。关键是选择能带来资源和专业知识的投资人，而不仅仅是资金。现金流管理比利润更重要。",
            '团队': "建设团队如建房子，地基要稳。选择价值观一致的人，给他们成长的空间和明确的方向。",
            'default': "做生意要有耐心，看准时机再出手。基础建设比快速扩张更重要，稳扎稳打才能走得更远。"
        },
        'ma': {
            '融资': "找对投资人比拿到钱更重要。投资人应该是你的伙伴，能够帮助你的事业成长，而不仅仅是给钱。",
            '团队': "今天很残酷，明天更残酷，后天很美好。找到相信后天的人一起奋斗，团队的信念比技能更重要。",
            'ai': "AI时代已经到来，但最终还是要回到商业本质：为用户创造价值。技术是工具，商业模式是关键。",
            'default': "创业要有梦想，但更要脚踏实地。客户第一，员工第二，股东第三。专注解决真实的用户需求。"
        },
        'altman': {
            'ai': "AI是这个时代最重要的技术浪潮。创业者应该积极思考如何将AI能力整合到产品中，创造真正的用户价值。",
            '融资': "好公司永远都能融到钱。专注于创造真正的价值和增长，而不是为了融资而融资。产品市场契合度是关键。",
            '团队': "招聘是CEO最重要的工作之一。找到比你更优秀的人，给他们足够的自主权和挑战。",
            'default': "构建有价值的产品是核心。思考10年后的发展方向，专注于技术创新和用户体验。"
        },
        'musk': {
            'ai': "人工智能的潜力巨大，但我们必须警惕其风险。发展AI需要有强烈的责任感，确保它造福人类。",
            '创新': "从第一性原理思考问题。不要被传统观念束缚，勇于挑战不可能。失败是成功的垫脚石。",
            'default': "人生应该充满冒险和挑战。设定远大目标，然后拼命去实现它。改变世界从改变思维开始。"
        },
        'zhang': {
            '产品': "产品经理应该像艺术家一样打磨产品，追求极致用户体验。细节决定成败，用户感知就是产品价值。",
            '团队': "小团队，大梦想。保持团队的纯粹性和执行力，避免大公司病。让每个人都能为产品负责。",
            'default': "做产品要有工匠精神。用户体验大于一切，简单易用是最高境界。"
        }
    };
    
    // 关键词匹配
    const keywords = ['融资', '投资', '团队', '招聘', 'ai', '人工智能', '产品', '创新'];
    const matchedKeyword = keywords.find(keyword => 
        userMessage.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const responses = mentorResponses[mentor.id] || mentorResponses['ma']; // 默认使用马云的回复
    
    if (matchedKeyword && responses[matchedKeyword]) {
        return responses[matchedKeyword];
    }
    
    return responses['default'] || responses[Object.keys(responses)[0]];
}

function addUserMessage(container, text) {
    const messageElement = UIComponents.createChatBubble(text, true);
    container.appendChild(messageElement);
    // 用户发送消息后立即滚动到底部
    setTimeout(() => Utils.scrollToBottom(container), 50);
}

function addUserMessageWithAttachments(container, text, attachments) {
    const messageElement = UIComponents.createChatBubbleWithAttachments(text, true, null, attachments);
    container.appendChild(messageElement);
    // 用户发送消息后立即滚动到底部
    setTimeout(() => Utils.scrollToBottom(container), 50);
}

function addMentorMessage(container, mentorToDisplay, text) {
    const messageElement = UIComponents.createChatBubble(text, false, mentorToDisplay);
    container.appendChild(messageElement);
    Utils.scrollToBottom(container);
}

// 添加流式消息
async function addMentorMessageStreaming(container, mentorToDisplay, text) {
    const streamingElement = UIComponents.createStreamingMessage(mentorToDisplay);
    container.appendChild(streamingElement);
    
    // 检查是否是第一条消息（问候语）
    const isFirstMessage = container.children.length === 1;
    
    if (!isFirstMessage) {
        // 非首条消息才滚动到底部
        Utils.scrollToBottom(container);
    }
    
    // 开始流式输出
    await UIComponents.streamText(streamingElement, text, 20); // 20ms 延迟，更快的打字效果
    
    if (!isFirstMessage) {
        // 流式输出完成后滚动到底部
        Utils.scrollToBottom(container);
    }
}

function simulateMentorTyping(container, mentorToDisplay) {
    const typingElement = UIComponents.createTypingIndicator(mentorToDisplay);
    container.appendChild(typingElement);
    Utils.scrollToBottom(container);
}

function populateSuggestedQuestions(primaryMentor) {
    const container = document.getElementById('suggested-questions');
    if (!container || !primaryMentor) return;
    container.innerHTML = '';

    const handleQuestionClick = (question) => {
        const messageInput = document.getElementById('message-input');
        messageInput.value = question;
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
        messageInput.focus();
    };

    primaryMentor.suggestedQuestions.slice(0, 3).forEach(question => {
        const questionButton = UIComponents.createSuggestedQuestion(question, handleQuestionClick);
        questionButton.className = 'text-xs bg-slate-700/80 border border-slate-600 rounded-full px-3 py-1.5 text-sky-300 hover:bg-slate-600/80 hover:border-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500';
        container.appendChild(questionButton);
    });
}

// API Configuration Functions
function openApiConfigModal() {
    const apiConfigModal = document.getElementById('api-config-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    
    if (apiConfigModal && apiKeyInput) {
        // 显示当前API密钥（掩码形式）
        const currentKey = ApiManager.hasApiKey() ? '已设置 (点击输入框可更改)' : '';
        apiKeyInput.placeholder = currentKey || '输入您的API密钥';
        
        // 更新状态显示
        updateApiStatus();
        
        // 显示模态框
        apiConfigModal.classList.remove('hidden');
    }
}

function updateApiStatus() {
    const apiStatus = document.getElementById('api-status');
    if (!apiStatus) return;
    
    const hasKey = ApiManager.hasApiKey();
    const isGitHubPages = CONFIG.ENVIRONMENT.isGitHubPages;
    
    let statusHtml = '';
    
    if (hasKey) {
        statusHtml = `
            <div class="flex items-center">
                <div class="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span class="text-green-400">API密钥已配置</span>
            </div>
        `;
    } else {
        if (isGitHubPages) {
            statusHtml = `
                <div class="flex items-center">
                    <div class="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                    <span class="text-yellow-400">GitHub Pages演示模式 - 需要配置API密钥</span>
                </div>
            `;
        } else {
            statusHtml = `
                <div class="flex items-center">
                    <div class="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                    <span class="text-red-400">未配置API密钥</span>
                </div>
            `;
        }
    }
    
    apiStatus.innerHTML = statusHtml;
}

function saveApiKey() {
    const apiKeyInput = document.getElementById('api-key-input');
    const apiConfigModal = document.getElementById('api-config-modal');
    
    if (!apiKeyInput) return;
    
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        alert('请输入API密钥');
        return;
    }
    
    // 保存API密钥
    ApiManager.setApiKey(apiKey);
    
    // 更新状态
    updateApiStatus();
    
    // 清空输入框
    apiKeyInput.value = '';
    
    // 显示成功消息
    UIComponents.showNotification('API密钥已保存', 'success');
    
    // 关闭模态框
    if (apiConfigModal) {
        apiConfigModal.classList.add('hidden');
    }
}

async function testApiConnection() {
    const testApiKeyBtn = document.getElementById('test-api-key');
    const apiKeyInput = document.getElementById('api-key-input');
    
    if (!testApiKeyBtn) return;
    
    // 设置按钮为加载状态
    const originalText = testApiKeyBtn.textContent;
    testApiKeyBtn.textContent = '测试中...';
    testApiKeyBtn.disabled = true;
    
    try {
        let testKey = '';
        
        // 使用输入框中的密钥或已保存的密钥
        if (apiKeyInput && apiKeyInput.value.trim()) {
            testKey = apiKeyInput.value.trim();
        } else {
            testKey = ApiManager.getApiKey();
        }
        
        if (!testKey) {
            throw new Error('请先输入API密钥');
        }
        
        // 发送测试请求
        const response = await fetch(CONFIG.API.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testKey}`
            },
            body: JSON.stringify({
                model: CONFIG.API.MODEL,
                messages: [
                    { role: 'user', content: '测试连接' }
                ],
                max_tokens: 10,
                temperature: 0.7
            })
        });
        
        if (response.ok) {
            UIComponents.showNotification('API连接测试成功！', 'success');
        } else {
            throw new Error(`API测试失败: ${response.status} ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('API测试失败:', error);
        UIComponents.showNotification(`连接测试失败: ${error.message}`, 'error');
    } finally {
        // 恢复按钮状态
        testApiKeyBtn.textContent = originalText;
        testApiKeyBtn.disabled = false;
    }
}

function checkApiStatus() {
    const isGitHubPages = CONFIG.ENVIRONMENT.isGitHubPages;
    const hasApiKey = ApiManager.hasApiKey();
    
    // 如果是GitHub Pages环境且没有API密钥，显示提示
    if (isGitHubPages && !hasApiKey) {
        setTimeout(() => {
            UIComponents.showNotification(
                '🔑 GitHub Pages演示模式：点击"API配置"按钮设置您的SiliconFlow API密钥以体验完整功能', 
                'info', 
                8000
            );
        }, 2000);
    }
}

// 解析圆桌讨论回复（改进版）
function parseRoundtableResponse(response, mentorsInfo) {
    const mentorResponses = [];
    const lines = response.split('\n');
    let currentMentor = null;
    let currentContent = '';
    
    // 创建主持人虚拟导师对象
    const hostMentor = {
        id: 'host', 
        name: '主持人',
        title: '圆桌讨论主持人',
        avatar: '../assets/images/icons/host-avatar.svg'
    };
    
    // 导师名称匹配模式（支持多种格式）
    const mentorPatterns = [
        /^\*\*(.+?)\*\*[：:]\s*(.*)$/,  // **导师名**：
        /^【(.+?)】[：:]\s*(.*)$/,      // 【导师名】：
        /^(.+?)[：:]\s*(.*)$/           // 导师名：
    ];
    
    for (const line of lines) {
        let mentorMatch = null;
        
        // 尝试匹配不同的导师发言格式
        for (const pattern of mentorPatterns) {
            mentorMatch = line.match(pattern);
            if (mentorMatch) break;
        }
        
        if (mentorMatch) {
            // 保存前一个导师的发言
            if (currentMentor && currentContent.trim()) {
                mentorResponses.push({
                    mentor: currentMentor,
                    content: currentContent.trim()
                });
            }
            
            // 查找对应的导师信息
            const mentorName = mentorMatch[1].trim();
            let foundMentor = null;
            
            // 主持人相关关键词
            const hostKeywords = ['主持人', '主持代表', '综合建议', '总结', '主持'];
            if (hostKeywords.some(keyword => mentorName.includes(keyword))) {
                foundMentor = hostMentor;
            } else {
                // 精确匹配或模糊匹配导师名称
                foundMentor = mentorsInfo.find(m => m.name === mentorName) || 
                             mentorsInfo.find(m => m.name.includes(mentorName)) ||
                             mentorsInfo.find(m => mentorName.includes(m.name)) ||
                             // 匹配导师的英文名或别名
                             mentorsInfo.find(m => {
                                 const aliases = [m.name, m.title, m.id];
                                 return aliases.some(alias => alias && (
                                     alias.toLowerCase().includes(mentorName.toLowerCase()) ||
                                     mentorName.toLowerCase().includes(alias.toLowerCase())
                                 ));
                             });
            }
            
            if (foundMentor) {
                currentMentor = foundMentor;
                currentContent = mentorMatch[2] || '';
            } else {
                // 如果找不到匹配的导师，创建一个临时导师对象
                console.warn(`未找到匹配的导师: ${mentorName}`);
                currentMentor = {
                    id: `temp_${mentorName}`,
                    name: mentorName,
                    title: '特邀嘉宾',
                    avatar: mentorsInfo[0]?.avatar || '../assets/images/mentors/default.jpg'
                };
                currentContent = mentorMatch[2] || '';
            }
        } else if (currentMentor) {
            // 继续添加到当前导师的发言内容
            if (currentContent) {
                currentContent += '\n' + line;
            } else {
                currentContent = line;
            }
        } else if (line.trim()) {
            // 如果还没有找到导师但有内容，分配给第一个导师
            if (!currentMentor) {
                currentMentor = mentorsInfo[0];
                currentContent = line;
            }
        }
    }
    
    // 保存最后一个导师的发言
    if (currentMentor && currentContent.trim()) {
        mentorResponses.push({
            mentor: currentMentor,
            content: currentContent.trim()
        });
    }
    
    // 如果没有解析出任何导师发言，则返回原始回复给第一个导师
    if (mentorResponses.length === 0) {
        mentorResponses.push({
            mentor: mentorsInfo[0],
            content: response
        });
    }
    
    return mentorResponses;
}

// 添加圆桌讨论的多导师消息（改进版）
async function addRoundtableMessageStreaming(container, mentorsInfo, response) {
    const mentorResponses = parseRoundtableResponse(response, mentorsInfo);
    
    // 使用新的多导师流式消息组件
    const multiMentorElement = UIComponents.createStreamingMultiMentorMessage(mentorResponses);
    container.appendChild(multiMentorElement);
    
    // 开始流式输出
    await UIComponents.streamMultiMentorText(multiMentorElement, mentorResponses, 20);
    
    // 滚动到底部
    Utils.scrollToBottom(container);
}

// 初始化对话分析面板
function initConversationAnalysisPanel() {
    const analysisBtn = document.getElementById('conversation-analysis-btn');
    const analysisPanel = document.getElementById('conversation-analysis-panel');
    const closeAnalysisBtn = document.getElementById('close-analysis-panel');
    const generateAnalysisBtn = document.getElementById('generate-analysis-btn');
    
    if (!analysisBtn || !analysisPanel) return;

    // 显示分析按钮（当有对话内容时）
    function showAnalysisButton() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && chatMessages.children.length > 0) {
            analysisBtn.classList.remove('hidden');
        }
    }

    // 切换分析面板显示
    analysisBtn.addEventListener('click', () => {
        analysisPanel.classList.toggle('hidden');
        if (!analysisPanel.classList.contains('hidden')) {
            // 面板打开时，检查是否需要显示空状态
            updateAnalysisDisplay();
        }
    });

    // 关闭分析面板
    if (closeAnalysisBtn) {
        closeAnalysisBtn.addEventListener('click', () => {
            analysisPanel.classList.add('hidden');
        });
    }

    // 生成分析
    if (generateAnalysisBtn) {
        generateAnalysisBtn.addEventListener('click', async () => {
            await generateConversationAnalysis();
        });
    }

    // 监听对话变化
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                showAnalysisButton();
            }
        });
    });

    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        observer.observe(chatMessages, { childList: true });
    }
}

// 生成对话分析
async function generateConversationAnalysis() {
    const loadingEl = document.getElementById('analysis-loading');
    const resultsEl = document.getElementById('analysis-results');
    const emptyEl = document.getElementById('analysis-empty');
    
    if (!loadingEl || !resultsEl || !emptyEl) return;

    // 显示加载状态
    loadingEl.classList.remove('hidden');
    resultsEl.classList.add('hidden');
    emptyEl.classList.add('hidden');

    try {
        // 收集对话内容
        const conversationData = await collectConversationData();
        
        if (!conversationData || conversationData.messages.length === 0) {
            throw new Error('没有找到对话内容');
        }

        // 调用分析API
        const analysis = await analyzeConversation(conversationData);
        
        // 显示分析结果
        displayAnalysisResults(analysis);
        
        loadingEl.classList.add('hidden');
        resultsEl.classList.remove('hidden');
        
    } catch (error) {
        console.error('生成分析失败:', error);
        loadingEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        
        // 显示错误提示
        const emptyText = emptyEl.querySelector('.text-slate-400');
        if (emptyText) {
            emptyText.innerHTML = `
                <svg class="w-12 h-12 mx-auto mb-2 opacity-50 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                分析失败：${error.message}
            `;
        }
    }
}

// 收集对话数据
async function collectConversationData() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return null;

    const messages = [];
    const messageElements = chatMessages.children;

    for (let i = 0; i < messageElements.length; i++) {
        const messageEl = messageElements[i];
        
        // 识别用户消息
        if (messageEl.classList.contains('chat-bubble-user') || 
            messageEl.querySelector('.chat-bubble-user')) {
            const textEl = messageEl.querySelector('.text-slate-200, .text-slate-100, p');
            if (textEl && textEl.textContent.trim()) {
                messages.push({
                    role: 'user',
                    content: textEl.textContent.trim(),
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        // 识别导师消息
        if (messageEl.classList.contains('chat-bubble-mentor') || 
            messageEl.querySelector('.chat-bubble-mentor') ||
            messageEl.classList.contains('multi-mentor-response')) {
            
            // 单个导师回复
            const textEl = messageEl.querySelector('.text-slate-200, .text-slate-100, p');
            if (textEl && textEl.textContent.trim()) {
                messages.push({
                    role: 'assistant',
                    content: textEl.textContent.trim(),
                    timestamp: new Date().toISOString()
                });
            }
            
            // 多个导师回复
            const mentorMessages = messageEl.querySelectorAll('.streaming-mentor-message');
            mentorMessages.forEach(mentorMsg => {
                const mentorTextEl = mentorMsg.querySelector('.text-slate-200');
                const mentorNameEl = mentorMsg.querySelector('.text-sky-400');
                if (mentorTextEl && mentorTextEl.textContent.trim()) {
                    const mentorName = mentorNameEl ? mentorNameEl.textContent.trim() : '导师';
                    messages.push({
                        role: 'assistant',
                        content: `${mentorName}: ${mentorTextEl.textContent.trim()}`,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }
    }

    return {
        messages,
        conversationId: sessionStorage.getItem('currentConversationId') || null,
        startTime: new Date().toISOString(),
        totalMessages: messages.length
    };
}

// 调用分析API
async function analyzeConversation(conversationData) {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
        throw new Error('未登录，无法进行分析');
    }

    const response = await fetch('/api/conversation-analysis/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(conversationData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '分析请求失败');
    }

    return await response.json();
}

// 显示分析结果
function displayAnalysisResults(analysis) {
    // 显示总结
    const summaryEl = document.getElementById('conversation-summary');
    if (summaryEl && analysis.summary) {
        summaryEl.textContent = analysis.summary;
    }

    // 显示问题类型标签
    displayTags('problem-categories', analysis.problemCategories || analysis.problem_categories || []);
    
    // 显示关键话题标签
    displayTags('key-topics', analysis.keyTopics || analysis.key_topics || []);
    
    // 显示智能标签
    displayTags('auto-tags', analysis.autoTags || analysis.auto_tags || []);

    // 显示复杂度
    displayComplexity(analysis.complexity || 1);

    // 显示情感分析
    displaySentiment(analysis.sentiment || '中性客观');

    // 显示关键洞察
    displayInsights(analysis.keyInsights || analysis.key_insights || []);

    // 显示建议行动
    displayActions(analysis.suggestedActions || analysis.suggested_actions || []);
}

// 显示标签
function displayTags(containerId, tags) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(tags)) return;

    container.innerHTML = '';
    
    if (tags.length === 0) {
        container.innerHTML = '<span class="text-slate-500 text-sm">暂无标签</span>';
        return;
    }

    tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = `conversation-tag tag-category-${getTagCategory(containerId)} text-xs px-2 py-1 rounded-full`;
        tagEl.textContent = formatTagName(tag);
        container.appendChild(tagEl);
    });
}

// 获取标签类别
function getTagCategory(containerId) {
    switch (containerId) {
        case 'problem-categories': return 'problem';
        case 'key-topics': return 'topic';
        case 'auto-tags': return 'auto';
        default: return 'auto';
    }
}

// 格式化标签名称
function formatTagName(tag) {
    if (typeof tag === 'string') return tag;
    if (tag && tag.name) return tag.name;
    return String(tag);
}

// 显示复杂度
function displayComplexity(complexity) {
    const indicatorEl = document.getElementById('complexity-indicator');
    const labelEl = document.getElementById('complexity-label');
    
    if (!indicatorEl || !labelEl) return;

    const level = Math.max(1, Math.min(5, Math.round(complexity)));
    
    indicatorEl.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const dot = document.createElement('div');
        dot.className = `complexity-dot w-3 h-3 rounded-full ${i <= level ? `complexity-level-${level}` : 'bg-slate-600'}`;
        indicatorEl.appendChild(dot);
    }

    labelEl.textContent = getComplexityLabel(level);
}

// 获取复杂度标签
function getComplexityLabel(level) {
    const labels = {
        1: '非常简单',
        2: '简单',
        3: '中等',
        4: '复杂',
        5: '非常复杂'
    };
    return labels[level] || '未知';
}

// 显示情感分析
function displaySentiment(sentiment) {
    const sentimentEl = document.getElementById('sentiment-analysis');
    if (!sentimentEl) return;

    const sentimentColors = {
        '积极正面': 'text-green-400',
        '中性客观': 'text-slate-300',
        '关注担忧': 'text-yellow-400',
        '消极负面': 'text-red-400'
    };

    const colorClass = sentimentColors[sentiment] || 'text-slate-300';
    sentimentEl.innerHTML = `<span class="${colorClass}">${sentiment}</span>`;
}

// 显示关键洞察
function displayInsights(insights) {
    const sectionEl = document.getElementById('key-insights-section');
    const listEl = document.getElementById('key-insights');
    
    if (!sectionEl || !listEl) return;

    if (!Array.isArray(insights) || insights.length === 0) {
        sectionEl.classList.add('hidden');
        return;
    }

    listEl.innerHTML = '';
    insights.forEach(insight => {
        const li = document.createElement('li');
        li.className = 'flex items-start';
        li.innerHTML = `
            <svg class="w-4 h-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            <span>${insight}</span>
        `;
        listEl.appendChild(li);
    });
    
    sectionEl.classList.remove('hidden');
}

// 显示建议行动
function displayActions(actions) {
    const sectionEl = document.getElementById('suggested-actions-section');
    const listEl = document.getElementById('suggested-actions');
    
    if (!sectionEl || !listEl) return;

    if (!Array.isArray(actions) || actions.length === 0) {
        sectionEl.classList.add('hidden');
        return;
    }

    listEl.innerHTML = '';
    actions.forEach(action => {
        const li = document.createElement('li');
        li.className = 'flex items-start';
        li.innerHTML = `
            <svg class="w-4 h-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span>${action}</span>
        `;
        listEl.appendChild(li);
    });
    
    sectionEl.classList.remove('hidden');
}

// 更新分析显示状态
function updateAnalysisDisplay() {
    const loadingEl = document.getElementById('analysis-loading');
    const resultsEl = document.getElementById('analysis-results');
    const emptyEl = document.getElementById('analysis-empty');
    
    if (!loadingEl || !resultsEl || !emptyEl) return;

    // 检查是否有分析结果
    const summaryEl = document.getElementById('conversation-summary');
    const hasResults = summaryEl && summaryEl.textContent.trim() !== '暂无总结';

    if (hasResults) {
        loadingEl.classList.add('hidden');
        resultsEl.classList.remove('hidden');
        emptyEl.classList.add('hidden');
    } else {
        loadingEl.classList.add('hidden');
        resultsEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
    }
}


