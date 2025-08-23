#!/bin/bash

# 最小权限原则配置脚本
# 用于实施RBAC和服务账户权限控制

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

# 检查kubectl是否可用
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl未安装，请先安装kubectl"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "无法连接到Kubernetes集群"
        exit 1
    fi
    
    log_success "Kubernetes集群连接正常"
}

# 创建命名空间
create_namespaces() {
    log_info "创建应用命名空间..."
    
    local namespaces=("phoenixcoder-prod" "phoenixcoder-dev" "phoenixcoder-staging")
    
    for ns in "${namespaces[@]}"; do
        if kubectl get namespace "$ns" &> /dev/null; then
            log_info "命名空间 $ns 已存在"
        else
            kubectl create namespace "$ns"
            log_success "已创建命名空间: $ns"
        fi
        
        # 添加标签
        kubectl label namespace "$ns" app=phoenixcoder --overwrite
        kubectl label namespace "$ns" environment="${ns##*-}" --overwrite
    done
}

# 创建服务账户
create_service_accounts() {
    log_info "创建服务账户..."
    
    mkdir -p k8s/rbac
    
    # API服务账户
    cat > k8s/rbac/api-service-account.yaml << 'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: phoenixcoder-api
  namespace: phoenixcoder-prod
  labels:
    app: phoenixcoder
    component: api
automountServiceAccountToken: false
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: phoenixcoder-api
  namespace: phoenixcoder-dev
  labels:
    app: phoenixcoder
    component: api
automountServiceAccountToken: false
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: phoenixcoder-api
  namespace: phoenixcoder-staging
  labels:
    app: phoenixcoder
    component: api
automountServiceAccountToken: false
EOF

    # OIDC服务账户
    cat > k8s/rbac/oidc-service-account.yaml << 'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: phoenixcoder-oidc
  namespace: phoenixcoder-prod
  labels:
    app: phoenixcoder
    component: oidc
automountServiceAccountToken: false
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: phoenixcoder-oidc
  namespace: phoenixcoder-dev
  labels:
    app: phoenixcoder
    component: oidc
automountServiceAccountToken: false
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: phoenixcoder-oidc
  namespace: phoenixcoder-staging
  labels:
    app: phoenixcoder
    component: oidc
automountServiceAccountToken: false
EOF

    # 管理界面服务账户
    cat > k8s/rbac/admin-service-account.yaml << 'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: phoenixcoder-admin
  namespace: phoenixcoder-prod
  labels:
    app: phoenixcoder
    component: admin
automountServiceAccountToken: false
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: phoenixcoder-admin
  namespace: phoenixcoder-dev
  labels:
    app: phoenixcoder
    component: admin
automountServiceAccountToken: false
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: phoenixcoder-admin
  namespace: phoenixcoder-staging
  labels:
    app: phoenixcoder
    component: admin
automountServiceAccountToken: false
EOF

    log_success "服务账户配置文件已创建"
}

# 创建RBAC角色
create_rbac_roles() {
    log_info "创建RBAC角色..."
    
    # API服务角色
    cat > k8s/rbac/api-role.yaml << 'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: phoenixcoder-prod
  name: phoenixcoder-api-role
  labels:
    app: phoenixcoder
    component: api
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: phoenixcoder-dev
  name: phoenixcoder-api-role
  labels:
    app: phoenixcoder
    component: api
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: phoenixcoder-staging
  name: phoenixcoder-api-role
  labels:
    app: phoenixcoder
    component: api
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list"]
EOF

    # OIDC服务角色
    cat > k8s/rbac/oidc-role.yaml << 'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: phoenixcoder-prod
  name: phoenixcoder-oidc-role
  labels:
    app: phoenixcoder
    component: oidc
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: phoenixcoder-dev
  name: phoenixcoder-oidc-role
  labels:
    app: phoenixcoder
    component: oidc
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: phoenixcoder-staging
  name: phoenixcoder-oidc-role
  labels:
    app: phoenixcoder
    component: oidc
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
EOF

    # 管理界面角色（只读）
    cat > k8s/rbac/admin-role.yaml << 'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: phoenixcoder-prod
  name: phoenixcoder-admin-role
  labels:
    app: phoenixcoder
    component: admin
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: phoenixcoder-dev
  name: phoenixcoder-admin-role
  labels:
    app: phoenixcoder
    component: admin
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: phoenixcoder-staging
  name: phoenixcoder-admin-role
  labels:
    app: phoenixcoder
    component: admin
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
EOF

    log_success "RBAC角色配置文件已创建"
}

