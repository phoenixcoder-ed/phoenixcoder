/**
 * 错误边界组件
 * 捕获并处理React组件树中的JavaScript错误
 */

import React, { Component, ReactNode } from 'react';

import {
  Refresh as RefreshIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';
import { Alert, Button, Card, Typography } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 在开发环境下打印错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // 在生产环境下可以发送错误到监控服务
    if (process.env.NODE_ENV === 'production') {
      // 这里可以集成错误监控服务，如 Sentry
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <Card
          sx={{
            p: 3,
            m: 2,
            textAlign: 'center',
            maxWidth: 600,
            mx: 'auto',
            mt: 4,
          }}
        >
          <BugIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />

          <Typography variant="h5" gutterBottom color="error">
            哎呀，出现了一些问题
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            应用遇到了意外错误，请尝试刷新页面或联系技术支持。
          </Typography>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                错误信息：
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{ fontSize: '0.75rem' }}
              >
                {this.state.error.toString()}
              </Typography>

              {this.state.errorInfo && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    组件堆栈：
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </>
              )}
            </Alert>
          )}

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleRetry}
            sx={{ mr: 2 }}
          >
            重试
          </Button>

          <Button variant="outlined" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * Hook：在函数组件中使用错误边界
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback(
    (error: Error, errorInfo?: React.ErrorInfo) => {
      // 在开发环境下打印错误
      if (process.env.NODE_ENV === 'development') {
        console.error('Error caught by useErrorHandler:', error, errorInfo);
      }

      // 在生产环境下发送到监控服务
      if (process.env.NODE_ENV === 'production') {
        // Sentry.captureException(error, { extra: errorInfo });
      }
    },
    []
  );

  return { handleError };
};
