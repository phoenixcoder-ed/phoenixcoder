import React from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

// 弹出框组件属性接口
export interface PopoverProps {
  children?: React.ReactNode;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  content?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  sticky?: 'partial' | 'always';
  hideWhenDetached?: boolean;
  avoidCollisions?: boolean;
  modal?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  showArrow?: boolean;
  arrowSize?: number;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animation?: 'none' | 'fade' | 'scale' | 'slide';
  animationDuration?: number;
  disabled?: boolean;
  asChild?: boolean;
}

// 弹出框内容属性接口
export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showArrow?: boolean;
  arrowSize?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
  onFocusOutside?: (event: FocusEvent) => void;
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void;
}

// 弹出框触发器属性接口
export interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

// 变体配置
const variantConfig = {
  default: 'bg-popover text-popover-foreground border border-border shadow-md',
  outline: 'bg-background text-foreground border-2 border-border shadow-sm',
  ghost: 'bg-background/80 backdrop-blur-sm text-foreground border border-border/50 shadow-lg',
  destructive: 'bg-destructive text-destructive-foreground border border-destructive shadow-md'
};

// 尺寸配置
const sizeConfig = {
  sm: 'p-3 text-sm max-w-xs',
  md: 'p-4 text-sm max-w-sm',
  lg: 'p-6 text-base max-w-md',
  xl: 'p-8 text-base max-w-lg'
};

// 动画配置
const animationConfig = {
  none: '',
  fade: 'animate-in fade-in-0 zoom-in-95',
  scale: 'animate-in fade-in-0 zoom-in-95',
  slide: 'animate-in slide-in-from-top-2'
};

// 退出动画配置
const exitAnimationConfig = {
  none: '',
  fade: 'animate-out fade-out-0 zoom-out-95',
  scale: 'animate-out fade-out-0 zoom-out-95',
  slide: 'animate-out slide-out-to-top-2'
};

// 弹出框上下文
interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  side: PopoverProps['side'];
  align: PopoverProps['align'];
  sideOffset: number;
  alignOffset: number;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

const usePopover = () => {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error('usePopover must be used within a Popover');
  }
  return context;
};

// 弹出框根组件
export const Popover: React.FC<PopoverProps> = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  alignOffset = 0,
  modal = false,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  disabled = false
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (disabled) return;
    
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [controlledOpen, onOpenChange, disabled]);
  
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
  
  // 外部点击处理
  React.useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      
      if (
        contentRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      
      setOpen(false);
    };
    
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, closeOnOutsideClick, setOpen]);
  
  const contextValue: PopoverContextValue = {
    open,
    setOpen,
    triggerRef,
    contentRef,
    side,
    align,
    sideOffset,
    alignOffset
  };
  
  return (
    <PopoverContext.Provider value={contextValue}>
      <div className="relative inline-block">
        {children}
      </div>
      {modal && open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
      )}
    </PopoverContext.Provider>
  );
};

// 弹出框触发器组件
export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>((
  { children, className, asChild = false, ...props },
  ref
) => {
  const { open, setOpen, triggerRef } = usePopover();
  
  const handleClick = () => {
    setOpen(!open);
  };
  
  const triggerProps = {
    ref: (node: HTMLButtonElement) => {
      (triggerRef as React.MutableRefObject<HTMLButtonElement>).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    onClick: handleClick,
    'aria-expanded': open,
    'aria-haspopup': 'dialog',
    'data-state': open ? 'open' : 'closed',
    ...props
  };
  
  if (asChild) {
    return React.cloneElement(
      React.Children.only(children) as React.ReactElement,
      triggerProps as any
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
      {...(triggerProps as any)}
    >
      {children}
    </button>
  );
});

PopoverTrigger.displayName = 'PopoverTrigger';

// 弹出框内容组件
export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>((
  {
    children,
    className,
    variant = 'default',
    size = 'md',
    showArrow = false,
    arrowSize = 8,
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    alignOffset = 0,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    ...props
  },
  ref
) => {
  const { open, setOpen, triggerRef, contentRef } = usePopover();
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  
  // 计算位置
  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    let x = 0;
    let y = 0;
    
    // 计算主轴位置
    switch (side) {
      case 'top':
        y = triggerRect.top - contentRect.height - sideOffset;
        break;
      case 'bottom':
        y = triggerRect.bottom + sideOffset;
        break;
      case 'left':
        x = triggerRect.left - contentRect.width - sideOffset;
        break;
      case 'right':
        x = triggerRect.right + sideOffset;
        break;
    }
    
    // 计算交叉轴位置
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          x = triggerRect.left + alignOffset;
          break;
        case 'center':
          x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2 + alignOffset;
          break;
        case 'end':
          x = triggerRect.right - contentRect.width + alignOffset;
          break;
      }
    } else {
      switch (align) {
        case 'start':
          y = triggerRect.top + alignOffset;
          break;
        case 'center':
          y = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2 + alignOffset;
          break;
        case 'end':
          y = triggerRect.bottom - contentRect.height + alignOffset;
          break;
      }
    }
    
    // 边界检测和调整
    x = Math.max(8, Math.min(x, viewport.width - contentRect.width - 8));
    y = Math.max(8, Math.min(y, viewport.height - contentRect.height - 8));
    
    setPosition({ x, y });
  }, [side, align, sideOffset, alignOffset]);
  
  // 位置更新
  React.useEffect(() => {
    if (!open) return;
    
    calculatePosition();
    
    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, calculatePosition]);
  
  if (!open) return null;
  
  return (
    <div
      ref={(node) => {
        if (node) {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn(
        'fixed z-50 rounded-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        variantConfig[variant],
        sizeConfig[size],
        className
      )}
      style={{
        left: position.x,
        top: position.y
      }}
      data-state={open ? 'open' : 'closed'}
      data-side={side}
      data-align={align}
      {...props}
    >
      {children}
      
      {/* 箭头 */}
      {showArrow && (
        <div
          className={cn(
            'absolute border-l border-t border-border bg-popover',
            'h-2 w-2 rotate-45',
            side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
            side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
            side === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
            side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2'
          )}
          style={{
            width: arrowSize,
            height: arrowSize
          }}
        />
      )}
    </div>
  );
});

PopoverContent.displayName = 'PopoverContent';

// 弹出框关闭按钮
export const PopoverClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((
  { children, className, ...props },
  ref
) => {
  const { setOpen } = usePopover();
  
  return (
    <button
      ref={ref}
      className={cn(
        'absolute right-4 top-4 rounded-sm opacity-70',
        'ring-offset-background transition-opacity',
        'hover:opacity-100 focus:outline-none focus:ring-2',
        'focus:ring-ring focus:ring-offset-2',
        'disabled:pointer-events-none',
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    >
      {children || <X className="h-4 w-4" />}
      <span className="sr-only">Close</span>
    </button>
  );
});

PopoverClose.displayName = 'PopoverClose';

// 简单弹出框组件
export const SimplePopover: React.FC<{
  trigger: React.ReactNode;
  content: React.ReactNode;
  side?: PopoverProps['side'];
  align?: PopoverProps['align'];
  className?: string;
}> = ({ trigger, content, side, align, className }) => {
  return (
    <Popover side={side} align={align}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className={className}>
        {content}
      </PopoverContent>
    </Popover>
  );
};