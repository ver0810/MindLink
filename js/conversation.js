// FounderMind Platform - 简化的对话系统
document.addEventListener('DOMContentLoaded', function() {
    // 初始化移动端菜单
    initMobileMenu();
    
    // 检查导师数据
    if (!checkMentorsData()) return;
    
    // 初始化对话系统
    initConversationSystem();
});

// 初始化移动端菜单
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
    populateSuggestedQuestions(primaryMentorForUI); // Use primary mentor's questions

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
    const closeHowToAskModalBtn = document.getElementById('close-how-to-ask-modal');
    const gotItHowToAskModalBtn = document.getElementById('got-it-how-to-ask-modal');

    if (howToAskBtn && howToAskModal) {
        howToAskBtn.addEventListener('click', () => {
            howToAskModal.classList.replace('hidden', 'flex');
            const modalContent = howToAskModal.querySelector('.modal-scrollable > div:first-child');
             if (modalContent) modalContent.scrollTop = 0;
        });
    }
    if (closeHowToAskModalBtn && howToAskModal) {
        closeHowToAskModalBtn.addEventListener('click', () => howToAskModal.classList.replace('flex', 'hidden'));
    }
    if (gotItHowToAskModalBtn && howToAskModal) {
        gotItHowToAskModalBtn.addEventListener('click', () => howToAskModal.classList.replace('flex', 'hidden'));
    }
     if (howToAskModal) {
        howToAskModal.addEventListener('click', function(event) {
            if (event.target === howToAskModal) { 
                howToAskModal.classList.replace('flex', 'hidden');
            }
        });
    }
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && howToAskModal && howToAskModal.classList.contains('flex')) {
            howToAskModal.classList.replace('flex', 'hidden');
        }
    });
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

    // 初始化对话历史
    initializeConversationHistory(mentorsInfo, mode);

    let greeting = "";
    if (mode === '1v1') {
        greeting = `你好！我是${primaryMentor.name}。很高兴能与你交流，请问有什么我可以帮助你的吗？或者，可以从下面的建议问题开始。`;
    } else {
        const mentorNames = mentorsInfo.map(m => m.name).join('、');
        greeting = `你好！欢迎来到与 ${mentorNames} 的圆桌研讨会。我是本次讨论的主持代表，请提出你的问题，我们将共同为你提供见解。`;
    }
    
    // 显示初始问候语
    setTimeout(async () => {
        await addMentorMessageStreaming(chatMessages, primaryMentor, greeting);
    }, 500);

    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        addUserMessage(chatMessages, messageText);
        messageInput.value = '';
        messageInput.style.height = 'auto'; // Reset height

        // 添加用户消息到对话历史
        addToConversationHistory('user', messageText);

        simulateMentorTyping(chatMessages, primaryMentor);

        try {
            const response = await generateMentorResponseWithAPI(mentorsInfo, messageText, mode, primaryMentor);
            const typingIndicator = chatMessages.querySelector('.typing-indicator');
            if (typingIndicator) typingIndicator.remove();
            
            // 使用流式输出显示回复
            await addMentorMessageStreaming(chatMessages, primaryMentor, response);
            // 添加助手回复到对话历史
            addToConversationHistory('assistant', response);
            
        } catch (error) {
            console.error('Error generating response:', error);
            const typingIndicator = chatMessages.querySelector('.typing-indicator');
            if (typingIndicator) typingIndicator.remove();
            
            // 显示错误通知
            UIComponents.showNotification('API调用失败，使用预设回复', 'warning');
            
            // 如果API调用失败，回退到预设回复
            const fallbackResponse = await generateMentorResponseFallback(mentorsInfo, messageText, mode, primaryMentor);
            await addMentorMessageStreaming(chatMessages, primaryMentor, fallbackResponse);
            addToConversationHistory('assistant', fallbackResponse);
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
function addToConversationHistory(role, content) {
    conversationHistory.push({
        role: role,
        content: content
    });
    
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

// 回退方案：使用预设回复
async function generateMentorResponseFallback(mentorsInfo, userMessage, mode, primaryMentor) {
    // 这里使用原有的逻辑作为回退方案
    let mentorForResponseLogic = primaryMentor;
    
    if (mode === '1vMany') {
        if (userMessage.toLowerCase().includes("融资") || userMessage.toLowerCase().includes("投资")) {
            let combinedAdvice = "关于融资，我们圆桌的导师们普遍认为：\n";
            let specificPoints = [];
            mentorsInfo.forEach(m => {
                if (m.id === 'buffett') specificPoints.push("巴菲特强调稳健财务和长期价值，不应急于稀释股权。");
                if (m.id === 'lika') specificPoints.push("李嘉诚会提醒注意现金流管理，并选择能带来资源的投资者。");
                if (m.id === 'ma') specificPoints.push("马云可能关注商业模式的创新性和团队执行力能否打动投资人。");
                if (m.id === 'altman') specificPoints.push("Sam Altman会鼓励思考技术壁垒和产品是否解决了真实且巨大的市场需求。");
            });
            if (specificPoints.length > 0) {
                combinedAdvice += specificPoints.join("\n") + "\n总的来说，清晰的商业计划、强大的团队和对市场的深刻理解是关键。";
                return combinedAdvice;
            }
        }
         if (userMessage.toLowerCase().includes("团队") || userMessage.toLowerCase().includes("招聘")) {
             return `关于团队建设，${mentorsInfo.map(m=>m.name).join('、')}等导师都强调了其核心重要性。普遍的观点是，需要吸引价值观一致、能力互补的人才，并创造一个能激发他们潜能的环境。早期团队尤其关键，因为他们将塑造公司文化。`;
        }
    }

    const genericResponses = {
        'buffett': "投资需要耐心和长远眼光。最好的投资是在伟大的企业中购买小部分股权。基于您刚才的问题，我建议您仔细考虑风险与回报的平衡。",
        'lika': "成功的企业家应该有百折不挠的精神。管理现金流胜过追求利润。根据我们的对话，我认为您需要更关注基础建设。",
        'ma': "创业需要激情和奉献。找对人，做未来的事。从您的问题来看，我觉得您应该更多地思考用户价值。",
        'altman': "构建有价值的产品是核心。思考10年后的发展方向。基于我们的讨论，建议您专注于技术创新和用户体验。",
        'musk': "人生应该充满冒险和挑战。从第一性原理思考问题。让我们深入分析一下您刚才提到的场景。",
        'zhang': "产品经理应该像艺术家一样打磨产品，追求极致用户体验。结合您前面的问题，我认为细节决定成败。",
        'jobs': "活着就是为了改变世界。专注和简单。回到您刚才的问题，我想说完美来自于无数次的迭代。",
        'sandberg': "向前一步。建立多元化和包容性的团队至关重要。基于我们之前的交流，我建议您更多地关注团队协作。"
    };
    
    // 特定关键词匹配
    if (userMessage.toLowerCase().includes("融资") || userMessage.toLowerCase().includes("投资")) {
        if (mentorForResponseLogic.id === 'buffett') return "对于融资，结合我们之前的讨论，我的建议是保持谨慎。过度负债会削弱企业的抗风险能力。您需要确保每一笔资金都能创造价值。";
        if (mentorForResponseLogic.id === 'lika') return "融资是把双刃剑。从您刚才的问题可以看出，关键是选择能带来资源和专业知识的投资人，而不仅仅是资金。";
        if (mentorForResponseLogic.id === 'ma') return "找对投资人比拿到钱更重要。基于我们的对话，企业创新和创造价值的能力才是吸引投资的根本。";
        if (mentorForResponseLogic.id === 'altman') return "好公司永远都能融到钱。从您的问题来看，专注于创造真正的价值和增长比融资本身更重要。";
    }
     if (userMessage.toLowerCase().includes("ai") || userMessage.toLowerCase().includes("人工智能")) {
        if (mentorForResponseLogic.id === 'altman') return "AI是这个时代最重要的技术浪潮之一。结合您前面的问题，创业者应该积极思考如何将AI能力整合到自己的产品或服务中。";
        if (mentorForResponseLogic.id === 'musk') return "人工智能的潜力是巨大的，但我们也必须警惕其风险。从我们的对话来看，发展AI需要有强烈的责任感。";
        if (mode === '1vMany' && mentorsInfo.some(m => ['altman', 'musk'].includes(m.id))) {
             return "关于AI，基于我们之前的讨论，我们一致认为它潜力巨大，但创业者需负责任地应用，关注其对行业和社会的实际影响。";
        }
    }

    let response = genericResponses[mentorForResponseLogic.id] || "这是一个很好的问题，结合我们之前的交流，让我深入思考一下...";
    if (mode === '1vMany' && !userMessage.toLowerCase().includes("融资") && !userMessage.toLowerCase().includes("ai")) {
        response = `关于你的问题，结合我们之前的讨论，${mentorsInfo.map(m=>m.name).join('和')}的综合看法是，这需要从多个角度考虑，尤其要注意您刚才提到的几个要点。`;
    }
    return response;
}

function addUserMessage(container, text) {
    const messageElement = UIComponents.createChatBubble(text, true);
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
