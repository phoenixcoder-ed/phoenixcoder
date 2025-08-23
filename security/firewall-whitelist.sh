#!/bin/bash

# 防火墙IP白名单配置脚本
# 用于配置UFW防火墙规则，限制关键服务的访问

set -e

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

# 检查是否以root权限运行
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "此脚本不应以root权限运行，请使用普通用户执行"
        exit 1
    fi
}

# 检查UFW是否安装
check_ufw() {
    if ! command -v ufw &> /dev/null; then
        log_error "UFW未安装，请先安装UFW防火墙"
        exit 1
    fi
}

# 加载环境变量
load_env() {
    if [[ -f ".env.security.local" ]]; then
        source .env.security.local
        log_info "已加载安全配置文件"
    else
        log_error "未找到.env.security.local文件，请先运行generate-passwords.sh"
        exit 1
    fi

    if [[ -z "$SUDO_PASSWORD" ]]; then
        log_error "SUDO_PASSWORD未设置，请检查.env.security.local文件"
        exit 1
    fi
}

# 定义授权IP地址列表
# 可以根据实际需求修改这些IP地址
AUTHORIZED_IPS=(
    "192.168.3.0/24"     # 本地网络段
    "10.0.0.0/8"         # 私有网络段
    "172.16.0.0/12"      # 私有网络段
    # "203.0.113.0/24"   # 示例：公司外网IP段
    # "198.51.100.50"    # 示例：特定管理员IP
)

# 定义需要保护的服务端口
PROTECTED_PORTS=(
    "22"      # SSH
    "8001"    # API服务
    "8000"    # OIDC服务
    "3000"    # 管理界面
    "32000"   # Docker Registry
)

# 备份当前UFW规则
backup_ufw_rules() {
    local backup_dir="security/backups"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="${backup_dir}/ufw_rules_${timestamp}.backup"
    
    mkdir -p "$backup_dir"
    
    log_info "备份当前UFW规则到 $backup_file"
    echo "$SUDO_PASSWORD" | sudo -S ufw --dry-run status numbered > "$backup_file" 2>/dev/null || true
    echo "$SUDO_PASSWORD" | sudo -S iptables-save >> "$backup_file" 2>/dev/null || true
    
    log_success "UFW规则已备份"
}

# 重置UFW规则（可选）
reset_ufw_rules() {
    log_warning "重置所有UFW规则..."
    echo "$SUDO_PASSWORD" | sudo -S ufw --force reset
    log_success "UFW规则已重置"
}

# 配置基础UFW策略
configure_basic_policy() {
    log_info "配置基础UFW策略..."
    
    # 设置默认策略
    echo "$SUDO_PASSWORD" | sudo -S ufw default deny incoming
    echo "$SUDO_PASSWORD" | sudo -S ufw default allow outgoing
    
    # 允许本地回环
    echo "$SUDO_PASSWORD" | sudo -S ufw allow in on lo
    echo "$SUDO_PASSWORD" | sudo -S ufw allow out on lo
    
    log_success "基础策略配置完成"
}

# 配置IP白名单规则
configure_whitelist_rules() {
    log_info "配置IP白名单规则..."
    
    for port in "${PROTECTED_PORTS[@]}"; do
        log_info "配置端口 $port 的访问规则..."
        
        # 首先拒绝所有对该端口的访问
        echo "$SUDO_PASSWORD" | sudo -S ufw deny "$port"
        
        # 然后只允许授权IP访问
        for ip in "${AUTHORIZED_IPS[@]}"; do
            echo "$SUDO_PASSWORD" | sudo -S ufw allow from "$ip" to any port "$port"
            log_info "已允许 $ip 访问端口 $port"
        done
    done
    
    log_success "IP白名单规则配置完成"
}

# 配置额外的安全规则
configure_security_rules() {
    log_info "配置额外的安全规则..."
    
    # 限制SSH连接尝试（防止暴力破解）
    echo "$SUDO_PASSWORD" | sudo -S ufw limit ssh
    
    # 允许HTTP和HTTPS（如果需要）
    # echo "$SUDO_PASSWORD" | sudo -S ufw allow 80
    # echo "$SUDO_PASSWORD" | sudo -S ufw allow 443
    
    # 拒绝常见的攻击端口
    local attack_ports=("23" "135" "139" "445" "1433" "3389")
    for port in "${attack_ports[@]}"; do
        echo "$SUDO_PASSWORD" | sudo -S ufw deny "$port"
    done
    
    log_success "安全规则配置完成"
}

