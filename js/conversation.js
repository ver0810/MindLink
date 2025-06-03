document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    }

    if (typeof mentors === 'undefined') {
        console.error('Mentors data not loaded');
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
             chatMessages.innerHTML = '<p class="text-red-400 text-center p-4">导师数据加载失败，请返回重试。</p>';
        }
        return;
    }

    const conversationMode = sessionStorage.getItem('conversationMode') || '1v1';
    let currentMentorsInfo = []; // Array to hold one or more mentor objects
    let primaryMentorForUI = null; // For avatar in group chat, and suggested questions

    if (conversationMode === '1v1') {
        const mentorId = sessionStorage.getItem('selectedMentor');
        if (!mentorId) {
            alert('未选择导师，将返回导师选择页面。');
            window.location.href = 'dashboard.html'; return;
        }
        const mentor = mentors.find(m => m.id === mentorId);
        if (!mentor) {
            alert('选择的导师信息未找到，将返回导师选择页面。');
            window.location.href = 'dashboard.html'; return;
        }
        currentMentorsInfo.push(mentor);
        primaryMentorForUI = mentor;
    } else { // 1vMany
        const mentorIdsString = sessionStorage.getItem('selectedMentors');
        if (!mentorIdsString) {
            alert('未选择圆桌导师，将返回设置页面。');
            window.location.href = 'conversation-setup.html'; return; // Or dashboard
        }
        try {
            const mentorIds = JSON.parse(mentorIdsString);
            mentorIds.forEach(id => {
                const mentor = mentors.find(m => m.id === id);
                if (mentor) currentMentorsInfo.push(mentor);
            });
            if (currentMentorsInfo.length === 0) {
                alert('圆桌导师信息加载失败。');
                window.location.href = 'conversation-setup.html'; return;
            }
            primaryMentorForUI = currentMentorsInfo[0]; // First selected mentor is primary for UI elements
        } catch (e) {
            console.error("Error parsing selected mentors:", e);
            alert('加载圆桌导师信息时出错。');
            window.location.href = 'conversation-setup.html'; return;
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
});

function updateChatHeader(mentorsInfo, mode) {
    const avatarsDiv = document.getElementById('chat-header-avatars');
    const titleEl = document.getElementById('chat-header-title');
    const subtitleEl = document.getElementById('chat-header-subtitle');

    avatarsDiv.innerHTML = ''; // Clear previous avatars

    if (mode === '1v1' && mentorsInfo.length > 0) {
        const mentor = mentorsInfo[0];
        const img = document.createElement('img');
        img.src = mentor.avatar;
        img.alt = mentor.name;
        img.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-slate-600 shadow-md';
        avatarsDiv.appendChild(img);
        titleEl.textContent = mentor.name;
        subtitleEl.textContent = mentor.title;
    } else if (mode === '1vMany' && mentorsInfo.length > 0) {
        mentorsInfo.slice(0, 3).forEach(mentor => { // Show up to 3 avatars
            const img = document.createElement('img');
            img.src = mentor.avatar;
            img.alt = mentor.name;
            img.title = mentor.name;
            img.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-slate-600 shadow-md';
            avatarsDiv.appendChild(img);
        });
        if (mentorsInfo.length > 3) {
            const moreAvatarsIndicator = document.createElement('div');
            moreAvatarsIndicator.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-slate-300 text-sm font-semibold';
            moreAvatarsIndicator.textContent = `+${mentorsInfo.length - 3}`;
            avatarsDiv.appendChild(moreAvatarsIndicator);
        }
        titleEl.textContent = `圆桌研讨 (${mentorsInfo.length}位导师)`;
        const mentorNames = mentorsInfo.map(m => m.name).join(', ');
        subtitleEl.textContent = `与 ${mentorNames.substring(0, 50)}${mentorNames.length > 50 ? '...' : ''} 交流`;
    }
}


