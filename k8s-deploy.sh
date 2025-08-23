#!/bin/bash

# PhoenixCoder Kubernetes 部署脚本
# 支持 MicroK8s 环境的完整部署流程

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 配置参数
SERVER_USER="edward"
SERVER_IP="192.168.3.30"
SSH_KEY="~/.ssh/id_rsa"
KUBECTL_CMD="microk8s kubectl"
NAMESPACE="phoenixcoder"
REGISTRY="localhost:32000"

# 环境检测
DEPLOY_ENV="local"  # local 或 remote
if [[ "$1" == "--remote" ]] || [[ "$2" == "--remote" ]]; then
    DEPLOY_ENV="remote"
    REGISTRY="${SERVER_IP}:32000"
fi

# 显示帮助信息
show_help() {
    echo -e "${BLUE}PhoenixCoder Kubernetes 部署脚本${NC}"
    echo -e "用法: $0 [命令] [选项]"
    echo -e "\n命令:\n"
    echo -e "  build         构建所有 Docker 镜像"
    echo -e "  push          推送镜像到 MicroK8s registry"
    echo -e "  deploy        部署应用到 Kubernetes"
    echo -e "  undeploy      删除 Kubernetes 部署"
    echo -e "  restart       重启所有服务"
    echo -e "  logs          查看服务日志"
    echo -e "  status        查看服务状态"
    echo -e "  connect       SSH 连接到服务器"
    echo -e "  setup         初始化 MicroK8s 环境"
    echo -e "  full-deploy   完整部署流程 (build + push + deploy)"
    echo -e "  help          显示帮助信息"
    echo -e "\n选项:\n"
    echo -e "  -s, --service <service>  指定服务 (server|oidc-server|admin)"
    echo -e "  -u, --user <user>        SSH 用户名 (默认: ${SERVER_USER})"
    echo -e "  -i, --ip <ip>            服务器 IP (默认: ${SERVER_IP})"
    echo -e "  -n, --namespace <ns>     Kubernetes 命名空间 (默认: ${NAMESPACE})"
    echo -e "\n示例:\n"
    echo -e "  $0 full-deploy                    # 完整部署流程"
    echo -e "  $0 build -s server                # 只构建 server 服务"
    echo -e "  $0 logs -s oidc-server            # 查看 oidc-server 日志"
    echo -e "  $0 status                         # 查看所有服务状态"
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            build|push|deploy|undeploy|restart|logs|status|connect|setup|full-deploy|help)
                COMMAND="$1"
                shift
                ;;
            -s|--service)
                SERVICE="$2"
                shift 2
                ;;
            -u|--user)
                SERVER_USER="$2"
                shift 2
                ;;
            -i|--ip)
                SERVER_IP="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            *)
                echo -e "${RED}错误: 未知选项 '$1'${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}错误: 命令 '$1' 未找到${NC}"
        exit 1
    fi
}

# SSH 执行命令
ssh_exec() {
    ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} "$1"
}

# 构建 Docker 镜像
build_images() {
    echo -e "${GREEN}正在构建 Docker 镜像...${NC}"
    
    if [[ -n "$SERVICE" ]]; then
        case $SERVICE in
            server)
                echo -e "${BLUE}构建 community-server 镜像${NC}"
docker build -t ${REGISTRY}/community-server:latest ./apps/community/server
                ;;
            oidc-server)
                echo -e "${BLUE}构建 community-oidc-server 镜像${NC}"
docker build -t ${REGISTRY}/community-oidc-server:latest ./apps/community/oidc-server
                ;;
            admin)
                echo -e "${BLUE}构建 community-admin 镜像${NC}"
docker build -t ${REGISTRY}/community-admin:latest ./apps/community/admin
                ;;
            *)
                echo -e "${RED}错误: 未知服务 '$SERVICE'${NC}"
                exit 1
                ;;
        esac
    else
        echo -e "${BLUE}构建所有镜像${NC}"
        docker build -t ${REGISTRY}/community-server:latest ./apps/community/server
        docker build -t ${REGISTRY}/community-oidc-server:latest ./apps/community/oidc-server
        docker build -t ${REGISTRY}/community-admin:latest ./apps/community/admin
    fi
    
    echo -e "${GREEN}镜像构建完成!${NC}"
}

