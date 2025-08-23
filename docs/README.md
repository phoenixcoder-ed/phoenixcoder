# PhoenixCoder

✨ 代码不朽，价值不灭 / 为热爱重生，为成长飞翔

## 项目介绍

🔥 PhoenixCoder — 赋能程序员的成长型兼职与认证平台

PhoenixCoder 是一个开源项目，致力于为程序员群体构建一个 **技能成长 + 项目实战 + 自我认证** 三位一体的自由平台。

我们相信，每一位程序员都值得拥有属于自己的成长路径、技术IP和生活选择权。

## 项目结构

```
phoenixcoder/
├── apps/                       # 应用程序目录
│   ├── community/              # 社区版应用
│   │   ├── server/             # FastAPI 服务端 (Python 3.13)
│   │   ├── oidc-server/        # OIDC 认证服务端 (Python 3.13)
│   │   ├── miniapp/            # Taro4 + React 小程序端
│   │   └── admin/              # React Admin + Tailwind 管理端
│   └── enterprise/             # 企业版应用 (预留)
├── packages/                   # 共享包目录
│   ├── shared-types/           # 共享类型定义
│   ├── shared-utils/           # 共享工具函数
│   ├── shared-components/      # 共享组件
│   ├── shared-miniapp/         # 共享小程序组件
│   └── shared-services/        # 共享服务
├── docs/                       # 项目文档
│   ├── README.md               # 开发手册
│   ├── development-setup.md    # 开发环境设置指南
│   ├── k8s-deployment.md       # Kubernetes部署指南
│   ├── microk8s-services-setup.md # MicroK8s服务配置
│   ├── public-readme.md        # 公开项目说明
│   ├── security-audit-report.md # 安全审计报告
│   └── 系统架构图*.svg         # 系统架构图
├── scripts/                    # 核心脚本目录
│   ├── check-services.sh       # 服务连通性检查
│   └── server-setup.sh         # 服务器配置脚本
├── security/                   # 安全配置目录
│   ├── check-security.sh       # 安全检查脚本
│   ├── container-security.sh   # 容器安全配置
│   ├── database-security.sh    # 数据库安全配置
│   ├── firewall-whitelist.sh   # 防火墙白名单
│   ├── generate-keys.sh        # 密钥生成
│   ├── generate-passwords.sh   # 密码生成
│   ├── least-privilege.sh      # 最小权限配置
│   ├── ssh-hardening.sh        # SSH安全加固
│   └── database-configs/       # 数据库安全配置文件
├── k8s/                        # Kubernetes配置
│   ├── configmaps/             # 配置映射
│   ├── deployments/            # 部署配置
│   ├── services/               # 服务配置
│   └── namespace*.yaml         # 命名空间配置
├── infrastructure/             # 基础设施配置
│   ├── configs/                # 配置文件
│   ├── docker/                 # Docker配置
│   ├── k8s/                    # K8s额外配置
│   └── scripts/                # 基础设施脚本
├── tests/                      # 测试目录
├── tools/                      # 工具目录
├── deploy.sh                   # 部署脚本
├── k8s-deploy.sh              # Kubernetes部署脚本
├── start.sh                    # 启动脚本
├── docker-compose.yml          # Docker Compose配置
├── docker-compose.prod.yml     # 生产环境Docker配置
└── README.md                   # 项目说明
```

## 📚 文档说明

### 开源公开文档 (`docs/public/`)
这些文档适合开源社区，将提交到GitHub：
- 项目介绍和功能说明
- 技术架构和API文档
- 开发规范和指南
- 使用教程和示例

### 内部管理文档 (`docs/internal/`)
这些文档包含商业敏感信息，不会提交到GitHub：
- 商业计划和运营策略
- 项目管理和开发计划
- 架构演进和商业版设计
- 用户分析和市场规划

详细的文档分类说明请参考：[文档分类指南](文档分类指南.md)

## 技术栈

### 后端服务
- **apps/community/server**: FastAPI + Python 3.13
- **apps/community/oidc-server**: OIDC + JWT + Python 3.13