# 启用UFW防火墙
enable_ufw() {
    log_info "启用UFW防火墙..."
    echo "$SUDO_PASSWORD" | sudo -S ufw --force enable
    log_success "UFW防火墙已启用"
}

# 显示当前UFW状态
show_ufw_status() {
    log_info "当前UFW防火墙状态："
    echo "$SUDO_PASSWORD" | sudo -S ufw status numbered
}

# 测试网络连接
test_connections() {
    log_info "测试网络连接..."
    
    # 测试SSH连接
    if nc -z localhost 22 2>/dev/null; then
        log_success "SSH端口(22)可访问"
    else
        log_warning "SSH端口(22)不可访问"
    fi
    
    # 测试其他服务端口
    for port in "8001" "8000" "3000"; do
        if nc -z localhost "$port" 2>/dev/null; then
            log_success "端口 $port 可访问"
        else
            log_warning "端口 $port 不可访问（可能服务未启动）"
        fi
    done
}

# 添加新的授权IP
add_authorized_ip() {
    local new_ip="$1"
    if [[ -z "$new_ip" ]]; then
        log_error "请提供要添加的IP地址"
        return 1
    fi
    
    log_info "添加新的授权IP: $new_ip"
    
    for port in "${PROTECTED_PORTS[@]}"; do
        echo "$SUDO_PASSWORD" | sudo -S ufw allow from "$new_ip" to any port "$port"
        log_info "已允许 $new_ip 访问端口 $port"
    done
    
    log_success "IP $new_ip 已添加到白名单"
}

# 移除授权IP
remove_authorized_ip() {
    local remove_ip="$1"
    if [[ -z "$remove_ip" ]]; then
        log_error "请提供要移除的IP地址"
        return 1
    fi
    
    log_info "移除授权IP: $remove_ip"
    
    for port in "${PROTECTED_PORTS[@]}"; do
        echo "$SUDO_PASSWORD" | sudo -S ufw delete allow from "$remove_ip" to any port "$port" 2>/dev/null || true
        log_info "已移除 $remove_ip 对端口 $port 的访问权限"
    done
    
    log_success "IP $remove_ip 已从白名单移除"
}

# 显示帮助信息
show_help() {
    echo "防火墙IP白名单配置脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  setup           - 完整设置防火墙白名单（推荐）"
    echo "  reset           - 重置所有UFW规则"
    echo "  backup          - 备份当前UFW规则"
    echo "  status          - 显示当前防火墙状态"
    echo "  test            - 测试网络连接"
    echo "  add-ip <IP>     - 添加新的授权IP到白名单"
    echo "  remove-ip <IP>  - 从白名单移除IP"
    echo "  help            - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 setup                    # 完整设置防火墙白名单"
    echo "  $0 add-ip 203.0.113.50     # 添加新IP到白名单"
    echo "  $0 remove-ip 203.0.113.50  # 从白名单移除IP"
}

# 主函数
main() {
    local action="${1:-help}"
    
    case "$action" in
        "setup")
            check_root
            check_ufw
            load_env
            backup_ufw_rules
            configure_basic_policy
            configure_whitelist_rules
            configure_security_rules
            enable_ufw
            show_ufw_status
            test_connections
            log_success "防火墙IP白名单配置完成！"
            ;;
        "reset")
            check_root
            check_ufw
            load_env
            backup_ufw_rules
            reset_ufw_rules
            ;;
        "backup")
            check_root
            load_env
            backup_ufw_rules
            ;;
        "status")
            check_ufw
            load_env
            show_ufw_status
            ;;
        "test")
            test_connections
            ;;
        "add-ip")
            check_root
            check_ufw
            load_env
            add_authorized_ip "$2"
            ;;
        "remove-ip")
            check_root
            check_ufw
            load_env
            remove_authorized_ip "$2"
            ;;
        "help")
            show_help
            ;;
        *)
            log_error "未知选项: $action"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"