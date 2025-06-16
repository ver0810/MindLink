@echo off
echo 🚀 启动用户认证后端服务...
echo.
cd /d "%~dp0"
echo 📁 当前目录: %CD%
echo.
echo 💾 检查数据库连接...
node -e "require('./utils/database')"
echo.
echo 🌐 启动服务器...
echo 📍 服务地址: http://localhost:3000
echo 💓 健康检查: http://localhost:3000/health
echo 🔗 API接口: http://localhost:3000/api/auth
echo.
echo 按 Ctrl+C 停止服务器
echo =====================================
node server.js 