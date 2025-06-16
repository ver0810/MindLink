document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    if (typeof mentors === 'undefined') {
        console.error('Mentors data not loaded');
        const allMentorsContainer = document.getElementById('all-mentors');
        if (allMentorsContainer) {
            allMentorsContainer.innerHTML = '<p class="text-red-400 text-center col-span-full">导师数据加载失败，请稍后再试。</p>';
        }
        return;
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

    populateMentors();

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


    function openMentorModal(mentor) {
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

    }

    if (startConversationBtn) {
        startConversationBtn.addEventListener('click', function() {
            const mentorId = this.getAttribute('data-mentor-id');
            // Navigate to conversation setup page with initial mentor ID
            window.location.href = `conversation-setup.html?initialMentorId=${mentorId}`;
        });
    }

    const searchInput = document.querySelector('input[placeholder="搜索导师或领域..."]');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            populateMentors(this.value);
        });
    }
});

