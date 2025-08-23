/**
 * 管理前端测试环境增强配置
 * 在每个测试文件执行前运行
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'

// 扩展全局类型
declare global {
  var testUtils: {
    mockApi: any;
    mockUserInteraction: any;
    waitFor: (callback: () => void, timeout?: number) => Promise<void>;
    createMockUser: (overrides?: any) => any;
    createMockTask: (overrides?: any) => any;
  };
}

// 扩展 expect 匹配器
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received && received.ownerDocument && received.ownerDocument.body.contains(received)
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass
    }
  },
  
  toHaveClass: (received, className) => {
    const pass = received && received.classList && received.classList.contains(className)
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to have class "${className}"`,
      pass
    }
  },
  
  toBeVisible: (received) => {
    const pass = received && received.style.display !== 'none' && received.style.visibility !== 'hidden'
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be visible`,
      pass
    }
  },
  
  toHaveAttribute: (received, attribute, value?) => {
    const hasAttribute = received && received.hasAttribute && received.hasAttribute(attribute)
    const attributeValue = hasAttribute ? received.getAttribute(attribute) : null
    
    let pass = hasAttribute
    if (value !== undefined) {
      pass = hasAttribute && attributeValue === value
    }
    
    return {
      message: () => {
        if (value !== undefined) {
          return `expected element ${pass ? 'not ' : ''}to have attribute "${attribute}" with value "${value}"`
        }
        return `expected element ${pass ? 'not ' : ''}to have attribute "${attribute}"`
      },
      pass
    }
  }
})

// 模拟 React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to, ...props }: any) => (
    React.createElement('a', { href: to, ...props }, children)
  ),
  NavLink: ({ children, to, ...props }: any) => (
    React.createElement('a', { href: to, ...props }, children)
  ),
  Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }),
  BrowserRouter: ({ children }: any) => children,
  Routes: ({ children }: any) => children,
  Route: ({ element }: any) => element
}))

// 模拟 Ant Design 组件
vi.mock('antd', () => ({
  Button: ({ children, ...props }: any) => 
    React.createElement('button', props, children),
  Input: (props: any) => 
    React.createElement('input', props),
  Form: ({ children, ...props }: any) => 
    React.createElement('form', props, children),
  Table: ({ dataSource, columns, ...props }: any) => 
    React.createElement('table', props, 
      React.createElement('tbody', {},
        dataSource?.map((item: any, index: number) => 
          React.createElement('tr', { key: index },
            columns?.map((col: any, colIndex: number) => 
              React.createElement('td', { key: colIndex }, 
                col.render ? col.render(item[col.dataIndex], item) : item[col.dataIndex]
              )
            )
          )
        )
      )
    ),
  Modal: ({ children, open, ...props }: any) => 
    open ? React.createElement('div', { ...props, 'data-testid': 'modal' }, children) : null,
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn()
  },
  notification: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  Spin: ({ children, spinning, ...props }: any) => 
    React.createElement('div', props, 
      spinning && React.createElement('div', { 'data-testid': 'loading' }),
      children
    ),
  Card: ({ children, title, ...props }: any) => 
    React.createElement('div', props,
      title && React.createElement('div', { 'data-testid': 'card-title' }, title),
      children
    ),
  Select: ({ children, ...props }: any) => 
    React.createElement('select', props, children),
  DatePicker: (props: any) => 
    React.createElement('input', { type: 'date', ...props }),
  Upload: ({ children, ...props }: any) => 
    React.createElement('div', props, children)
}))

// 模拟 API 请求
const mockApiResponse = {
  success: (data: any) => Promise.resolve({ data, code: 200, message: 'success' }),
  error: (message: string, code = 500) => Promise.reject({ message, code }),
  loading: (data: any, delay = 1000) => 
    new Promise(resolve => setTimeout(() => resolve({ data, code: 200, message: 'success' }), delay))
}

// 模拟 fetch
global.fetch = vi.fn()

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// 模拟 sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// 模拟 window.location
const locationMock = {
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn()
}
Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true
})

// 模拟 ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// 模拟 IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// 全局测试工具函数
global.testUtils = {
  // API 模拟
  mockApi: mockApiResponse,
  
  // 用户交互模拟
  mockUserInteraction: {
    click: vi.fn(),
    input: vi.fn(),
    submit: vi.fn(),
    scroll: vi.fn()
  },
  
  // 等待异步操作
  waitFor: async (callback: () => void, timeout = 5000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      try {
        callback()
        return
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    throw new Error(`waitFor timeout after ${timeout}ms`)
  },
  
  // 创建模拟用户
  createMockUser: (overrides = {}) => ({
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides
  }),
  
  // 创建模拟任务
  createMockTask: (overrides = {}) => ({
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'medium',
    assigneeId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides
  })
}

// 环境变量设置
process.env.NODE_ENV = 'test'
process.env.VITE_APP_API_URL = 'http://localhost:8001'

// 模拟 console 方法（可选，用于减少测试输出噪音）
if (process.env.VITEST_SILENT === 'true') {
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}

// 清理函数
afterEach(() => {
  // 清理 React Testing Library
  cleanup()
  
  // 清理所有模拟
  vi.clearAllMocks()
  
  // 重置 localStorage
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  
  // 重置 sessionStorage
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
  
  // 重置 fetch
  if (global.fetch) {
    (global.fetch as any).mockClear()
  }
})

// 测试超时处理
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// 全局错误处理
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

// 导出测试工具
export { mockApiResponse as mockApi }
export const testHelpers = global.testUtils