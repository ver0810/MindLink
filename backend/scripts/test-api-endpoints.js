/**
 * API端点测试脚本
 * 测试用户认证、对话查看等功能
 */

const { pgConfig } = require('../config/postgresql');
const JWTUtil = require('../utils/jwt');
const PasswordUtil = require('../utils/password');

class APITester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testUser = null;
        this.testToken = null;
        this.testConversation = null;
    }

    async initialize() {
        try {
            await pgConfig.initialize();
            console.log('✅ 数据库连接成功');
            return true;
        } catch (error) {
            console.error('❌ 数据库连接失败:', error.message);
            return false;
        }
    }

    async createTestUser() {
        try {
            const testUsername = `test_user_${Date.now()}`;
            const testEmail = `test${Date.now()}@example.com`;
            const testPassword = 'TestPassword123!';

            // 检查用户是否已存在
            const existingUser = await pgConfig.query(
                'SELECT id FROM users WHERE username = $1 OR email = $2',
                [testUsername, testEmail]
            );

            if (existingUser.rows.length > 0) {
                throw new Error('测试用户已存在');
            }

            // 创建新用户
            const passwordHash = await PasswordUtil.hashPassword(testPassword);
            const result = await pgConfig.query(
                `INSERT INTO users (username, email, password_hash, salt, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
                 RETURNING id, username, email, created_at`,
                [testUsername, testEmail, passwordHash, 'bcrypt_internal']
            );

            if (result.rows.length === 0) {
                throw new Error('用户创建失败');
            }

            this.testUser = result.rows[0];
            
            // 生成token
            const tokenPayload = {
                id: this.testUser.id,
                username: this.testUser.username,
                email: this.testUser.email,
                role: 'user',
                iat: Math.floor(Date.now() / 1000)
            };
            
            this.testToken = JWTUtil.generateToken(tokenPayload);

            console.log('✅ 测试用户创建成功:', {
                id: this.testUser.id,
                username: this.testUser.username,
                email: this.testUser.email,
                tokenLength: this.testToken.length
            });

            return true;
        } catch (error) {
            console.error('❌ 创建测试用户失败:', error.message);
            return false;
        }
    }

    async createTestConversation() {
        try {
            const conversationData = {
                uuid: require('crypto').randomUUID(),
                user_id: this.testUser.id,
                title: '测试对话 - ID匹配验证',
                description: '用于验证用户ID和token匹配的测试对话',
                mode: 'single',
                primary_mentor_id: 'buffett',
                primary_mentor_name: '巴菲特',
                mentors: JSON.stringify(['buffett']),
                status: 'active',
                tags: ['测试'],
                metadata: JSON.stringify({ test: true })
            };

            const result = await pgConfig.query(`
                INSERT INTO conversations (
                    uuid, user_id, title, description, mode,
                    primary_mentor_id, primary_mentor_name, mentors,
                    status, tags, metadata, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id, uuid, title, created_at
            `, [
                conversationData.uuid,
                conversationData.user_id,
                conversationData.title,
                conversationData.description,
                conversationData.mode,
                conversationData.primary_mentor_id,
                conversationData.primary_mentor_name,
                conversationData.mentors,
                conversationData.status,
                conversationData.tags,
                conversationData.metadata
            ]);

            if (result.rows.length === 0) {
                throw new Error('对话创建失败');
            }

            this.testConversation = result.rows[0];

            console.log('✅ 测试对话创建成功:', {
                id: this.testConversation.id,
                uuid: this.testConversation.uuid,
                title: this.testConversation.title
            });

            return true;
        } catch (error) {
            console.error('❌ 创建测试对话失败:', error.message);
            return false;
        }
    }

    async testTokenValidation() {
        try {
            console.log('\n📋 测试Token验证');
            
            // 验证token
            const decodedToken = JWTUtil.verifyToken(this.testToken);
            
            console.log('✅ Token解码成功:', {
                id: decodedToken.id,
                username: decodedToken.username,
                email: decodedToken.email,
                role: decodedToken.role,
                idType: typeof decodedToken.id
            });

            // 验证ID匹配
            if (decodedToken.id !== this.testUser.id) {
                throw new Error(`ID不匹配: Token中的ID(${decodedToken.id}) != 用户ID(${this.testUser.id})`);
            }

            console.log('✅ 用户ID匹配验证成功');
            return true;
        } catch (error) {
            console.error('❌ Token验证失败:', error.message);
            return false;
        }
    }

    async testConversationAccess() {
        try {
            console.log('\n📋 测试对话访问');
            
            // 模拟API调用 - 查询对话
            const conversationResult = await pgConfig.query(`
                SELECT c.*, u.username, u.email
                FROM conversations c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = $1 AND c.user_id = $2 AND c.deleted_at IS NULL
            `, [this.testConversation.id, this.testUser.id]);

            if (conversationResult.rows.length === 0) {
                throw new Error('无法访问对话 - ID匹配失败');
            }

            const conversation = conversationResult.rows[0];
            console.log('✅ 对话访问成功:', {
                conversationId: conversation.id,
                userId: conversation.user_id,
                title: conversation.title,
                username: conversation.username
            });

            // 验证ID匹配
            if (conversation.user_id !== this.testUser.id) {
                throw new Error(`对话归属验证失败: 对话用户ID(${conversation.user_id}) != 当前用户ID(${this.testUser.id})`);
            }

            console.log('✅ 对话归属验证成功');
            return true;
        } catch (error) {
            console.error('❌ 对话访问测试失败:', error.message);
            return false;
        }
    }

    async testAPIEndpoint(conversationId) {
        try {
            console.log(`\n📋 测试API端点: GET /api/conversations/${conversationId}`);
            
            // 模拟中间件验证
            const decodedUser = JWTUtil.verifyToken(this.testToken);
            const userId = typeof decodedUser.id === 'string' ? parseInt(decodedUser.id) : decodedUser.id;
            
            if (!userId || userId <= 0) {
                throw new Error('中间件验证失败：用户ID无效');
            }

            console.log('✅ 中间件验证成功:', { userId, type: typeof userId });

            // 模拟路由处理
            const conversationResult = await pgConfig.query(`
                SELECT c.*, u.username, u.email
                FROM conversations c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = $1 AND c.user_id = $2 AND c.deleted_at IS NULL
            `, [conversationId, userId]);

            if (conversationResult.rows.length === 0) {
                throw new Error('对话不存在或您无权访问');
            }

            const conversation = conversationResult.rows[0];
            console.log('✅ API调用成功:', {
                id: conversation.id,
                title: conversation.title,
                userMatch: conversation.user_id === userId
            });

            return true;
        } catch (error) {
            console.error('❌ API端点测试失败:', error.message);
            return false;
        }
    }

    async cleanup() {
        try {
            if (this.testConversation) {
                await pgConfig.query('DELETE FROM conversations WHERE id = $1', [this.testConversation.id]);
                console.log('✅ 测试对话已清理');
            }
            
            if (this.testUser) {
                await pgConfig.query('DELETE FROM users WHERE id = $1', [this.testUser.id]);
                console.log('✅ 测试用户已清理');
            }
        } catch (error) {
            console.warn('⚠️ 清理测试数据失败:', error.message);
        }
    }

    async runAllTests() {
        console.log('🧪 开始API端点测试...\n');

        const results = {
            initialize: false,
            createUser: false,
            createConversation: false,
            tokenValidation: false,
            conversationAccess: false,
            apiEndpoint: false
        };

        try {
            // 1. 初始化
            results.initialize = await this.initialize();
            if (!results.initialize) return results;

            // 2. 创建测试用户
            results.createUser = await this.createTestUser();
            if (!results.createUser) return results;

            // 3. 创建测试对话
            results.createConversation = await this.createTestConversation();
            if (!results.createConversation) return results;

            // 4. 测试Token验证
            results.tokenValidation = await this.testTokenValidation();

            // 5. 测试对话访问
            results.conversationAccess = await this.testConversationAccess();

            // 6. 测试API端点
            results.apiEndpoint = await this.testAPIEndpoint(this.testConversation.id);

            // 计算成功率
            const successCount = Object.values(results).filter(Boolean).length;
            const totalCount = Object.keys(results).length;
            
            console.log(`\n📊 测试结果: ${successCount}/${totalCount} 通过`);
            
            if (successCount === totalCount) {
                console.log('🎉 所有测试通过！用户ID和Token匹配系统工作正常。');
            } else {
                console.log('❌ 部分测试失败，请检查相关配置。');
            }

            return results;

        } catch (error) {
            console.error('❌ 测试执行失败:', error);
            return results;
        } finally {
            await this.cleanup();
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const tester = new APITester();
    tester.runAllTests().then(results => {
        const allPassed = Object.values(results).every(Boolean);
        process.exit(allPassed ? 0 : 1);
    }).catch(error => {
        console.error('❌ 测试脚本执行失败:', error);
        process.exit(1);
    });
}

module.exports = { APITester }; 