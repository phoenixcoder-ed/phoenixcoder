import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import { AuthGuard } from '@/shared/components/AuthGuard';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock hooks
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
  };
});

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockNavigate.mockClear();
  });

  it('应该在用户已登录时渲染子组件', async () => {
    // 模拟已登录状态
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'valid-token';
      if (key === 'user') return JSON.stringify({ id: 1, name: 'Test User' });
      return null;
    });

    renderWithRouter(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('应该在用户未登录时重定向到登录页面', async () => {
    // 模拟未登录状态
    mockLocalStorage.getItem.mockReturnValue(null);

    renderWithRouter(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/login?returnUrl=%2Fdashboard',
        { replace: true }
      );
    });
  });

  it('应该在访问公开路由时直接渲染内容', async () => {
    // Mock location to public route
    mockUseLocation.mockReturnValue({
      pathname: '/landing',
      search: '',
    });

    renderWithRouter(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('应该在token过期时清除本地存储并重定向', async () => {
    // 模拟过期的JWT token
    const expiredToken = btoa(
      JSON.stringify({ exp: Date.now() / 1000 - 3600 })
    ); // 1小时前过期
    const fullToken = `header.${expiredToken}.signature`;

    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return fullToken;
      if (key === 'user') return JSON.stringify({ id: 1, name: 'Test User' });
      return null;
    });

    renderWithRouter(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockNavigate).toHaveBeenCalledWith(
        '/login?returnUrl=%2Fdashboard',
        { replace: true }
      );
    });
  });
});
