#!/bin/bash

# PhoenixCoder 密码生成脚本
# 用于生成强密码和密钥

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 检查依赖
check_dependencies() {
    if ! command -v openssl &> /dev/null; then
        echo -e "${RED}错误: openssl 未安装${NC}"
        echo -e "${YELLOW}请安装 openssl: brew install openssl (macOS) 或 apt-get install openssl (Ubuntu)${NC}"
        exit 1
    fi
}

# 生成强密码
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# 生成JWT密钥
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "\n"
}

# 生成OIDC客户端密钥
generate_oidc_secret() {
    openssl rand -hex 32
}

# Base64编码
base64_encode() {
    echo -n "$1" | base64 | tr -d "\n"
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}PhoenixCoder 密码生成脚本${NC}"
    echo -e "用法: $0 [命令]\n"
    echo -e "命令:\n"
    echo -e "  generate-all     生成所有密码和密钥"
    echo -e "  generate-env     生成环境变量文件"
    echo -e "  generate-k8s     生成Kubernetes密钥文件"
    echo -e "  password [长度]  生成指定长度的密码（默认32位）"
    echo -e "  jwt              生成JWT密钥"
    echo -e "  oidc             生成OIDC客户端密钥"
    echo -e "  help             显示帮助信息"
}

# 生成所有密码
generate_all_passwords() {
    echo -e "${GREEN}正在生成所有密码和密钥...${NC}\n"
    
    # 生成密码
    SUDO_PASSWORD=$(generate_password 16)
    DB_PASSWORD=$(generate_password 32)
    DB_ROOT_PASSWORD=$(generate_password 32)
    REDIS_PASSWORD=$(generate_password 32)
    JWT_SECRET=$(generate_jwt_secret)
    OIDC_CLIENT_SECRET=$(generate_oidc_secret)
    
    echo -e "${BLUE}生成的密码和密钥:${NC}"
    echo -e "SUDO_PASSWORD: ${YELLOW}$SUDO_PASSWORD${NC}"
    echo -e "DB_PASSWORD: ${YELLOW}$DB_PASSWORD${NC}"
    echo -e "DB_ROOT_PASSWORD: ${YELLOW}$DB_ROOT_PASSWORD${NC}"
    echo -e "REDIS_PASSWORD: ${YELLOW}$REDIS_PASSWORD${NC}"
    echo -e "JWT_SECRET: ${YELLOW}$JWT_SECRET${NC}"
    echo -e "OIDC_CLIENT_SECRET: ${YELLOW}$OIDC_CLIENT_SECRET${NC}\n"
    
    echo -e "${GREEN}请将这些密码保存到安全的地方！${NC}"
}

# 生成环境变量文件
generate_env_file() {
    echo -e "${GREEN}正在生成环境变量文件...${NC}"
    
    # 生成密码
    SUDO_PASSWORD=$(generate_password 16)
    DB_PASSWORD=$(generate_password 32)
    DB_ROOT_PASSWORD=$(generate_password 32)
    REDIS_PASSWORD=$(generate_password 32)
    JWT_SECRET=$(generate_jwt_secret)
    OIDC_CLIENT_SECRET=$(generate_oidc_secret)
    
    # 创建环境变量文件
    cat > .env.security.local << EOF
# PhoenixCoder 安全配置文件 - 生产环境
# 生成时间: $(date)
# 警告：此文件包含敏感信息，请妥善保管

# 服务器sudo密码
SUDO_PASSWORD="$SUDO_PASSWORD"

# 数据库密码
DB_PASSWORD="$DB_PASSWORD"
DB_ROOT_PASSWORD="$DB_ROOT_PASSWORD"
POSTGRES_PASSWORD="$DB_PASSWORD"

# JWT密钥
JWT_SECRET_KEY="$JWT_SECRET"

# OIDC客户端密钥
OIDC_CLIENT_SECRET="$OIDC_CLIENT_SECRET"

# Redis密码
REDIS_PASSWORD="$REDIS_PASSWORD"
EOF
    
    echo -e "${GREEN}环境变量文件已生成: .env.security.local${NC}"
    echo -e "${YELLOW}请确保此文件不会被提交到版本控制系统${NC}"
}

