#!/bin/bash

# PhoenixCoder 安全密钥生成脚本
# 用于生成强随机密码和密钥

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 生成强随机密码
generate_password() {
    local length=${1:-32}
    # 使用 openssl 生成随机字符串，包含字母、数字和特殊字符
    openssl rand -base64 $((length * 3 / 4)) | tr -d "=+/" | cut -c1-${length}
}

# 生成 JWT 密钥
generate_jwt_secret() {
    local length=${1:-64}
    openssl rand -hex ${length}
}

# 生成 UUID
generate_uuid() {
    if command -v uuidgen >/dev/null 2>&1; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    else
        python3 -c "import uuid; print(str(uuid.uuid4()))"
    fi
}

# 生成数据库密码（不包含特殊字符，避免连接问题）
generate_db_password() {
    local length=${1:-32}
    openssl rand -base64 $((length * 3 / 4)) | tr -d "=+/" | tr -d "\n" | head -c ${length}
}

# 创建 .env 文件
create_env_file() {
    local env_file="$1"
    local template_file="$2"
    
    log_info "创建环境变量文件: $env_file"
    
    # 生成所有需要的密钥
    local db_password=$(generate_db_password 32)
    local redis_password=$(generate_password 32)
    local jwt_secret=$(generate_jwt_secret 64)
    local oidc_client_secret=$(generate_password 48)
    local admin_secret=$(generate_password 32)
    local web_secret=$(generate_password 32)
    local encryption_key=$(generate_jwt_secret 32)
    local session_secret=$(generate_password 32)
    local api_key=$(generate_uuid)
    
    # 创建环境变量文件
    cat > "$env_file" << EOF
# PhoenixCoder 安全环境变量配置
# 生成时间: $(date)
# 警告: 请妥善保管此文件，不要提交到版本控制系统

# 数据库配置
DB_PASSWORD=${db_password}
POSTGRES_PASSWORD=${db_password}
DATABASE_URL=postgresql://phoenixcoder:\${DB_PASSWORD}@localhost:5432/phoenixcoder

# Redis 配置
REDIS_PASSWORD=${redis_password}
REDIS_URL=redis://:\${REDIS_PASSWORD}@localhost:6379/0

# JWT 和加密配置
JWT_SECRET=${jwt_secret}
ENCRYPTION_KEY=${encryption_key}
SESSION_SECRET=${session_secret}

# OIDC 配置
OIDC_CLIENT_SECRET=${oidc_client_secret}
OIDC_ADMIN_SECRET=${admin_secret}
OIDC_WEB_SECRET=${web_secret}

# API 配置
API_KEY=${api_key}
ADMIN_API_KEY=$(generate_uuid)

# 安全配置
SECURE_COOKIE=true
HTTPS_ONLY=true
CSRF_SECRET=$(generate_password 32)

# 文件上传配置
UPLOAD_SECRET=$(generate_password 32)
FILE_ENCRYPTION_KEY=$(generate_jwt_secret 32)

# 邮件配置（如果需要）
MAIL_PASSWORD=your_mail_password_here
SMTP_PASSWORD=your_smtp_password_here

# 第三方服务配置（如果需要）
AWS_SECRET_ACCESS_KEY=your_aws_secret_here
ALIYUN_ACCESS_KEY_SECRET=your_aliyun_secret_here
EOF

    # 设置文件权限
    chmod 600 "$env_file"
    
    log_success "环境变量文件已创建: $env_file"
    log_warning "请确保此文件不会被提交到版本控制系统"
}

# 创建 .env.example 模板
create_env_template() {
    local template_file="$1"
    
    log_info "创建环境变量模板: $template_file"
    
    cat > "$template_file" << EOF
# PhoenixCoder 环境变量模板
# 复制此文件为 .env 并填入实际值
# 使用 security/generate-keys.sh 脚本生成安全的密钥

# 数据库配置
DB_PASSWORD=your_secure_db_password_here
POSTGRES_PASSWORD=\${DB_PASSWORD}
DATABASE_URL=postgresql://phoenixcoder:\${DB_PASSWORD}@localhost:5432/phoenixcoder

# Redis 配置
REDIS_PASSWORD=your_secure_redis_password_here
REDIS_URL=redis://:\${REDIS_PASSWORD}@localhost:6379/0

# JWT 和加密配置
JWT_SECRET=your_jwt_secret_here_at_least_64_chars
ENCRYPTION_KEY=your_encryption_key_here_32_chars
SESSION_SECRET=your_session_secret_here

# OIDC 配置
OIDC_CLIENT_SECRET=your_oidc_client_secret_here
OIDC_ADMIN_SECRET=your_oidc_admin_secret_here
OIDC_WEB_SECRET=your_oidc_web_secret_here

# API 配置
API_KEY=your_api_key_here
ADMIN_API_KEY=your_admin_api_key_here

# 安全配置
SECURE_COOKIE=true
HTTPS_ONLY=true
CSRF_SECRET=your_csrf_secret_here

# 文件上传配置
UPLOAD_SECRET=your_upload_secret_here
FILE_ENCRYPTION_KEY=your_file_encryption_key_here

# 邮件配置（可选）
MAIL_PASSWORD=your_mail_password_here
SMTP_PASSWORD=your_smtp_password_here

# 第三方服务配置（可选）
AWS_SECRET_ACCESS_KEY=your_aws_secret_here
ALIYUN_ACCESS_KEY_SECRET=your_aliyun_secret_here
EOF

    log_success "环境变量模板已创建: $template_file"
}

# 主函数
main() {
    log_info "PhoenixCoder 安全密钥生成工具"
    log_info "================================"
    
    # 检查依赖
    if ! command -v openssl >/dev/null 2>&1; then
        log_error "openssl 未安装，请先安装 openssl"
        exit 1
    fi
    
    # 创建安全目录
    mkdir -p "$(dirname "$0")"
    
    case "${1:-all}" in
        "password")
            echo $(generate_password ${2:-32})
            ;;
        "jwt")
            echo $(generate_jwt_secret ${2:-64})
            ;;
        "uuid")
            echo $(generate_uuid)
            ;;
        "db-password")
            echo $(generate_db_password ${2:-32})
            ;;
        "env")
            create_env_file "${2:-.env}" "${3:-.env.example}"
            ;;
        "template")
            create_env_template "${2:-.env.example}"
            ;;
        "all")
            # 创建所有必要的文件
            create_env_template ".env.example"
            create_env_file ".env.security.local" ".env.example"
            
            log_info "生成的文件:"
            log_info "  - .env.example (模板文件)"
            log_info "  - .env.security.local (实际密钥文件)"
            log_warning "请将 .env.security.local 重命名为 .env 并根据需要调整配置"
            ;;
        "help")
            echo "用法: $0 [命令] [参数]"
            echo "命令:"
            echo "  password [长度]    - 生成密码 (默认32字符)"
            echo "  jwt [长度]         - 生成JWT密钥 (默认64字符)"
            echo "  uuid              - 生成UUID"
            echo "  db-password [长度] - 生成数据库密码 (默认32字符)"
            echo "  env [文件] [模板]  - 创建环境变量文件"
            echo "  template [文件]    - 创建环境变量模板"
            echo "  all               - 创建所有文件 (默认)"
            echo "  help              - 显示此帮助信息"
            ;;
        *)
            log_error "未知命令: $1"
            log_info "使用 '$0 help' 查看帮助信息"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"