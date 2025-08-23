#!/bin/bash

# PhoenixCoder Restore Script
# This script provides comprehensive restore functionality for databases, files, and configurations

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
BACKUP_FILE=""
BACKUP_ID=""
RESTORE_TYPE="full"  # full, database, files, config
BACKUP_DIR="./backups"
ENCRYPTION_KEY=""
S3_BUCKET=""
S3_PREFIX=""
VERBOSE=false
DRY_RUN=false
FORCE=false
VERIFY_RESTORE=true
CREATE_BACKUP_BEFORE_RESTORE=true
RESTORE_POINT=""
PARALLEL_JOBS=4
NOTIFY_WEBHOOK=""
SKIP_DEPENDENCIES=false

# Restore metadata
RESTORE_TIMESTAMP=""
RESTORE_DURATION=0
RESTORE_LOG=""

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

Restore PhoenixCoder services from backup

Options:
    -e, --environment ENV       Target environment (staging|production) [default: staging]
    -n, --namespace NS          Kubernetes namespace [default: auto-detect from environment]
    -f, --backup-file FILE      Backup file to restore from
    -i, --backup-id ID          Backup ID to restore from (searches in backup directory)
    -t, --type TYPE            Restore type (full|database|files|config) [default: full]
    -d, --backup-dir DIR       Local backup directory [default: ./backups]
    --encryption-key KEY       Encryption key (required for encrypted backups)
    -s, --s3-bucket BUCKET     S3 bucket to download backup from
    --s3-prefix PREFIX         S3 prefix for backup files
    -v, --verbose              Enable verbose output
    --dry-run                  Show what would be restored without doing it
    --force                    Force restore without confirmation
    --no-verify                Skip restore verification
    --no-backup                Skip creating backup before restore
    --restore-point POINT      Restore to specific point in time (for incremental backups)
    -j, --parallel JOBS        Number of parallel restore jobs [default: 4]
    -w, --webhook URL          Webhook URL for notifications
    --skip-dependencies        Skip dependency checks
    -h, --help                 Show this help message

Restore Types:
    full        Complete restore (database + files + config)
    database    Database restore only
    files       File storage restore only
    config      Configuration restore only

Examples:
    $0 -e staging -f backup.tar.gz              # Restore from local file
    $0 -e production -i staging_full_20240101    # Restore from backup ID
    $0 -e staging -s my-backups --s3-prefix backups/  # Download and restore from S3
    $0 -e production -t database --force         # Force database restore only
    $0 --dry-run -v                             # Preview restore without execution

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
        -f|--backup-file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -i|--backup-id)
            BACKUP_ID="$2"
            shift 2
            ;;
        -t|--type)
            RESTORE_TYPE="$2"
            shift 2
            ;;
        -d|--backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --encryption-key)
            ENCRYPTION_KEY="$2"
            shift 2
            ;;
        -s|--s3-bucket)
            S3_BUCKET="$2"
            shift 2
            ;;
        --s3-prefix)
            S3_PREFIX="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --no-verify)
            VERIFY_RESTORE=false
            shift
            ;;
        --no-backup)
            CREATE_BACKUP_BEFORE_RESTORE=false
            shift
            ;;
        --restore-point)
            RESTORE_POINT="$2"
            shift 2
            ;;
        -j|--parallel)
            PARALLEL_JOBS="$2"
            shift 2
            ;;
        -w|--webhook)
            NOTIFY_WEBHOOK="$2"
            shift 2
            ;;
        --skip-dependencies)
            SKIP_DEPENDENCIES=true
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

# Validate restore type
if [[ "$RESTORE_TYPE" != "full" && "$RESTORE_TYPE" != "database" && "$RESTORE_TYPE" != "files" && "$RESTORE_TYPE" != "config" ]]; then
    print_error "Invalid restore type: $RESTORE_TYPE. Must be 'full', 'database', 'files', or 'config'"
    exit 1
fi

# Set namespace if not provided
if [[ -z "$NAMESPACE" ]]; then
    NAMESPACE="$ENVIRONMENT"
