import * as React from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

// 对话框组件属性接口
export interface DialogProps {
  children?: React.ReactNode;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  preventScroll?: boolean;
}

// 对话框内容属性接口
export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  showClose?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void;
}

// 对话框触发器属性接口
export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

// 对话框头部属性接口
export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

// 对话框标题属性接口
export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

// 对话框描述属性接口
export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
  className?: string;
}

// 对话框底部属性接口
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  justify?: 'start' | 'center' | 'end' | 'between';
}

// 尺寸配置
const sizeConfig = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4'
};

// 位置配置
const positionConfig = {
  center: 'items-center justify-center',
  top: 'items-start justify-center pt-16',
  bottom: 'items-end justify-center pb-16'
};

// 对话框上下文
interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog');
  }
  return context;
};

// 对话框根组件
export const Dialog: React.FC<DialogProps> = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  preventScroll = true
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [controlledOpen, onOpenChange]);
  
  // 防止滚动
  React.useEffect(() => {
    if (!open || !preventScroll) return;
    
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [open, preventScroll]);
  
  // 键盘事件处理
  React.useEffect(() => {
    if (!open || !closeOnEscape) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEscape, setOpen]);
  
  const contextValue: DialogContextValue = {
    open,
    setOpen
  };
  
  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {modal && open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
      )}
    </DialogContext.Provider>
  );
};

// 对话框触发器组件
export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>((
  { children, className, asChild = false, ...props },
  ref
) => {
  const { open, setOpen } = useDialog();
  
  const handleClick = () => {
    setOpen(!open);
  };
  
  const triggerProps = {
    ref,
    onClick: handleClick,
    'aria-expanded': open,
    'aria-haspopup': 'dialog' as const,
    'data-state': open ? 'open' : 'closed',
    ...props
  };
  
  if (asChild) {
    return React.cloneElement(
      React.Children.only(children) as React.ReactElement,
      triggerProps
    );
  }
  
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-md text-sm font-medium',
        'transition-colors focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...triggerProps}
    >
      {children}
    </button>
  );
});

DialogTrigger.displayName = 'DialogTrigger';

// 对话框内容组件
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>((
  {
    children,
    className,
    size = 'md',
    position = 'center',
    showClose = true,
    onEscapeKeyDown,
    onPointerDownOutside,
    onInteractOutside,
    ...props
  },
  ref
) => {
  const { open, setOpen } = useDialog();
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // 外部点击处理
  React.useEffect(() => {
    if (!open) return;
    
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      
      if (contentRef.current?.contains(target)) {
        return;
      }
      
      onPointerDownOutside?.(event);
      onInteractOutside?.(event);
      setOpen(false);
    };
    
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, onPointerDownOutside, onInteractOutside, setOpen]);
  
  if (!open) return null;
  
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        positionConfig[position]
      )}
    >
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          'relative w-full rounded-lg border bg-background p-6 shadow-lg',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          sizeConfig[size],
          className
        )}
        data-state={open ? 'open' : 'closed'}
        {...props}
      >
        {children}
        
        {/* 关闭按钮 */}
        {showClose && (
          <button
            className={cn(
              'absolute right-4 top-4 rounded-sm opacity-70',
              'ring-offset-background transition-opacity',
              'hover:opacity-100 focus:outline-none focus:ring-2',
              'focus:ring-ring focus:ring-offset-2',
              'disabled:pointer-events-none'
            )}
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    </div>
  );
});

DialogContent.displayName = 'DialogContent';

// 对话框头部组件
export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>((
  { children, className, ...props },
  ref
) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 text-center sm:text-left',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

DialogHeader.displayName = 'DialogHeader';

// 对话框标题组件
export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>((
  { children, className, level = 2, ...props },
  ref
) => {
  const Component = `h${level}` as keyof React.JSX.IntrinsicElements;
  
  return React.createElement(
    Component,
    {
      ref: ref as any,
      className: cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      ),
      ...props
    },
    children
  );
});

DialogTitle.displayName = 'DialogTitle';

// 对话框描述组件
export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>((
  { children, className, ...props },
  ref
) => {
  return (
    <p
      ref={ref}
      className={cn(
        'text-sm text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
});

DialogDescription.displayName = 'DialogDescription';

// 对话框底部组件
export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>((
  { children, className, justify = 'end', ...props },
  ref
) => {
  const justifyConfig = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:space-x-2',
        justifyConfig[justify],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

DialogFooter.displayName = 'DialogFooter';