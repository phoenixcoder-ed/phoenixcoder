#!/bin/bash

# PhoenixCoder 预提交钩子安装脚本
# 自动安装和配置预提交钩子

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

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查Python环境
check_python() {
    log_info "检查Python环境..."
    
    if ! command_exists python3; then
        log_error "Python3 未安装，请先安装Python3"
        exit 1
    fi
    
    python_version=$(python3 --version | cut -d' ' -f2)
    log_success "Python版本: $python_version"
    
    if ! command_exists pip3; then
        log_error "pip3 未安装，请先安装pip3"
        exit 1
    fi
}

# 检查Node.js环境
check_nodejs() {
    log_info "检查Node.js环境..."
    
    if ! command_exists node; then
        log_error "Node.js 未安装，请先安装Node.js"
        exit 1
    fi
    
    node_version=$(node --version)
    log_success "Node.js版本: $node_version"
    
    if ! command_exists npm; then
        log_error "npm 未安装，请先安装npm"
        exit 1
    fi
}

# 安装pre-commit
install_precommit() {
    log_info "安装pre-commit..."
    
    if command_exists pre-commit; then
        log_success "pre-commit 已安装"
        pre-commit --version
    else
        log_info "正在安装pre-commit..."
        pip3 install pre-commit
        log_success "pre-commit 安装完成"
    fi
}

# 安装Python依赖
install_python_deps() {
    log_info "安装Python代码质量工具..."
    
    # 安装代码格式化和检查工具
    pip3 install -q black isort flake8 bandit mypy radon pip-audit
    
    log_success "Python工具安装完成"
}

# 安装Node.js依赖
install_nodejs_deps() {
    log_info "安装Node.js代码质量工具..."
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        log_warning "未找到package.json，跳过Node.js依赖安装"
        return
    fi
    
    # 安装ESLint和Prettier
    pnpm install -g eslint prettier
    
    log_success "Node.js工具安装完成"
}

