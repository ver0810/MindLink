# FounderMind 开发指南

## 🏗️ 项目架构（简化后）

### 文件结构
```
foundermind-platform/
├── 📄 核心页面
│   ├── index.html              # 主页
│   ├── dashboard.html          # 导师选择
│   ├── conversation-setup.html # 对话设置  
│   ├── conversation.html       # 对话界面
│   └── manual.html            # 提问指南
│
├── 🎨 样式资源
│   └── css/
│       └── styles.css         # 统一样式文件
│
├── ⚙️ JavaScript 模块
│   ├── config.js              # 配置管理（简化）
│   ├── ui-components.js       # UI 组件库（新增）
│   ├── conversation.js        # 对话功能（重构）
│   ├── dashboard.js           # 导师选择
│   ├── conversation-setup.js  # 对话设置
│   ├── auth.js               # 认证逻辑
│   └── manual.js             # 手册交互
│
└── 📊 数据资源
    └── assets/
        ├── mentors.js         # 导师数据
        └── questions.js       # 问题模板
```

## 🔧 核心模块说明

### 1. 配置管理 (`config.js`)
**简化特点：**
- 统一的常量管理
- 简化的 API 密钥管理
- 实用工具函数集合

**主要组件：**
```javascript
CONFIG           // 全局配置常量
ApiManager      // API 密钥管理
Utils           // 通用工具函数
```

### 2. UI 组件库 (`ui-components.js`)
**新增模块，提供：**
- 导师头像/卡片组件
- 聊天气泡组件
- 模态框组件
- 通知组件
- 加载状态组件

### 3. 对话系统 (`conversation.js`)
**重构亮点：**
- 模块化函数结构
- 清晰的初始化流程
- 错误处理机制
- 使用新的 UI 组件

## 🚀 开发流程

### 快速开始
1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd foundermind-platform
   ```

2. **本地开发**
   ```bash
   # 使用 Python
   python -m http.server 8000
   
   # 或使用 Node.js
   npx serve .
   ```

3. **访问应用**
   ```
   http://localhost:8000
   ```

### 开发规范

#### 代码组织
- **单一职责**：每个模块专注特定功能
- **统一入口**：通过 `CONFIG` 访问配置
- **组件复用**：使用 `UIComponents` 创建界面元素

#### 样式规范
- 使用 TailwindCSS 实用类
- 自定义组件放在 `css/styles.css`
- 保持暗色主题一致性

#### 命名约定
```javascript
// 常量：大写下划线
const API_URL = 'https://api.example.com';

// 函数：驼峰命名，动词开头
function createMentorCard() {}

// 组件：PascalCase
const UIComponents = {};

// 配置对象：大写
const CONFIG = {};
```

## 🔄 常见开发任务

### 添加新导师
编辑 `assets/mentors.js`：
```javascript
{
    id: 'unique-id',
    name: '导师姓名',
    title: '职位头衔',
    avatar: '头像URL',
    shortBio: '简短介绍',
    bio: '详细介绍',
    expertise: ['专业领域1', '专业领域2'],
    featured: true,
    suggestedQuestions: ['问题1', '问题2']
}
```

### 修改 UI 组件
在 `js/ui-components.js` 中扩展：
```javascript
UIComponents.createNewComponent = function(params) {
    // 创建新组件逻辑
};
```

### 调整 API 配置
在 `js/config.js` 中修改：
```javascript
CONFIG.API = {
    URL: '新的API地址',
    MODEL: '模型名称',
    // 其他配置...
};
```

### 添加新页面
1. 创建 HTML 文件
2. 引入必要的 JS 文件：
   ```html
   <script src="js/config.js" defer></script>
   <script src="js/ui-components.js" defer></script>
   <script src="js/your-page.js" defer></script>
   ```

## 🐛 调试指南

### 常见问题

1. **API 调用失败**
   - 检查 `CONFIG.API.URL` 配置
   - 验证 API 密钥设置
   - 查看网络请求日志

2. **导师数据未加载**
   - 确认 `assets/mentors.js` 文件路径
   - 检查浏览器控制台错误

3. **样式显示异常**
   - 验证 TailwindCSS CDN 加载
   - 检查自定义 CSS 文件引用

### 调试工具
```javascript
// 查看当前配置
ApiManager.showConfig();

// 检查导师数据
console.log(mentors);

// 显示通知（用于调试）
UIComponents.showNotification('调试信息', 'info');
```

## 📚 最佳实践

### 性能优化
- 使用 `defer` 加载 JavaScript
- 图片使用 WebP 格式
- 避免不必要的 DOM 操作

### 可维护性
- 保持函数简短（<50行）
- 添加适当的注释
- 使用语义化的变量名

### 用户体验
- 提供加载状态指示
- 添加错误处理和友好提示
- 确保移动端适配

## 🚀 部署流程

### GitHub Pages 部署
```bash
git add .
git commit -m "更新描述"
git push origin main
```
等待 1-10 分钟，网站自动更新。

### 自定义域名部署
1. 在项目根目录添加 `CNAME` 文件
2. 配置 DNS 记录指向 GitHub Pages
3. 在仓库设置中配置自定义域名

---

**简化原则：**
- 减少文件数量和复杂度
- 统一配置管理
- 提高代码复用性
- 改善开发体验 