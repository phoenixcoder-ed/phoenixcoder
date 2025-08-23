#!/bin/bash

# PhoenixCoder Health Check Script
# This script performs comprehensive health checks for all services

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
NAMESPACE=""
VERBOSE=false
TIMEOUT=30
RETRIES=3
OUTPUT_FORMAT="text"
SAVE_REPORT=false
REPORT_FILE=""
ALERT_WEBHOOK=""
CHECK_EXTERNAL=true
CHECK_PERFORMANCE=false

# Health check results
declare -A HEALTH_RESULTS
declare -A PERFORMANCE_METRICS

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Perform health checks for PhoenixCoder services

Options:
    -e, --environment ENV    Target environment (staging|production) [default: staging]
    -n, --namespace NS       Kubernetes namespace [default: auto-detect from environment]
    -v, --verbose           Enable verbose output
    -t, --timeout SECONDS   Request timeout [default: 30]
    -r, --retries COUNT     Number of retries [default: 3]
    -f, --format FORMAT     Output format (text|json|html) [default: text]
    -s, --save-report       Save health check report to file
    -o, --output FILE       Output file path [default: health-report-TIMESTAMP]
    -w, --webhook URL       Webhook URL for alerts
    --no-external          Skip external dependency checks
    --performance          Include performance metrics
    -h, --help              Show this help message

Examples:
    $0 -e staging                    # Check staging environment
    $0 -e production -v              # Check production with verbose output
    $0 -e staging -f json -s         # Generate JSON report
    $0 -e production --performance   # Include performance metrics

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -r|--retries)
            RETRIES="$2"
            shift 2
            ;;
        -f|--format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        -s|--save-report)
            SAVE_REPORT=true
            shift
            ;;
        -o|--output)
            REPORT_FILE="$2"
            SAVE_REPORT=true
            shift 2
            ;;
        -w|--webhook)
            ALERT_WEBHOOK="$2"
            shift 2
            ;;
        --no-external)
            CHECK_EXTERNAL=false
            shift
            ;;
        --performance)
            CHECK_PERFORMANCE=true
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

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
    exit 1
fi

# Set namespace if not provided
if [[ -z "$NAMESPACE" ]]; then
    NAMESPACE="$ENVIRONMENT"
fi

# Set report file if not provided
if [[ "$SAVE_REPORT" == "true" && -z "$REPORT_FILE" ]]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    REPORT_FILE="health-report-${ENVIRONMENT}-${TIMESTAMP}.${OUTPUT_FORMAT}"
fi