# 创建角色绑定
create_role_bindings() {
    log_info "创建角色绑定..."
    
    # API服务角色绑定
    cat > k8s/rbac/api-rolebinding.yaml << 'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: phoenixcoder-api-binding
  namespace: phoenixcoder-prod
  labels:
    app: phoenixcoder
    component: api
subjects:
- kind: ServiceAccount
  name: phoenixcoder-api
  namespace: phoenixcoder-prod
roleRef:
  kind: Role
  name: phoenixcoder-api-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: phoenixcoder-api-binding
  namespace: phoenixcoder-dev
  labels:
    app: phoenixcoder
    component: api
subjects:
- kind: ServiceAccount
  name: phoenixcoder-api
  namespace: phoenixcoder-dev
roleRef:
  kind: Role
  name: phoenixcoder-api-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: phoenixcoder-api-binding
  namespace: phoenixcoder-staging
  labels:
    app: phoenixcoder
    component: api
subjects:
- kind: ServiceAccount
  name: phoenixcoder-api
  namespace: phoenixcoder-staging
roleRef:
  kind: Role
  name: phoenixcoder-api-role
  apiGroup: rbac.authorization.k8s.io
EOF

    # OIDC服务角色绑定
    cat > k8s/rbac/oidc-rolebinding.yaml << 'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: phoenixcoder-oidc-binding
  namespace: phoenixcoder-prod
  labels:
    app: phoenixcoder
    component: oidc
subjects:
- kind: ServiceAccount
  name: phoenixcoder-oidc
  namespace: phoenixcoder-prod
roleRef:
  kind: Role
  name: phoenixcoder-oidc-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: phoenixcoder-oidc-binding
  namespace: phoenixcoder-dev
  labels:
    app: phoenixcoder
    component: oidc
subjects:
- kind: ServiceAccount
  name: phoenixcoder-oidc
  namespace: phoenixcoder-dev
roleRef:
  kind: Role
  name: phoenixcoder-oidc-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: phoenixcoder-oidc-binding
  namespace: phoenixcoder-staging
  labels:
    app: phoenixcoder
    component: oidc
subjects:
- kind: ServiceAccount
  name: phoenixcoder-oidc
  namespace: phoenixcoder-staging
roleRef:
  kind: Role
  name: phoenixcoder-oidc-role
  apiGroup: rbac.authorization.k8s.io
EOF

    # 管理界面角色绑定
    cat > k8s/rbac/admin-rolebinding.yaml << 'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: phoenixcoder-admin-binding
  namespace: phoenixcoder-prod
  labels:
    app: phoenixcoder
    component: admin
subjects:
- kind: ServiceAccount
  name: phoenixcoder-admin
  namespace: phoenixcoder-prod
roleRef:
  kind: Role
  name: phoenixcoder-admin-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: phoenixcoder-admin-binding
  namespace: phoenixcoder-dev
  labels:
    app: phoenixcoder
    component: admin
subjects:
- kind: ServiceAccount
  name: phoenixcoder-admin
  namespace: phoenixcoder-dev
roleRef:
  kind: Role
  name: phoenixcoder-admin-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: phoenixcoder-admin-binding
  namespace: phoenixcoder-staging
  labels:
    app: phoenixcoder
    component: admin
subjects:
- kind: ServiceAccount
  name: phoenixcoder-admin
  namespace: phoenixcoder-staging
roleRef:
  kind: Role
  name: phoenixcoder-admin-role
  apiGroup: rbac.authorization.k8s.io
EOF

    log_success "角色绑定配置文件已创建"
}

# 创建网络策略
create_network_policies() {
    log_info "创建网络策略..."
    
    mkdir -p k8s/network-policies
    
    # 默认拒绝所有入站流量
    cat > k8s/network-policies/default-deny.yaml << 'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: phoenixcoder-prod
  labels:
    app: phoenixcoder
spec:
  podSelector: {}
  policyTypes:
  - Ingress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: phoenixcoder-dev
  labels:
    app: phoenixcoder
spec:
  podSelector: {}
  policyTypes:
  - Ingress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: phoenixcoder-staging
  labels:
    app: phoenixcoder
spec:
  podSelector: {}
  policyTypes:
  - Ingress
EOF

    # 允许API服务访问数据库
    cat > k8s/network-policies/api-to-db.yaml << 'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-to-database
  namespace: phoenixcoder-prod
  labels:
    app: phoenixcoder
spec:
  podSelector:
    matchLabels:
      app: phoenixcoder
      component: api
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
EOF

    # 允许前端访问API
    cat > k8s/network-policies/frontend-to-api.yaml << 'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-to-api
  namespace: phoenixcoder-prod
  labels:
    app: phoenixcoder
spec:
  podSelector:
    matchLabels:
      app: phoenixcoder
      component: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: phoenixcoder
          component: admin
    - podSelector:
        matchLabels:
          app: phoenixcoder
          component: miniapp
    ports:
    - protocol: TCP
      port: 8000
EOF

    log_success "网络策略配置文件已创建"
}

# 创建Pod安全策略
create_pod_security_policies() {
    log_info "创建Pod安全策略..."
    
    mkdir -p k8s/security-policies
    
    cat > k8s/security-policies/pod-security-policy.yaml << 'EOF'
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: phoenixcoder-psp
  labels:
    app: phoenixcoder
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  supplementalGroups:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  readOnlyRootFilesystem: false
  seLinux:
    rule: 'RunAsAny'
EOF

    log_success "Pod安全策略配置文件已创建"
}