fi

# Validate backup source
if [[ -z "$BACKUP_FILE" && -z "$BACKUP_ID" && -z "$S3_BUCKET" ]]; then
    print_error "Must specify either --backup-file, --backup-id, or --s3-bucket"
    exit 1
fi

# Generate restore timestamp
RESTORE_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESTORE_LOG="$BACKUP_DIR/restore_${ENVIRONMENT}_${RESTORE_TIMESTAMP}.log"

# Function to log messages
log_message() {
    local message="$1"
    echo "$(date -Iseconds) - $message" >> "$RESTORE_LOG"
    if [[ "$VERBOSE" == "true" ]]; then
        print_info "$message"
    fi
}

# Function to find backup file
find_backup_file() {
    if [[ -n "$BACKUP_FILE" ]]; then
        if [[ ! -f "$BACKUP_FILE" ]]; then
            print_error "Backup file not found: $BACKUP_FILE"
            exit 1
        fi
        echo "$BACKUP_FILE"
        return 0
    fi
    
    if [[ -n "$BACKUP_ID" ]]; then
        # Search for backup file by ID
        local found_file
        for ext in "" ".tar.gz" ".tar.gz.enc" ".enc"; do
            local candidate="$BACKUP_DIR/${BACKUP_ID}${ext}"
            if [[ -f "$candidate" ]]; then
                found_file="$candidate"
                break
            fi
        done
        
        if [[ -z "$found_file" ]]; then
            print_error "Backup file not found for ID: $BACKUP_ID"
            exit 1
        fi
        
        echo "$found_file"
        return 0
    fi
    
    print_error "No backup file specified"
    exit 1
}

