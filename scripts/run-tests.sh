#!/bin/bash

# PhoenixCoder Intelligent Test Runner
# This script provides intelligent test execution with conditional running, parallel execution, and failure retry

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"  # all, unit, integration, e2e, performance
ENVIRONMENT="test"
PARALLEL_JOBS=4
VERBOSE=false
WATCH_MODE=false
COVERAGE=true
FAIL_FAST=false
RETRY_FAILED=3
TIMEOUT=300
FILTER=""
EXCLUDE=""
TAGS=""
RANDOM_ORDER=false
CLEAN_CACHE=false
GENERATE_REPORT=true
OPEN_REPORT=false
NOTIFY_WEBHOOK=""
CHANGED_FILES_ONLY=false
SINCE_COMMIT=""
AFFECTED_ONLY=false
BENCHMARK_MODE=false
PROFILE_MODE=false
DEBUG_MODE=false
DRY_RUN=false
QUIET=false
CONFIG_FILE=""
OUTPUT_DIR="./test-results"
CACHE_DIR="./test-cache"
LOG_LEVEL="info"
MAX_WORKERS="auto"
MEMORY_LIMIT="2g"
SHARD_INDEX=""
SHARD_COUNT=""
REPORT_FORMAT="html,json,junit"
COVERAGE_THRESHOLD=80
PERFORMANCE_BUDGET=""
FLAKY_TEST_RETRIES=2
TEST_DATA_RESET=false
SEED=""
STRESS_TEST=false
STRESS_ITERATIONS=100
MUTATION_TESTING=false
VISUAL_REGRESSION=false
ACCESSIBILITY_TESTING=false
SECURITY_TESTING=false
CROSS_BROWSER=false
MOBILE_TESTING=false
API_TESTING=false
LOAD_TESTING=false
CHAOS_TESTING=false
CONTRACT_TESTING=false
SMOKE_TESTING=false
REGRESSION_TESTING=false
SANITY_TESTING=false
ACCEPTANCE_TESTING=false

# Test execution metadata
TEST_START_TIME=""
TEST_END_TIME=""
TEST_DURATION=0
TEST_RESULTS_FILE=""
COVERAGE_REPORT_FILE=""
PERFORMANCE_REPORT_FILE=""
FAILED_TESTS_FILE=""
FLAKY_TESTS_FILE=""
TEST_LOG_FILE=""

