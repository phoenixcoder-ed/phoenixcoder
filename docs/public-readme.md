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
│   │   │   ├── main.py         # 服务端主程序
│   │   │   ├── requirements.txt # Python 依赖
│   │   │   └── venv/           # Python 虚拟环境
│   │   ├── oidc-server/        # OIDC 认证服务端 (Python 3.13)
│   │   │   ├── main.py         # OIDC 服务端主程序
│   │   │   ├── requirements.txt # Python 依赖
│   │   │   ├── requirements-test.txt # 测试依赖
│   │   │   ├── tests/          # 单元测试
│   │   │   ├── config.env      # 环境配置
│   │   │   └── venv/           # Python 虚拟环境
│   │   ├── miniapp/            # Taro4 + React 小程序端
│   │   │   ├── package.json    # 项目配置
│   │   │   ├── src/            # 源代码
│   │   │   ├── config/         # Taro 配置
│   │   │   └── ...             # 其他小程序文件
│   │   └── admin/              # React Admin + Tailwind 管理端
│   │       ├── package.json    # 项目配置
│   │       ├── src/            # 源代码
│   │       ├── public/         # 静态资源
│   │       └── ...             # 其他管理端文件
│   └── enterprise/             # 企业版应用 (预留)
├── packages/                   # 共享包目录
│   ├── shared-types/           # 共享类型定义
│   ├── shared-utils/           # 共享工具函数
│   ├── shared-components/      # 共享组件
│   └── shared-services/        # 共享服务
├── .gitlab-ci.yml              # GitLab CI/CD 配置
├── README.md                   # 项目说明
└── 兼职平台商业计划书.md        # 商业计划书
```

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

## 快速开始

### 使用启动脚本 (推荐)
我们提供了一个便捷的启动脚本来管理项目的启动、停止和重启。

```bash
# 启动开发环境所有服务
./start.sh start

# 启动生产环境所有服务
./start.sh start -e prod

# 启动特定服务
./start.sh start -s server

# 停止所有服务
./start.sh stop

# 重启所有服务
./start.sh restart

# 查看服务日志
./start.sh logs
./start.sh logs -s server  # 查看特定服务日志

# 查看服务状态
./start.sh status

# 显示帮助信息
./start.sh help
```

### 手动启动 (不推荐)

#### 1. 启动 OIDC 认证服务
```bash
cd apps/community/oidc-server
source venv/bin/activate
python main.py
```

#### 2. 启动主服务端
```bash
cd apps/community/server
source venv/bin/activate
python main.py
```

#### 3. 启动小程序端
```bash
cd apps/community/miniapp
pnpm install
pnpm run dev:weapp
```

#### 4. 启动管理端
```bash
cd apps/community/admin
pnpm install
pnpm run dev
```

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

