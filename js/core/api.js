// FounderMind Platform - API 服务层
// 负责所有外部API调用和配置管理

const APIService = {
  // OpenAI API配置
  config: {
    baseURL: "https://api.moonshot.cn/v1",
    model: "kimi-k2-0905-preview",
    maxTokens: 1000,
    temperature: 0.7,
  },

  // 获取API密钥
  getApiKey() {
    return localStorage.getItem("foundermind_api_key") || "";
  },

  // 保存API密钥
  setApiKey(apiKey) {
    localStorage.setItem("foundermind_api_key", apiKey);
  },

  // 检查API密钥是否存在
  hasApiKey() {
    return !!this.getApiKey();
  },

  // 测试API连接
  async testConnection() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("API密钥未设置");
    }

    const testPayload = {
      model: this.config.model,
      messages: [{ role: "user", content: "你好" }],
      max_tokens: 10,
      temperature: 0.7,
    };

    try {
      const response = await fetch(this.config.baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return {
        success: true,
        message: "API连接成功",
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "API连接失败",
      };
    }
  },

  // 生成AI回复
  async generateResponse(messages, mentorInfo, options = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("API密钥未设置");
    }

    const payload = {
      model: options.model || this.config.model,
      messages: messages,
      max_tokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature || this.config.temperature,
      stream: false,
    };

    try {
      const response = await fetch(this.config.baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("API返回格式错误");
      }

      return {
        success: true,
        content: data.choices[0].message.content,
        usage: data.usage,
      };
    } catch (error) {
      console.error("API调用失败:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 构建系统提示词
  buildSystemPrompt(mentorsInfo, mode) {
    if (mode === "1v1") {
      const mentor = mentorsInfo[0];
      return `你是${mentor.name}，${
        mentor.title
      }。你的专业领域包括：${mentor.expertise.join("、")}。

个人简介：${mentor.bio}

请严格按照${
        mentor.name
      }的身份、专业背景和思维方式来回答问题。保持角色的一致性，提供专业、实用的建议。回答要有深度，结合实际案例，体现出${
        mentor.name
      }独特的见解和经验。

回答要求：
1. 保持${mentor.name}的身份和语言风格
2. 结合相关的专业知识和实际经验
3. 提供具体可行的建议和指导
4. 回答要有深度和价值`;
    } else {
      const mentorNames = mentorsInfo.map((m) => m.name).join("、");
      const allExpertise = [
        ...new Set(mentorsInfo.flatMap((m) => m.expertise)),
      ];

      return `你现在需要模拟一个圆桌讨论，参与的导师包括：${mentorNames}。

各导师的专业领域覆盖：${allExpertise.join("、")}

请按照以下要求进行圆桌讨论：
1. 每位导师都要从自己的专业角度发表观点
2. 保持各导师独特的身份特征和思维方式
3. 可以有不同观点，展现多元化的专业见解
4. 最后要有一个综合性的总结建议

回答格式：
**${mentorsInfo[0].name}**：[第一位导师的观点]

**${mentorsInfo[1]?.name || ""}**：[第二位导师的观点]

${
  mentorsInfo.length > 2 ? `**${mentorsInfo[2].name}**：[第三位导师的观点]` : ""
}

**综合建议**：[整合各导师观点的总结]`;
    }
  },

  // 生成回退回复（当API不可用时）
  generateFallbackResponse(mentorsInfo, userMessage, mode) {
    const responses = [
      "这是一个很有深度的问题。基于我的经验，我建议您...",
      "从我的专业角度来看，这个问题需要考虑几个关键因素...",
      "这让我想起了我在创业过程中遇到的类似情况...",
      "这是一个常见但重要的挑战。让我分享一些实用的建议...",
      "基于我多年的实践经验，我认为关键在于...",
    ];

    if (mode === "1v1") {
      const mentor = mentorsInfo[0];
      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];
      return `**${mentor.name}**：${randomResponse}

由于当前网络环境限制，这是基于${mentor.name}专业背景的预设回复。建议您：

1. 配置OpenAI API密钥以获得更智能的回复
2. 查看手册中的详细建议
3. 尝试从不同角度重新思考这个问题

请点击"API配置"按钮设置您的密钥以获得更好的体验。`;
    } else {
      let response = "";
      mentorsInfo.forEach((mentor, index) => {
        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];
        response += `**${mentor.name}**：${randomResponse}\n\n`;
      });

      response += `**综合建议**：各位导师都从不同角度提供了宝贵建议。

由于当前为演示模式，建议您配置API密钥以获得更智能的对话体验。`;

      return response;
    }
  },
};

// 导出API服务
if (typeof module !== "undefined" && module.exports) {
  module.exports = APIService;
} else {
  window.APIService = APIService;
}