# Function to print colored output
print_info() {
    if [[ "$QUIET" != "true" ]]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
    if [[ "$DEBUG_MODE" == "true" && "$QUIET" != "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Intelligent test runner for PhoenixCoder project

Test Types:
    -t, --type TYPE            Test type (all|unit|integration|e2e|performance) [default: all]
    --unit                     Run unit tests only
    --integration              Run integration tests only
    --e2e                      Run end-to-end tests only
    --performance              Run performance tests only
    --smoke                    Run smoke tests only
    --regression               Run regression tests only
    --sanity                   Run sanity tests only
    --acceptance               Run acceptance tests only

Execution Options:
    -e, --environment ENV      Test environment (test|staging|production) [default: test]
    -j, --parallel JOBS        Number of parallel jobs [default: 4]
    -w, --watch                Enable watch mode
    --no-coverage              Disable coverage collection
    --fail-fast                Stop on first failure
    --retry TIMES              Retry failed tests N times [default: 3]
    --timeout SECONDS          Test timeout in seconds [default: 300]
    --max-workers N            Maximum worker processes [default: auto]
    --memory-limit SIZE        Memory limit per worker [default: 2g]

Filtering Options:
    -f, --filter PATTERN       Filter tests by pattern
    -x, --exclude PATTERN      Exclude tests by pattern
    --tags TAGS                Run tests with specific tags
    --changed-only             Run tests for changed files only
    --since COMMIT             Run tests for files changed since commit
    --affected-only            Run tests affected by changes
    --shard INDEX/COUNT        Run specific shard (e.g., 1/4)

Output Options:
    -v, --verbose              Enable verbose output
    -q, --quiet                Suppress non-essential output
    --debug                    Enable debug mode
    --log-level LEVEL          Log level (debug|info|warn|error) [default: info]
    -o, --output-dir DIR       Output directory [default: ./test-results]
    --report-format FORMAT     Report format (html,json,junit,lcov) [default: html,json,junit]
    --open-report              Open HTML report after completion
    --no-report                Skip report generation

Advanced Options:
    --random                   Run tests in random order
    --seed SEED                Random seed for test order
    --clean-cache              Clean test cache before running
    --cache-dir DIR            Test cache directory [default: ./test-cache]
    --config FILE              Custom configuration file
    --dry-run                  Show what would be executed without running
    --benchmark                Enable benchmark mode
    --profile                  Enable profiling
    --stress                   Run stress tests
    --stress-iterations N      Stress test iterations [default: 100]

Specialized Testing:
    --mutation                 Run mutation testing
    --visual-regression        Run visual regression tests
    --accessibility            Run accessibility tests
    --security                 Run security tests
    --cross-browser            Run cross-browser tests
    --mobile                   Run mobile tests
    --api                      Run API tests
    --load                     Run load tests
    --chaos                    Run chaos tests
    --contract                 Run contract tests

Quality Gates:
    --coverage-threshold PCT   Coverage threshold percentage [default: 80]
    --performance-budget FILE  Performance budget configuration
    --flaky-retries N          Retries for flaky tests [default: 2]

Notifications:
    -w, --webhook URL          Webhook URL for notifications

Utility Options:
    --test-data-reset          Reset test data before running
    -h, --help                 Show this help message

Examples:
    $0                                    # Run all tests
    $0 --unit --coverage                  # Run unit tests with coverage
    $0 --integration --parallel 8         # Run integration tests with 8 workers
    $0 --e2e --environment staging        # Run E2E tests against staging
    $0 --changed-only --fail-fast         # Run tests for changed files, stop on failure
    $0 --filter "user" --exclude "slow"   # Run user tests, exclude slow tests
    $0 --performance --benchmark          # Run performance tests with benchmarking
    $0 --watch --verbose                  # Run in watch mode with verbose output
    $0 --shard 1/4 --parallel 2          # Run first shard with 2 workers
    $0 --stress --stress-iterations 500   # Run stress tests with 500 iterations

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TEST_TYPE="$2"
            shift 2
            ;;
        --unit)
            TEST_TYPE="unit"
            shift
            ;;
        --integration)
            TEST_TYPE="integration"
            shift
            ;;
        --e2e)
            TEST_TYPE="e2e"
            shift
            ;;
        --performance)
            TEST_TYPE="performance"
            shift
            ;;
        --smoke)
            TEST_TYPE="smoke"
            SMOKE_TESTING=true
            shift
            ;;
        --regression)
            TEST_TYPE="regression"
            REGRESSION_TESTING=true
            shift
            ;;
        --sanity)
            TEST_TYPE="sanity"
            SANITY_TESTING=true
            shift
            ;;
        --acceptance)
            TEST_TYPE="acceptance"
            ACCEPTANCE_TESTING=true
            shift
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -j|--parallel)
            PARALLEL_JOBS="$2"
            shift 2
            ;;
        -w|--watch)
            WATCH_MODE=true
            shift
            ;;
        --no-coverage)
            COVERAGE=false
            shift
            ;;
        --fail-fast)
            FAIL_FAST=true
            shift
            ;;
        --retry)
            RETRY_FAILED="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --max-workers)
            MAX_WORKERS="$2"
            shift 2
            ;;
        --memory-limit)
            MEMORY_LIMIT="$2"
            shift 2
            ;;
        -f|--filter)
            FILTER="$2"
            shift 2
            ;;
        -x|--exclude)
            EXCLUDE="$2"
            shift 2
            ;;
        --tags)
            TAGS="$2"
            shift 2
            ;;
        --changed-only)
            CHANGED_FILES_ONLY=true
            shift
            ;;
        --since)
            SINCE_COMMIT="$2"
            shift 2
            ;;
        --affected-only)
            AFFECTED_ONLY=true
            shift
            ;;
        --shard)
            if [[ "$2" =~ ^([0-9]+)/([0-9]+)$ ]]; then
                SHARD_INDEX="${BASH_REMATCH[1]}"
                SHARD_COUNT="${BASH_REMATCH[2]}"
            else
                print_error "Invalid shard format. Use INDEX/COUNT (e.g., 1/4)"
                exit 1
            fi
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        --debug)
            DEBUG_MODE=true
            shift
            ;;
        --log-level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        -o|--output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --report-format)
            REPORT_FORMAT="$2"
            shift 2
            ;;
        --open-report)
            OPEN_REPORT=true
            shift
            ;;
        --no-report)
            GENERATE_REPORT=false
            shift
            ;;
        --random)
            RANDOM_ORDER=true
            shift
            ;;
        --seed)
            SEED="$2"
            shift 2
            ;;
        --clean-cache)
            CLEAN_CACHE=true
            shift
            ;;
        --cache-dir)
            CACHE_DIR="$2"
            shift 2
            ;;
        --config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --benchmark)
            BENCHMARK_MODE=true
            shift
            ;;
        --profile)
            PROFILE_MODE=true
            shift
            ;;
        --stress)
            STRESS_TEST=true
            shift
            ;;
        --stress-iterations)
            STRESS_ITERATIONS="$2"
            shift 2
            ;;
        --mutation)
            MUTATION_TESTING=true
            shift
            ;;
        --visual-regression)
            VISUAL_REGRESSION=true
            shift
            ;;
        --accessibility)
            ACCESSIBILITY_TESTING=true
            shift
            ;;
        --security)
            SECURITY_TESTING=true
            shift
            ;;
        --cross-browser)
            CROSS_BROWSER=true
            shift
            ;;
        --mobile)
            MOBILE_TESTING=true
            shift
            ;;
        --api)
            API_TESTING=true
            shift
            ;;
        --load)
            LOAD_TESTING=true
            shift
            ;;
        --chaos)
            CHAOS_TESTING=true
            shift
            ;;
        --contract)
            CONTRACT_TESTING=true
            shift
            ;;
        --coverage-threshold)
            COVERAGE_THRESHOLD="$2"
            shift 2
            ;;
        --performance-budget)
            PERFORMANCE_BUDGET="$2"
            shift 2
            ;;
        --flaky-retries)
            FLAKY_TEST_RETRIES="$2"
            shift 2
            ;;
        --webhook)
            NOTIFY_WEBHOOK="$2"
            shift 2
            ;;
        --test-data-reset)
            TEST_DATA_RESET=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate test type
