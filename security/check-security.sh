#!/bin/bash

# PhoenixCoder 安全配置检查脚本
# 检查项目中的安全配置问题

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计数器
ERROR_COUNT=0
WARNING_COUNT=0
INFO_COUNT=0

# 日志函数
log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    ERROR_COUNT=$((ERROR_COUNT + 1))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
    WARNING_COUNT=$((WARNING_COUNT + 1))
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    INFO_COUNT=$((INFO_COUNT + 1))
}

# 检查弱密码
check_weak_passwords() {
    local file="$1"
    local description="$2"
    
    if [[ ! -f "$file" ]]; then
        return 0
    fi
    
    # 弱密码模式
    local weak_patterns=(
        "password"
        "123456"
        "admin"
        "root"
        "guest"
        "user"
        "demo"
        "example"
        "changeme"
        "your-"
        "dev-"
        "8dsagfsa"
    )
    
    # 检查实际密码值的模式
    local value_patterns=(
        "=['\"]test['\"]$"
        "=['\"]password['\"]$"
        "=['\"]123456['\"]$"
        "=['\"]admin['\"]$"
        "=['\"]changeme['\"]$"
    )
    
    local found_weak=false
    
    # 检查通用弱密码模式
    for pattern in "${weak_patterns[@]}"; do
        if grep -qi "$pattern" "$file" 2>/dev/null; then
            if [[ "$found_weak" == false ]]; then
                log_warning "$description 中发现弱密码模式: $file"
                found_weak=true
            fi
            local matches=$(grep -ni "$pattern" "$file" 2>/dev/null | head -3)
            echo "  模式: $pattern"
            echo "$matches" | while read -r line; do
                echo "    $line"
            done
        fi
    done
    
    # 检查实际密码值
    for pattern in "${value_patterns[@]}"; do
        if grep -qE "$pattern" "$file" 2>/dev/null; then
            if [[ "$found_weak" == false ]]; then
                log_warning "$description 中发现弱密码值: $file"
                found_weak=true
            fi
            local matches=$(grep -nE "$pattern" "$file" 2>/dev/null | head -3)
            echo "  模式: $pattern"
            echo "$matches" | while read -r line; do
                echo "    $line"
            done
        fi
    done
    
    # 检查短密码（少于8字符）
    local short_passwords=$(grep -E "(PASSWORD|SECRET|KEY).*=.*['\"][^'\"]{1,7}['\"]" "$file" 2>/dev/null || true)
    if [[ -n "$short_passwords" ]]; then
        if [[ "$found_weak" == false ]]; then
            log_warning "$description 中发现短密码: $file"
            found_weak=true
        fi
        echo "  短密码（少于8字符）:"
        echo "$short_passwords" | while read -r line; do
            echo "    $line"
        done
    fi
}

# 检查硬编码密钥
check_hardcoded_secrets() {
    local file="$1"
    local description="$2"
    
    if [[ ! -f "$file" ]]; then
        return 0
    fi
    
    # 硬编码密钥模式
    local secret_patterns=(
        "sk-[a-zA-Z0-9]{32,}"
        "xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+"
        "ghp_[a-zA-Z0-9]{36}"
        "gho_[a-zA-Z0-9]{36}"
        "ghu_[a-zA-Z0-9]{36}"
        "ghs_[a-zA-Z0-9]{36}"
        "ghr_[a-zA-Z0-9]{36}"
        "AKIA[0-9A-Z]{16}"
        "ya29\\.[0-9A-Za-z\\-_]+"
    )
    
    local found_secrets=false
    
    for pattern in "${secret_patterns[@]}"; do
        if grep -qE "$pattern" "$file" 2>/dev/null; then
            if [[ "$found_secrets" == false ]]; then
                log_error "$description 中发现硬编码密钥: $file"
                found_secrets=true
            fi
            local matches=$(grep -nE "$pattern" "$file" 2>/dev/null | head -3)
            echo "  模式: $pattern"
            echo "$matches" | while read -r line; do
                echo "    $line"
            done
        fi
    done
}

# 检查文件权限
check_file_permissions() {
    local file="$1"
    local expected_perm="$2"
    
    if [[ ! -f "$file" ]]; then
        return 0
    fi
    
    local actual_perm=$(stat -f "%A" "$file" 2>/dev/null || stat -c "%a" "$file" 2>/dev/null)
    
    if [[ "$actual_perm" != "$expected_perm" ]]; then
        log_warning "文件权限不安全: $file 当前: $actual_perm 期望: $expected_perm"
        log_info "建议执行: chmod $expected_perm $file"
    else
        log_success "文件权限正确: $file $actual_perm"
    fi
}

# 检查环境变量文件
check_env_files() {
    log_info "检查环境变量文件"
    log_info "================="
    
    local env_files=(
        "apps/community/server/.env:服务器环境变量"
        "apps/community/oidc-server/config.env:OIDC服务器配置"
        ".env:根目录环境变量"
        ".env.local:本地环境变量"
        ".env.production:生产环境变量"
        ".env.development:开发环境变量"
    )
    
    for env_entry in "${env_files[@]}"; do
        IFS=':' read -r file desc <<< "$env_entry"
        if [[ -f "$file" ]]; then
            check_weak_passwords "$file" "$desc"
            check_hardcoded_secrets "$file" "$desc"
            check_file_permissions "$file" "600"
        fi
    done
}

