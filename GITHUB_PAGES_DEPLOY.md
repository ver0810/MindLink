# GitHub Pages 部署指南

## 🚀 快速部署到 GitHub Pages

### 方法一：直接修改配置文件（推荐）

1. **获取 SiliconFlow API 密钥**
   - 访问 [SiliconFlow](https://cloud.siliconflow.cn)
   - 注册账户并登录
   - 在控制台中创建 API 密钥
   - 复制形如 `sk-xxxxxxxxxxxxxxxxxxxxx` 的密钥

2. **修改配置文件**
   - 打开 `js/config.js` 文件
   - 找到第11行的 `API_KEY: 'sk-your-hardcoded-api-key-here'`
   - 将 `sk-your-hardcoded-api-key-here` 替换为您的实际API密钥

3. **部署到 GitHub Pages**
   - 将代码推送到 GitHub 仓库
   - 在仓库设置中启用 GitHub Pages
   - 选择 `main` 分支作为源
   - 访问 `https://yourusername.github.io/your-repo-name`

### 方法二：使用示例配置（安全）

如果您不想将API密钥直接提交到公开仓库，可以：

1. **创建私有分支**
   ```bash
   git checkout -b deploy
   ```

2. **使用示例配置**
   ```bash
   cp config.example.js js/config.js
   ```

3. **编辑配置文件**
   - 修改 `js/config.js` 中的 API_KEY
   - 提交到私有分支

4. **部署私有分支**
   - 在 GitHub Pages 设置中选择 `deploy` 分支

## ⚠️ 安全注意事项

### 不要将真实API密钥提交到公开仓库！

推荐的安全做法：

1. **使用私有仓库** - 最安全的方式
2. **使用私有分支** - 将配置放在私有分支
3. **使用环境变量** - 如果使用CI/CD
4. **创建私有Fork** - Fork到私有仓库后配置

### API密钥保护建议

```javascript
// ✅ 好的做法
API_KEY: process.env.SILICONFLOW_API_KEY || 'fallback-key'

// ❌ 避免的做法
API_KEY: 'sk-real-api-key-here' // 在公开仓库中
```

## 🔧 配置说明

### 当前配置的API服务商
- **服务商**: SiliconFlow
- **模型**: DeepSeek-V3
- **费用**: 有免费额度

### 支持的替代方案
如果需要使用其他API服务，可以修改配置：

```javascript
// OpenAI 官方API
API: {
    URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-3.5-turbo',
    API_KEY: 'sk-your-openai-key'
}

// 其他兼容API
API: {
    URL: 'https://your-api-endpoint.com/v1/chat/completions',
    MODEL: 'your-model-name',
    API_KEY: 'your-api-key'
}
```

## 🌐 域名配置（可选）

如果您有自定义域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 写入您的域名，如：`foundermind.yourdomain.com`
3. 在域名DNS设置中添加CNAME记录指向 `yourusername.github.io`

## 🐛 故障排除

### 常见问题

1. **页面显示"请先选择一位导师"**
   - 检查API密钥是否正确设置
   - 确认 `CONFIG.API.API_KEY` 不是默认值

2. **对话无响应**
   - 检查浏览器控制台是否有错误
   - 确认API密钥有效且有余额
   - 检查网络连接

3. **GitHub Pages构建失败**
   - 确认所有文件都已提交
   - 检查是否有语法错误
   - 查看 Actions 标签页的构建日志

### 测试API密钥

在浏览器控制台中运行：
```javascript
ApiManager.showConfig(); // 显示当前配置
```

## 📞 技术支持

- **问题反馈**: 在GitHub仓库中创建Issue
- **API问题**: 联系SiliconFlow客服
- **部署问题**: 参考GitHub Pages官方文档

---

**🎉 完成部署后，您就可以在任何地方访问您的AI导师平台了！** 