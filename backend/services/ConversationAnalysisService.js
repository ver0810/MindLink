/**
 * 对话分析服务
 * 负责对话内容的智能分析、总结和标签生成
 */

const { Pool } = require('pg');

class ConversationAnalysisService {
    constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });
        
        // 预定义的问题类型关键词映射
        this.problemTypeKeywords = {
            'business_strategy': ['策略', '战略', '规划', '发展', '商业模式', '竞争', '市场定位'],
            'investment_advice': ['投资', '理财', '股票', '基金', '资产配置', '风险', '收益'],
            'career_development': ['职业', '职场', '晋升', '技能', '学习', '成长', '跳槽'],
            'leadership_management': ['管理', '领导', '团队', '员工', '激励', '沟通', '决策'],
            'technology_innovation': ['技术', '创新', 'AI', '人工智能', '数字化', '科技'],
            'market_analysis': ['市场', '趋势', '分析', '竞争对手', '行业', '消费者'],
            'personal_growth': ['个人', '成长', '自我', '提升', '习惯', '目标', '价值观'],
            'financial_planning': ['财务', '预算', '现金流', '成本', '利润', '资金']
        };

        // 情感分析关键词
        this.sentimentKeywords = {
            positive: ['成功', '优秀', '满意', '高兴', '兴奋', '乐观', '积极', '希望'],
            negative: ['困难', '问题', '担心', '焦虑', '失望', '挫折', '困惑', '压力'],
            neutral: ['分析', '讨论', '考虑', '研究', '了解', '学习', '思考', '探讨']
        };
    }

    /**
     * 分析对话内容（实时分析）
     * @param {Array} messages - 消息列表
     * @param {Object} options - 选项参数
     * @returns {Object} 分析结果
     */
    async analyzeConversationContent(messages, options = {}) {
        try {
            // 构造临时对话数据结构
            const conversationData = {
                conversation: {
                    id: options.conversationId || 'temp',
                    user_id: options.userId,
                    primary_mentor_name: '导师',
                    created_at: new Date()
                },
                messages: messages.map((msg, index) => ({
                    content: msg.content,
                    role: msg.role,
                    mentor_name: msg.role === 'assistant' ? '导师' : null,
                    created_at: msg.timestamp || new Date(),
                    message_order: index + 1
                }))
            };

            // 执行分析
            const analysis = await this.performAnalysis(conversationData);

            // 如果提供了conversationId，实时更新数据库
            if (options.conversationId && options.conversationId !== 'temp') {
                await this.updateConversationTagsRealtime(options.conversationId, analysis);
            }

            // 转换为前端期望的格式
            return {
                summary: analysis.summary,
                problemCategories: analysis.problem_types,
                keyTopics: analysis.main_topics,
                autoTags: analysis.auto_tags,
                complexity: analysis.complexity_score,
                sentiment: this.getSentimentLabel(analysis.sentiment_score),
                keyInsights: analysis.key_insights,
                suggestedActions: analysis.suggested_actions,
                confidenceScores: analysis.confidence_scores
            };

        } catch (error) {
            console.error('实时对话分析失败:', error);
            throw error;
        }
    }

    /**
     * 获取情感标签
     */
    getSentimentLabel(score) {
        if (score >= 0.6) return '积极正面';
        if (score <= -0.6) return '消极负面';
        if (score >= 0.2) return '中性客观';
        if (score <= -0.2) return '关注担忧';
        return '中性客观';
    }

    /**
     * 分析对话并生成总结和标签
     * @param {number} conversationId - 对话ID
     * @returns {Object} 分析结果
     */
    async analyzeConversation(conversationId) {
        const client = await this.pool.connect();
        
        try {
            // 1. 获取对话信息和消息
            const conversationData = await this.getConversationData(client, conversationId);
            
            if (!conversationData || !conversationData.messages.length) {
                throw new Error('对话数据不存在或无消息');
            }

            // 2. 生成分析结果
            const analysis = await this.performAnalysis(conversationData);

            // 3. 保存分析结果
            await this.saveAnalysisResult(client, conversationId, analysis);

            // 4. 更新对话表的相关字段
            await this.updateConversationSummary(client, conversationId, analysis);

            // 5. 生成标签推荐
            await this.generateTagRecommendations(client, conversationId, analysis);

            return analysis;

        } catch (error) {
            console.error('对话分析失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * 获取对话数据
     */
    async getConversationData(client, conversationId) {
        const conversationQuery = `
            SELECT c.*, u.username
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1
        `;
        
        const messagesQuery = `
            SELECT content, role, mentor_name, created_at
            FROM conversation_messages
            WHERE conversation_id = $1 AND status = 'sent'
            ORDER BY message_order ASC
        `;

        const [conversationResult, messagesResult] = await Promise.all([
            client.query(conversationQuery, [conversationId]),
            client.query(messagesQuery, [conversationId])
        ]);

        if (conversationResult.rows.length === 0) {
            return null;
        }

        return {
            conversation: conversationResult.rows[0],
            messages: messagesResult.rows
        };
    }

    /**
     * 执行对话分析
     */
    async performAnalysis(conversationData) {
        const { conversation, messages } = conversationData;
        
        // 合并所有消息内容
        const allContent = messages.map(m => m.content).join(' ');
        const userMessages = messages.filter(m => m.role === 'user');
        const assistantMessages = messages.filter(m => m.role === 'assistant');

        // 1. 生成一句话总结
        const summary = this.generateSummary(conversation, messages);

        // 2. 提取关键话题
        const keyTopics = this.extractKeyTopics(allContent);

        // 3. 识别问题类型
        const problemTypes = this.identifyProblemTypes(allContent);

        // 4. 情感分析
        const sentimentAnalysis = this.analyzeSentiment(allContent);

        // 5. 复杂度评估
        const complexityScore = this.assessComplexity(messages);

        // 6. 参与度评估
        const engagementScore = this.assessEngagement(messages);

        // 7. 生成洞察和建议
        const insights = this.generateInsights(conversation, messages, problemTypes);

        // 8. 生成自动标签
        const autoTags = this.generateAutoTags(problemTypes, sentimentAnalysis, complexityScore);

        return {
            summary,
            key_insights: insights,
            main_topics: keyTopics,
            problem_types: problemTypes,
            suggested_actions: this.generateSuggestedActions(problemTypes, insights),
            sentiment_score: sentimentAnalysis.score,
            complexity_score: complexityScore,
            engagement_score: engagementScore,
            auto_tags: autoTags,
            confidence_scores: {
                summary: 0.85,
                topics: 0.75,
                sentiment: sentimentAnalysis.confidence,
                complexity: 0.8
            },
            analysis_version: 'v1.0',
            model_used: 'rule_based_v1',
            processing_time_ms: Date.now()
        };
    }

    /**
     * 生成一句话总结
     */
    generateSummary(conversation, messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        const mentorName = conversation.primary_mentor_name;
        const messageCount = messages.length;
        
        if (userMessages.length === 0) {
            return `与${mentorName}的对话，共${messageCount}条消息`;
        }

        // 分析主要问题类型
        const allUserContent = userMessages.map(m => m.content).join(' ');
        const problemTypes = this.identifyProblemTypes(allUserContent);
        
        if (problemTypes.length > 0) {
            const mainProblemType = this.getDisplayNameForProblemType(problemTypes[0]);
            return `就${mainProblemType}问题与${mentorName}进行了深入讨论，获得了专业建议和指导`;
        }

        // 默认总结
        return `与${mentorName}就多个话题进行了${messageCount}轮交流，涵盖了专业建议和经验分享`;
    }

    /**
     * 提取关键话题
     */
    extractKeyTopics(content) {
        const topics = [];
        const topicKeywords = {
            '创业': ['创业', '初创', 'startup', '企业家'],
            '投资': ['投资', '融资', '资金', '股权'],
            '管理': ['管理', '团队', '员工', '领导'],
            '技术': ['技术', '科技', 'AI', '人工智能', '数字化'],
            '市场': ['市场', '客户', '用户', '销售'],
            '财务': ['财务', '资金', '成本', '利润', '预算']
        };

        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => content.includes(keyword))) {
                topics.push(topic);
            }
        });

        return topics.slice(0, 5); // 最多返回5个主题
    }

    /**
     * 识别问题类型
     */
    identifyProblemTypes(content) {
        const identifiedTypes = [];
        
        Object.entries(this.problemTypeKeywords).forEach(([type, keywords]) => {
            const matchCount = keywords.filter(keyword => content.includes(keyword)).length;
            if (matchCount > 0) {
                identifiedTypes.push({ type, score: matchCount });
            }
        });

        // 按匹配度排序，返回前3个
        return identifiedTypes
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(item => item.type);
    }

    /**
     * 情感分析
     */
    analyzeSentiment(content) {
        let positiveScore = 0;
        let negativeScore = 0;
        let neutralScore = 0;

        Object.entries(this.sentimentKeywords).forEach(([sentiment, keywords]) => {
            const matches = keywords.filter(keyword => content.includes(keyword)).length;
            
            switch (sentiment) {
                case 'positive':
                    positiveScore += matches;
                    break;
                case 'negative':
                    negativeScore += matches;
                    break;
                case 'neutral':
                    neutralScore += matches;
                    break;
            }
        });

        const totalScore = positiveScore + negativeScore + neutralScore;
        
        if (totalScore === 0) {
            return { score: 0, confidence: 0.5, dominant: 'neutral' };
        }

        // 计算情感得分 (-1 到 1)
        const score = (positiveScore - negativeScore) / totalScore;
        const confidence = Math.min(totalScore / 10, 1); // 基于关键词数量的置信度

        let dominant = 'neutral';
        if (score > 0.2) dominant = 'positive';
        else if (score < -0.2) dominant = 'negative';

        return { score: Math.round(score * 100) / 100, confidence, dominant };
    }

    /**
     * 评估复杂度
     */
    assessComplexity(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
        const messageCount = messages.length;
        
        // 基于消息长度和数量评估复杂度
        let complexity = 1;
        
        if (avgLength > 100) complexity++;
        if (avgLength > 200) complexity++;
        if (messageCount > 6) complexity++;
        if (messageCount > 12) complexity++;
        
        return Math.min(complexity, 5);
    }

    /**
     * 评估参与度
     */
    assessEngagement(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        
        if (userMessages.length === 0) return 0;
        
        // 基于对话轮次和消息质量评估参与度
        const ratio = Math.min(userMessages.length / assistantMessages.length, 1);
        const avgUserLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
        
        let engagement = ratio * 0.6;
        if (avgUserLength > 50) engagement += 0.2;
        if (avgUserLength > 100) engagement += 0.2;
        
        return Math.min(Math.round(engagement * 100) / 100, 1);
    }

    /**
     * 生成洞察
     */
    generateInsights(conversation, messages, problemTypes) {
        const insights = [];
        const userMessages = messages.filter(m => m.role === 'user');
        
        // 基于问题类型生成洞察
        if (problemTypes.includes('business_strategy')) {
            insights.push('用户关注商业策略规划，建议进一步深入市场分析和竞争定位');
        }
        
        if (problemTypes.includes('investment_advice')) {
            insights.push('投资咨询需求明确，建议关注风险管理和资产配置优化');
        }
        
        if (userMessages.length > 5) {
            insights.push('用户参与度较高，表现出强烈的学习意愿和深入探讨的需求');
        }
        
        return insights.slice(0, 3);
    }

    /**
     * 生成建议行动
     */
    generateSuggestedActions(problemTypes, insights) {
        const actions = [];
        
        problemTypes.forEach(type => {
            switch (type) {
                case 'business_strategy':
                    actions.push('制定详细的商业计划书');
                    break;
                case 'investment_advice':
                    actions.push('建立投资组合监控机制');
                    break;
                case 'career_development':
                    actions.push('制定个人技能提升计划');
                    break;
                case 'leadership_management':
                    actions.push('实施团队建设和管理改进措施');
                    break;
            }
        });
        
        return [...new Set(actions)].slice(0, 3);
    }

    /**
     * 生成自动标签
     */
    generateAutoTags(problemTypes, sentimentAnalysis, complexityScore) {
        const tags = [];
        
        // 添加问题类型标签
        problemTypes.forEach(type => tags.push(type));
        
        // 添加情感标签
        tags.push(`sentiment_${sentimentAnalysis.dominant}`);
        
        // 添加复杂度标签
        if (complexityScore <= 2) tags.push('complexity_basic');
        else if (complexityScore <= 3) tags.push('complexity_intermediate');
        else tags.push('complexity_advanced');
        
        return tags;
    }

    /**
     * 保存分析结果
     */
    async saveAnalysisResult(client, conversationId, analysis) {
        const query = `
            INSERT INTO conversation_analysis (
                conversation_id, summary, key_insights, main_topics, problem_types,
                suggested_actions, sentiment_score, complexity_score, engagement_score,
                auto_tags, confidence_scores, analysis_version, model_used, processing_time_ms
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (conversation_id) 
            DO UPDATE SET
                summary = EXCLUDED.summary,
                key_insights = EXCLUDED.key_insights,
                main_topics = EXCLUDED.main_topics,
                problem_types = EXCLUDED.problem_types,
                suggested_actions = EXCLUDED.suggested_actions,
                sentiment_score = EXCLUDED.sentiment_score,
                complexity_score = EXCLUDED.complexity_score,
                engagement_score = EXCLUDED.engagement_score,
                auto_tags = EXCLUDED.auto_tags,
                confidence_scores = EXCLUDED.confidence_scores,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        `;
        
        const values = [
            conversationId,
            analysis.summary,
            analysis.key_insights,
            analysis.main_topics,
            analysis.problem_types,
            analysis.suggested_actions,
            analysis.sentiment_score,
            analysis.complexity_score,
            analysis.engagement_score,
            JSON.stringify(analysis.auto_tags),
            JSON.stringify(analysis.confidence_scores),
            analysis.analysis_version,
            analysis.model_used,
            Date.now() - analysis.processing_time_ms
        ];
        
        await client.query(query, values);
    }

    /**
     * 更新对话表的总结字段
     */
    async updateConversationSummary(client, conversationId, analysis) {
        const query = `
            UPDATE conversations 
            SET 
                summary = $2,
                key_topics = $3,
                problem_categories = $4,
                auto_tags = $5,
                complexity_level = $6,
                summary_generated_at = CURRENT_TIMESTAMP,
                tags_generated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;
        
        await client.query(query, [
            conversationId,
            analysis.summary,
            analysis.main_topics,
            analysis.problem_types,
            analysis.auto_tags,
            analysis.complexity_score
        ]);
    }

    /**
     * 生成标签推荐
     */
    async generateTagRecommendations(client, conversationId, analysis) {
        // 获取系统标签
        const tagsQuery = `
            SELECT id, name, tag_type 
            FROM conversation_tags 
            WHERE name = ANY($1) AND is_system = true
        `;
        
        const tagResult = await client.query(tagsQuery, [analysis.auto_tags]);
        
        // 为每个推荐标签创建推荐记录
        for (const tag of tagResult.rows) {
            const confidence = this.calculateTagConfidence(tag.name, analysis);
            
            const recommendQuery = `
                INSERT INTO tag_recommendations (
                    conversation_id, tag_id, confidence_score, reason, source
                ) VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (conversation_id, tag_id) 
                DO UPDATE SET
                    confidence_score = EXCLUDED.confidence_score,
                    reason = EXCLUDED.reason
            `;
            
            await client.query(recommendQuery, [
                conversationId,
                tag.id,
                confidence,
                this.generateRecommendationReason(tag.name, analysis),
                'ai_analysis'
            ]);
        }
    }

    /**
     * 计算标签置信度
     */
    calculateTagConfidence(tagName, analysis) {
        if (analysis.problem_types.includes(tagName)) return 0.9;
        if (analysis.auto_tags.includes(tagName)) return 0.8;
        return 0.6;
    }

    /**
     * 生成推荐理由
     */
    generateRecommendationReason(tagName, analysis) {
        if (analysis.problem_types.includes(tagName)) {
            return '基于对话内容识别的主要问题类型';
        }
        if (tagName.startsWith('sentiment_')) {
            return '基于对话情感分析结果';
        }
        if (tagName.startsWith('complexity_')) {
            return '基于对话复杂度评估结果';
        }
        return '基于AI内容分析推荐';
    }

    /**
     * 获取问题类型显示名称
     */
    getDisplayNameForProblemType(type) {
        const displayNames = {
            'business_strategy': '商业策略',
            'investment_advice': '投资建议',
            'career_development': '职业发展',
            'leadership_management': '领导管理',
            'technology_innovation': '技术创新',
            'market_analysis': '市场分析',
            'personal_growth': '个人成长',
            'financial_planning': '财务规划'
        };
        return displayNames[type] || type;
    }

    /**
     * 批量分析对话
     */
    async batchAnalyzeConversations(conversationIds) {
        const results = [];
        
        for (const id of conversationIds) {
            try {
                const result = await this.analyzeConversation(id);
                results.push({ conversationId: id, success: true, result });
            } catch (error) {
                results.push({ conversationId: id, success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * 获取对话分析结果
     */
    async getAnalysisResult(conversationId) {
        const client = await this.pool.connect();
        
        try {
            const query = `
                SELECT * FROM conversation_analysis 
                WHERE conversation_id = $1
            `;
            
            const result = await client.query(query, [conversationId]);
            return result.rows[0] || null;
            
        } finally {
            client.release();
        }
    }

    /**
     * 实时更新对话标签
     * @param {number} conversationId - 对话ID
     * @param {Object} analysis - 分析结果
     */
    async updateConversationTagsRealtime(conversationId, analysis) {
        const client = await this.pool.connect();
        
        try {
            // 只更新标签相关字段，不更新总结等其他字段
            const updateQuery = `
                UPDATE conversations 
                SET 
                    problem_categories = $1,
                    auto_tags = $2,
                    tags_generated_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `;

            await client.query(updateQuery, [
                JSON.stringify(analysis.problem_types || []),
                JSON.stringify(analysis.auto_tags || []),
                conversationId
            ]);

            console.log(`对话 ${conversationId} 标签实时更新完成`);

        } catch (error) {
            console.error('实时更新对话标签失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ConversationAnalysisService; 