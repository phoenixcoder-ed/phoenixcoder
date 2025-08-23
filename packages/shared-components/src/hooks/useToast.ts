import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
}

// Toast 管理 Hook
export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      variant: 'default',
      duration: 5000,
      ...toast,
    };

    setState(prev => ({
      toasts: [...prev.toasts, newToast],
    }));

    // 自动移除
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setState(prev => ({
      toasts: prev.toasts.filter(toast => toast.id !== id),
    }));
  }, []);

  const clearToasts = useCallback(() => {
    setState({ toasts: [] });
  }, []);

  // 便捷方法
  const success = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({
      description: message,
      variant: 'success',
      ...options,
    });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({
      description: message,
      variant: 'error',
      duration: 0, // 错误消息不自动消失
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({
      description: message,
      variant: 'warning',
      ...options,
    });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({
      description: message,
      variant: 'info',
      ...options,
    });
  }, [addToast]);

  return {
    toasts: state.toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
}