#!/bin/bash

# 数据库连接安全配置脚本
# 用于加强PostgreSQL和Redis连接安全配置

set -e

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

# 加载环境变量
load_env() {
    if [[ -f ".env.security.local" ]]; then
        source .env.security.local
        log_info "已加载安全配置文件"
    else
        log_error "未找到.env.security.local文件，请先运行generate-passwords.sh"
        exit 1
    fi
}

# 创建PostgreSQL安全配置
create_postgres_config() {
    log_info "创建PostgreSQL安全配置..."
    
    mkdir -p security/database-configs
    
    # PostgreSQL安全配置文件
    cat > security/database-configs/postgresql.conf.secure << 'EOF'
# PostgreSQL安全配置
# 基于postgresql.conf的安全加固设置

# 连接和认证设置
listen_addresses = 'localhost'          # 只监听本地连接
port = 5432                             # 默认端口
max_connections = 100                   # 限制最大连接数
superuser_reserved_connections = 3      # 为超级用户保留连接

# SSL设置
ssl = on                                # 启用SSL
ssl_cert_file = 'server.crt'          # SSL证书文件
ssl_key_file = 'server.key'           # SSL私钥文件
ssl_ca_file = 'ca.crt'                 # CA证书文件
ssl_crl_file = ''                      # 证书撤销列表
ssl_prefer_server_ciphers = on         # 优先使用服务器密码套件
ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL' # 安全密码套件
ssl_ecdh_curve = 'prime256v1'          # ECDH曲线

# 认证设置
password_encryption = scram-sha-256     # 使用SCRAM-SHA-256加密
db_user_namespace = off                 # 禁用用户命名空间

# 日志设置
logging_collector = on                  # 启用日志收集
log_destination = 'stderr'              # 日志输出到stderr
log_directory = 'log'                   # 日志目录
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log' # 日志文件名格式
log_file_mode = 0600                    # 日志文件权限
log_truncate_on_rotation = on           # 轮转时截断日志
log_rotation_age = 1d                   # 日志轮转周期
log_rotation_size = 10MB                # 日志轮转大小

# 审计日志
log_connections = on                    # 记录连接
log_disconnections = on                 # 记录断开连接
log_checkpoints = on                    # 记录检查点
log_lock_waits = on                     # 记录锁等待
log_statement = 'mod'                   # 记录修改语句
log_min_duration_statement = 1000       # 记录慢查询(1秒)

# 安全设置
shared_preload_libraries = 'pg_stat_statements' # 预加载统计模块
track_activities = on                   # 跟踪活动
track_counts = on                       # 跟踪计数
track_io_timing = on                    # 跟踪IO时间
track_functions = all                   # 跟踪函数

# 内存和性能设置
shared_buffers = 256MB                  # 共享缓冲区
effective_cache_size = 1GB              # 有效缓存大小
work_mem = 4MB                          # 工作内存
maintenance_work_mem = 64MB             # 维护工作内存
wal_buffers = 16MB                      # WAL缓冲区

# WAL设置
wal_level = replica                     # WAL级别
max_wal_senders = 3                     # 最大WAL发送者
wal_keep_segments = 32                  # 保留WAL段数
archive_mode = on                       # 启用归档模式
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'

# 检查点设置
checkpoint_completion_target = 0.9      # 检查点完成目标
checkpoint_timeout = 5min               # 检查点超时
max_wal_size = 1GB                      # 最大WAL大小
min_wal_size = 80MB                     # 最小WAL大小
EOF

    # pg_hba.conf安全配置
    cat > security/database-configs/pg_hba.conf.secure << 'EOF'
# PostgreSQL客户端认证配置文件
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# 本地连接
local   all             postgres                                peer
local   all             all                                     scram-sha-256

# IPv4本地连接
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# 应用程序连接（需要SSL）
hostssl phoenixcoder    phoenixcoder_user 10.0.0.0/8           scram-sha-256
hostssl phoenixcoder    phoenixcoder_user 172.16.0.0/12        scram-sha-256
hostssl phoenixcoder    phoenixcoder_user 192.168.0.0/16       scram-sha-256

# 拒绝所有其他连接
host    all             all             0.0.0.0/0               reject
host    all             all             ::/0                    reject
EOF

    log_success "PostgreSQL安全配置文件已创建"
}

# 创建Redis安全配置
create_redis_config() {
    log_info "创建Redis安全配置..."
    
    cat > security/database-configs/redis.conf.secure << 'EOF'
# Redis安全配置
# 基于redis.conf的安全加固设置

# 网络设置
bind 127.0.0.1                         # 只绑定本地地址
port 6379                               # 默认端口
tcp-backlog 511                         # TCP监听队列长度
tcp-keepalive 300                       # TCP keepalive时间

# 安全设置
protected-mode yes                      # 启用保护模式
requirepass ${REDIS_PASSWORD}           # 设置密码
rename-command FLUSHDB ""               # 禁用危险命令
rename-command FLUSHALL ""              # 禁用危险命令
rename-command KEYS ""                  # 禁用危险命令
rename-command CONFIG "CONFIG_b840fc02d524045429941cc15f59e41cb7be6c52"
rename-command SHUTDOWN "SHUTDOWN_b840fc02d524045429941cc15f59e41cb7be6c52"
rename-command DEBUG ""                 # 禁用调试命令
rename-command EVAL ""                  # 禁用EVAL命令
rename-command SCRIPT ""                # 禁用SCRIPT命令

# 持久化设置
save 900 1                              # 900秒内至少1个key变化时保存
save 300 10                             # 300秒内至少10个key变化时保存
save 60 10000                           # 60秒内至少10000个key变化时保存
stop-writes-on-bgsave-error yes         # 后台保存出错时停止写入
rdbcompression yes                      # 启用RDB压缩
rdbchecksum yes                         # 启用RDB校验和
dbfilename dump.rdb                     # RDB文件名
dir ./                                  # 数据目录

# 日志设置
loglevel notice                         # 日志级别
logfile "/var/log/redis/redis-server.log" # 日志文件
syslog-enabled yes                      # 启用系统日志
syslog-ident redis                      # 系统日志标识

# 客户端设置
timeout 300                             # 客户端空闲超时时间
tcp-keepalive 300                       # TCP keepalive时间
maxclients 10000                        # 最大客户端连接数

# 内存设置
maxmemory 256mb                         # 最大内存使用
maxmemory-policy allkeys-lru            # 内存淘汰策略

# 慢查询日志
slowlog-log-slower-than 10000           # 慢查询阈值(微秒)
slowlog-max-len 128                     # 慢查询日志最大长度
EOF

    log_success "Redis安全配置文件已创建"
}

