# 全局异常处理系统

## 概述

本系统为 React Admin 应用提供了完整的全局异常处理机制，包括：

- 🔐 认证相关错误自动跳转登录页
- 📄 各种 HTTP 状态码对应的错误页面
- 🔄 自动重试机制
- 🛡️ React 错误边界
- 📡 HTTP 请求拦截器

## 组件说明

### ErrorPages.tsx

提供各种错误页面组件：

- `UnauthorizedPage` (401) - 未授权
- `ForbiddenPage` (403) - 禁止访问
- `NotFoundPage` (404) - 页面未找到
- `ServerErrorPage` (500) - 服务器错误
- `NetworkErrorPage` - 网络连接错误
- `GenericErrorPage` - 通用错误

### GlobalErrorHandler.tsx

全局错误处理核心：

- `ErrorBoundary` - React 错误边界组件
- `handleHttpError` - HTTP 错误处理函数
- `useGlobalErrorHandler` - 错误处理 Hook
- `ErrorRoutes` - 错误页面路由

### enhancedAuthProvider.tsx

增强的认证提供者，集成了全局错误处理

### httpInterceptor.ts

HTTP 请求拦截器，自动处理请求错误

## 使用方法

### 1. 在 App.tsx 中集成

```tsx
import { Admin } from 'react-admin';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary, ErrorRoutes } from './shared/components';
import { enhancedAuthProvider } from './features/auth/enhancedAuthProvider';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/error/*" element={<ErrorRoutes />} />
          <Route
            path="/*"
            element={
              <Admin authProvider={enhancedAuthProvider}>
                {/* 你的资源定义 */}
              </Admin>
            }
          />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
```

### 2. 设置 HTTP 拦截器

```tsx
import { useNavigate } from 'react-router-dom';
import { setupHttpInterceptor } from './shared/utils/httpInterceptor';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setupHttpInterceptor(navigate);
  }, [navigate]);

  // ...
}
```

### 3. 在组件中使用错误处理

```tsx
import { useGlobalErrorHandler } from './shared/components';

function MyComponent() {
  const handleError = useGlobalErrorHandler();

  const handleApiCall = async () => {
    try {
      await api.getData();
    } catch (error) {
      handleError(error);
    }
  };

  // ...
}
```

## 错误处理流程

1. **HTTP 错误** → `httpInterceptor` → `handleHttpError` → 相应错误页面
2. **认证错误** (401/403) → 清除认证信息 → 跳转登录页
3. **React 错误** → `ErrorBoundary` → `GenericErrorPage`
4. **网络错误** → `NetworkErrorPage`

## 自定义错误页面

可以通过修改 `ErrorPages.tsx` 中的组件来自定义错误页面的样式和内容。

## 注意事项

- 确保在应用启动时调用 `setupHttpInterceptor`
- 认证相关错误会自动清除本地存储的认证信息
- 错误页面支持返回首页、刷新页面等操作
- 系统会自动为网络错误等临时性错误提供重试机制
