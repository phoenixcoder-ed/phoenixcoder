#!/bin/bash

# PhoenixCoder Kubernetes Deployment Script
# This script automates the deployment process for different environments

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
DRY_RUN=false
VERBOSE=false
SKIP_TESTS=false
FORCE_DEPLOY=false
ROLLBACK=false
HEALTH_CHECK=true
WAIT_TIMEOUT=300

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

Deploy PhoenixCoder to Kubernetes cluster

Options:
    -e, --environment ENV    Target environment (staging|production) [default: staging]
    -n, --namespace NS       Kubernetes namespace [default: auto-detect from environment]
    -d, --dry-run           Perform a dry run without making changes
    -v, --verbose           Enable verbose output
    -s, --skip-tests        Skip pre-deployment tests
    -f, --force             Force deployment even if tests fail
    -r, --rollback          Rollback to previous version
    -t, --timeout SECONDS   Health check timeout [default: 300]
    --no-health-check       Skip health checks after deployment
    -h, --help              Show this help message

Examples:
    $0 -e staging                    # Deploy to staging
    $0 -e production -v              # Deploy to production with verbose output
    $0 -e staging -d                 # Dry run for staging
    $0 -e production -r              # Rollback production deployment
    $0 -e staging -s -f              # Force deploy to staging, skip tests

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
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -f|--force)
            FORCE_DEPLOY=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK=true
            shift
            ;;
        -t|--timeout)
            WAIT_TIMEOUT="$2"
            shift 2
            ;;
        --no-health-check)
            HEALTH_CHECK=false
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

# Set verbose mode
if [[ "$VERBOSE" == "true" ]]; then
    set -x
fi

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        print_error "helm is not installed or not in PATH"
        exit 1
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_warning "Namespace '$NAMESPACE' does not exist. Creating..."
        kubectl apply -f "k8s/$ENVIRONMENT/namespace.yaml"
    fi
    
    print_success "Prerequisites check passed"
}

# Run pre-deployment tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        print_warning "Skipping pre-deployment tests"
        return 0
    fi
    
    print_info "Running pre-deployment tests..."
    
    # Run linting
    if ! pnpm run lint; then
        print_error "Linting failed"
        if [[ "$FORCE_DEPLOY" != "true" ]]; then
            exit 1
        fi
        print_warning "Continuing deployment despite test failures (--force enabled)"
    fi
    
    # Run unit tests
    if ! pnpm run test:unit; then
        print_error "Unit tests failed"
        if [[ "$FORCE_DEPLOY" != "true" ]]; then
            exit 1
        fi
        print_warning "Continuing deployment despite test failures (--force enabled)"
    fi
    
    # Run integration tests for staging
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        if ! pnpm run test:integration; then
            print_error "Integration tests failed"
            if [[ "$FORCE_DEPLOY" != "true" ]]; then
                exit 1
            fi
            print_warning "Continuing deployment despite test failures (--force enabled)"
        fi
    fi
    
    print_success "All tests passed"
}

# Build and push Docker images
build_images() {
    print_info "Building and pushing Docker images..."
    
    # Get current git commit hash
    GIT_COMMIT=$(git rev-parse --short HEAD)
    IMAGE_TAG="${ENVIRONMENT}-${GIT_COMMIT}"
    
    # Build backend image
    print_info "Building backend image..."
    docker build -t "ghcr.io/phoenixcoder/server:${IMAGE_TAG}" -f apps/community/server/Dockerfile apps/community/server/
    
    # Build OIDC service image
    print_info "Building OIDC service image..."
    docker build -t "ghcr.io/phoenixcoder/oidc-server:${IMAGE_TAG}" -f apps/community/oidc-server/Dockerfile apps/community/oidc-server/
    
    # Build admin frontend image
    print_info "Building admin frontend image..."
    docker build -t "ghcr.io/phoenixcoder/admin:${IMAGE_TAG}" -f apps/community/admin/Dockerfile apps/community/admin/
    
    if [[ "$DRY_RUN" != "true" ]]; then
        # Push images
        print_info "Pushing images to registry..."
        docker push "ghcr.io/phoenixcoder/server:${IMAGE_TAG}"
        docker push "ghcr.io/phoenixcoder/oidc-server:${IMAGE_TAG}"
        docker push "ghcr.io/phoenixcoder/admin:${IMAGE_TAG}"
        
        # Update image tags in deployment files
        sed -i.bak "s|ghcr.io/phoenixcoder/server:latest|ghcr.io/phoenixcoder/server:${IMAGE_TAG}|g" "k8s/$ENVIRONMENT/server-deployment.yaml"
        sed -i.bak "s|ghcr.io/phoenixcoder/oidc-server:latest|ghcr.io/phoenixcoder/oidc-server:${IMAGE_TAG}|g" "k8s/$ENVIRONMENT/oidc-deployment.yaml"
        sed -i.bak "s|ghcr.io/phoenixcoder/admin:latest|ghcr.io/phoenixcoder/admin:${IMAGE_TAG}|g" "k8s/$ENVIRONMENT/admin-deployment.yaml"
    fi
    
    print_success "Images built and pushed successfully"
}

