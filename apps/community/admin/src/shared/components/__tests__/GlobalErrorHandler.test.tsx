import React from 'react';

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { UnauthorizedPage, NotFoundPage } from '@/shared/components/ErrorPages';
import {
  ErrorBoundary,
  handleHttpError,
} from '@/shared/components/GlobalErrorHandler';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 测试组件，用于触发错误
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('测试错误');
  }
  return <div>正常组件</div>;
};

describe('GlobalErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ErrorBoundary', () => {
    it('应该正常渲染子组件', () => {
      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        </BrowserRouter>
      );

      expect(screen.getByText('正常组件')).toBeInTheDocument();
    });

    it('应该捕获错误并显示错误页面', () => {
      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </BrowserRouter>
      );

      expect(screen.getByText('系统异常')).toBeInTheDocument();
      expect(screen.getByText(/系统遇到了一个意外错误/)).toBeInTheDocument();
    });
  });

  describe('handleHttpError', () => {
    it('应该处理401错误并跳转到登录页', () => {
      const error = { status: 401, message: '未授权' };

      handleHttpError(error, mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('应该处理403错误并跳转到禁止访问页', () => {
      const error = { status: 403, message: '禁止访问' };

      handleHttpError(error, mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith('/error/403');
    });

    it('应该处理404错误并跳转到页面未找到', () => {
      const error = { status: 404, message: '页面未找到' };

      handleHttpError(error, mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith('/error/404');
    });

    it('应该处理500错误并跳转到服务器错误页', () => {
      const error = { status: 500, message: '服务器错误' };

      handleHttpError(error, mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith('/error/500');
    });

    it('应该处理网络错误', () => {
      const error = { code: 'NETWORK_ERROR', message: '网络连接失败' };

      handleHttpError(error, mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith('/error/network');
    });

    it('应该处理未知错误', () => {
      const error = { status: 999, message: '未知错误' };

      handleHttpError(error, mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith('/error/generic');
    });
  });
});

describe('ErrorPages', () => {
  it('应该渲染401未授权页面', () => {
    render(
      <BrowserRouter>
        <UnauthorizedPage />
      </BrowserRouter>
    );

    expect(screen.getByText('认证失败')).toBeInTheDocument();
    expect(screen.getByText(/您的登录状态已过期/)).toBeInTheDocument();
  });

  it('应该渲染404页面未找到', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    expect(screen.getByText('页面未找到')).toBeInTheDocument();
    expect(screen.getByText(/您访问的页面不存在/)).toBeInTheDocument();
  });
});