# 应用数据库安全配置
apply_database_security() {
    log_info "应用数据库安全配置..."
    
    # 创建配置目录
    mkdir -p security/database-configs
    
    # 创建PostgreSQL配置
    create_postgres_config
    
    # 创建Redis配置
    create_redis_config
    
    log_success "数据库安全配置已完成"
    log_info "配置文件位置："
    log_info "  - PostgreSQL: security/database-configs/postgresql.conf.secure"
    log_info "  - PostgreSQL HBA: security/database-configs/pg_hba.conf.secure"
    log_info "  - Redis: security/database-configs/redis.conf.secure"
    log_warning "请手动将这些配置文件应用到相应的数据库服务器"
}

# 验证数据库连接安全
verify_database_security() {
    log_info "验证数据库连接安全..."
    
    # 检查配置文件是否存在
    if [[ -f "security/database-configs/postgresql.conf.secure" ]]; then
        log_success "PostgreSQL安全配置文件存在"
    else
        log_error "PostgreSQL安全配置文件不存在"
        return 1
    fi
    
    if [[ -f "security/database-configs/redis.conf.secure" ]]; then
        log_success "Redis安全配置文件存在"
    else
        log_error "Redis安全配置文件不存在"
        return 1
    fi
    
    # 检查环境变量
    if [[ -n "$POSTGRES_PASSWORD" ]]; then
        log_success "PostgreSQL密码已配置"
    else
        log_warning "PostgreSQL密码未配置"
    fi
    
    if [[ -n "$REDIS_PASSWORD" ]]; then
        log_success "Redis密码已配置"
    else
        log_warning "Redis密码未配置"
    fi
    
    log_success "数据库安全验证完成"
}

# 生成安全报告
generate_security_report() {
    log_info "生成数据库安全报告..."
    
    local report_file="security/database-security-report.md"
    
    cat > "$report_file" << EOF
# 数据库安全配置报告

生成时间: $(date '+%Y-%m-%d %H:%M:%S')

## PostgreSQL 安全配置

### 连接安全
- ✅ 仅监听本地连接 (localhost)
- ✅ 启用SSL加密连接
- ✅ 使用SCRAM-SHA-256密码加密
- ✅ 限制最大连接数

### 认证安全
- ✅ 配置pg_hba.conf限制访问
- ✅ 要求SSL连接用于应用程序
- ✅ 拒绝未授权的连接

### 审计日志
- ✅ 启用连接/断开连接日志
- ✅ 记录慢查询(>1秒)
- ✅ 记录数据修改操作

## Redis 安全配置

### 网络安全
- ✅ 仅绑定本地地址
- ✅ 启用保护模式
- ✅ 设置访问密码

### 命令安全
- ✅ 禁用危险命令 (FLUSHDB, FLUSHALL, KEYS等)
- ✅ 重命名管理命令
- ✅ 禁用调试和脚本命令

### 持久化安全
- ✅ 配置安全的数据保存策略
- ✅ 启用RDB压缩和校验
- ✅ 配置慢查询日志

## 安全建议

1. 定期更新数据库密码
2. 监控数据库访问日志
3. 定期备份数据库配置
4. 使用防火墙限制数据库端口访问
5. 定期检查数据库安全补丁

## 配置文件位置

- PostgreSQL配置: $(realpath security/database-configs/postgresql.conf.secure 2>/dev/null || echo "security/database-configs/postgresql.conf.secure")
- PostgreSQL认证: $(realpath security/database-configs/pg_hba.conf.secure 2>/dev/null || echo "security/database-configs/pg_hba.conf.secure")
- Redis配置: $(realpath security/database-configs/redis.conf.secure 2>/dev/null || echo "security/database-configs/redis.conf.secure")
EOF

    log_success "数据库安全报告已生成: $report_file"
}

# 显示帮助信息
show_help() {
    echo "数据库连接安全配置脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  setup     创建并应用数据库安全配置 (与apply相同)"
    echo "  apply     应用数据库安全配置"
    echo "  verify    验证数据库安全配置"
    echo "  report    生成数据库安全报告"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 setup          # 创建并应用所有数据库安全配置"
    echo "  $0 apply          # 应用所有数据库安全配置"
    echo "  $0 verify         # 验证数据库安全配置"
    echo "  $0 report         # 生成安全报告"
    echo ""
}

# 主函数
main() {
    case "${1:-apply}" in
        "setup"|"apply")
            load_env
            apply_database_security
            ;;
        "verify")
            load_env
            verify_database_security
            ;;
        "report")
            load_env
            generate_security_report
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 脚本入口点
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi