#!/bin/bash

# PhoenixCoder 项目启动脚本 (重构版)
# 支持三种启动方式：local(本地)、docker(容器)、k8s(Kubernetes)
# 支持两种版本：community(社区版)、enterprise(企业版)
# 支持四种服务组合：backend(后端)、web(后端+管理界面)、miniapp(后端+小程序)、full(全部服务)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # 无颜色

# 脚本版本
VERSION="2.0.0"

# 显示版本信息
show_version() {
    echo "PhoenixCoder 启动脚本 v$VERSION"
    echo "支持本地、Docker 和 Kubernetes 三种启动方式"
    echo "支持社区版和企业版"
}

# 默认配置
DEFAULT_MODE="local"
DEFAULT_EDITION="community"
DEFAULT_SERVICES="backend"
DEFAULT_COMMAND="start"

# 全局变量
MODE="$DEFAULT_MODE"
EDITION="$DEFAULT_EDITION"
SERVICES="$DEFAULT_SERVICES"
COMMAND="$DEFAULT_COMMAND"
SPECIFIC_SERVICE=""
VERBOSE=false
DRY_RUN=false
LOGS=false
TABS=false

# 优雅启动和退出相关变量
# 项目根目录（必须在其他变量之前定义）
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SHUTDOWN_REQUESTED=false
STARTED_SERVICES=()
STARTUP_TIMEOUT=120
SHUTDOWN_TIMEOUT=30
HEALTH_CHECK_TIMEOUT=60
HEALTH_CHECK_INTERVAL=5
PID_FILES_DIR="$PROJECT_ROOT/.pids"
LOG_FILES_DIR="$PROJECT_ROOT/.logs"

# 创建必要的目录
mkdir -p "$PID_FILES_DIR" "$LOG_FILES_DIR"

# 信号处理函数
handle_shutdown_signal() {
    echo
    echo -e "${YELLOW}收到退出信号，开始优雅关闭服务...${NC}"
    SHUTDOWN_REQUESTED=true
    
    # 停止所有已启动的服务
    graceful_shutdown
    
    echo -e "${GREEN}✓ 优雅关闭完成${NC}"
    exit 0
}

# 设置信号处理器
setup_signal_handlers() {
    trap 'handle_shutdown_signal' SIGTERM SIGINT
    verbose_log "信号处理器已设置 (SIGTERM, SIGINT)"
}

