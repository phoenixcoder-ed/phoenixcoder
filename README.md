# PhoenixCoder

✨ 代码不朽，价值不灭 / 为热爱重生，为成长飞翔

## 项目介绍

🔥 PhoenixCoder — 赋能程序员的成长型兼职与认证平台

PhoenixCoder 是一个开源项目，致力于为程序员群体构建一个 **技能成长 + 项目实战 + 自我认证** 三位一体的自由平台。

我们相信，每一位程序员都值得拥有属于自己的成长路径、技术IP和生活选择权。

## 项目结构

```
phoenixcoder/
├── phoenixcoder-server/        # FastAPI 服务端 (Python 3.13)
│   ├── main.py                 # 服务端主程序
│   ├── requirements.txt        # Python 依赖
│   └── venv/                   # Python 虚拟环境
├── phoenixcoder-oidc-server/   # OIDC 认证服务端 (Python 3.13)
│   ├── main.py                 # OIDC 服务端主程序
│   ├── requirements.txt        # Python 依赖
│   ├── requirements-test.txt   # 测试依赖
│   ├── tests/                  # 单元测试
│   ├── config.env              # 环境配置
│   └── venv/                   # Python 虚拟环境
├── phoenixcoder-miniapp/       # Taro4 + React 小程序端
│   ├── package.json            # 项目配置
│   ├── src/                    # 源代码
│   ├── config/                 # Taro 配置
│   └── ...                     # 其他小程序文件
├── phoenixcoder-admin/         # React Admin + Tailwind 管理端
│   ├── package.json            # 项目配置
│   ├── src/                    # 源代码
│   ├── public/                 # 静态资源
│   └── ...                     # 其他管理端文件
├── .gitlab-ci.yml              # GitLab CI/CD 配置
├── README.md                   # 项目说明
└── 兼职平台商业计划书.md        # 商业计划书
```

## 技术栈

### 后端服务
- **phoenixcoder-server**: FastAPI + Python 3.13
- **phoenixcoder-oidc-server**: OIDC + JWT + Python 3.13

### 前端应用
- **phoenixcoder-miniapp**: Taro 4 + React + TypeScript
- **phoenixcoder-admin**: React Admin + Tailwind CSS

## 快速开始

### 1. 启动 OIDC 认证服务
```bash
cd phoenixcoder-oidc-server
source venv/bin/activate
python main.py
```

### 2. 启动主服务端
```bash
cd phoenixcoder-server
source venv/bin/activate
python main.py
```

### 3. 启动小程序端
```bash
cd phoenixcoder-miniapp
npm install
npm run dev:weapp
```

### 4. 启动管理端
```bash
cd phoenixcoder-admin
npm install
npm run dev
```

## 测试

### 运行 OIDC 服务端测试
```bash
cd phoenixcoder-oidc-server
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

