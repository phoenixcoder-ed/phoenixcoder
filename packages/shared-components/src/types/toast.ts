// Toast 属性类型
export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: ToastType;
  duration?: number;
  onClose?: () => void;
}

// Toast 类型
export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

// Toast 配置类型
export interface ToastConfig {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  duration: number;
  maxToasts: number;
  closeButton: boolean;
}