# 生成Kubernetes密钥文件
generate_k8s_secrets() {
    echo -e "${GREEN}正在生成Kubernetes密钥文件...${NC}"
    
    # 生成密码
    DB_PASSWORD=$(generate_password 32)
    REDIS_PASSWORD=$(generate_password 32)
    JWT_SECRET=$(generate_jwt_secret)
    OIDC_CLIENT_SECRET=$(generate_oidc_secret)
    
    # Base64编码
    DB_PASSWORD_B64=$(base64_encode "$DB_PASSWORD")
    REDIS_PASSWORD_B64=$(base64_encode "$REDIS_PASSWORD")
    JWT_SECRET_B64=$(base64_encode "$JWT_SECRET")
    OIDC_CLIENT_SECRET_B64=$(base64_encode "$OIDC_CLIENT_SECRET")
    
    # 创建Kubernetes密钥文件
    cat > k8s/configmaps/app-config-secure.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: phoenixcoder-config
  namespace: phoenixcoder
data:
  # PostgreSQL配置
  POSTGRES_HOST: "postgresql.default.svc.cluster.local"
  POSTGRES_PORT: "5432"
  POSTGRES_DB: "phoenixcoder"
  POSTGRES_USER: "postgres"
  
  # Redis配置
  REDIS_HOST: "redis-master.default.svc.cluster.local"
  REDIS_PORT: "6379"
  
  # OIDC服务配置
  OIDC_ISSUER: "http://phoenixcoder-oidc-server.phoenixcoder.svc.cluster.local:8000"
  OIDC_CLIENT_ID: "phoenixcoder-client"
  OIDC_REDIRECT_URI: "http://phoenixcoder-admin.phoenixcoder.svc.cluster.local/auth/callback"
  
  # 应用环境
  APP_ENV: "production"
  DEBUG: "false"
  
  # 前端配置
  REACT_APP_API_URL: "http://phoenixcoder-server.phoenixcoder.svc.cluster.local:8000"
  REACT_APP_OIDC_ISSUER: "http://phoenixcoder-oidc-server.phoenixcoder.svc.cluster.local:8000"
  REACT_APP_CLIENT_ID: "phoenixcoder-admin"
---
apiVersion: v1
kind: Secret
metadata:
  name: phoenixcoder-secrets
  namespace: phoenixcoder
type: Opaque
data:
  # 强密码（Base64编码）
  POSTGRES_PASSWORD: $DB_PASSWORD_B64
  REDIS_PASSWORD: $REDIS_PASSWORD_B64
  JWT_SECRET: $JWT_SECRET_B64
  OIDC_CLIENT_SECRET: $OIDC_CLIENT_SECRET_B64
EOF
    
    echo -e "${GREEN}Kubernetes密钥文件已生成: k8s/configmaps/app-config-secure.yaml${NC}"
    echo -e "${YELLOW}原始密码（请保存）:${NC}"
    echo -e "POSTGRES_PASSWORD: $DB_PASSWORD"
    echo -e "REDIS_PASSWORD: $REDIS_PASSWORD"
    echo -e "JWT_SECRET: $JWT_SECRET"
    echo -e "OIDC_CLIENT_SECRET: $OIDC_CLIENT_SECRET"
}

# 主函数
main() {
    check_dependencies
    
    case ${1:-help} in
        generate-all)
            generate_all_passwords
            ;;
        generate-env)
            generate_env_file
            ;;
        generate-k8s)
            generate_k8s_secrets
            ;;
        password)
            length=${2:-32}
            echo "$(generate_password $length)"
            ;;
        jwt)
            echo "$(generate_jwt_secret)"
            ;;
        oidc)
            echo "$(generate_oidc_secret)"
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"