#!/bin/bash

# 服务器部署脚本 - MicroK8s + Istio
# 使用方法: ./deploy.sh [command] [options]

# 配置参数
SERVER_USER="edward"
SERVER_IP="192.168.3.30"
SSH_KEY="~/.ssh/id_rsa"  # 替换为实际的SSH密钥路径
KUBECTL_CMD="microk8s kubectl"
ISTIOCTL_CMD="istioctl"
NAMESPACE="default"  # 默认命名空间
SCRIPT_NAME="$(basename "$0")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 显示帮助信息
function show_help() {
    echo -e "${BLUE}服务器部署脚本使用帮助${NC}"
    echo -e "用途: 管理MicroK8s+Istio环境中的应用部署"
    echo -e "\n命令:\n"
    echo -e "  install               将脚本安装到服务器"
    echo -e "  connect               SSH连接到服务器"
    echo -e "  status                检查MicroK8s和Istio状态"
    echo -e "  deploy <yaml_file>    部署应用到Kubernetes"
    echo -e "  delete <app_name>     删除应用部署"
    echo -e "  logs <app_name>       查看应用日志"
    echo -e "  port-forward <app_name> <local_port>:<remote_port>  端口转发"
    echo -e "  help                  显示此帮助信息"
    echo -e "\n选项:\n"
    echo -e "  -n, --namespace <namespace>  指定命名空间 (默认: ${NAMESPACE})"
    echo -e "  -u, --user <user>            指定SSH用户名 (默认: ${SERVER_USER})"
    echo -e "  -i, --ip <ip>                指定服务器IP地址 (默认: ${SERVER_IP})"
    echo -e "\n示例:\n"
    echo -e "  ./deploy.sh install"
    echo -e "  ./deploy.sh connect"
    echo -e "  ./deploy.sh status"
    echo -e "  ./deploy.sh deploy my-app.yaml"
    echo -e "  ./deploy.sh deploy my-app.yaml --namespace production"
    echo -e "  ./deploy.sh delete my-app"
    echo -e "  ./deploy.sh logs my-app -n production"
}

# 安装脚本到服务器
function install_script() {
    echo -e "${GREEN}正在将脚本安装到服务器: ${SERVER_USER}@${SERVER_IP}${NC}"
    scp -i ${SSH_KEY} "$0" ${SERVER_USER}@${SERVER_IP}:~/deploy.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}脚本复制失败，请检查SSH连接和权限${NC}"
        exit 1
    fi
    echo -e "${GREEN}正在为服务器上的脚本添加执行权限${NC}"
    ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} "chmod +x ~/deploy.sh"
    if [ $? -ne 0 ]; then
        echo -e "${RED}添加执行权限失败，请检查SSH连接和权限${NC}"
        exit 1
    fi
    echo -e "${GREEN}脚本安装成功！您可以在服务器上使用以下命令运行脚本:${NC}"
    echo -e "  ssh ${SERVER_USER}@${SERVER_IP}"
    echo -e "  cd ~"
    echo -e "  ./deploy.sh [command] [options]"
}

# SSH连接函数
function ssh_connect() {
    echo -e "${GREEN}正在连接到服务器: ${SERVER_USER}@${SERVER_IP}${NC}"
    ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP}
}

# 检查MicroK8s和Istio状态
function check_status() {
    echo -e "${GREEN}正在检查服务器状态...${NC}"
    ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} << EOF
        echo "MicroK8s状态:";
        microk8s status;
        echo "\nMicroK8s节点状态:";
        ${KUBECTL_CMD} get nodes;
        echo "\nIstio状态:";
        ${ISTIOCTL_CMD} version;
        echo "\n已部署的服务:";
        ${KUBECTL_CMD} get services -n ${NAMESPACE};
        echo "\n正在运行的Pod:";
        ${KUBECTL_CMD} get pods -n ${NAMESPACE};
EOF
}

# 部署应用
function deploy_app() {
    local yaml_file=$1
    if [ ! -f "$yaml_file" ]; then
        echo -e "${RED}错误: 部署文件 $yaml_file 不存在${NC}"
        exit 1
    fi

    echo -e "${GREEN}正在部署应用: $yaml_file 到命名空间: ${NAMESPACE}${NC}"
    scp -i ${SSH_KEY} $yaml_file ${SERVER_USER}@${SERVER_IP}:~/tmp-deploy.yaml
    ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} << EOF
        ${KUBECTL_CMD} apply -f ~/tmp-deploy.yaml -n ${NAMESPACE};
        rm -f ~/tmp-deploy.yaml;
        echo "\n部署状态:";
        ${KUBECTL_CMD} get pods -n ${NAMESPACE};
