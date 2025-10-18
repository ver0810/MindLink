# 教育主题迁移检查清单

## 后端文件修改状态

### ✅ 已完成的核心文件

#### 1. 服务层
- [x] `backend/services/ConversationAnalysisService.js`
  - [x] 更新 `problemTypeKeywords` 关键词映射
  - [x] 更新 `generateInsights()` 方法
  - [x] 更新 `generateSuggestedActions()` 方法
  - [x] 更新 `getDisplayNameForProblemType()` 方法

#### 2. 数据库迁移脚本
- [x] `backend/scripts/fix-conversation-tags.js`
  - [x] 更新标签定义为教育主题
  - [x] 更新问题类型标签（8个）
  - [x] 更新话题标签（4个）
  
- [x] `backend/scripts/run-migration-complete.js`
  - [x] 更新标签定义为教育主题
  - [x] 保持表结构完整性

#### 3. 测试脚本
- [x] `backend/scripts/test-dashboard-display.js`
  - [x] 更新测试数据示例
  - [x] 更新标签映射
  
- [x] `backend/scripts/test-dashboard-display-simplified.js`
  - [x] 更新测试对话数据
  - [x] 更新标签格式化函数

---

## ⚠️ 可选更新文件（含少量旧标签）

### 测试文件
- [ ] `backend/scripts/test-api-endpoints.js`
  - 影响：低（仅用于API测试）
  - 位置：L87-97 创建测试对话函数
  
- [ ] `backend/scripts/test-auto-analysis.js`
  - 影响：低（仅用于自动分析逻辑测试）
  - 位置：L13-19 测试数据
  
- [ ] `backend/scripts/test-frontend-display.js`
  - 影响：低（仅用于前端显示测试）
  - 位置：L32-134 模拟对话数据

---

## 标签对照表

### 问题类型标签 (Problem Type)

| 旧标签（商业） | 新标签（教育） | 中文名 |
|--------------|--------------|--------|
| business_strategy | learning_strategy | 学习策略 |
| investment_advice | memory_retention | 记忆巩固 |
| career_development | exam_preparation | 考试备考 |
| leadership_management | concept_understanding | 概念理解 |
| technology_innovation | knowledge_application | 知识应用 |
| market_analysis | study_habits | 学习习惯 |
| personal_growth | personal_growth | 个人成长 ✓ |
| financial_planning | learning_difficulties | 学习困难 |

### 话题标签 (Topic)

| 旧标签（商业） | 新标签（教育） | 中文名 |
|--------------|--------------|--------|
| topic_startup | topic_education | 教育话题 |
| topic_ai_tech | topic_learning_science | 学习科学 |
| topic_economics | topic_skill_development | 技能发展 |
| topic_education | topic_knowledge_management | 知识管理 |

---

## 部署前检查

### 1. 代码检查
```bash
# 检查是否还有旧标签引用
cd foundermind-platform/backend
grep -r "business_strategy" services/ --exclude-dir=node_modules
grep -r "investment_advice" services/ --exclude-dir=node_modules
grep -r "career_development" services/ --exclude-dir=node_modules
```

### 2. 数据库准备
```bash
# 运行迁移脚本
node backend/scripts/run-migration-complete.js

# 或单独修复标签
node backend/scripts/fix-conversation-tags.js
```

### 3. 测试验证
```bash
# 测试Dashboard显示
node backend/scripts/test-dashboard-display.js

# 测试简化显示
node backend/scripts/test-dashboard-display-simplified.js
```

### 4. 数据库验证
```sql
-- 检查标签是否正确插入
SELECT name, display_name, tag_type 
FROM conversation_tags 
WHERE is_system = TRUE 
ORDER BY tag_type, name;

-- 应该看到：
-- learning_strategy, memory_retention, exam_preparation 等教育主题标签
```

---

## 前端相关修改（待处理）

### 需要更新的前端文件
- [ ] `js/dashboard.js` - Dashboard对话列表
- [ ] `js/conversation-analysis.js` - 对话分析显示
- [ ] `pages/dashboard.html` - Dashboard页面
- [ ] `pages/conversation-detail.html` - 对话详情页

### 前端标签映射示例
```javascript
// 需要在前端JS中更新
const TAG_DISPLAY_NAMES = {
  'learning_strategy': '学习策略',
  'memory_retention': '记忆巩固',
  'exam_preparation': '考试备考',
  'concept_understanding': '概念理解',
  'knowledge_application': '知识应用',
  'study_habits': '学习习惯',
  'personal_growth': '个人成长',
  'learning_difficulties': '学习困难'
};
```

---

## 验证清单

### 功能验证
- [ ] 对话分析功能正常工作
- [ ] 标签自动生成使用新关键词
- [ ] Dashboard显示正确的标签
- [ ] 标签颜色显示正常
- [ ] 对话搜索和筛选功能正常

### 数据验证
- [ ] 新对话使用教育主题标签
- [ ] 旧对话标签保持兼容
- [ ] 标签统计和分析正确
- [ ] 数据库索引正常工作

### UI验证
- [ ] 标签中文名显示正确
- [ ] 标签颜色符合设计
- [ ] 响应式布局正常
- [ ] 移动端显示正常

---

## 回滚计划

### 如果需要回滚：

1. **数据库回滚**
```sql
-- 备份当前标签
CREATE TABLE conversation_tags_backup AS 
SELECT * FROM conversation_tags;

-- 删除教育标签
DELETE FROM conversation_tags 
WHERE name IN (
  'learning_strategy', 'memory_retention', 'exam_preparation',
  'concept_understanding', 'knowledge_application', 'study_habits',
  'learning_difficulties'
);

-- 恢复商业标签（需要提前备份SQL）
-- INSERT INTO conversation_tags ...
```

2. **代码回滚**
```bash
# 使用Git回滚到之前的版本
git log --oneline  # 查找迁移前的commit
git checkout <commit-hash> -- backend/services/ConversationAnalysisService.js
git checkout <commit-hash> -- backend/scripts/run-migration-complete.js
```

---

## 注意事项

### ⚠️ 重要提醒
1. **在生产环境运行前，务必在测试环境验证**
2. **备份数据库再运行迁移脚本**
3. **标签修改会影响所有新生成的分析结果**
4. **旧的对话数据不会自动更新标签**

### 💡 最佳实践
1. 先在开发环境测试完整流程
2. 准备好回滚方案
3. 通知相关团队成员
4. 监控迁移后的系统表现

---

## 完成标志

当以下所有项都完成时，迁移即完成：

- [x] 后端核心服务更新
- [x] 数据库迁移脚本更新
- [x] 测试脚本更新
- [ ] 数据库迁移执行成功
- [ ] 前端组件更新
- [ ] 功能测试通过
- [ ] 用户验收测试通过

---

**当前状态**: 后端代码修改已完成 ✅

**下一步**: 
1. 运行数据库迁移
2. 更新前端代码
3. 执行完整测试

**文档版本**: v1.0  
**创建日期**: 2024年1月  
**负责人**: FounderMind Platform Team