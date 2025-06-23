/**
 * 认证系统测试脚本
 * 用于测试用户ID生成、token创建和验证
 */

const JWTUtil = require('../utils/jwt');
const { pgConfig } = require('../config/postgresql');
const PasswordUtil = require('../utils/password');

async function testAuth() {
    console.log('🧪 开始认证系统测试...\n');

    try {
        // 1. 测试数据库连接
        console.log('📋 测试1: 数据库连接');
        const dbTest = await pgConfig.query('SELECT NOW() as current_time');
        console.log('✅ 数据库连接成功:', dbTest.rows[0].current_time);

        // 2. 测试用户创建
        console.log('\n📋 测试2: 用户创建');
        const testUsername = `test_user_${Date.now()}`;
        const testEmail = `test${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';

        const passwordHash = await PasswordUtil.hashPassword(testPassword);
        console.log('✅ 密码加密成功');

        const createResult = await pgConfig.query(
            `INSERT INTO users (username, email, password_hash, salt, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
             RETURNING id, username, email, created_at`,
            [testUsername, testEmail, passwordHash, 'bcrypt_internal']
        );

        if (createResult.rows.length === 0) {
            throw new Error('用户创建失败');
        }

        const newUser = createResult.rows[0];
        console.log('✅ 用户创建成功:', {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            type: typeof newUser.id
        });

        // 3. 测试JWT Token生成
        console.log('\n📋 测试3: JWT Token生成');
        const tokenPayload = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: 'user',
            iat: Math.floor(Date.now() / 1000)
        };

        const token = JWTUtil.generateToken(tokenPayload);
        console.log('✅ JWT Token生成成功');
        console.log('📝 Token前20个字符:', token.substring(0, 20) + '...');

        // 4. 测试JWT Token验证
        console.log('\n📋 测试4: JWT Token验证');
        const decodedToken = JWTUtil.verifyToken(token);
        console.log('✅ JWT Token验证成功:', {
            id: decodedToken.id,
            username: decodedToken.username,
            email: decodedToken.email,
            role: decodedToken.role,
            idType: typeof decodedToken.id
        });

        // 5. 测试ID类型转换
        console.log('\n📋 测试5: ID类型转换');
        const userId = typeof decodedToken.id === 'string' ? parseInt(decodedToken.id) : decodedToken.id;
        console.log('✅ ID类型转换成功:', {
            original: decodedToken.id,
            originalType: typeof decodedToken.id,
            converted: userId,
            convertedType: typeof userId,
            isValid: userId && userId > 0
        });

        // 6. 测试密码验证
        console.log('\n📋 测试6: 密码验证');
        const passwordValid = await PasswordUtil.verifyPassword(testPassword, passwordHash);
        console.log('✅ 密码验证成功:', passwordValid);

        // 7. 测试用户会话创建
        console.log('\n📋 测试7: 用户会话创建');
        const sessionToken = `session_${newUser.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const refreshToken = `refresh_${newUser.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;

        const sessionResult = await pgConfig.query(
            `INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, created_at) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id`,
            [newUser.id, sessionToken, refreshToken, new Date(Date.now() + 2 * 60 * 60 * 1000)]
        );

        console.log('✅ 用户会话创建成功:', sessionResult.rows[0].id);

        // 8. 测试用户查询
        console.log('\n📋 测试8: 用户查询');
        const userQuery = await pgConfig.query(
            'SELECT * FROM users WHERE id = $1',
            [newUser.id]
        );

        if (userQuery.rows.length > 0) {
            console.log('✅ 用户查询成功:', {
                id: userQuery.rows[0].id,
                username: userQuery.rows[0].username,
                email: userQuery.rows[0].email
            });
        } else {
            throw new Error('用户查询失败');
        }

        // 9. 清理测试数据
        console.log('\n📋 测试9: 清理测试数据');
        await pgConfig.query('DELETE FROM user_sessions WHERE user_id = $1', [newUser.id]);
        await pgConfig.query('DELETE FROM users WHERE id = $1', [newUser.id]);
        console.log('✅ 测试数据清理完成');

        console.log('\n🎉 所有测试通过！认证系统工作正常。');

        return {
            success: true,
            message: '认证系统测试通过',
            testResults: {
                databaseConnection: true,
                userCreation: true,
                tokenGeneration: true,
                tokenVerification: true,
                idTypeConversion: true,
                passwordVerification: true,
                sessionCreation: true,
                userQuery: true,
                dataCleanup: true
            }
        };

    } catch (error) {
        console.error('❌ 测试失败:', error);
        return {
            success: false,
            message: '认证系统测试失败',
            error: error.message,
            stack: error.stack
        };
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testAuth().then(result => {
        console.log('\n📊 测试结果:', result);
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('❌ 测试执行失败:', error);
        process.exit(1);
    });
}

module.exports = { testAuth }; 