<!-- BADGES:START -->
# 项目状态徽章

## 主要状态

![build](https://img.shields.io/badge/Build-passing-brightgreen?style=flat) ![tests](https://img.shields.io/badge/Tests-passing-brightgreen?style=flat) ![coverage](https://img.shields.io/badge/Coverage-70%25-yellow?style=flat) ![quality](https://img.shields.io/badge/Quality-good-green?style=flat) ![security](https://img.shields.io/badge/Security-secure-brightgreen?style=flat)

## GitHub Actions

![ci](https://github.com/as4391052123/phoenixcoder/actions/workflows/ci.yml/badge.svg?branch=main&style=flat) ![test](https://github.com/as4391052123/phoenixcoder/actions/workflows/test.yml/badge.svg?branch=main&style=flat) ![deploy](https://github.com/as4391052123/phoenixcoder/actions/workflows/deploy.yml/badge.svg?branch=main&style=flat) ![build](https://img.shields.io/badge/Build-passing-brightgreen?style=flat)

## 项目信息

![version](https://img.shields.io/badge/Version-v1.0.0-blue?style=flat) ![license](https://img.shields.io/badge/License-MIT-blue?style=flat) ![node](https://img.shields.io/badge/Node.js-%3E%3D18-green?style=flat) ![typescript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat)

<!-- BADGES:END -->

# PhoenixCoder

> AI-powered coding platform with community and enterprise versions

## 项目介绍

PhoenixCoder 是一个基于 AI 的编程平台，提供社区版和企业版两个版本。平台采用现代化的技术栈，支持多种编程语言和开发场景。

## 项目结构

```
phoenixcoder/
├── apps/                    # 应用程序
│   ├── community/          # 社区版应用
│   │   ├── admin/         # 管理后台
│   │   ├── miniapp/       # 微信小程序
│   │   ├── oidc-server/   # OIDC 认证服务
│   │   └── server/        # 后端服务
│   └── enterprise/        # 企业版应用
│       ├── admin/         # 管理后台
│       ├── miniapp/       # 微信小程序
│       ├── oidc-server/   # OIDC 认证服务
│       └── server/        # 后端服务
├── packages/              # 共享包
│   ├── shared-services/   # 共享服务
│   ├── shared-types/      # 共享类型定义
│   └── shared-utils/      # 共享工具函数
├── docs/                  # 文档
├── infrastructure/        # 基础设施配置
└── tools/                # 开发工具
```

## 技术栈

### 后端服务
- **Python 3.13** - 主要编程语言
- **FastAPI** - Web 框架
- **PostgreSQL** - 数据库
- **Redis** - 缓存
- **RabbitMQ** - 消息队列

### 前端应用
- **Node.js 24** - 运行环境
- **TypeScript** - 编程语言
- **React** - UI 框架
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Taro** - 小程序框架

### 共享包
- **TypeScript** - 类型安全
- **ESLint** - 代码规范
- **Prettier** - 代码格式化

## 快速开始

### 环境要求

- **Node.js**: >= 24.0.0
- **Python**: >= 3.13
- **pnpm**: >= 8.0.0 (必须使用 pnpm 作为包管理工具)

> ⚠️ **重要提醒**: 本项目强制使用 pnpm 作为包管理工具，不支持 npm 或 yarn。项目已配置 preinstall 脚本来确保只能使用 pnpm。

### 安装 pnpm

如果您还没有安装 pnpm，请使用以下命令安装：

```bash
# 使用 npm 安装 pnpm
pnpm --version || npm install -g pnpm

# 或使用 curl 安装
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 或使用 Homebrew (macOS)
brew install pnpm
```

### 本地开发环境

1. **克隆项目**
   ```bash
   git clone https://github.com/your-org/phoenixcoder.git
   cd phoenixcoder
   ```

2. **安装依赖**
   ```bash
   # 安装所有依赖（仅支持 pnpm）
   pnpm install
   ```

3. **环境配置**
   ```bash
   # 复制环境变量模板
   cp env.example .env
   
   # 编辑环境变量文件
   # 配置数据库、Redis、RabbitMQ 等服务连接信息
   ```

4. **启动开发服务**
   ```bash
   # 启动社区版应用
   pnpm dev:community
   
   # 启动企业版应用
   pnpm dev:enterprise
   
   # 构建共享包
   pnpm build:shared
   ```

### 常用命令

```bash
# 构建所有项目
pnpm build

# 运行所有测试
pnpm test

# 代码检查
pnpm lint

# 清理构建文件
pnpm clean

# 构建特定版本
pnpm build:community    # 构建社区版
pnpm build:enterprise   # 构建企业版
pnpm build:shared       # 构建共享包
```

### 测试环境

项目包含完整的测试套件：

- **单元测试**: 使用 pytest (Python) 和 Jest/Vitest (TypeScript)
- **集成测试**: 使用 pytest-integration
- **端到端测试**: 使用 Playwright

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm --filter=@phoenixcoder/shared-services test
```

## 开发规范

### 包管理工具

- **必须使用 pnpm**: 项目已配置强制检查，使用其他包管理工具将会失败
- **工作区支持**: 使用 pnpm workspace 管理 monorepo
- **依赖管理**: 共享依赖使用 `workspace:*` 协议

### 代码规范

- **TypeScript**: 前端代码必须使用 TypeScript
- **ESLint**: 遵循项目 ESLint 配置
- **Prettier**: 使用 Prettier 进行代码格式化
- **提交规范**: 使用 Conventional Commits 规范

### 版本要求

- **Node.js**: 24.x (LTS)
- **Python**: 3.13.x
- **TypeScript**: 5.x
- **React**: 18.x

## 部署

项目支持多种部署方式：

- **Docker**: 使用 Docker Compose 进行容器化部署
- **Kubernetes**: 支持 K8s 集群部署
- **云平台**: 支持 AWS、Azure、GCP 等云平台

详细部署文档请参考 [部署指南](./docs/deployment.md)。

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

请确保：
- 使用 pnpm 作为包管理工具
- 遵循代码规范
- 添加适当的测试
- 更新相关文档

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。

## 联系我们

- 项目主页: [https://github.com/your-org/phoenixcoder](https://github.com/your-org/phoenixcoder)
- 问题反馈: [Issues](https://github.com/your-org/phoenixcoder/issues)
- 邮箱: team@phoenixcoder.com

---

**PhoenixCoder Team** ❤️