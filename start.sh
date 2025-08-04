#!/bin/bash

# 项目启动脚本
# 支持开发环境和生产环境的启动、停止、重启等操作

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 默认环境为开发环境
ENVIRONMENT="dev"
# 默认不单独启动基础环境服务
BASIC_ONLY=false

# 显示帮助信息
show_help() {
    echo -e "${BLUE}PhoenixCoder 项目启动脚本${NC}"
    echo -e "用法: $0 [命令] [选项]"
    echo -e "\n命令:\n"
    echo -e "  start    启动项目"
    echo -e "  stop     停止项目"
    echo -e "  restart  重启项目"
    echo -e "  logs     查看日志"
    echo -e "  status   查看状态"
    echo -e "  help     显示帮助信息"
    echo -e "\n选项:\n"
    echo -e "  -e, --env  指定环境 (dev/prod)，默认为 dev"
    echo -e "  -s, --service  指定服务名称，如 'server', 'admin' 等"
    echo -e "  --basic        只启动基础环境服务(postgresql, redis, rabbitmq)"
    echo -e "\n示例:\n"
    echo -e "  $0 start                       # 启动开发环境所有服务"
    echo -e "  $0 start -e prod               # 启动生产环境所有服务"
    echo -e "  $0 start -s server             # 启动开发环境的 server 服务"
    echo -e "  $0 logs -s server              # 查看 server 服务的日志"
    echo -e "  $0 status                      # 查看所有服务状态"
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            start|stop|restart|logs|status|help)
                COMMAND="$1"
                shift
                ;;
            -e|--env)
                ENVIRONMENT="$2"
                if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
                    echo -e "${RED}错误: 环境必须是 'dev' 或 'prod'${NC}"
                    exit 1
                fi
                shift 2
                ;;
            -s|--service)
                SERVICE="$2"
                shift 2
                ;;
            --basic)
                BASIC_ONLY=true
                shift
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

# 启动服务
start_services() {
    echo -e "${GREEN}正在启动 ${ENVIRONMENT} 环境的服务...${NC}"

    # 选择对应的 docker-compose 文件
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi

    # 检查文件是否存在
    if [[ ! -f $COMPOSE_FILE ]]; then
        echo -e "${RED}错误: 找不到 compose 文件 '$COMPOSE_FILE'${NC}"
        exit 1
    fi

    # 启动服务
    if [[ "$BASIC_ONLY" == true ]]; then
        echo -e "${BLUE}只启动基础环境服务: postgres, redis, rabbitmq${NC}"
        docker-compose -f $COMPOSE_FILE up -d postgres redis rabbitmq
    elif [[ -n "$SERVICE" ]]; then
        docker-compose -f $COMPOSE_FILE up -d $SERVICE
    else
        docker-compose -f $COMPOSE_FILE up -d
    fi

    # 检查启动是否成功
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}服务启动成功!${NC}"
        if [[ -n "$SERVICE" ]]; then
            echo -e "${BLUE}服务 '$SERVICE' 已在 ${ENVIRONMENT} 环境启动${NC}"
        else
            echo -e "${BLUE}所有服务已在 ${ENVIRONMENT} 环境启动${NC}"
        fi
        show_service_status
    else
        echo -e "${RED}服务启动失败!${NC}"
        exit 1
    fi
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}正在停止 ${ENVIRONMENT} 环境的服务...${NC}"

    # 选择对应的 docker-compose 文件
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi

    # 停止服务
    if [[ -n "$SERVICE" ]]; then
        docker-compose -f $COMPOSE_FILE stop $SERVICE
    else
        docker-compose -f $COMPOSE_FILE stop
    fi

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}服务停止成功!${NC}"
        if [[ -n "$SERVICE" ]]; then
            echo -e "${BLUE}服务 '$SERVICE' 已停止${NC}"
        else
            echo -e "${BLUE}所有服务已停止${NC}"
        fi
    else
        echo -e "${RED}服务停止失败!${NC}"
        exit 1
    fi
}

# 重启服务
restart_services() {
    echo -e "${BLUE}正在重启 ${ENVIRONMENT} 环境的服务...${NC}"
    stop_services
    start_services
}

# 查看日志
show_logs() {
    echo -e "${BLUE}正在查看 ${ENVIRONMENT} 环境的服务日志...${NC}"

    # 选择对应的 docker-compose 文件
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi

    # 查看日志
    if [[ -n "$SERVICE" ]]; then
        docker-compose -f $COMPOSE_FILE logs -f $SERVICE
    else
        docker-compose -f $COMPOSE_FILE logs -f
    fi
}

# 查看服务状态
show_service_status() {
    echo -e "${BLUE}${ENVIRONMENT} 环境的服务状态:${NC}"

    # 选择对应的 docker-compose 文件
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi

    docker-compose -f $COMPOSE_FILE ps
}

# 主函数
main() {
    # 检查必要的命令
    check_command docker
    check_command docker-compose

    # 解析命令行参数
    parse_args $@

    # 执行命令
    case $COMMAND in
        start)
            start_services
            ;;
        stop)
            stop_services
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