# Deploy to Kubernetes
deploy_to_k8s() {
    print_info "Deploying to Kubernetes ($ENVIRONMENT environment)..."
    
    local kubectl_args=""
    if [[ "$DRY_RUN" == "true" ]]; then
        kubectl_args="--dry-run=client"
        print_info "Performing dry run..."
    fi
    
    # Apply namespace
    kubectl apply $kubectl_args -f "k8s/$ENVIRONMENT/namespace.yaml"
    
    # Apply ConfigMaps
    kubectl apply $kubectl_args -f "k8s/$ENVIRONMENT/configmap.yaml"
    
    # Apply Secrets (only if not dry run)
    if [[ "$DRY_RUN" != "true" ]]; then
        if [[ -f "k8s/$ENVIRONMENT/secrets.yaml" ]]; then
            print_warning "Applying secrets. Make sure they contain actual values, not templates!"
            kubectl apply -f "k8s/$ENVIRONMENT/secrets.yaml"
        else
            print_warning "Secrets file not found. You may need to create and apply secrets manually."
        fi
    fi
    
    # Apply deployments
    kubectl apply $kubectl_args -f "k8s/$ENVIRONMENT/server-deployment.yaml"
    kubectl apply $kubectl_args -f "k8s/$ENVIRONMENT/oidc-deployment.yaml"
    kubectl apply $kubectl_args -f "k8s/$ENVIRONMENT/admin-deployment.yaml"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        # Wait for deployments to be ready
        print_info "Waiting for deployments to be ready..."
        kubectl rollout status deployment/phoenixcoder-server -n "$NAMESPACE" --timeout="${WAIT_TIMEOUT}s"
        kubectl rollout status deployment/phoenixcoder-oidc -n "$NAMESPACE" --timeout="${WAIT_TIMEOUT}s"
        kubectl rollout status deployment/phoenixcoder-admin -n "$NAMESPACE" --timeout="${WAIT_TIMEOUT}s"
    fi
    
    print_success "Deployment completed successfully"
}

# Perform health checks
health_check() {
    if [[ "$HEALTH_CHECK" != "true" || "$DRY_RUN" == "true" ]]; then
        return 0
    fi
    
    print_info "Performing health checks..."
    
    # Check pod status
    print_info "Checking pod status..."
    kubectl get pods -n "$NAMESPACE" -l app=phoenixcoder-server
    kubectl get pods -n "$NAMESPACE" -l app=phoenixcoder-oidc
    kubectl get pods -n "$NAMESPACE" -l app=phoenixcoder-admin
    
    # Check service endpoints
    print_info "Checking service endpoints..."
    kubectl get endpoints -n "$NAMESPACE"
    
    # Test API health endpoint
    print_info "Testing API health endpoint..."
    if kubectl get service phoenixcoder-server -n "$NAMESPACE" &> /dev/null; then
        # Port forward to test health endpoint
        kubectl port-forward service/phoenixcoder-server 8080:80 -n "$NAMESPACE" &
        local port_forward_pid=$!
        sleep 5
        
        if curl -f http://localhost:8080/health &> /dev/null; then
            print_success "API health check passed"
        else
            print_error "API health check failed"
            kill $port_forward_pid 2>/dev/null || true
            exit 1
        fi
        
        kill $port_forward_pid 2>/dev/null || true
    fi
    
    print_success "All health checks passed"
}

# Rollback deployment
rollback_deployment() {
    print_info "Rolling back deployment..."
    
    kubectl rollout undo deployment/phoenixcoder-server -n "$NAMESPACE"
    kubectl rollout undo deployment/phoenixcoder-oidc -n "$NAMESPACE"
    kubectl rollout undo deployment/phoenixcoder-admin -n "$NAMESPACE"
    
    # Wait for rollback to complete
    kubectl rollout status deployment/phoenixcoder-server -n "$NAMESPACE" --timeout="${WAIT_TIMEOUT}s"
    kubectl rollout status deployment/phoenixcoder-oidc -n "$NAMESPACE" --timeout="${WAIT_TIMEOUT}s"
    kubectl rollout status deployment/phoenixcoder-admin -n "$NAMESPACE" --timeout="${WAIT_TIMEOUT}s"
    
    print_success "Rollback completed successfully"
}

# Cleanup function
cleanup() {
    # Restore original deployment files
    if [[ -f "k8s/$ENVIRONMENT/server-deployment.yaml.bak" ]]; then
        mv "k8s/$ENVIRONMENT/server-deployment.yaml.bak" "k8s/$ENVIRONMENT/server-deployment.yaml"
    fi
    if [[ -f "k8s/$ENVIRONMENT/oidc-deployment.yaml.bak" ]]; then
        mv "k8s/$ENVIRONMENT/oidc-deployment.yaml.bak" "k8s/$ENVIRONMENT/oidc-deployment.yaml"
    fi
    if [[ -f "k8s/$ENVIRONMENT/admin-deployment.yaml.bak" ]]; then
        mv "k8s/$ENVIRONMENT/admin-deployment.yaml.bak" "k8s/$ENVIRONMENT/admin-deployment.yaml"
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main execution
main() {
    print_info "Starting PhoenixCoder deployment to $ENVIRONMENT environment"
    print_info "Namespace: $NAMESPACE"
    print_info "Dry run: $DRY_RUN"
    
    if [[ "$ROLLBACK" == "true" ]]; then
        check_prerequisites
        rollback_deployment
        health_check
    else
        check_prerequisites
        run_tests
        build_images
        deploy_to_k8s
        health_check
    fi
    
    print_success "Deployment process completed successfully!"
    
    if [[ "$DRY_RUN" != "true" && "$ROLLBACK" != "true" ]]; then
        print_info "Deployment summary:"
        kubectl get deployments -n "$NAMESPACE"
        kubectl get services -n "$NAMESPACE"
        kubectl get ingress -n "$NAMESPACE"
    fi
}

# Run main function
main "$@"