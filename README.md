# FounderMind Platform 🧠

一个创新的AI导师咨询平台，为创业者提供个性化的商业指导和智慧洞见。

## ✨ 功能特色

### 🎯 智慧导师系统
- **多位知名导师**：沃伦·巴菲特、李嘉诚、马云、Sam Altman等
- **专业领域覆盖**：投资、商业管理、科技创新、产品设计等
- **个性化回答**：基于每位导师的专业背景和思维方式

### 💬 多模式对话
- **1v1对话**：与单个AI导师深度交流
- **圆桌研讨**：同时咨询多位导师，获得综合观点
- **智能建议**：每位导师提供定制化的问题建议

### 🎨 现代化UI/UX
- **响应式设计**：完美适配桌面端和移动端
- **暗色主题**：专业优雅的视觉体验
- **流畅动画**：打字指示器、消息动画等交互效果
- **直观导航**：清晰的信息架构和用户流程

## 🚀 技术栈

- **前端**: 原生JavaScript + TailwindCSS
- **样式**: CSS3 + Flexbox/Grid布局
- **状态管理**: SessionStorage
- **构建工具**: 无构建依赖，可直接运行

## 📁 项目结构

```
foundermind-platform/
├── index.html              # 首页
├── dashboard.html           # 导师选择页面
├── conversation-setup.html  # 对话设置页面
├── conversation.html        # 对话界面
├── manual.html             # 提问引导手册
├── assets/
│   ├── mentors.js          # 导师数据
│   └── questions.js        # 问题模板
├── css/
│   └── styles.css          # 全局样式
├── js/
│   ├── auth.js             # 认证逻辑
│   ├── dashboard.js        # 导师选择逻辑
│   ├── conversation-setup.js # 对话设置逻辑
│   ├── conversation.js     # 对话功能
│   └── manual.js           # 手册交互
└── README.md
```

## 🎮 使用方法

1. **克隆项目**
   ```bash
   git clone https://github.com/yangyuxin-hub/foundermind-platform.git
   cd foundermind-platform
   ```

2. **启动项目**
   - 直接在浏览器中打开 `index.html`
   - 或使用本地服务器（推荐）:
     ```bash
     # 使用Python
     python -m http.server 8000
     
     # 或使用Node.js
     npx serve .
     ```

3. **访问应用**
   - 打开浏览器访问 `http://localhost:8000`

## 💡 功能演示

### 导师选择
- 浏览精选导师和全部导师
- 查看导师详细信息、专业领域和建议问题
- 点击"开始对话"进入设置页面

### 对话模式
- **一对一模式**：直接与选定导师开始对话
- **圆桌模式**：选择多位导师（最多4位）进行群体咨询

### 智能对话
- 输入问题获得个性化回答
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

### 修改主题样式
编辑 `css/styles.css` 中的颜色变量和样式类。

## 🌟 特色亮点

- **无服务器依赖**：纯前端实现，部署简单
- **模块化设计**：功能模块清晰分离，易于维护
- **可扩展架构**：预留LLM API接口，可快速集成真实AI
- **用户体验优先**：注重交互细节和视觉反馈

## 🚧 未来计划

- [ ] 集成真实LLM API（OpenAI、Claude等）
- [ ] 添加对话历史保存功能
- [ ] 实现用户账户系统
- [ ] 支持多语言界面
- [ ] 添加导师推荐算法
- [ ] 实现实时对话同步

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进项目！

---

⭐ 如果这个项目对你有帮助，请给它一个Star！ 