# 更新部署文件以使用服务账户
update_deployments() {
    log_info "更新部署文件以使用服务账户..."
    
    # 检查现有部署文件
    local deployment_files=($(find k8s/deployments -name "*.yaml" 2>/dev/null || true))
    
    for file in "${deployment_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_info "检查部署文件: $file"
            
            # 备份原文件
            cp "$file" "${file}.backup"
            
            # 检查是否已有serviceAccountName配置
            if grep -q "serviceAccountName:" "$file"; then
                log_info "$file 已配置服务账户"
            else
                log_warning "$file 需要手动添加服务账户配置"
                echo "请在 spec.template.spec 下添加:" 
                echo "  serviceAccountName: phoenixcoder-<component>"
                echo "  automountServiceAccountToken: false"
            fi
        fi
    done
}

# 应用RBAC配置
apply_rbac_config() {
    log_info "应用RBAC配置到Kubernetes集群..."
    
    # 创建命名空间
    create_namespaces
    
    # 应用服务账户
    kubectl apply -f k8s/rbac/
    
    # 应用网络策略
    kubectl apply -f k8s/network-policies/
    
    # 应用安全策略
    kubectl apply -f k8s/security-policies/
    
    log_success "RBAC配置已应用到集群"
}

# 验证权限配置
verify_permissions() {
    log_info "验证权限配置..."
    
    local namespaces=("phoenixcoder-prod" "phoenixcoder-dev" "phoenixcoder-staging")
    
    for ns in "${namespaces[@]}"; do
        log_info "检查命名空间 $ns 的权限配置..."
        
        # 检查服务账户
        kubectl get serviceaccounts -n "$ns" | grep phoenixcoder || true
        
        # 检查角色
        kubectl get roles -n "$ns" | grep phoenixcoder || true
        
        # 检查角色绑定
        kubectl get rolebindings -n "$ns" | grep phoenixcoder || true
        
        # 检查网络策略
        kubectl get networkpolicies -n "$ns" | grep -E "(default-deny|phoenixcoder)" || true
    done
    
    log_success "权限配置验证完成"
}

# 生成权限审计报告
generate_audit_report() {
    log_info "生成权限审计报告..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="security/audit-reports/rbac-audit_${timestamp}.md"
    
    mkdir -p security/audit-reports
    
    cat > "$report_file" << EOF
# RBAC权限审计报告

生成时间: $(date)

## 集群信息

\`\`\`
$(kubectl cluster-info 2>/dev/null || echo "无法获取集群信息")
\`\`\`

## 命名空间列表

\`\`\`
$(kubectl get namespaces | grep phoenixcoder || echo "未找到phoenixcoder命名空间")
\`\`\`

## 服务账户

\`\`\`
$(kubectl get serviceaccounts --all-namespaces | grep phoenixcoder || echo "未找到phoenixcoder服务账户")
\`\`\`

## 角色和角色绑定

\`\`\`
$(kubectl get roles,rolebindings --all-namespaces | grep phoenixcoder || echo "未找到phoenixcoder角色")
\`\`\`

## 网络策略

\`\`\`
$(kubectl get networkpolicies --all-namespaces | grep -E "(phoenixcoder|default-deny)" || echo "未找到网络策略")
\`\`\`

## 安全建议

1. 定期审查和更新RBAC权限
2. 监控服务账户的使用情况
3. 实施网络分段和隔离
4. 启用审计日志记录
5. 定期进行权限渗透测试

## 后续行动

- [ ] 审查过度权限
- [ ] 实施权限监控
- [ ] 配置审计日志
- [ ] 进行安全测试
EOF
    
    log_success "权限审计报告已生成: $report_file"
}

# 显示帮助信息
show_help() {
    echo "最小权限原则配置脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  create-config    - 创建RBAC配置文件"
    echo "  apply-config     - 应用配置到Kubernetes集群"
    echo "  verify           - 验证权限配置"
    echo "  audit            - 生成权限审计报告"
    echo "  setup            - 完整设置最小权限配置"
    echo "  help             - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 setup            # 完整设置最小权限配置"
    echo "  $0 create-config    # 只创建配置文件"
    echo "  $0 verify           # 验证当前权限配置"
}

# 主函数
main() {
    local action="${1:-help}"
    
    case "$action" in
        "create-config")
            create_service_accounts
            create_rbac_roles
            create_role_bindings
            create_network_policies
            create_pod_security_policies
            update_deployments
            log_success "RBAC配置文件创建完成！"
            ;;
        "apply-config")
            check_kubectl
            apply_rbac_config
            ;;
        "verify")
            check_kubectl
            verify_permissions
            ;;
        "audit")
            check_kubectl
            generate_audit_report
            ;;
        "setup")
            create_service_accounts
            create_rbac_roles
            create_role_bindings
            create_network_policies
            create_pod_security_policies
            update_deployments
            check_kubectl
            apply_rbac_config
            verify_permissions
            generate_audit_report
            log_success "最小权限原则配置完成！"
            ;;
        "help")
            show_help
            ;;
        *)
            log_error "未知选项: $action"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"