# Function to download from S3
download_from_s3() {
    if [[ -z "$S3_BUCKET" ]]; then
        return 0
    fi
    
    print_info "Downloading backup from S3..."
    
    # List available backups
    local backups
    backups=$(aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX" | grep "$ENVIRONMENT" | sort -r)
    
    if [[ -z "$backups" ]]; then
        print_error "No backups found in S3 bucket for environment: $ENVIRONMENT"
        exit 1
    fi
    
    # Select the latest backup if no specific ID provided
    local backup_to_download
    if [[ -n "$BACKUP_ID" ]]; then
        backup_to_download=$(echo "$backups" | grep "$BACKUP_ID" | head -1 | awk '{print $4}')
        if [[ -z "$backup_to_download" ]]; then
            print_error "Backup ID not found in S3: $BACKUP_ID"
            exit 1
        fi
    else
        backup_to_download=$(echo "$backups" | head -1 | awk '{print $4}')
    fi
    
    local local_file="$BACKUP_DIR/$(basename "$backup_to_download")"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would download s3://$S3_BUCKET/$S3_PREFIX$backup_to_download to $local_file"
        echo "$local_file"
        return 0
    fi
    
    if aws s3 cp "s3://$S3_BUCKET/$S3_PREFIX$backup_to_download" "$local_file"; then
        print_success "Downloaded backup from S3: $local_file"
        echo "$local_file"
    else
        print_error "Failed to download backup from S3"
        exit 1
    fi
}

# Function to decrypt backup
decrypt_backup() {
    local backup_file="$1"
    
    if [[ "$backup_file" != *.enc ]]; then
        echo "$backup_file"
        return 0
    fi
    
    if [[ -z "$ENCRYPTION_KEY" ]]; then
        print_error "Encryption key required for encrypted backup"
        exit 1
    fi
    
    print_info "Decrypting backup..."
    
    local decrypted_file="${backup_file%.enc}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would decrypt $backup_file to $decrypted_file"
        echo "$decrypted_file"
        return 0
    fi
    
    if openssl enc -aes-256-cbc -d -in "$backup_file" -out "$decrypted_file" -k "$ENCRYPTION_KEY"; then
        print_success "Backup decrypted: $decrypted_file"
        echo "$decrypted_file"
    else
        print_error "Backup decryption failed"
        exit 1
    fi
}

# Function to extract backup
extract_backup() {
    local backup_file="$1"
    
    if [[ "$backup_file" != *.tar.gz ]]; then
        echo "$backup_file"
        return 0
    fi
    
    print_info "Extracting backup..."
    
    local extract_dir="${backup_file%.tar.gz}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would extract $backup_file to $extract_dir"
        echo "$extract_dir"
        return 0
    fi
    
    if tar -xzf "$backup_file" -C "$(dirname "$backup_file")"; then
        print_success "Backup extracted: $extract_dir"
        echo "$extract_dir"
    else
        print_error "Backup extraction failed"
        exit 1
    fi
}

# Function to create backup before restore
create_pre_restore_backup() {
    if [[ "$CREATE_BACKUP_BEFORE_RESTORE" != "true" ]]; then
        return 0
    fi
    
    print_info "Creating backup before restore..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would create pre-restore backup"
        return 0
    fi
    
    local backup_script="./scripts/backup.sh"
    if [[ -f "$backup_script" ]]; then
        "$backup_script" -e "$ENVIRONMENT" -t "$RESTORE_TYPE" --backup-dir "$BACKUP_DIR/pre-restore"
        print_success "Pre-restore backup created"
    else
        print_warning "Backup script not found, skipping pre-restore backup"
    fi
}

# Function to get database connection info
get_db_connection() {
    local db_host
    local db_port
    local db_name
    local db_user
    local db_password
    
    # Get database connection from Kubernetes secret
    if kubectl get secret phoenixcoder-secrets -n "$NAMESPACE" &>/dev/null; then
        local db_url
        db_url=$(kubectl get secret phoenixcoder-secrets -n "$NAMESPACE" -o jsonpath='{.data.DATABASE_URL}' | base64 -d)
        
        # Parse PostgreSQL URL: postgresql://user:password@host:port/database
        if [[ "$db_url" =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
            db_user="${BASH_REMATCH[1]}"
            db_password="${BASH_REMATCH[2]}"
            db_host="${BASH_REMATCH[3]}"
            db_port="${BASH_REMATCH[4]}"
            db_name="${BASH_REMATCH[5]}"
        else
            print_error "Invalid database URL format"
            return 1
        fi
    else
        print_error "Cannot find database connection secret"
        return 1
    fi
    
    echo "$db_host:$db_port:$db_name:$db_user:$db_password"
}

# Function to restore database
restore_database() {
    local backup_dir="$1"
    local db_backup_file="$backup_dir/database.sql"
    
    if [[ ! -f "$db_backup_file" ]]; then
        print_error "Database backup file not found: $db_backup_file"
        return 1
    fi
    
    print_info "Starting database restore..."
    
    local db_info
    if ! db_info=$(get_db_connection); then
        print_error "Failed to get database connection info"
        return 1
    fi
    
    local db_host=$(echo "$db_info" | cut -d':' -f1)
    local db_port=$(echo "$db_info" | cut -d':' -f2)
    local db_name=$(echo "$db_info" | cut -d':' -f3)
    local db_user=$(echo "$db_info" | cut -d':' -f4)
    local db_password=$(echo "$db_info" | cut -d':' -f5)
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would restore database $db_name from $db_backup_file"
        return 0
    fi
    
    # Confirm restore if not forced
    if [[ "$FORCE" != "true" ]]; then
        print_warning "This will overwrite the current database: $db_name"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Database restore cancelled"
            return 1
        fi
    fi
    
    # Set up port forwarding to database
    print_info "Setting up port forwarding to database..."
    kubectl port-forward service/postgres 5432:5432 -n "$NAMESPACE" &
    local port_forward_pid=$!
    sleep 5
    
    # Drop existing connections
    print_info "Terminating existing database connections..."
    PGPASSWORD="$db_password" psql -h localhost -p 5432 -U "$db_user" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db_name' AND pid <> pg_backend_pid();"
    
    # Restore database
    print_info "Restoring database from backup..."
    if PGPASSWORD="$db_password" psql -h localhost -p 5432 -U "$db_user" -d "$db_name" < "$db_backup_file"; then
        print_success "Database restore completed"
    else
        print_error "Database restore failed"
        kill $port_forward_pid 2>/dev/null || true
        return 1
    fi
    
    # Clean up port forwarding
    kill $port_forward_pid 2>/dev/null || true
    
    log_message "Database restored from $db_backup_file"
}

# Function to restore files
restore_files() {
    local backup_dir="$1"
    local files_backup_dir="$backup_dir/files"
    
    if [[ ! -d "$files_backup_dir" ]]; then
        print_warning "Files backup directory not found: $files_backup_dir"
        return 0
    fi
    
    print_info "Starting file restore..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would restore files from $files_backup_dir"
        return 0
    fi
    
    # Restore files to persistent volumes
    for pvc_backup in "$files_backup_dir"/*; do
        if [[ ! -d "$pvc_backup" ]]; then
            continue
        fi
        
        local pvc_name=$(basename "$pvc_backup")
        print_info "Restoring PVC: $pvc_name"
        
        # Check if PVC exists
        if ! kubectl get pvc "$pvc_name" -n "$NAMESPACE" &>/dev/null; then
            print_warning "PVC $pvc_name does not exist, skipping"
            continue
        fi
        
        # Create a temporary pod to access the PVC
        local temp_pod="restore-pod-$(date +%s)"
        
        kubectl run "$temp_pod" -n "$NAMESPACE" --image=alpine:latest --restart=Never \
            --overrides='{
                "spec": {
                    "containers": [{
                        "name": "restore",
                        "image": "alpine:latest",
                        "command": ["sleep", "3600"],
                        "volumeMounts": [{
                            "name": "data",
                            "mountPath": "/data"
                        }]
                    }],
                    "volumes": [{
                        "name": "data",
                        "persistentVolumeClaim": {
                            "claimName": "'$pvc_name'"
                        }
                    }]
                }
            }' &>/dev/null
        
        # Wait for pod to be ready
        kubectl wait --for=condition=Ready pod/"$temp_pod" -n "$NAMESPACE" --timeout=60s
        
        # Clear existing data if forced
        if [[ "$FORCE" == "true" ]]; then
            kubectl exec "$temp_pod" -n "$NAMESPACE" -- rm -rf /data/* 2>/dev/null || true
        fi
        
        # Copy files to the pod
        kubectl cp "$pvc_backup" "$NAMESPACE/$temp_pod:/data" &>/dev/null
        
        # Clean up temporary pod
        kubectl delete pod "$temp_pod" -n "$NAMESPACE" &>/dev/null
        
        print_success "PVC restore completed: $pvc_name"
        log_message "Files restored for PVC: $pvc_name"
    done
}

# Function to restore configuration
restore_config() {
    local backup_dir="$1"
    local config_backup_dir="$backup_dir/config"
    
    if [[ ! -d "$config_backup_dir" ]]; then
        print_warning "Configuration backup directory not found: $config_backup_dir"
        return 0
    fi
    
    print_info "Starting configuration restore..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would restore configuration from $config_backup_dir"
        return 0
    fi
    
    # Restore ConfigMaps
    if [[ -f "$config_backup_dir/configmaps.yaml" ]]; then
        print_info "Restoring ConfigMaps..."
        kubectl apply -f "$config_backup_dir/configmaps.yaml" -n "$NAMESPACE"
        log_message "ConfigMaps restored"
    fi
    
    # Note: Secrets are not restored for security reasons
    # They should be manually recreated or restored from a secure vault
    
    # Restore Deployments
    if [[ -f "$config_backup_dir/deployments.yaml" ]]; then
        print_info "Restoring Deployments..."
        kubectl apply -f "$config_backup_dir/deployments.yaml" -n "$NAMESPACE"
        log_message "Deployments restored"
    fi
    
    # Restore Services
    if [[ -f "$config_backup_dir/services.yaml" ]]; then
        print_info "Restoring Services..."
        kubectl apply -f "$config_backup_dir/services.yaml" -n "$NAMESPACE"
        log_message "Services restored"
    fi
    
    # Restore Ingresses
    if [[ -f "$config_backup_dir/ingresses.yaml" ]]; then
        print_info "Restoring Ingresses..."
        kubectl apply -f "$config_backup_dir/ingresses.yaml" -n "$NAMESPACE" 2>/dev/null || true
        log_message "Ingresses restored"
    fi
    
    # Restore PVCs
    if [[ -f "$config_backup_dir/pvcs.yaml" ]]; then
        print_info "Restoring PVCs..."
        kubectl apply -f "$config_backup_dir/pvcs.yaml" -n "$NAMESPACE" 2>/dev/null || true
        log_message "PVCs restored"
    fi
    
    print_success "Configuration restore completed"
}

# Function to verify restore
verify_restore() {
    if [[ "$VERIFY_RESTORE" != "true" ]]; then
        return 0
    fi
    
    print_info "Verifying restore..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would verify restore"
        return 0
    fi
    
    local verification_failed=false
    
    # Check if pods are running
    print_info "Checking pod status..."
    local pods
    pods=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null || echo "")
    
    if [[ -n "$pods" ]]; then
        while read -r line; do
            local pod_name=$(echo "$line" | awk '{print $1}')
            local pod_status=$(echo "$line" | awk '{print $3}')
            
            if [[ "$pod_status" != "Running" ]]; then
                print_warning "Pod $pod_name is not running: $pod_status"
                verification_failed=true
            fi
        done <<< "$pods"
    fi
    
    # Check database connectivity (if database was restored)
    if [[ "$RESTORE_TYPE" == "full" || "$RESTORE_TYPE" == "database" ]]; then
        print_info "Checking database connectivity..."
        
        local db_info
        if db_info=$(get_db_connection); then
            local db_host=$(echo "$db_info" | cut -d':' -f1)
            local db_port=$(echo "$db_info" | cut -d':' -f2)
            local db_name=$(echo "$db_info" | cut -d':' -f3)
            local db_user=$(echo "$db_info" | cut -d':' -f4)
            local db_password=$(echo "$db_info" | cut -d':' -f5)
            
            # Set up port forwarding
            kubectl port-forward service/postgres 5432:5432 -n "$NAMESPACE" &
            local port_forward_pid=$!
            sleep 5
            
            # Test database connection
            if PGPASSWORD="$db_password" psql -h localhost -p 5432 -U "$db_user" -d "$db_name" -c "SELECT 1;" &>/dev/null; then
                print_success "Database connectivity verified"
            else
                print_error "Database connectivity check failed"
                verification_failed=true
            fi
            
            # Clean up port forwarding
            kill $port_forward_pid 2>/dev/null || true
        else
            print_error "Failed to get database connection info for verification"
            verification_failed=true
        fi
    fi
    
    # Check service endpoints
    print_info "Checking service endpoints..."
    local services
    services=$(kubectl get services -n "$NAMESPACE" --no-headers 2>/dev/null || echo "")
    
    if [[ -n "$services" ]]; then
        while read -r line; do
            local service_name=$(echo "$line" | awk '{print $1}')
            local service_type=$(echo "$line" | awk '{print $2}')
            
            if [[ "$service_type" == "ClusterIP" ]]; then
                # Test internal service connectivity
                if kubectl run test-pod-$(date +%s) --image=alpine:latest --restart=Never --rm -i \
                    --command -n "$NAMESPACE" -- wget -q --spider "http://$service_name" &>/dev/null; then
                    print_success "Service $service_name is accessible"
                else
                    print_warning "Service $service_name may not be accessible"
                fi
            fi
        done <<< "$services"
    fi
    
    if [[ "$verification_failed" == "true" ]]; then
        print_error "Restore verification failed"
        return 1
    else
        print_success "Restore verification passed"
        return 0
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
    "text": "PhoenixCoder Restore ($ENVIRONMENT): $status",
    "attachments": [{
        "color": "$([ "$status" == "SUCCESS" ] && echo "good" || echo "danger")",
        "fields": [
            {"title": "Environment", "value": "$ENVIRONMENT", "short": true},
            {"title": "Restore Type", "value": "$RESTORE_TYPE", "short": true},
            {"title": "Backup Source", "value": "$(basename "$BACKUP_FILE")", "short": true},
            {"title": "Duration", "value": "${RESTORE_DURATION}s", "short": true},
            {"title": "Message", "value": "$message", "short": false}
        ]
    }]
}
EOF
    )
    
    curl -X POST -H "Content-Type: application/json" -d "$payload" "$NOTIFY_WEBHOOK" &>/dev/null || true
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    print_info "Starting $RESTORE_TYPE restore for $ENVIRONMENT environment"
    
    # Check prerequisites
    if [[ "$SKIP_DEPENDENCIES" != "true" ]]; then
        if ! command -v kubectl &> /dev/null; then
            print_error "kubectl is not installed or not in PATH"
            exit 1
        fi
        
        if ! kubectl cluster-info &> /dev/null; then
            print_error "Cannot connect to Kubernetes cluster"
            exit 1
        fi
        
        if [[ "$RESTORE_TYPE" == "database" || "$RESTORE_TYPE" == "full" ]]; then
            if ! command -v psql &> /dev/null; then
                print_error "psql is not installed or not in PATH"
                exit 1
            fi
        fi
        
        if [[ -n "$S3_BUCKET" ]] && ! command -v aws &> /dev/null; then
            print_error "AWS CLI is not installed or not in PATH"
            exit 1
        fi
        
        if [[ -n "$ENCRYPTION_KEY" ]] && ! command -v openssl &> /dev/null; then
            print_error "OpenSSL is not installed or not in PATH"
            exit 1
        fi
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Initialize restore log
    echo "Restore started at $(date -Iseconds)" > "$RESTORE_LOG"
    
    # Download from S3 if needed
    if [[ -n "$S3_BUCKET" ]]; then
        BACKUP_FILE=$(download_from_s3)
    else
        BACKUP_FILE=$(find_backup_file)
    fi
    
    print_info "Using backup file: $BACKUP_FILE"
    log_message "Using backup file: $BACKUP_FILE"
    
    # Decrypt backup if needed
    BACKUP_FILE=$(decrypt_backup "$BACKUP_FILE")
    
    # Extract backup if needed
    local backup_dir
    backup_dir=$(extract_backup "$BACKUP_FILE")
    
    # Create pre-restore backup
    create_pre_restore_backup
    
    # Perform restore based on type
    local restore_success=true
    
    case "$RESTORE_TYPE" in
        "full")
            restore_config "$backup_dir" && \
            restore_files "$backup_dir" && \
            restore_database "$backup_dir" || restore_success=false
            ;;
        "database")
            restore_database "$backup_dir" || restore_success=false
            ;;
        "files")
            restore_files "$backup_dir" || restore_success=false
            ;;
        "config")
            restore_config "$backup_dir" || restore_success=false
            ;;
    esac
    
    if [[ "$restore_success" == "true" ]]; then
        # Verify restore
        verify_restore
        local verify_success=$?
        
        # Calculate duration
        local end_time=$(date +%s)
        RESTORE_DURATION=$((end_time - start_time))
        
        if [[ $verify_success -eq 0 ]]; then
            print_success "Restore completed successfully"
            print_info "Restore log: $RESTORE_LOG"
            print_info "Duration: ${RESTORE_DURATION}s"
            
            log_message "Restore completed successfully"
            send_notification "SUCCESS" "Restore completed successfully"
        else
            print_warning "Restore completed but verification failed"
            send_notification "WARNING" "Restore completed but verification failed"
        fi
    else
        print_error "Restore failed"
        log_message "Restore failed"
        send_notification "FAILED" "Restore process encountered errors"
        exit 1
    fi
}

# Run main function
main "$@"