function initializeChat(mentorsInfo, mode, primaryMentor) {
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');

    let greeting = "";
    if (mode === '1v1') {
        greeting = `你好！我是${primaryMentor.name}。很高兴能与你交流，请问有什么我可以帮助你的吗？或者，可以从下面的建议问题开始。`;
    } else {
        const mentorNames = mentorsInfo.map(m => m.name).join('、');
        greeting = `你好！欢迎来到与 ${mentorNames} 的圆桌研讨会。我是本次讨论的主持代表，请提出你的问题，我们将共同为你提供见解。`;
    }
    addMentorMessage(chatMessages, primaryMentor, greeting); // Use primary mentor's avatar for initial greeting

    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        addUserMessage(chatMessages, messageText);
        messageInput.value = '';
        messageInput.style.height = 'auto'; // Reset height

        simulateMentorTyping(chatMessages, primaryMentor); // Use primary mentor's avatar for typing indicator

        setTimeout(() => {
            generateMentorResponse(mentorsInfo, messageText, mode, primaryMentor)
                .then(response => {
                    const typingIndicator = chatMessages.querySelector('.typing-indicator');
                    if (typingIndicator) typingIndicator.remove();
                    addMentorMessage(chatMessages, primaryMentor, response); // Use primary mentor's avatar for response
                })
                .catch(error => {
                    console.error('Error generating response:', error);
                    const typingIndicator = chatMessages.querySelector('.typing-indicator');
                    if (typingIndicator) typingIndicator.remove();
                    addMentorMessage(chatMessages, primaryMentor, "抱歉，我遇到了一些问题。请再试一次。");
                });
        }, 1200 + Math.random() * 800); 
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

function addUserMessage(container, text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'flex justify-end group animate-fade-in-up';
    messageElement.innerHTML = `
        <div class="chat-bubble-user rounded-xl rounded-br-none py-2.5 px-4 max-w-[80%] shadow-md">
            <p class="text-white whitespace-pre-wrap text-sm leading-relaxed">${text}</p>
        </div>
    `;
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

function addMentorMessage(container, mentorToDisplay, text) { // mentorToDisplay is for avatar/name
    const messageElement = document.createElement('div');
    messageElement.className = 'flex group animate-fade-in-up';
    messageElement.innerHTML = `
        <img src="${mentorToDisplay.avatar}" alt="${mentorToDisplay.name}" class="w-10 h-10 rounded-full mr-3 self-start mt-1 object-cover border-2 border-slate-600">
        <div class="chat-bubble-mentor rounded-xl rounded-bl-none py-2.5 px-4 shadow-md max-w-[80%]">
            <p class="text-slate-100 whitespace-pre-wrap text-sm leading-relaxed">${text}</p>
        </div>
    `;
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

function simulateMentorTyping(container, mentorToDisplay) { // mentorToDisplay for avatar
    const typingElement = document.createElement('div');
    typingElement.className = 'flex typing-indicator';
    typingElement.innerHTML = `
        <img src="${mentorToDisplay.avatar}" alt="${mentorToDisplay.name} typing" class="w-10 h-10 rounded-full mr-3 self-start mt-1 object-cover border-2 border-slate-600">
        <div class="bg-slate-700 rounded-xl rounded-bl-none py-3 px-4 flex items-center shadow-md">
            <div class="flex space-x-1.5">
                <div class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
                <div class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
                <div class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay: 0.4s;"></div>
            </div>
        </div>
    `;
    container.appendChild(typingElement);
    container.scrollTop = container.scrollHeight;
}

function populateSuggestedQuestions(primaryMentor) {
    const container = document.getElementById('suggested-questions');
    if (!container || !primaryMentor) return;
    container.innerHTML = '';

    primaryMentor.suggestedQuestions.slice(0, 3).forEach(question => { // Show limited suggestions
        const button = document.createElement('button');
        button.className = 'text-xs bg-slate-700/80 border border-slate-600 rounded-full px-3 py-1.5 text-sky-300 hover:bg-slate-600/80 hover:border-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500';
        button.textContent = question;
        button.addEventListener('click', () => {
            const messageInput = document.getElementById('message-input');
            messageInput.value = question;
            messageInput.style.height = 'auto';
            messageInput.style.height = (messageInput.scrollHeight) + 'px';
            messageInput.focus();
        });
        container.appendChild(button);
    });
}

async function generateMentorResponse(mentorsInfo, userMessage, mode, primaryMentor) {
    // mentorsInfo is an array of mentor objects
    // primaryMentor is one of the mentors (e.g., the first one) used for UI consistency for now
    // mode is '1v1' or '1vMany'
    
    // For this prototype, we'll use simple hard-coded responses
    // In a real application, this would call an AI API
    // The LLM system prompt would change based on 1v1 or 1vMany

    let mentorForResponseLogic = primaryMentor; // In 1v1, mentorsInfo[0] is primaryMentor
    
    if (mode === '1vMany') {
        // For roundtable, the response should ideally synthesize views.
        // For this simplified prototype, we can still use primaryMentor's logic
        // but frame the response as a collective one or make it more generic.
        // Or, pick a random mentor from the group to "speak".
        // Let's try to make a more "group-like" response if keywords match.
        
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

    // Fallback to single mentor logic or more generic responses for 1vMany if no specific group logic hit
    const genericResponses = {
        'buffett': "投资需要耐心和长远眼光。最好的投资是在伟大的企业中购买小部分股权。",
        'lika': "成功的企业家应该有百折不挠的精神。管理现金流胜过追求利润。",
        'ma': "创业需要激情和奉献。找对人，做未来的事。",
        'altman': "构建有价值的产品是核心。思考10年后的发展方向。",
        'musk': "人生应该充满冒险和挑战。从第一性原理思考问题。",
        'zhang': "产品经理应该像艺术家一样打磨产品，追求极致用户体验。",
        'jobs': "活着就是为了改变世界。专注和简单。",
        'sandberg': "向前一步。建立多元化和包容性的团队至关重要。"
    };
    
    // Specific keyword matching for 1v1 or as fallback
    if (userMessage.toLowerCase().includes("融资") || userMessage.toLowerCase().includes("投资")) {
        if (mentorForResponseLogic.id === 'buffett') return "对于融资，我的建议是保持谨慎。过度负债会削弱企业的抗风险能力。";
        if (mentorForResponseLogic.id === 'lika') return "融资是把双刃剑。关键是选择能带来资源和专业知识的投资人。";
        if (mentorForResponseLogic.id === 'ma') return "找对投资人比拿到钱更重要。企业创新和创造价值的能力才是吸引投资的根本。";
        if (mentorForResponseLogic.id === 'altman') return "好公司永远都能融到钱。专注于创造真正的价值和增长。";
    }
     if (userMessage.toLowerCase().includes("ai") || userMessage.toLowerCase().includes("人工智能")) {
        if (mentorForResponseLogic.id === 'altman') return "AI是这个时代最重要的技术浪潮之一。创业者应该积极思考如何将AI能力整合到自己的产品或服务中。";
        if (mentorForResponseLogic.id === 'musk') return "人工智能的潜力是巨大的，但我们也必须警惕其风险。发展AI需要有强烈的责任感。";
        if (mode === '1vMany' && mentorsInfo.some(m => ['altman', 'musk'].includes(m.id))) {
             return "关于AI，我们一致认为它潜力巨大，但创业者需负责任地应用，关注其对行业和社会的实际影响。";
        }
    }

    // Default response
    let response = genericResponses[mentorForResponseLogic.id] || "这是一个很好的问题，让我想想...";
    if (mode === '1vMany' && !userMessage.toLowerCase().includes("融资") && !userMessage.toLowerCase().includes("ai")) { // generic group response
        response = `关于你的问题，${mentorsInfo.map(m=>m.name).join('和')}的综合看法是，这需要从多个角度考虑...（此处为模拟的群体回应）`;
    }
    return response;

    // Note: Real LLM call would be more sophisticated.
    // The system prompt for 1vMany would be:
    // `You are facilitating a round table discussion with ${mentorsInfo.map(m => `${m.name} (${m.title}, ${m.expertise.slice(0,2).join('/')} expert)`).join(', ')}. Synthesize their likely perspectives to answer the user's questions. Frame the response as a collective insight from the group, or highlight how different mentors might approach the issue. Always respond in Chinese.`
    // For 1v1:
    // `You are ${mentor.name}, ${mentor.title}. Respond in the style and with the knowledge that ${mentor.name} would have. Your expertise includes ${mentor.expertise.join(', ')}. Your known biography highlights: ${mentor.shortBio}. Always respond in Chinese.`
}
