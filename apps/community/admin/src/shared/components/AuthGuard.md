# 认证守卫系统 (AuthGuard)

## 概述

AuthGuard 是一个 React 组件，用于保护需要用户登录才能访问的页面和功能。它提供了完整的认证检查、路由保护和用户状态管理功能。

## 功能特性

### 🔐 认证保护

- 自动检查用户登录状态
- JWT Token 过期验证
- 未登录用户自动重定向到登录页面
- 保存用户访问的原始路径，登录后自动跳转

### 🛣️ 路由管理

- 支持公开路由白名单配置
- 精确路径匹配和前缀匹配
- 错误页面路由支持

### 🔄 状态管理

- 实时监听用户登录状态变化
- 自动清理过期的认证信息
- 支持"记住我"功能

## 使用方法

### 基本用法

```tsx
import { AuthGuard } from './shared/components/AuthGuard';

// 保护整个应用
<AuthGuard>
  <App />
</AuthGuard>

// 保护特定路由
<Route
  path="/dashboard"
  element={
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  }
/>
```

### 公开路由配置

AuthGuard 内置了以下公开路由，无需登录即可访问：

```typescript
const PUBLIC_ROUTES = [
  '/', // 首页
  '/login', // 登录页面
  '/register', // 注册页面
  '/landing', // 宣传页面
  '/about', // 关于页面
  '/privacy', // 隐私政策
  '/terms', // 服务条款
  '/error', // 错误页面
  '/error/*', // 所有错误子页面
];
```

### Hook 使用

#### useAuthRequired

检查当前路径是否需要认证：

```tsx
import { useAuthRequired } from './shared/components/AuthGuard';

const MyComponent = () => {
  const authRequired = useAuthRequired();

  return <div>{authRequired ? '需要登录' : '公开页面'}</div>;
};
```

#### useAuthStatus

管理用户认证状态：

```tsx
import { useAuthStatus } from './shared/components/AuthGuard';

const MyComponent = () => {
  const { isAuthenticated, login, logout } = useAuthStatus();

  const handleLogin = () => {
    // 执行登录逻辑
    login();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={handleLogout}>退出登录</button>
      ) : (
        <button onClick={handleLogin}>登录</button>
      )}
    </div>
  );
};
```

## 认证流程

### 1. 页面访问检查

```
用户访问页面 → 检查是否为公开路由 → 是：直接访问 / 否：检查登录状态
```

### 2. 登录状态验证

```
检查 localStorage 中的 token 和 user → 验证 JWT token 是否过期 → 过期则清理并重定向
```

### 3. 重定向逻辑

```
未登录用户 → 保存当前路径 → 重定向到 /login?returnUrl=原路径
```

## 存储结构

AuthGuard 使用 localStorage 存储用户认证信息：

```typescript
// Token 存储
localStorage.setItem('token', 'jwt-token-string');

// 用户信息存储
localStorage.setItem(
  'user',
  JSON.stringify({
    id: 1,
    name: '用户名',
    email: 'user@example.com',
    // 其他用户信息
  })
);
```

## 安全特性

### JWT Token 验证

- 自动解析 JWT payload
- 检查 token 过期时间 (exp 字段)
- 过期自动清理本地存储

### 防护机制

- 防止未认证用户访问受保护页面
- 自动处理 token 过期情况
- 支持跨标签页状态同步

## 自定义配置

### 添加新的公开路由

修改 `PUBLIC_ROUTES` 数组：

```typescript
const PUBLIC_ROUTES = [
  // 现有路由...
  '/new-public-page', // 添加新的公开路由
];
```

### 自定义重定向逻辑

可以修改 `checkAuth` 函数中的重定向逻辑：

```typescript
// 自定义重定向路径
navigate(`/custom-login?returnUrl=${returnUrl}`, { replace: true });
```

## 最佳实践

1. **路由结构**：将 AuthGuard 放在路由的最外层，保护整个应用
2. **公开路由**：确保所有不需要登录的页面都在白名单中
3. **错误处理**：配合 ErrorBoundary 使用，处理认证相关错误
4. **状态同步**：使用 useAuthStatus Hook 在组件间同步认证状态

## 故障排除

### 常见问题

1. **无限重定向**：检查登录页面是否在公开路由白名单中
2. **Token 过期**：确保后端返回的 JWT 包含正确的 exp 字段
3. **状态不同步**：使用 useAuthStatus Hook 而不是直接读取 localStorage

### 调试技巧

```typescript
// 在浏览器控制台检查认证状态
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));

// 手动清理认证信息
localStorage.removeItem('token');
localStorage.removeItem('user');
```
