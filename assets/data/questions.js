// Question categories and questions data
const questionCategories = [
  {
    id: "course-review",
    name: "课程复盘",
    description: "学完一节课后，帮助用户总结重点、巩固理解。",
    recommendedQuestions: [
      {
        id: "review-1",
        title: "帮我总结这节课的核心知识点",
        shortDescription: "提炼课程重点，梳理知识框架。",
        description:
          "学习后的知识提炼是巩固记忆的关键步骤。通过系统化总结核心知识点，能够帮助你建立清晰的知识结构，理解各个知识点之间的逻辑关系，从而形成长期记忆。这个问题适合在完成一节课或一个章节学习后立即使用。",
        template:
          "我刚学习了[课程/章节]，主要内容包括[简要列举]。请帮我：\n1. 总结核心知识点\n2. 梳理它们之间的逻辑关系\n3. 提炼必须记住的要点",
        why: "复盘问题促使用户主动提取和加工知识，加深理解并形成长期记忆。",
        tags: ["复盘", "总结", "知识点"],
        recommendedMentors: ["dewey", "ebbinghaus"],
      },
      {
        id: "review-2",
        title: "帮我整理知识点为结构化笔记",
        shortDescription: "将零散知识整理成图表或笔记，便于复习。",
        description:
          "结构化笔记能将零散的知识点转化为有层次、有逻辑的知识体系。通过思维导图、概念图等形式，可以更直观地看到知识之间的关联，方便记忆和快速复习。这种方法特别适合复杂内容的整理和长期保存。",
        template:
          "我刚学了[课程/章节]，请帮我：\n1. 整理知识点\n2. 生成逻辑结构图\n3. 提供关键概念和示例",
        why: "结构化笔记有助于理解、记忆和快速复习。",
        tags: ["复盘", "笔记", "结构化", "可视化"],
        recommendedMentors: ["dewey", "aristotle"],
      },
    ],
  },
  {
    id: "exam-sprint",
    name: "考前冲刺",
    description: "针对考试快速刷题与查漏补缺。",
    recommendedQuestions: [
      {
        id: "exam-1",
        title: "帮我做一份考前冲刺计划",
        shortDescription: "快速查漏补缺，提升复习效率。",
        description:
          "考前冲刺阶段，时间紧迫但至关重要。一份科学的冲刺计划能帮助你在有限时间内最大化复习效果，重点攻克薄弱环节，通过针对性练习巩固知识。这个问题会根据你的时间、掌握情况和考试内容，制定个性化的高效复习方案。",
        template:
          "我还有[天数]天就要考试，考试内容包括[科目/知识点]，我目前掌握情况是[描述]。请帮我：\n1. 制定冲刺复习计划\n2. 聚焦薄弱知识点\n3. 提供练习题和复习策略",
        why: "考前冲刺问题可以帮助用户合理分配时间，高效复习重点。",
        tags: ["考试", "冲刺", "计划", "练习"],
        recommendedMentors: ["hilbert", "ebbinghaus"],
      },
    ],
  },
  {
    id: "cross-discipline",
    name: "跨学科连接",
    description: "将一个知识点连接到不同领域，促进迁移与创新。",
    recommendedQuestions: [
      {
        id: "cross-1",
        title: "这个理论能否应用到其他领域？",
        shortDescription: "探索知识迁移，激发创造力。",
        description:
          "真正的创新往往来自跨学科的知识迁移。将一个领域的理论或方法应用到另一个领域，能够产生独特的见解和解决方案。这个问题帮助你打破学科壁垒，培养跨界思维，发现知识的更多可能性，是激发创造力的有效途径。",
        template:
          "我学了[理论/方法]，主要用于[领域]。我希望你帮我：\n1. 分析它在[其他领域]的应用可能性\n2. 举例跨领域应用案例\n3. 提供应用建议",
        why: "跨学科问题能促进远迁移思维，激发创新能力。",
        tags: ["跨学科", "迁移", "创新", "应用"],
        recommendedMentors: ["jobs", "aristotle"],
      },
    ],
  },
  {
    id: "cognitive-restructuring",
    name: "认知重构",
    description: "修正错误理解，形成清晰认知结构。",
    recommendedQuestions: [
      {
        id: "restructure-1",
        title: "我总是混淆这两个概念，如何区分？",
        shortDescription: "发现并纠正认知偏差。",
        description:
          "概念混淆是学习中常见的障碍，往往源于对概念理解不够深入或缺乏清晰的区分标准。通过系统性地对比两个易混淆的概念，找出它们的本质区别和应用场景差异，能够帮助你建立准确的认知框架，避免知识运用中的错误。",
        template:
          "我在学习[主题]时，经常混淆[概念A]和[概念B]。请帮我：\n1. 解释两者区别\n2. 举例说明应用差异\n3. 提供易记的区分方法",
        why: "认知重构问题帮助用户清晰理解概念，提高知识运用准确性。",
        tags: ["认知", "澄清", "概念", "理解"],
        recommendedMentors: ["piaget", "aristotle"],
      },
    ],
  },
  {
    id: "habit-building",
    name: "习惯养成",
    description: "辅助用户形成学习计划与持续行动。",
    recommendedQuestions: [
      {
        id: "habit-1",
        title: "帮我规划长期学习计划",
        shortDescription: "形成稳定学习习惯，保持动力。",
        description:
          "学习不是一蹴而就的，需要持续的投入和科学的规划。一个好的长期学习计划会考虑遗忘曲线、间隔重复等学习规律，帮助你循序渐进地掌握知识。同时配合激励机制，能够帮助你保持学习动力，最终将学习变成一种稳定的习惯。",
        template:
          "我希望长期学习[学科/技能]，目前时间安排是[描述]。请帮我：\n1. 制定循序渐进计划\n2. 安排复习节奏\n3. 提供激励机制以坚持执行",
        why: "长期计划能降低遗忘率，养成习惯，提高学习效率。",
        tags: ["习惯", "规划", "长期", "激励"],
        recommendedMentors: ["ebbinghaus", "musk"],
      },
    ],
  },
  {
    id: "project-practice",
    name: "项目实战",
    description: "将知识应用到真实任务或作品中。",
    recommendedQuestions: [
      {
        id: "project-1",
        title: "我想做一个小项目练习知识应用",
        shortDescription: "通过实践加深理解和能力。",
        description:
          "纸上得来终觉浅，绝知此事要躬行。通过实际项目来应用所学知识，是检验理解程度和提升实践能力的最佳方式。项目实践不仅能加深对知识的理解，还能培养解决实际问题的能力，让学习真正转化为可用的技能。",
        template:
          "我学了[知识点/技能]，希望通过一个小项目练习。请帮我：\n1. 设计项目方案\n2. 拆解关键步骤\n3. 提供参考资源",
        why: "项目实践能促进深度加工和技能迁移，是从理解到能力转化的关键。",
        tags: ["项目", "实践", "动手", "应用"],
        recommendedMentors: ["jobs", "aristotle"],
      },
    ],
  },
  {
    id: "learning-path",
    name: "路径规划",
    description: "设计清晰的知识学习路线，减少迷茫。",
    recommendedQuestions: [
      {
        id: "path-1",
        title: "帮我规划从入门到精通的学习路线",
        shortDescription: "建立阶段性学习目标和资源计划。",
        description:
          "系统化的学习路径能让你的学习更有方向感和成就感。从入门到精通需要经历多个阶段，每个阶段都有不同的重点和目标。清晰的路线图能帮助你避免迷茫，知道自己处在什么位置，下一步该学什么，从而更高效地达成学习目标。",
        template:
          "我想系统学习[领域/技能]，当前基础是[水平]，目标是在[时间]达到[目标水平]。请帮我：\n1. 制定分阶段学习路线\n2. 明确每阶段重点和资源\n3. 提供阶段性评估方法",
        why: "清晰学习路径能帮助用户高效掌握知识，降低焦虑，提高成就感。",
        tags: ["路径", "路线图", "规划", "目标"],
        recommendedMentors: ["musk", "piaget"],
      },
    ],
  },
  {
    id: "skill-test",
    name: "技能测试",
    description: "检测用户当前水平，并给出提升建议。",
    recommendedQuestions: [
      {
        id: "test-1",
        title: "测一下我当前的学习水平",
        shortDescription: "通过测试评估掌握程度，发现薄弱环节。",
        description:
          "自我测试是检验学习效果的重要手段。通过代表性题目的测试，能够客观评估你对知识的掌握程度，发现理解上的盲点和薄弱环节。及时的反馈能帮助你调整学习策略，针对性地加强薄弱知识点，形成完整的学习闭环。",
        template:
          "我已学习了[主题/知识点]，希望检测掌握程度。请帮我：\n1. 出几道代表性题目\n2. 根据回答提供反馈\n3. 指出需要加强的知识点",
        why: "技能测试可形成学习闭环，暴露盲点，强化记忆并指导下一步学习。",
        tags: ["测试", "评估", "评价", "反馈"],
        recommendedMentors: ["hilbert", "dewey"],
      },
    ],
  },
];