# 检查配置文件
check_config_files() {
    log_info "检查配置文件"
    log_info "=============="
    
    local config_files=(
        "apps/community/oidc-server/config.env:OIDC服务配置文件"
        "phoenixcoder-server/config/settings.py:服务器配置文件"
        "docker-compose.yml:Docker编排配置"
        "docker-compose.override.yml:Docker覆盖配置"
    )
    
    for config_entry in "${config_files[@]}"; do
        IFS=':' read -r file desc <<< "$config_entry"
        check_weak_passwords "$file" "$desc"
        check_hardcoded_secrets "$file" "$desc"
    done
}

# 检查脚本文件
check_script_files() {
    log_info "检查脚本文件安全性"
    log_info "=================="
    
    local script_files=(
        "k8s-deploy.sh:部署脚本（包含防火墙配置）"
        "yunwei/开发环境脚本记录.md:运维脚本记录"
        "apps/community/oidc-server/init_db.sql:数据库初始化脚本"
    )
    
    for script_entry in "${script_files[@]}"; do
        IFS=':' read -r file desc <<< "$script_entry"
        check_weak_passwords "$file" "$desc"
        check_hardcoded_secrets "$file" "$desc"
    done
}

# 检查测试文件
check_test_files() {
    log_info "检查测试文件安全性"
    log_info "=================="
    
    # 查找所有测试文件
    local test_files=()
    while IFS= read -r -d '' file; do
        test_files+=("$file")
    done < <(find . -name "*test*.py" -o -name "test_*.py" -o -name "*_test.py" -print0 2>/dev/null || true)
    
    if [[ ${#test_files[@]} -gt 0 ]]; then
        for file in "${test_files[@]}"; do
            if [[ -f "$file" ]]; then
                check_weak_passwords "$file" "测试文件"
            fi
        done
    else
        log_info "未找到测试文件"
    fi
}

# 检查 .gitignore 文件
check_gitignore() {
    log_info "检查 .gitignore 配置"
    log_info "==================="
    
    local gitignore_file=".gitignore"
    
    if [[ ! -f "$gitignore_file" ]]; then
        log_error "未找到 .gitignore 文件"
        return 1
    fi
    
    # 检查是否忽略了敏感文件
    local sensitive_patterns=(
        ".env"
        ".env.local"
        ".env.production"
        ".env.development"
        "*.key"
        "*.pem"
        "*.p12"
        "*.pfx"
        "config.env"
    )
    
    local missing_patterns=()
    
    for pattern in "${sensitive_patterns[@]}"; do
        if ! grep -q "^$pattern" "$gitignore_file"; then
            missing_patterns+=("$pattern")
        fi
    done
    
    if [[ ${#missing_patterns[@]} -gt 0 ]]; then
        log_warning "以下敏感文件模式未在 .gitignore 中忽略:"
        for pattern in "${missing_patterns[@]}"; do
            log_warning "  - $pattern"
        done
    else
        log_success ".gitignore 配置正确"
    fi
}

# 检查密钥强度
check_key_strength() {
    log_info "检查密钥强度"
    log_info "============"
    
    # 检查 JWT 密钥长度
    if [[ -f ".env" ]]; then
        local jwt_secret=$(grep "^JWT_SECRET=" ".env" 2>/dev/null | cut -d'=' -f2 | tr -d '"\047')
        if [[ -n "$jwt_secret" ]]; then
            local jwt_length=${#jwt_secret}
            if [[ $jwt_length -lt 32 ]]; then
                log_error "JWT_SECRET 长度不足 $jwt_length 小于 32"
            elif [[ $jwt_length -lt 64 ]]; then
                log_warning "JWT_SECRET 长度建议至少64字符 当前: $jwt_length"
            else
                log_success "JWT_SECRET 长度充足 $jwt_length"
            fi
        fi
    fi
}

# 生成安全报告
generate_security_report() {
    local report_file="security/security-check-report-$(date +%Y%m%d-%H%M%S).txt"
    
    log_info "生成安全检查报告: $report_file"
    
    cat > "$report_file" << EOF
PhoenixCoder 安全检查报告
========================
检查时间: $(date)
检查路径: $(pwd)

统计信息:
  错误数量: $ERROR_COUNT
  警告数量: $WARNING_COUNT
  信息数量: $INFO_COUNT

EOF
    
    if [[ $ERROR_COUNT -gt 0 ]]; then
        echo "严重安全问题需要立即修复！" >> "$report_file"
    elif [[ $WARNING_COUNT -gt 0 ]]; then
        echo "存在安全警告，建议尽快处理。" >> "$report_file"
    else
        echo "未发现明显的安全问题。" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

建议操作:
1. 使用 security/generate-keys.sh 生成安全密钥
2. 更新所有弱密码和默认密钥
3. 确保敏感文件权限设置为 600
4. 检查 .gitignore 配置
5. 定期轮换密钥和密码
EOF
    
    log_success "安全检查报告已生成: $report_file"
}

# 主函数
main() {
    log_info "PhoenixCoder 安全配置检查工具"
    log_info "=============================="
    log_info "开始时间: $(date)"
    log_info ""
    
    # 创建安全目录
    mkdir -p security
    
    # 执行各项检查
    check_env_files
    echo ""
    check_config_files
    echo ""
    check_script_files
    echo ""
    check_test_files
    echo ""
    check_gitignore
    echo ""
    check_key_strength
    echo ""
    
    # 生成报告
    generate_security_report
    
    # 显示总结
    echo ""
    log_info "安全检查完成"
    log_info "============"
    
    if [[ $ERROR_COUNT -gt 0 ]]; then
        log_error "发现 $ERROR_COUNT 个严重安全问题"
        exit 1
    elif [[ $WARNING_COUNT -gt 0 ]]; then
        log_warning "发现 $WARNING_COUNT 个安全警告"
        exit 2
    else
        log_success "未发现明显的安全问题"
        exit 0
    fi
}

# 执行主函数
main "$@"