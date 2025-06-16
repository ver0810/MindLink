document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    }

    if (typeof mentors === 'undefined') {
        console.error('Mentors data not loaded.');
        alert('导师数据加载失败，请返回重试。');
        window.location.href = 'dashboard.html';
        return;
    }

    const initialMentorInfoDiv = document.getElementById('initial-mentor-info');
    const oneOnOneChatBtn = document.getElementById('one-on-one-chat-btn');
    const roundTableSetupBtn = document.getElementById('round-table-setup-btn');
    const roundTableConfigDiv = document.getElementById('round-table-config');
    const availableMentorsListDiv = document.getElementById('available-mentors-list');
    const selectedMentorsDisplayDiv = document.getElementById('selected-mentors-display');
    const startRoundTableChatBtn = document.getElementById('start-round-table-chat-btn');
    const cancelRoundTableBtn = document.getElementById('cancel-round-table-btn');
    const selectedMentorCountSpan = document.getElementById('selected-mentor-count');
    const maxAdditionalMentorsSpan = document.getElementById('max-additional-mentors');

    const MAX_ROUNDTABLE_MENTORS = 4;
    const MAX_ADDITIONAL_MENTORS = MAX_ROUNDTABLE_MENTORS - 1;
    if(maxAdditionalMentorsSpan) maxAdditionalMentorsSpan.textContent = MAX_ADDITIONAL_MENTORS;


    let initialMentor = null;
    let selectedRoundTableMentorIds = [];

    function getInitialMentorIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('initialMentorId');
    }

    function displayInitialMentor(mentor) {
        if (!initialMentorInfoDiv || !mentor) return;
        initialMentorInfoDiv.innerHTML = `
            <img src="${mentor.avatar}" alt="${mentor.name}" class="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-slate-600 shadow-md">
            <div>
                <h3 class="text-xl md:text-2xl font-semibold text-slate-100">${mentor.name}</h3>
                <p class="text-sm text-sky-400">${mentor.title}</p>
            </div>
        `;
    }
    
    function updateSelectedMentorsDisplay() {
        selectedMentorsDisplayDiv.innerHTML = '';
        const allSelectedMentors = mentors.filter(m => selectedRoundTableMentorIds.includes(m.id));
        
        // Ensure initialMentor is always first if selected
        allSelectedMentors.sort((a, b) => {
            if (a.id === initialMentor.id) return -1;
            if (b.id === initialMentor.id) return 1;
            return 0;
        });

        allSelectedMentors.forEach(mentor => {
            const avatarElement = document.createElement('img');
            avatarElement.src = mentor.avatar;
            avatarElement.alt = mentor.name;
            avatarElement.title = mentor.name;
            avatarElement.className = 'w-10 h-10 rounded-full object-cover border-2 border-sky-500 shadow-md';
            selectedMentorsDisplayDiv.appendChild(avatarElement);
        });
        if (allSelectedMentors.length === 0 && initialMentor) { // Should not happen if initial mentor is always selected
             const avatarElement = document.createElement('img');
            avatarElement.src = initialMentor.avatar;
            avatarElement.alt = initialMentor.name;
            avatarElement.title = initialMentor.name;
            avatarElement.className = 'w-10 h-10 rounded-full object-cover border-2 border-sky-500 shadow-md';
            selectedMentorsDisplayDiv.appendChild(avatarElement);
        }
        
        const count = selectedRoundTableMentorIds.length;
        selectedMentorCountSpan.textContent = count;
        startRoundTableChatBtn.disabled = count < 2 || count > MAX_ROUNDTABLE_MENTORS;
        if(startRoundTableChatBtn.disabled){
             startRoundTableChatBtn.classList.add('opacity-50', 'cursor-not-allowed');
             startRoundTableChatBtn.classList.remove('shadow-glow-sky');
        } else {
            startRoundTableChatBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            startRoundTableChatBtn.classList.add('shadow-glow-sky');
        }
    }


    function populateAvailableMentors() {
        availableMentorsListDiv.innerHTML = '';
        mentors.forEach(mentor => {
            if (mentor.id === initialMentor.id) return; // Skip the initial mentor, already included

            const isSelected = selectedRoundTableMentorIds.includes(mentor.id);
            const canSelectMore = selectedRoundTableMentorIds.length < MAX_ROUNDTABLE_MENTORS || isSelected;
            
            const mentorItem = document.createElement('label');
            mentorItem.className = `flex items-center p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700 ${!canSelectMore && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`;
            mentorItem.innerHTML = `
                <input type="checkbox" class="form-checkbox h-5 w-5 text-sky-500 bg-slate-600 border-slate-500 rounded focus:ring-sky-400 focus:ring-offset-slate-800 mr-4" data-mentor-id="${mentor.id}" ${isSelected ? 'checked' : ''} ${!canSelectMore && !isSelected ? 'disabled' : ''}>
                <img src="${mentor.avatar}" alt="${mentor.name}" class="w-10 h-10 rounded-full object-cover mr-3 border border-slate-600">
                <div>
                    <span class="text-slate-100 font-medium">${mentor.name}</span>
                    <p class="text-xs text-slate-400">${mentor.title}</p>
                </div>
            `;
            
            const checkbox = mentorItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                const mentorId = e.target.dataset.mentorId;
                if (e.target.checked) {
                    if (selectedRoundTableMentorIds.length < MAX_ROUNDTABLE_MENTORS) {
                        selectedRoundTableMentorIds.push(mentorId);
                    } else {
                        e.target.checked = false; // Revert if limit exceeded
                        alert(`最多只能选择 ${MAX_ROUNDTABLE_MENTORS} 位导师（包含首位导师）。`);
                    }
                } else {
                    selectedRoundTableMentorIds = selectedRoundTableMentorIds.filter(id => id !== mentorId);
                }
                updateSelectedMentorsDisplay();
                // Re-evaluate disable state for all checkboxes
                document.querySelectorAll('#available-mentors-list input[type="checkbox"]').forEach(cb => {
                    const isCbSelected = cb.checked;
                    const canStillSelect = selectedRoundTableMentorIds.length < MAX_ROUNDTABLE_MENTORS || isCbSelected;
                    cb.disabled = !canStillSelect && !isCbSelected;
                    cb.closest('label').classList.toggle('opacity-50', !canStillSelect && !isCbSelected);
                    cb.closest('label').classList.toggle('cursor-not-allowed', !canStillSelect && !isCbSelected);

                });
            });

            availableMentorsListDiv.appendChild(mentorItem);
        });
    }


    // Initialization
    const initialMentorIdFromURL = getInitialMentorIdFromURL();
    if (!initialMentorIdFromURL) {
        alert('未指定初始导师，将返回导师选择页面。');
        window.location.href = 'dashboard.html';
        return;
    }

    initialMentor = mentors.find(m => m.id === initialMentorIdFromURL);
    if (!initialMentor) {
        alert('指定的初始导师未找到，将返回导师选择页面。');
        window.location.href = 'dashboard.html';
        return;
    }

    displayInitialMentor(initialMentor);
    selectedRoundTableMentorIds = [initialMentor.id]; // Initial mentor is always selected for round table

    // Event Listeners
    oneOnOneChatBtn.addEventListener('click', () => {
        sessionStorage.setItem('conversationMode', '1v1');
        sessionStorage.setItem('selectedMentor', initialMentor.id);
        sessionStorage.removeItem('selectedMentors'); // Clear roundtable selection
        window.location.href = 'conversation.html';
    });

    roundTableSetupBtn.addEventListener('click', () => {
        roundTableConfigDiv.classList.remove('hidden');
        roundTableSetupBtn.classList.add('hidden'); // Hide the setup button
        oneOnOneChatBtn.classList.add('hidden'); // Hide 1v1 button
        populateAvailableMentors();
        updateSelectedMentorsDisplay();
    });

    cancelRoundTableBtn.addEventListener('click', () => {
        roundTableConfigDiv.classList.add('hidden');
        roundTableSetupBtn.classList.remove('hidden');
        oneOnOneChatBtn.classList.remove('hidden');
        selectedRoundTableMentorIds = [initialMentor.id]; // Reset selection
    });
    
    startRoundTableChatBtn.addEventListener('click', () => {
        if (selectedRoundTableMentorIds.length < 2) {
            alert('圆桌讨论至少需要选择两位导师。');
            return;
        }
        if (selectedRoundTableMentorIds.length > MAX_ROUNDTABLE_MENTORS) {
            alert(`圆桌讨论最多只能选择 ${MAX_ROUNDTABLE_MENTORS} 位导师。`);
            return;
        }
        sessionStorage.setItem('conversationMode', '1vMany');
        sessionStorage.setItem('selectedMentors', JSON.stringify(selectedRoundTableMentorIds));
        sessionStorage.removeItem('selectedMentor'); // Clear 1v1 selection
        window.location.href = 'conversation.html';
    });

});
