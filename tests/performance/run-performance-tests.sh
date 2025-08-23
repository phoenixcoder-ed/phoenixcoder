#!/bin/bash

# PhoenixCoder 性能测试运行脚本
# 使用 k6 进行各种类型的性能测试

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORTS_DIR="$PROJECT_ROOT/reports/performance"
K6_CONFIG="$SCRIPT_DIR/k6-config.js"

# 默认配置
DEFAULT_BASE_URL="http://localhost:3000"
DEFAULT_API_BASE_URL="http://localhost:8000"
DEFAULT_TEST_USER_EMAIL="test@phoenixcoder.com"
DEFAULT_TEST_USER_PASSWORD="TestPassword123!"

# 函数：打印帮助信息
print_help() {
    echo -e "${BLUE}PhoenixCoder 性能测试运行脚本${NC}"
    echo ""
    echo "用法: $0 [选项] [测试类型]"
    echo ""
    echo "测试类型:"
    echo "  load        负载测试 (默认)"
    echo "  stress      压力测试"
    echo "  spike       峰值测试"
    echo "  volume      容量测试"
    echo "  api         API 专项测试"
    echo "  frontend    前端专项测试"
    echo "  auth        认证专项测试"
    echo "  tasks       任务专项测试"
    echo "  all         运行所有测试类型"
    echo ""
    echo "选项:"
    echo "  -h, --help              显示此帮助信息"
    echo "  -u, --base-url URL      设置前端基础 URL (默认: $DEFAULT_BASE_URL)"
    echo "  -a, --api-url URL       设置 API 基础 URL (默认: $DEFAULT_API_BASE_URL)"
    echo "  -e, --email EMAIL       设置测试用户邮箱 (默认: $DEFAULT_TEST_USER_EMAIL)"
    echo "  -p, --password PASS     设置测试用户密码 (默认: $DEFAULT_TEST_USER_PASSWORD)"
    echo "  -o, --output DIR        设置报告输出目录 (默认: $REPORTS_DIR)"
    echo "  -v, --verbose           详细输出"
    echo "  -q, --quiet             静默模式"
    echo "  --no-setup              跳过环境检查"
    echo "  --no-cleanup            跳过测试后清理"
    echo "  --parallel              并行运行多个测试"
    echo "  --duration DURATION     自定义测试持续时间"
    echo "  --vus VUS               自定义虚拟用户数"
    echo ""
    echo "示例:"
    echo "  $0 load                                    # 运行负载测试"
    echo "  $0 stress -v                              # 运行压力测试（详细输出）"
    echo "  $0 api -u http://localhost:3001           # 使用自定义 URL 运行 API 测试"
    echo "  $0 all --parallel                         # 并行运行所有测试"
    echo "  $0 load --duration 10m --vus 50           # 自定义参数运行负载测试"
}

# 函数：检查依赖
check_dependencies() {
    if ! command -v k6 &> /dev/null; then
        echo -e "${RED}错误: k6 未安装${NC}"
        echo "请访问 https://k6.io/docs/getting-started/installation/ 安装 k6"
        echo "或使用以下命令安装:"
        echo "  macOS: brew install k6"
        echo "  Ubuntu: sudo apt-get install k6"
        echo "  Windows: choco install k6"
        exit 1
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${GREEN}✓ k6 已安装: $(k6 version)${NC}"
    fi
}

# 函数：检查服务状态
check_services() {
    local base_url="$1"
    local api_url="$2"
    
    echo -e "${YELLOW}检查服务状态...${NC}"
    
    # 检查前端服务
    if curl -s "$base_url" > /dev/null; then
        echo -e "${GREEN}✓ 前端服务运行正常: $base_url${NC}"
    else
        echo -e "${RED}✗ 前端服务无法访问: $base_url${NC}"
        echo "请确保前端服务正在运行"
        exit 1
    fi
    
    # 检查 API 服务
    if curl -s "$api_url/health" > /dev/null || curl -s "$api_url/api/health" > /dev/null; then
        echo -e "${GREEN}✓ API 服务运行正常: $api_url${NC}"
    else
        echo -e "${RED}✗ API 服务无法访问: $api_url${NC}"
        echo "请确保 API 服务正在运行"
        exit 1
    fi
}

# 函数：创建报告目录
setup_reports_dir() {
    local reports_dir="$1"
    
    if [[ ! -d "$reports_dir" ]]; then
        mkdir -p "$reports_dir"
        echo -e "${GREEN}✓ 创建报告目录: $reports_dir${NC}"
    fi
    
    # 创建时间戳子目录
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local session_dir="$reports_dir/$timestamp"
    mkdir -p "$session_dir"
    
    echo "$session_dir"
}

