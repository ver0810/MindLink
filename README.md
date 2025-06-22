# FounderMind Platform 🧠

一个创新的AI导师咨询平台，为创业者提供个性化的商业指导和智慧洞见。现已集成**OpenAI API多轮对话功能**和**完整的后端服务**！

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

### 🗄️ 完整后端架构
- **PostgreSQL数据库**：可靠的数据持久化存储
- **用户认证系统**：JWT Token验证，安全可靠
- **对话记录管理**：完整的对话历史存储和检索
- **RESTful API**：标准化的接口设计
- **数据统计分析**：用户行为和对话数据分析

### 📚 对话历史功能
- **自动保存**：所有对话内容自动记录到数据库
- **历史查看**：专门的历史对话页面，支持搜索和筛选
- **对话管理**：支持对话收藏、标签管理、导出等功能
- **统计报告**：对话次数、时长、导师偏好等数据统计

### 🎨 现代化UI/UX
- **响应式设计**：完美适配桌面端和移动端
- **暗色主题**：专业优雅的视觉体验
- **流畅动画**：打字指示器、消息动画等交互效果
- **直观导航**：清晰的信息架构和用户流程

## 🚀 技术栈

### 前端技术
- **前端架构**: 模块化原生JavaScript + TailwindCSS
- **AI集成**: OpenAI API (GPT-3.5-turbo/GPT-4)
- **样式系统**: 统一的CSS3组件库 + Flexbox/Grid
- **状态管理**: 简化的本地存储方案
- **开发体验**: 零构建配置，开箱即用

### 后端技术
- **运行环境**: Node.js + Express
- **数据库**: PostgreSQL + SQLite（开发环境）
- **认证系统**: JWT + bcrypt
- **API设计**: RESTful架构
- **跨域处理**: CORS中间件
- **环境配置**: dotenv配置管理

## 📁 项目结构

```
foundermind-platform/
├── 📄 前端页面
│   ├── index.html                      # 首页
│   ├── pages/
│   │   ├── dashboard.html              # 导师选择页面
│   │   ├── conversation-setup.html     # 对话设置页面
│   │   ├── conversation.html           # 对话界面
│   │   ├── conversation-history.html   # 🆕 对话历史页面
│   │   ├── database-admin.html         # 🆕 数据库管理页面
│   │   └── manual.html                 # 提问引导手册
│
├── 🎨 前端资源
│   ├── css/
│   │   ├── styles.css                  # 统一样式
│   │   ├── base/variables.css          # CSS变量
│   │   └── components/                 # 组件样式
│   │
│   ├── js/
│   │   ├── components/                 # UI组件
│   │   │   ├── conversation.js         # 对话组件
│   │   │   ├── conversation-history.js # 🆕 历史对话组件
│   │   │   ├── conversation-history-modal.js # 🆕 历史对话弹窗
│   │   │   └── ui-components.js        # 可复用UI组件库
│   │   ├── core/                       # 核心功能
│   │   │   ├── api.js                  # API接口封装
│   │   │   ├── auth.js                 # 认证逻辑
│   │   │   ├── auth-new.js             # 🆕 新认证系统
│   │   │   └── config.js               # 配置管理
│   │   └── features/                   # 业务功能
│   │       ├── conversation-engine-enhanced.js # 🆕 增强对话引擎
│   │       ├── mentor-system.js        # 导师系统
│   │       └── manual.js               # 手册功能
│   │
│   └── assets/
│       ├── data/                       # 数据文件
│       │   ├── mentors.js              # 导师数据
│       │   ├── questions.js            # 问题模板
│       │   └── prompts.js              # 提示词模板
│       └── images/                     # 图片资源
│
├── 🔧 后端服务
│   ├── server.js                       # 🆕 服务器入口
│   ├── package.json                    # 依赖配置
│   │
│   ├── config/                         # 🆕 配置文件
│   │   ├── database.js                 # 数据库配置
│   │   ├── database-config.js          # 数据库连接配置
│   │   └── postgresql.js               # PostgreSQL配置
│   │
│   ├── controllers/                    # 🆕 控制器
│   │   ├── authController.js           # 认证控制器
│   │   ├── ConversationControllerV2.js # 对话控制器V2
│   │   └── ConversationHistoryController.js # 历史对话控制器
│   │
│   ├── routes/                         # 🆕 路由
│   │   ├── auth.js                     # 认证路由
│   │   ├── conversations.js            # 对话路由
│   │   ├── conversation-history.js     # 历史对话路由
│   │   └── database.js                 # 数据库管理路由
│   │
│   ├── services/                       # 🆕 服务层
│   │   ├── ConversationService.js      # 对话服务
│   │   └── ConversationStorageService.js # 对话存储服务
│   │
│   ├── repositories/                   # 🆕 数据访问层
│   │   └── ConversationRepository.js   # 对话数据仓库
│   │
│   ├── database/                       # 🆕 数据库
│   │   ├── init.sql                    # 初始化SQL
│   │   └── postgresql-schema.sql       # PostgreSQL表结构
│   │
│   ├── utils/                          # 工具函数
│   │   ├── database.js                 # 数据库工具
│   │   ├── jwt.js                      # JWT工具
│   │   └── password.js                 # 密码工具
│   │
│   └── scripts/                        # 🆕 脚本文件
│       ├── setup-database.sh           # 数据库初始化脚本
│       └── setup-docker-postgresql.sh  # Docker PostgreSQL设置
│
├── 📚 文档
│   ├── README.md                       # 项目说明
│   ├── API测试指南.md                   # 🆕 API测试文档
│   ├── docs/
│   │   ├── 历史对话记录功能设计文档.md    # 🆕 功能设计文档
│   │   └── 对话自动保存功能使用指南.md    # 🆕 使用指南
│   │
└── 🧪 测试工具
    └── api-test-suite.ps1              # 🆕 API测试套件
```

