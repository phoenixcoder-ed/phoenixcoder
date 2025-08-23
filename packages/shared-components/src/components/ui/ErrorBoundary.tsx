import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';

// 错误信息接口
export interface ErrorInfo {
  componentStack?: string;
}

// 错误边界属性接口
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
  className?: string;
}

// 错误回退组件属性接口
export interface ErrorFallbackProps {
  error: Error;
  errorInfo?: ErrorInfo;
  resetError: () => void;
  level?: 'page' | 'section' | 'component';
  className?: string;
}

// 错误边界状态接口
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId?: string;
}

// 默认错误回退组件
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  level = 'component',
  className
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  
  const getTitle = () => {
    switch (level) {
      case 'page':
        return 'Page Error';
      case 'section':
        return 'Section Error';
      default:
        return 'Component Error';
    }
  };
  
  const getDescription = () => {
    switch (level) {
      case 'page':
        return 'An error occurred while loading this page. Please try refreshing or go back to the home page.';
      case 'section':
        return 'An error occurred in this section. You can try refreshing or continue using other parts of the application.';
      default:
        return 'An error occurred in this component. Please try again.';
    }
  };
  
  const getSize = () => {
    switch (level) {
      case 'page':
        return 'xl' as const;
      case 'section':
        return 'lg' as const;
      default:
        return 'md' as const;
    }
  };
  
  return (
    <div className={cn('w-full', className)}>
      <EmptyState
        type="error"
        size={getSize()}
        icon={<AlertTriangle className="h-12 w-12 text-destructive" />}
        title={getTitle()}
        description={getDescription()}
        primaryAction={{
          label: 'Try again',
          onClick: resetError
        }}
        secondaryAction={level === 'page' ? {
          label: 'Go home',
          onClick: () => window.location.href = '/'
        } : undefined}
      >
        {/* 错误详情 */}
        <div className="mt-4 w-full max-w-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-muted-foreground"
          >
            <Bug className="h-4 w-4 mr-2" />
            {showDetails ? 'Hide' : 'Show'} error details
            {showDetails ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
          
          {showDetails && (
            <div className="mt-3 p-4 bg-muted rounded-lg text-left">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-destructive mb-1">
                    Error Message:
                  </h4>
                  <p className="text-sm font-mono text-muted-foreground break-words">
                    {error.message}
                  </p>
                </div>
                
                {error.stack && (
                  <div>
                    <h4 className="text-sm font-semibold text-destructive mb-1">
                      Stack Trace:
                    </h4>
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
                
                {errorInfo?.componentStack && (
                  <div>
                    <h4 className="text-sm font-semibold text-destructive mb-1">
                      Component Stack:
                    </h4>
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </EmptyState>
    </div>
  );
};

// 简单错误回退组件
const SimpleErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  className
}) => (
  <div className={cn(
    'flex flex-col items-center justify-center p-6 text-center border border-destructive/20 rounded-lg bg-destructive/5',
    className
  )}>
    <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
    <h3 className="text-lg font-semibold text-destructive mb-2">
      Something went wrong
    </h3>
    <p className="text-sm text-muted-foreground mb-4 max-w-md">
      {error.message || 'An unexpected error occurred'}
    </p>
    <Button size="sm" onClick={resetError}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Try again
    </Button>
  </div>
);

// 内联错误回退组件
const InlineErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  className
}) => (
  <div className={cn(
    'flex items-center justify-between p-3 text-sm border border-destructive/20 rounded bg-destructive/5',
    className
  )}>
    <div className="flex items-center space-x-2">
      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
      <span className="text-destructive font-medium">Error:</span>
      <span className="text-muted-foreground truncate">
        {error.message || 'Something went wrong'}
      </span>
    </div>
    <Button size="sm" variant="ghost" onClick={resetError}>
      <RefreshCw className="h-3 w-3" />
    </Button>
  </div>
);

// 错误边界主组件
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }
  
  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const info: ErrorInfo = {
      componentStack: errorInfo.componentStack || undefined
    };
    
    this.setState({
      errorInfo: info
    });
    
    // 调用错误处理回调
    this.props.onError?.(error, info);
    
    // 在开发环境下打印错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught An Error');
      console.error('Error:', error);
      console.error('Error Info:', info);
      console.groupEnd();
    }
  }
  
  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    // 如果之前有错误，现在需要检查是否应该重置
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys) {
        // 检查 resetKeys 是否发生变化
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          prevProps.resetKeys?.[index] !== key
        );
        
        if (hasResetKeyChanged) {
          this.resetError();
        }
      }
    }
    
    // 如果启用了 resetOnPropsChange，检查 props 是否发生变化
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }
  }
  
  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }
  
  resetError = () => {
    this.props.onReset?.();
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: undefined
    });
  };
  
  override render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback: Fallback, level = 'component', className, isolate } = this.props;
    
    if (hasError && error) {
      const fallbackProps: ErrorFallbackProps = {
        error,
        errorInfo: errorInfo || undefined,
        resetError: this.resetError,
        level,
        className
      };
      
      if (Fallback) {
        return <Fallback {...fallbackProps} />;
      }
      
      return <DefaultErrorFallback {...fallbackProps} />;
    }
    
    if (isolate) {
      return (
        <div className={className}>
          {children}
        </div>
      );
    }
    
    return children;
  }
}

// 错误边界 Hook
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);
  
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return { captureError, resetError };
};

// 导出组件和类型
export {
  DefaultErrorFallback,
  SimpleErrorFallback,
  InlineErrorFallback
};

export default ErrorBoundary;