# 函数：运行单个测试
run_test() {
    local test_type="$1"
    local base_url="$2"
    local api_url="$3"
    local email="$4"
    local password="$5"
    local output_dir="$6"
    local custom_duration="$7"
    local custom_vus="$8"
    
    echo -e "${BLUE}运行 $test_type 测试...${NC}"
    
    # 设置环境变量
    export BASE_URL="$base_url"
    export API_BASE_URL="$api_url"
    export TEST_USER_EMAIL="$email"
    export TEST_USER_PASSWORD="$password"
    export TEST_TYPE="$test_type"
    
    # 构建 k6 命令
    local k6_cmd="k6 run"
    
    # 添加输出选项
    if [[ "$QUIET" != "true" ]]; then
        k6_cmd="$k6_cmd --console-output=stdout"
    fi
    
    # 添加自定义参数
    if [[ -n "$custom_duration" ]]; then
        k6_cmd="$k6_cmd --duration $custom_duration"
    fi
    
    if [[ -n "$custom_vus" ]]; then
        k6_cmd="$k6_cmd --vus $custom_vus"
    fi
    
    # 设置输出文件
    local report_file="$output_dir/${test_type}-report.html"
    local summary_file="$output_dir/${test_type}-summary.json"
    
    # 运行测试
    local start_time=$(date +%s)
    
    if $k6_cmd "$K6_CONFIG" 2>&1 | tee "$output_dir/${test_type}-output.log"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        echo -e "${GREEN}✓ $test_type 测试完成 (耗时: ${duration}s)${NC}"
        
        # 移动生成的报告文件
        if [[ -f "performance-report.html" ]]; then
            mv "performance-report.html" "$report_file"
        fi
        
        if [[ -f "performance-summary.json" ]]; then
            mv "performance-summary.json" "$summary_file"
        fi
        
        return 0
    else
        echo -e "${RED}✗ $test_type 测试失败${NC}"
        return 1
    fi
}

