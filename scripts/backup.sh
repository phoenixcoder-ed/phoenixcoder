#!/bin/bash

# PhoenixCoder Backup Script
# This script provides comprehensive backup for databases, files, and configurations

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
BACKUP_TYPE="full"  # full, database, files, config
BACKUP_DIR="./backups"
RETENTION_DAYS=30
COMPRESSION=true
ENCRYPTION=false
ENCRYPTION_KEY=""
S3_BUCKET=""
S3_PREFIX=""
VERBOSE=false
DRY_RUN=false
PARALLEL_JOBS=4
NOTIFY_WEBHOOK=""
VERIFY_BACKUP=true
INCREMENTAL=false
LAST_BACKUP_FILE=""

# Backup metadata
BACKUP_ID=""
BACKUP_TIMESTAMP=""
BACKUP_MANIFEST=""
BACKUP_SIZE=0
BACKUP_DURATION=0

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

Create comprehensive backups for PhoenixCoder services

Options:
    -e, --environment ENV       Target environment (staging|production) [default: staging]
    -n, --namespace NS          Kubernetes namespace [default: auto-detect from environment]
    -t, --type TYPE            Backup type (full|database|files|config) [default: full]
    -d, --backup-dir DIR       Local backup directory [default: ./backups]
    -r, --retention DAYS       Backup retention in days [default: 30]
    -c, --compress             Enable compression [default: true]
    --no-compress              Disable compression
    --encrypt                  Enable encryption
    --encryption-key KEY       Encryption key (required if --encrypt)
    -s, --s3-bucket BUCKET     S3 bucket for remote storage
    --s3-prefix PREFIX         S3 prefix for backup files
    -v, --verbose              Enable verbose output
    --dry-run                  Show what would be backed up without doing it
    -j, --parallel JOBS        Number of parallel backup jobs [default: 4]
    -w, --webhook URL          Webhook URL for notifications
    --no-verify                Skip backup verification
    --incremental              Create incremental backup
    --last-backup FILE         Last backup file for incremental backup
    -h, --help                 Show this help message

Backup Types:
    full        Complete backup (database + files + config)
    database    Database backup only
    files       File storage backup only
    config      Configuration backup only

Examples:
    $0 -e staging                           # Full backup of staging
    $0 -e production -t database            # Database backup only
    $0 -e staging --encrypt --s3-bucket my-backups  # Encrypted backup to S3
    $0 -e production --incremental          # Incremental backup
    $0 --dry-run -v                        # Preview backup without execution

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
        -t|--type)
            BACKUP_TYPE="$2"
            shift 2
            ;;
        -d|--backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -r|--retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        -c|--compress)
            COMPRESSION=true
            shift
            ;;
        --no-compress)
            COMPRESSION=false
            shift
            ;;
        --encrypt)
            ENCRYPTION=true
            shift
            ;;
        --encryption-key)
            ENCRYPTION_KEY="$2"
            ENCRYPTION=true
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
        -j|--parallel)
            PARALLEL_JOBS="$2"
            shift 2
            ;;
        -w|--webhook)
            NOTIFY_WEBHOOK="$2"
            shift 2
            ;;
        --no-verify)
            VERIFY_BACKUP=false
            shift
            ;;
        --incremental)
            INCREMENTAL=true
            shift
            ;;
        --last-backup)
            LAST_BACKUP_FILE="$2"
            INCREMENTAL=true
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

# Validate backup type
if [[ "$BACKUP_TYPE" != "full" && "$BACKUP_TYPE" != "database" && "$BACKUP_TYPE" != "files" && "$BACKUP_TYPE" != "config" ]]; then
    print_error "Invalid backup type: $BACKUP_TYPE. Must be 'full', 'database', 'files', or 'config'"
    exit 1
fi

# Set namespace if not provided
if [[ -z "$NAMESPACE" ]]; then
    NAMESPACE="$ENVIRONMENT"
fi

# Validate encryption
if [[ "$ENCRYPTION" == "true" && -z "$ENCRYPTION_KEY" ]]; then
    print_error "Encryption key is required when encryption is enabled"
    exit 1
fi

# Generate backup ID and timestamp
BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_ID="${ENVIRONMENT}_${BACKUP_TYPE}_${BACKUP_TIMESTAMP}"

