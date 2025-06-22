#!/bin/bash

# ========================================
# Docker PostgreSQL 部署脚本
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# 检查Docker是否安装
check_docker() {
    log_info "检查Docker安装状态..."
    
    if command -v docker >/dev/null 2>&1; then
        log_success "Docker已安装: $(docker --version)"
        
        # 检查Docker服务是否运行
        if docker info >/dev/null 2>&1; then
            log_success "Docker服务正在运行"
        else
            log_error "Docker服务未运行，请启动Docker"
            exit 1
        fi
    else
        log_error "Docker未安装"
        echo "请安装Docker:"
        echo "  官方网站: https://www.docker.com/get-started"
        exit 1
    fi
    
    if command -v docker-compose >/dev/null 2>&1; then
        log_success "Docker Compose已安装: $(docker-compose --version)"
    else
        log_warning "Docker Compose未找到，将使用docker compose"
    fi
}

# 启动PostgreSQL容器
start_postgres() {
    log_info "启动PostgreSQL容器..."
    
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose -f backend/docker-compose.simple.yml up -d
    else
        docker compose -f backend/docker-compose.simple.yml up -d
    fi
    
    log_success "PostgreSQL容器启动完成"
}

# 等待PostgreSQL就绪
wait_for_postgres() {
    log_info "等待PostgreSQL服务就绪..."
    
    for i in {1..30}; do
        if docker exec ai_mentor_postgres_simple pg_isready -U ai_mentor_user -d ai_mentor_system >/dev/null 2>&1; then
            log_success "PostgreSQL服务已就绪"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    log_error "PostgreSQL服务启动超时"
    exit 1
}

# 执行SQL脚本
execute_sql() {
    log_info "初始化数据库架构..."
    
    # 将SQL文件复制到容器中并执行
    docker cp backend/database/postgresql-schema.sql ai_mentor_postgres_simple:/tmp/schema.sql
    
    if docker exec ai_mentor_postgres_simple psql -U ai_mentor_user -d ai_mentor_system -f /tmp/schema.sql; then
        log_success "数据库架构初始化完成"
    else
        log_error "数据库架构初始化失败"
        exit 1
    fi
}

# 导入导师数据
import_mentors() {
    log_info "导入导师数据..."
    
    cd backend
    
    # 安装Node.js依赖
    if [ ! -d "node_modules" ]; then
        npm install pg
    fi
    
    # 使用Docker PostgreSQL的连接信息
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_NAME=ai_mentor_system
    export DB_USER=ai_mentor_user
    export DB_PASSWORD=ai_mentor_password_2024
    
    # 只运行导师数据导入部分
    node -e "
        const { pool, importMentorsData } = require('./config/postgresql');
        
        async function importOnly() {
            try {
                const { importMentorsData } = require('./config/postgresql');
                // 直接调用导师数据导入函数
                console.log('🚀 开始导入导师数据...');
                
                const fs = require('fs');
                const path = require('path');
                const mentorsPath = path.join(__dirname, '../assets/data/mentors.js');
                const mentorsFileContent = fs.readFileSync(mentorsPath, 'utf8');
                const mentorsMatch = mentorsFileContent.match(/const mentors = (\[[\s\S]*?\]);/);
                
                if (!mentorsMatch) {
                    console.warn('⚠️  无法解析导师数据');
                    return;
                }
                
                let mentors = [];
                try {
                    mentors = JSON.parse(mentorsMatch[1]);
                } catch (e) {
                    mentors = eval(mentorsMatch[1]);
                }
                
                console.log(\`📥 准备导入 \${mentors.length} 个导师数据...\`);
                
                const client = await pool.connect();
                
                for (const mentor of mentors) {
                    const query = \`
                        INSERT INTO mentors (
                            id, name, title, avatar_url, short_bio, bio, 
                            expertise, featured, suggested_questions, 
                            personality_config, is_active, display_order
                        ) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11, \$12)
                        ON CONFLICT (id) DO UPDATE SET
                            name = EXCLUDED.name,
                            title = EXCLUDED.title,
                            avatar_url = EXCLUDED.avatar_url,
                            short_bio = EXCLUDED.short_bio,
                            bio = EXCLUDED.bio,
                            expertise = EXCLUDED.expertise,
                            featured = EXCLUDED.featured,
                            suggested_questions = EXCLUDED.suggested_questions,
                            updated_at = CURRENT_TIMESTAMP
                    \`;
                    
                    const values = [
                        mentor.id,
                        mentor.name,
                        mentor.title,
                        mentor.avatar,
                        mentor.shortBio,
                        mentor.bio,
                        mentor.expertise || [],
                        mentor.featured || false,
                        JSON.stringify(mentor.suggestedQuestions || []),
                        JSON.stringify({}),
                        true,
                        mentor.featured ? 1 : 99
                    ];
                    
                    await client.query(query, values);
                    console.log(\`   ✅ 导入导师: \${mentor.name}\`);
                }
                
                client.release();
                console.log('🎉 导师数据导入完成!');
                process.exit(0);
            } catch (err) {
                console.error('❌ 导师数据导入失败:', err.message);
                process.exit(1);
            }
        }
        
        importOnly();
    "
    
    cd ..
}

# 验证部署
verify_deployment() {
    log_info "验证数据库部署..."
    
    MENTOR_COUNT=$(docker exec ai_mentor_postgres_simple psql -U ai_mentor_user -d ai_mentor_system -t -c "SELECT COUNT(*) FROM mentors;" | xargs)
    
    if [ "$MENTOR_COUNT" -gt 0 ]; then
        log_success "数据库验证成功，已导入 $MENTOR_COUNT 个导师"
    else
        log_error "数据库验证失败"
        exit 1
    fi
}

# 创建环境配置
create_env() {
    log_info "创建环境配置文件..."
    
    if [ ! -f "backend/.env" ]; then
        cp backend/config/env.example backend/.env
        log_success "环境配置文件已创建"
    else
        log_warning "环境配置文件已存在"
    fi
}

# 显示完成信息
show_completion() {
    echo ""
    log_success "🎉 Docker PostgreSQL部署完成！"
    echo ""
    echo "📊 连接信息:"
    echo "  主机: localhost"
    echo "  端口: 5432"
    echo "  数据库: ai_mentor_system"
    echo "  用户名: ai_mentor_user"
    echo "  密码: ai_mentor_password_2024"
    echo ""
    echo "🐳 Docker 管理命令:"
    echo "  查看状态: docker ps"
    echo "  查看日志: docker logs ai_mentor_postgres_simple"
    echo "  停止服务: docker-compose -f backend/docker-compose.simple.yml down"
    echo "  重启服务: docker-compose -f backend/docker-compose.simple.yml restart"
    echo ""
    echo "🔧 数据库连接:"
    echo "  直接连接: docker exec -it ai_mentor_postgres_simple psql -U ai_mentor_user -d ai_mentor_system"
    echo "  本地连接: 安装PostgreSQL客户端后使用 psql -h localhost -U ai_mentor_user -d ai_mentor_system"
    echo ""
}

# 主函数
main() {
    echo "========================================"
    echo "🐳 Docker PostgreSQL 快速部署"
    echo "========================================"
    echo ""
    
    check_docker
    start_postgres
    wait_for_postgres
    execute_sql
    import_mentors
    verify_deployment
    create_env
    show_completion
}

# 捕获错误
trap 'log_error "部署过程中出现错误，请检查上面的错误信息"' ERR

main "$@" 