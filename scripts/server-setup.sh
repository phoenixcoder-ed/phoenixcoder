#!/bin/bash

# 服务器配置脚本 - 配置MicroK8s基础服务外部访问
# 用途：使PostgreSQL和Redis服务可以被本地开发环境访问
# 服务器：192.168.3.30
# 用户：edward

set -e

echo "=== MicroK8s基础服务外部访问配置脚本 ==="
echo "配置PostgreSQL (5432) 和 Redis (6379) 外部访问"
echo

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要以root用户运行此脚本"
        exit 1
    fi
}

# 检查MicroK8s状态
check_microk8s() {
    log_info "检查MicroK8s状态..."
    if ! command -v microk8s &> /dev/null; then
        log_error "MicroK8s未安装"
        exit 1
    fi
    
    if ! microk8s status --wait-ready --timeout 30; then
        log_error "MicroK8s未就绪"
        exit 1
    fi
    
    log_success "MicroK8s状态正常"
}

# 检查现有服务
check_existing_services() {
    log_info "检查现有服务状态..."
    
    # 检查PostgreSQL
    if microk8s kubectl get service postgresql -n default &> /dev/null; then
        log_success "PostgreSQL服务已存在"
    else
        log_error "PostgreSQL服务不存在"
        exit 1
    fi
    
    # 检查Redis
    if microk8s kubectl get service redis-master -n default &> /dev/null; then
        log_success "Redis服务已存在"
    else
        log_error "Redis服务不存在"
        exit 1
    fi
}

# 创建NodePort服务
create_nodeport_services() {
    log_info "创建NodePort服务以暴露PostgreSQL和Redis..."
    
    # PostgreSQL NodePort服务
    cat <<EOF | microk8s kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: postgresql-nodeport
  namespace: default
  labels:
    app: postgresql-external
spec:
  type: NodePort
  ports:
  - port: 5432
    targetPort: 5432
    nodePort: 30432
    protocol: TCP
    name: postgresql
  selector:
    app.kubernetes.io/component: primary
    app.kubernetes.io/instance: postgresql
    app.kubernetes.io/name: postgresql
EOF

    # Redis NodePort服务
    cat <<EOF | microk8s kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: redis-nodeport
  namespace: default
  labels:
    app: redis-external
spec:
  type: NodePort
  ports:
  - port: 6379
    targetPort: 6379
    nodePort: 30379
    protocol: TCP
    name: redis
  selector:
    app.kubernetes.io/component: master
    app.kubernetes.io/instance: redis
    app.kubernetes.io/name: redis
EOF

    log_success "NodePort服务创建完成"
}

# 配置UFW防火墙规则
configure_firewall() {
    log_info "配置UFW防火墙规则..."
    
    # 检查UFW状态
    if ! command -v ufw &> /dev/null; then
        log_error "UFW未安装"
        exit 1
    fi
    
    # 允许PostgreSQL NodePort (30432)
    sudo ufw allow 30432/tcp comment "PostgreSQL NodePort for development"
    log_success "已允许PostgreSQL端口30432"
    
    # 允许Redis NodePort (30379)
    sudo ufw allow 30379/tcp comment "Redis NodePort for development"
    log_success "已允许Redis端口30379"
    
    # 显示UFW状态
    log_info "当前UFW规则:"
    sudo ufw status numbered
}

# 验证服务可访问性
verify_services() {
    log_info "验证服务可访问性..."
    
    # 获取节点IP
    NODE_IP=$(hostname -I | awk '{print $1}')
    log_info "节点IP: $NODE_IP"
    
    # 检查PostgreSQL NodePort
    if microk8s kubectl get service postgresql-nodeport -n default &> /dev/null; then
        POSTGRES_NODEPORT=$(microk8s kubectl get service postgresql-nodeport -n default -o jsonpath='{.spec.ports[0].nodePort}')
        log_success "PostgreSQL可通过 $NODE_IP:$POSTGRES_NODEPORT 访问"
    else
        log_error "PostgreSQL NodePort服务创建失败"
    fi
    
    # 检查Redis NodePort
    if microk8s kubectl get service redis-nodeport -n default &> /dev/null; then
        REDIS_NODEPORT=$(microk8s kubectl get service redis-nodeport -n default -o jsonpath='{.spec.ports[0].nodePort}')
        log_success "Redis可通过 $NODE_IP:$REDIS_NODEPORT 访问"
    else
        log_error "Redis NodePort服务创建失败"
    fi
}

# 显示连接信息
show_connection_info() {
    log_info "=== 连接信息 ==="
    
    NODE_IP=$(hostname -I | awk '{print $1}')
    
    echo
    echo "本地开发环境配置:"
    echo "PostgreSQL:"
    echo "  主机: $NODE_IP"
    echo "  端口: 30432"
    echo "  数据库: 请查看现有配置"
    echo "  用户名: 请查看现有配置"
    echo
    echo "Redis:"
    echo "  主机: $NODE_IP"
    echo "  端口: 30379"
    echo
    echo "更新.env.community文件:"
    echo "DB_HOST=$NODE_IP"
    echo "DB_PORT=30432"
    echo "REDIS_HOST=$NODE_IP"
    echo "REDIS_PORT=30379"
    echo
}

# 主函数
main() {
    log_info "开始配置MicroK8s基础服务外部访问..."
    
    check_root
    check_microk8s
    check_existing_services
    create_nodeport_services
    configure_firewall
    verify_services
    show_connection_info
    
    log_success "配置完成！基础服务现在可以从外部访问了。"
    log_info "请运行 ./check-services.sh 验证服务连通性"
}

# 执行主函数
main "$@"