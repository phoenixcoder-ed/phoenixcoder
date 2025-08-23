# 小程序端单元测试文档

## 概述

本项目使用 **Vitest** 作为测试框架，为小程序端提供全面的单元测试覆盖。测试框架配置了 jsdom 环境来模拟浏览器环境，并提供了完整的 Taro 和小程序 API 模拟。

## 技术栈

- **测试框架**: Vitest
- **测试环境**: jsdom
- **断言库**: Vitest 内置
- **测试工具**: @testing-library/react
- **覆盖率**: @vitest/coverage-v8
- **UI界面**: @vitest/ui

## 项目结构

```
tests/
├── README.md                    # 测试文档
├── setup.ts                     # 测试环境设置
├── components/                  # 组件测试
│   └── ThemeToggle.test.tsx    # 主题切换组件测试
├── pages/                       # 页面测试
│   └── pathDetail.test.tsx     # 路径详情页测试
├── redux/                       # Redux测试
│   ├── actions/                # Action测试
│   │   └── growthActions.test.ts
│   └── reducers/               # Reducer测试
│       └── growthReducers.test.ts
└── utils/                       # 工具类测试
    ├── auth.test.ts            # 认证工具测试
    └── request.test.ts         # 请求工具测试
```

## 配置文件

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    'process.env.TARO_ENV': '"weapp"'
  }
})
```

### tests/setup.ts

测试环境设置文件，包含：
- Taro API 模拟
- 小程序 wx API 模拟
- 全局变量设置
- DOM 环境模拟

## 运行测试

### 使用 npm 脚本

```bash
# 运行所有测试
pnpm run test

# 运行测试（单次）
pnpm run test:run

# 监听模式运行测试
pnpm run test:watch

# 生成覆盖率报告
pnpm run test:coverage

# 启动测试UI界面
pnpm run test:ui
```

### 使用测试脚本

```bash
# 运行所有测试
./scripts/test.sh

# 监听模式
./scripts/test.sh --watch

# 生成覆盖率报告
./scripts/test.sh --coverage

# 启动UI界面
./scripts/test.sh --ui

# 只运行代码检查
./scripts/test.sh --lint

# 清理测试缓存
./scripts/test.sh --clean

# 查看帮助
./scripts/test.sh --help
```

## 测试编写指南

### 1. 组件测试

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

// 模拟Taro API
const mockTaro = {
  showToast: vi.fn(),
  navigateTo: vi.fn()
}

Object.defineProperty(globalThis, 'Taro', {
  value: mockTaro,
  writable: true
})

describe('MyComponent 组件测试', () => {
  it('应该正确渲染', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('应该处理点击事件', () => {
    render(<MyComponent />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockTaro.showToast).toHaveBeenCalled()
  })
})
```

### 2. Redux 测试

```typescript
import { describe, it, expect } from 'vitest'
import reducer from '@/redux/reducers/myReducer'
import * as actions from '@/redux/actions/myActions'

describe('Redux Reducer 测试', () => {
  it('应该处理action', () => {
    const initialState = { data: null }
    const action = actions.setData('test')
    const newState = reducer(initialState, action)
    
    expect(newState.data).toBe('test')
  })
})
```

### 3. 工具类测试

```typescript
import { describe, it, expect, vi } from 'vitest'
import { myUtil } from '@/utils/myUtil'

describe('工具类测试', () => {
  it('应该正确处理数据', () => {
    const result = myUtil.process('input')
    expect(result).toBe('expected')
  })
})
```

### 4. 页面测试

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import MyPage from '@/pages/MyPage'
import { createMockStore } from '../utils/mockStore'

describe('页面测试', () => {
  it('应该正确渲染页面', () => {
    const store = createMockStore()
    render(
      <Provider store={store}>
        <MyPage />
      </Provider>
    )
    
    expect(screen.getByText('页面标题')).toBeTruthy()
  })
})
```

## 模拟 (Mocking) 指南

### 1. Taro API 模拟

```typescript
const mockTaro = {
  request: vi.fn(),
  showToast: vi.fn(),
  navigateTo: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn()
}