valid_types=("all" "unit" "integration" "e2e" "performance" "smoke" "regression" "sanity" "acceptance")
if [[ ! " ${valid_types[@]} " =~ " ${TEST_TYPE} " ]]; then
    print_error "Invalid test type: $TEST_TYPE"
    print_error "Valid types: ${valid_types[*]}"
    exit 1
fi

# Set up output directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$CACHE_DIR"

# Generate test metadata
TEST_START_TIME=$(date -Iseconds)
TEST_RESULTS_FILE="$OUTPUT_DIR/test-results-$(date +%Y%m%d_%H%M%S).json"
COVERAGE_REPORT_FILE="$OUTPUT_DIR/coverage-report.html"
PERFORMANCE_REPORT_FILE="$OUTPUT_DIR/performance-report.json"
FAILED_TESTS_FILE="$OUTPUT_DIR/failed-tests.txt"
FLAKY_TESTS_FILE="$OUTPUT_DIR/flaky-tests.txt"
TEST_LOG_FILE="$OUTPUT_DIR/test-execution.log"

# Function to log messages
log_message() {
    local level="$1"
    local message="$2"
    echo "$(date -Iseconds) [$level] $message" >> "$TEST_LOG_FILE"
    
    case "$level" in
        "ERROR")
            print_error "$message"
            ;;
        "WARN")
            print_warning "$message"
            ;;
        "INFO")
            print_info "$message"
            ;;
        "DEBUG")
            print_debug "$message"
            ;;
    esac
}

# Function to detect changed files
detect_changed_files() {
    local changed_files=()
    
    if [[ "$CHANGED_FILES_ONLY" == "true" ]]; then
        if [[ -n "$SINCE_COMMIT" ]]; then
            mapfile -t changed_files < <(git diff --name-only "$SINCE_COMMIT")
        else
            mapfile -t changed_files < <(git diff --name-only HEAD~1)
        fi
    fi
    
    printf '%s\n' "${changed_files[@]}"
}