# Function to make HTTP request with retries
http_request() {
    local url="$1"
    local expected_status="${2:-200}"
    local retry_count=0
    
    while [[ $retry_count -lt $RETRIES ]]; do
        if [[ "$VERBOSE" == "true" ]]; then
            print_info "Attempting request to $url (attempt $((retry_count + 1))/$RETRIES)"
        fi
        
        local response
        local status_code
        
        if response=$(curl -s -w "\n%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null); then
            status_code=$(echo "$response" | tail -n1)
            local body=$(echo "$response" | head -n -1)
            
            if [[ "$status_code" == "$expected_status" ]]; then
                echo "$body"
                return 0
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [[ $retry_count -lt $RETRIES ]]; then
            sleep 2
        fi
    done
    
    return 1
}

# Function to check Kubernetes pod health
check_k8s_pods() {
    print_info "Checking Kubernetes pod health..."
    
    local services=("phoenixcoder-server" "phoenixcoder-oidc" "phoenixcoder-admin")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        if kubectl get deployment "$service" -n "$NAMESPACE" &>/dev/null; then
            local ready_replicas
            local desired_replicas
            
            ready_replicas=$(kubectl get deployment "$service" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
            desired_replicas=$(kubectl get deployment "$service" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
            
            if [[ "$ready_replicas" == "$desired_replicas" && "$ready_replicas" -gt 0 ]]; then
                HEALTH_RESULTS["k8s_${service}"]="healthy"
                print_success "$service: $ready_replicas/$desired_replicas pods ready"
            else
                HEALTH_RESULTS["k8s_${service}"]="unhealthy"
                print_error "$service: $ready_replicas/$desired_replicas pods ready"
                all_healthy=false
            fi
        else
            HEALTH_RESULTS["k8s_${service}"]="not_found"
            print_error "$service: deployment not found"
            all_healthy=false
        fi
    done
    
    HEALTH_RESULTS["k8s_overall"]=$([ "$all_healthy" == "true" ] && echo "healthy" || echo "unhealthy")
}

# Function to check service endpoints
check_service_endpoints() {
    print_info "Checking service endpoints..."
    
    local endpoints
    if [[ "$ENVIRONMENT" == "production" ]]; then
        endpoints=(
            "https://api.phoenixcoder.dev/health:200"
            "https://oidc.phoenixcoder.dev/health:200"
            "https://phoenixcoder.dev/health:200"
        )
    else
        endpoints=(
            "https://api-staging.phoenixcoder.dev/health:200"
            "https://oidc-staging.phoenixcoder.dev/health:200"
            "https://staging.phoenixcoder.dev/health:200"
        )
    fi
    
    for endpoint_info in "${endpoints[@]}"; do
        local url=$(echo "$endpoint_info" | cut -d':' -f1-2)
        local expected_status=$(echo "$endpoint_info" | cut -d':' -f3)
        local service_name=$(echo "$url" | sed 's|https://||' | cut -d'.' -f1)
        
        if http_request "$url" "$expected_status" >/dev/null; then
            HEALTH_RESULTS["endpoint_${service_name}"]="healthy"
            print_success "$service_name endpoint: OK"
        else
            HEALTH_RESULTS["endpoint_${service_name}"]="unhealthy"
            print_error "$service_name endpoint: FAILED"
        fi
    done
}

# Function to check database connectivity
check_database() {
    print_info "Checking database connectivity..."
    
    # Port forward to database service
    kubectl port-forward service/phoenixcoder-server 8080:80 -n "$NAMESPACE" &
    local port_forward_pid=$!
    sleep 3
    
    if http_request "http://localhost:8080/api/health/db" "200" >/dev/null; then
        HEALTH_RESULTS["database"]="healthy"
        print_success "Database: OK"
    else
        HEALTH_RESULTS["database"]="unhealthy"
        print_error "Database: FAILED"
    fi
    
    kill $port_forward_pid 2>/dev/null || true
}

# Function to check Redis connectivity
check_redis() {
    print_info "Checking Redis connectivity..."
    
    # Port forward to backend service
    kubectl port-forward service/phoenixcoder-server 8080:80 -n "$NAMESPACE" &
    local port_forward_pid=$!
    sleep 3
    
    if http_request "http://localhost:8080/api/health/redis" "200" >/dev/null; then
        HEALTH_RESULTS["redis"]="healthy"
        print_success "Redis: OK"
    else
        HEALTH_RESULTS["redis"]="unhealthy"
        print_error "Redis: FAILED"
    fi
    
    kill $port_forward_pid 2>/dev/null || true
}

# Function to check external dependencies
check_external_dependencies() {
    if [[ "$CHECK_EXTERNAL" != "true" ]]; then
        return 0
    fi
    
    print_info "Checking external dependencies..."
    
    local external_services=(
        "https://api.github.com:200"
        "https://accounts.google.com/.well-known/openid_configuration:200"
        "https://api.stripe.com/v1:401"  # Stripe returns 401 without auth, which is expected
    )
    
    for service_info in "${external_services[@]}"; do
        local url=$(echo "$service_info" | cut -d':' -f1-2)
        local expected_status=$(echo "$service_info" | cut -d':' -f3)
        local service_name=$(echo "$url" | sed 's|https://||' | cut -d'.' -f1)
        
        if http_request "$url" "$expected_status" >/dev/null; then
            HEALTH_RESULTS["external_${service_name}"]="healthy"
            print_success "External $service_name: OK"
        else
            HEALTH_RESULTS["external_${service_name}"]="unhealthy"
            print_warning "External $service_name: FAILED (may affect some features)"
        fi
    done
}

# Function to collect performance metrics
collect_performance_metrics() {
    if [[ "$CHECK_PERFORMANCE" != "true" ]]; then
        return 0
    fi
    
    print_info "Collecting performance metrics..."
    
    # Get resource usage
    local cpu_usage
    local memory_usage
    
    cpu_usage=$(kubectl top pods -n "$NAMESPACE" --no-headers 2>/dev/null | awk '{sum+=$2} END {print sum "m"}' || echo "N/A")
    memory_usage=$(kubectl top pods -n "$NAMESPACE" --no-headers 2>/dev/null | awk '{sum+=$3} END {print sum "Mi"}' || echo "N/A")
    
    PERFORMANCE_METRICS["cpu_usage"]="$cpu_usage"
    PERFORMANCE_METRICS["memory_usage"]="$memory_usage"
    
    # Measure response times
    local api_response_time
    if [[ "$ENVIRONMENT" == "production" ]]; then
        api_response_time=$(curl -w "%{time_total}" -s -o /dev/null --max-time "$TIMEOUT" "https://api.phoenixcoder.dev/health" 2>/dev/null || echo "N/A")
    else
        api_response_time=$(curl -w "%{time_total}" -s -o /dev/null --max-time "$TIMEOUT" "https://api-staging.phoenixcoder.dev/health" 2>/dev/null || echo "N/A")
    fi
    
    PERFORMANCE_METRICS["api_response_time"]="${api_response_time}s"
    
    print_info "CPU Usage: $cpu_usage"
    print_info "Memory Usage: $memory_usage"
    print_info "API Response Time: ${api_response_time}s"
}

# Function to generate text report
generate_text_report() {
    local report=""
    report+="PhoenixCoder Health Check Report\n"
    report+="Environment: $ENVIRONMENT\n"
    report+="Namespace: $NAMESPACE\n"
    report+="Timestamp: $(date)\n\n"
    
    report+="=== Service Health ===\n"
    for key in "${!HEALTH_RESULTS[@]}"; do
        local status="${HEALTH_RESULTS[$key]}"
        local status_symbol
        case "$status" in
            "healthy") status_symbol="✅" ;;
            "unhealthy") status_symbol="❌" ;;
            "not_found") status_symbol="❓" ;;
            *) status_symbol="⚠️" ;;
        esac
        report+="$key: $status_symbol $status\n"
    done
    
    if [[ "$CHECK_PERFORMANCE" == "true" ]]; then
        report+="\n=== Performance Metrics ===\n"
        for key in "${!PERFORMANCE_METRICS[@]}"; do
            report+="$key: ${PERFORMANCE_METRICS[$key]}\n"
        done
    fi
    
    echo -e "$report"
}

