#!/bin/bash

# 服务检查脚本 - 验证MicroK8s基础服务可访问性
# 用途：检查PostgreSQL和Redis服务是否可以从本地开发环境访问
# 服务器：192.168.3.30

set -e

echo "=== MicroK8s基础服务连通性检查脚本 ==="
echo "检查PostgreSQL和Redis服务的可访问性"
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SERVER_IP="192.168.3.30"
POSTGRES_PORT="30432"
REDIS_PORT="30379"
TIMEOUT="5"

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

# 检查网络连通性
check_network_connectivity() {
    log_info "检查服务器网络连通性..."
    
    if ping -c 3 -W 3 "$SERVER_IP" > /dev/null 2>&1; then
        log_success "服务器 $SERVER_IP 网络连通正常"
        return 0
    else
        log_error "服务器 $SERVER_IP 网络不通"
        return 1
    fi
}

# 检查端口连通性
check_port_connectivity() {
    local host=$1
    local port=$2
    local service_name=$3
    
    log_info "检查 $service_name 端口连通性 ($host:$port)..."
    
    # 使用nc检查端口
    if command -v nc &> /dev/null; then
        if timeout "$TIMEOUT" nc -z "$host" "$port" 2>/dev/null; then
            log_success "$service_name 端口 $port 连通正常"
            return 0
        else
            log_error "$service_name 端口 $port 连接失败"
            return 1
        fi
    # 使用telnet检查端口
    elif command -v telnet &> /dev/null; then
        if timeout "$TIMEOUT" telnet "$host" "$port" </dev/null 2>/dev/null | grep -q "Connected"; then
            log_success "$service_name 端口 $port 连通正常"
            return 0
        else
            log_error "$service_name 端口 $port 连接失败"
            return 1
        fi
    else
        log_warning "nc和telnet都不可用，跳过端口检查"
        return 2
    fi
}

# 检查PostgreSQL连接
check_postgresql_connection() {
    log_info "检查PostgreSQL数据库连接..."
    
    # 检查psql是否可用
    if ! command -v psql &> /dev/null; then
        log_warning "psql客户端未安装，跳过PostgreSQL连接测试"
        log_info "安装PostgreSQL客户端: brew install postgresql (macOS) 或 apt-get install postgresql-client (Ubuntu)"
        return 2
    fi
    
    # 从环境变量或默认值获取数据库连接信息
    local db_host=${DB_HOST:-$SERVER_IP}
    local db_port=${DB_PORT:-$POSTGRES_PORT}
    local db_name=${DB_NAME:-"postgres"}
    local db_user=${DB_USER:-"postgres"}
    
    log_info "尝试连接PostgreSQL: $db_host:$db_port/$db_name (用户: $db_user)"
    
    # 尝试连接数据库（需要密码时会提示）
    if timeout "$TIMEOUT" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -c "SELECT version();" > /dev/null 2>&1; then
        log_success "PostgreSQL数据库连接成功"
        return 0
    else
        log_error "PostgreSQL数据库连接失败"
        log_info "请检查数据库凭据或运行: psql -h $db_host -p $db_port -U $db_user -d $db_name"
        return 1
    fi
}

# 检查Redis连接
check_redis_connection() {
    log_info "检查Redis连接..."
    
    # 检查redis-cli是否可用
    if ! command -v redis-cli &> /dev/null; then
        log_warning "redis-cli客户端未安装，跳过Redis连接测试"
        log_info "安装Redis客户端: brew install redis (macOS) 或 apt-get install redis-tools (Ubuntu)"
        return 2
    fi
    
    # 从环境变量或默认值获取Redis连接信息
    local redis_host=${REDIS_HOST:-$SERVER_IP}
    local redis_port=${REDIS_PORT:-$REDIS_PORT}
    local redis_password=${REDIS_PASSWORD:-""}
    
    log_info "尝试连接Redis: $redis_host:$redis_port"
    
    # 构建redis-cli命令
    local redis_cmd="redis-cli -h $redis_host -p $redis_port"
    if [[ -n "$redis_password" ]]; then
        redis_cmd="$redis_cmd -a $redis_password"
    fi
    
    # 尝试连接Redis
    if timeout "$TIMEOUT" $redis_cmd ping > /dev/null 2>&1; then
        log_success "Redis连接成功"
        return 0
    else
        log_error "Redis连接失败"
        log_info "请检查Redis配置或运行: $redis_cmd"
        return 1
    fi
}