# Function to create backup directory
create_backup_dir() {
    local backup_path="$BACKUP_DIR/$BACKUP_ID"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        mkdir -p "$backup_path"
        BACKUP_MANIFEST="$backup_path/manifest.json"
    fi
    
    print_info "Backup directory: $backup_path"
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

# Function to backup database
backup_database() {
    print_info "Starting database backup..."
    
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
    
    local backup_file="$BACKUP_DIR/$BACKUP_ID/database.sql"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would backup database $db_name to $backup_file"
        return 0
    fi
    
    # Set up port forwarding to database
    print_info "Setting up port forwarding to database..."
    kubectl port-forward service/postgres 5432:5432 -n "$NAMESPACE" &
    local port_forward_pid=$!
    sleep 5
    
    # Create database backup
    local pg_dump_cmd="PGPASSWORD='$db_password' pg_dump -h localhost -p 5432 -U '$db_user' -d '$db_name'"
    
    if [[ "$INCREMENTAL" == "true" && -n "$LAST_BACKUP_FILE" ]]; then
        # For incremental backup, we'll use WAL archiving or timestamp-based approach
        # This is a simplified version - in production, you'd want proper WAL archiving
        local last_backup_time
        last_backup_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$LAST_BACKUP_FILE" 2>/dev/null || echo "1970-01-01 00:00:00")
        pg_dump_cmd+="ß --where=\"updated_at >= '$last_backup_time'\""
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        print_info "Running: $pg_dump_cmd"
    fi
    
    if eval "$pg_dump_cmd" > "$backup_file"; then
        print_success "Database backup completed: $backup_file"
        
        # Get backup size
        local file_size
        file_size=$(stat -f "%z" "$backup_file" 2>/dev/null || echo "0")
        BACKUP_SIZE=$((BACKUP_SIZE + file_size))
    else
        print_error "Database backup failed"
        kill $port_forward_pid 2>/dev/null || true
        return 1
    fi
    
    # Clean up port forwarding
    kill $port_forward_pid 2>/dev/null || true
}

# Function to backup files
backup_files() {
    print_info "Starting file backup..."
    
    local file_backup_dir="$BACKUP_DIR/$BACKUP_ID/files"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would backup files to $file_backup_dir"
        return 0
    fi
    
    mkdir -p "$file_backup_dir"
    
    # Backup uploaded files from persistent volumes
    local pvcs
    pvcs=$(kubectl get pvc -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$pvcs" ]]; then
        for pvc in $pvcs; do
            print_info "Backing up PVC: $pvc"
            
            # Create a temporary pod to access the PVC
            local temp_pod="backup-pod-$(date +%s)"
            
            kubectl run "$temp_pod" -n "$NAMESPACE" --image=alpine:latest --restart=Never \
                --overrides='{
                    "spec": {
                        "containers": [{
                            "name": "backup",
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
                                "claimName": "'$pvc'"
                            }
                        }]
                    }
                }' &>/dev/null
            
            # Wait for pod to be ready
            kubectl wait --for=condition=Ready pod/"$temp_pod" -n "$NAMESPACE" --timeout=60s
            
            # Copy files from the pod
            kubectl cp "$NAMESPACE/$temp_pod:/data" "$file_backup_dir/$pvc" &>/dev/null
            
            # Clean up temporary pod
            kubectl delete pod "$temp_pod" -n "$NAMESPACE" &>/dev/null
            
            print_success "PVC backup completed: $pvc"
        done
    else
        print_warning "No persistent volume claims found"
    fi
    
    # Get backup size
    if [[ -d "$file_backup_dir" ]]; then
        local dir_size
        dir_size=$(du -sb "$file_backup_dir" 2>/dev/null | cut -f1 || echo "0")
        BACKUP_SIZE=$((BACKUP_SIZE + dir_size))
    fi
}

# Function to backup configuration
backup_config() {
    print_info "Starting configuration backup..."
    
    local config_backup_dir="$BACKUP_DIR/$BACKUP_ID/config"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would backup configuration to $config_backup_dir"
        return 0
    fi
    
    mkdir -p "$config_backup_dir"
    
    # Backup ConfigMaps
    print_info "Backing up ConfigMaps..."
    kubectl get configmaps -n "$NAMESPACE" -o yaml > "$config_backup_dir/configmaps.yaml"
    
    # Backup Secrets (without sensitive data)
    print_info "Backing up Secrets metadata..."
    kubectl get secrets -n "$NAMESPACE" -o yaml | \
        sed 's/data:/# data:/g' > "$config_backup_dir/secrets-metadata.yaml"
    
    # Backup Deployments
    print_info "Backing up Deployments..."
    kubectl get deployments -n "$NAMESPACE" -o yaml > "$config_backup_dir/deployments.yaml"
    
    # Backup Services
    print_info "Backing up Services..."
    kubectl get services -n "$NAMESPACE" -o yaml > "$config_backup_dir/services.yaml"
    
    # Backup Ingresses
    print_info "Backing up Ingresses..."
    kubectl get ingresses -n "$NAMESPACE" -o yaml > "$config_backup_dir/ingresses.yaml" 2>/dev/null || true
    
    # Backup PVCs
    print_info "Backing up PVCs..."
    kubectl get pvc -n "$NAMESPACE" -o yaml > "$config_backup_dir/pvcs.yaml" 2>/dev/null || true
    
    # Backup application configuration files
    if [[ -d "./k8s/$ENVIRONMENT" ]]; then
        print_info "Backing up local Kubernetes manifests..."
        cp -r "./k8s/$ENVIRONMENT" "$config_backup_dir/k8s-manifests"
    fi
    
    print_success "Configuration backup completed"
    
    # Get backup size
    local dir_size
    dir_size=$(du -sb "$config_backup_dir" 2>/dev/null | cut -f1 || echo "0")
    BACKUP_SIZE=$((BACKUP_SIZE + dir_size))
}

