/**
 * 快速API测试脚本
 */

const http = require('http');

function testAPI() {
    console.log('测试API服务器状态...\n');

    // 测试服务器健康状态
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/health',
        method: 'GET',
        timeout: 5000
    };

    const req = http.request(options, (res) => {
        console.log(`✅ 服务器状态: ${res.statusCode}`);
        console.log('🎉 API服务器正在运行！');
        console.log('\n现在可以测试dashboard页面的对话分析功能了：');
        console.log('1. 打开 http://localhost:3000/pages/dashboard.html#conversations');
        console.log('2. 点击"一键分析"按钮测试分析功能');
        console.log('3. 查看对话卡片中的AI总结和标签显示');
    });

    req.on('error', (err) => {
        console.log('❌ 服务器未启动或连接失败:', err.message);
        console.log('请先启动服务器: npm start');
    });

    req.on('timeout', () => {
        console.log('⏰ 请求超时，服务器可能正在启动中...');
        req.destroy();
    });

    req.end();
}

testAPI(); 