# 检查MicroK8s服务状态（远程）
check_microk8s_services() {
    log_info "检查MicroK8s服务状态..."
    
    # 检查是否可以SSH到服务器
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes edward@"$SERVER_IP" exit 2>/dev/null; then
        log_warning "无法SSH到服务器，跳过MicroK8s服务检查"
        log_info "请确保SSH密钥配置正确: ssh edward@$SERVER_IP"
        return 2
    fi
    
    # 检查PostgreSQL NodePort服务
    if ssh edward@"$SERVER_IP" 'microk8s kubectl get service postgresql-nodeport -n default' > /dev/null 2>&1; then
        log_success "PostgreSQL NodePort服务存在"
    else
        log_error "PostgreSQL NodePort服务不存在"
        log_info "请运行服务器配置脚本: ./server-setup.sh"
    fi
    
    # 检查Redis NodePort服务
    if ssh edward@"$SERVER_IP" 'microk8s kubectl get service redis-nodeport -n default' > /dev/null 2>&1; then
        log_success "Redis NodePort服务存在"
    else
        log_error "Redis NodePort服务不存在"
        log_info "请运行服务器配置脚本: ./server-setup.sh"
    fi
}

# 显示环境配置建议
show_env_config() {
    log_info "=== 环境配置建议 ==="
    
    echo
    echo "更新本地 .env.community 文件:"
    echo "# 数据库配置"
    echo "DB_HOST=$SERVER_IP"
    echo "DB_PORT=$POSTGRES_PORT"
    echo "DB_NAME=your_database_name"
    echo "DB_USER=your_username"
    echo "DB_PASSWORD=your_password"
    echo
    echo "# Redis配置"
    echo "REDIS_HOST=$SERVER_IP"
    echo "REDIS_PORT=$REDIS_PORT"
    echo "REDIS_PASSWORD=your_redis_password"
    echo
    echo "测试连接命令:"
    echo "PostgreSQL: psql -h $SERVER_IP -p $POSTGRES_PORT -U your_username -d your_database"
    echo "Redis: redis-cli -h $SERVER_IP -p $REDIS_PORT"
    echo
}

# 故障排除建议
show_troubleshooting() {
    log_info "=== 故障排除建议 ==="
    
    echo
    echo "如果连接失败，请检查:"
    echo "1. 网络连通性: ping $SERVER_IP"
    echo "2. 防火墙规则: sudo ufw status"
    echo "3. MicroK8s服务状态: microk8s kubectl get services -n default"
    echo "4. NodePort服务: microk8s kubectl get service postgresql-nodeport redis-nodeport -n default"
    echo "5. Pod状态: microk8s kubectl get pods -n default"
    echo
    echo "常见解决方案:"
    echo "- 运行服务器配置脚本: ./server-setup.sh"
    echo "- 检查UFW防火墙: sudo ufw allow 30432/tcp && sudo ufw allow 30379/tcp"
    echo "- 重启MicroK8s: microk8s stop && microk8s start"
    echo
}

# 主函数
main() {
    local exit_code=0
    
    log_info "开始检查MicroK8s基础服务连通性..."
    echo "服务器: $SERVER_IP"
    echo "PostgreSQL端口: $POSTGRES_PORT"
    echo "Redis端口: $REDIS_PORT"
    echo
    
    # 检查网络连通性
    if ! check_network_connectivity; then
        exit_code=1
    fi
    
    # 检查MicroK8s服务状态
    check_microk8s_services
    
    # 检查端口连通性
    if ! check_port_connectivity "$SERVER_IP" "$POSTGRES_PORT" "PostgreSQL"; then
        exit_code=1
    fi
    
    if ! check_port_connectivity "$SERVER_IP" "$REDIS_PORT" "Redis"; then
        exit_code=1
    fi
    
    # 检查服务连接
    check_postgresql_connection
    check_redis_connection
    
    echo
    if [[ $exit_code -eq 0 ]]; then
        log_success "所有基础服务连通性检查通过！"
    else
        log_error "部分服务连通性检查失败"
    fi
    
    show_env_config
    show_troubleshooting
    
    exit $exit_code
}

# 执行主函数
main "$@"