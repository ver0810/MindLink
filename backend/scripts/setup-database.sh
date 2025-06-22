#!/bin/bash

# ========================================
# AI导师对话系统 - PostgreSQL数据库一键部署脚本
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查PostgreSQL是否安装
check_postgresql() {
    log_info "检查PostgreSQL安装状态..."
    
    if command_exists psql; then
        PSQL_VERSION=$(psql --version | head -n1)
        log_success "PostgreSQL已安装: $PSQL_VERSION"
        return 0
    else
        log_error "PostgreSQL未安装，请先安装PostgreSQL"
        echo "安装指南:"
        echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
        echo "  macOS: brew install postgresql"
        echo "  Windows: 下载官方安装包"
        exit 1
    fi
}

# 检查Node.js是否安装
check_nodejs() {
    log_info "检查Node.js安装状态..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        log_success "Node.js已安装: $NODE_VERSION"
        return 0
    else
        log_error "Node.js未安装，请先安装Node.js (推荐版本16+)"
        exit 1
    fi
}

# 检查PostgreSQL服务状态
check_postgresql_service() {
    log_info "检查PostgreSQL服务状态..."
    
    # 尝试连接PostgreSQL
    if PGPASSWORD=postgres psql -h localhost -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "PostgreSQL服务正在运行"
        return 0
    else
        log_warning "无法连接PostgreSQL服务"
        echo "请确保:"
        echo "  1. PostgreSQL服务正在运行"
        echo "  2. 可以使用默认用户postgres连接"
        echo ""
        echo "启动服务命令:"
        echo "  Ubuntu/Debian: sudo systemctl start postgresql"
        echo "  macOS: brew services start postgresql"
        echo "  Windows: net start postgresql-x64-13"
        
        read -p "PostgreSQL服务已启动？按回车继续或Ctrl+C退出..."
    fi
}

# 创建数据库和用户
create_database() {
    log_info "创建数据库和用户..."
    
    SETUP_SQL="backend/database/setup-local-postgresql.sql"
    
    if [ ! -f "$SETUP_SQL" ]; then
        log_error "初始化脚本不存在: $SETUP_SQL"
        exit 1
    fi
    
    # 执行数据库初始化脚本
    if PGPASSWORD=postgres psql -h localhost -U postgres -f "$SETUP_SQL"; then
        log_success "数据库和用户创建完成"
    else
        log_error "数据库创建失败"
        exit 1
    fi
}

# 安装Node.js依赖
install_dependencies() {
    log_info "安装Node.js依赖..."
    
    cd backend
    
    if [ ! -f "package.json" ]; then
        log_warning "package.json不存在，创建基础依赖文件..."
        cat > package.json << EOF
{
  "name": "ai-mentor-backend",
  "version": "1.0.0",
  "description": "AI导师对话系统后端",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "db:init": "node config/postgresql.js"
  },
  "dependencies": {
    "pg": "^8.11.3"
  }
}
EOF
    fi
    
    if command_exists npm; then
        npm install
        log_success "依赖安装完成"
    else
        log_error "npm未安装"
        exit 1
    fi
    
    cd ..
}

# 创建环境配置文件
create_env_file() {
    log_info "创建环境配置文件..."
    
    ENV_FILE="backend/.env"
    ENV_EXAMPLE="backend/config/env.example"
    
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE" ]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            log_success "环境配置文件已创建: $ENV_FILE"
        else
            log_warning "环境配置模板不存在，创建默认配置..."
            cat > "$ENV_FILE" << EOF
# AI导师对话系统 - 环境配置
NODE_ENV=development
PORT=3000

# PostgreSQL数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_mentor_system
DB_USER=ai_mentor_user
DB_PASSWORD=ai_mentor_password_2024
DB_DEBUG=false

# JWT配置
JWT_SECRET=your_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d
EOF
            log_success "默认环境配置文件已创建"
        fi
    else
        log_warning "环境配置文件已存在，跳过创建"
    fi
}

# 初始化数据库架构
initialize_database() {
    log_info "初始化数据库架构和数据..."
    
    cd backend
    
    if [ -f "config/postgresql.js" ]; then
        if node config/postgresql.js; then
            log_success "数据库初始化完成"
        else
            log_error "数据库初始化失败"
            exit 1
        fi
    else
        log_error "数据库配置文件不存在: config/postgresql.js"
        exit 1
    fi
    
    cd ..
}

# 验证部署
verify_deployment() {
    log_info "验证数据库部署..."
    
    # 测试数据库连接
    if PGPASSWORD=ai_mentor_password_2024 psql -h localhost -U ai_mentor_user -d ai_mentor_system -c "SELECT COUNT(*) FROM mentors;" >/dev/null 2>&1; then
        MENTOR_COUNT=$(PGPASSWORD=ai_mentor_password_2024 psql -h localhost -U ai_mentor_user -d ai_mentor_system -t -c "SELECT COUNT(*) FROM mentors;" | xargs)
        log_success "数据库连接正常，已导入 $MENTOR_COUNT 个导师"
    else
        log_error "数据库连接测试失败"
        exit 1
    fi
}

# 显示连接信息
show_connection_info() {
    echo ""
    log_success "🎉 PostgreSQL数据库部署完成！"
    echo ""
    echo "📊 数据库连接信息:"
    echo "  主机: localhost"
    echo "  端口: 5432"
    echo "  数据库: ai_mentor_system"
    echo "  用户名: ai_mentor_user"
    echo "  密码: ai_mentor_password_2024"
    echo ""
    echo "🔧 常用命令:"
    echo "  连接数据库: psql -h localhost -U ai_mentor_user -d ai_mentor_system"
    echo "  查看表: \\dt"
    echo "  查看导师: SELECT id, name FROM mentors;"
    echo ""
    echo "📁 相关文件:"
    echo "  环境配置: backend/.env"
    echo "  数据库配置: backend/config/postgresql.js"
    echo "  部署文档: backend/docs/本地PostgreSQL部署指南.md"
    echo ""
}

# 主函数
main() {
    echo "========================================"
    echo "🚀 AI导师对话系统 - PostgreSQL数据库部署"
    echo "========================================"
    echo ""
    
    # 检查前提条件
    check_postgresql
    check_nodejs
    check_postgresql_service
    
    echo ""
    log_info "开始部署流程..."
    echo ""
    
    # 执行部署步骤
    create_database
    install_dependencies
    create_env_file
    initialize_database
    verify_deployment
    
    # 显示完成信息
    show_connection_info
}

# 捕获错误并显示帮助信息
trap 'log_error "部署过程中出现错误，请检查上面的错误信息"' ERR

# 执行主函数
main "$@" 