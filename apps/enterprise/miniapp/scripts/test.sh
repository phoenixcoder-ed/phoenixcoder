#!/bin/bash

# 小程序端单元测试运行脚本
# 使用Vitest进行单元测试

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查Node.js版本
check_node_version() {
    print_message $BLUE "检查Node.js版本..."
    
    if ! command -v node &> /dev/null; then
        print_message $RED "错误: 未找到Node.js，请先安装Node.js"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_message $RED "错误: Node.js版本过低，需要 >= $REQUIRED_VERSION，当前版本: $NODE_VERSION"
        exit 1
    fi
    
    print_message $GREEN "Node.js版本检查通过: $NODE_VERSION"
}

# 检查依赖是否安装
check_dependencies() {
    print_message $BLUE "检查项目依赖..."
    
    if [ ! -d "node_modules" ]; then
        print_message $YELLOW "未找到node_modules目录，正在安装依赖..."
        pnpm install
    fi
    
    # 检查Vitest是否安装
    if ! npm list vitest &> /dev/null; then
        print_message $YELLOW "Vitest未安装，正在安装测试依赖..."
        pnpm install --save-dev vitest @vitest/ui @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
    fi
    
    print_message $GREEN "依赖检查完成"
}

# 运行代码检查
run_lint() {
    print_message $BLUE "运行代码检查..."
    
    if pnpm run lint:check &> /dev/null; then
        print_message $GREEN "代码检查通过"
    else
        print_message $YELLOW "代码检查发现问题，尝试自动修复..."
        pnpm run lint:fix || true
    fi
}

# 运行类型检查
run_type_check() {
    print_message $BLUE "运行TypeScript类型检查..."
    
    if pnpm run type-check &> /dev/null; then
        print_message $GREEN "类型检查通过"
    else
        print_message $YELLOW "类型检查发现问题，请检查TypeScript错误"
    fi
}

# 运行单元测试
run_tests() {
    local test_type=$1
    local coverage=$2
    
    print_message $BLUE "开始运行单元测试..."
    
    case $test_type in
        "watch")
            print_message $BLUE "启动测试监听模式..."
            pnpm run test:watch
            ;;
        "ui")
            print_message $BLUE "启动测试UI界面..."
            pnpm run test:ui
            ;;
        "coverage")
            print_message $BLUE "运行测试并生成覆盖率报告..."
            pnpm run test:coverage
            ;;
        *)
            if [ "$coverage" = "true" ]; then
                print_message $BLUE "运行测试并生成覆盖率报告..."
                pnpm run test:coverage
            else
                print_message $BLUE "运行所有测试..."
                pnpm run test:run
            fi
            ;;
    esac
}

# 生成测试报告
generate_report() {
    print_message $BLUE "生成测试报告..."
    
    # 检查是否有覆盖率报告
    if [ -d "coverage" ]; then
        print_message $GREEN "覆盖率报告已生成: coverage/index.html"
        
        # 在macOS上自动打开报告
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open coverage/index.html
        fi
    fi
    
    # 生成测试结果摘要
    if [ -f "test-results.json" ]; then
        print_message $GREEN "测试结果已保存: test-results.json"
    fi
}

# 清理测试文件
clean_test_files() {
    print_message $BLUE "清理测试缓存和临时文件..."
    
    # 清理Vitest缓存
    rm -rf node_modules/.vitest
    
    # 清理覆盖率报告
    rm -rf coverage
    
    # 清理测试结果
    rm -f test-results.json
    
    print_message $GREEN "清理完成"
}

# 显示帮助信息
show_help() {
    echo "小程序端单元测试运行脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -w, --watch         启动测试监听模式"
    echo "  -u, --ui            启动测试UI界面"
    echo "  -c, --coverage      运行测试并生成覆盖率报告"
    echo "  -l, --lint          只运行代码检查"
    echo "  -t, --type-check    只运行类型检查"
    echo "  --clean             清理测试缓存和临时文件"
    echo "  --no-lint           跳过代码检查"
    echo "  --no-type-check     跳过类型检查"
    echo ""
    echo "示例:"
    echo "  $0                  运行所有测试"
    echo "  $0 -c               运行测试并生成覆盖率报告"
    echo "  $0 -w               启动测试监听模式"
    echo "  $0 -u               启动测试UI界面"
    echo "  $0 --clean          清理测试文件"
}

# 主函数
main() {
    local test_type=""
    local coverage="false"
    local run_lint_check="true"
    local run_type_check_flag="true"
    local clean_only="false"
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -w|--watch)
                test_type="watch"
                shift
                ;;
            -u|--ui)
                test_type="ui"
                shift
                ;;
            -c|--coverage)
                coverage="true"
                shift
                ;;
            -l|--lint)
                run_lint
                exit 0
                ;;
            -t|--type-check)
                run_type_check
                exit 0
                ;;
            --clean)
                clean_only="true"
                shift
                ;;
            --no-lint)
                run_lint_check="false"
                shift
                ;;
            --no-type-check)
                run_type_check_flag="false"
                shift
                ;;
            *)
                print_message $RED "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 如果只是清理，执行清理后退出
    if [ "$clean_only" = "true" ]; then
        clean_test_files
        exit 0
    fi
    
    print_message $GREEN "=== 小程序端单元测试 ==="
    
    # 检查环境
    check_node_version
    check_dependencies
    
    # 运行检查
    if [ "$run_lint_check" = "true" ]; then
        run_lint
    fi
    
    if [ "$run_type_check_flag" = "true" ]; then
        run_type_check
    fi
    
    # 运行测试
    run_tests "$test_type" "$coverage"
    
    # 生成报告（仅在非监听模式下）
    if [ "$test_type" != "watch" ] && [ "$test_type" != "ui" ]; then
        generate_report
        print_message $GREEN "=== 测试完成 ==="
    fi
}

# 捕获中断信号
trap 'print_message $YELLOW "测试被中断"; exit 1' INT TERM

# 运行主函数
main "$@"