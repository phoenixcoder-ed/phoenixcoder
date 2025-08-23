#!/bin/bash

# PhoenixCoder Monitoring Script
# This script provides comprehensive monitoring for all services

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
NAMESPACE=""
INTERVAL=30
DURATION=0  # 0 means run indefinitely
VERBOSE=false
LOG_FILE=""
METRICS_FILE=""
ALERT_WEBHOOK=""
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_RESPONSE_TIME=5
DASHBOARD_MODE=false
EXPORT_PROMETHEUS=false
PROMETHEUS_GATEWAY=""

# Monitoring data
declare -A CURRENT_METRICS
declare -A PREVIOUS_METRICS
declare -A ALERT_HISTORY

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

print_metric() {
    echo -e "${CYAN}[METRIC]${NC} $1"
}

print_alert() {
    echo -e "${PURPLE}[ALERT]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Monitor PhoenixCoder services with real-time metrics and alerting

Options:
    -e, --environment ENV       Target environment (staging|production) [default: staging]
    -n, --namespace NS          Kubernetes namespace [default: auto-detect from environment]
    -i, --interval SECONDS      Monitoring interval [default: 30]
    -d, --duration SECONDS      Monitoring duration (0 = indefinite) [default: 0]
    -v, --verbose              Enable verbose output
    -l, --log-file FILE        Log metrics to file
    -m, --metrics-file FILE    Export metrics to CSV file
    -w, --webhook URL          Webhook URL for alerts
    --cpu-threshold PERCENT    CPU usage alert threshold [default: 80]
    --memory-threshold PERCENT Memory usage alert threshold [default: 80]
    --response-threshold SEC   Response time alert threshold [default: 5]
    --dashboard                Enable dashboard mode (real-time display)
    --prometheus               Export metrics to Prometheus
    --prometheus-gateway URL   Prometheus pushgateway URL
    -h, --help                 Show this help message

Examples:
    $0 -e staging                           # Monitor staging environment
    $0 -e production -i 10 -d 3600         # Monitor production for 1 hour with 10s interval
    $0 -e staging --dashboard               # Real-time dashboard mode
    $0 -e production -l monitor.log        # Log metrics to file
    $0 -e staging --prometheus              # Export to Prometheus

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
        -i|--interval)
            INTERVAL="$2"
            shift 2
            ;;
        -d|--duration)
            DURATION="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -l|--log-file)
            LOG_FILE="$2"
            shift 2
            ;;
        -m|--metrics-file)
            METRICS_FILE="$2"
            shift 2
            ;;
        -w|--webhook)
            ALERT_WEBHOOK="$2"
            shift 2
            ;;
        --cpu-threshold)
            ALERT_THRESHOLD_CPU="$2"
            shift 2
            ;;
        --memory-threshold)
            ALERT_THRESHOLD_MEMORY="$2"
            shift 2
            ;;
        --response-threshold)
            ALERT_THRESHOLD_RESPONSE_TIME="$2"
            shift 2
            ;;
        --dashboard)
            DASHBOARD_MODE=true
            shift
            ;;
        --prometheus)
            EXPORT_PROMETHEUS=true
            shift
            ;;
        --prometheus-gateway)
            PROMETHEUS_GATEWAY="$2"
            EXPORT_PROMETHEUS=true
            shift 2
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

# Function to clear screen for dashboard mode
clear_screen() {
    if [[ "$DASHBOARD_MODE" == "true" ]]; then
        clear
    fi
}

# Function to get current timestamp
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Function to get ISO timestamp
get_iso_timestamp() {
    date -Iseconds
}