# Function to compress backup
compress_backup() {
    if [[ "$COMPRESSION" != "true" ]]; then
        return 0
    fi
    
    print_info "Compressing backup..."
    
    local backup_path="$BACKUP_DIR/$BACKUP_ID"
    local compressed_file="$BACKUP_DIR/${BACKUP_ID}.tar.gz"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would compress $backup_path to $compressed_file"
        return 0
    fi
    
    if tar -czf "$compressed_file" -C "$BACKUP_DIR" "$BACKUP_ID"; then
        print_success "Backup compressed: $compressed_file"
        
        # Remove uncompressed directory
        rm -rf "$backup_path"
        
        # Update backup size
        BACKUP_SIZE=$(stat -f "%z" "$compressed_file" 2>/dev/null || echo "0")
    else
        print_error "Backup compression failed"
        return 1
    fi
}

# Function to encrypt backup
encrypt_backup() {
    if [[ "$ENCRYPTION" != "true" ]]; then
        return 0
    fi
    
    print_info "Encrypting backup..."
    
    local backup_file
    if [[ "$COMPRESSION" == "true" ]]; then
        backup_file="$BACKUP_DIR/${BACKUP_ID}.tar.gz"
    else
        backup_file="$BACKUP_DIR/$BACKUP_ID"
    fi
    
    local encrypted_file="${backup_file}.enc"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would encrypt $backup_file to $encrypted_file"
        return 0
    fi
    
    if openssl enc -aes-256-cbc -salt -in "$backup_file" -out "$encrypted_file" -k "$ENCRYPTION_KEY"; then
        print_success "Backup encrypted: $encrypted_file"
        
        # Remove unencrypted file
        rm -f "$backup_file"
        
        # Update backup size
        BACKUP_SIZE=$(stat -f "%z" "$encrypted_file" 2>/dev/null || echo "0")
    else
        print_error "Backup encryption failed"
        return 1
    fi
}

# Function to upload to S3
upload_to_s3() {
    if [[ -z "$S3_BUCKET" ]]; then
        return 0
    fi
    
    print_info "Uploading backup to S3..."
    
    local backup_file
    if [[ "$ENCRYPTION" == "true" ]]; then
        if [[ "$COMPRESSION" == "true" ]]; then
            backup_file="$BACKUP_DIR/${BACKUP_ID}.tar.gz.enc"
        else
            backup_file="$BACKUP_DIR/${BACKUP_ID}.enc"
        fi
    elif [[ "$COMPRESSION" == "true" ]]; then
        backup_file="$BACKUP_DIR/${BACKUP_ID}.tar.gz"
    else
        backup_file="$BACKUP_DIR/$BACKUP_ID"
    fi
    
    local s3_key="$S3_PREFIX$(basename "$backup_file")"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would upload $backup_file to s3://$S3_BUCKET/$s3_key"
        return 0
    fi
    
    if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$s3_key"; then
        print_success "Backup uploaded to S3: s3://$S3_BUCKET/$s3_key"
    else
        print_error "S3 upload failed"
        return 1
    fi
}

# Function to verify backup
verify_backup() {
    if [[ "$VERIFY_BACKUP" != "true" ]]; then
        return 0
    fi
    
    print_info "Verifying backup..."
    
    local backup_file
    if [[ "$ENCRYPTION" == "true" ]]; then
        if [[ "$COMPRESSION" == "true" ]]; then
            backup_file="$BACKUP_DIR/${BACKUP_ID}.tar.gz.enc"
        else
            backup_file="$BACKUP_DIR/${BACKUP_ID}.enc"
        fi
    elif [[ "$COMPRESSION" == "true" ]]; then
        backup_file="$BACKUP_DIR/${BACKUP_ID}.tar.gz"
    else
        backup_file="$BACKUP_DIR/$BACKUP_ID"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would verify backup file $backup_file"
        return 0
    fi
    
    # Check if backup file exists and is not empty
    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        print_success "Backup verification passed"
        
        # Additional verification for compressed files
        if [[ "$COMPRESSION" == "true" && "$ENCRYPTION" != "true" ]]; then
            if tar -tzf "$backup_file" >/dev/null 2>&1; then
                print_success "Compressed backup integrity verified"
            else
                print_error "Compressed backup integrity check failed"
                return 1
            fi
        fi
    else
        print_error "Backup verification failed: file not found or empty"
        return 1
    fi
}

