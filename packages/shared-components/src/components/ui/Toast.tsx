import React from 'react';
import { cn } from '../../utils/cn';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  onClose?: () => void;
  duration?: number;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', onClose, duration = 5000, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            onClose?.();
          }, 300); // 等待动画完成
        }, duration);

        return () => clearTimeout(timer);
      }
      return undefined;
    }, [duration, onClose]);

    const toastVariants = {
      default: 'bg-background text-foreground border-border',
      destructive: 'bg-destructive text-destructive-foreground border-destructive',
      success: 'bg-green-500 text-white border-green-500',
      warning: 'bg-yellow-500 text-white border-yellow-500',
      info: 'bg-blue-500 text-white border-blue-500',
    };

    const baseClasses = 'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all';
    const variantClasses = toastVariants[variant];
    const visibilityClasses = isVisible ? 'animate-in slide-in-from-right-full' : 'animate-out slide-out-to-right-full';

    if (!isVisible && duration > 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses, visibilityClasses, className)}
        {...props}
      >
        <div className="grid gap-1">
          {children}
        </div>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
          >
            <span className="sr-only">Close</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

const ToastTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm font-semibold', className)}
      {...props}
    />
  )
);

ToastTitle.displayName = 'ToastTitle';

const ToastDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm opacity-90', className)}
      {...props}
    />
  )
);

ToastDescription.displayName = 'ToastDescription';

// Toast Action 组件
const ToastAction = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((
  { className, ...props },
  ref
) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-xs font-medium',
      'ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2',
      'focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      'group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30',
      'group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground',
      'group-[.destructive]:focus:ring-destructive',
      className
    )}
    {...props}
  />
));

ToastAction.displayName = 'ToastAction';

// Toast Close 组件
const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((
  { className, ...props },
  ref
) => (
  <button
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity',
      'hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
      className
    )}
    {...props}
  >
    <span className="sr-only">Close</span>
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
));

ToastClose.displayName = 'ToastClose';

// Toast Provider 组件
const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="toast-provider">
      {children}
    </div>
  );
};

// Toast Viewport 组件
const ToastViewport = React.forwardRef<HTMLOListElement, React.HTMLAttributes<HTMLOListElement>>((
  { className, ...props },
  ref
) => (
  <ol
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
));

ToastViewport.displayName = 'ToastViewport';

export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport };