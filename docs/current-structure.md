# FounderMind Platform 当前项目结构

> 📅 最后更新时间：2024年12月
> 🎯 本文档记录项目的实际目录结构和文件组织

## 🏗️ 项目概览

FounderMind Platform 是一个AI驱动的创业导师对话平台，采用前后端分离的分层架构设计，功能模块清晰分离。

## 📁 完整目录结构

```
foundermind-platform/
├── 📄 pages/                           # 前端页面层 - 用户界面
│   ├── index.html                      # 首页 (37KB, 463行)
│   ├── dashboard.html                  # 导师仪表板 (14KB, 169行)
│   ├── conversation-setup.html         # 对话配置页 (15KB, 197行)
│   ├── conversation.html               # 对话界面 (23KB, 301行)
│   ├── manual.html                     # 用户手册 (20KB, 223行)
│   └── test-fix.html                   # 测试页面 (7.5KB, 160行)
│
├── 🌐 backend/                         # 后端服务层 - Node.js API服务
│   ├── server.js                       # 主服务器文件 (1.5KB, 57行)
│   ├── package.json                    # NPM依赖配置 (404B, 21行)
│   ├── package-lock.json               # 依赖锁定文件 (88KB, 2451行)
│   ├── start-server.bat                # Windows启动脚本 (480B, 17行)
│   ├── controllers/                    # 控制器模块
│   ├── routes/                         # 路由定义
│   ├── middleware/                     # 中间件
│   ├── database/                       # 数据库相关
│   ├── utils/                          # 后端工具函数
│   └── node_modules/                   # NPM依赖包
│
├── 🧩 js/                              # 前端JavaScript模块层
│   ├── core/                           # 核心模块
│   │   ├── config.js                   # 全局配置管理 (6.9KB, 193行)
│   │   ├── auth.js                     # 用户认证系统 (25KB, 583行)
│   │   ├── auth-new.js                 # 新版认证模块 (8.1KB, 290行)
│   │   ├── form-validation.js          # 表单验证模块 (8.3KB, 201行)
│   │   ├── api.js                      # API接口封装 (7.1KB, 206行)
│   │   └── storage.js                  # 数据存储管理 (5.5KB, 202行)
│   │
│   ├── components/                     # UI组件库
│   │   ├── ui-components.js            # 通用UI组件 (24KB, 569行)
│   │   ├── conversation.js             # 对话界面组件 (29KB, 734行)
│   │   ├── dashboard.js                # 仪表板组件 (8.4KB, 199行)
│   │   └── conversation-setup.js       # 设置界面组件 (9.6KB, 198行)
│   │
│   ├── features/                       # 功能模块
│   │   ├── conversation-engine.js      # 对话引擎核心 (16KB, 503行)
│   │   ├── mentor-system.js            # 导师管理系统 (9.0KB, 306行)
│   │   └── manual.js                   # 手册功能模块 (20KB, 326行)
│   │
│   └── utils/                          # 工具函数库 (空目录)
│
├── 🎨 css/                             # 样式层
│   ├── base/                           # 基础样式
│   ├── components/                     # 组件样式
│   ├── pages/                          # 页面专用样式
│   └── styles.css                      # 主样式文件 (9.1KB, 363行)
│
├── 📊 assets/                          # 资源数据层
│   ├── data/                           # 核心数据文件
│   │   ├── mentors.js                  # 导师信息数据库 (10KB, 150行)
│   │   ├── questions.js                # 问题模板库 (33KB, 294行)
│   │   └── prompts.js                  # AI提示词库 (10KB, 262行)
│   │
│   ├── images/                         # 图片资源
│   └── configs/                        # 配置文件
│
├── 🧪 测试文件                         # 开发测试相关
│   ├── auth-test-simple.html           # 认证测试页面 (11KB, 320行)
│   ├── debug-login.html                # 登录调试页面 (5.5KB, 141行)
│   ├── test-login.html                 # 登录测试页面 (2.7KB, 79行)
│   ├── create-test-user.html           # 创建测试用户 (1.8KB, 54行)
│   └── test-api.ps1                    # API测试脚本 (2.7KB, 72行)
│
├── 📚 docs/                            # 文档层
│   ├── architecture.md                 # 架构设计文档
│   ├── current-structure.md            # 当前项目结构 (本文档)
│   ├── 用户认证系统开发任务规划.md       # 认证系统开发规划 (12KB, 340行)
│   └── 用户认证系统-任务看板.md         # 认证系统任务看板 (8KB, 280行)
│
├── 📋 README.md                        # 项目说明 (9.5KB, 290行)
├── 📝 todo.md                          # 开发待办事项 (21KB, 587行)
├── 📊 开发步骤指南.md                   # 开发流程指南 (5.1KB, 242行)
├── 🔐 用户认证机制设计.md                # 认证系统设计 (22KB, 830行)
├── 🚫 .gitignore                       # Git忽略配置 (786B, 65行)
└── 📁 .git/                            # Git版本控制
```

## 📊 项目统计信息

### 📈 代码规模
- **总页面数**: 6个HTML页面 + 5个测试页面
- **前端JavaScript模块**: 13个核心文件
- **后端Node.js服务**: 1个主服务器 + 多个模块
- **数据文件**: 3个主要数据源
- **文档文件**: 7个设计和说明文档

### 💾 文件大小分布
- **最大文件**: backend/package-lock.json (88KB)
- **最大前端页面**: pages/index.html (37KB)
- **最大JS模块**: js/components/conversation.js (29KB)
- **最大数据文件**: assets/data/questions.js (33KB)
- **最大文档**: 用户认证机制设计.md (22KB)

## 🎯 核心模块功能

### 📄 页面层功能
| 页面 | 功能描述 | 文件大小 |
|------|----------|----------|
| index.html | 品牌展示和导师选择入口 | 37KB |
| dashboard.html | 导师仪表板界面 | 14KB |
| conversation-setup.html | 对话参数配置 | 15KB |
| conversation.html | 核心对话界面 | 23KB |
| manual.html | 用户使用手册 | 20KB |
| test-fix.html | 开发测试页面 | 7.5KB |

### 🌐 后端服务功能
| 模块类型 | 主要功能 |
|----------|----------|
| server.js | Express服务器主入口 |
| controllers/ | 业务逻辑控制器 |
| routes/ | API路由定义 |
| middleware/ | 请求处理中间件 |
| database/ | 数据库操作模块 |

### 🧩 前端JavaScript模块功能
| 模块类型 | 文件数量 | 主要功能 |
|----------|----------|----------|
| core/ | 6个 | 配置、认证、API、存储、表单验证 |
| components/ | 4个 | UI组件和界面逻辑 |
| features/ | 3个 | 核心业务功能 |
| utils/ | 0个 | 工具函数(预留) |

### 📊 数据层资源
| 数据类型 | 文件 | 内容描述 |
|----------|------|----------|
| 导师数据 | mentors.js | 导师信息、头像、专长领域 |
| 问题模板 | questions.js | 分类问题库、智能推荐 |
| 提示词库 | prompts.js | AI对话提示词模板 |

### 🧪 测试开发工具
| 文件 | 功能描述 |
|------|----------|
| auth-test-simple.html | 简化版认证测试界面 |
| debug-login.html | 登录流程调试工具 |
| test-login.html | 登录功能测试页面 |
| create-test-user.html | 测试用户创建工具 |
| test-api.ps1 | PowerShell API测试脚本 |

## 🚀 架构特点

### ✅ 前后端分离设计
- **前端**: 纯HTML/CSS/JavaScript，模块化组件设计
- **后端**: Node.js + Express API服务
- **数据交互**: RESTful API接口通信
- **开发独立**: 前后端可独立开发和部署

### ✅ 模块化设计
- **功能分离**: 页面、逻辑、数据、样式独立管理
- **组件复用**: UI组件可在多个页面间共享
- **易于维护**: 模块职责单一，修改影响范围可控

### ✅ 数据驱动
- **配置外置**: 导师信息、问题模板独立于代码
- **动态加载**: 支持运行时数据更新
- **扩展友好**: 新增导师或问题模板无需修改代码

### ✅ 开发友好
- **完整测试工具**: 提供多种测试页面和脚本
- **调试支持**: 专门的调试界面和日志功能
- **文档齐全**: 详细的开发文档和指南

## 🔄 开发工作流

1. **前端页面开发** → pages/ 目录下创建HTML页面
2. **前端组件开发** → js/components/ 实现UI交互逻辑
3. **前端功能开发** → js/features/ 实现核心业务功能
4. **后端API开发** → backend/ 实现服务器端逻辑
5. **数据配置管理** → assets/data/ 管理业务数据
6. **样式设计** → css/ 实现视觉设计
7. **测试验证** → 使用测试页面验证功能
8. **文档维护** → docs/ 更新项目文档

## 📝 维护说明

- **定期更新**: 项目结构变化时及时更新本文档
- **代码统计**: 文件大小和行数统计帮助评估项目规模
- **架构演进**: 记录重要的架构变更和优化决策
- **测试覆盖**: 保持测试工具与功能开发同步更新

---

*📍 此文档反映项目的当前实际状态，如有结构调整请及时更新* 