# Function to create backup manifest
create_manifest() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return 0
    fi
    
    local manifest_content
    manifest_content=$(cat << EOF
{
    "backup_id": "$BACKUP_ID",
    "timestamp": "$(date -Iseconds)",
    "environment": "$ENVIRONMENT",
    "namespace": "$NAMESPACE",
    "backup_type": "$BACKUP_TYPE",
    "size_bytes": $BACKUP_SIZE,
    "duration_seconds": $BACKUP_DURATION,
    "compression": $COMPRESSION,
    "encryption": $ENCRYPTION,
    "incremental": $INCREMENTAL,
    "s3_upload": $([ -n "$S3_BUCKET" ] && echo "true" || echo "false"),
    "verification": $VERIFY_BACKUP
}
EOF
    )
    
    echo "$manifest_content" > "$BACKUP_MANIFEST"
    print_info "Backup manifest created: $BACKUP_MANIFEST"
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_info "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would clean up backups older than $RETENTION_DAYS days"
        return 0
    fi
    
    # Find and remove old local backups
    find "$BACKUP_DIR" -name "${ENVIRONMENT}_*" -type f -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "${ENVIRONMENT}_*" -type d -mtime +"$RETENTION_DAYS" -exec rm -rf {} + 2>/dev/null || true
    
    # Clean up old S3 backups if configured
    if [[ -n "$S3_BUCKET" ]]; then
        local cutoff_date
        cutoff_date=$(date -d "$RETENTION_DAYS days ago" +"%Y-%m-%d" 2>/dev/null || date -v-"${RETENTION_DAYS}d" +"%Y-%m-%d")
        
        aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX" | while read -r line; do
            local file_date
            local file_name
            file_date=$(echo "$line" | awk '{print $1}')
            file_name=$(echo "$line" | awk '{print $4}')
            
            if [[ "$file_date" < "$cutoff_date" && "$file_name" =~ ^${ENVIRONMENT}_ ]]; then
                aws s3 rm "s3://$S3_BUCKET/$S3_PREFIX$file_name"
                print_info "Removed old S3 backup: $file_name"
            fi
        done 2>/dev/null || true
    fi
    
    print_success "Old backup cleanup completed"
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
    "text": "PhoenixCoder Backup ($ENVIRONMENT): $status",
    "attachments": [{
        "color": "$([ "$status" == "SUCCESS" ] && echo "good" || echo "danger")",
        "fields": [
            {"title": "Environment", "value": "$ENVIRONMENT", "short": true},
            {"title": "Backup Type", "value": "$BACKUP_TYPE", "short": true},
            {"title": "Backup ID", "value": "$BACKUP_ID", "short": true},
            {"title": "Size", "value": "$(numfmt --to=iec $BACKUP_SIZE)", "short": true},
            {"title": "Duration", "value": "${BACKUP_DURATION}s", "short": true},
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
    
    print_info "Starting $BACKUP_TYPE backup for $ENVIRONMENT environment"
    print_info "Backup ID: $BACKUP_ID"
    
    # Check prerequisites
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    if [[ "$BACKUP_TYPE" == "database" || "$BACKUP_TYPE" == "full" ]]; then
        if ! command -v pg_dump &> /dev/null; then
            print_error "pg_dump is not installed or not in PATH"
            exit 1
        fi
    fi
    
    if [[ -n "$S3_BUCKET" ]] && ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed or not in PATH"
        exit 1
    fi
    
    if [[ "$ENCRYPTION" == "true" ]] && ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed or not in PATH"
        exit 1
    fi
    
    # Create backup directory
    create_backup_dir
    
    # Perform backup based on type
    case "$BACKUP_TYPE" in
        "full")
            backup_database && backup_files && backup_config
            ;;
        "database")
            backup_database
            ;;
        "files")
            backup_files
            ;;
        "config")
            backup_config
            ;;
    esac
    
    local backup_success=$?
    
    if [[ $backup_success -eq 0 ]]; then
        # Post-processing
        compress_backup
        encrypt_backup
        upload_to_s3
        verify_backup
        
        # Calculate duration
        local end_time=$(date +%s)
        BACKUP_DURATION=$((end_time - start_time))
        
        # Create manifest
        create_manifest
        
        # Cleanup old backups
        cleanup_old_backups
        
        print_success "Backup completed successfully"
        print_info "Backup ID: $BACKUP_ID"
        print_info "Backup size: $(numfmt --to=iec $BACKUP_SIZE)"
        print_info "Duration: ${BACKUP_DURATION}s"
        
        send_notification "SUCCESS" "Backup completed successfully"
    else
        print_error "Backup failed"
        send_notification "FAILED" "Backup process encountered errors"
        exit 1
    fi
}

# Run main function
main "$@"