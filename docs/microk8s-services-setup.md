# MicroK8s基础服务外部访问配置指南

本文档详细说明如何配置MicroK8s中的PostgreSQL和Redis基础服务，使其可以被本地开发环境访问。

## 概述

- **服务器**: 192.168.3.30
- **用户**: edward
- **访问方式**: SSH证书认证
- **防火墙**: UFW
- **容器编排**: MicroK8s
- **命名空间**: default

## 架构说明

```
本地开发环境 ──→ 192.168.3.30:30432 ──→ MicroK8s NodePort ──→ PostgreSQL Pod
                ├─ 192.168.3.30:30379 ──→ MicroK8s NodePort ──→ Redis Pod
```

### 服务映射

| 服务 | 内部端口 | NodePort | 外部访问地址 |
|------|----------|----------|-------------|
| PostgreSQL | 5432 | 30432 | 192.168.3.30:30432 |
| Redis | 6379 | 30379 | 192.168.3.30:30379 |
| RabbitMQ | 5672 | 30672 | 192.168.3.30:30672 |
| RabbitMQ管理界面 | 15672 | 31672 | 192.168.3.30:31672 |

## 快速开始

### 1. 执行自动配置脚本

```bash
# 在本地项目目录下执行
./scripts/server-setup.sh
```

### 2. 手动配置防火墙（如果自动配置失败）

在服务器上执行：

```bash
ssh edward@192.168.3.30
sudo ufw allow 30432/tcp comment "PostgreSQL NodePort for development"
sudo ufw allow 30379/tcp comment "Redis NodePort for development"
sudo ufw status
```

### 3. 验证服务连通性

```bash
# 在本地项目目录下执行
./scripts/check-services.sh
```

## 详细配置步骤

### 步骤1: 检查现有服务

```bash
# SSH到服务器
ssh edward@192.168.3.30

# 检查MicroK8s状态
microk8s status --wait-ready

# 查看现有服务
microk8s kubectl get pods,services -n default
```

预期输出应包含：
- `pod/postgresql-0` (Running状态)
- `pod/redis-master-0` (Running状态)
- `service/postgresql` (ClusterIP类型)
- `service/redis-master` (ClusterIP类型)

### 步骤2: 创建NodePort服务

#### PostgreSQL NodePort服务

```bash
cat <<EOF | microk8s kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: postgresql-nodeport
  namespace: default
  labels:
    app: postgresql-external
spec:
  type: NodePort
  ports:
  - port: 5432
    targetPort: 5432
    nodePort: 30432
    protocol: TCP
    name: postgresql
  selector:
    app.kubernetes.io/component: primary
    app.kubernetes.io/instance: postgresql
    app.kubernetes.io/name: postgresql
EOF
```

#### Redis NodePort服务

```bash
cat <<EOF | microk8s kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: redis-nodeport
  namespace: default
  labels:
    app: redis-external
spec:
  type: NodePort
  ports:
  - port: 6379
    targetPort: 6379
    nodePort: 30379
    protocol: TCP
    name: redis
  selector:
    app.kubernetes.io/component: master
    app.kubernetes.io/instance: redis
    app.kubernetes.io/name: redis
EOF
```

### 步骤3: 配置防火墙规则

```bash
# 允许PostgreSQL NodePort
sudo ufw allow 30432/tcp comment "PostgreSQL NodePort for development"

# 允许Redis NodePort
sudo ufw allow 30379/tcp comment "Redis NodePort for development"

# 查看防火墙状态
sudo ufw status numbered
```

### 步骤4: 验证配置

```bash
# 检查NodePort服务
microk8s kubectl get services -n default | grep nodeport

# 检查端口监听
ss -tlnp | grep -E ":(30432|30379)"

# 从本地测试连通性
ping 192.168.3.30
nc -zv 192.168.3.30 30432
nc -zv 192.168.3.30 30379
```

## 本地开发环境配置

### 更新环境变量

编辑项目根目录的 `.env.community` 文件：

```bash
# 数据库配置
DB_HOST=192.168.3.30
DB_PORT=30432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=192.168.3.30
REDIS_PORT=30379
REDIS_PASSWORD=your_redis_password

# RabbitMQ配置
RABBITMQ_HOST=192.168.3.30
RABBITMQ_PORT=30672
RABBITMQ_USER=myuser
RABBITMQ_PASSWORD=8dsagfsa
RABBITMQ_MANAGEMENT_PORT=31672
```

### 安装客户端工具

