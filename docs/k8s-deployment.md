# PhoenixCoder Kubernetes 部署指南

本文档介绍如何在 MicroK8s 环境中部署 PhoenixCoder 项目。

## 前置条件

### 服务器环境
- Linux 服务器（已配置：`ssh edward@192.168.3.30`）
- MicroK8s 已安装并运行
- 已安装的基础服务：PostgreSQL、Redis（通过 Helm 部署）

### 本地环境
- Docker
- SSH 客户端
- 项目源代码

## 快速开始

### 1. 初始化 MicroK8s 环境

首次部署前，需要初始化 MicroK8s 环境：

```bash
./k8s-deploy.sh setup
```

这将自动完成以下配置：
- **防火墙配置**: 自动配置 UFW 防火墙规则，开放必要端口
- **DNS 解析**: 启用 MicroK8s DNS 插件
- **容器镜像仓库**: 启用内置 Registry
- **存储支持**: 启用存储插件

### 2. 完整部署流程

执行完整的构建、推送和部署流程：

```bash
./k8s-deploy.sh full-deploy
```

或者使用 start.sh 脚本：

```bash
./start.sh start --k8s
```

### 3. 访问应用

部署完成后，可以通过以下地址访问：

- **管理端**: http://192.168.3.30:3000
- **API 服务**: http://192.168.3.30:8001
- **OIDC 服务**: http://192.168.3.30:8000

## 详细操作指南

### 构建和推送镜像

#### 构建所有镜像
```bash
./k8s-deploy.sh build
```

#### 构建特定服务镜像
```bash
./k8s-deploy.sh build -s server
./k8s-deploy.sh build -s oidc-server
./k8s-deploy.sh build -s admin
```

#### 推送镜像到 MicroK8s Registry
```bash
./k8s-deploy.sh push
```

### 部署管理

#### 部署到 Kubernetes
```bash
./k8s-deploy.sh deploy
```

#### 删除部署
```bash
./k8s-deploy.sh undeploy
```

#### 重启服务
```bash
# 重启所有服务
./k8s-deploy.sh restart

# 重启特定服务
./k8s-deploy.sh restart -s server
```

### 监控和调试

#### 查看服务状态
```bash
./k8s-deploy.sh status
```

#### 查看服务日志
```bash
# 查看特定服务日志
./k8s-deploy.sh logs -s server
./k8s-deploy.sh logs -s oidc-server
./k8s-deploy.sh logs -s admin
```

#### SSH 连接到服务器
```bash
./k8s-deploy.sh connect
```

## 使用 start.sh 脚本

项目的 `start.sh` 脚本已经集成了 Kubernetes 部署支持：

### 启动服务
```bash
# 使用 Kubernetes 部署
./start.sh start --k8s

# 部署特定服务
./start.sh start --k8s -s server
```

### 停止服务
```bash
./start.sh stop --k8s
```

### 重启服务
```bash
./start.sh restart --k8s
```

### 查看日志
```bash
./start.sh logs --k8s -s server
```

### 查看状态
```bash
./start.sh status --k8s
```

## 配置说明

### Kubernetes 配置文件结构

```
k8s/
├── namespace.yaml              # 命名空间定义
├── configmaps/
│   └── app-config.yaml        # 应用配置和密钥
├── deployments/
│   ├── oidc-server.yaml       # OIDC 服务部署
│   ├── server.yaml            # 主服务部署
│   └── admin.yaml             # 管理端部署
└── services/
    └── services.yaml          # 服务定义
```

### 环境变量配置

主要的环境变量在 `k8s/configmaps/app-config.yaml` 中定义：

- **数据库配置**: PostgreSQL 连接信息
- **缓存配置**: Redis 连接信息
- **OIDC 配置**: 认证服务配置
- **JWT 配置**: 令牌签名密钥
- **应用配置**: 前端 API 地址等

### 服务端口映射

| 服务 | 内部端口 | NodePort | 描述 |
|------|----------|----------|------|
| OIDC Server | 8000 | 8000 | 认证服务 |
| API Server | 8000 | 8001 | 主要 API |
| Admin Panel | 80 | 3000 | 管理界面 |