# Function to collect pod metrics
collect_pod_metrics() {
    local services=("phoenixcoder-server" "phoenixcoder-oidc" "phoenixcoder-admin")
    
    for service in "${services[@]}"; do
        if kubectl get deployment "$service" -n "$NAMESPACE" &>/dev/null; then
            # Get pod status
            local ready_replicas
            local desired_replicas
            local available_replicas
            
            ready_replicas=$(kubectl get deployment "$service" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
            desired_replicas=$(kubectl get deployment "$service" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
            available_replicas=$(kubectl get deployment "$service" -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}' 2>/dev/null || echo "0")
            
            CURRENT_METRICS["${service}_ready_replicas"]="$ready_replicas"
            CURRENT_METRICS["${service}_desired_replicas"]="$desired_replicas"
            CURRENT_METRICS["${service}_available_replicas"]="$available_replicas"
            
            # Get resource usage if metrics-server is available
            local cpu_usage="0"
            local memory_usage="0"
            
            if kubectl top pods -n "$NAMESPACE" -l app="$service" --no-headers &>/dev/null; then
                cpu_usage=$(kubectl top pods -n "$NAMESPACE" -l app="$service" --no-headers 2>/dev/null | awk '{sum+=$2} END {print sum}' | sed 's/m$//' || echo "0")
                memory_usage=$(kubectl top pods -n "$NAMESPACE" -l app="$service" --no-headers 2>/dev/null | awk '{sum+=$3} END {print sum}' | sed 's/Mi$//' || echo "0")
            fi
            
            CURRENT_METRICS["${service}_cpu_usage"]="$cpu_usage"
            CURRENT_METRICS["${service}_memory_usage"]="$memory_usage"
            
            # Calculate CPU and memory percentages (assuming limits)
            local cpu_limit=1000  # 1 CPU = 1000m
            local memory_limit=1024  # 1Gi = 1024Mi
            
            if [[ "$ENVIRONMENT" == "production" ]]; then
                cpu_limit=2000  # 2 CPU
                memory_limit=2048  # 2Gi
            fi
            
            local cpu_percent=0
            local memory_percent=0
            
            if [[ "$cpu_usage" -gt 0 ]]; then
                cpu_percent=$((cpu_usage * 100 / cpu_limit))
            fi
            
            if [[ "$memory_usage" -gt 0 ]]; then
                memory_percent=$((memory_usage * 100 / memory_limit))
            fi
            
            CURRENT_METRICS["${service}_cpu_percent"]="$cpu_percent"
            CURRENT_METRICS["${service}_memory_percent"]="$memory_percent"
        fi
    done
}

# Function to collect service metrics
collect_service_metrics() {
    local endpoints
    if [[ "$ENVIRONMENT" == "production" ]]; then
        endpoints=(
            "api:https://api.phoenixcoder.dev/health"
            "oidc:https://oidc.phoenixcoder.dev/health"
            "admin:https://phoenixcoder.dev/health"
        )
    else
        endpoints=(
            "api:https://api-staging.phoenixcoder.dev/health"
            "oidc:https://oidc-staging.phoenixcoder.dev/health"
            "admin:https://staging.phoenixcoder.dev/health"
        )
    fi
    
    for endpoint_info in "${endpoints[@]}"; do
        local service_name=$(echo "$endpoint_info" | cut -d':' -f1)
        local url=$(echo "$endpoint_info" | cut -d':' -f2-)
        
        # Measure response time and status
        local start_time=$(date +%s.%N)
        local status_code
        local response_time
        
        if status_code=$(curl -s -w "%{http_code}" -o /dev/null --max-time 10 "$url" 2>/dev/null); then
            local end_time=$(date +%s.%N)
            response_time=$(echo "$end_time - $start_time" | bc -l | xargs printf "%.3f")
        else
            status_code="0"
            response_time="10.000"
        fi
        
        CURRENT_METRICS["${service_name}_status_code"]="$status_code"
        CURRENT_METRICS["${service_name}_response_time"]="$response_time"
        
        # Determine health status
        local health_status="unhealthy"
        if [[ "$status_code" == "200" ]]; then
            health_status="healthy"
        fi
        
        CURRENT_METRICS["${service_name}_health"]="$health_status"
    done
}

# Function to collect system metrics
collect_system_metrics() {
    # Get cluster-wide metrics
    local total_nodes
    local ready_nodes
    
    total_nodes=$(kubectl get nodes --no-headers 2>/dev/null | wc -l || echo "0")
    ready_nodes=$(kubectl get nodes --no-headers 2>/dev/null | grep -c " Ready " || echo "0")
    
    CURRENT_METRICS["cluster_total_nodes"]="$total_nodes"
    CURRENT_METRICS["cluster_ready_nodes"]="$ready_nodes"
    
    # Get namespace resource usage
    local namespace_cpu="0"
    local namespace_memory="0"
    
    if kubectl top pods -n "$NAMESPACE" --no-headers &>/dev/null; then
        namespace_cpu=$(kubectl top pods -n "$NAMESPACE" --no-headers 2>/dev/null | awk '{sum+=$2} END {print sum}' | sed 's/m$//' || echo "0")
        namespace_memory=$(kubectl top pods -n "$NAMESPACE" --no-headers 2>/dev/null | awk '{sum+=$3} END {print sum}' | sed 's/Mi$//' || echo "0")
    fi
    
    CURRENT_METRICS["namespace_cpu_usage"]="$namespace_cpu"
    CURRENT_METRICS["namespace_memory_usage"]="$namespace_memory"
}

# Function to check for alerts
check_alerts() {
    local alerts=()
    local timestamp=$(get_timestamp)
    
    # Check CPU usage alerts
    for service in "phoenixcoder-server" "phoenixcoder-oidc" "phoenixcoder-admin"; do
        local cpu_percent="${CURRENT_METRICS["${service}_cpu_percent"]:-0}"
        if [[ "$cpu_percent" -gt "$ALERT_THRESHOLD_CPU" ]]; then
            local alert_key="${service}_cpu_high"
            if [[ -z "${ALERT_HISTORY[$alert_key]:-}" ]]; then
                alerts+=("High CPU usage on $service: ${cpu_percent}%")
                ALERT_HISTORY["$alert_key"]="$timestamp"
            fi
        fi
    done
    
    # Check memory usage alerts
    for service in "phoenixcoder-server" "phoenixcoder-oidc" "phoenixcoder-admin"; do
        local memory_percent="${CURRENT_METRICS["${service}_memory_percent"]:-0}"
        if [[ "$memory_percent" -gt "$ALERT_THRESHOLD_MEMORY" ]]; then
            local alert_key="${service}_memory_high"
            if [[ -z "${ALERT_HISTORY[$alert_key]:-}" ]]; then
                alerts+=("High memory usage on $service: ${memory_percent}%")
                ALERT_HISTORY["$alert_key"]="$timestamp"
            fi
        fi
    done
    
    # Check response time alerts
    for service in "api" "oidc" "admin"; do
        local response_time="${CURRENT_METRICS["${service}_response_time"]:-0}"
        if (( $(echo "$response_time > $ALERT_THRESHOLD_RESPONSE_TIME" | bc -l) )); then
            local alert_key="${service}_response_slow"
            if [[ -z "${ALERT_HISTORY[$alert_key]:-}" ]]; then
                alerts+=("Slow response time on $service: ${response_time}s")
                ALERT_HISTORY["$alert_key"]="$timestamp"
            fi
        fi
    done
    
    # Check service health alerts
    for service in "api" "oidc" "admin"; do
        local health="${CURRENT_METRICS["${service}_health"]:-unhealthy}"
        if [[ "$health" == "unhealthy" ]]; then
            local alert_key="${service}_unhealthy"
            if [[ -z "${ALERT_HISTORY[$alert_key]:-}" ]]; then
                alerts+=("Service $service is unhealthy")
                ALERT_HISTORY["$alert_key"]="$timestamp"
            fi
        fi
    done
    
    # Send alerts
    for alert in "${alerts[@]}"; do
        print_alert "$alert"
        send_webhook_alert "$alert"
    done
}

# Function to send webhook alert
send_webhook_alert() {
    if [[ -z "$ALERT_WEBHOOK" ]]; then
        return 0
    fi
    
    local message="$1"
    local payload="{\"text\": \"PhoenixCoder Alert ($ENVIRONMENT): $message\"}"
    
    curl -X POST -H "Content-Type: application/json" -d "$payload" "$ALERT_WEBHOOK" &>/dev/null || true
}

# Function to display dashboard
display_dashboard() {
    local timestamp=$(get_timestamp)
    
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                          PhoenixCoder Monitoring Dashboard                  ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    echo "║ Environment: $ENVIRONMENT$(printf '%*s' $((20 - ${#ENVIRONMENT})) '')Namespace: $NAMESPACE$(printf '%*s' $((20 - ${#NAMESPACE})) '')║"
    echo "║ Timestamp: $timestamp$(printf '%*s' $((40 - ${#timestamp})) '')║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    echo "║                                Service Status                                ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    
    # Display service status
    for service in "phoenixcoder-server" "phoenixcoder-oidc" "phoenixcoder-admin"; do
        local ready="${CURRENT_METRICS["${service}_ready_replicas"]:-0}"
        local desired="${CURRENT_METRICS["${service}_desired_replicas"]:-0}"
        local cpu="${CURRENT_METRICS["${service}_cpu_percent"]:-0}"
        local memory="${CURRENT_METRICS["${service}_memory_percent"]:-0}"
        
        local status_icon="❌"
        if [[ "$ready" == "$desired" && "$ready" -gt 0 ]]; then
            status_icon="✅"
        fi
        
        printf "║ %-20s %s %2s/%s pods  CPU: %3s%%  Memory: %3s%%$(printf '%*s' $((20)) '')║\n" \
            "$service" "$status_icon" "$ready" "$desired" "$cpu" "$memory"
    done
    
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    echo "║                              Endpoint Health                                ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    
    # Display endpoint health
    for service in "api" "oidc" "admin"; do
        local health="${CURRENT_METRICS["${service}_health"]:-unhealthy}"
        local response_time="${CURRENT_METRICS["${service}_response_time"]:-0.000}"
        local status_code="${CURRENT_METRICS["${service}_status_code"]:-0}"
        
        local health_icon="❌"
        if [[ "$health" == "healthy" ]]; then
            health_icon="✅"
        fi
        
        printf "║ %-10s %s Status: %3s  Response: %6ss$(printf '%*s' $((30)) '')║\n" \
            "$service" "$health_icon" "$status_code" "$response_time"
    done
    
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    echo "║                              Cluster Info                                   ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    
    local total_nodes="${CURRENT_METRICS["cluster_total_nodes"]:-0}"
    local ready_nodes="${CURRENT_METRICS["cluster_ready_nodes"]:-0}"
    local namespace_cpu="${CURRENT_METRICS["namespace_cpu_usage"]:-0}"
    local namespace_memory="${CURRENT_METRICS["namespace_memory_usage"]:-0}"
    
    printf "║ Nodes: %s/%s ready$(printf '%*s' $((50)) '')║\n" "$ready_nodes" "$total_nodes"
    printf "║ Namespace CPU: %sm$(printf '%*s' $((50)) '')║\n" "$namespace_cpu"
    printf "║ Namespace Memory: %sMi$(printf '%*s' $((50)) '')║\n" "$namespace_memory"
    
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
}

# Function to log metrics
log_metrics() {
    if [[ -z "$LOG_FILE" ]]; then
        return 0
    fi
    
    local timestamp=$(get_iso_timestamp)
    local log_entry="$timestamp"
    
    for key in "${!CURRENT_METRICS[@]}"; do
        log_entry+=",$key=${CURRENT_METRICS[$key]}"
    done
    
    echo "$log_entry" >> "$LOG_FILE"
}

# Function to export metrics to CSV
export_metrics_csv() {
    if [[ -z "$METRICS_FILE" ]]; then
        return 0
    fi
    
    local timestamp=$(get_iso_timestamp)
    
    # Write header if file doesn't exist
    if [[ ! -f "$METRICS_FILE" ]]; then
        local header="timestamp"
        for key in "${!CURRENT_METRICS[@]}"; do
            header+=",$key"
        done
        echo "$header" > "$METRICS_FILE"
    fi
    
    # Write metrics
    local row="$timestamp"
    for key in "${!CURRENT_METRICS[@]}"; do
        row+=",${CURRENT_METRICS[$key]}"
    done
    
    echo "$row" >> "$METRICS_FILE"
}

# Function to export metrics to Prometheus
export_prometheus_metrics() {
    if [[ "$EXPORT_PROMETHEUS" != "true" ]]; then
        return 0
    fi
    
    local metrics_data=""
    local job_name="phoenixcoder_monitoring"
    local instance="$ENVIRONMENT"
    
    # Convert metrics to Prometheus format
    for key in "${!CURRENT_METRICS[@]}"; do
        local metric_name=$(echo "$key" | tr '[:upper:]' '[:lower:]' | sed 's/-/_/g')
        local metric_value="${CURRENT_METRICS[$key]}"
        
        # Skip non-numeric values
        if [[ "$metric_value" =~ ^[0-9]+\.?[0-9]*$ ]]; then
            metrics_data+="phoenixcoder_${metric_name}{environment=\"$ENVIRONMENT\",namespace=\"$NAMESPACE\"} $metric_value\n"
        fi
    done
    
    # Push to Prometheus gateway if configured
    if [[ -n "$PROMETHEUS_GATEWAY" ]]; then
        echo -e "$metrics_data" | curl -X POST --data-binary @- "$PROMETHEUS_GATEWAY/metrics/job/$job_name/instance/$instance" &>/dev/null || true
    fi
}

# Function to cleanup on exit
cleanup() {
    print_info "Monitoring stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main monitoring loop
main() {
    print_info "Starting monitoring for $ENVIRONMENT environment"
    print_info "Monitoring interval: ${INTERVAL}s"
    
    if [[ "$DURATION" -gt 0 ]]; then
        print_info "Monitoring duration: ${DURATION}s"
    else
        print_info "Monitoring duration: indefinite (Ctrl+C to stop)"
    fi
    
    # Check prerequisites
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if bc is available for calculations
    if ! command -v bc &> /dev/null; then
        print_warning "bc is not installed. Some calculations may be inaccurate."
    fi
    
    local start_time=$(date +%s)
    local iteration=0
    
    while true; do
        iteration=$((iteration + 1))
        
        # Clear screen for dashboard mode
        clear_screen
        
        # Collect metrics
        collect_pod_metrics
        collect_service_metrics
        collect_system_metrics
        
        # Check for alerts
        check_alerts
        
        # Display output
        if [[ "$DASHBOARD_MODE" == "true" ]]; then
            display_dashboard
        else
            local timestamp=$(get_timestamp)
            print_info "Monitoring iteration $iteration at $timestamp"
            
            if [[ "$VERBOSE" == "true" ]]; then
                for key in "${!CURRENT_METRICS[@]}"; do
                    print_metric "$key: ${CURRENT_METRICS[$key]}"
                done
            fi
        fi
        
        # Log and export metrics
        log_metrics
        export_metrics_csv
        export_prometheus_metrics
        
        # Check if duration limit reached
        if [[ "$DURATION" -gt 0 ]]; then
            local current_time=$(date +%s)
            local elapsed=$((current_time - start_time))
            
            if [[ $elapsed -ge $DURATION ]]; then
                print_info "Monitoring duration reached. Stopping."
                break
            fi
        fi
        
        # Store current metrics as previous for next iteration
        for key in "${!CURRENT_METRICS[@]}"; do
            PREVIOUS_METRICS["$key"]="${CURRENT_METRICS[$key]}"
        done
        
        # Wait for next iteration
        sleep "$INTERVAL"
    done
}

# Run main function
main "$@"