# 优雅关闭函数
graceful_shutdown() {
    if [[ ${#STARTED_SERVICES[@]} -eq 0 ]]; then
        verbose_log "没有需要关闭的服务"
        return 0
    fi
    
    echo -e "${BLUE}正在关闭 ${#STARTED_SERVICES[@]} 个服务...${NC}"
    
    # 反向关闭服务（后启动的先关闭）
    for ((i=${#STARTED_SERVICES[@]}-1; i>=0; i--)); do
        local service="${STARTED_SERVICES[i]}"
        graceful_stop_service "$service"
    done
    
    # 清空已启动服务列表
    STARTED_SERVICES=()
    
    # 清理PID文件
    cleanup_pid_files
}

# 优雅停止单个服务
graceful_stop_service() {
    local service="$1"
    local pid_file="$PID_FILES_DIR/${service}.pid"
    
    if [[ ! -f "$pid_file" ]]; then
        verbose_log "服务 $service 的PID文件不存在，跳过"
        return 0
    fi
    
    local pid=$(cat "$pid_file" 2>/dev/null)
    if [[ -z "$pid" ]]; then
        verbose_log "服务 $service 的PID为空，跳过"
        rm -f "$pid_file"
        return 0
    fi
    
    # 检查进程是否存在
    if ! kill -0 "$pid" 2>/dev/null; then
        verbose_log "服务 $service (PID: $pid) 已经停止"
        rm -f "$pid_file"
        return 0
    fi
    
    echo -e "${YELLOW}正在停止服务: $service (PID: $pid)${NC}"
    
    # 发送SIGTERM信号
    kill -TERM "$pid" 2>/dev/null
    
    # 等待进程优雅退出
    local count=0
    local max_wait=$((SHUTDOWN_TIMEOUT))
    
    while kill -0 "$pid" 2>/dev/null && [[ $count -lt $max_wait ]]; do
        sleep 1
        ((count++))
        
        if [[ $((count % 5)) -eq 0 ]]; then
            echo -e "${CYAN}等待服务 $service 退出... (${count}s/${max_wait}s)${NC}"
        fi
    done
    
    # 如果进程仍在运行，强制终止
    if kill -0 "$pid" 2>/dev/null; then
        echo -e "${RED}服务 $service 未在超时时间内退出，强制终止${NC}"
        kill -KILL "$pid" 2>/dev/null
        sleep 1
    fi
    
    # 清理PID文件
    rm -f "$pid_file"
    echo -e "${GREEN}✓ 服务 $service 已停止${NC}"
}

# 清理PID文件
cleanup_pid_files() {
    if [[ -d "$PID_FILES_DIR" ]]; then
        rm -f "$PID_FILES_DIR"/*.pid
        verbose_log "PID文件已清理"
    fi
}

# 增强的健康检查函数
enhanced_health_check() {
    local service="$1"
    local port="$2"
    local timeout="${3:-$HEALTH_CHECK_TIMEOUT}"
    local interval="${4:-$HEALTH_CHECK_INTERVAL}"
    
    echo -e "${BLUE}正在检查服务 $service 的健康状态...${NC}"
    
    local count=0
    local max_attempts=$((timeout / interval))
    
    while [[ $count -lt $max_attempts ]]; do
        if [[ "$SHUTDOWN_REQUESTED" == "true" ]]; then
            echo -e "${YELLOW}收到关闭请求，停止健康检查${NC}"
            return 1
        fi
        
        # 检查端口是否可用
        if check_port_status "localhost" "$port"; then
            # 对于有健康检查端点的服务，进行额外检查
            case "$service" in
                "server"|"oidc-server")
                    local health_url="http://localhost:$port/health"
                    if curl -s -f "$health_url" >/dev/null 2>&1; then
                        echo -e "${GREEN}✓ 服务 $service 健康检查通过${NC}"
                        return 0
                    else
                        verbose_log "服务 $service 端口可达但健康检查失败"
                    fi
                    ;;
                *)
                    echo -e "${GREEN}✓ 服务 $service 端口检查通过${NC}"
                    return 0
                    ;;
            esac
        fi
        
        ((count++))
        if [[ $((count % 3)) -eq 0 ]]; then
            echo -e "${CYAN}等待服务 $service 启动... (${count}/${max_attempts})${NC}"
        fi
        sleep "$interval"
    done
    
    echo -e "${RED}✗ 服务 $service 健康检查超时${NC}"
    return 1
}

# 启动失败回滚机制
rollback_startup() {
    echo -e "${RED}启动失败，开始回滚已启动的服务...${NC}"
    
    # 标记为关闭状态
    SHUTDOWN_REQUESTED=true
    
    # 优雅关闭所有已启动的服务
    graceful_shutdown
    
    echo -e "${RED}✗ 启动失败，所有服务已回滚${NC}"
    exit 1
}

# 记录服务启动
register_started_service() {
    local service="$1"
    local pid="$2"
    
    # 添加到已启动服务列表
    STARTED_SERVICES+=("$service")
    
    # 保存PID到文件
    echo "$pid" > "$PID_FILES_DIR/${service}.pid"
    
    verbose_log "服务 $service (PID: $pid) 已注册"
}

# 检查服务是否正在运行
is_service_running() {
    local service="$1"
    local pid_file="$PID_FILES_DIR/${service}.pid"
    
    if [[ ! -f "$pid_file" ]]; then
        return 1
    fi
    
    local pid=$(cat "$pid_file" 2>/dev/null)
    if [[ -z "$pid" ]]; then
        return 1
    fi
    
    kill -0 "$pid" 2>/dev/null
}

# 等待服务启动完成
wait_for_service_startup() {
    local service="$1"
    local port="$2"
    
    echo -e "${BLUE}等待服务 $service 启动完成...${NC}"
    
    # 使用增强的健康检查
    if enhanced_health_check "$service" "$port"; then
        echo -e "${GREEN}✓ 服务 $service 启动成功${NC}"
        return 0
    else
        echo -e "${RED}✗ 服务 $service 启动失败或超时${NC}"
        return 1
    fi
}

# 显示横幅
show_banner() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    PhoenixCoder 启动脚本                     ║${NC}"
    echo -e "${BLUE}║                        重构增强版                            ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# 显示帮助信息
show_help() {
    show_banner
    echo -e "${CYAN}用法:${NC} $0 [命令] [选项]"
    echo
    echo -e "${YELLOW}命令:${NC}"
    echo -e "  start      启动服务 (默认)"
    echo -e "  stop       停止服务"
    echo -e "  restart    重启服务"
    echo -e "  status     查看服务状态"
    echo -e "  logs       查看服务日志"
    echo -e "  help       显示帮助信息"
    echo
    echo -e "${YELLOW}选项:${NC}"
    echo -e "  --mode=[local|docker|k8s]        启动方式 (默认: local)"
    echo -e "  --edition=[community|enterprise] 版本选择 (默认: community)"
    echo -e "  --services=[backend|web|miniapp|full] 服务组合 (默认: backend)"
    echo -e "  -s, --service=SERVICE_NAME       指定单个服务"
    echo -e "  -v, --verbose                    详细输出"
    echo -e "  -l, --logs                       启用日志输出模式（前台运行）"
    echo -e "  --tabs                           在多个终端 tab 中启动服务（仅限 local 模式）"
    echo -e "  --dry-run                        仅显示将要执行的命令"
    echo
    echo -e "${YELLOW}启动方式说明:${NC}"
    echo -e "  ${GREEN}local${NC}   - 本地直接启动服务，连接远程数据库 (开发推荐)"
    echo -e "  ${GREEN}docker${NC}  - 使用 Docker Compose 启动容器化服务"
    echo -e "  ${GREEN}k8s${NC}     - 部署到测试服务器 MicroK8s 集群"
    echo
    echo -e "${YELLOW}版本说明:${NC}"
    echo -e "  ${GREEN}community${NC}  - 社区版 (基础功能)"
    echo -e "  ${GREEN}enterprise${NC} - 企业版 (包含监控、审计等高级功能)"
    echo
    echo -e "${YELLOW}服务组合说明:${NC}"
    echo -e "  ${GREEN}backend${NC}  - 仅后端服务 (server + oidc-server)"
    echo -e "  ${GREEN}web${NC}     - 后端 + Web管理界面 (backend + admin)"
    echo -e "  ${GREEN}miniapp${NC} - 后端 + 小程序 (backend + miniapp)"
    echo -e "  ${GREEN}full${NC}    - 全部服务 (backend + admin + miniapp)"
    echo
    echo -e "${YELLOW}原始启动命令:${NC}"
    echo -e "  ${GREEN}社区版服务:${NC}"
    echo -e "    Admin:   cd /Users/zhuwencan/work/phoenixcoder/apps/community/admin && pnpm run dev -- --port 3000"
    echo -e "    Server:  cd /Users/zhuwencan/work/phoenixcoder/apps/community/server && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
    echo -e "    OIDC:    cd /Users/zhuwencan/work/phoenixcoder/apps/community/oidc-server && python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload"
    echo -e "    Miniapp: cd /Users/zhuwencan/work/phoenixcoder/apps/community/miniapp && pnpm run dev:weapp"
    echo
    echo -e "  ${GREEN}企业版服务:${NC}"
    echo -e "    Admin:   cd /Users/zhuwencan/work/phoenixcoder/apps/enterprise/admin && pnpm run dev -- --port 3000"
    echo -e "    Server:  cd /Users/zhuwencan/work/phoenixcoder/apps/enterprise/server && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
    echo -e "    OIDC:    cd /Users/zhuwencan/work/phoenixcoder/apps/enterprise/oidc-server && python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload"
    echo -e "    Miniapp: cd /Users/zhuwencan/work/phoenixcoder/apps/enterprise/miniapp && pnpm run dev:weapp"
    echo
    echo -e "${YELLOW}端口管理命令:${NC}"
    echo -e "  ${GREEN}查看端口占用:${NC}"
    echo -e "    lsof -i :端口号                          # 查看指定端口占用情况"
    echo -e "    lsof -i :3000 -i :8000 -i :8001 -i :8002  # 查看所有项目相关端口"
    echo
    echo -e "  ${GREEN}杀死端口进程:${NC}"
    echo -e "    kill -9 \$(lsof -t -i:端口号)              # 杀死占用指定端口的进程"
    echo -e "    kill -9 \$(lsof -t -i:3000 -i:8000 -i:8001 -i:8002)  # 批量杀死项目端口"
    echo
    echo -e "  ${GREEN}查看进程状态:${NC}"
    echo -e "    ps aux | grep uvicorn                    # 查看Python服务进程"
    echo -e "    ps aux | grep node                       # 查看Node.js服务进程"
    echo
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  $0 start                                    # 本地启动社区版后端服务"
    echo -e "  $0 start --mode=docker --edition=enterprise --services=full"
    echo -e "  $0 start --mode=local --services=web       # 本地启动后端+Web"
    echo -e "  $0 start --mode=local --tabs --services=full # 在多个终端 tab 中启动所有服务"
    echo -e "  $0 start --mode=k8s --edition=enterprise   # K8s部署企业版"
    echo -e "  $0 stop --mode=docker                      # 停止Docker服务"
    echo -e "  $0 stop --mode=local --tabs                # 停止多 tab 模式启动的服务"
    echo -e "  $0 logs --mode=local -s server             # 查看本地server日志"
    echo -e "  $0 status --mode=k8s                       # 查看K8s服务状态"
    echo
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            start|stop|restart|status|logs|help)
                COMMAND="$1"
                shift
                ;;
            --mode=*)
                MODE="${1#*=}"
                shift
                ;;
            --edition=*)
                EDITION="${1#*=}"
                shift
                ;;
            --services=*)
                SERVICES="${1#*=}"
                shift
                ;;
            -s|--service)
                SPECIFIC_SERVICE="$2"
                shift 2
                ;;
            --service=*)
                SPECIFIC_SERVICE="${1#*=}"
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -l|--logs)
                LOGS=true
                shift
                ;;
            --tabs)
                TABS=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            --version|-v)
                show_version
                exit 0
                ;;
            *)
                echo -e "${RED}错误: 未知选项 '$1'${NC}"
                echo -e "使用 '$0 --help' 查看帮助信息"
                exit 1
                ;;
        esac
    done
}

# 验证参数
validate_args() {
    # 验证启动方式
    case $MODE in
        local|docker|k8s)
            ;;
        *)
            echo -e "${RED}错误: 无效的启动方式 '$MODE'${NC}"
            echo -e "支持的方式: local, docker, k8s"
            exit 1
            ;;
    esac
    
    # 验证版本
    case $EDITION in
        community|enterprise)
            ;;
        *)
            echo -e "${RED}错误: 无效的版本 '$EDITION'${NC}"
            echo -e "支持的版本: community, enterprise"
            exit 1
            ;;
    esac
    
    # 验证服务组合（如果指定了单个服务，则跳过服务组合验证）
    if [[ -z "$SPECIFIC_SERVICE" ]]; then
        case $SERVICES in
            backend|web|miniapp|full)
                ;;
            *)
                echo -e "${RED}错误: 无效的服务组合 '$SERVICES'${NC}"
                echo -e "支持的组合: backend, web, miniapp, full"
                exit 1
                ;;
        esac
    fi
}

# 详细输出
verbose_log() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${PURPLE}[VERBOSE]${NC} $1"
    fi
}

# 执行命令（支持dry-run）
execute_command() {
    local cmd="$1"
    local description="$2"
    
    if [[ "$DRY_RUN" == true ]]; then
        echo -e "${CYAN}[DRY-RUN]${NC} $description"
        echo -e "${CYAN}[DRY-RUN]${NC} 将执行: $cmd"
        return 0
    fi
    
    verbose_log "执行: $cmd"
    eval "$cmd"
    return $?
}

# 检查必要的命令
check_dependencies() {
    local deps=()
    
    case $MODE in
        local)
            deps=("python3" "node" "npm")
            ;;
        docker)
            deps=("docker" "docker-compose")
            ;;
        k8s)
            deps=("kubectl")
            ;;
    esac
    
    verbose_log "检查依赖: ${deps[*]}"
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo -e "${RED}错误: 缺少必要的命令 '$dep'${NC}"
            case $dep in
                python3)
                    echo -e "请安装 Python 3.8+"
                    echo -e "推荐使用: brew install python@3.11"
                    ;;
                node|npm)
                    echo -e "请安装 Node.js 18+"
                    echo -e "推荐使用: brew install node"
                    ;;
                docker)
                    echo -e "请安装 Docker Desktop"
                    echo -e "下载地址: https://www.docker.com/products/docker-desktop"
                    ;;
                docker-compose)
                    echo -e "请安装 Docker Compose"
                    echo -e "通常随 Docker Desktop 一起安装"
                    ;;
                kubectl)
                    echo -e "请安装 kubectl 并配置集群访问"
                    echo -e "推荐使用: brew install kubectl"
                    ;;
            esac
            exit 1
        fi
    done
    
    # 检查版本
    check_versions
    
    verbose_log "依赖检查通过: ${deps[*]}"
}

# 检查软件版本
check_versions() {
    case $MODE in
        local)
            # 检查 Python 版本
            local python_version=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
            local python_major=$(echo $python_version | cut -d. -f1)
            local python_minor=$(echo $python_version | cut -d. -f2)
            
            if [[ $python_major -lt 3 ]] || [[ $python_major -eq 3 && $python_minor -lt 8 ]]; then
                echo -e "${RED}错误: Python 版本过低 ($python_version)，需要 3.8+${NC}"
                exit 1
            fi
            verbose_log "Python 版本: $python_version ✓"
            
            # 检查 Node.js 版本
            local node_version=$(node --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
            local node_major=$(echo $node_version | cut -d. -f1)
            
            if [[ $node_major -lt 18 ]]; then
                echo -e "${RED}错误: Node.js 版本过低 ($node_version)，需要 18+${NC}"
                exit 1
            fi
            verbose_log "Node.js 版本: $node_version ✓"
            ;;
        docker)
            # 检查 Docker 是否运行
            if ! docker info &> /dev/null; then
                echo -e "${RED}错误: Docker 未运行，请启动 Docker Desktop${NC}"
                exit 1
            fi
            verbose_log "Docker 运行状态: ✓"
            ;;
        k8s)
            # 检查 kubectl 配置
            if ! kubectl cluster-info &> /dev/null; then
                echo -e "${RED}错误: kubectl 未配置或集群不可访问${NC}"
                echo -e "请检查 kubeconfig 配置"
                exit 1
            fi
            verbose_log "Kubernetes 集群连接: ✓"
            ;;
    esac
}

# 检查配置文件
check_config() {
    verbose_log "检查项目结构和配置文件"
    
    # 检查基本项目结构
    check_project_structure
    
    # 检查模式相关的配置文件
    local config_files=()
    
    case $MODE in
        local)
            # 检查环境配置文件（必需）
            config_files=()
            # 检查 Node.js 依赖文件（项目根目录）
            if [[ ! -f "package.json" ]]; then
                echo -e "${YELLOW}警告: 缺少 package.json 文件${NC}"
            else
                verbose_log "找到 package.json ✓"
            fi
            # 检查 pnpm 工作空间配置
            if [[ -f "pnpm-workspace.yaml" ]]; then
                verbose_log "找到 pnpm-workspace.yaml ✓"
            fi
            ;;
        docker)
            config_files=("docker-compose.yml")
            # 检查 Dockerfile
            local dockerfiles=("Dockerfile" "server/Dockerfile" "admin/Dockerfile" "miniapp/Dockerfile")
            for dockerfile in "${dockerfiles[@]}"; do
                if [[ -f "$dockerfile" ]]; then
                    verbose_log "找到 Dockerfile: $dockerfile"
                fi
            done
            ;;
        k8s)
            config_files=("k8s-deploy.sh")
            # 检查 Kubernetes 配置目录
            if [[ -d "k8s" ]]; then
                verbose_log "找到 Kubernetes 配置目录: k8s/"
            fi
            ;;
    esac
    
    # 检查必需的配置文件
    for config in "${config_files[@]}"; do
        if [[ ! -f "$config" ]]; then
            echo -e "${RED}错误: 缺少配置文件 '$config'${NC}"
            case $config in
                "config/config.yaml")
                    echo -e "请创建主配置文件，参考 config/config.yaml.example"
                    ;;
                "config/database.yaml")
                    echo -e "请创建数据库配置文件，参考 config/database.yaml.example"
                    ;;
                "docker-compose.yml")
                    echo -e "请创建 Docker Compose 配置文件"
                    ;;
                "k8s-deploy.sh")
                    echo -e "请确保 k8s-deploy.sh 脚本存在且可执行"
                    ;;
            esac
            exit 1
        fi
    done
    
    # 检查环境配置文件
    local env_file=".env.$EDITION"
    
    if [[ ! -f "$env_file" ]]; then
        echo -e "${RED}错误: 找不到环境配置文件 '$env_file'${NC}"
        echo -e "请确保以下文件存在:"
        echo -e "  - .env.community (社区版)"
        echo -e "  - .env.enterprise (企业版)"
        exit 1
    fi
    
    verbose_log "配置文件检查通过: ${config_files[*]} $env_file"
    
    # 加载环境变量
    set -a
    source "$env_file"
    set +a
    
    verbose_log "环境变量已加载"
}

# 检查项目目录结构
check_project_structure() {
    local required_dirs=()
    local optional_dirs=()
    
    # 检查版本目录
    local edition_dir="apps/$EDITION"
    if [[ ! -d "$edition_dir" ]]; then
        echo -e "${RED}错误: 缺少版本目录 '$edition_dir'${NC}"
        echo -e "请确保项目结构完整"
        exit 1
    fi
    verbose_log "找到版本目录: $edition_dir/"
    
    # 根据服务组合确定需要的服务目录
    case $SERVICES in
        backend)
            required_dirs=("$edition_dir/server" "$edition_dir/oidc-server")
            ;;
        web)
            required_dirs=("$edition_dir/server" "$edition_dir/oidc-server" "$edition_dir/admin")
            ;;
        miniapp)
            required_dirs=("$edition_dir/server" "$edition_dir/oidc-server" "$edition_dir/miniapp")
            ;;
        full)
            required_dirs=("$edition_dir/server" "$edition_dir/oidc-server" "$edition_dir/admin" "$edition_dir/miniapp")
            ;;
    esac
    
    # 通用目录
    optional_dirs=("scripts" "docs" "tests" "k8s" "infrastructure" "packages")
    
    # 检查必需的服务目录
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            echo -e "${RED}错误: 缺少必需的服务目录 '$dir'${NC}"
            echo -e "请确保项目结构完整"
            exit 1
        fi
        verbose_log "找到服务目录: $dir/"
    done
    
    # 检查可选目录
    for dir in "${optional_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            verbose_log "找到目录: $dir/"
        fi
    done
    
    verbose_log "项目结构检查完成"
}

# 检测终端类型
detect_terminal_type() {
    local terminal_type="unknown"
    
    # 检测 VS Code 集成终端
    if [[ -n "$VSCODE_PID" ]] || [[ "$TERM_PROGRAM" == "vscode" ]]; then
        terminal_type="vscode"
    # 检测 iTerm2
    elif [[ "$TERM_PROGRAM" == "iTerm.app" ]] || [[ -n "$ITERM_SESSION_ID" ]]; then
        terminal_type="iterm2"
    # 检测 Terminal.app
    elif [[ "$TERM_PROGRAM" == "Apple_Terminal" ]]; then
        terminal_type="terminal"
    # 检测 Hyper
    elif [[ "$TERM_PROGRAM" == "Hyper" ]]; then
        terminal_type="hyper"
    # 检测 Alacritty
    elif [[ "$TERM" == "alacritty" ]]; then
        terminal_type="alacritty"
    # 检测 Kitty
    elif [[ -n "$KITTY_WINDOW_ID" ]]; then
        terminal_type="kitty"
    # 检测 Warp
    elif [[ "$TERM_PROGRAM" == "WarpTerminal" ]]; then
        terminal_type="warp"
    # 通过进程名检测
    else
        local parent_process=$(ps -o comm= -p $PPID 2>/dev/null)
        case "$parent_process" in
            *Terminal*) terminal_type="terminal" ;;
            *iTerm*) terminal_type="iterm2" ;;
            *Code*) terminal_type="vscode" ;;
            *) terminal_type="unknown" ;;
        esac
    fi
    
    echo "$terminal_type"
}

# 在新 tab 中打开命令
open_new_tab() {
    local service_name="$1"
    local command="$2"
    local service_dir="$3"
    local terminal_type="$4"
    
    verbose_log "在新 tab 中启动服务: $service_name"
    verbose_log "命令: $command"
    verbose_log "目录: $service_dir"
    verbose_log "终端类型: $terminal_type"
    
    case "$terminal_type" in
        "terminal")
            # macOS Terminal.app
            # 转义特殊字符以避免 AppleScript 语法错误
            local escaped_service_dir=$(printf '%s\n' "$service_dir" | sed "s/['\"]//g")
            local escaped_service_name=$(printf '%s\n' "$service_name" | sed "s/['\"]//g")
            local escaped_command=$(printf '%s\n' "$command" | sed "s/['\"]//g")
            
            if ! osascript <<EOF 2>/dev/null
tell application "Terminal"
    activate
    tell application "System Events" to keystroke "t" using command down
    delay 0.5
    do script "cd '$escaped_service_dir' && echo '启动服务: $escaped_service_name' && $escaped_command" in front window
end tell
EOF
            then
                echo -e "${RED}错误: Terminal.app AppleScript 执行失败${NC}"
                echo -e "${YELLOW}请手动在 Terminal 中创建新 tab 并运行以下命令:${NC}"
                echo -e "${CYAN}cd '$service_dir' && $command${NC}"
                return 1
            fi
            ;;
        "iterm2")
            # iTerm2
            # 转义特殊字符以避免 AppleScript 语法错误
            local escaped_service_dir=$(printf '%s\n' "$service_dir" | sed "s/['\"]//g")
            local escaped_service_name=$(printf '%s\n' "$service_name" | sed "s/['\"]//g")
            local escaped_command=$(printf '%s\n' "$command" | sed "s/['\"]//g")
            
            if ! osascript -e "
tell application \"iTerm2\"
    activate
    tell current window
        create tab with default profile
        tell current session
            write text \"cd '$escaped_service_dir'\"
            write text \"echo '启动服务: $escaped_service_name'\"
            write text \"$escaped_command\"
        end tell
    end tell
end tell" 2>/dev/null
            then
                echo -e "${RED}错误: iTerm2 AppleScript 执行失败${NC}"
                echo -e "${YELLOW}请手动在 iTerm2 中创建新 tab 并运行以下命令:${NC}"
                echo -e "${CYAN}cd '$service_dir' && $command${NC}"
                return 1
            fi
            ;;
        "vscode")
            # VS Code 集成终端
            echo -e "${YELLOW}警告: VS Code 集成终端不支持自动创建新 tab${NC}"
            echo -e "${YELLOW}请手动在 VS Code 中创建新终端并运行以下命令:${NC}"
            echo -e "${CYAN}cd '$service_dir' && $command${NC}"
            return 1
            ;;
        *)
            # 未知终端类型，尝试通用方法
            echo -e "${YELLOW}警告: 未知终端类型 '$terminal_type'，尝试通用方法${NC}"
            
            # 尝试使用 osascript 打开新的 Terminal 窗口
            if command -v osascript &> /dev/null; then
                # 转义特殊字符以避免 AppleScript 语法错误
                local escaped_service_dir=$(printf '%s\n' "$service_dir" | sed "s/['\"]//g")
                local escaped_service_name=$(printf '%s\n' "$service_name" | sed "s/['\"]//g")
                local escaped_command=$(printf '%s\n' "$command" | sed "s/['\"]//g")
                
                if ! osascript -e "
tell application \"Terminal\"
    activate
    do script \"cd '$escaped_service_dir' && echo '启动服务: $escaped_service_name' && $escaped_command\"
end tell" 2>/dev/null
                then
                    echo -e "${RED}错误: AppleScript 执行失败${NC}"
                    echo -e "${YELLOW}请手动运行以下命令:${NC}"
                    echo -e "${CYAN}cd '$service_dir' && $command${NC}"
                    return 1
                fi
            else
                echo -e "${RED}错误: 无法在当前终端类型中创建新 tab${NC}"
                echo -e "${YELLOW}请手动运行以下命令:${NC}"
                echo -e "${CYAN}cd '$service_dir' && $command${NC}"
                return 1
            fi
            ;;
    esac
    
    return 0
}

# 获取服务启动命令
get_service_command() {
    local service="$1"
    local service_dir="$PROJECT_ROOT/apps/$EDITION/$service"
    
    case $service in
        server|oidc-server)
            # Python 服务
            local port_var="$(echo $service | tr '[:lower:]' '[:upper:]' | tr '-' '_')_PORT"
            local port="${!port_var}"
            
            if [[ -z "$port" ]]; then
                case $service in
                    server) port="$SERVER_PORT" ;;
                    oidc-server) port="$OIDC_PORT" ;;
                esac
            fi
            
            echo "source venv/bin/activate && python main.py"
            ;;
        admin|miniapp)
            # Node.js 服务
            case $service in
                admin)
                    echo "pnpm run dev"
                    ;;
                miniapp)
                    echo "pnpm run dev:weapp"
                    ;;
            esac
            ;;
        *)
            echo "echo '未知服务类型: $service'"
            ;;
    esac
}

# 获取服务列表
get_service_list() {
    local services=()
    
    case $SERVICES in
        backend)
            services=("server" "oidc-server")
            ;;
        web)
            services=("server" "oidc-server" "admin")
            ;;
        miniapp)
            services=("server" "oidc-server" "miniapp")
            ;;
        full)
            services=("server" "oidc-server" "admin" "miniapp")
            # 企业版添加监控服务
            if [[ "$EDITION" == "enterprise" ]]; then
                services+=("prometheus" "grafana")
            fi
            ;;
    esac
    
    # 如果指定了特定服务，只返回该服务
    if [[ -n "$SPECIFIC_SERVICE" ]]; then
        services=("$SPECIFIC_SERVICE")
    fi
    
    echo "${services[@]}"
}

# 本地启动服务
start_local_service() {
    local service="$1"
    local service_dir="$PROJECT_ROOT/apps/$EDITION/$service"
    
    if [[ ! -d "$service_dir" ]]; then
        echo -e "${RED}错误: 服务目录不存在 '$service_dir'${NC}"
        return 1
    fi
    
    echo -e "${GREEN}启动本地服务: $service${NC}"
    
    case $service in
        server|oidc-server)
            # Python 服务
            local port_var="$(echo $service | tr '[:lower:]' '[:upper:]' | tr '-' '_')_PORT"
            local port="${!port_var}"
            
            if [[ -z "$port" ]]; then
                case $service in
                    server) port="$SERVER_PORT" ;;
                    oidc-server) port="$OIDC_PORT" ;;
                esac
            fi
            
            verbose_log "启动 $service 在端口 $port"
            
            # 检查Python版本和可用性
            local python_cmd="python3"
            if ! command -v "$python_cmd" &> /dev/null; then
                echo -e "${RED}错误: 未找到 python3 命令${NC}"
                return 1
            fi
            
            local python_version=$("$python_cmd" --version 2>&1 | cut -d' ' -f2)
            verbose_log "使用Python版本: $python_version"
            
            # 检查并创建虚拟环境
            local venv_dir="$service_dir/venv"
            local venv_activate="$venv_dir/bin/activate"
            
            if [[ ! -d "$venv_dir" ]]; then
                echo -e "${YELLOW}创建Python虚拟环境...${NC}"
                if [[ "$DRY_RUN" == "true" ]]; then
                    echo -e "${CYAN}[DRY-RUN]${NC} cd '$service_dir' && $python_cmd -m venv venv"
                else
                    cd "$service_dir" || {
                        echo -e "${RED}错误: 无法进入服务目录 '$service_dir'${NC}"
                        return 1
                    }
                    
                    verbose_log "在目录 $service_dir 中创建虚拟环境"
                    
                    # 尝试创建虚拟环境，添加重试机制
                    local retry_count=0
                    local max_retries=3
                    
                    while [[ $retry_count -lt $max_retries ]]; do
                        if "$python_cmd" -m venv venv 2>&1; then
                            echo -e "${GREEN}✓ 虚拟环境创建成功${NC}"
                            break
                        else
                            retry_count=$((retry_count + 1))
                            echo -e "${YELLOW}警告: 虚拟环境创建失败，重试 $retry_count/$max_retries${NC}"
                            
                            if [[ $retry_count -eq $max_retries ]]; then
                                echo -e "${RED}错误: 虚拟环境创建失败，已达到最大重试次数${NC}"
                                echo -e "${RED}请检查Python安装和权限设置${NC}"
                                return 1
                            fi
                            
                            sleep 2
                        fi
                    done
                    
                    # 验证虚拟环境是否正确创建
                    if [[ ! -f "$venv_activate" ]]; then
                        echo -e "${RED}错误: 虚拟环境激活脚本不存在: $venv_activate${NC}"
                        return 1
                    fi
                fi
            else
                verbose_log "虚拟环境已存在: $venv_dir"
                
                # 验证现有虚拟环境的完整性
                if [[ "$DRY_RUN" != "true" && ! -f "$venv_activate" ]]; then
                    echo -e "${YELLOW}警告: 虚拟环境损坏，重新创建...${NC}"
                    rm -rf "$venv_dir"
                    
                    cd "$service_dir" || {
                        echo -e "${RED}错误: 无法进入服务目录 '$service_dir'${NC}"
                        return 1
                    }
                    
                    if ! "$python_cmd" -m venv venv; then
                        echo -e "${RED}错误: 重新创建虚拟环境失败${NC}"
                        return 1
                    fi
                    
                    echo -e "${GREEN}✓ 虚拟环境重新创建成功${NC}"
                fi
            fi
            
            # 激活虚拟环境并安装依赖
            if [[ -f "$service_dir/requirements.txt" ]]; then
                echo -e "${YELLOW}在虚拟环境中安装Python依赖...${NC}"
                if [[ "$DRY_RUN" == "true" ]]; then
                    echo -e "${CYAN}[DRY-RUN]${NC} cd '$service_dir' && source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt"
                else
                    cd "$service_dir" || {
                        echo -e "${RED}错误: 无法进入服务目录 '$service_dir'${NC}"
                        return 1
                    }
                    
                    verbose_log "激活虚拟环境: $venv_activate"
                    
                    # 使用子shell来确保虚拟环境正确激活
                    (
                        set -e  # 在子shell中启用错误退出
                        
                        # 激活虚拟环境
                        source "$venv_activate" || {
                            echo -e "${RED}错误: 无法激活虚拟环境${NC}"
                            exit 1
                        }
                        
                        verbose_log "虚拟环境已激活，Python路径: $(which python)"
                        
                        # 升级pip
                        echo -e "${YELLOW}升级pip...${NC}"
                        python -m pip install --upgrade pip || {
                            echo -e "${YELLOW}警告: pip升级失败，继续安装依赖${NC}"
                        }
                        
                        # 安装依赖
                        echo -e "${YELLOW}安装项目依赖...${NC}"
                        pip install -r requirements.txt || {
                            echo -e "${RED}错误: 依赖安装失败${NC}"
                            exit 1
                        }
                        
                        echo -e "${GREEN}✓ Python依赖安装成功${NC}"
                    ) || {
                        echo -e "${RED}错误: Python依赖安装过程失败${NC}"
                        return 1
                    }
                fi
            else
                echo -e "${YELLOW}警告: 在 $service_dir 中未找到 requirements.txt 文件，跳过依赖安装${NC}"
            fi
            
            # 在虚拟环境中启动服务
            if [[ "$LOGS" == "true" ]]; then
                echo -e "${YELLOW}在虚拟环境中启动服务（前台模式）...${NC}"
                if [[ "$DRY_RUN" == "true" ]]; then
                    echo -e "${CYAN}[DRY-RUN]${NC} cd '$service_dir' && source venv/bin/activate && python -m uvicorn main:app --host 0.0.0.0 --port $port --reload"
                    echo -e "${GREEN}✓ $service 将在前台启动${NC}"
                else
                    cd "$service_dir" || {
                        echo -e "${RED}错误: 无法进入服务目录 '$service_dir'${NC}"
                        return 1
                    }
                    
                    # 检查main.py文件是否存在
                    if [[ ! -f "main.py" ]]; then
                        echo -e "${RED}错误: 未找到 main.py 文件${NC}"
                        return 1
                    fi
                    
                    echo -e "${GREEN}启动 $service 在前台模式，端口: $port${NC}"
                    echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
                    
                    # 激活虚拟环境并在前台启动服务
                    source "$venv_activate" || {
                        echo -e "${RED}错误: 无法激活虚拟环境${NC}"
                        return 1
                    }
                    
                    verbose_log "启动uvicorn服务，Python路径: $(which python)"
                    
                    # 前台启动服务，显示实时日志
                    python -m uvicorn main:app --host 0.0.0.0 --port "$port" --reload
                fi
            else
                echo -e "${YELLOW}在虚拟环境中启动服务（后台模式）...${NC}"
                if [[ "$DRY_RUN" == "true" ]]; then
                    echo -e "${CYAN}[DRY-RUN]${NC} cd '$service_dir' && source venv/bin/activate && nohup python -m uvicorn main:app --host 0.0.0.0 --port $port --reload > ${service}.log 2>&1 & echo \$! > ${service}.pid"
                    echo -e "${GREEN}✓ $service 已启动 (PID: 未知)${NC}"
                else
                    cd "$service_dir" || {
                        echo -e "${RED}错误: 无法进入服务目录 '$service_dir'${NC}"
                        return 1
                    }
                    
                    verbose_log "在目录 $service_dir 中启动服务"
                    
                    # 检查main.py文件是否存在
                    if [[ ! -f "main.py" ]]; then
                        echo -e "${RED}错误: 未找到 main.py 文件${NC}"
                        return 1
                    fi
                    
                    # 使用子shell在虚拟环境中启动服务
                    (
                        set -e
                        
                        # 激活虚拟环境
                        source "$venv_activate" || {
                            echo -e "${RED}错误: 无法激活虚拟环境${NC}"
                            exit 1
                        }
                        
                        verbose_log "启动uvicorn服务，Python路径: $(which python)"
                        
                        # 启动服务
                        local log_file="$LOG_FILES_DIR/${service}.log"
                        nohup python -m uvicorn main:app --host 0.0.0.0 --port "$port" --reload > "$log_file" 2>&1 &
                        local service_pid=$!
                        
                        # 注册服务
                        register_started_service "$service" "$service_pid"
                        
                        # 等待一小段时间确保服务启动
                        sleep 2
                        
                        # 检查进程是否还在运行
                        if kill -0 "$service_pid" 2>/dev/null; then
                            echo -e "${GREEN}✓ $service 已启动 (PID: $service_pid)${NC}"
                            verbose_log "服务日志文件: $log_file"
                        else
                            echo -e "${RED}错误: $service 启动后立即退出${NC}"
                            echo -e "${RED}请检查日志文件: $log_file${NC}"
                            exit 1
                        fi
                    ) || {
                        echo -e "${RED}错误: $service 启动失败${NC}"
                        if [[ -f "${service}.log" ]]; then
                            echo -e "${RED}最近的错误日志:${NC}"
                            tail -10 "${service}.log" | sed 's/^/  /'
                        fi
                        return 1
                    }
                fi
            fi
            ;;
        admin|miniapp)
            # Node.js 服务
            local port_var="$(echo $service | tr '[:lower:]' '[:upper:]')_PORT"
            local port="${!port_var}"
            
            if [[ -z "$port" ]]; then
                case $service in
                    admin) port="$ADMIN_PORT" ;;
                    miniapp) port="3000" ;;
                esac
            fi
            
            verbose_log "启动 $service 在端口 $port"
            
            # 检查并安装依赖
            if [[ -f "$service_dir/package.json" && ! -d "$service_dir/node_modules" ]]; then
                echo -e "${YELLOW}安装Node.js依赖...${NC}"
                execute_command "cd '$service_dir' && pnpm install" "安装 $service Node.js 依赖"
            fi
            
            # 启动服务
            if [[ "$LOGS" == "true" ]]; then
                echo -e "${YELLOW}启动Node.js服务（前台模式）...${NC}"
                if [[ "$DRY_RUN" == "true" ]]; then
                    case $service in
                        admin)
                            echo -e "${CYAN}[DRY-RUN]${NC} cd '$service_dir' && pnpm run dev -- --port $port"
                            ;;
                        miniapp)
                            echo -e "${CYAN}[DRY-RUN]${NC} cd '$service_dir' && pnpm run dev:weapp"
                            ;;
                    esac
                    echo -e "${GREEN}✓ $service 将在前台启动${NC}"
                else
                    cd "$service_dir" || {
                        echo -e "${RED}错误: 无法进入服务目录 '$service_dir'${NC}"
                        return 1
                    }
                    
                    echo -e "${GREEN}启动 $service 在前台模式，端口: $port${NC}"
                    echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
                    
                    # 前台启动服务，显示实时日志
                    case $service in
                        admin)
                            pnpm run dev -- --port "$port"
                            ;;
                        miniapp)
                            pnpm run dev:weapp
                            ;;
                    esac
                fi
            else
                echo -e "${YELLOW}启动Node.js服务（后台模式）...${NC}"
                # 后台启动服务
                if [[ "$DRY_RUN" == "true" ]]; then
                    case $service in
                        admin)
                            echo -e "${CYAN}[DRY-RUN]${NC} cd '$service_dir' && nohup pnpm run dev -- --port $port > ${service}.log 2>&1 & echo \$! > ${service}.pid"
                            ;;
                        miniapp)
                            echo -e "${CYAN}[DRY-RUN]${NC} cd '$service_dir' && nohup pnpm run dev:weapp > ${service}.log 2>&1 & echo \$! > ${service}.pid"
                            ;;
                    esac
                    echo -e "${GREEN}✓ $service 已启动 (PID: 未知)${NC}"
                else
                    cd "$service_dir" || {
                        echo -e "${RED}错误: 无法进入服务目录 '$service_dir'${NC}"
                        return 1
                    }
                    
                    local log_file="$LOG_FILES_DIR/${service}.log"
                    local service_pid
                    
                    case $service in
                        admin)
                            nohup pnpm run dev -- --port "$port" > "$log_file" 2>&1 &
                            service_pid=$!
                            ;;
                        miniapp)
                            nohup pnpm run dev:weapp > "$log_file" 2>&1 &
                            service_pid=$!
                            ;;
                    esac
                    
                    # 注册服务
                    register_started_service "$service" "$service_pid"
                    
                    # 等待一小段时间确保服务启动
                    sleep 2
                    
                    # 检查进程是否还在运行
                    if kill -0 "$service_pid" 2>/dev/null; then
                        echo -e "${GREEN}✓ $service 已启动 (PID: $service_pid)${NC}"
                        verbose_log "服务日志文件: $log_file"
                    else
                        echo -e "${RED}错误: $service 启动后立即退出${NC}"
                        echo -e "${RED}请检查日志文件: $log_file${NC}"
                        return 1
                    fi
                fi
            fi
            ;;
        *)
            echo -e "${YELLOW}警告: 未知服务类型 '$service'，跳过${NC}"
            return 1
            ;;
    esac
}

# Docker 启动服务
start_docker_services() {
    local services=($(get_service_list))
    local compose_file="docker-compose.yml"
    
    echo -e "${GREEN}使用 Docker Compose 启动服务...${NC}"
    verbose_log "服务列表: ${services[*]}"
    
    # 设置环境变量
    export EDITION="$EDITION"
    
    if [[ ${#services[@]} -eq 1 && -n "$SPECIFIC_SERVICE" ]]; then
        # 启动单个服务
        execute_command "docker-compose -f '$compose_file' --profile '$EDITION' up -d '${services[0]}'" "启动服务 ${services[0]}"
    else
        # 启动服务组合
        local service_args=""
        for service in "${services[@]}"; do
            service_args="$service_args $service"
        done
        execute_command "docker-compose -f '$compose_file' --profile '$EDITION' up -d $service_args" "启动服务组合"
    fi
}

# Kubernetes 启动服务
start_k8s_services() {
    echo -e "${GREEN}使用 Kubernetes 启动服务...${NC}"
    
    if [[ ! -f "k8s-deploy.sh" ]]; then
        echo -e "${RED}错误: 找不到 k8s-deploy.sh 脚本${NC}"
        return 1
    fi
    
    local services=($(get_service_list))
    verbose_log "服务列表: ${services[*]}"
    
    # 根据服务组合调用不同的部署命令
    local deploy_cmd=$(get_k8s_deploy_command)
    execute_command "$deploy_cmd" "Kubernetes部署"
}

# 获取Kubernetes部署命令
get_k8s_deploy_command() {
    local cmd="./k8s-deploy.sh"
    
    if [[ -n "$SPECIFIC_SERVICE" ]]; then
        # 部署指定服务
        cmd="$cmd deploy -s '$SPECIFIC_SERVICE'"
    else
        # 根据服务组合确定部署策略
        case "$SERVICES" in
            "backend")
                # 后端服务：只部署server和oidc-server
                cmd="$cmd build -s server && $cmd build -s oidc-server && $cmd push && $cmd deploy"
                ;;
            "web")
                # Web服务：部署后端+管理界面
                cmd="$cmd full-deploy"
                ;;
            "miniapp")
                # 小程序：只部署后端（小程序通常不在k8s中）
                cmd="$cmd build -s server && $cmd build -s oidc-server && $cmd push && $cmd deploy"
                ;;
            "full")
                # 完整服务：全部部署
                cmd="$cmd full-deploy"
                ;;
            *)
                # 默认完整部署
                cmd="$cmd full-deploy"
                ;;
        esac
    fi
    
    echo "$cmd"
}

# 显示访问地址
show_access_urls() {
    echo
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                        服务访问地址                          ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    local services=($(get_service_list))
    local base_url=""
    
    # 根据启动模式确定基础URL
    case $MODE in
        local)
            base_url="http://localhost"
            ;;
        docker)
            base_url="http://localhost"
            ;;
        k8s)
            base_url="http://your-k8s-cluster"
            ;;
    esac
    
    echo -e "${CYAN}启动模式: ${GREEN}$MODE${NC}"
    echo -e "${CYAN}服务组合: ${GREEN}$SERVICES${NC}"
    echo
    
    # 显示服务访问地址
    for service in "${services[@]}"; do
        case $service in
            server)
                echo -e "${GREEN}🚀 API服务器:${NC}     $base_url:8001"
                echo -e "   ${YELLOW}API文档:${NC}        $base_url:8001/docs"
                echo -e "   ${YELLOW}健康检查:${NC}      $base_url:8001/health"
                ;;
            oidc-server)
                echo -e "${GREEN}🔐 认证服务:${NC}     $base_url:8000"
                echo -e "   ${YELLOW}认证端点:${NC}      $base_url:8000/auth"
                echo -e "   ${YELLOW}用户信息:${NC}      $base_url:8000/userinfo"
                ;;
            admin)
                echo -e "${GREEN}🎛️  管理界面:${NC}     $base_url:3000"
                echo -e "   ${YELLOW}登录页面:${NC}      $base_url:3000/login"
                echo -e "   ${YELLOW}仪表板:${NC}        $base_url:3000/dashboard"
                ;;
            miniapp)
                echo -e "${GREEN}📱 小程序服务:${NC}   $base_url:3001"
                echo -e "   ${YELLOW}小程序API:${NC}     $base_url:3001/api"
                ;;
            prometheus)
                echo -e "${GREEN}📊 监控服务:${NC}     $base_url:9090"
                ;;
            grafana)
                echo -e "${GREEN}📈 可视化:${NC}       $base_url:3002"
                ;;
        esac
    done
    
    echo
    echo -e "${YELLOW}💡 提示:${NC}"
    case $MODE in
        local)
            echo -e "   • 本地开发模式，服务直接运行在主机上"
            echo -e "   • 使用 '$0 status --mode=local' 查看服务状态"
            echo -e "   • 使用 '$0 logs --mode=local' 查看服务日志"
            ;;
        docker)
            echo -e "   • Docker容器模式，服务运行在容器中"
            echo -e "   • 使用 'docker-compose ps' 查看容器状态"
            echo -e "   • 使用 '$0 logs --mode=docker' 查看服务日志"
            ;;
        k8s)
            echo -e "   • Kubernetes集群模式，请根据实际集群配置访问"
            echo -e "   • 使用 '$0 status --mode=k8s' 查看Pod状态"
            echo -e "   • 使用 '$0 logs --mode=k8s' 查看服务日志"
            ;;
    esac
    echo
}

# 启动服务
start_services() {
    echo -e "${BLUE}启动配置:${NC}"
    echo -e "  启动方式: ${GREEN}$MODE${NC}"
    echo -e "  版本: ${GREEN}$EDITION${NC}"
    echo -e "  服务组合: ${GREEN}$SERVICES${NC}"
    if [[ -n "$SPECIFIC_SERVICE" ]]; then
        echo -e "  指定服务: ${GREEN}$SPECIFIC_SERVICE${NC}"
    fi
    echo
    
    # 设置优雅启动机制
    if [[ "$MODE" == "local" ]]; then
        # 创建必要的目录
        mkdir -p "$PID_FILES_DIR" "$LOG_FILES_DIR"
        
        # 设置信号处理器
        setup_signal_handlers
        
        # 清理之前的 PID 文件
        cleanup_pid_files
        
        verbose_log "优雅启动机制已初始化"
    fi
    
    case $MODE in
        local)
            local services=($(get_service_list))
            local startup_success=true
            
            # 检查是否启用多 tab 模式
            if [[ "$TABS" == "true" ]]; then
                # 多 tab 模式：在不同终端 tab 中启动服务
                echo -e "${YELLOW}多 tab 模式：在不同终端 tab 中启动服务...${NC}"
                
                # 检测终端类型
                local terminal_type=$(detect_terminal_type)
                echo -e "${CYAN}检测到终端类型: $terminal_type${NC}"
                
                if [[ "$terminal_type" == "unknown" ]]; then
                    echo -e "${YELLOW}警告: 未能检测到支持的终端类型${NC}"
                    echo -e "${YELLOW}支持的终端: Terminal.app, iTerm2${NC}"
                    echo -e "${YELLOW}将回退到普通启动模式${NC}"
                    TABS=false
                elif [[ "$terminal_type" == "vscode" ]]; then
                    echo -e "${YELLOW}检测到 VS Code 集成终端，将自动在新终端中启动服务...${NC}"
                    
                    # 为 VS Code 创建启动脚本
                    local vscode_script="$PROJECT_ROOT/.vscode_start_services.sh"
                    cat > "$vscode_script" << 'EOF'
#!/bin/bash
# VS Code 服务启动脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== VS Code 多服务启动脚本 ===${NC}"
echo -e "${YELLOW}正在启动所有服务...${NC}"
echo

EOF
                    
                    # 添加每个服务的启动命令
                    for service in "${services[@]}"; do
                        local service_dir="$PROJECT_ROOT/apps/$EDITION/$service"
                        local command=$(get_service_command "$service")
                        
                        cat >> "$vscode_script" << EOF
echo -e "\${CYAN}启动服务: $service\${NC}"
cd '$service_dir'
if [[ -f "venv/bin/activate" ]]; then
    source venv/bin/activate
fi
$command &
echo -e "\${GREEN}✓ $service 已启动 (PID: \$!)\${NC}"
echo

EOF
                    done
                    
                    # 添加等待和健康检查
                    cat >> "$vscode_script" << 'EOF'
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 3

echo -e "${GREEN}所有服务已启动完成！${NC}"
echo -e "${CYAN}访问地址:${NC}"
echo -e "${CYAN}  - Server: http://localhost:8000${NC}"
echo -e "${CYAN}  - OIDC Server: http://localhost:8080${NC}"
echo
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"

# 等待用户中断
wait
EOF
                    
                    # 使脚本可执行
                    chmod +x "$vscode_script"
                    
                    echo -e "${GREEN}已创建 VS Code 启动脚本: $vscode_script${NC}"
                    echo -e "${CYAN}正在新终端中执行启动脚本...${NC}"
                    
                    # 在新终端中执行脚本
                    if [[ "$DRY_RUN" == "true" ]]; then
                        echo -e "${CYAN}[DRY-RUN]${NC} 将在新终端中运行: $vscode_script"
                    else
                        # 使用 osascript 在新终端窗口中执行
                        osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT' && '$vscode_script'\"" 2>/dev/null || {
                            echo -e "${YELLOW}无法自动打开新终端，请手动运行:${NC}"
                            echo -e "${CYAN}$vscode_script${NC}"
                        }
                    fi
                    
                    return 0
                else
                    # 在新 tab 中启动每个服务
                    for service in "${services[@]}"; do
                        local service_dir="$PROJECT_ROOT/apps/$EDITION/$service"
                        local command=$(get_service_command "$service")
                        
                        echo -e "${CYAN}在新 tab 中启动服务: $service${NC}"
                        
                        if [[ "$DRY_RUN" == "true" ]]; then
                            echo -e "${CYAN}[DRY-RUN]${NC} 将在新 tab 中运行: cd '$service_dir' && $command"
                        else
                            if open_new_tab "$service" "$command" "$service_dir" "$terminal_type"; then
                                echo -e "${GREEN}✓ $service 已在新 tab 中启动${NC}"
                                
                                # 创建 tab 启动标记文件
                                touch "$service_dir/.tab_started"
                                
                                sleep 1  # 给每个 tab 一点时间来启动
                            else
                                echo -e "${RED}✗ $service 启动失败${NC}"
                                startup_success=false
                            fi
                        fi
                    done
                    
                    if [[ "$startup_success" == "true" ]]; then
                        echo -e "${GREEN}所有服务已在不同 tab 中启动${NC}"
                        echo -e "${YELLOW}提示: 使用 '$0 stop --mode=local' 停止所有服务${NC}"
                        
                        # 显示访问地址
                        show_access_urls
                    else
                        echo -e "${RED}部分服务启动失败${NC}"
                        return 1
                    fi
                    
                    return 0
                fi
            fi
            
            if [[ "$LOGS" == "true" ]]; then
                # 日志模式：前台启动服务并跟踪日志
                echo -e "${YELLOW}日志模式：前台启动服务...${NC}"
                echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
                echo
                
                # 启动所有服务并收集PID
                local service_pids=()
                for service in "${services[@]}"; do
                    if [[ "$SHUTDOWN_REQUESTED" == "true" ]]; then
                        echo -e "${YELLOW}检测到关闭请求，停止启动${NC}"
                        startup_success=false
                        break
                    fi
                    
                    echo -e "${CYAN}启动服务: $service${NC}"
                    if start_local_service "$service"; then
                        # 等待服务启动完成
                        if wait_for_service_startup "$service"; then
                            echo -e "${GREEN}✓ $service 启动成功${NC}"
                        else
                            echo -e "${RED}✗ $service 启动超时或失败${NC}"
                            startup_success=false
                            break
                        fi
                    else
                        echo -e "${RED}✗ $service 启动失败${NC}"
                        startup_success=false
                        break
                    fi
                done
                
                if [[ "$startup_success" == "false" ]]; then
                    echo -e "${RED}启动过程中出现错误，执行回滚...${NC}"
                    rollback_startup
                    return 1
                fi
                
                echo
                echo -e "${YELLOW}等待服务初始化...${NC}"
                sleep 3
                
                # 执行增强健康检查
                if ! enhanced_health_check "${services[@]}"; then
                    echo -e "${YELLOW}健康检查部分失败，但服务将继续运行${NC}"
                fi
                
                # 显示访问地址
                show_access_urls
                echo
                
                # 跟踪所有服务的日志
                if [[ "$DRY_RUN" != "true" ]]; then
                    echo -e "${CYAN}=== 开始跟踪服务日志 ===${NC}"
                    track_service_logs "${services[@]}"
                else
                    echo -e "${CYAN}[DRY-RUN]${NC} 将跟踪服务日志: ${services[*]}"
                fi
            else
                # 后台模式：优雅启动
                echo -e "${YELLOW}后台模式：优雅启动服务...${NC}"
                
                for service in "${services[@]}"; do
                    if [[ "$SHUTDOWN_REQUESTED" == "true" ]]; then
                        echo -e "${YELLOW}检测到关闭请求，停止启动${NC}"
                        startup_success=false
                        break
                    fi
                    
                    echo -e "${CYAN}启动服务: $service${NC}"
                    if start_local_service "$service"; then
                        # 等待服务启动完成
                        if wait_for_service_startup "$service"; then
                            echo -e "${GREEN}✓ $service 启动成功${NC}"
                        else
                            echo -e "${RED}✗ $service 启动超时或失败${NC}"
                            startup_success=false
                            break
                        fi
                    else
                        echo -e "${RED}✗ $service 启动失败${NC}"
                        startup_success=false
                        break
                    fi
                done
                
                if [[ "$startup_success" == "false" ]]; then
                    echo -e "${RED}启动过程中出现错误，执行回滚...${NC}"
                    rollback_startup
                    return 1
                fi
                
                echo -e "${GREEN}所有服务已在后台启动${NC}"
                
                # 执行增强健康检查
                if [[ "$DRY_RUN" != "true" ]]; then
                    echo
                    if enhanced_health_check "${services[@]}"; then
                        echo -e "${GREEN}✓ 所有服务健康检查通过${NC}"
                    else
                        echo -e "${YELLOW}⚠ 健康检查部分失败，但服务将继续运行${NC}"
                    fi
                else
                    echo -e "${CYAN}[DRY-RUN]${NC} 将执行健康检查: ${services[*]}"
                fi
            fi
            ;;
        docker)
            start_docker_services
            ;;
        k8s)
            start_k8s_services
            ;;
    esac
    
    # 显示访问地址
    show_access_urls
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}停止服务...${NC}"
    
    # 设置关闭请求标志
    SHUTDOWN_REQUESTED="true"
    
    case $MODE in
        local)
            # 使用优雅关闭机制
            graceful_shutdown
            ;;
        docker)
            stop_docker
            ;;
        k8s)
            stop_k8s
            ;;
    esac
}

# Kubernetes停止
stop_k8s() {
    echo -e "${BLUE}停止Kubernetes服务...${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${CYAN}[DRY-RUN]${NC} 停止Kubernetes服务: $SERVICES"
        if [[ -n "$SPECIFIC_SERVICE" ]]; then
            echo -e "${CYAN}[DRY-RUN]${NC} ./k8s-deploy.sh stop -s $SPECIFIC_SERVICE"
        else
            echo -e "${CYAN}[DRY-RUN]${NC} ./k8s-deploy.sh stop"
        fi
        return 0
    fi
    
    # 检查k8s-deploy.sh脚本
    if [[ ! -f "k8s-deploy.sh" ]]; then
        echo -e "${RED}错误: 找不到 k8s-deploy.sh 脚本${NC}"
        exit 1
    fi
    
    # 停止Kubernetes服务
    if [[ -n "$SPECIFIC_SERVICE" ]]; then
        execute_command "./k8s-deploy.sh stop -s $SPECIFIC_SERVICE" "停止服务 $SPECIFIC_SERVICE"
    else
        execute_command "./k8s-deploy.sh stop" "停止Kubernetes服务"
    fi
}

# Docker停止
stop_docker() {
    echo "${BLUE}停止Docker服务...${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] 停止Docker服务"
        local services_list=$(get_docker_services)
        if [[ -n "$services_list" ]]; then
            echo "[DRY-RUN] docker-compose -f docker-compose.yml stop $services_list"
        else
            echo "[DRY-RUN] docker-compose -f docker-compose.yml down"
        fi
        return 0
    fi
    
    local services_list=$(get_docker_services)
    local compose_file="docker-compose.yml"
    
    # 设置环境变量
    export EDITION="$EDITION"
    
    if [[ -n "$services_list" ]]; then
        execute_command "docker-compose -f $compose_file stop $services_list" "停止指定Docker服务"
    else
        execute_command "docker-compose -f $compose_file down" "停止所有Docker服务"
    fi
}

# 获取Docker服务列表
get_docker_services() {
    local services=($(get_service_list))
    
    if [[ -n "$SPECIFIC_SERVICE" ]]; then
        echo "$SPECIFIC_SERVICE"
    elif [[ ${#services[@]} -gt 0 ]]; then
        echo "${services[*]}"
    else
        echo ""
    fi
}

# 本地停止服务（保留用于向后兼容）
stop_local() {
    echo -e "${YELLOW}停止本地服务...${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${CYAN}[DRY-RUN]${NC} 停止本地服务"
        return 0
    fi
    
    # 检查是否有多 tab 启动的服务需要特殊处理
    local has_tab_services=false
    local services=($(get_service_list))
    
    # 检查是否存在 tab 启动的服务标记文件
    for service in "${services[@]}"; do
        local service_dir="$PROJECT_ROOT/apps/$EDITION/$service"
        local tab_marker="$service_dir/.tab_started"
        if [[ -f "$tab_marker" ]]; then
            has_tab_services=true
            break
        fi
    done
    
    if [[ "$has_tab_services" == "true" ]]; then
        echo -e "${CYAN}检测到多 tab 启动的服务，正在停止...${NC}"
        
        # 停止所有 tab 启动的服务
        for service in "${services[@]}"; do
            local service_dir="$PROJECT_ROOT/apps/$EDITION/$service"
            local tab_marker="$service_dir/.tab_started"
            
            if [[ -f "$tab_marker" ]]; then
                echo -e "${YELLOW}停止 tab 启动的服务: $service${NC}"
                
                # 停止服务进程
                stop_local_service "$service"
                
                # 清理 tab 标记文件
                rm -f "$tab_marker"
                
                echo -e "${GREEN}✓ $service 已停止${NC}"
            fi
        done
        
        echo -e "${GREEN}所有 tab 启动的服务已停止${NC}"
        echo -e "${YELLOW}提示: 请手动关闭相关的终端 tab${NC}"
    else
        # 使用优雅关闭机制
        graceful_shutdown
    fi
}

# 停止本地单个服务
stop_local_service() {
    local service_name="$1"
    local service_dir="$PROJECT_ROOT/apps/$EDITION/$service_name"
    local pid_file="$service_dir/${service_name}.pid"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}停止服务: $service_name (PID: $pid)${NC}"
            kill "$pid"
            # 等待进程结束
            local count=0
            while kill -0 "$pid" 2>/dev/null && [[ $count -lt 10 ]]; do
                sleep 1
                ((count++))
            done
            
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${RED}强制停止服务: $service_name${NC}"
                kill -9 "$pid"
            fi
            
            echo -e "${GREEN}✓ $service_name 已停止${NC}"
        else
            echo -e "${YELLOW}服务 $service_name 未运行${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}未找到服务 $service_name 的PID文件${NC}"
    fi
}

# 重启服务
restart_services() {
    echo -e "${BLUE}重启服务...${NC}"
    stop_services
    sleep 2
    start_services
}

# 查看服务状态
show_status() {
    echo -e "${BLUE}服务状态:${NC}"
    
    case $MODE in
        local)
            status_local
            ;;
        docker)
            status_docker
            ;;
        k8s)
            status_k8s
            ;;
    esac
}

# Docker状态查看
status_docker() {
    echo -e "${BLUE}Docker服务状态:${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${CYAN}[DRY-RUN]${NC} 查看Docker服务状态"
        local services_list=$(get_docker_services)
        if [[ -n "$services_list" ]]; then
            echo -e "${CYAN}[DRY-RUN]${NC} docker-compose -f docker-compose.yml ps $services_list"
        else
            echo -e "${CYAN}[DRY-RUN]${NC} docker-compose -f docker-compose.yml ps"
        fi
        return 0
    fi
    
    local services_list=$(get_docker_services)
    local compose_file="docker-compose.yml"
    
    # 设置环境变量
    export EDITION="$EDITION"
    
    if [[ -n "$services_list" ]]; then
        execute_command "docker-compose -f $compose_file --profile '$EDITION' ps $services_list" "查看指定Docker服务状态"
    else
        execute_command "docker-compose -f $compose_file --profile '$EDITION' ps" "查看所有Docker服务状态"
    fi
    
    # 显示服务健康状态
    echo ""
    echo -e "${CYAN}=== 服务健康检查 ===${NC}"
    check_docker_services_health
}

# 检查Docker服务健康状态
check_docker_services_health() {
    local services_list=$(get_docker_services)
    
    if [[ -z "$services_list" ]]; then
        # 获取所有运行中的服务
        services_list=$(docker-compose -f docker-compose.yml --profile "$EDITION" ps --services --filter "status=running" 2>/dev/null || echo "")
    fi
    
    if [[ -n "$services_list" ]]; then
        echo "┌─────────────────┬──────────┬─────────────────┐"
        echo "│ 服务名称        │ 状态     │ 健康检查        │"
        echo "├─────────────────┼──────────┼─────────────────┤"
        
        for service in $services_list; do
            local container_name=$(docker-compose -f docker-compose.yml --profile "$EDITION" ps -q "$service" 2>/dev/null)
            if [[ -n "$container_name" ]]; then
                local status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "unknown")
                local health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$container_name" 2>/dev/null || echo "unknown")
                
                printf "│ %-15s │ %-8s │ %-15s │\n" "$service" "$status" "$health"
            else
                printf "│ %-15s │ %-8s │ %-15s │\n" "$service" "not found" "unknown"
            fi
        done
        
        echo "└─────────────────┴──────────┴─────────────────┘"
    else
        echo -e "${YELLOW}没有找到运行中的Docker服务${NC}"
    fi
}

# Kubernetes状态查看
status_k8s() {
    echo -e "${BLUE}查看Kubernetes服务状态...${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${CYAN}[DRY-RUN]${NC} 查看Kubernetes服务状态: $SERVICES"
        if [[ -n "$SPECIFIC_SERVICE" ]]; then
            echo -e "${CYAN}[DRY-RUN]${NC} ./k8s-deploy.sh status -s $SPECIFIC_SERVICE"
        else
            echo -e "${CYAN}[DRY-RUN]${NC} ./k8s-deploy.sh status"
        fi
        return 0
    fi
    
    # 检查k8s-deploy.sh脚本
    if [[ ! -f "k8s-deploy.sh" ]]; then
        echo -e "${RED}错误: 找不到 k8s-deploy.sh 脚本${NC}"
        exit 1
    fi
    
    # 查看Kubernetes状态
    if [[ -n "$SPECIFIC_SERVICE" ]]; then
        execute_command "./k8s-deploy.sh status -s $SPECIFIC_SERVICE" "查看服务 $SPECIFIC_SERVICE 状态"
    else
        execute_command "./k8s-deploy.sh status" "查看Kubernetes状态"
    fi
}

# 本地状态检查
status_local() {
    echo -e "${BLUE}本地服务状态:${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${CYAN}[DRY-RUN]${NC} 检查本地服务状态"
        return 0
    fi
    
    local services=()
    case "$SERVICES" in
        "backend")
            services=("server" "oidc-server")
            ;;
        "web")
            services=("server" "oidc-server" "admin")
            ;;
        "miniapp")
            services=("server" "oidc-server" "miniapp")
            ;;
        "full")
            services=("server" "oidc-server" "admin" "miniapp")
            ;;
        *)
            if [[ -n "$SPECIFIC_SERVICE" ]]; then
                services=("$SPECIFIC_SERVICE")
            else
                services=("server" "oidc-server" "admin" "miniapp")
            fi
            ;;
    esac
    
    echo "┌─────────────────┬──────────┬─────────┬──────────────────────────┐"
    echo "│ 服务名称        │ 状态     │ PID     │ 端口                     │"
    echo "├─────────────────┼──────────┼─────────┼──────────────────────────┤"
    
    for service in "${services[@]}"; do
        check_local_service_status "$service"
    done
    
    echo "└─────────────────┴──────────┴─────────┴──────────────────────────┘"
}

# 检查本地单个服务状态
check_local_service_status() {
    local service_name="$1"
    local service_dir="$PROJECT_ROOT/apps/$EDITION/$service_name"
    local pid_file="$service_dir/${service_name}.pid"
    local status="${RED}停止${NC}"
    local pid="-"
    local port="-"
    
    # 获取服务端口
    case "$service_name" in
        "server")
            port="8001"
            ;;
        "oidc-server")
            port="8000"
            ;;
        "admin")
            port="3000"
            ;;
        "miniapp")
            port="3001"
            ;;
    esac
    
    if [[ -f "$pid_file" ]]; then
        local service_pid=$(cat "$pid_file")
        if kill -0 "$service_pid" 2>/dev/null; then
            status="${GREEN}运行${NC}"
            pid="$service_pid"
        else
            # PID文件存在但进程不存在，清理PID文件
            rm -f "$pid_file"
        fi
    fi
    
    printf "│ %-15s │ %-8s │ %-7s │ %-24s │\n" "$service_name" "$status" "$pid" "$port"
}

# 查看服务日志
show_logs() {
    case $MODE in
        local)
            logs_local
            ;;
        docker)
            logs_docker
            ;;
        k8s)
            logs_k8s
            ;;
    esac
}

# 本地日志查看
logs_local() {
    echo -e "${BLUE}本地服务日志:${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${CYAN}[DRY-RUN]${NC} 查看本地服务日志"
        return 0
    fi
    
    if [[ -n "$SPECIFIC_SERVICE" ]]; then
        # 查看指定服务的日志
        show_local_service_logs "$SPECIFIC_SERVICE"
    else
        # 查看所有相关服务的日志
        local services=()
        case "$SERVICES" in
            "backend")
                services=("server" "oidc-server")
                ;;
            "web")
                services=("server" "oidc-server" "admin")
                ;;
            "miniapp")
                services=("server" "oidc-server" "miniapp")
                ;;
            "full")
                services=("server" "oidc-server" "admin" "miniapp")
                ;;
            *)
                services=("server" "oidc-server" "admin" "miniapp")
                ;;
        esac
        
        for service in "${services[@]}"; do
            show_local_service_logs "$service"
        done
    fi
}

# 查看本地单个服务日志
show_local_service_logs() {
    local service_name="$1"
    local service_dir="$PROJECT_ROOT/apps/$EDITION/$service_name"
    local log_file="$service_dir/${service_name}.log"
    
    echo -e "${CYAN}=== $service_name 服务日志 ===${NC}"
    
    if [[ -f "$log_file" ]]; then
        echo -e "${YELLOW}日志文件: $log_file${NC}"
        echo -e "${YELLOW}最近50行日志:${NC}"
        tail -n 50 "$log_file"
        echo ""
    else
        echo -e "${RED}未找到日志文件: $log_file${NC}"
        echo ""
    fi
}

# Kubernetes日志查看
logs_k8s() {
    echo -e "${BLUE}查看Kubernetes服务日志...${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${CYAN}[DRY-RUN]${NC} 查看Kubernetes服务日志: $SERVICES"
        if [[ -n "$SPECIFIC_SERVICE" ]]; then
            echo -e "${CYAN}[DRY-RUN]${NC} ./k8s-deploy.sh logs -s $SPECIFIC_SERVICE"
        else
            echo -e "${CYAN}[DRY-RUN]${NC} ./k8s-deploy.sh logs -s server"
        fi
        return 0
    fi
    
    # 检查k8s-deploy.sh脚本
    if [[ ! -f "k8s-deploy.sh" ]]; then
        echo -e "${RED}错误: 找不到 k8s-deploy.sh 脚本${NC}"
        exit 1
    fi
    
    # 查看Kubernetes日志
    if [[ -n "$SPECIFIC_SERVICE" ]]; then
        execute_command "./k8s-deploy.sh logs -s $SPECIFIC_SERVICE" "查看服务 $SPECIFIC_SERVICE 日志"
    else
        # 默认查看server服务日志
        execute_command "./k8s-deploy.sh logs -s server" "查看server服务日志"
    fi
}

# 清理服务（信号处理函数）
cleanup_services() {
    echo
    echo -e "${YELLOW}接收到停止信号，正在清理服务...${NC}"
    
    # 获取当前启动的服务列表
    local services=($(get_service_list))
    
    for service in "${services[@]}"; do
        local service_dir="$PROJECT_ROOT/apps/$EDITION/$service"
        local pid_file="$service_dir/${service}.pid"
        
        if [[ -f "$pid_file" ]]; then
            local pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${YELLOW}停止服务: $service (PID: $pid)${NC}"
                kill "$pid" 2>/dev/null
                
                # 等待进程结束
                local count=0
                while kill -0 "$pid" 2>/dev/null && [[ $count -lt 5 ]]; do
                    sleep 1
                    ((count++))
                done
                
                if kill -0 "$pid" 2>/dev/null; then
                    echo -e "${RED}强制停止服务: $service${NC}"
                    kill -9 "$pid" 2>/dev/null
                fi
            fi
            rm -f "$pid_file"
        fi
    done
    
    echo -e "${GREEN}✓ 所有服务已停止${NC}"
}

# 检查端口状态
check_port_status() {
    local host="$1"
    local port="$2"
    local timeout="${3:-3}"
    
    # 使用nc命令检查端口连通性
    if command -v nc &> /dev/null; then
        if nc -z -w"$timeout" "$host" "$port" 2>/dev/null; then
            return 0
        fi
    else
        # 如果没有nc，使用curl检查HTTP端口
        if curl -s --connect-timeout "$timeout" "http://$host:$port" >/dev/null 2>&1; then
            return 0
        fi
    fi
    
    return 1
}

# 轮询检查服务端口状态
poll_service_ports() {
    local services=("$@")
    local max_attempts=12
    local interval=5
    local attempt=1
    
    echo -e "${YELLOW}检查服务端口状态...${NC}"
    echo -e "${CYAN}轮询间隔: ${interval}秒，最大尝试次数: ${max_attempts}${NC}"
    echo
    
    while [[ $attempt -le $max_attempts ]]; do
        local all_ready=true
        local ready_count=0
        local total_count=${#services[@]}
        
        echo -e "${BLUE}第 $attempt/$max_attempts 次检查:${NC}"
        
        for service in "${services[@]}"; do
            local port=""
            local host="127.0.0.1"
            
            # 获取服务端口
            case "$service" in
                "server")
                    port="8001"
                    ;;
                "oidc-server")
                    port="8000"
                    ;;
                "admin")
                    port="3000"
                    ;;
                "miniapp")
                    port="3001"
                    ;;
                *)
                    echo -e "  ${YELLOW}⚠ $service: 未知服务，跳过端口检查${NC}"
                    continue
                    ;;
            esac
            
            if check_port_status "$host" "$port"; then
                echo -e "  ${GREEN}✓ $service: 端口 $port 可访问${NC}"
                ((ready_count++))
            else
                echo -e "  ${RED}✗ $service: 端口 $port 不可访问${NC}"
                all_ready=false
            fi
        done
        
        echo -e "${CYAN}状态: $ready_count/$total_count 个服务端口可访问${NC}"
        
        if [[ "$all_ready" == "true" ]]; then
            echo
            echo -e "${GREEN}🎉 所有服务端口都已可访问！${NC}"
            return 0
        fi
        
        if [[ $attempt -lt $max_attempts ]]; then
            echo -e "${YELLOW}等待 ${interval} 秒后重试...${NC}"
            echo
            sleep "$interval"
        fi
        
        ((attempt++))
    done
    
    echo
    echo -e "${YELLOW}⚠ 端口检查完成，部分服务可能仍在启动中${NC}"
    echo -e "${YELLOW}请手动检查服务状态或查看日志${NC}"
    return 1
}

# 跟踪服务日志
track_service_logs() {
    local services=("$@")
    local log_files=()
    
    # 收集所有日志文件
    for service in "${services[@]}"; do
        local service_dir="$PROJECT_ROOT/apps/$EDITION/$service"
        local log_file="$service_dir/${service}.log"
        
        if [[ -f "$log_file" ]]; then
            log_files+=("$log_file")
        fi
    done
    
    if [[ ${#log_files[@]} -eq 0 ]]; then
        echo -e "${YELLOW}暂无日志文件可跟踪${NC}"
        echo -e "${YELLOW}等待服务生成日志...${NC}"
        
        # 等待日志文件生成
        local wait_count=0
        while [[ ${#log_files[@]} -eq 0 && $wait_count -lt 30 ]]; do
            sleep 1
            ((wait_count++))
            
            # 重新检查日志文件
            log_files=()
            for service in "${services[@]}"; do
                local service_dir="$PROJECT_ROOT/apps/$EDITION/$service"
                local log_file="$service_dir/${service}.log"
                
                if [[ -f "$log_file" ]]; then
                    log_files+=("$log_file")
                fi
            done
        done
    fi
    
    if [[ ${#log_files[@]} -gt 0 ]]; then
        echo -e "${GREEN}跟踪日志文件: ${log_files[*]}${NC}"
        echo -e "${YELLOW}按 Ctrl+C 停止日志跟踪${NC}"
        echo
        
        # 使用tail -f跟踪多个日志文件
        if [[ ${#log_files[@]} -eq 1 ]]; then
            # 单个文件
            tail -f "${log_files[0]}"
        else
            # 多个文件，显示文件名
            tail -f "${log_files[@]}" 2>/dev/null
        fi
    else
        echo -e "${RED}未找到任何日志文件${NC}"
        echo -e "${YELLOW}服务可能启动失败，请检查服务状态${NC}"
        
        # 显示服务状态
        echo
        show_status
    fi
}

# 主函数
main() {
    # 解析命令行参数
    parse_args "$@"
    
    # 显示帮助
    if [[ "$COMMAND" == "help" ]]; then
        show_help
        exit 0
    fi
    
    # 验证参数
    validate_args
    
    # 检查依赖
    check_dependencies
    
    # 检查配置
    check_config
    
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
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        *)
            echo -e "${RED}错误: 未知命令 '$COMMAND'${NC}"
            show_help
            exit 1
            ;;
    esac
    
    # 如果是启动命令且为本地模式，在脚本结束时清理
    if [[ "$COMMAND" == "start" && "$MODE" == "local" && "$LOGS" != "true" ]]; then
        verbose_log "脚本正常结束，保持服务运行"
    fi
}

# 执行主函数
main "$@"