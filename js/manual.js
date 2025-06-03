document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    }

    if (typeof questionCategories === 'undefined' || typeof mentors === 'undefined') {
        console.error('Data (questions or mentors) not loaded');
        const categoryCardsContainer = document.getElementById('category-cards-container');
        if (categoryCardsContainer) {
             categoryCardsContainer.innerHTML = '<p class="text-red-400 text-center col-span-full">问题数据加载失败，请稍后再试。</p>';
        }
        return;
    }
    
    const categoryView = document.getElementById('category-view');
    const categoryCardsContainer = document.getElementById('category-cards-container');
    const questionListSection = document.getElementById('question-list-section');
    const questionList = document.getElementById('question-list');
    const selectedCategoryTitle = document.getElementById('selected-category-title');
    const backToCategoriesBtn = document.getElementById('back-to-categories');

    const categoryIcons = {
        strategy: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`,
        product: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>`,
        team: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
        finance: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
        growth: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>`,
        operations: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>`,
        leadership: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
        innovation: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>`,
    };


    function renderCategoryCards(categoriesToRender = questionCategories) {
        categoryCardsContainer.innerHTML = ''; // Clear previous cards
        categoriesToRender.forEach(category => {
            const card = document.createElement('div');
            card.className = 'category-card cool-card cool-card-hover p-6 text-center cursor-pointer';
            card.setAttribute('data-category', category.id);
            card.innerHTML = `
                <div class="w-16 h-16 rounded-xl flex items-center justify-center mb-5 mx-auto bg-slate-700/50">
                    ${categoryIcons[category.id] || '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'}
                </div>
                <h3 class="text-lg font-semibold text-slate-100 mb-2">${category.name}</h3>
                <p class="text-xs text-slate-400 line-clamp-2">${category.questions.map(q => q.title.substring(0,15)).join(', ')}...</p>
            `;
            card.addEventListener('click', () => showQuestionsByCategory(category.id));
            categoryCardsContainer.appendChild(card);
        });
    }
    renderCategoryCards(); // Initial render


    if (backToCategoriesBtn) {
        backToCategoriesBtn.addEventListener('click', () => {
            questionListSection.classList.add('hidden');
            categoryView.classList.remove('hidden');
            if (searchInput) searchInput.value = ''; // Clear search on back
            renderCategoryCards(); // Re-render all category cards
        });
    }

    function showQuestionsByCategory(categoryId, searchTerm = null) {
        const category = questionCategories.find(cat => cat.id === categoryId);
        if (!category) {
            console.error('Category not found');
            return;
        }

        selectedCategoryTitle.textContent = searchTerm ? `搜索 "${searchTerm}" 的结果` : category.name;
        questionList.innerHTML = '';

        const questionsToDisplay = searchTerm 
            ? category.questions.filter(q => 
                q.title.toLowerCase().includes(searchTerm) || 
                q.shortDescription.toLowerCase().includes(searchTerm) ||
                q.tags.some(tag => tag.toLowerCase().includes(searchTerm))
              )
            : category.questions;

        if (questionsToDisplay.length === 0) {
            questionList.innerHTML = `<p class="text-slate-400 text-center col-span-full py-8">在此分类下没有找到匹配的问题。</p>`;
        } else {
            questionsToDisplay.forEach(question => {
                const questionCard = document.createElement('div');
                questionCard.className = 'cool-card cool-card-hover p-5 md:p-6 cursor-pointer';
                questionCard.setAttribute('data-question-id', question.id);
                questionCard.innerHTML = `
                    <h4 class="font-semibold text-lg text-slate-100 mb-2">${question.title}</h4>
                    <p class="text-slate-400 text-sm mb-4 line-clamp-2">${question.shortDescription}</p>
                    <div class="flex justify-between items-center">
                        <div class="flex flex-wrap gap-2">
                            ${question.tags.map(tag =>
                                `<span class="inline-block bg-slate-700 text-sky-300 text-xs px-2.5 py-1 rounded-full">${tag}</span>`
                            ).join('')}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                `;
                questionCard.addEventListener('click', () => openQuestionModal(question));
                questionList.appendChild(questionCard);
            });
        }
        categoryView.classList.add('hidden');
        questionListSection.classList.remove('hidden');
    }

    const questionModal = document.getElementById('question-modal');
    const closeQuestionModalBtn = document.getElementById('close-question-modal');
    const useQuestionBtn = document.getElementById('use-question');

    if (closeQuestionModalBtn) {
        closeQuestionModalBtn.addEventListener('click', () => questionModal.classList.replace('flex','hidden'));
    }
    
    questionModal.addEventListener('click', function(event) {
        if (event.target === questionModal) { // Clicked on backdrop
            questionModal.classList.replace('flex','hidden');
        }
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && questionModal.classList.contains('flex')) {
            questionModal.classList.replace('flex','hidden');
        }
    });

    function openQuestionModal(question) {
        document.getElementById('modal-question-title').textContent = question.title;
        document.getElementById('modal-question-description').textContent = question.description;
        document.getElementById('modal-question-template').textContent = question.template;
        document.getElementById('modal-question-why').textContent = question.why;

        const mentorsContainer = document.getElementById('modal-recommended-mentors');
        mentorsContainer.innerHTML = '';
        const recommendedMentorsList = mentors.filter(mentor => question.recommendedMentors.includes(mentor.id));
        
        if (recommendedMentorsList.length > 0) {
            recommendedMentorsList.forEach(mentor => {
                const mentorTag = document.createElement('span');
                mentorTag.className = 'inline-flex items-center bg-slate-700 text-sky-300 text-sm px-3 py-1.5 rounded-full shadow';
                mentorTag.innerHTML = `
                    <img src="${mentor.avatar}" alt="${mentor.name}" class="w-5 h-5 rounded-full mr-2 object-cover border border-slate-500">
                    ${mentor.name}
                `;
                mentorsContainer.appendChild(mentorTag);
            });
        } else {
            mentorsContainer.innerHTML = '<p class="text-slate-400 text-sm">暂无特定导师推荐，此问题适用于多数导师。</p>';
        }


        if (useQuestionBtn) {
            useQuestionBtn.setAttribute('data-question-template', question.template);
        }
        questionModal.classList.replace('hidden','flex');
        // Scroll modal to top
        const modalContent = questionModal.querySelector('.modal-scrollable > div:first-child');
        if (modalContent) modalContent.scrollTop = 0;

    }

    if (useQuestionBtn) {
        useQuestionBtn.addEventListener('click', function() {
            const questionTemplate = this.getAttribute('data-question-template');
            sessionStorage.setItem('selectedQuestion', questionTemplate);
            const selectedMentorId = sessionStorage.getItem('selectedMentor');
            if (selectedMentorId) {
                window.location.href = `conversation.html`;
            } else {
                // If no mentor selected, redirect to dashboard. User can pick a mentor there.
                // Optionally, could store the question and redirect to convo page after mentor selection.
                alert("请先在“智慧导师”页面选择一位导师。");
                window.location.href = 'dashboard.html';
            }
        });
    }

    const searchInput = document.getElementById('search-questions');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            if (searchTerm === '') {
                questionListSection.classList.add('hidden');
                categoryView.classList.remove('hidden');
                renderCategoryCards(); // Show all categories again
                return;
            }

            // Global search across all questions and categories
            let matchedQuestions = [];
            let uniqueCategoryIds = new Set();

            questionCategories.forEach(category => {
                category.questions.forEach(question => {
                    if (
                        question.title.toLowerCase().includes(searchTerm) ||
                        question.shortDescription.toLowerCase().includes(searchTerm) ||
                        question.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                        category.name.toLowerCase().includes(searchTerm) // Search in category name as well
                    ) {
                        matchedQuestions.push({ ...question, categoryName: category.name, categoryId: category.id });
                        uniqueCategoryIds.add(category.id);
                    }
                });
            });
            
            if (matchedQuestions.length > 0) {
                selectedCategoryTitle.textContent = `搜索 "${searchTerm}" 的结果 (${matchedQuestions.length})`;
                questionList.innerHTML = ''; // Clear previous list
                matchedQuestions.forEach(question => {
                     const questionCard = document.createElement('div');
                    questionCard.className = 'cool-card cool-card-hover p-5 md:p-6 cursor-pointer';
                    questionCard.setAttribute('data-question-id', question.id);
                    questionCard.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-semibold text-lg text-slate-100">${question.title}</h4>
                            <span class="text-xs text-sky-400 bg-slate-700 px-2 py-1 rounded-full">${question.categoryName}</span>
                        </div>
                        <p class="text-slate-400 text-sm mb-4 line-clamp-2">${question.shortDescription}</p>
                        <div class="flex justify-between items-center">
                            <div class="flex flex-wrap gap-2">
                                ${question.tags.map(tag =>
                                    `<span class="inline-block bg-slate-700 text-sky-300 text-xs px-2.5 py-1 rounded-full">${tag}</span>`
                                ).join('')}
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </div>
                    `;
                    questionCard.addEventListener('click', () => openQuestionModal(question));
                    questionList.appendChild(questionCard);
                });
                categoryView.classList.add('hidden');
                questionListSection.classList.remove('hidden');
            } else {
                 selectedCategoryTitle.textContent = `搜索 "${searchTerm}" 的结果`;
                 questionList.innerHTML = `<p class="text-slate-400 text-center col-span-full py-8">未能找到与 "${searchTerm}" 相关的问题。</p>`;
                 categoryView.classList.add('hidden');
                 questionListSection.classList.remove('hidden');
            }
        });
    }
});