# 推送镜像到 MicroK8s registry
push_images() {
    if [[ "$DEPLOY_ENV" == "local" ]]; then
        echo -e "${YELLOW}本地开发环境检测到，跳过镜像推送步骤${NC}"
        echo -e "${BLUE}提示: 如需推送到远程 registry，请使用 --remote 参数${NC}"
        return 0
    fi
    
    echo -e "${GREEN}正在推送镜像到 MicroK8s registry...${NC}"
    
    # 确保 MicroK8s registry 可访问
    echo -e "${BLUE}检查 MicroK8s registry 连接...${NC}"
    ssh_exec "microk8s kubectl get pods -n container-registry" || {
        echo -e "${RED}MicroK8s registry 不可用，请先启用 registry 插件${NC}"
        echo -e "${YELLOW}在服务器上运行: microk8s enable registry${NC}"
        exit 1
    }
    
    # 推送镜像的函数，带重试机制
    push_with_retry() {
        local image=$1
        local max_retries=3
        local retry_count=0
        
        while [ $retry_count -lt $max_retries ]; do
            echo -e "${BLUE}推送镜像: $image (尝试 $((retry_count + 1))/$max_retries)${NC}"
            if timeout 300 docker push $image; then
                echo -e "${GREEN}镜像 $image 推送成功${NC}"
                return 0
            else
                retry_count=$((retry_count + 1))
                if [ $retry_count -lt $max_retries ]; then
                    echo -e "${YELLOW}推送失败，等待 10 秒后重试...${NC}"
                    sleep 10
                else
                    echo -e "${RED}镜像 $image 推送失败，已达到最大重试次数${NC}"
                    return 1
                fi
            fi
        done
    }
    
    if [[ -n "$SERVICE" ]]; then
        case $SERVICE in
            server)
                push_with_retry ${REGISTRY}/community-server:latest
                ;;
            oidc-server)
                push_with_retry ${REGISTRY}/community-oidc-server:latest
                ;;
            admin)
                push_with_retry ${REGISTRY}/community-admin:latest
                ;;
        esac
    else
        push_with_retry ${REGISTRY}/community-server:latest || echo -e "${YELLOW}警告: server 镜像推送失败${NC}"
        push_with_retry ${REGISTRY}/community-oidc-server:latest || echo -e "${YELLOW}警告: oidc-server 镜像推送失败${NC}"
        push_with_retry ${REGISTRY}/community-admin:latest || echo -e "${YELLOW}警告: admin 镜像推送失败${NC}"
    fi
    
    echo -e "${GREEN}镜像推送完成!${NC}"
}