# Function to generate JSON report
generate_json_report() {
    local json="{"
    json+="\"environment\": \"$ENVIRONMENT\","
    json+="\"namespace\": \"$NAMESPACE\","
    json+="\"timestamp\": \"$(date -Iseconds)\","
    json+="\"health_results\": {"
    
    local first=true
    for key in "${!HEALTH_RESULTS[@]}"; do
        if [[ "$first" != "true" ]]; then
            json+=","
        fi
        json+="\"$key\": \"${HEALTH_RESULTS[$key]}\""
        first=false
    done
    json+="}"
    
    if [[ "$CHECK_PERFORMANCE" == "true" ]]; then
        json+=",\"performance_metrics\": {"
        first=true
        for key in "${!PERFORMANCE_METRICS[@]}"; do
            if [[ "$first" != "true" ]]; then
                json+=","
            fi
            json+="\"$key\": \"${PERFORMANCE_METRICS[$key]}\""
            first=false
        done
        json+="}"
    fi
    
    json+="}"
    echo "$json" | jq . 2>/dev/null || echo "$json"
}

# Function to send alert webhook
send_alert() {
    if [[ -z "$ALERT_WEBHOOK" ]]; then
        return 0
    fi
    
    local unhealthy_services=()
    for key in "${!HEALTH_RESULTS[@]}"; do
        if [[ "${HEALTH_RESULTS[$key]}" == "unhealthy" ]]; then
            unhealthy_services+=("$key")
        fi
    done
    
    if [[ ${#unhealthy_services[@]} -gt 0 ]]; then
        local alert_message="Health check failed for PhoenixCoder ($ENVIRONMENT): ${unhealthy_services[*]}"
        curl -X POST -H "Content-Type: application/json" -d "{\"text\": \"$alert_message\"}" "$ALERT_WEBHOOK" &>/dev/null || true
        print_info "Alert sent to webhook"
    fi
}

# Main execution
main() {
    print_info "Starting health check for $ENVIRONMENT environment"
    
    # Check prerequisites
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Perform health checks
    check_k8s_pods
    check_service_endpoints
    check_database
    check_redis
    check_external_dependencies
    collect_performance_metrics
    
    # Generate and display report
    local report
    case "$OUTPUT_FORMAT" in
        "json")
            report=$(generate_json_report)
            ;;
        "text")
            report=$(generate_text_report)
            ;;
        *)
            print_error "Unsupported output format: $OUTPUT_FORMAT"
            exit 1
            ;;
    esac
    
    echo "$report"
    
    # Save report if requested
    if [[ "$SAVE_REPORT" == "true" ]]; then
        echo "$report" > "$REPORT_FILE"
        print_success "Report saved to $REPORT_FILE"
    fi
    
    # Send alerts
    send_alert
    
    # Determine exit code
    local exit_code=0
    for status in "${HEALTH_RESULTS[@]}"; do
        if [[ "$status" == "unhealthy" ]]; then
            exit_code=1
            break
        fi
    done
    
    if [[ $exit_code -eq 0 ]]; then
        print_success "All health checks passed"
    else
        print_error "Some health checks failed"
    fi
    
    exit $exit_code
}

# Run main function
main "$@"