### 前端应用
- **apps/community/miniapp**: Taro 4 + React + TypeScript
- **apps/community/admin**: React Admin + Tailwind CSS

### 共享包
- **packages/shared-types**: TypeScript 类型定义
- **packages/shared-utils**: 通用工具函数
- **packages/shared-components**: 可复用组件
- **packages/shared-services**: 共享服务层

## 环境说明

本项目采用分层架构，支持本地开发和测试环境：

### 本地开发环境
- **应用服务**：直接运行在本地（不使用容器）
- **基础服务**：连接测试服务器 192.168.3.30 上的数据库、Redis 等
- **配置文件**：`.env.community`（需配置远程服务连接）
- **访问地址**：
  - OIDC 服务：http://localhost:8000
  - 主服务：http://localhost:8001
  - 管理后台：http://localhost:3000

### 测试环境
- **服务器地址**：192.168.3.30
- **部署方式**：支持两种部署模式
  - **Docker Compose 模式**：使用 `docker-compose.yml`
  - **MicroK8s 模式**：使用 Kubernetes 进行容器编排
- **访问地址**：
  - OIDC 服务：http://192.168.3.30:8000
- 主服务：http://192.168.3.30:8001
- 管理后台：http://192.168.3.30:3000

> **注意**：未来的生产环境也将使用 MicroK8s 进行部署，保持技术栈的一致性。

## 快速开始

> **📋 重要提醒**：开始开发前，请先阅读 [开发环境设置指南](development-setup.md)，了解包管理工具规范和开发环境配置要求。

### 本地开发环境

本地开发环境直接运行应用服务，连接远程基础服务：

```bash
# 0. 安装 pnpm（如果尚未安装）
pnpm --version || npm install -g pnpm

# 1. 配置环境变量（连接远程服务）
cp .env.community.example .env.community
# 编辑 .env.community，配置远程数据库和Redis连接

# 2. 启动 OIDC 认证服务
cd apps/community/oidc-server
source venv/bin/activate
python main.py

# 3. 启动主服务端
cd apps/community/server
source venv/bin/activate
python main.py

# 4. 启动前端服务（⚠️ 必须使用 pnpm）
# 小程序端
cd apps/community/miniapp
pnpm install
pnpm run dev:weapp

# 管理端
cd apps/community/admin
pnpm install
pnpm run dev
```

### 测试环境部署

测试环境提供两种部署方式，使用启动脚本进行管理：

#### Docker Compose 模式
```bash
# 启动测试环境所有服务 (Docker Compose)
./start.sh start -e test

# 停止测试环境服务
./start.sh stop -e test

# 重启测试环境服务
./start.sh restart -e test

# 查看服务日志
./start.sh logs -e test
./start.sh logs -e test -s server  # 查看特定服务日志

# 查看服务状态
./start.sh status -e test
```

#### MicroK8s 模式
```bash
# 启动测试环境所有服务 (Kubernetes)
./start.sh start -e test -k

# 停止测试环境服务
./start.sh stop -e test -k

# 重启测试环境服务
./start.sh restart -e test -k

# 查看测试环境服务状态
./start.sh status -e test -k

# 显示帮助信息
./start.sh help
```

## 部署流程

### 本地开发环境部署

本地开发环境直接运行应用服务，连接远程基础服务：

1. **环境配置**
   ```bash
   # 复制并配置环境变量文件
   cp .env.community.example .env.community
   
   # 编辑 .env.community，配置远程服务连接
   # 数据库地址：192.168.3.30:30432 (NodePort)
   # Redis地址：192.168.3.30:30379 (NodePort)
   # RabbitMQ地址：192.168.3.30:30672 (NodePort)
   ```

2. **安装依赖**
   ```bash
   # Python 服务依赖
   cd apps/community/oidc-server && pip install -r requirements.txt
   cd apps/community/server && pip install -r requirements.txt
   
   # 前端服务依赖
   cd apps/community/miniapp && pnpm install
   cd apps/community/admin && pnpm install
   ```