Object.defineProperty(globalThis, 'Taro', {
  value: mockTaro,
  writable: true
})
```

### 2. 小程序 API 模拟

```typescript
const mockWx = {
  getUserInfo: vi.fn(),
  login: vi.fn(),
  checkSession: vi.fn()
}

Object.defineProperty(globalThis, 'wx', {
  value: mockWx,
  writable: true
})
```

### 3. Redux Store 模拟

```typescript
import { configureStore } from '@reduxjs/toolkit'

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      // 模拟的reducer
    },
    preloadedState: initialState
  })
}
```

## 测试最佳实践

### 1. 测试命名

- 使用描述性的测试名称
- 使用中文描述测试场景
- 遵循 "应该 + 期望行为" 的格式

```typescript
describe('用户登录功能', () => {
  it('应该在用户名和密码正确时成功登录', () => {
    // 测试代码
  })
  
  it('应该在密码错误时显示错误提示', () => {
    // 测试代码
  })
})
```

### 2. 测试结构

使用 AAA 模式：
- **Arrange**: 准备测试数据和环境
- **Act**: 执行被测试的操作
- **Assert**: 验证结果

```typescript
it('应该正确计算总价', () => {
  // Arrange - 准备
  const items = [{ price: 10 }, { price: 20 }]
  
  // Act - 执行
  const total = calculateTotal(items)
  
  // Assert - 验证
  expect(total).toBe(30)
})
```

### 3. Mock 管理

```typescript
describe('测试组', () => {
  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    // 清理工作
    vi.restoreAllMocks()
  })
})
```

### 4. 异步测试

```typescript
it('应该正确处理异步操作', async () => {
  const promise = asyncFunction()
  await expect(promise).resolves.toBe('expected')
})

it('应该处理异步错误', async () => {
  const promise = asyncFunction()
  await expect(promise).rejects.toThrow('error message')
})
```

## 覆盖率要求

- **语句覆盖率**: >= 80%
- **分支覆盖率**: >= 75%
- **函数覆盖率**: >= 85%
- **行覆盖率**: >= 80%

## 持续集成

测试脚本已配置为支持 CI/CD 环境：

```bash
# CI环境中运行
pnpm run test:run -- --reporter=junit --outputFile=test-results.xml
```

## 调试测试

### 1. 使用 console.log

```typescript
it('调试测试', () => {
  const result = myFunction()
  console.log('调试信息:', result)
  expect(result).toBe('expected')
})
```

### 2. 使用 screen.debug()

```typescript
it('调试组件渲染', () => {
  render(<MyComponent />)
  screen.debug() // 打印当前DOM结构
})
```

### 3. 使用测试UI界面

```bash
pnpm run test:ui
```

在浏览器中打开 `http://localhost:51204/__vitest__/` 进行可视化调试。

## 常见问题

### 1. 模块找不到

确保在 `vitest.config.ts` 中正确配置了路径别名：

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

### 2. Taro API 未定义

确保在测试文件中正确模拟了 Taro API：

```typescript
Object.defineProperty(globalThis, 'Taro', {
  value: mockTaro,
  writable: true
})
```

### 3. Redux 状态问题

使用 Provider 包装组件并提供 mock store：

```typescript
render(
  <Provider store={mockStore}>
    <Component />
  </Provider>
)
```

## 参考资源

- [Vitest 官方文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [Taro 测试指南](https://taro-docs.jd.com/docs/test)
- [Jest Mock 指南](https://jestjs.io/docs/mock-functions)

## 贡献指南

1. 为新功能编写对应的测试用例
2. 确保测试覆盖率达到要求
3. 遵循测试命名和结构规范
4. 提交前运行完整的测试套件

```bash
# 提交前检查
./scripts/test.sh --coverage
```