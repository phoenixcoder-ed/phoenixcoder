# 测试代码组织规范

## 目录结构

```
tests/
├── README.md                    # 测试说明文档
├── integration_test.py          # 集成测试
├── test_basic.py               # 基础功能测试
├── test_oidc_server.py         # OIDC服务器测试
└── conftest.py                 # pytest配置文件
```

## 各子项目测试目录

### 后端服务测试
- `phoenixcoder-server/tests/` - 后端单元测试
- `phoenixcoder-oidc-server/tests/` - OIDC服务器单元测试

### 前端测试
- `phoenixcoder-admin/tests/` - 管理端单元测试
- `phoenixcoder-miniapp/tests/` - 小程序单元测试

## 测试类型说明

### 1. 单元测试 (Unit Tests)
- **位置**：各子项目的 `tests/` 目录
- **命名**：`test_*.py` 或 `*.test.ts`
- **范围**：测试单个函数、类或组件

### 2. 集成测试 (Integration Tests)
- **位置**：项目根目录 `tests/` 目录
- **命名**：`integration_test.py`
- **范围**：测试多个模块间的交互

### 3. 端到端测试 (E2E Tests)
- **位置**：项目根目录 `tests/e2e/`（待创建）
- **工具**：Playwright 或 Cypress
- **范围**：测试完整用户流程

## 测试运行命令

### Python 测试
```bash
# 运行所有测试
pytest

# 运行单元测试
pytest phoenixcoder-server/tests/

# 运行集成测试
pytest tests/

# 生成覆盖率报告
pytest --cov=phoenixcoder-server --cov-report=html
```

### 前端测试
```bash
# 管理端测试
cd phoenixcoder-admin && pnpm test

# 小程序测试
cd phoenixcoder-miniapp && pnpm test
```

## 测试编写规范

### Python 测试
- 使用 pytest 框架
- 测试文件以 `test_` 开头
- 测试函数以 `test_` 开头
- 使用 fixtures 管理测试数据
- 使用 mock 隔离外部依赖

### 前端测试
- 使用 Vitest 框架
- 测试文件以 `.test.ts` 或 `.test.tsx` 结尾
- 使用 React Testing Library 测试组件
- 使用 MSW 模拟 API 请求

## 测试覆盖率要求

- **单元测试覆盖率**：≥ 80%
- **集成测试覆盖率**：≥ 60%
- **关键业务逻辑**：≥ 90%

## 持续集成

测试将在以下情况自动运行：
- 代码提交到主分支
- 创建 Pull Request
- 发布新版本

## 测试数据管理

- 使用 fixtures 创建测试数据
- 测试间数据隔离
- 测试后清理数据
- 敏感数据使用环境变量