# 部署到 Kubernetes
deploy_to_k8s() {
    echo -e "${GREEN}正在部署到 Kubernetes...${NC}"
    
    if [[ "$DEPLOY_ENV" == "local" ]]; then
        echo -e "${YELLOW}本地开发环境检测到，使用 Docker Compose 部署${NC}"
        echo -e "${BLUE}提示: 确保本地已安装并启动 Docker 和 Docker Compose${NC}"
        
        deploy_local_k8s
        return $?
    fi
    
    # 远程部署逻辑
    # 在服务器上创建目标目录
    echo -e "${BLUE}创建目标目录...${NC}"
    ssh_exec "mkdir -p ~/phoenixcoder-k8s" || {
        echo -e "${RED}错误: 无法创建目标目录${NC}"
        exit 1
    }
    
    # 复制 k8s 配置文件到服务器
    echo -e "${BLUE}复制配置文件到服务器...${NC}"
    scp -i ${SSH_KEY} -r ./k8s/* ${SERVER_USER}@${SERVER_IP}:~/phoenixcoder-k8s/ || {
        echo -e "${RED}错误: 配置文件复制失败${NC}"
        exit 1
    }
    
    # 在服务器上执行部署
    ssh_exec << 'EOF'
        cd ~/phoenixcoder-k8s || {
            echo "错误: 无法进入配置目录"
            exit 1
        }
        
        # 创建命名空间
        echo "创建命名空间..."
        microk8s kubectl apply -f namespace.yaml || {
            echo "错误: 命名空间创建失败"
            exit 1
        }
        
        # 等待命名空间就绪
        sleep 2
        
        # 应用配置
        echo "应用配置映射..."
        microk8s kubectl apply -f configmaps/ || {
            echo "警告: 配置映射应用失败，继续部署"
        }
        
        # 部署服务
        echo "部署应用服务..."
        microk8s kubectl apply -f deployments/ || {
            echo "错误: 部署失败"
            exit 1
        }
        
        echo "创建服务..."
        microk8s kubectl apply -f services/ || {
            echo "错误: 服务创建失败"
            exit 1
        }
        
        echo "等待部署完成..."
        # 等待部署就绪，增加超时时间
        microk8s kubectl wait --for=condition=available --timeout=600s deployment/community-oidc-server -n phoenixcoder || echo "警告: OIDC服务部署超时"
    microk8s kubectl wait --for=condition=available --timeout=600s deployment/community-server -n phoenixcoder || echo "警告: API服务部署超时"
    microk8s kubectl wait --for=condition=available --timeout=600s deployment/community-admin -n phoenixcoder || echo "警告: Admin服务部署超时"
EOF
    
    echo -e "${GREEN}部署完成!${NC}"
    show_service_status
}

# 本地 Docker Compose 部署
deploy_local_k8s() {
    echo -e "${BLUE}使用本地 Docker Compose 进行部署...${NC}"
    
    # 检查 docker-compose 命令
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}错误: 未找到 docker-compose 命令${NC}"
        echo -e "${YELLOW}请安装 Docker Compose: https://docs.docker.com/compose/install/${NC}"
        return 1
    fi
    
    # 检查 Docker 是否运行
    if ! docker info &> /dev/null; then
        echo -e "${RED}错误: Docker 未运行${NC}"
        echo -e "${YELLOW}请启动 Docker Desktop 或 Docker 服务${NC}"
        return 1
    fi
    
    # 检查 docker-compose.yml 文件
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}错误: 未找到 docker-compose.yml 文件${NC}"
        return 1
    fi
    
    echo -e "${BLUE}停止现有容器...${NC}"
    docker-compose down 2>/dev/null || true
    
    echo -e "${BLUE}构建并启动服务...${NC}"
    docker-compose up -d --build || {
        echo -e "${RED}错误: Docker Compose 部署失败${NC}"
        return 1
    }
    
    echo -e "${BLUE}等待服务启动...${NC}"
    sleep 10
    
    # 检查服务状态
    echo -e "${BLUE}检查服务状态...${NC}"
    docker-compose ps
    
    echo -e "${GREEN}本地部署完成!${NC}"
    echo -e "${BLUE}服务访问地址:${NC}"
    echo -e "  OIDC Server: http://localhost:8001"
    echo -e "  API Server: http://localhost:8000"
    echo -e "  Admin Panel: http://localhost:3000"
    echo -e "  PostgreSQL: localhost:5432"
    echo -e "  Redis: localhost:6379"
    
    return 0
}

# 删除 Kubernetes 部署
undeploy_from_k8s() {
    echo -e "${YELLOW}正在删除 Kubernetes 部署...${NC}"
    
    ssh_exec << EOF
        # 删除部署和服务
        ${KUBECTL_CMD} delete -f ~/phoenixcoder-k8s/services/ --ignore-not-found=true
        ${KUBECTL_CMD} delete -f ~/phoenixcoder-k8s/deployments/ --ignore-not-found=true
        ${KUBECTL_CMD} delete -f ~/phoenixcoder-k8s/configmaps/ --ignore-not-found=true
        
        # 可选：删除命名空间（会删除所有资源）
        # ${KUBECTL_CMD} delete namespace ${NAMESPACE}
EOF
    
    echo -e "${GREEN}删除完成!${NC}"
}

# 重启服务
restart_services() {
    echo -e "${BLUE}正在重启服务...${NC}"
    
    if [[ -n "$SERVICE" ]]; then
        ssh_exec "${KUBECTL_CMD} rollout restart deployment/phoenixcoder-${SERVICE} -n ${NAMESPACE}"
    else
        ssh_exec "${KUBECTL_CMD} rollout restart deployment -n ${NAMESPACE}"
    fi
    
    echo -e "${GREEN}重启完成!${NC}"
}

# 查看日志
show_logs() {
    echo -e "${BLUE}正在查看服务日志...${NC}"
    
    if [[ -n "$SERVICE" ]]; then
        ssh_exec "${KUBECTL_CMD} logs -f deployment/phoenixcoder-${SERVICE} -n ${NAMESPACE}"
    else
        echo -e "${YELLOW}请指定服务名称，例如: -s server${NC}"
        show_help
    fi
}

# 查看服务状态
show_service_status() {
    echo -e "${BLUE}Kubernetes 服务状态:${NC}"
    
    ssh_exec << EOF
        echo "命名空间: ${NAMESPACE}"
        echo "\n=== Pods ==="
        ${KUBECTL_CMD} get pods -n ${NAMESPACE}
        
        echo "\n=== Services ==="
        ${KUBECTL_CMD} get services -n ${NAMESPACE}
        
        echo "\n=== Deployments ==="
        ${KUBECTL_CMD} get deployments -n ${NAMESPACE}
        
        echo "\n=== 外部访问地址 ==="
        echo "OIDC Server: http://${SERVER_IP}:8000"
    echo "API Server: http://${SERVER_IP}:8001"
    echo "Admin Panel: http://${SERVER_IP}:3000"
EOF
}

# SSH 连接到服务器
connect_to_server() {
    echo -e "${GREEN}正在连接到服务器: ${SERVER_USER}@${SERVER_IP}${NC}"
    ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP}
}

# 初始化 MicroK8s 环境
setup_microk8s() {
    echo -e "${GREEN}正在初始化 MicroK8s 环境...${NC}"
    
    # 配置防火墙
    echo -e "${BLUE}配置防火墙规则...${NC}"
    ssh_exec << EOF
        # 配置防火墙规则
        sudo ufw allow 22/tcp
        sudo ufw allow 8001/tcp
    sudo ufw allow 8000/tcp
    sudo ufw allow 3000/tcp
        sudo ufw allow 32000/tcp
        sudo ufw --force enable
        echo "防火墙配置完成"
EOF
    
    # 初始化 MicroK8s
    ssh_exec << EOF
        # 启用必要的插件
        microk8s enable dns
        microk8s enable registry
        microk8s enable storage
        
        # 等待插件启动
        microk8s status --wait-ready
        
        echo "MicroK8s 环境初始化完成!"
EOF
    
    echo -e "${GREEN}MicroK8s 环境和防火墙配置完成!${NC}"
}

# 完整部署流程
full_deploy() {
    echo -e "${GREEN}开始完整部署流程...${NC}"
    
    build_images
    push_images
    deploy_to_k8s
    
    echo -e "${GREEN}完整部署流程完成!${NC}"
    echo -e "${BLUE}访问地址:${NC}"
    echo -e "  - Admin Panel: http://${SERVER_IP}:3000"
    echo -e "  - API Server: http://${SERVER_IP}:8001"
    echo -e "  - OIDC Server: http://${SERVER_IP}:8000"
}

# 主函数
main() {
    # 检查必要的命令
    check_command docker
    check_command ssh
    check_command scp
    
    # 解析命令行参数
    parse_args $@
    
    # 执行命令
    case $COMMAND in
        build)
            build_images
            ;;
        push)
            push_images
            ;;
        deploy)
            deploy_to_k8s
            ;;
        undeploy)
            undeploy_from_k8s
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs
            ;;
        status)
            show_service_status
            ;;
        connect)
            connect_to_server
            ;;
        setup)
            setup_microk8s
            ;;
        full-deploy)
            full_deploy
            ;;
        help)
            show_help
            ;;
        *)
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main $@