/**
 * 前端测试Mock配置
 * 
 * 提供API请求、组件和外部服务的模拟功能
 */

import { vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { generateTestData, UserFactory, TaskFactory, ApplicationFactory, ReviewFactory, NotificationFactory } from './factories';

// API基础URL
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

// 生成测试数据
const testData = generateTestData('marketplace', 'medium');

// MSW服务器设置
export const server = setupServer(
  // 用户相关API
  http.get(`${API_BASE_URL}/users`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    
    let filteredUsers = testData.users;
    if (search) {
      filteredUsers = testData.users.filter(user => 
        user.username.includes(search) || 
        user.fullName.includes(search) ||
        user.email.includes(search)
      );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      data: paginatedUsers,
      total: filteredUsers.length,
      page,
      limit,
      totalPages: Math.ceil(filteredUsers.length / limit)
    });
  }),
  
  http.get(`${API_BASE_URL}/users/:id`, ({ params }) => {
    const { id } = params;
    const user = testData.users.find(u => u.id === id);
    
    if (!user) {
      return HttpResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    
    return HttpResponse.json({ data: user });
  }),
  
  http.post(`${API_BASE_URL}/users`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newUser = new UserFactory().build(body);
    testData.users.push(newUser);

    return HttpResponse.json({ data: newUser }, { status: 201 });
  }),
  
  http.put(`${API_BASE_URL}/users/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Record<string, unknown>;
    const userIndex = testData.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return HttpResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    testData.users[userIndex] = { ...testData.users[userIndex], ...body };

    return HttpResponse.json({ data: testData.users[userIndex] });
  }),
  
  http.delete(`${API_BASE_URL}/users/:id`, ({ params }) => {
    const { id } = params;
    const userIndex = testData.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return HttpResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    
    testData.users.splice(userIndex, 1);
    
    return new HttpResponse(null, { status: 204 });
  }),
  
  // 任务相关API
  http.get(`${API_BASE_URL}/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search') || '';
    
    let filteredTasks = testData.tasks;
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    if (priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === priority);
    }
    
    if (search) {
      filteredTasks = filteredTasks.filter(task => 
        task.title.includes(search) || 
        task.description.includes(search) ||
        task.tags.some(tag => tag.includes(search))
      );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      data: paginatedTasks,
      total: filteredTasks.length,
      page,
      limit,
      totalPages: Math.ceil(filteredTasks.length / limit)
    });
  }),
  
  http.get(`${API_BASE_URL}/tasks/:id`, ({ params }) => {
    const { id } = params;
    const task = testData.tasks.find(t => t.id === id);
    
    if (!task) {
      return HttpResponse.json({ error: '任务不存在' }, { status: 404 });
    }
    
    return HttpResponse.json({ data: task });
  }),
  
  http.post(`${API_BASE_URL}/tasks`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newTask = new TaskFactory().build(body);
    testData.tasks.push(newTask);

    return HttpResponse.json({ data: newTask }, { status: 201 });
  }),
  
  // 申请相关API
  http.get(`${API_BASE_URL}/applications`, ({ request }) => {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');
    const applicantId = url.searchParams.get('applicantId');
    
    let filteredApplications = (testData as any).applications || [];
    
    if (taskId) {
      filteredApplications = filteredApplications.filter((app: any) => app.taskId === taskId);
    }
    
    if (applicantId) {
      filteredApplications = filteredApplications.filter((app: any) => app.applicantId === applicantId);
    }
    
    return HttpResponse.json({ data: filteredApplications });
  }),
  
  http.post(`${API_BASE_URL}/applications`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newApplication = new ApplicationFactory().build(body);
    ((testData as any).applications = (testData as any).applications || []).push(newApplication);

    return HttpResponse.json({ data: newApplication }, { status: 201 });
  }),
  
  // 评价相关API
  http.get(`${API_BASE_URL}/reviews`, ({ request }) => {
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');
    const revieweeId = url.searchParams.get('revieweeId');
    
    let filteredReviews = (testData as any).reviews || [];
    
    if (taskId) {
      filteredReviews = filteredReviews.filter((review: any) => review.taskId === taskId);
    }
    
    if (revieweeId) {
      filteredReviews = filteredReviews.filter((review: any) => review.revieweeId === revieweeId);
    }
    
    return HttpResponse.json({ data: filteredReviews });
  }),
  
  http.post(`${API_BASE_URL}/reviews`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newReview = new ReviewFactory().build(body);
    ((testData as any).reviews = (testData as any).reviews || []).push(newReview);

    return HttpResponse.json({ data: newReview }, { status: 201 });
  }),
  
  // 通知相关API
  http.get(`${API_BASE_URL}/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const isRead = url.searchParams.get('isRead');
    
    let filteredNotifications = (testData as any).notifications || [];
    
    if (userId) {
      filteredNotifications = filteredNotifications.filter((notif: any) => notif.userId === userId);
    }
    
    if (isRead !== null) {
      filteredNotifications = filteredNotifications.filter((notif: any) => 
        notif.isRead === (isRead === 'true')
      );
    }
    
    return HttpResponse.json({ data: filteredNotifications });
  }),
  
  http.put(`${API_BASE_URL}/notifications/:id/read`, ({ params }) => {
    const { id } = params;
    const notifications = (testData as any).notifications || [];
    const notificationIndex = notifications.findIndex((n: any) => n.id === id);
    if (notificationIndex === -1) {
      return HttpResponse.json({ error: '通知不存在' }, { status: 404 });
    }
    
    notifications[notificationIndex].isRead = true;
    
    return HttpResponse.json({ data: notifications[notificationIndex] });
  }),
  
  // 统计相关API
  http.get(`${API_BASE_URL}/stats/dashboard`, () => {
    const stats = {
      totalUsers: testData.users.length,
      activeUsers: testData.users.filter(u => u.isActive).length,
      totalTasks: testData.tasks.length,
      pendingTasks: testData.tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: testData.tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: testData.tasks.filter(t => t.status === 'completed').length,
      totalApplications: (testData as any).applications?.length || 0,
      pendingApplications: (testData as any).applications?.filter((a: any) => a.status === 'pending').length || 0,
      totalReviews: (testData as any).reviews?.length || 0,
      averageRating: (testData as any).reviews?.reduce((sum: number, r: any) => sum + r.rating, 0) / (testData as any).reviews?.length || 0
    };
    
    return HttpResponse.json({ data: stats });
  }),
  
  // 认证相关API
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json() as any;
    
    // 模拟登录验证
    if (email === 'admin@test.com' && password === 'password') {
      const adminUser = testData.users.find(u => u.userType === 'admin') || UserFactory.createAdmin();
      
      return HttpResponse.json({
        data: {
          user: adminUser,
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token'
        }
      });
    }
    
    return HttpResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
  }),
  
  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: '退出登录成功' });
  }),
  
  http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const adminUser = testData.users.find(u => u.userType === 'admin') || UserFactory.createAdmin();
    
    return HttpResponse.json({ data: adminUser });
  }),
  
  // 文件上传API
  http.post(`${API_BASE_URL}/upload`, () => {
    return HttpResponse.json({
      data: {
        url: 'https://example.com/uploads/mock-file.jpg',
        filename: 'mock-file.jpg',
        size: 1024000
      }
    });
  }),
  
  // 错误处理
  http.get(`${API_BASE_URL}/error/500`, () => {
    return HttpResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }),
  
  http.get(`${API_BASE_URL}/error/timeout`, () => {
    return HttpResponse.json({ data: 'success' }, { 
      status: 200,
      headers: { 'X-Delay': '10000' } // 模拟延迟标记
    });
  })
);

// React Router Mock
export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
    Routes: ({ children }: { children: React.ReactNode }) => children,
    Route: ({ element }: { element: React.ReactNode }) => element
  };
});

// Ant Design组件Mock
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
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
      info: vi.fn(),
      open: vi.fn()
    },
    Modal: {
      ...(actual.Modal as any),
      confirm: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    }
  };
});

// HTTP客户端Mock
export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  request: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn()
    },
    response: {
      use: vi.fn(),
      eject: vi.fn()
    }
  },
  defaults: {
    headers: {
      common: {},
      get: {},
      post: {},
      put: {},
      delete: {},
      patch: {}
    },
    timeout: 5000,
    baseURL: API_BASE_URL
  }
};

vi.mock('axios', () => ({
  default: mockAxios,
  ...mockAxios
}));

// 本地存储Mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// 浏览器API Mock
Object.defineProperty(window, 'location', {
  value: {
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
  },
  writable: true
});

// ResizeObserver Mock
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// IntersectionObserver Mock
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// matchMedia Mock
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
});

// 文件API Mock
(global as any).File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  
  constructor(bits: (string | ArrayBuffer | ArrayBufferView)[], filename: string, options: { type?: string; lastModified?: number } = {}) {
    this.name = filename;
    this.size = bits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : bit.byteLength || 0), 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

(global as any).FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: Error | null = null;
  readyState: number = 0;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onloadend: ((event: ProgressEvent<FileReader>) => void) | null = null;
  
  readAsText(file: File) {
    setTimeout(() => {
      this.result = 'mock file content';
      this.readyState = 2;
      const event = { target: this } as unknown as ProgressEvent<FileReader>;
      if (this.onload) this.onload(event);
      if (this.onloadend) this.onloadend(event);
    }, 0);
  }
  
  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=';
      this.readyState = 2;
      const event = { target: this } as unknown as ProgressEvent<FileReader>;
      if (this.onload) this.onload(event);
      if (this.onloadend) this.onloadend(event);
    }, 0);
  }
  
  abort() {
    this.readyState = 2;
  }
};

// 剪贴板API Mock
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue('mock clipboard text')
  },
  writable: true
});

// 网络状态Mock
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
});

// 用户代理Mock
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  writable: true
});

// 测试工具函数
export const testUtils = {
  /**
   * 等待异步操作完成
   */
  async waitFor(callback: () => boolean | Promise<boolean>, timeout = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const result = await callback();
        if (result) return;
      } catch (error) {
        // 继续等待
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`等待超时: ${timeout}ms`);
  },
  
  /**
   * 模拟用户输入
   */
  async userType(element: HTMLElement, text: string, delay = 0): Promise<void> {
    for (const char of text) {
      element.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
      element.dispatchEvent(new KeyboardEvent('keypress', { key: char }));
      
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      element.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },
  
  /**
   * 模拟用户点击
   */
  userClick(element: HTMLElement): void {
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  },
  
  /**
   * 模拟表单提交
   */
  submitForm(form: HTMLFormElement): void {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  },
  
  /**
   * 重置所有Mock
   */
  resetAllMocks(): void {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    sessionStorageMock.clear.mockClear();
  },
  
  /**
   * 模拟网络请求延迟
   */
  async mockNetworkDelay(ms = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * 模拟网络错误
   */
  mockNetworkError(message = '网络错误'): Error {
    return new Error(message);
  },
  
  /**
   * 创建模拟的React组件
   */
  createMockComponent(name: string, props: Record<string, unknown> = {}) {
    return vi.fn().mockImplementation((componentProps: Record<string, unknown>) => {
      return {
        type: name,
        props: { ...props, ...componentProps },
        children: componentProps.children || null
      };
    });
  }
};

// 导出Mock相关的类型和函数
export {
  localStorageMock,
  sessionStorageMock,
  testData
};

// 类型定义
export interface MockedAxios {
  get: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  post: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  put: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  delete: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  patch: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  request: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  create: MockedFunction<(...args: unknown[]) => MockedAxios>;
  defaults: Record<string, unknown>;
  interceptors: {
    request: { use: MockedFunction<(...args: unknown[]) => unknown> };
    response: { use: MockedFunction<(...args: unknown[]) => unknown> };
  };
}
export type TestUtils = typeof testUtils;