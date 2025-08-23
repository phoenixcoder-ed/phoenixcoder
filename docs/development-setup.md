# 开发环境设置指南

## 包管理工具规范

### 🚨 重要：强制使用 pnpm

本项目**强制使用 pnpm** 作为唯一的包管理工具，禁止使用 npm 或 yarn。

#### 为什么选择 pnpm？

1. **磁盘空间效率**：通过硬链接共享依赖，节省大量磁盘空间
2. **安装速度快**：并行安装和缓存机制，比 npm 快 2-3 倍
3. **严格的依赖管理**：避免幽灵依赖问题，确保依赖关系清晰
4. **Monorepo 支持**：原生支持工作区，适合我们的多包架构
5. **兼容性好**：与 npm 生态完全兼容

#### 安装 pnpm

```bash
# 使用 npm 安装 pnpm（仅此一次）
pnpm --version || pnpm install -g pnpm

# 或使用 corepack（Node.js 16.13+）
corepack enable
corepack prepare pnpm@latest --activate
```

#### 技术保障

项目已配置 `preinstall` 脚本，自动检查包管理工具：

```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

如果使用 npm 或 yarn 安装依赖，将会收到错误提示并阻止安装。

### 📋 开发规范

#### 1. 依赖安装

```bash
# ✅ 正确：使用 pnpm
pnpm install
pnpm add package-name
pnpm add -D dev-package

# ❌ 错误：禁止使用
npm install
yarn install
```

#### 2. 脚本执行

```bash
# ✅ 正确：使用 pnpm
pnpm run dev
pnpm run build
pnpm run test

# ❌ 错误：禁止使用
npm run dev
yarn dev
```

#### 3. 工作区操作

```bash
# 在特定包中运行命令
pnpm --filter @phoenixcoder/shared-types run build

# 在所有包中运行命令
pnpm -r run build

# 添加依赖到特定包
pnpm --filter @phoenixcoder/admin add lodash
```

## 开发环境配置

### 必需软件版本

- **Node.js**: 24.x（推荐使用 LTS 版本）
- **Python**: 3.13
- **JDK**: 21
- **pnpm**: 最新版本

### 环境变量配置

```bash
# 复制环境变量模板
cp .env.community.example .env.community

# 编辑环境变量文件
vim .env.community
```

### IDE 配置建议

#### VS Code 扩展

推荐安装以下扩展：

- **TypeScript**: 内置支持
- **ESLint**: 代码规范检查
- **Prettier**: 代码格式化
- **Tailwind CSS IntelliSense**: Tailwind 智能提示
- **Auto Rename Tag**: 自动重命名标签
- **GitLens**: Git 增强

#### 工作区设置

在 `.vscode/settings.json` 中配置：

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "eslint.workingDirectories": [
    "apps/community/admin",
    "apps/community/miniapp",
    "packages/shared-types",
    "packages/shared-utils",
    "packages/shared-components",
    "packages/shared-services"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## 常见问题

### Q: 为什么不能使用 npm？

A: 项目配置了 `preinstall` 脚本强制使用 pnpm，这是为了：
- 确保团队使用统一的包管理工具
- 避免不同工具产生的锁文件冲突
- 利用 pnpm 的性能和空间优势

### Q: 如何在 CI/CD 中使用 pnpm？

A: 在 CI/CD 配置中安装 pnpm：

```yaml
# GitHub Actions 示例
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: latest

- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '24'
    cache: 'pnpm'

- name: Install dependencies
  run: pnpm install
```

### Q: 遇到 pnpm 相关问题怎么办？

A: 常见解决方案：

```bash
# 清理缓存
pnpm store prune

# 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 检查 pnpm 版本
pnpm --version
```

## 团队协作

### 代码提交前检查

1. 确保使用 pnpm 安装依赖
2. 运行 `pnpm run check` 检查类型错误
3. 运行 `pnpm run lint` 检查代码规范
4. 运行 `pnpm run test` 执行测试

### 新成员入职

1. 安装 pnpm：`pnpm --version || npm install -g pnpm`
2. 克隆项目：`git clone <repository>`
3. 安装依赖：`pnpm install`
4. 配置环境变量：`cp .env.community.example .env.community`
5. 启动开发服务：`pnpm run dev`

---

**记住：在 PhoenixCoder 项目中，pnpm 不是选择，而是标准！** 🚀