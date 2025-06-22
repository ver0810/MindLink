# 🧪 AI导师对话系统 - API测试完整指南

## 📋 概述

本指南提供了多种方式来测试AI导师对话系统的所有API功能，确保系统正常运行。

## 🚀 快速开始

### 1. 启动后端服务

在测试API之前，确保后端服务正在运行：

```powershell
# Windows PowerShell
cd backend
node server.js
```

```bash
# Linux/Mac
cd backend
node server.js
```

服务启动后，应该能看到：
```
🎉 AI导师对话系统启动成功！
📍 服务地址: http://localhost:3000
```

## 🛠️ 测试方法

### 方法1: 自动化测试脚本（推荐）

#### Windows PowerShell 版本
```powershell
# 简化版测试（推荐新手）
.\test-api-simple.ps1

# 完整版测试（详细报告）
.\test-all-apis.ps1

# 指定服务器地址
.\test-api-simple.ps1 -BaseUrl "http://localhost:3001"
```

#### Linux/Mac 版本
```bash
# 添加执行权限
chmod +x curl-api-tests.sh

# 运行测试
./curl-api-tests.sh

# 修改服务器地址（如需要）
BASE_URL="http://localhost:3001" ./curl-api-tests.sh
```

### 方法2: 使用现有测试脚本

```powershell
# 使用项目内置的测试脚本
.\quick-test.ps1 all

# 单独测试模块
.\quick-test.ps1 api
```

### 方法3: 手动测试（使用浏览器或工具）

#### 使用浏览器开发者工具
1. 打开 `http://localhost:3000/pages/database-admin.html`
2. 按F12打开开发者工具
3. 在Console中运行测试代码

#### 使用Postman
导入 `api-test-collection.json` 文件到Postman中运行测试。

## 🔍 测试覆盖范围

### 1. 🏥 系统健康检查
- **接口**: `GET /health`
- **测试内容**: 
  - 服务器响应状态
  - 数据库连接状态
  - 系统基本信息

### 2. 🔐 用户认证功能
- **用户注册**: `POST /api/auth/register`
- **用户登录**: `POST /api/auth/login`
- **Token验证**: `GET /api/auth/verify`
- **获取用户信息**: `GET /api/auth/profile`
- **用户退出**: `POST /api/auth/logout`

### 3. 💬 对话管理功能
- **获取导师列表**: `GET /api/conversations/mentors`
- **创建对话**: `POST /api/conversations`
- **获取对话列表**: `GET /api/conversations`
- **获取对话详情**: `GET /api/conversations/:id`
- **更新对话**: `PUT /api/conversations/:id`
- **删除对话**: `DELETE /api/conversations/:id`
- **保存消息**: `POST /api/conversations/:id/messages`
- **获取消息**: `GET /api/conversations/:id/messages`
- **收藏对话**: `POST /api/conversations/:id/favorite`
- **获取统计信息**: `GET /api/conversations/stats/overview`

### 4. 📚 对话历史功能
- **获取对话历史**: `GET /api/conversations/history`
- **获取对话详情**: `GET /api/conversations/history/:id`
- **获取最近对话**: `GET /api/conversations/recent`
- **更新对话状态**: `PUT /api/conversations/history/:id/status`
- **删除对话**: `DELETE /api/conversations/history/:id`
- **导出对话**: `GET /api/conversations/history/:id/export`

### 5. 🗄️ 数据库管理功能
- **获取数据库统计**: `GET /api/database/stats`
- **获取数据库表信息**: `GET /api/database/tables`
- **获取用户列表**: `GET /api/database/users`
- **获取会话列表**: `GET /api/database/sessions`

## 📊 测试结果解读

### 成功标识
- ✅ **绿色勾号**: 测试通过，功能正常
- ⚠️ **黄色警告**: 部分功能异常，但不影响基本使用
- ❌ **红色叉号**: 测试失败，需要立即修复

### 通过率标准
- **90%以上**: 系统状态良好
- **80-90%**: 系统基本可用，建议检查失败项
- **80%以下**: 系统存在严重问题，需要排查

## 🔧 常见问题排查

### 1. 连接失败
**问题**: 无法连接到服务器
**解决方案**:
```powershell
# 检查服务是否运行
netstat -ano | findstr :3000

# 检查防火墙设置
# 重启后端服务
cd backend
node server.js
```

### 2. 认证失败
**问题**: Token验证失败
**解决方案**:
- 检查用户注册是否成功
- 确认密码强度符合要求
- 验证JWT配置是否正确

### 3. 数据库错误
**问题**: 数据库连接失败
**解决方案**:
```powershell
# 检查PostgreSQL服务状态
# Windows
.\quick-start-postgresql.bat

# 检查数据库连接配置
# 查看 backend/config/postgresql.js
```

### 4. 权限错误
**问题**: API返回401/403错误
**解决方案**:
- 确认请求头包含正确的Authorization
- 检查Token是否过期
- 验证用户权限设置

## 📝 手动测试步骤

### 完整流程测试

1. **环境准备**
   ```powershell
   # 启动后端服务
   cd backend
   node server.js
   ```

2. **健康检查**
   ```powershell
   # 浏览器访问
   # http://localhost:3000/health
   
   # 或使用curl
   curl http://localhost:3000/health
   ```

3. **用户认证测试**
   ```javascript
   // 在浏览器控制台运行
   fetch('/api/auth/register', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
           username: 'testuser',
           email: 'test@example.com',
           password: 'TestPassword123!'
       })
   }).then(r => r.json()).then(console.log);
   ```

4. **对话功能测试**
   ```javascript
   // 使用获取到的token
   const token = 'your_jwt_token_here';
   
   fetch('/api/conversations/mentors', {
       headers: { 'Authorization': `Bearer ${token}` }
   }).then(r => r.json()).then(console.log);
   ```

## 📄 测试报告

测试完成后，会生成以下文件：
- `api-test-report-YYYYMMDD_HHMMSS.json` - JSON格式详细报告
- `api-test-report-YYYYMMDD_HHMMSS.txt` - 文本格式简要报告

报告包含：
- 测试执行时间
- 各项测试结果
- 成功率统计
- 失败原因分析
- 性能数据（响应时间）

## 🎯 持续集成

### 自动化测试集成
可以将测试脚本集成到CI/CD流程中：

```yaml
# GitHub Actions 示例
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: cd backend && npm install
      - name: Start server
        run: cd backend && npm start &
      - name: Run API tests
        run: .\test-api-simple.ps1
```

## 💡 最佳实践

1. **定期测试**: 建议每次代码更新后运行完整测试
2. **环境隔离**: 使用独立的测试环境，避免影响生产数据
3. **数据清理**: 测试后清理生成的测试数据
4. **监控指标**: 关注API响应时间和成功率趋势
5. **错误日志**: 保存测试日志，便于问题定位

## 🆘 获取帮助

如果测试过程中遇到问题：

1. 查看控制台错误信息
2. 检查后端服务日志
3. 确认网络连接正常
4. 验证数据库服务状态
5. 参考现有测试文档：
   - `测试使用说明.md`
   - `简单测试指南.md`

---

🎉 **祝测试顺利！如有问题，请参考项目文档或提交Issue。** 