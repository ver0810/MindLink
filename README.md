# FounderMind Platform 🧠

一个创新的AI导师咨询平台，为创业者提供个性化的商业指导和智慧洞见。现已集成**OpenAI API多轮对话功能**！

## 🌐 在线体验

**🚀 立即访问**: [https://yangyuxin-hub.github.io/foundermind-platform/](https://yangyuxin-hub.github.io/foundermind-platform/)

## ✨ 功能特色

### 🎯 智慧导师系统
- **多位知名导师**：沃伦·巴菲特、李嘉诚、马云、Sam Altman等
- **专业领域覆盖**：投资、商业管理、科技创新、产品设计等
- **个性化回答**：基于每位导师的专业背景和思维方式

### 💬 多模式对话
- **1v1对话**：与单个AI导师深度交流
- **圆桌研讨**：同时咨询多位导师，获得综合观点
- **智能建议**：每位导师提供定制化的问题建议
- **🆕 多轮对话**：支持上下文记忆的连续对话，AI导师能记住之前的交流内容

### 🤖 AI增强功能
- **OpenAI API集成**：使用GPT-3.5/GPT-4提供智能回复
- **对话历史管理**：自动保存和管理对话上下文
- **角色一致性**：AI导师严格按照各自的身份和专业背景回答
- **回退机制**：API失败时自动使用预设回复保证系统稳定性

### 🎨 现代化UI/UX
- **响应式设计**：完美适配桌面端和移动端
- **暗色主题**：专业优雅的视觉体验
- **流畅动画**：打字指示器、消息动画等交互效果
- **直观导航**：清晰的信息架构和用户流程

## 🚀 技术栈（简化升级）

- **前端架构**: 模块化原生JavaScript + TailwindCSS
- **AI集成**: OpenAI API (GPT-3.5-turbo/GPT-4)
- **样式系统**: 统一的CSS3组件库 + Flexbox/Grid
- **状态管理**: 简化的本地存储方案
- **开发体验**: 零构建配置，开箱即用
- **🆕 组件库**: 可复用UI组件系统

## 📁 项目结构

```
foundermind-platform/
├── 📄 核心页面
│   ├── index.html              # 首页
│   ├── dashboard.html          # 导师选择页面
│   ├── conversation-setup.html # 对话设置页面
│   ├── conversation.html       # 对话界面
│   └── manual.html            # 提问引导手册
│
├── 🎨 样式资源
│   └── css/
│       └── styles.css         # 简化的统一样式
│
├── ⚙️ JavaScript模块 (简化重构)
│   ├── config.js              # 🔄 统一配置管理
│   ├── ui-components.js       # 🆕 可复用UI组件库
│   ├── conversation.js        # 🔄 简化的对话系统
│   ├── dashboard.js           # 导师选择逻辑
│   ├── conversation-setup.js  # 对话设置逻辑
│   ├── auth.js                # 认证逻辑
│   └── manual.js              # 手册交互
│
├── 📊 数据资源
│   └── assets/
│       ├── mentors.js         # 导师数据
│       └── questions.js       # 问题模板
│
└── 📚 文档
    ├── README.md              # 项目说明
    └── DEVELOPMENT.md         # 🆕 开发指南
```

## 🎮 使用方法

### 1. 项目部署

**克隆项目**
```bash
git clone https://github.com/yangyuxin-hub/foundermind-platform.git
cd foundermind-platform
```

**启动项目**
- 直接在浏览器中打开 `index.html`
- 或使用本地服务器（推荐）:
  ```bash
  # 使用Python
  python -m http.server 8000
  
  # 或使用Node.js
  npx serve .
  ```

**访问应用**
- 打开浏览器访问 `http://localhost:8000`

### 2. 🆕 配置OpenAI API

**步骤一：获取API密钥**
1. 访问 [OpenAI API Keys页面](https://platform.openai.com/api-keys)
2. 登录您的OpenAI账户
3. 点击"Create new secret key"
4. 复制生成的密钥

**步骤二：配置系统**
1. 在平台中点击"设置" → "API配置"
2. 输入您的OpenAI API密钥
3. 选择合适的模型（推荐GPT-3.5 Turbo）
4. 点击"测试连接"验证配置
5. 保存配置

**配置文件说明**
```javascript
// js/config.js 中的配置项
const OPENAI_CONFIG = {
    apiKey: '', // 将通过CONFIG.getApiKey()动态获取
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
};
```

### 3. 使用多轮对话功能

**启动对话**
1. 在导师选择页面选择心仪的导师
2. 选择1v1对话或圆桌讨论模式
3. 开始智能对话

**多轮对话特性**
- **上下文记忆**：AI导师会记住之前的对话内容
- **角色一致性**：每位导师都有独特的回答风格
- **智能回退**：API不可用时自动使用预设回复
- **历史管理**：自动维护合理长度的对话历史

## 💡 功能演示

### 导师选择
- 浏览精选导师和全部导师
- 查看导师详细信息、专业领域和建议问题
- 点击"开始对话"进入设置页面

### 对话模式
- **一对一模式**：直接与选定导师开始对话
- **圆桌模式**：选择多位导师（最多4位）进行群体咨询

### 🆕 智能对话
- 输入问题获得个性化回答
- AI导师能记住并引用之前的对话内容
- 使用建议问题快速开始
- 支持键盘快捷键（Enter发送，Shift+Enter换行）

## 🔧 自定义配置

### 添加新导师
在 `assets/mentors.js` 中添加导师信息：

```javascript
{
    id: 'unique-id',
    name: '导师姓名',
    title: '职位',
    avatar: '头像URL',
    shortBio: '简短介绍',
    bio: '详细介绍',
    expertise: ['专业领域1', '专业领域2'],
    featured: true/false,
    suggestedQuestions: ['问题1', '问题2']
}
```

### 🆕 调整API配置
在 `js/config.js` 中修改API相关设置：

```javascript
const CONFIG = {
    API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-3.5-turbo', // 可选: gpt-4, gpt-4-turbo-preview
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
    CONVERSATION: {
        MAX_HISTORY: 10, // 保留的历史消息数量
        SYSTEM_PROMPT_TEMPLATE: {
            // 自定义系统提示词模板
        }
    }
};
```

### 修改主题样式
编辑 `css/styles.css` 中的颜色变量和样式类。

## 🌟 特色亮点（简化升级版）

- **🆕 真实AI对话**：集成OpenAI API，提供真正智能的对话体验
- **🆕 多轮上下文**：支持连续对话，AI能记住之前的交流内容
- **🔄 简化架构**：重构后的模块化设计，代码更清晰易维护
- **🆕 组件化UI**：可复用的UI组件库，提高开发效率
- **⚡ 开发友好**：统一配置管理，简化的工具函数
- **📱 响应式设计**：完美适配各种设备尺寸
- **🛡️ 安全可靠**：API密钥本地存储，保护用户隐私
- **🚀 零依赖部署**：纯前端实现，部署极其简单

## 🚧 未来计划

- [x] 集成真实LLM API（OpenAI、Claude等）
- [ ] 添加对话历史保存功能
- [ ] 实现用户账户系统
- [ ] 支持多语言界面
- [ ] 添加导师推荐算法
- [ ] 实现实时对话同步
- [ ] 添加对话导出功能
- [ ] 支持自定义AI模型参数

## 🔐 隐私与安全

- **本地存储**：所有API密钥和配置信息仅存储在用户本地浏览器中
- **无数据上传**：对话内容不会被平台服务器记录
- **HTTPS加密**：所有API通信均通过HTTPS加密传输
- **可控性**：用户完全控制自己的API使用和费用

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进项目！

特别欢迎以下类型的贡献：
- 新的导师角色和专业领域
- 更智能的对话逻辑
- UI/UX改进建议
- 性能优化
- 文档改进

---

⭐ 如果这个项目对你有帮助，请给它一个Star！

## 📱 快速更新网站

每次修改代码后，只需要：
```bash
git add .
git commit -m "描述你的更改"
git push origin main
```
等待1-10分钟，网站就会自动更新！

## 🆘 常见问题

**Q: 如何获取OpenAI API密钥？**
A: 请访问 [OpenAI官网](https://platform.openai.com/api-keys)，注册账户并创建API密钥。

**Q: API调用失败怎么办？**
A: 系统具有自动回退机制，会使用预设回复确保对话继续。请检查API密钥是否正确，账户是否有余额。

**Q: 可以使用其他AI模型吗？**
A: 目前主要支持OpenAI的模型，未来会考虑支持Claude、Gemini等其他模型。

**Q: 对话记录保存在哪里？**
A: 当前对话历史临时保存在浏览器会话中，刷新页面会重置。未来版本会支持持久化存储。 