3. **启动服务**
   ```bash
   # 按照快速开始部分的步骤逐个启动服务
   # 或使用 PM2 等进程管理工具批量管理
   ```

4. **验证服务**
   - OIDC 服务：http://localhost:8000
   - 主服务：http://localhost:8001
   - 管理后台：http://localhost:3000

### 测试环境部署

测试环境支持两种部署模式：

#### Docker Compose 模式部署

1. **环境准备**
   ```bash
   # 确保 Docker 和 Docker Compose 已安装
   docker --version
   docker-compose --version
   ```

2. **部署服务**
   ```bash
   # 使用启动脚本部署到测试环境
   ./start.sh start -e test
   ```

3. **验证服务**
   - OIDC 服务：http://192.168.3.30:30001
   - 主服务：http://192.168.3.30:30000
   - 管理后台：http://192.168.3.30:30080

#### MicroK8s 模式部署

1. **环境准备**
   ```bash
   # 确保可以访问 MicroK8s 集群
   kubectl get nodes
   ```

2. **部署服务**
   ```bash
   # 使用启动脚本部署到 Kubernetes
   ./start.sh start -e test -k
   ```

3. **验证服务**
   - OIDC 服务：http://192.168.3.30:30001
   - 主服务：http://192.168.3.30:30000
   - 管理后台：http://192.168.3.30:30080

### 环境切换指南

- **本地开发**：直接运行应用服务，连接远程基础服务
- **测试环境 Docker Compose**：使用 `./start.sh start -e test`
- **测试环境 MicroK8s**：使用 `./start.sh start -e test -k`
- **服务状态检查**：使用 `./start.sh status -e test [-k]` 查看对应环境状态

## 配置说明

### 本地开发配置

- **配置文件**：`.env.community`
- **应用端口配置**：
  ```
  OIDC_PORT=8000
SERVER_PORT=8001
ADMIN_PORT=3000
  ```
- **远程服务连接配置**：
  ```
  # 数据库连接（测试服务器 NodePort）
  POSTGRES_HOST=192.168.3.30
  POSTGRES_PORT=30432
  POSTGRES_DB=phoenixcoder
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=password
  
  # Redis连接（测试服务器 NodePort）
  REDIS_HOST=192.168.3.30
  REDIS_PORT=30379
  REDIS_PASSWORD=
  
  # RabbitMQ连接（测试服务器 NodePort）
  RABBITMQ_HOST=192.168.3.30
  RABBITMQ_PORT=30672
  RABBITMQ_USER=myuser
  RABBITMQ_PASSWORD=8dsagfsa
  ```
- **基础服务**：连接测试服务器 192.168.3.30 上的 PostgreSQL、Redis 和 RabbitMQ

### 测试环境配置

#### Docker Compose 模式
- **配置文件**：`docker-compose.yml`
- **服务器地址**：192.168.3.30
- **端口映射**：直接映射到宿主机端口 3000、8000-8001
- **数据存储**：使用 Docker 卷进行数据持久化

#### MicroK8s 模式
- **集群地址**：192.168.3.30
- **配置方式**：通过 Kubernetes ConfigMap 和 Secret
- **端口映射**：使用 NodePort 服务暴露端口 3000、8000-8001
- **存储**：使用 MicroK8s 的本地存储

### 开发调试说明

本地开发环境采用直接运行的方式，便于调试和开发：

- **优势**：
  - 快速启动，无需容器构建时间
  - 便于断点调试和热重载
  - 资源占用更少
  - 代码修改即时生效

- **注意事项**：
  - 确保本地环境已安装 Python 3.13 和 Node.js 24
  - 需要配置正确的远程服务连接参数
  - 建议使用虚拟环境管理 Python 依赖
  - 可使用 PM2 等工具管理多个服务进程

## 测试

### 运行 OIDC 服务端测试
```bash
cd apps/community/oidc-server
source venv/bin/activate
python -m pytest tests/ -v
```

## 开发说明

- 所有 Python 项目使用 Python 3.13
- 前端项目使用最新的稳定版本
- 遵循标准的项目结构和命名规范
- 包含完整的测试覆盖

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