EOF
}

# 删除应用
function delete_app() {
    local app_name=$1
    echo -e "${GREEN}正在删除应用: $app_name 从命名空间: ${NAMESPACE}${NC}"
    ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} << EOF
        # 尝试删除部署
        ${KUBECTL_CMD} delete deployment $app_name -n ${NAMESPACE} --ignore-not-found;
        # 尝试删除服务
        ${KUBECTL_CMD} delete service $app_name -n ${NAMESPACE} --ignore-not-found;
        # 尝试删除Ingress
        ${KUBECTL_CMD} delete ingress $app_name -n ${NAMESPACE} --ignore-not-found;
        echo "\n剩余资源:";
        ${KUBECTL_CMD} get all -n ${NAMESPACE} | grep $app_name;
EOF
}

# 查看应用日志
function view_logs() {
    local app_name=$1
    echo -e "${GREEN}正在查看应用日志: $app_name 命名空间: ${NAMESPACE}${NC}"
    ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} << EOF
        POD_NAME=\\$(${KUBECTL_CMD} get pods -n ${NAMESPACE} | grep $app_name | awk '{print \\$1}' | head -1);
        if [ -z "\\$POD_NAME" ]; then
            echo "${RED}未找到运行中的Pod: $app_name${NC}";
        else
            echo "查看Pod日志: \\$POD_NAME";
            ${KUBECTL_CMD} logs -f \\$POD_NAME -n ${NAMESPACE};
        fi;
EOF
}

# 端口转发
function port_forward() {
    local app_name=$1
    local port_map=$2
    echo -e "${GREEN}正在设置端口转发: $app_name $port_map 命名空间: ${NAMESPACE}${NC}"
    ssh -i ${SSH_KEY} -L $port_map ${SERVER_USER}@${SERVER_IP} << EOF
        POD_NAME=\\$(${KUBECTL_CMD} get pods -n ${NAMESPACE} | grep $app_name | awk '{print \\$1}' | head -1);
        if [ -z "\\$POD_NAME" ]; then
            echo "${RED}未找到运行中的Pod: $app_name${NC}";
        else
            echo "设置端口转发到Pod: \\$POD_NAME $port_map";
            ${KUBECTL_CMD} port-forward \\$POD_NAME $port_map -n ${NAMESPACE};
        fi;
EOF
}

# 解析命令行参数
function parse_args() {
    # 默认参数
    local cmd=$1
    shift

    # 解析选项
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--namespace)
                NAMESPACE="$2"
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
            *)
                # 非选项参数
                ARGS+=("$1")
                shift
                ;;
        esac
    done

    # 执行命令
    case $cmd in
        install)
            install_script
            ;;
        connect)
            ssh_connect
            ;;
        status)
            check_status
            ;;
        deploy)
            if [ -z "${ARGS[0]}" ]; then
                echo -e "${RED}错误: 请指定部署文件${NC}"
                show_help
                exit 1
            fi
            deploy_app "${ARGS[0]}"
            ;;
        delete)
            if [ -z "${ARGS[0]}" ]; then
                echo -e "${RED}错误: 请指定应用名称${NC}"
                show_help
                exit 1
            fi
            delete_app "${ARGS[0]}"
            ;;
        logs)
            if [ -z "${ARGS[0]}" ]; then
                echo -e "${RED}错误: 请指定应用名称${NC}"
                show_help
                exit 1
            fi
            view_logs "${ARGS[0]}"
            ;;
        port-forward) 
            if [ -z "${ARGS[0]}" ] || [ -z "${ARGS[1]}" ]; then
                echo -e "${RED}错误: 请指定应用名称和端口映射(格式: local_port:remote_port)${NC}"
                show_help
                exit 1
            fi
            port_forward "${ARGS[0]}" "${ARGS[1]}"
            ;;
        help|--help|*) 
            show_help
            ;;
    esac
}

# 主函数
function main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    parse_args "$@"
}

# 执行主函数
main "$@"