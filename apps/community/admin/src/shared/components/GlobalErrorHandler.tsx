import React, { Component, ErrorInfo, ReactNode } from 'react';

import { useNavigate } from 'react-router-dom';

import { logger } from '@/shared/utils/logger';

import {
  UnauthorizedPage,
  ForbiddenPage,
  NotFoundPage,
  ServerErrorPage,
  NetworkErrorPage,
  GenericErrorPage,
} from './ErrorPages';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface HttpError {
  status?: number;
  response?: { status?: number };
  message?: string;
  config?: { url?: string };
  code?: string;
}

// 错误边界类组件
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Global Error Boundary caught an error:', error, errorInfo);

    // 记录错误到监控系统
    this.logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // 这里可以集成错误监控服务，如 Sentry
    logger.error('Error logged to monitoring service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  };

  render() {
    if (this.state.hasError) {
      return <GenericErrorPage error={this.state.error || undefined} />;
    }

    return this.props.children;
  }
}

// HTTP 错误处理器
export const handleHttpError = (
  error: HttpError,
  navigate: ReturnType<typeof useNavigate>
) => {
  const status = error?.status || error?.response?.status;
  const currentPath = window.location.pathname;

  logger.error('HTTP Error:', {
    status,
    message: error?.message,
    url: error?.config?.url,
    currentPath,
    timestamp: new Date().toISOString(),
  });

  // 对于登录页面的400错误，不进行重定向，让页面自己处理
  if (status === 400 && currentPath === '/login') {
    logger.debug('登录页面400错误，不进行重定向，由页面自己处理');
    return;
  }

  switch (status) {
    case 401:
      // 认证失败，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
      break;

    case 403:
      // 权限不足，显示禁止访问页面
      navigate('/error/forbidden', { replace: true });
      break;

    case 404: {
      // 页面未找到
      navigate('/error/not-found', { replace: true });
      break;
    }

    case 500:
    case 502:
    case 503:
    case 504:
      // 服务器错误
      navigate('/error/server-error', { replace: true });
      break;

    default:
      // 网络错误或其他错误
      if (
        error?.code === 'NETWORK_ERROR' ||
        error?.code === 'REQUEST_ABORTED' ||
        !navigator.onLine ||
        (error?.message && error.message.includes('网络连接失败')) ||
        (error?.message && error.message.includes('fetch'))
      ) {
        navigate('/error/network-error', { replace: true });
      } else {
        navigate('/error/generic', {
          replace: true,
          state: { error },
        });
      }
  }
};

// 全局错误处理 Hook
export const useGlobalErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = React.useCallback(
    (error: HttpError) => {
      handleHttpError(error, navigate);
    },
    [navigate]
  );

  return { handleError };
};

// 错误路由组件
export const ErrorRoutes: React.FC = () => {
  const navigate = useNavigate();
  const path = window.location.pathname;

  React.useEffect(() => {
    // 监听全局未捕获的错误
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection:', event.reason);
      handleHttpError(event.reason, navigate);
    };

    const handleError = (event: ErrorEvent) => {
      logger.error('Global error:', event.error);
      navigate('/error/generic', {
        replace: true,
        state: { error: event.error },
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
      window.removeEventListener('error', handleError);
    };
  }, [navigate]);

  // 根据路径渲染对应的错误页面
  switch (path) {
    case '/error/unauthorized':
      return <UnauthorizedPage />;
    case '/error/forbidden':
      return <ForbiddenPage />;
    case '/error/not-found':
      return <NotFoundPage />;
    case '/error/server-error':
      return <ServerErrorPage />;
    case '/error/network-error':
      return <NetworkErrorPage />;
    case '/error/generic':
      return <GenericErrorPage />;
    default:
      return <NotFoundPage />;
  }
};

// 全局错误处理器组件
export const GlobalErrorHandler: React.FC<Props> = ({ children }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default GlobalErrorHandler;
