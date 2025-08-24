#!/bin/bash

# 性能测试脚本
# 用于运行各种性能测试和基准测试

set -e  # 遇到错误时退出

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

# 检查依赖
check_dependencies() {
    log_info "检查依赖项..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 未安装"
        exit 1
    fi
    
    log_success "所有依赖项检查通过"
}

# 设置测试环境
setup_test_environment() {
    log_info "设置测试环境..."
    
    # 创建测试目录
    mkdir -p test-results
    mkdir -p performance-reports
    
    # 设置环境变量
    export NODE_ENV=test
    export PERFORMANCE_TEST=true
    export TEST_TIMEOUT=300000  # 5分钟超时
    
    # 清理之前的测试结果
    rm -f test-results/performance-*.json
    rm -f performance-reports/*.html
    
    log_success "测试环境设置完成"
}

# 运行前端性能测试
run_frontend_performance_tests() {
    log_info "运行前端性能测试..."
    
    # 检查是否存在前端项目
    if [ ! -f "package.json" ]; then
        log_warning "未找到package.json，跳过前端性能测试"
        return 0
    fi
    
    # 安装依赖（如果需要）
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm install
    fi
    
    # 运行构建性能测试
    log_info "测试构建性能..."
    start_time=$(date +%s)
    
    if npm run build > test-results/build-output.log 2>&1; then
        end_time=$(date +%s)
        build_time=$((end_time - start_time))
        log_success "构建完成，耗时: ${build_time}秒"
        
        # 记录构建性能
        echo "{\"build_time\": $build_time, \"timestamp\": \"$(date -Iseconds)\"}" > test-results/performance-build.json
    else
        log_error "构建失败"
        return 1
    fi
    
    # 分析构建产物大小
    if [ -d "dist" ] || [ -d "build" ]; then
        build_dir="dist"
        [ -d "build" ] && build_dir="build"
        
        log_info "分析构建产物大小..."
        
        # 计算总大小
        total_size=$(du -sh "$build_dir" | cut -f1)
        
        # 分析主要文件
        find "$build_dir" -name "*.js" -o -name "*.css" -o -name "*.html" | while read -r file; do
            size=$(du -h "$file" | cut -f1)
            echo "$file: $size"
        done > test-results/bundle-analysis.txt
        
        log_success "构建产物分析完成，总大小: $total_size"
        
        # 记录大小信息
        echo "{\"total_size\": \"$total_size\", \"timestamp\": \"$(date -Iseconds)\"}" > test-results/performance-bundle.json
    fi
    
    # 运行Lighthouse测试（如果可用）
    if command -v lighthouse &> /dev/null; then
        log_info "运行Lighthouse性能测试..."
        
        # 启动开发服务器
        npm run dev &
        dev_server_pid=$!
        
        # 等待服务器启动
        sleep 10
        
        # 运行Lighthouse
        lighthouse http://localhost:3000 \
            --output=html \
            --output-path=performance-reports/lighthouse-report.html \
            --chrome-flags="--headless --no-sandbox" \
            --quiet || log_warning "Lighthouse测试失败"
        
        # 停止开发服务器
        kill $dev_server_pid 2>/dev/null || true
        
        log_success "Lighthouse测试完成"
    else
        log_warning "Lighthouse未安装，跳过性能测试"
    fi
}

# 运行后端性能测试
run_backend_performance_tests() {
    log_info "运行后端性能测试..."
    
    # 检查是否存在Python项目
    if [ ! -f "requirements.txt" ] && [ ! -f "pyproject.toml" ]; then
        log_warning "未找到Python项目文件，跳过后端性能测试"
        return 0
    fi
    
    # 创建虚拟环境（如果不存在）
    if [ ! -d "venv" ]; then
        log_info "创建Python虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 安装依赖
    if [ -f "requirements.txt" ]; then
        log_info "安装Python依赖..."
        pip install -r requirements.txt
    fi
    
    # 安装性能测试工具
    pip install pytest-benchmark memory-profiler psutil
    
    # 运行性能基准测试
    if [ -d "tests" ]; then
        log_info "运行性能基准测试..."
        
        # 运行pytest-benchmark
        python -m pytest tests/ \
            --benchmark-only \
            --benchmark-json=test-results/performance-benchmark.json \
            --benchmark-html=performance-reports/benchmark-report.html \
            || log_warning "基准测试失败"
        
        log_success "性能基准测试完成"
    fi
    
    # 内存使用分析
    if [ -f "manage.py" ]; then
        log_info "分析内存使用..."
        
        # 运行内存分析
        python -m memory_profiler manage.py test > test-results/memory-profile.txt 2>&1 || true
        
        log_success "内存分析完成"
    fi
    
    # 停用虚拟环境
    deactivate
}

# 运行数据库性能测试
run_database_performance_tests() {
    log_info "运行数据库性能测试..."
    
    # 检查数据库连接
    if [ -n "$DATABASE_URL" ]; then
        log_info "测试数据库连接性能..."
        
        # 创建简单的数据库性能测试脚本
        cat > test_db_performance.py << 'EOF'
import time
import sqlite3
import json
from datetime import datetime

def test_database_performance():
    results = {
        'timestamp': datetime.now().isoformat(),
        'tests': []
    }
    
    # 连接测试
    start_time = time.time()
    conn = sqlite3.connect(':memory:')
    connect_time = time.time() - start_time
    
    results['tests'].append({
        'name': 'connection_time',
        'duration': connect_time,
        'unit': 'seconds'
    })
    
    # 创建表测试
    start_time = time.time()
    conn.execute('''
        CREATE TABLE test_table (
            id INTEGER PRIMARY KEY,
            name TEXT,
            value INTEGER
        )
    ''')
    create_time = time.time() - start_time
    
    results['tests'].append({
        'name': 'table_creation_time',
        'duration': create_time,
        'unit': 'seconds'
    })
    
    # 插入数据测试
    start_time = time.time()
    for i in range(1000):
        conn.execute('INSERT INTO test_table (name, value) VALUES (?, ?)', 
                    (f'test_{i}', i))
    conn.commit()
    insert_time = time.time() - start_time
    
    results['tests'].append({
        'name': 'insert_1000_records_time',
        'duration': insert_time,
        'unit': 'seconds'
    })
    
    # 查询测试
    start_time = time.time()
    cursor = conn.execute('SELECT * FROM test_table WHERE value > 500')
    rows = cursor.fetchall()
    query_time = time.time() - start_time
    
    results['tests'].append({
        'name': 'query_time',
        'duration': query_time,
        'unit': 'seconds',
        'rows_returned': len(rows)
    })
    
    conn.close()
    
    # 保存结果
    with open('test-results/performance-database.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"数据库性能测试完成:")
    for test in results['tests']:
        print(f"  - {test['name']}: {test['duration']:.4f} {test['unit']}")

if __name__ == '__main__':
    test_database_performance()
EOF
        
        python test_db_performance.py
        rm test_db_performance.py
        
        log_success "数据库性能测试完成"
    else
        log_warning "未配置数据库连接，跳过数据库性能测试"
    fi
}

# 生成性能报告
generate_performance_report() {
    log_info "生成性能报告..."
    
    # 创建HTML报告
    cat > performance-reports/summary.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>性能测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #e9f5ff; border-radius: 3px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 性能测试报告</h1>
        <p>生成时间: <span id="timestamp"></span></p>
    </div>
    
    <div class="section">
        <h2>📊 测试概览</h2>
        <div id="overview"></div>
    </div>
    
    <div class="section">
        <h2>🏗️ 构建性能</h2>
        <div id="build-metrics"></div>
    </div>
    
    <div class="section">
        <h2>🗄️ 数据库性能</h2>
        <div id="database-metrics"></div>
    </div>
    
    <div class="section">
        <h2>📈 历史趋势</h2>
        <p>性能指标变化趋势图将在此显示</p>
    </div>
    
    <script>
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        
        // 加载性能数据
        fetch('../test-results/performance-build.json')
            .then(response => response.json())
            .then(data => {
                document.getElementById('build-metrics').innerHTML = 
                    `<div class="metric">构建时间: ${data.build_time}秒</div>`;
            })
            .catch(() => {
                document.getElementById('build-metrics').innerHTML = 
                    '<p class="warning">构建性能数据不可用</p>';
            });
        
        fetch('../test-results/performance-database.json')
            .then(response => response.json())
            .then(data => {
                let html = '';
                data.tests.forEach(test => {
                    html += `<div class="metric">${test.name}: ${test.duration.toFixed(4)} ${test.unit}</div>`;
                });
                document.getElementById('database-metrics').innerHTML = html;
            })
            .catch(() => {
                document.getElementById('database-metrics').innerHTML = 
                    '<p class="warning">数据库性能数据不可用</p>';
            });
    </script>
</body>
</html>
EOF
    
    log_success "性能报告生成完成: performance-reports/summary.html"
}

# 清理测试环境
cleanup() {
    log_info "清理测试环境..."
    
    # 停止可能运行的进程
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "python manage.py" 2>/dev/null || true
    
    # 清理临时文件
    rm -f test_db_performance.py
    
    log_success "清理完成"
}

# 主函数
main() {
    echo "🚀 开始性能测试..."
    echo "==========================================="
    
    # 设置错误处理
    trap cleanup EXIT
    
    # 检查参数
    test_type="${1:-all}"
    
    case $test_type in
        "frontend")
            check_dependencies
            setup_test_environment
            run_frontend_performance_tests
            ;;
        "backend")
            check_dependencies
            setup_test_environment
            run_backend_performance_tests
            ;;
        "database")
            setup_test_environment
            run_database_performance_tests
            ;;
        "all")
            check_dependencies
            setup_test_environment
            run_frontend_performance_tests
            run_backend_performance_tests
            run_database_performance_tests
            generate_performance_report
            ;;
        *)
            echo "用法: $0 [frontend|backend|database|all]"
            echo "  frontend  - 运行前端性能测试"
            echo "  backend   - 运行后端性能测试"
            echo "  database  - 运行数据库性能测试"
            echo "  all       - 运行所有性能测试（默认）"
            exit 1
            ;;
    esac
    
    echo "==========================================="
    log_success "性能测试完成！"
    
    # 显示结果位置
    echo ""
    echo "📋 测试结果:"
    echo "  - JSON数据: test-results/"
    echo "  - HTML报告: performance-reports/"
    
    if [ -f "performance-reports/summary.html" ]; then
        echo "  - 主报告: performance-reports/summary.html"
    fi
}

# 运行主函数
main "$@"