# Function to get affected test files
get_affected_tests() {
    local changed_files=("$@")
    local affected_tests=()
    
    for file in "${changed_files[@]}"; do
        # Backend Python files
        if [[ "$file" =~ \.py$ ]]; then
            # Find corresponding test files
            local test_file="tests/$(basename "$file" .py)_test.py"
            if [[ -f "$test_file" ]]; then
                affected_tests+=("$test_file")
            fi
            
            # Also include integration tests for API changes
            if [[ "$file" =~ (api|routes|handlers) ]]; then
                affected_tests+=("tests/integration/")
            fi
        fi
        
        # Frontend TypeScript/JavaScript files
        if [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then
            # Find corresponding test files
            local base_name=$(basename "$file" | sed 's/\.[^.]*$//')
            local dir_name=$(dirname "$file")
            
            # Look for test files in same directory or __tests__ subdirectory
            for ext in ".test.ts" ".test.tsx" ".test.js" ".test.jsx" ".spec.ts" ".spec.tsx" ".spec.js" ".spec.jsx"; do
                local test_file="$dir_name/$base_name$ext"
                local test_file_alt="$dir_name/__tests__/$base_name$ext"
                
                if [[ -f "$test_file" ]]; then
                    affected_tests+=("$test_file")
                fi
                if [[ -f "$test_file_alt" ]]; then
                    affected_tests+=("$test_file_alt")
                fi
            done
        fi
        
        # Configuration files affect all tests
        if [[ "$file" =~ (package\.json|requirements\.txt|Dockerfile|docker-compose|pytest\.ini|vitest\.config) ]]; then
            affected_tests=("all")
            break
        fi
    done
    
    printf '%s\n' "${affected_tests[@]}"
}

# Function to clean cache
clean_test_cache() {
    if [[ "$CLEAN_CACHE" == "true" ]]; then
        print_info "Cleaning test cache..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            print_info "[DRY RUN] Would clean cache directories"
            return 0
        fi
        
        # Clean Python cache
        find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find . -type f -name "*.pyc" -delete 2>/dev/null || true
        
        # Clean Node.js cache
        rm -rf node_modules/.cache 2>/dev/null || true
        
        # Clean test cache
        rm -rf "$CACHE_DIR" 2>/dev/null || true
        mkdir -p "$CACHE_DIR"
        
        # Clean coverage cache
        rm -rf .coverage .nyc_output coverage 2>/dev/null || true
        
        print_success "Test cache cleaned"
    fi
}

# Function to reset test data
reset_test_data() {
    if [[ "$TEST_DATA_RESET" == "true" ]]; then
        print_info "Resetting test data..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            print_info "[DRY RUN] Would reset test data"
            return 0
        fi
        
        # Reset test database
        if [[ -f "scripts/reset-test-db.sh" ]]; then
            ./scripts/reset-test-db.sh
        fi
        
        # Clear test files
        rm -rf ./test-data/temp/* 2>/dev/null || true
        
        print_success "Test data reset completed"
    fi
}

# Function to run backend tests (pytest)
run_backend_tests() {
    local test_type="$1"
    local test_paths=()
    local pytest_args=()
    
    print_info "Running backend tests ($test_type)..."
    
    # Determine test paths based on type
    case "$test_type" in
        "unit")
            test_paths=("apps/*/tests/unit" "apps/*/server/tests/unit")
            ;;
        "integration")
            test_paths=("tests/integration")
            ;;
        "e2e")
            test_paths=("tests/e2e")
            ;;
        "performance")
            test_paths=("tests/performance")
            pytest_args+=("--benchmark-only")
            ;;
        "all")
            test_paths=("apps/*/tests" "tests")
            ;;
    esac
    
    # Build pytest command
    local pytest_cmd=("python" "-m" "pytest")
    
    # Add test paths
    for path in "${test_paths[@]}"; do
        if [[ -d "$path" ]]; then
            pytest_cmd+=("$path")
        fi
    done
    
    # Add common arguments
    pytest_args+=("--verbose")
    pytest_args+=("--tb=short")
    pytest_args+=("--strict-markers")
    pytest_args+=("--strict-config")
    
    # Parallel execution
    if [[ "$PARALLEL_JOBS" -gt 1 ]]; then
        pytest_args+=("-n" "$PARALLEL_JOBS")
    fi
    
    # Coverage
    if [[ "$COVERAGE" == "true" ]]; then
        pytest_args+=("--cov=apps")
        pytest_args+=("--cov-report=html:$OUTPUT_DIR/coverage-backend")
        pytest_args+=("--cov-report=json:$OUTPUT_DIR/coverage-backend.json")
        pytest_args+=("--cov-report=term-missing")
        pytest_args+=("--cov-fail-under=$COVERAGE_THRESHOLD")
    fi
    
    # Filtering
    if [[ -n "$FILTER" ]]; then
        pytest_args+=("-k" "$FILTER")
    fi
    
    if [[ -n "$TAGS" ]]; then
        pytest_args+=("-m" "$TAGS")
    fi
    
    # Fail fast
    if [[ "$FAIL_FAST" == "true" ]]; then
        pytest_args+=("--maxfail=1")
    fi
    
    # Timeout
    pytest_args+=("--timeout=$TIMEOUT")
    
    # Random order
    if [[ "$RANDOM_ORDER" == "true" ]]; then
        pytest_args+=("--random-order")
        if [[ -n "$SEED" ]]; then
            pytest_args+=("--random-order-seed=$SEED")
        fi
    fi
    
    # Sharding
    if [[ -n "$SHARD_INDEX" && -n "$SHARD_COUNT" ]]; then
        pytest_args+=("--dist=each" "--tx=$SHARD_COUNT*popen")
    fi
    
    # Output format
    pytest_args+=("--junitxml=$OUTPUT_DIR/pytest-results.xml")
    pytest_args+=("--json-report" "--json-report-file=$OUTPUT_DIR/pytest-report.json")
    
    # Benchmark mode
    if [[ "$BENCHMARK_MODE" == "true" ]]; then
        pytest_args+=("--benchmark-json=$OUTPUT_DIR/benchmark-results.json")
    fi
    
    # Profile mode
    if [[ "$PROFILE_MODE" == "true" ]]; then
        pytest_args+=("--profile" "--profile-svg")
    fi
    
    # Debug mode
    if [[ "$DEBUG_MODE" == "true" ]]; then
        pytest_args+=("--pdb" "--capture=no")
    fi
    
    # Add all arguments to command
    pytest_cmd+=("${pytest_args[@]}")
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would run: ${pytest_cmd[*]}"
        return 0
    fi
    
    log_message "INFO" "Running backend tests: ${pytest_cmd[*]}"
    
    # Execute pytest
    if "${pytest_cmd[@]}"; then
        print_success "Backend tests passed"
        return 0
    else
        print_error "Backend tests failed"
        return 1
    fi
}

# Function to run frontend tests (vitest)
run_frontend_tests() {
    local test_type="$1"
    local vitest_args=()
    
    print_info "Running frontend tests ($test_type)..."
    
    # Build vitest command
    local vitest_cmd=("npm" "run" "test")
    
    # Add arguments based on test type
    case "$test_type" in
        "unit")
            vitest_args+=("--run" "--reporter=verbose")
            ;;
        "integration")
            vitest_args+=("--run" "--reporter=verbose" "--config" "vitest.integration.config.ts")
            ;;
        "e2e")
            vitest_args+=("--run" "--reporter=verbose" "--config" "vitest.e2e.config.ts")
            ;;
        "performance")
            vitest_args+=("--run" "--reporter=verbose" "--config" "vitest.performance.config.ts")
            ;;
        "all")
            vitest_args+=("--run" "--reporter=verbose")
            ;;
    esac
    
    # Watch mode
    if [[ "$WATCH_MODE" == "true" ]]; then
        vitest_args=("--watch")
    fi
    
    # Coverage
    if [[ "$COVERAGE" == "true" ]]; then
        vitest_args+=("--coverage")
        vitest_args+=("--coverage.reporter=html,json,text")
        vitest_args+=("--coverage.reportsDirectory=$OUTPUT_DIR/coverage-frontend")
        vitest_args+=("--coverage.thresholds.lines=$COVERAGE_THRESHOLD")
    fi
    
    # Parallel execution
    if [[ "$PARALLEL_JOBS" -gt 1 ]]; then
        vitest_args+=("--threads" "--maxThreads=$PARALLEL_JOBS")
    fi
    
    # Filtering
    if [[ -n "$FILTER" ]]; then
        vitest_args+=("--testNamePattern=$FILTER")
    fi
    
    # Fail fast
    if [[ "$FAIL_FAST" == "true" ]]; then
        vitest_args+=("--bail=1")
    fi
    
    # Timeout
    vitest_args+=("--testTimeout=$((TIMEOUT * 1000))")
    
    # Random order
    if [[ "$RANDOM_ORDER" == "true" ]]; then
        vitest_args+=("--sequence.shuffle")
        if [[ -n "$SEED" ]]; then
            vitest_args+=("--sequence.seed=$SEED")
        fi
    fi
    
    # Output format
    vitest_args+=("--reporter=json" "--outputFile=$OUTPUT_DIR/vitest-results.json")
    vitest_args+=("--reporter=junit" "--outputFile=$OUTPUT_DIR/vitest-junit.xml")
    
    # Debug mode
    if [[ "$DEBUG_MODE" == "true" ]]; then
        vitest_args+=("--inspect-brk")
    fi
    
    # Add arguments to command
    if [[ ${#vitest_args[@]} -gt 0 ]]; then
        vitest_cmd+=("--" "${vitest_args[@]}")
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would run: ${vitest_cmd[*]}"
        return 0
    fi
    
    log_message "INFO" "Running frontend tests: ${vitest_cmd[*]}"
    
    # Execute vitest
    if "${vitest_cmd[@]}"; then
        print_success "Frontend tests passed"
        return 0
    else
        print_error "Frontend tests failed"
        return 1
    fi
}

# Function to run specialized tests
run_specialized_tests() {
    local test_success=true
    
    # Visual regression tests
    if [[ "$VISUAL_REGRESSION" == "true" ]]; then
        print_info "Running visual regression tests..."
        if [[ "$DRY_RUN" != "true" ]]; then
            pnpm run test:visual || test_success=false
        fi
    fi
    
    # Accessibility tests
    if [[ "$ACCESSIBILITY_TESTING" == "true" ]]; then
        print_info "Running accessibility tests..."
        if [[ "$DRY_RUN" != "true" ]]; then
            pnpm run test:a11y || test_success=false
        fi
    fi
    
    # Security tests
    if [[ "$SECURITY_TESTING" == "true" ]]; then
        print_info "Running security tests..."
        if [[ "$DRY_RUN" != "true" ]]; then
            pnpm run test:security || test_success=false
        fi
    fi
    
    # Load tests
    if [[ "$LOAD_TESTING" == "true" ]]; then
        print_info "Running load tests..."
        if [[ "$DRY_RUN" != "true" ]]; then
            pnpm run test:load || test_success=false
        fi
    fi
    
    # Mutation testing
    if [[ "$MUTATION_TESTING" == "true" ]]; then
        print_info "Running mutation tests..."
        if [[ "$DRY_RUN" != "true" ]]; then
            pnpm run test:mutation || test_success=false
        fi
    fi
    
    return $([ "$test_success" == "true" ] && echo 0 || echo 1)
}

# Function to retry failed tests
retry_failed_tests() {
    local retry_count="$1"
    local failed_tests_file="$2"
    
    if [[ ! -f "$failed_tests_file" || "$retry_count" -eq 0 ]]; then
        return 0
    fi
    
    print_info "Retrying failed tests (attempt $retry_count)..."
    
    # Implementation depends on test framework
    # This is a placeholder for retry logic
    
    return 0
}

# Function to generate test report
generate_test_report() {
    if [[ "$GENERATE_REPORT" != "true" ]]; then
        return 0
    fi
    
    print_info "Generating test report..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would generate test report"
        return 0
    fi
    
    # Create HTML report
    local report_file="$OUTPUT_DIR/test-report.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>PhoenixCoder Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .success { color: green; }
        .failure { color: red; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PhoenixCoder Test Report</h1>
        <p><strong>Test Type:</strong> $TEST_TYPE</p>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Start Time:</strong> $TEST_START_TIME</p>
        <p><strong>End Time:</strong> $TEST_END_TIME</p>
        <p><strong>Duration:</strong> ${TEST_DURATION}s</p>
    </div>
    
    <div class="section">
        <h2>Test Results</h2>
        <!-- Test results will be populated here -->
    </div>
    
    <div class="section">
        <h2>Coverage Report</h2>
        <!-- Coverage results will be populated here -->
    </div>
    
    <div class="section">
        <h2>Performance Metrics</h2>
        <!-- Performance results will be populated here -->
    </div>
</body>
</html>
EOF
    
    print_success "Test report generated: $report_file"
    
    # Open report if requested
    if [[ "$OPEN_REPORT" == "true" ]]; then
        if command -v open &> /dev/null; then
            open "$report_file"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$report_file"
        fi
    fi
}

# Function to send notification
send_notification() {
    if [[ -z "$NOTIFY_WEBHOOK" ]]; then
        return 0
    fi
    
    local status="$1"
    local message="$2"
    
    local payload
    payload=$(cat << EOF
{
    "text": "PhoenixCoder Tests ($ENVIRONMENT): $status",
    "attachments": [{
        "color": "$([ "$status" == "SUCCESS" ] && echo "good" || echo "danger")",
        "fields": [
            {"title": "Test Type", "value": "$TEST_TYPE", "short": true},
            {"title": "Environment", "value": "$ENVIRONMENT", "short": true},
            {"title": "Duration", "value": "${TEST_DURATION}s", "short": true},
            {"title": "Parallel Jobs", "value": "$PARALLEL_JOBS", "short": true},
            {"title": "Message", "value": "$message", "short": false}
        ]
    }]
}
EOF
    )
    
    curl -X POST -H "Content-Type: application/json" -d "$payload" "$NOTIFY_WEBHOOK" &>/dev/null || true
}

# Main execution function
main() {
    local start_time=$(date +%s)
    
    print_info "Starting $TEST_TYPE tests for $ENVIRONMENT environment"
    log_message "INFO" "Test execution started"
    
    # Clean cache if requested
    clean_test_cache
    
    # Reset test data if requested
    reset_test_data
    
    # Detect changed files if needed
    local changed_files=()
    if [[ "$CHANGED_FILES_ONLY" == "true" || "$AFFECTED_ONLY" == "true" ]]; then
        mapfile -t changed_files < <(detect_changed_files)
        print_info "Detected ${#changed_files[@]} changed files"
        
        if [[ "$AFFECTED_ONLY" == "true" ]]; then
            local affected_tests
            mapfile -t affected_tests < <(get_affected_tests "${changed_files[@]}")
            print_info "Found ${#affected_tests[@]} affected test files"
        fi
    fi
    
    # Run tests based on type
    local test_success=true
    
    case "$TEST_TYPE" in
        "all")
            run_backend_tests "all" && run_frontend_tests "all" || test_success=false
            ;;
        "unit")
            run_backend_tests "unit" && run_frontend_tests "unit" || test_success=false
            ;;
        "integration")
            run_backend_tests "integration" && run_frontend_tests "integration" || test_success=false
            ;;
        "e2e")
            run_frontend_tests "e2e" || test_success=false
            ;;
        "performance")
            run_backend_tests "performance" && run_frontend_tests "performance" || test_success=false
            ;;
        *)
            # Handle specialized test types
            run_specialized_tests || test_success=false
            ;;
    esac
    
    # Run specialized tests if enabled
    if [[ "$VISUAL_REGRESSION" == "true" || "$ACCESSIBILITY_TESTING" == "true" || "$SECURITY_TESTING" == "true" || "$LOAD_TESTING" == "true" || "$MUTATION_TESTING" == "true" ]]; then
        run_specialized_tests || test_success=false
    fi
    
    # Calculate duration
    local end_time=$(date +%s)
    TEST_END_TIME=$(date -Iseconds)
    TEST_DURATION=$((end_time - start_time))
    
    # Generate report
    generate_test_report
    
    # Send notification
    if [[ "$test_success" == "true" ]]; then
        print_success "All tests completed successfully"
        print_info "Duration: ${TEST_DURATION}s"
        print_info "Results: $OUTPUT_DIR"
        
        log_message "INFO" "Test execution completed successfully"
        send_notification "SUCCESS" "All tests passed"
        
        exit 0
    else
        print_error "Some tests failed"
        log_message "ERROR" "Test execution failed"
        send_notification "FAILED" "Some tests failed"
        
        exit 1
    fi
}

# Handle watch mode
if [[ "$WATCH_MODE" == "true" ]]; then
    print_info "Starting watch mode..."
    
    # Use file system watcher to re-run tests on changes
    if command -v fswatch &> /dev/null; then
        fswatch -o . | while read -r; do
            print_info "Files changed, re-running tests..."
            main
        done
    else
        print_warning "fswatch not found, falling back to polling"
        while true; do
            main
            sleep 5
        done
    fi
else
    # Run tests once
    main "$@"
fi