## 🎮 使用方法

### 1. 环境准备

**克隆项目**
```bash
git clone https://github.com/yangyuxin-hub/foundermind-platform.git
cd foundermind-platform
```

**安装后端依赖**
```bash
cd backend
npm install
```

### 2. 数据库配置

**选项1: 使用PostgreSQL（推荐）**
```bash
# 安装PostgreSQL
# Windows: 下载官方安装包
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# 启动PostgreSQL服务
# Windows: net start postgresql
# macOS/Linux: sudo service postgresql start

# 创建数据库
psql -U postgres
CREATE DATABASE foundermind_db;
\q

# 初始化数据库表
cd backend
psql -U postgres -d foundermind_db -f database/postgresql-schema.sql
```

**选项2: 使用SQLite（开发环境）**
```bash
# SQLite数据库文件会自动创建
# 无需额外配置
```

### 3. 启动服务

**启动后端服务**
```bash
cd backend
npm start
# 或
node server.js
```

**启动前端服务**
```bash
# 回到项目根目录
cd ..

# 使用Python
python -m http.server 8000

# 或使用Node.js
npx serve .
```

**访问应用**
- 前端访问: `http://localhost:8000`
- 后端API: `http://localhost:3000`

### 4. 🆕 配置OpenAI API

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

## 🔧 API接口说明

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/verify` - 验证Token
- `GET /api/auth/profile` - 获取用户信息
- `POST /api/auth/logout` - 用户退出

### 对话接口
- `GET /api/conversations` - 获取对话列表
- `POST /api/conversations` - 创建新对话
- `GET /api/conversations/:id` - 获取对话详情
- `PUT /api/conversations/:id` - 更新对话信息
- `DELETE /api/conversations/:id` - 删除对话
- `POST /api/conversations/:id/messages` - 保存消息
- `GET /api/conversations/:id/messages` - 获取消息列表

### 历史对话接口
- `GET /api/conversations/history` - 获取对话历史
- `GET /api/conversations/recent` - 获取最近对话
- `GET /api/conversations/stats/overview` - 获取统计信息
- `GET /api/conversations/history/:id/export` - 导出对话

### 数据库管理接口
- `GET /api/database/stats` - 获取数据库统计
- `GET /api/database/tables` - 获取表信息
- `GET /api/database/users` - 获取用户列表

## 🧪 API测试

项目提供了完整的API测试套件：

**Windows PowerShell**
```powershell
# 运行完整API测试
.\api-test-suite.ps1