## 防火墙配置

### 自动配置（推荐）

使用 `k8s-deploy.sh setup` 命令会自动配置防火墙规则。如果需要单独配置防火墙，可以手动执行相关命令。

### 手动配置

如果需要手动配置防火墙，请开放以下端口：

```bash
# SSH 连接
sudo ufw allow 22/tcp

# PhoenixCoder 服务端口
sudo ufw allow 8001/tcp  # API Server
sudo ufw allow 8000/tcp  # OIDC Server
sudo ufw allow 3000/tcp  # Admin Panel

# MicroK8s Registry
sudo ufw allow 32000/tcp

# 启用防火墙
sudo ufw enable
```

### 开放的端口说明

| 端口 | 服务 | 描述 |
|------|------|------|
| 22 | SSH | 远程连接服务器 |
| 8001 | API Server | PhoenixCoder 主要 API 服务 |
| 8000 | OIDC Server | 认证服务 |
| 3000 | Admin Panel | 管理界面 |
| 32000 | MicroK8s Registry | 容器镜像仓库 |

### 防火墙管理命令

```bash
# 查看防火墙状态
sudo ufw status numbered

# 重置防火墙规则
sudo ufw --force reset

# 禁用防火墙
sudo ufw disable

# 启用防火墙
sudo ufw enable
```

## 故障排除

### 常见问题

#### 1. 无法访问服务
```bash
# 检查防火墙状态
ssh edward@192.168.3.30 "sudo ufw status numbered"

# 检查端口是否开放
ssh edward@192.168.3.30 "sudo netstat -tlnp | grep -E ':(8000|8001|3000)'"

# 手动配置防火墙（如需要）
ssh edward@192.168.3.30 "sudo ufw allow 8001/tcp && sudo ufw allow 8000/tcp && sudo ufw allow 3000/tcp"
```

#### 2. 镜像推送失败
```bash
# 检查 MicroK8s registry 状态
ssh edward@192.168.3.30 "microk8s kubectl get pods -n container-registry"

# 重启 registry
ssh edward@192.168.3.30 "microk8s disable registry && microk8s enable registry"
```

#### 3. Pod 启动失败
```bash
# 查看 Pod 详细信息
./k8s-deploy.sh connect
microk8s kubectl describe pod <pod-name> -n phoenixcoder

# 查看 Pod 日志
microk8s kubectl logs <pod-name> -n phoenixcoder
```

#### 3. 服务无法访问
```bash
# 检查服务状态
microk8s kubectl get services -n phoenixcoder

# 检查 NodePort 是否正确
microk8s kubectl get services -n phoenixcoder -o wide
```

### 调试命令

```bash
# 进入 Pod 内部
microk8s kubectl exec -it <pod-name> -n phoenixcoder -- /bin/bash

# 查看所有资源
microk8s kubectl get all -n phoenixcoder

# 查看事件
microk8s kubectl get events -n phoenixcoder --sort-by='.lastTimestamp'
```

## 开发工作流

### 代码更新部署流程

1. **修改代码**
2. **重新构建和部署**：
   ```bash
   ./k8s-deploy.sh full-deploy
   ```
3. **验证部署**：
   ```bash
   ./k8s-deploy.sh status
   ```

### 快速重启特定服务

```bash
# 只重启后端服务
./k8s-deploy.sh restart -s server

# 只重启前端
./k8s-deploy.sh restart -s admin
```

## 生产环境注意事项

1. **安全配置**：
   - 修改默认密码和密钥
   - 配置 HTTPS
   - 设置适当的资源限制

2. **监控和日志**：
   - 配置日志收集
   - 设置监控告警
   - 定期备份数据

3. **高可用性**：
   - 增加副本数量
   - 配置健康检查
   - 设置自动重启策略

## 相关文档

- [MicroK8s 官方文档](https://microk8s.io/docs)
- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [Docker 官方文档](https://docs.docker.com/)