# 函数：并行运行测试
run_tests_parallel() {
    local test_types=("$@")
    local pids=()
    local results=()
    
    echo -e "${BLUE}并行运行测试: ${test_types[*]}${NC}"
    
    # 启动所有测试
    for test_type in "${test_types[@]}"; do
        (
            local test_output_dir="$OUTPUT_DIR/${test_type}"
            mkdir -p "$test_output_dir"
            run_test "$test_type" "$BASE_URL" "$API_BASE_URL" "$TEST_USER_EMAIL" "$TEST_USER_PASSWORD" "$test_output_dir" "$CUSTOM_DURATION" "$CUSTOM_VUS"
        ) &
        pids+=("$!")
    done
    
    # 等待所有测试完成
    local failed_tests=()
    for i in "${!pids[@]}"; do
        if wait "${pids[$i]}"; then
            echo -e "${GREEN}✓ ${test_types[$i]} 测试完成${NC}"
        else
            echo -e "${RED}✗ ${test_types[$i]} 测试失败${NC}"
            failed_tests+=("${test_types[$i]}")
        fi
    done
    
    # 报告结果
    if [[ ${#failed_tests[@]} -eq 0 ]]; then
        echo -e "${GREEN}✓ 所有并行测试完成${NC}"
        return 0
    else
        echo -e "${RED}✗ 以下测试失败: ${failed_tests[*]}${NC}"
        return 1
    fi
}

# 函数：生成汇总报告
generate_summary_report() {
    local output_dir="$1"
    local summary_file="$output_dir/test-summary.html"
    
    echo -e "${YELLOW}生成汇总报告...${NC}"
    
    cat > "$summary_file" << EOF
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhoenixCoder 性能测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .test-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f9f9f9; }
        .test-card h3 { margin-top: 0; color: #333; }
        .status-success { color: #28a745; }
        .status-failed { color: #dc3545; }
        .timestamp { color: #666; font-size: 0.9em; }
        .links { margin-top: 15px; }
        .links a { display: inline-block; margin-right: 10px; padding: 5px 10px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .links a:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PhoenixCoder 性能测试报告</h1>
            <p class="timestamp">生成时间: $(date)</p>
        </div>
        
        <div class="test-grid">
EOF
    
    # 遍历所有测试结果
    for test_dir in "$output_dir"/*/; do
        if [[ -d "$test_dir" ]]; then
            local test_name=$(basename "$test_dir")
            local report_file="$test_dir/${test_name}-report.html"
            local summary_file="$test_dir/${test_name}-summary.json"
            local log_file="$test_dir/${test_name}-output.log"
            
            # 检查测试状态
            local status="failed"
            local status_class="status-failed"
            if [[ -f "$summary_file" ]] && grep -q '"checks"' "$summary_file"; then
                status="success"
                status_class="status-success"
            fi
            
            cat >> "$summary_file" << EOF
            <div class="test-card">
                <h3>$test_name 测试</h3>
                <p class="$status_class">状态: $status</p>
                <div class="links">
EOF
            
            if [[ -f "$report_file" ]]; then
                echo "                    <a href=\"$test_name/${test_name}-report.html\">详细报告</a>" >> "$summary_file"
            fi
            
            if [[ -f "$summary_file" ]]; then
                echo "                    <a href=\"$test_name/${test_name}-summary.json\">JSON 数据</a>" >> "$summary_file"
            fi
            
            if [[ -f "$log_file" ]]; then
                echo "                    <a href=\"$test_name/${test_name}-output.log\">运行日志</a>" >> "$summary_file"
            fi
            
            cat >> "$summary_file" << EOF
                </div>
            </div>
EOF
        fi
    done
    
    cat >> "$summary_file" << EOF
        </div>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}✓ 汇总报告已生成: $summary_file${NC}"
}

# 函数：清理临时文件
cleanup() {
    if [[ "$NO_CLEANUP" != "true" ]]; then
        # 清理当前目录下的临时文件
        rm -f performance-report.html performance-summary.json
        
        if [[ "$VERBOSE" == "true" ]]; then
            echo -e "${GREEN}✓ 清理完成${NC}"
        fi
    fi
}

# 主函数
main() {
    # 解析命令行参数
    local test_types=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                print_help
                exit 0
                ;;
            -u|--base-url)
                BASE_URL="$2"
                shift 2
                ;;
            -a|--api-url)
                API_BASE_URL="$2"
                shift 2
                ;;
            -e|--email)
                TEST_USER_EMAIL="$2"
                shift 2
                ;;
            -p|--password)
                TEST_USER_PASSWORD="$2"
                shift 2
                ;;
            -o|--output)
                REPORTS_DIR="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE="true"
                shift
                ;;
            -q|--quiet)
                QUIET="true"
                shift
                ;;
            --no-setup)
                NO_SETUP="true"
                shift
                ;;
            --no-cleanup)
                NO_CLEANUP="true"
                shift
                ;;
            --parallel)
                PARALLEL="true"
                shift
                ;;
            --duration)
                CUSTOM_DURATION="$2"
                shift 2
                ;;
            --vus)
                CUSTOM_VUS="$2"
                shift 2
                ;;
            load|stress|spike|volume|api|frontend|auth|tasks|all)
                test_types+=("$1")
                shift
                ;;
            -*)
                echo -e "${RED}错误: 未知选项 $1${NC}"
                print_help
                exit 1
                ;;
            *)
                test_types+=("$1")
                shift
                ;;
        esac
    done
    
    # 设置默认值
    BASE_URL="${BASE_URL:-$DEFAULT_BASE_URL}"
    API_BASE_URL="${API_BASE_URL:-$DEFAULT_API_BASE_URL}"
    TEST_USER_EMAIL="${TEST_USER_EMAIL:-$DEFAULT_TEST_USER_EMAIL}"
    TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-$DEFAULT_TEST_USER_PASSWORD}"
    
    # 如果没有指定测试类型，默认运行负载测试
    if [[ ${#test_types[@]} -eq 0 ]]; then
        test_types=("load")
    fi
    
    # 处理 "all" 测试类型
    if [[ " ${test_types[*]} " =~ " all " ]]; then
        test_types=("load" "stress" "spike" "volume" "api" "frontend" "auth" "tasks")
    fi
    
    echo -e "${BLUE}PhoenixCoder 性能测试${NC}"
    echo "测试类型: ${test_types[*]}"
    echo "前端 URL: $BASE_URL"
    echo "API URL: $API_BASE_URL"
    echo ""
    
    # 环境检查
    if [[ "$NO_SETUP" != "true" ]]; then
        check_dependencies
        check_services "$BASE_URL" "$API_BASE_URL"
    fi
    
    # 设置报告目录
    OUTPUT_DIR=$(setup_reports_dir "$REPORTS_DIR")
    echo -e "${GREEN}报告输出目录: $OUTPUT_DIR${NC}"
    echo ""
    
    # 运行测试
    local overall_success=true
    
    if [[ "$PARALLEL" == "true" ]] && [[ ${#test_types[@]} -gt 1 ]]; then
        if ! run_tests_parallel "${test_types[@]}"; then
            overall_success=false
        fi
    else
        for test_type in "${test_types[@]}"; do
            local test_output_dir="$OUTPUT_DIR/${test_type}"
            mkdir -p "$test_output_dir"
            
            if ! run_test "$test_type" "$BASE_URL" "$API_BASE_URL" "$TEST_USER_EMAIL" "$TEST_USER_PASSWORD" "$test_output_dir" "$CUSTOM_DURATION" "$CUSTOM_VUS"; then
                overall_success=false
            fi
            
            echo ""
        done
    fi
    
    # 生成汇总报告
    generate_summary_report "$OUTPUT_DIR"
    
    # 清理
    cleanup
    
    # 最终结果
    echo ""
    if [[ "$overall_success" == "true" ]]; then
        echo -e "${GREEN}✓ 所有性能测试完成${NC}"
        echo -e "${BLUE}报告位置: $OUTPUT_DIR${NC}"
        exit 0
    else
        echo -e "${RED}✗ 部分性能测试失败${NC}"
        echo -e "${BLUE}报告位置: $OUTPUT_DIR${NC}"
        exit 1
    fi
}

# 信号处理
trap cleanup EXIT

# 运行主函数
main "$@"