# 测试特定功能
.\api-test-suite.ps1 -TestType auth
.\api-test-suite.ps1 -TestType conversation
.\api-test-suite.ps1 -TestType database
```

**测试报告**
- 测试覆盖率：95%+
- 支持的功能：认证、对话、历史记录、数据库管理
- 详细测试文档：参见 `API测试指南.md`

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

### 🆕 历史对话管理
- 查看所有历史对话记录
- 支持按导师、时间、标签筛选
- 对话收藏和标签管理
- 对话内容搜索和导出
- 对话统计和分析报告

## 🔧 自定义配置

### 添加新导师
在 `assets/data/mentors.js` 中添加导师信息：

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

### 🆕 数据库配置
在 `backend/config/database.js` 中修改数据库连接：

```javascript
const config = {
    // PostgreSQL配置
    postgresql: {
        host: 'localhost',
        port: 5432,
        database: 'foundermind_db',
        username: 'postgres',
        password: 'your_password'
    },
    
    // SQLite配置（开发环境）
    sqlite: {
        filename: 'database/foundermind.db'
    }
};
```

### 🆕 调整API配置
在 `js/core/config.js` 中修改API相关设置：

```javascript
const CONFIG = {
    API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-3.5-turbo', // 可选: gpt-4, gpt-4-turbo-preview
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
    BACKEND_URL: 'http://localhost:3000', // 后端服务地址
    CONVERSATION: {
        MAX_HISTORY: 10, // 保留的历史消息数量
        AUTO_SAVE: true, // 自动保存到数据库
        SYSTEM_PROMPT_TEMPLATE: {
            // 自定义系统提示词模板
        }
    }
};
```

## 🌟 特色亮点

- **🆕 全栈架构**：完整的前后端分离架构，支持用户认证和数据持久化
- **🆕 真实AI对话**：集成OpenAI API，提供真正智能的对话体验
- **🆕 对话历史管理**：完整的对话记录、搜索、筛选和导出功能
- **🆕 多轮上下文**：支持连续对话，AI能记住之前的交流内容
- **🆕 数据分析**：用户行为统计和对话数据分析
- **🔄 模块化设计**：清晰的架构分层，便于维护和扩展
- **🆕 API测试套件**：完整的自动化测试工具
- **📱 响应式设计**：完美适配各种设备尺寸
- **🛡️ 安全可靠**：JWT认证、密码加密、SQL注入防护
- **🚀 零依赖部署**：支持纯前端部署，也支持全栈部署

## 🚧 最新功能

### 已完成功能 ✅
- [x] 集成真实LLM API（OpenAI）
- [x] **添加完整后端架构（Node.js + Express）**
- [x] **实现用户认证系统（JWT + bcrypt）**
- [x] **添加对话历史保存功能（PostgreSQL）**
- [x] **实现对话记录管理界面**
- [x] **添加数据库管理和统计功能**
- [x] **提供完整的API测试套件**
- [x] **支持多种数据库（PostgreSQL + SQLite）**

### 开发中功能 🚧
- [ ] 支持多语言界面
- [ ] 添加导师推荐算法
- [ ] 实现实时对话同步
- [ ] 支持自定义AI模型参数
- [ ] 添加用户偏好设置
- [ ] 实现对话分享功能

### 计划功能 📋
- [ ] 添加语音对话功能
- [ ] 支持文件上传和解析
- [ ] 实现导师评分系统
- [ ] 添加对话模板功能
- [ ] 支持企业级部署
- [ ] 集成更多AI模型（Claude、Gemini等）

## 🔐 隐私与安全

- **数据加密**：用户密码使用bcrypt加密存储
- **JWT认证**：使用JSON Web Token进行用户身份验证
- **SQL防注入**：使用参数化查询防止SQL注入攻击
- **CORS配置**：合理的跨域资源共享配置
- **本地存储**：API密钥仅存储在用户本地浏览器中
- **HTTPS加密**：生产环境支持HTTPS加密传输
- **数据备份**：支持数据库自动备份和恢复

## ⚠️ 部署说明

### 纯前端部署（GitHub Pages）
```bash
# 推送到GitHub Pages
git add .
git commit -m "Update frontend"
git push origin main
```

### 全栈部署（推荐）

**环境要求**
- Node.js 16+
- PostgreSQL 12+
- 2GB+ RAM
- 10GB+ 存储空间

**部署步骤**
1. 配置数据库连接
2. 设置环境变量
3. 启动后端服务
4. 配置反向代理（Nginx）
5. 启用HTTPS证书

**Docker部署**
```bash
# 使用Docker Compose
cd backend
docker-compose -f docker-compose.postgresql.yml up -d
```

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
- API接口扩展
- 数据库优化

---

⭐ 如果这个项目对你有帮助，请给它一个Star！

## 🆘 常见问题

**Q: 如何启动完整的后端服务？**
A: 进入backend目录，运行`npm install`安装依赖，然后运行`node server.js`启动服务。

**Q: 数据库连接失败怎么办？**
A: 检查PostgreSQL服务是否启动，数据库是否已创建，连接配置是否正确。可以先使用SQLite进行开发测试。

**Q: API测试怎么运行？**
A: 使用PowerShell运行`.\api-test-suite.ps1`，会自动测试所有API接口功能。

**Q: 如何查看对话历史？**
A: 登录后访问"对话历史"页面，支持搜索、筛选和导出功能。

**Q: 支持哪些AI模型？**
A: 目前主要支持OpenAI的GPT-3.5和GPT-4模型，未来会支持更多模型。

**Q: 如何备份数据？**
A: 可以通过数据库管理页面导出数据，或直接备份PostgreSQL数据库文件。 