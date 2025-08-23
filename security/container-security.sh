#!/bin/bash

# 容器安全配置脚本
# 用于配置Docker容器安全扫描和非特权用户运行策略

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

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行或当前用户无权限访问Docker"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 安装Docker Bench Security
install_docker_bench() {
    log_info "安装Docker Bench Security..."
    
    if [[ ! -d "security/docker-bench-security" ]]; then
        git clone https://github.com/docker/docker-bench-security.git security/docker-bench-security
        log_success "Docker Bench Security已下载"
    else
        log_info "Docker Bench Security已存在，更新到最新版本..."
        cd security/docker-bench-security
        git pull
        cd ../..
    fi
}

# 安装Trivy安全扫描器
install_trivy() {
    log_info "检查Trivy安全扫描器..."
    
    if ! command -v trivy &> /dev/null; then
        log_info "安装Trivy..."
        
        # 检测操作系统
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install trivy
            else
                log_error "请先安装Homebrew或手动安装Trivy"
                return 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
        else
            log_error "不支持的操作系统: $OSTYPE"
            return 1
        fi
        
        log_success "Trivy安装完成"
    else
        log_success "Trivy已安装"
    fi
}

# 创建非特权用户的Dockerfile模板
create_secure_dockerfile_template() {
    log_info "创建安全的Dockerfile模板..."
    
    mkdir -p security/templates
    
    cat > security/templates/Dockerfile.secure-template << 'EOF'
# 安全的Dockerfile模板
# 使用非特权用户运行容器

# 使用官方基础镜像
FROM node:18-alpine AS base

# 创建非特权用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# 设置工作目录
WORKDIR /app

# 复制package文件并安装依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 更改文件所有权
RUN chown -R appuser:appgroup /app

# 切换到非特权用户
USER appuser

# 暴露端口（非特权端口）
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动应用
CMD ["npm", "start"]
EOF

    log_success "安全Dockerfile模板已创建: security/templates/Dockerfile.secure-template"
}

# 更新现有Dockerfile以使用非特权用户
update_dockerfiles() {
    log_info "更新现有Dockerfile以使用非特权用户..."
    
    # 查找所有Dockerfile
    local dockerfiles=($(find . -name "Dockerfile" -not -path "./security/*" -not -path "./node_modules/*"))
    
    for dockerfile in "${dockerfiles[@]}"; do
        log_info "检查 $dockerfile"
        
        # 检查是否已经有非特权用户配置
        if grep -q "USER" "$dockerfile" && ! grep -q "USER root" "$dockerfile"; then
            log_success "$dockerfile 已配置非特权用户"
            continue
        fi
        
        # 备份原文件
        cp "$dockerfile" "${dockerfile}.backup"
        
        # 创建更新后的Dockerfile
        cat > "${dockerfile}.secure" << EOF
# 原始Dockerfile内容
$(cat "$dockerfile")

# 添加安全配置
# 创建非特权用户
RUN if ! id appuser > /dev/null 2>&1; then \
        addgroup -g 1001 -S appgroup && \
        adduser -S appuser -u 1001 -G appgroup; \
    fi

# 更改文件所有权
RUN chown -R appuser:appgroup /app || chown -R appuser:appgroup /usr/src/app || true

# 切换到非特权用户
USER appuser
EOF
        
        log_warning "已创建安全版本: ${dockerfile}.secure"
        log_warning "请手动检查并替换原文件"
    done
}

