#!/bin/bash

# PhoenixCoder Multi-Edition Deployment Script
# Usage: ./deploy.sh [community|enterprise] [docker|k8s] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
EDITION="community"
PLATFORM="docker"
ACTION="deploy"
ENVIRONMENT="development"

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
    echo "PhoenixCoder Multi-Edition Deployment Script"
    echo ""
    echo "Usage: $0 [EDITION] [PLATFORM] [ACTION] [OPTIONS]"
    echo ""
    echo "EDITION:"
    echo "  community   Deploy Community Edition (default)"
    echo "  enterprise  Deploy Enterprise Edition"
    echo ""
    echo "PLATFORM:"
    echo "  docker      Deploy using Docker Compose (default)"
    echo "  k8s         Deploy using Kubernetes"
    echo ""
    echo "ACTION:"
    echo "  deploy      Deploy services (default)"
    echo "  stop        Stop services"
    echo "  restart     Restart services"
    echo "  logs        Show logs"
    echo "  status      Show status"
    echo "  clean       Clean up resources"
    echo ""
    echo "OPTIONS:"
    echo "  --env       Environment (development|staging|production)"
    echo "  --build     Force rebuild images"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 community docker deploy"
    echo "  $0 enterprise k8s deploy --env production"
    echo "  $0 community docker stop"
    echo "  $0 enterprise docker logs"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        community|enterprise)
            EDITION="$1"
            shift
            ;;
        docker|k8s)
            PLATFORM="$1"
            shift
            ;;
        deploy|stop|restart|logs|status|clean)
            ACTION="$1"
            shift
            ;;
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --build)
            BUILD_FLAG="--build"
            shift
            ;;
        --help|-h)
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

# Validate inputs
if [[ ! "$EDITION" =~ ^(community|enterprise)$ ]]; then
    print_error "Invalid edition: $EDITION"
    show_usage
    exit 1
fi

if [[ ! "$PLATFORM" =~ ^(docker|k8s)$ ]]; then
    print_error "Invalid platform: $PLATFORM"
    show_usage
    exit 1
fi

if [[ ! "$ACTION" =~ ^(deploy|stop|restart|logs|status|clean)$ ]]; then
    print_error "Invalid action: $ACTION"
    show_usage
    exit 1
fi

# Set compose file based on edition
if [[ "$EDITION" == "community" ]]; then
    COMPOSE_FILE="docker-compose.community.yml"
    NAMESPACE="phoenixcoder-community"
else
    COMPOSE_FILE="docker-compose.enterprise.yml"
    NAMESPACE="phoenixcoder-enterprise"
fi

print_info "Deploying PhoenixCoder $EDITION edition using $PLATFORM"
print_info "Action: $ACTION"
print_info "Environment: $ENVIRONMENT"

# Docker deployment functions
docker_deploy() {
    print_info "Starting Docker deployment for $EDITION edition..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Load environment variables
    if [[ -f ".env" ]]; then
        print_info "Loading environment variables from .env"
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Deploy services
    print_info "Deploying services using $COMPOSE_FILE"
    docker-compose -f "$COMPOSE_FILE" up -d $BUILD_FLAG
    
    print_success "$EDITION edition deployed successfully!"
    print_info "Services are starting up. Use './deploy.sh $EDITION docker status' to check status."
}

docker_stop() {
    print_info "Stopping Docker services for $EDITION edition..."
    docker-compose -f "$COMPOSE_FILE" down
    print_success "Services stopped successfully!"
}

docker_restart() {
    print_info "Restarting Docker services for $EDITION edition..."
    docker-compose -f "$COMPOSE_FILE" restart
    print_success "Services restarted successfully!"
}

docker_logs() {
    print_info "Showing logs for $EDITION edition..."
    docker-compose -f "$COMPOSE_FILE" logs -f
}

docker_status() {
    print_info "Checking status for $EDITION edition..."
    docker-compose -f "$COMPOSE_FILE" ps
}

docker_clean() {
    print_warning "This will remove all containers, networks, and volumes for $EDITION edition."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up Docker resources..."
        docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
        print_success "Cleanup completed!"
    else
        print_info "Cleanup cancelled."
    fi
}

# Kubernetes deployment functions
k8s_deploy() {
    print_info "Starting Kubernetes deployment for $EDITION edition..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl and try again."
        exit 1
    fi
    
    # Create namespace
    print_info "Creating namespace: $NAMESPACE"
    kubectl apply -f k8s/namespace-multi-edition.yaml
    
    # Deploy services
    print_info "Deploying services to namespace: $NAMESPACE"
    
    # Apply configmaps
    kubectl apply -f k8s/configmaps/ -n "$NAMESPACE"
    
    # Apply deployments
    for deployment in k8s/deployments/*.yaml; do
        # Replace placeholders in deployment files
        sed "s/{{EDITION}}/$EDITION/g; s/{{NAMESPACE}}/$NAMESPACE/g" "$deployment" | kubectl apply -f - -n "$NAMESPACE"
    done
    
    # Apply services
    kubectl apply -f k8s/services/ -n "$NAMESPACE"
    
    print_success "$EDITION edition deployed to Kubernetes successfully!"
    print_info "Use 'kubectl get pods -n $NAMESPACE' to check pod status."
}

k8s_stop() {
    print_info "Stopping Kubernetes services for $EDITION edition..."
    kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
    print_success "Services stopped successfully!"
}

k8s_restart() {
    print_info "Restarting Kubernetes services for $EDITION edition..."
    kubectl rollout restart deployment -n "$NAMESPACE"
    print_success "Services restarted successfully!"
}

k8s_logs() {
    print_info "Showing logs for $EDITION edition..."
    kubectl logs -f -l app=phoenixcoder -n "$NAMESPACE"
}

k8s_status() {
    print_info "Checking status for $EDITION edition..."
    kubectl get all -n "$NAMESPACE"
}

k8s_clean() {
    print_warning "This will remove all resources in namespace $NAMESPACE."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up Kubernetes resources..."
        kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
        print_success "Cleanup completed!"
    else
        print_info "Cleanup cancelled."
    fi
}

# Main execution logic
case "$PLATFORM" in
    docker)
        case "$ACTION" in
            deploy) docker_deploy ;;
            stop) docker_stop ;;
            restart) docker_restart ;;
            logs) docker_logs ;;
            status) docker_status ;;
            clean) docker_clean ;;
        esac
        ;;
    k8s)
        case "$ACTION" in
            deploy) k8s_deploy ;;
            stop) k8s_stop ;;
            restart) k8s_restart ;;
            logs) k8s_logs ;;
            status) k8s_status ;;
            clean) k8s_clean ;;
        esac
        ;;
esac

print_info "Operation completed."