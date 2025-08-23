# PhoenixCoder Server

PhoenixCoder 项目的主服务端，基于 FastAPI 构建，提供核心业务 API 服务。

## 技术栈

- **Python 3.13** - 最新稳定版本
- **FastAPI** - 现代、快速的 Web 框架
- **Uvicorn** - ASGI 服务器
- **Python-Jose** - JWT 处理
- **HTTPX** - HTTP 客户端
- **Python-Dotenv** - 环境变量管理

## 功能特性

- ✅ OIDC + JWT 认证集成
- ✅ RESTful API 设计
- ✅ 自动 API 文档生成
- ✅ 异步请求处理
- ✅ 中间件支持
- ✅ 错误处理
- ✅ 日志记录

## 快速开始

### 1. 环境要求

- Python 3.13+
- pip
- 虚拟环境工具

### 2. 安装依赖

```bash
# 创建虚拟环境
python3.13 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt
```

### 3. 环境配置

创建 `.env` 文件：

```bash
# OIDC 配置
OIDC_ISSUER=http://localhost:8001
OIDC_CLIENT_ID=phoenixcoder-client
OIDC_CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/auth/callback

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/phoenixcoder

# Redis 配置
REDIS_URL=redis://localhost:6379/0
```

### 4. 启动服务

```bash
# 开发模式
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 5. 访问服务

- **API 文档**: http://localhost:8000/docs
- **ReDoc 文档**: http://localhost:8000/redoc
- **健康检查**: http://localhost:8000/health

## API 端点

### 认证相关

- `GET /login` - 获取 OIDC 登录链接
- `GET /auth/callback` - OIDC 回调处理
- `GET /me` - 获取当前用户信息

### 业务相关

- `GET /` - 服务根端点
- `GET /health` - 健康检查
- `GET /api/v1/...` - 业务 API 端点

## Docker 部署

### 构建镜像

```bash
docker build -t phoenixcoder-server .
```

### 运行容器

```bash
docker run -d \
  --name phoenixcoder-server \
  -p 8000:8000 \
  -e OIDC_ISSUER=http://oidc-server:8001 \
  -e JWT_SECRET=your-secret \
  phoenixcoder-server
```

### Docker Compose

```bash
# 开发环境
docker-compose up -d server

# 生产环境
docker-compose -f docker-compose.prod.yml up -d server
```

## 开发指南

### 项目结构

```
phoenixcoder-server/
├── main.py              # 应用入口
├── requirements.txt     # Python 依赖
├── README.md           # 项目文档
├── Dockerfile          # Docker 配置
└── venv/               # 虚拟环境
```

### 代码规范

- 使用 **Black** 进行代码格式化
- 使用 **isort** 进行导入排序
- 使用 **flake8** 进行代码检查
- 遵循 **PEP 8** 编码规范

### 测试

```bash
# 运行测试
pytest

# 运行测试并生成覆盖率报告
pytest --cov=main --cov-report=html
```

### 日志

日志配置支持以下级别：
- DEBUG - 调试信息
- INFO - 一般信息
- WARNING - 警告信息
- ERROR - 错误信息
- CRITICAL - 严重错误

## 部署

### 开发环境

```bash
# 使用 Docker Compose
docker-compose up -d

# 或直接运行
python main.py
```

### 生产环境

```bash
# 使用 Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 或使用 Docker Swarm
docker stack deploy -c docker-compose.prod.yml phoenixcoder
```

## 监控

### 健康检查

```bash
curl http://localhost:8000/health
```

### 指标监控

- 请求响应时间
- 错误率
- 并发连接数
- 内存使用情况

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   lsof -i :8000
   
   # 杀死进程
   kill -9 <PID>
   ```

2. **依赖安装失败**
   ```bash
   # 升级 pip
   pip install --upgrade pip
   
   # 清理缓存
   pip cache purge
   ```

3. **环境变量问题**
   ```bash
   # 检查环境变量
   python -c "import os; print(os.environ.get('OIDC_ISSUER'))"
   ```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目主页: https://github.com/phoenixcoder/phoenixcoder
- 问题反馈: https://github.com/phoenixcoder/phoenixcoder/issues 