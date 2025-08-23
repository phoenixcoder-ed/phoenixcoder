# Redux Toolkit 改造说明

## 概述

本项目已成功从传统 Redux 迁移到 Redux Toolkit (RTK)，提供了更现代化、类型安全的状态管理解决方案。

## 主要改进

### 1. 使用 Redux Toolkit
- 使用 `createSlice` 简化 reducer 和 action 的创建
- 使用 `createAsyncThunk` 处理异步操作
- 内置 Immer 支持不可变更新
- 自动生成 action creators 和 action types

### 2. 类型安全
- 完整的 TypeScript 支持
- 类型安全的 hooks (`useAppDispatch`, `useAppSelector`)
- 强类型的 state 和 actions

### 3. 模块化设计
- 按功能模块组织 slices
- 清晰的文件结构和命名规范

## 文件结构

```
src/store/
├── index.ts              # Store 配置
├── Provider.tsx          # Redux Provider 组件
├── hooks.ts             # 类型安全的 hooks
└── slices/              # 功能模块 slices
    ├── uiSlice.ts       # UI 状态管理
    ├── authSlice.ts     # 认证状态管理
    ├── notificationSlice.ts    # 通知状态管理
    ├── userManagementSlice.ts  # 用户管理状态
    ├── knowledgeBaseSlice.ts   # 知识库状态
    └── validationSlice.ts      # 表单验证状态
```

## 主要 Slices

### 1. UI Slice (`uiSlice.ts`)
管理全局 UI 状态：
- 主题设置 (亮色/暗色)
- 侧边栏状态
- 加载状态
- 当前页面和面包屑

### 2. 认证 Slice (`authSlice.ts`)
管理用户认证状态：
- 登录/登出
- 用户信息
- 认证状态
- 权限管理

### 3. 通知 Slice (`notificationSlice.ts`)
管理应用通知：
- 添加/移除通知
- 标记已读/未读
- 清除通知
- 通知类型和优先级

### 4. 用户管理 Slice (`userManagementSlice.ts`)
管理用户列表和操作：
- 用户 CRUD 操作
- 筛选和分页
- 批量操作
- 用户选择状态

### 5. 知识库 Slice (`knowledgeBaseSlice.ts`)
管理知识库内容：
- 知识项目管理
- 标签系统
- 搜索和筛选

### 6. 验证 Slice (`validationSlice.ts`)
管理表单验证：
- 字段验证状态
- 错误信息管理
- 表单状态跟踪

## 使用示例

### 基本用法

```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleTheme, selectTheme } from '../store/slices/uiSlice';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  return (
    <button onClick={handleToggleTheme}>
      当前主题: {theme}
    </button>
  );
};
```

### 异步操作

```typescript
import { fetchUsersAsync } from '../store/slices/userManagementSlice';

const UserList = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector(state => state.userManagement);

  useEffect(() => {
    dispatch(fetchUsersAsync({ page: 1, limit: 10 }));
  }, [dispatch]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
};
```

### 自定义 Hook

```typescript
import { useUserManagementRedux } from '../features/UserManagement/hooks/useUserManagementRedux';

const UserManagementPage = () => {
  const {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    updateFilters,
    updatePagination
  } = useUserManagementRedux();

  // 使用封装好的方法
  const handleCreateUser = (userData) => {
    createUser(userData);
  };

  return (
    // 组件 JSX
  );
};
```

## 演示页面

访问 `/redux-demo` 路径可以查看完整的 Redux Toolkit 功能演示，包括：

- UI 状态管理演示
- 通知系统演示
- 认证状态演示
- 用户管理演示
- 实时状态更新

## 开发工具

- **Redux DevTools**: 已集成，可在浏览器中查看状态变化
- **类型检查**: 完整的 TypeScript 支持
- **热重载**: 支持开发时的状态保持

## 最佳实践

1. **使用类型安全的 hooks**: 始终使用 `useAppDispatch` 和 `useAppSelector`
2. **模块化组织**: 按功能模块创建独立的 slices
3. **异步操作**: 使用 `createAsyncThunk` 处理 API 调用
4. **选择器优化**: 使用 `createSelector` 创建记忆化选择器
5. **错误处理**: 在 extraReducers 中处理异步操作的各种状态

## 迁移注意事项

- 所有原有的 Redux 代码已迁移到 Redux Toolkit
- 保持了向后兼容性
- 类型定义更加严格和安全
- 性能得到优化

## 下一步

- 可以继续添加更多功能模块的 slices
- 优化异步操作的错误处理
- 添加更多的选择器和计算属性
- 集成 RTK Query 进行数据获取优化