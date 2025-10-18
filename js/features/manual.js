document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", () =>
      mobileMenu.classList.toggle("hidden")
    );
  }

  if (
    typeof questionCategories === "undefined" ||
    typeof mentors === "undefined"
  ) {
    console.error("Data (questions or mentors) not loaded");
    const categoryCardsContainer = document.getElementById(
      "category-cards-container"
    );
    if (categoryCardsContainer) {
      categoryCardsContainer.innerHTML =
        '<p class="text-red-400 text-center col-span-full">问题数据加载失败，请稍后再试。</p>';
    }
    return;
  }

  const categoryView = document.getElementById("category-view");
  const categoryCardsContainer = document.getElementById(
    "category-cards-container"
  );
  const questionListSection = document.getElementById("question-list-section");
  const questionList = document.getElementById("question-list");
  const selectedCategoryTitle = document.getElementById(
    "selected-category-title"
  );
  const backToCategoriesBtn = document.getElementById("back-to-categories");

  const categoryIcons = {
    "course-review": `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`,
    "exam-sprint": `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`,
    "cross-discipline": `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>`,
    "cognitive-restructuring": `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>`,
    "habit-building": `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>`,
    "project-practice": `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>`,
    "learning-path": `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>`,
    "skill-test": `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  };

  function renderCategoryCards(categoriesToRender = questionCategories) {
    categoryCardsContainer.innerHTML = ""; // Clear previous cards
    categoriesToRender.forEach((category) => {
      const card = document.createElement("div");
      card.className =
        "category-card cool-card cool-card-hover p-6 text-center cursor-pointer";
      card.setAttribute("data-category", category.id);
      card.innerHTML = `
                <div class="w-16 h-16 rounded-xl flex items-center justify-center mb-5 mx-auto bg-slate-700/50">
                    ${
                      categoryIcons[category.id] ||
                      '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
                    }
                </div>
                <h3 class="text-lg font-semibold text-slate-100 mb-2">${
                  category.name
                }</h3>
                <p class="text-xs text-slate-400 line-clamp-2">${category.recommendedQuestions
                  .map((q) => q.title.substring(0, 15))
                  .join(", ")}...</p>
            `;
      card.addEventListener("click", () =>
        showQuestionsByCategory(category.id)
      );
      categoryCardsContainer.appendChild(card);
    });
  }
  renderCategoryCards(); // Initial render

  if (backToCategoriesBtn) {
    backToCategoriesBtn.addEventListener("click", () => {
      questionListSection.classList.add("hidden");
      categoryView.classList.remove("hidden");
      if (searchInput) searchInput.value = ""; // Clear search on back
      renderCategoryCards(); // Re-render all category cards
    });
  }

  function showQuestionsByCategory(categoryId, searchTerm = null) {
    const category = questionCategories.find((cat) => cat.id === categoryId);
    if (!category) {
      console.error("Category not found");
      return;
    }

    selectedCategoryTitle.textContent = searchTerm
      ? `搜索 "${searchTerm}" 的结果`
      : category.name;
    questionList.innerHTML = "";

    const questionsToDisplay = searchTerm
      ? category.recommendedQuestions.filter(
          (q) =>
            q.title.toLowerCase().includes(searchTerm) ||
            q.shortDescription.toLowerCase().includes(searchTerm) ||
            (q.tags &&
              q.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
        )
      : category.recommendedQuestions;

    if (questionsToDisplay.length === 0) {
      questionList.innerHTML = `<p class="text-slate-400 text-center col-span-full py-8">在此分类下没有找到匹配的问题。</p>`;
    } else {
      questionsToDisplay.forEach((question) => {
        const questionCard = document.createElement("div");
        questionCard.className =
          "cool-card cool-card-hover p-5 md:p-6 cursor-pointer";
        questionCard.setAttribute("data-question-id", question.id);
        questionCard.innerHTML = `
                    <h4 class="font-semibold text-lg text-slate-100 mb-2">${
                      question.title
                    }</h4>
                    <p class="text-slate-400 text-sm mb-4 line-clamp-2">${
                      question.shortDescription
                    }</p>
                    <div class="flex justify-between items-center">
                        <div class="flex flex-wrap gap-2">
                            ${(question.tags || [])
                              .map(
                                (tag) =>
                                  `<span class="inline-block bg-slate-700 text-sky-300 text-xs px-2.5 py-1 rounded-full">${tag}</span>`
                              )
                              .join("")}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                `;
        questionCard.addEventListener("click", () =>
          openQuestionModal(question)
        );
        questionList.appendChild(questionCard);
      });
    }
    categoryView.classList.add("hidden");
    questionListSection.classList.remove("hidden");
  }

  const questionModal = document.getElementById("question-modal");
  const closeQuestionModalBtn = document.getElementById("close-question-modal");
  const useQuestionBtn = document.getElementById("use-question");

  if (closeQuestionModalBtn) {
    closeQuestionModalBtn.addEventListener("click", () =>
      questionModal.classList.replace("flex", "hidden")
    );
  }

  questionModal.addEventListener("click", function (event) {
    if (event.target === questionModal) {
      // Clicked on backdrop
      questionModal.classList.replace("flex", "hidden");
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && questionModal.classList.contains("flex")) {
      questionModal.classList.replace("flex", "hidden");
    }
  });

  let selectedMentorsForQuestion = [];
  let selectedMentorForQuestion = null; // 当前选中的单个导师
  let conversationMode = "single"; // 'single' or 'multi'

  function openQuestionModal(question) {
    document.getElementById("modal-question-title").textContent =
      question.title;
    document.getElementById("modal-question-description").textContent =
      question.description;
    document.getElementById("modal-question-template").textContent =
      question.template;
    document.getElementById("modal-question-why").textContent = question.why;

    // Reset selected mentors
    selectedMentorsForQuestion = [];
    selectedMentorForQuestion = null;
    conversationMode = "single";

    // Reset radio buttons
    document.querySelector(
      'input[name="conversation-mode"][value="single"]'
    ).checked = true;
    document.querySelector(
      'input[name="conversation-mode"][value="multi"]'
    ).checked = false;
    document.getElementById("multi-mentor-info").classList.add("hidden");

    updateUseQuestionButton();

    // Add conversation mode change listeners
    const modeRadios = document.querySelectorAll(
      'input[name="conversation-mode"]'
    );
    modeRadios.forEach((radio) => {
      radio.addEventListener("change", function () {
        conversationMode = this.value;
        const multiMentorInfo = document.getElementById("multi-mentor-info");
        if (conversationMode === "multi") {
          multiMentorInfo.classList.remove("hidden");
        } else {
          multiMentorInfo.classList.add("hidden");
          // 如果切换到单选模式，只保留第一个选中的导师
          if (selectedMentorsForQuestion.length > 1) {
            selectedMentorsForQuestion = selectedMentorsForQuestion.slice(0, 1);
            selectedMentorForQuestion = selectedMentorsForQuestion[0] || null;
            updateMentorSelection();
            updateUseQuestionButton();
          }
        }
      });
    });

    // Show all mentors for selection
    const allMentorsContainer = document.getElementById("modal-all-mentors");
    allMentorsContainer.innerHTML = "";
    mentors.forEach((mentor) => {
      const mentorCard = document.createElement("div");
      mentorCard.className =
        "mentor-card group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-sky-500/10 hover:border-sky-500/30 hover:-translate-y-1";
      mentorCard.setAttribute("data-mentor-id", mentor.id);

      const isRecommended = question.recommendedMentors.includes(mentor.id);
      mentorCard.innerHTML = `
                <div class="flex items-start space-x-4">
                    <div class="relative">
                        <div class="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-600/50 group-hover:border-sky-400/50 transition-colors duration-300">
                            <img src="${mentor.avatar}" alt="${
        mentor.name
      }" class="w-full h-full object-cover">
                        </div>
                        ${
                          isRecommended
                            ? '<div class="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"><span class="text-xs text-white font-bold">★</span></div>'
                            : ""
                        }
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between mb-2">
                            <h5 class="font-bold text-slate-100 text-base leading-tight">${
                              mentor.name
                            }</h5>
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <svg class="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                </svg>
                            </div>
                        </div>
                        <p class="text-sm text-slate-400 mb-3 leading-relaxed">${
                          mentor.title
                        }</p>
                        <div class="flex flex-wrap gap-2">
                            ${mentor.expertise
                              .slice(0, 3)
                              .map(
                                (skill) =>
                                  `<span class="inline-block text-xs bg-gradient-to-r from-sky-500/20 to-purple-500/20 text-sky-300 px-2 py-1 rounded-lg border border-sky-500/20 backdrop-blur-sm">${skill}</span>`
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/0 to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            `;

      mentorCard.addEventListener("click", () => {
        if (conversationMode === "single") {
          selectMentor(mentor, mentorCard);
        } else {
          toggleMentorSelection(mentor, mentorCard);
        }
      });
      allMentorsContainer.appendChild(mentorCard);
    });

    if (useQuestionBtn) {
      useQuestionBtn.setAttribute("data-question-template", question.template);
    }
    questionModal.classList.replace("hidden", "flex");
    // Scroll modal to top
    const modalContent = questionModal.querySelector(
      ".modal-scrollable > div:first-child"
    );
    if (modalContent) modalContent.scrollTop = 0;
  }

  function selectMentor(mentor, mentorCard) {
    // Remove previous selection
    document.querySelectorAll(".mentor-card").forEach((card) => {
      card.classList.remove("ring-2", "ring-sky-400", "bg-gradient-to-br");
      card.classList.add("border-slate-700/50");
      // Remove selected indicator
      const indicator = card.querySelector(".selected-indicator");
      if (indicator) indicator.remove();
    });

    // Add selection to current card
    mentorCard.classList.remove("border-slate-700/50");
    mentorCard.classList.add(
      "ring-2",
      "ring-sky-400",
      "bg-gradient-to-br",
      "from-sky-500/10",
      "to-purple-500/5"
    );

    // Add selected indicator
    const indicator = document.createElement("div");
    indicator.className =
      "selected-indicator absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-sky-400 to-sky-500 rounded-full flex items-center justify-center shadow-lg";
    indicator.innerHTML =
      '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
    mentorCard.appendChild(indicator);

    selectedMentorForQuestion = mentor;
    selectedMentorsForQuestion = [mentor];
    updateUseQuestionButton();
  }

  function toggleMentorSelection(mentor, mentorCard) {
    const mentorIndex = selectedMentorsForQuestion.findIndex(
      (m) => m.id === mentor.id
    );

    if (mentorIndex > -1) {
      // Remove mentor from selection
      selectedMentorsForQuestion.splice(mentorIndex, 1);
      mentorCard.classList.remove(
        "ring-2",
        "ring-sky-400",
        "bg-gradient-to-br",
        "from-sky-500/10",
        "to-purple-500/5"
      );
      mentorCard.classList.add("border-slate-700/50");
      const indicator = mentorCard.querySelector(".selected-indicator");
      if (indicator) indicator.remove();
    } else {
      // Add mentor to selection
      selectedMentorsForQuestion.push(mentor);
      mentorCard.classList.remove("border-slate-700/50");
      mentorCard.classList.add(
        "ring-2",
        "ring-sky-400",
        "bg-gradient-to-br",
        "from-sky-500/10",
        "to-purple-500/5"
      );

      // Add selected indicator
      const indicator = document.createElement("div");
      indicator.className =
        "selected-indicator absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-sky-400 to-sky-500 rounded-full flex items-center justify-center shadow-lg";
      indicator.innerHTML =
        '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
      mentorCard.appendChild(indicator);
    }

    // 更新单导师选择（用于兼容单选模式）
    selectedMentorForQuestion = selectedMentorsForQuestion[0] || null;
    updateUseQuestionButton();
  }

  function updateMentorSelection() {
    // 根据当前选中的导师更新UI显示
    document.querySelectorAll(".mentor-card").forEach((card) => {
      const mentorId = card.getAttribute("data-mentor-id");
      const isSelected = selectedMentorsForQuestion.some(
        (m) => m.id === mentorId
      );

      if (isSelected) {
        card.classList.remove("border-slate-700/50");
        card.classList.add(
          "ring-2",
          "ring-sky-400",
          "bg-gradient-to-br",
          "from-sky-500/10",
          "to-purple-500/5"
        );

        if (!card.querySelector(".selected-indicator")) {
          const indicator = document.createElement("div");
          indicator.className =
            "selected-indicator absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-sky-400 to-sky-500 rounded-full flex items-center justify-center shadow-lg";
          indicator.innerHTML =
            '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
          card.appendChild(indicator);
        }
      } else {
        card.classList.remove(
          "ring-2",
          "ring-sky-400",
          "bg-gradient-to-br",
          "from-sky-500/10",
          "to-purple-500/5"
        );
        card.classList.add("border-slate-700/50");
        const indicator = card.querySelector(".selected-indicator");
        if (indicator) indicator.remove();
      }
    });
  }

  function updateUseQuestionButton() {
    const useBtn = document.getElementById("use-question");
    const infoContainer = document.getElementById("selected-mentor-info");

    if (conversationMode === "single") {
      // 单导师模式
      if (selectedMentorForQuestion) {
        useBtn.disabled = false;
        infoContainer.innerHTML = `
                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-emerald-400 font-medium">已选择：${selectedMentorForQuestion.name}</span>
                `;
        infoContainer.classList.remove("text-slate-400");
        infoContainer.classList.add("text-emerald-400");
      } else {
        useBtn.disabled = true;
        infoContainer.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>请先选择一位导师</span>
                `;
        infoContainer.classList.remove("text-emerald-400");
        infoContainer.classList.add("text-slate-400");
      }
    } else {
      // 多导师模式
      if (selectedMentorsForQuestion.length > 0) {
        useBtn.disabled = false;
        infoContainer.innerHTML = `
                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-emerald-400 font-medium">已选择：${selectedMentorsForQuestion
                      .map((m) => m.name)
                      .join("、")} (${
          selectedMentorsForQuestion.length
        }位导师)</span>
                `;
        infoContainer.classList.remove("text-slate-400");
        infoContainer.classList.add("text-emerald-400");
      } else {
        useBtn.disabled = true;
        infoContainer.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span>请选择至少一位导师</span>
                `;
        infoContainer.classList.remove("text-emerald-400");
        infoContainer.classList.add("text-slate-400");
      }
    }
  }

  if (useQuestionBtn) {
    useQuestionBtn.addEventListener("click", function () {
      if (conversationMode === "single") {
        if (!selectedMentorForQuestion) {
          alert("请先选择一位导师！");
          return;
        }

        const questionTemplate = this.getAttribute("data-question-template");
        sessionStorage.setItem("selectedQuestion", questionTemplate);
        sessionStorage.setItem("selectedMentor", selectedMentorForQuestion.id);
        sessionStorage.setItem("conversationMode", "1v1");

        // Close modal and redirect to conversation
        questionModal.classList.replace("flex", "hidden");
        window.location.href = `conversation.html`;
      } else {
        if (selectedMentorsForQuestion.length === 0) {
          alert("请先选择至少一位导师！");
          return;
        }

        const questionTemplate = this.getAttribute("data-question-template");
        sessionStorage.setItem("selectedQuestion", questionTemplate);
        sessionStorage.setItem(
          "selectedMentors",
          JSON.stringify(selectedMentorsForQuestion.map((m) => m.id))
        );
        sessionStorage.setItem("conversationMode", "1vMany");

        // Close modal and redirect to conversation
        questionModal.classList.replace("flex", "hidden");
        window.location.href = `conversation.html`;
      }
    });
  }

  const searchInput = document.getElementById("search-questions");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase().trim();
      if (searchTerm === "") {
        questionListSection.classList.add("hidden");
        categoryView.classList.remove("hidden");
        renderCategoryCards(); // Show all categories again
        return;
      }

      // Global search across all questions and categories
      let matchedQuestions = [];
      let uniqueCategoryIds = new Set();

      questionCategories.forEach((category) => {
        category.recommendedQuestions.forEach((question) => {
          if (
            question.title.toLowerCase().includes(searchTerm) ||
            question.shortDescription.toLowerCase().includes(searchTerm) ||
            (question.tags &&
              question.tags.some((tag) =>
                tag.toLowerCase().includes(searchTerm)
              )) ||
            category.name.toLowerCase().includes(searchTerm) // Search in category name as well
          ) {
            matchedQuestions.push({
              ...question,
              categoryName: category.name,
              categoryId: category.id,
            });
            uniqueCategoryIds.add(category.id);
          }
        });
      });

      if (matchedQuestions.length > 0) {
        selectedCategoryTitle.textContent = `搜索 "${searchTerm}" 的结果 (${matchedQuestions.length})`;
        questionList.innerHTML = ""; // Clear previous list
        matchedQuestions.forEach((question) => {
          const questionCard = document.createElement("div");
          questionCard.className =
            "cool-card cool-card-hover p-5 md:p-6 cursor-pointer";
          questionCard.setAttribute("data-question-id", question.id);
          questionCard.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-semibold text-lg text-slate-100">${
                              question.title
                            }</h4>
                            <span class="text-xs text-sky-400 bg-slate-700 px-2 py-1 rounded-full">${
                              question.categoryName
                            }</span>
                        </div>
                        <p class="text-slate-400 text-sm mb-4 line-clamp-2">${
                          question.shortDescription
                        }</p>
                        <div class="flex justify-between items-center">
                            <div class="flex flex-wrap gap-2">
                                ${(question.tags || [])
                                  .map(
                                    (tag) =>
                                      `<span class="inline-block bg-slate-700 text-sky-300 text-xs px-2.5 py-1 rounded-full">${tag}</span>`
                                  )
                                  .join("")}
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </div>
                    `;
          questionCard.addEventListener("click", () =>
            openQuestionModal(question)
          );
          questionList.appendChild(questionCard);
        });
        categoryView.classList.add("hidden");
        questionListSection.classList.remove("hidden");
      } else {
        selectedCategoryTitle.textContent = `搜索 "${searchTerm}" 的结果`;
        questionList.innerHTML = `<p class="text-slate-400 text-center col-span-full py-8">未能找到与 "${searchTerm}" 相关的问题。</p>`;
        categoryView.classList.add("hidden");
        questionListSection.classList.remove("hidden");
      }
    });
  }
});