# 扫描Docker镜像安全漏洞
scan_images() {
    log_info "扫描Docker镜像安全漏洞..."
    
    # 获取所有本地镜像
    local images=($(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>"))
    
    if [[ ${#images[@]} -eq 0 ]]; then
        log_warning "未找到本地Docker镜像"
        return 0
    fi
    
    mkdir -p security/scan-reports
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    
    for image in "${images[@]}"; do
        log_info "扫描镜像: $image"
        
        # 使用Trivy扫描
        local report_file="security/scan-reports/trivy_${image//[:\/]/_}_${timestamp}.json"
        
        if command -v trivy &> /dev/null; then
            trivy image --format json --output "$report_file" "$image" || true
            
            # 生成简化报告
            local summary_file="security/scan-reports/summary_${image//[:\/]/_}_${timestamp}.txt"
            trivy image --format table "$image" > "$summary_file" 2>/dev/null || true
            
            log_success "扫描报告已保存: $report_file"
        else
            log_warning "Trivy未安装，跳过 $image 的扫描"
        fi
    done
}

# 运行Docker Bench Security
run_docker_bench() {
    log_info "运行Docker Bench Security检查..."
    
    if [[ ! -d "security/docker-bench-security" ]]; then
        log_error "Docker Bench Security未安装，请先运行 install-tools"
        return 1
    fi
    
    cd security/docker-bench-security
    
    # 运行安全检查
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="../scan-reports/docker-bench_${timestamp}.log"
    
    mkdir -p ../scan-reports
    
    sudo ./docker-bench-security.sh > "$report_file" 2>&1 || true
    
    cd ../..
    
    log_success "Docker Bench Security报告已保存: security/scan-reports/docker-bench_${timestamp}.log"
}

# 配置Docker守护进程安全选项
configure_docker_daemon() {
    log_info "配置Docker守护进程安全选项..."
    
    local daemon_config="/etc/docker/daemon.json"
    local backup_config="security/backups/daemon.json.backup"
    
    mkdir -p security/backups
    
    # 备份现有配置
    if [[ -f "$daemon_config" ]]; then
        sudo cp "$daemon_config" "$backup_config"
        log_info "已备份现有Docker配置"
    fi
    
    # 创建安全配置
    cat > security/daemon.json.secure << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp.json",
  "apparmor-profile": "docker-default",
  "selinux-enabled": false,
  "disable-legacy-registry": true,
  "experimental": false,
  "metrics-addr": "127.0.0.1:9323",
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
EOF
    
    log_warning "安全的Docker配置已创建: security/daemon.json.secure"
    log_warning "请手动复制到 $daemon_config 并重启Docker服务"
}

# 创建容器安全策略
create_security_policies() {
    log_info "创建容器安全策略文档..."
    
    cat > security/container-security-policy.md << 'EOF'
# 容器安全策略

## 镜像安全

### 基础镜像选择
- 使用官方或可信的基础镜像
- 优先选择Alpine Linux等轻量级发行版
- 定期更新基础镜像版本
- 避免使用latest标签，使用具体版本号

### 镜像构建
- 使用多阶段构建减少攻击面
- 删除不必要的包和文件
- 不在镜像中包含敏感信息
- 使用.dockerignore排除敏感文件

## 运行时安全

### 用户权限
- 创建并使用非特权用户运行容器
- 避免使用root用户
- 设置适当的文件权限

### 网络安全
- 使用自定义网络而非默认bridge
- 限制容器间通信
- 只暴露必要的端口
- 使用非特权端口（>1024）

### 资源限制
- 设置内存和CPU限制
- 配置适当的重启策略
- 使用健康检查

### 安全选项
- 启用只读根文件系统
- 禁用新权限获取
- 使用安全配置文件（AppArmor/SELinux）
- 启用用户命名空间

## 监控和审计

### 日志管理
- 配置集中化日志收集
- 设置日志轮转策略
- 监控异常活动

### 安全扫描
- 定期扫描镜像漏洞
- 监控运行时安全事件
- 实施合规性检查

## 最佳实践

1. 定期更新和打补丁
2. 使用镜像签名验证
3. 实施最小权限原则
4. 定期进行安全审计
5. 建立事件响应流程
EOF
    
    log_success "容器安全策略文档已创建: security/container-security-policy.md"
}

# 生成安全检查报告
generate_security_report() {
    log_info "生成容器安全检查报告..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="security/scan-reports/container-security-report_${timestamp}.md"
    
    mkdir -p security/scan-reports
    
    cat > "$report_file" << EOF
# 容器安全检查报告

生成时间: $(date)

## Docker环境信息

\`\`\`
$(docker version 2>/dev/null || echo "Docker未安装或无法访问")
\`\`\`

## 本地镜像列表

\`\`\`
$(docker images 2>/dev/null || echo "无法获取镜像列表")
\`\`\`

## 运行中的容器

\`\`\`
$(docker ps 2>/dev/null || echo "无法获取容器列表")
\`\`\`

## 安全建议

1. 定期更新基础镜像
2. 使用非特权用户运行容器
3. 实施网络隔离
4. 配置资源限制
5. 启用安全扫描

## 扫描结果

详细的漏洞扫描结果请查看同目录下的Trivy报告文件。

## 后续行动

- [ ] 修复发现的高危漏洞
- [ ] 更新不安全的镜像
- [ ] 实施安全策略
- [ ] 配置监控和告警
EOF
    
    log_success "安全检查报告已生成: $report_file"
}

# 显示帮助信息
show_help() {
    echo "容器安全配置脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  install-tools    - 安装安全扫描工具"
    echo "  scan-images      - 扫描Docker镜像漏洞"
    echo "  docker-bench     - 运行Docker Bench Security"
    echo "  update-files     - 更新Dockerfile使用非特权用户"
    echo "  configure-daemon - 配置Docker守护进程安全选项"
    echo "  create-policies  - 创建安全策略文档"
    echo "  full-scan        - 执行完整的安全扫描"
    echo "  generate-report  - 生成安全检查报告"
    echo "  help             - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 install-tools     # 安装安全工具"
    echo "  $0 full-scan        # 执行完整安全扫描"
    echo "  $0 update-files     # 更新Dockerfile安全配置"
}

# 主函数
main() {
    local action="${1:-help}"
    
    case "$action" in
        "install-tools")
            check_docker
            install_docker_bench
            install_trivy
            log_success "安全工具安装完成！"
            ;;
        "scan-images")
            check_docker
            scan_images
            ;;
        "docker-bench")
            check_docker
            run_docker_bench
            ;;
        "update-files")
            create_secure_dockerfile_template
            update_dockerfiles
            ;;
        "configure-daemon")
            configure_docker_daemon
            ;;
        "create-policies")
            create_security_policies
            ;;
        "full-scan")
            check_docker
            install_trivy
            scan_images
            run_docker_bench
            generate_security_report
            log_success "完整安全扫描完成！"
            ;;
        "generate-report")
            generate_security_report
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