#### macOS
```bash
# PostgreSQL客户端
brew install postgresql

# Redis客户端
brew install redis
```

#### Ubuntu/Debian
```bash
# PostgreSQL客户端
sudo apt-get install postgresql-client

# Redis客户端
sudo apt-get install redis-tools
```

### 测试连接

```bash
# 测试PostgreSQL连接
psql -h 192.168.3.30 -p 30432 -U your_username -d your_database

# 测试Redis连接
redis-cli -h 192.168.3.30 -p 30379
```

## 故障排除

### 常见问题

#### 1. 连接被拒绝 (Connection refused)

**可能原因**:
- NodePort服务未创建
- 防火墙规则未配置
- MicroK8s服务未运行

**解决方案**:
```bash
# 检查NodePort服务
ssh edward@192.168.3.30 'microk8s kubectl get services -n default | grep nodeport'

# 检查防火墙
ssh edward@192.168.3.30 'sudo ufw status'

# 检查Pod状态
ssh edward@192.168.3.30 'microk8s kubectl get pods -n default'
```

#### 2. 网络不通 (Network unreachable)

**可能原因**:
- 服务器网络问题
- 路由配置问题

**解决方案**:
```bash
# 测试基本网络连通性
ping 192.168.3.30

# 检查路由
traceroute 192.168.3.30
```

#### 3. 认证失败 (Authentication failed)

**可能原因**:
- 数据库用户名/密码错误
- Redis密码错误

**解决方案**:
```bash
# 检查PostgreSQL用户
ssh edward@192.168.3.30 'microk8s kubectl exec -it postgresql-0 -n default -- psql -U postgres -c "\du"'

# 检查Redis配置
ssh edward@192.168.3.30 'microk8s kubectl exec -it redis-master-0 -n default -- redis-cli config get requirepass'
```

#### 4. 端口已被占用

**可能原因**:
- NodePort端口冲突

**解决方案**:
```bash
# 检查端口使用情况
ssh edward@192.168.3.30 'ss -tlnp | grep -E ":(30432|30379)"'

# 修改NodePort端口（如果需要）
microk8s kubectl patch service postgresql-nodeport -n default -p '{"spec":{"ports":[{"port":5432,"targetPort":5432,"nodePort":30433}]}}'
```

### 诊断命令

```bash
# 完整的服务状态检查
ssh edward@192.168.3.30 '
  echo "=== MicroK8s状态 ==="
  microk8s status
  echo
  echo "=== Pod状态 ==="
  microk8s kubectl get pods -n default -o wide
  echo
  echo "=== 服务状态 ==="
  microk8s kubectl get services -n default
  echo
  echo "=== NodePort服务详情 ==="
  microk8s kubectl describe service postgresql-nodeport redis-nodeport -n default
  echo
  echo "=== 防火墙状态 ==="
  sudo ufw status numbered
  echo
  echo "=== 端口监听 ==="
  ss -tlnp | grep -E ":(30432|30379)"
'
```

### 重置配置

如果需要重新配置，可以删除NodePort服务：

```bash
ssh edward@192.168.3.30 '
  microk8s kubectl delete service postgresql-nodeport redis-nodeport -n default
  sudo ufw delete allow 30432/tcp
  sudo ufw delete allow 30379/tcp
'
```

然后重新运行配置脚本。

## 安全注意事项

1. **网络访问控制**: 当前配置允许任何IP访问NodePort端口，生产环境应限制访问源IP
2. **认证**: 确保数据库和Redis使用强密码
3. **加密**: 考虑使用SSL/TLS加密数据传输
4. **防火墙**: 定期审查UFW规则，移除不必要的开放端口

## 监控和维护

### 定期检查

```bash
# 每日检查脚本
#!/bin/bash
echo "$(date): 检查基础服务状态"
./scripts/check-services.sh
echo "---"
```

### 日志查看

```bash
# PostgreSQL日志
ssh edward@192.168.3.30 'microk8s kubectl logs postgresql-0 -n default'

# Redis日志
ssh edward@192.168.3.30 'microk8s kubectl logs redis-master-0 -n default'
```

## 相关文件

- `scripts/server-setup.sh` - 自动配置脚本
- `scripts/check-services.sh` - 服务检查脚本
- `.env.community` - 本地开发环境配置
- `docs/README.md` - 项目主文档

## 联系支持

如果遇到问题，请：
1. 运行诊断命令收集信息
2. 检查相关日志
3. 参考故障排除部分
4. 联系系统管理员