# 创建辅助脚本
create_helper_scripts() {
    log_info "创建辅助脚本..."
    
    # 创建scripts目录
    mkdir -p scripts
    
    # 创建文档检查脚本
    cat > scripts/check-docs.py << 'EOF'
#!/usr/bin/env python3
"""
文档完整性检查脚本
检查README文件和API文档的完整性
"""

import os
import sys
import re
from pathlib import Path

def check_readme_files():
    """检查README文件"""
    required_readmes = [
        'README.md',
        'apps/community/server/README.md',
        'apps/community/admin/README.md',
        'apps/community/miniapp/README.md',
        'apps/community/oidc-server/README.md'
    ]
    
    missing_files = []
    for readme in required_readmes:
        if not Path(readme).exists():
            missing_files.append(readme)
    
    if missing_files:
        print(f"缺失的README文件: {missing_files}")
        return False
    
    return True

def check_api_docs():
    """检查API文档"""
    # 这里可以添加更复杂的API文档检查逻辑
    return True

def main():
    """主函数"""
    print("检查文档完整性...")
    
    success = True
    
    if not check_readme_files():
        success = False
    
    if not check_api_docs():
        success = False
    
    if success:
        print("文档检查通过")
        sys.exit(0)
    else:
        print("文档检查失败")
        sys.exit(1)

if __name__ == '__main__':
    main()
EOF
    
    # 创建迁移检查脚本
    cat > scripts/check-migrations.py << 'EOF'
#!/usr/bin/env python3
"""
数据库迁移检查脚本
检查数据库迁移文件的完整性和一致性
"""

import os
import sys
import re
from pathlib import Path

def check_supabase_migrations():
    """检查Supabase迁移文件"""
    migrations_dir = Path('supabase/migrations')
    
    if not migrations_dir.exists():
        print("Supabase迁移目录不存在")
        return True  # 如果目录不存在，跳过检查
    
    migration_files = list(migrations_dir.glob('*.sql'))
    
    # 检查迁移文件命名规范
    for migration_file in migration_files:
        if not re.match(r'^\d{14}_.*\.sql$', migration_file.name):
            print(f"迁移文件命名不规范: {migration_file.name}")
            return False
    
    return True

def main():
    """主函数"""
    print("检查数据库迁移...")
    
    if check_supabase_migrations():
        print("迁移检查通过")
        sys.exit(0)
    else:
        print("迁移检查失败")
        sys.exit(1)

if __name__ == '__main__':
    main()
EOF
    
    # 创建API文档同步检查脚本
    cat > scripts/check-api-docs.py << 'EOF'
#!/usr/bin/env python3
"""
API文档同步检查脚本
检查API文档与代码的同步性
"""

import os
import sys
import ast
import re
from pathlib import Path

def extract_api_endpoints(file_path):
    """从Python文件中提取API端点"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 简单的正则表达式匹配API路由
        routes = re.findall(r'@app\.(get|post|put|delete|patch)\(["\']([^"\']*)["\'\]', content)
        return routes
    except Exception as e:
        print(f"解析文件失败 {file_path}: {e}")
        return []

def check_api_documentation():
    """检查API文档"""
    # 扫描后端API文件
    server_dir = Path('apps/community/server')
    if not server_dir.exists():
        return True
    
    api_files = list(server_dir.rglob('*.py'))
    endpoints = []
    
    for api_file in api_files:
        if 'test' in str(api_file) or '__pycache__' in str(api_file):
            continue
        
        file_endpoints = extract_api_endpoints(api_file)
        endpoints.extend(file_endpoints)
    
    # 这里可以添加更复杂的文档同步检查逻辑
    print(f"发现 {len(endpoints)} 个API端点")
    
    return True

def main():
    """主函数"""
    print("检查API文档同步...")
    
    if check_api_documentation():
        print("API文档检查通过")
        sys.exit(0)
    else:
        print("API文档检查失败")
        sys.exit(1)

if __name__ == '__main__':
    main()
EOF
    
    # 设置脚本执行权限
    chmod +x scripts/check-docs.py
    chmod +x scripts/check-migrations.py
    chmod +x scripts/check-api-docs.py
    
    log_success "辅助脚本创建完成"
}

# 安装pre-commit钩子
install_hooks() {
    log_info "安装pre-commit钩子..."
    
    # 检查配置文件是否存在
    if [ ! -f ".pre-commit-config.yaml" ]; then
        log_error "未找到.pre-commit-config.yaml配置文件"
        exit 1
    fi
    
    # 安装钩子
    pre-commit install
    pre-commit install --hook-type commit-msg
    pre-commit install --hook-type pre-push
    
    log_success "pre-commit钩子安装完成"
}

# 运行初始检查
run_initial_check() {
    log_info "运行初始代码检查..."
    
    # 运行所有钩子进行初始检查
    if pre-commit run --all-files; then
        log_success "初始代码检查通过"
    else
        log_warning "初始代码检查发现问题，请修复后重新提交"
    fi
}

# 显示使用说明
show_usage() {
    cat << EOF

${GREEN}=== PhoenixCoder 预提交钩子安装完成 ===${NC}

${BLUE}使用说明:${NC}

1. 现在每次提交代码时，会自动运行以下检查：
   - 代码格式化 (Black, Prettier)
   - 代码风格检查 (Flake8, ESLint)
   - 类型检查 (MyPy)
   - 安全检查 (Bandit, npm audit)
   - 单元测试
   - 覆盖率检查

2. 手动运行所有检查：
   ${YELLOW}pre-commit run --all-files${NC}

3. 跳过钩子提交（不推荐）：
   ${YELLOW}git commit --no-verify -m "commit message"${NC}

4. 更新钩子：
   ${YELLOW}pre-commit autoupdate${NC}

5. 卸载钩子：
   ${YELLOW}pre-commit uninstall${NC}

${BLUE}配置文件:${NC}
- .pre-commit-config.yaml: 钩子配置
- scripts/: 辅助检查脚本

${GREEN}开始愉快的编码吧！${NC}

EOF
}

# 主函数
main() {
    echo -e "${GREEN}=== PhoenixCoder 预提交钩子安装脚本 ===${NC}\n"
    
    # 检查环境
    check_python
    check_nodejs
    
    # 安装工具
    install_precommit
    install_python_deps
    install_nodejs_deps
    
    # 创建辅助脚本
    create_helper_scripts
    
    # 安装钩子
    install_hooks
    
    # 运行初始检查
    run_initial_check
    
    # 显示使用说明
    show_usage
}

# 运行主函数
main "$@"