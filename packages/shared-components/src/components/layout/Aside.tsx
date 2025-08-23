import React from 'react';
import { cn } from '../../utils/cn';

// 侧边栏组件属性接口
export interface AsideProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  position?: 'left' | 'right';
  variant?: 'default' | 'floating' | 'overlay' | 'push';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  border?: boolean;
  shadow?: boolean;
  backdrop?: boolean;
  scrollable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  zIndex?: 10 | 20 | 30 | 40 | 50;
}

// 侧边栏头部组件属性接口
export interface AsideHeaderProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  border?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  sticky?: boolean;
}

// 侧边栏内容组件属性接口
export interface AsideContentProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  scrollable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

// 侧边栏底部组件属性接口
export interface AsideFooterProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  border?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  sticky?: boolean;
}

// 变体配置
const variantConfig = {
  default: 'relative',
  floating: 'absolute rounded-lg',
  overlay: 'fixed',
  push: 'relative'
};

// 尺寸配置
const sizeConfig = {
  sm: 'w-64',
  md: 'w-72',
  lg: 'w-80',
  xl: 'w-96'
};

// 位置配置
const positionConfig = {
  left: {
    default: 'left-0',
    floating: 'left-4',
    overlay: 'left-0 top-0 bottom-0',
    push: 'order-first'
  },
  right: {
    default: 'right-0',
    floating: 'right-4',
    overlay: 'right-0 top-0 bottom-0',
    push: 'order-last'
  }
};

// 内边距配置
const paddingConfig = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

// 间距配置
const spacingConfig = {
  none: 'space-y-0',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6'
};

// 层级配置
const zIndexConfig = {
  10: 'z-10',
  20: 'z-20',
  30: 'z-30',
  40: 'z-40',
  50: 'z-50'
};

// 侧边栏组件
export const Aside: React.FC<AsideProps> = ({
  children,
  className,
  as: Component = 'aside',
  position = 'left',
  variant = 'default',
  size = 'md',
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
  resizable = false,
  minWidth = 200,
  maxWidth = 600,
  defaultWidth,
  border = false,
  shadow = false,
  backdrop = false,
  scrollable = true,
  padding = 'none',
  zIndex = 30
}) => {
  const [width, setWidth] = React.useState(defaultWidth);
  const [isResizing, setIsResizing] = React.useState(false);
  const resizeRef = React.useRef<HTMLDivElement>(null);
  
  // 处理折叠切换
  const handleToggleCollapse = () => {
    if (onCollapsedChange) {
      onCollapsedChange(!collapsed);
    }
  };
  
  // 处理调整大小
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (!resizable) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = resizeRef.current?.offsetWidth || defaultWidth || 288;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = position === 'left' ? e.clientX - startX : startX - e.clientX;
      const newWidth = Math.min(Math.max(startWidth + deltaX, minWidth), maxWidth);
      setWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [resizable, position, minWidth, maxWidth, defaultWidth]);
  
  const positionClasses = positionConfig[position][variant];
  
  const style = width ? { width: `${width}px` } : undefined;
  
  return (
    <>
      {/* 背景遮罩 */}
      {variant === 'overlay' && !collapsed && backdrop && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={handleToggleCollapse}
        />
      )}
      
      <Component
        ref={resizeRef}
        className={cn(
          'h-full flex flex-col',
          variantConfig[variant],
          !collapsed && sizeConfig[size],
          collapsed && 'w-16',
          positionClasses,
          border && (
            position === 'left' ? 'border-r border-border' : 'border-l border-border'
          ),
          shadow && 'shadow-lg',
          backdrop && 'backdrop-blur-sm bg-background/95',
          !backdrop && 'bg-background',
          scrollable && 'overflow-hidden',
          paddingConfig[padding],
          zIndexConfig[zIndex],
          variant === 'overlay' && (
            collapsed ? '-translate-x-full' : 'translate-x-0'
          ),
          'transition-all duration-300 ease-in-out',
          className
        )}
        style={style}
      >
        {children}
        
        {/* 调整大小手柄 */}
        {resizable && !collapsed && (
          <div
            className={cn(
              'absolute top-0 bottom-0 w-1 cursor-col-resize',
              'hover:bg-primary/20 transition-colors',
              position === 'left' ? 'right-0' : 'left-0',
              isResizing && 'bg-primary/40'
            )}
            onMouseDown={handleMouseDown}
          />
        )}
        
        {/* 折叠按钮 */}
        {collapsible && (
          <button
            className={cn(
              'absolute top-4 w-6 h-6 rounded-full',
              'bg-background border border-border',
              'flex items-center justify-center',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors z-10',
              position === 'left' ? '-right-3' : '-left-3'
            )}
            onClick={handleToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={cn(
                'w-3 h-3 transition-transform',
                collapsed && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={position === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
              />
            </svg>
          </button>
        )}
      </Component>
    </>
  );
};

// 侧边栏头部组件
export const AsideHeader: React.FC<AsideHeaderProps> = ({
  children,
  className,
  as: Component = 'header',
  border = false,
  padding = 'md',
  sticky = false
}) => {
  return (
    <Component
      className={cn(
        'flex-shrink-0',
        border && 'border-b border-border',
        paddingConfig[padding],
        sticky && 'sticky top-0 z-10 bg-background',
        className
      )}
    >
      {children}
    </Component>
  );
};

// 侧边栏内容组件
export const AsideContent: React.FC<AsideContentProps> = ({
  children,
  className,
  as: Component = 'div',
  scrollable = true,
  padding = 'md',
  spacing = 'sm'
}) => {
  return (
    <Component
      className={cn(
        'flex-1',
        scrollable && 'overflow-y-auto',
        paddingConfig[padding],
        spacingConfig[spacing],
        className
      )}
    >
      {children}
    </Component>
  );
};

// 侧边栏底部组件
export const AsideFooter: React.FC<AsideFooterProps> = ({
  children,
  className,
  as: Component = 'footer',
  border = false,
  padding = 'md',
  sticky = false
}) => {
  return (
    <Component
      className={cn(
        'flex-shrink-0',
        border && 'border-t border-border',
        paddingConfig[padding],
        sticky && 'sticky bottom-0 z-10 bg-background',
        className
      )}
    >
      {children}
    </Component>
  );
};

// 响应式侧边栏组件
export const ResponsiveAside: React.FC<AsideProps & {
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  mobileVariant?: 'overlay' | 'push';
}> = ({
  mobileBreakpoint = 'lg',
  mobileVariant = 'overlay',
  variant = 'default',
  ...props
}) => {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      const breakpoints = {
        sm: 640,
        md: 768,
        lg: 1024
      };
      setIsMobile(window.innerWidth < breakpoints[mobileBreakpoint]);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);
  
  return (
    <Aside
      {...props}
      variant={isMobile ? mobileVariant : variant}
      collapsible={isMobile ? true : props.collapsible}
      backdrop={isMobile ? true : props.backdrop}
    />
  );
};

// 导航侧边栏组件
export const NavigationAside: React.FC<{
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerProps?: Partial<AsideHeaderProps>;
  contentProps?: Partial<AsideContentProps>;
  footerProps?: Partial<AsideFooterProps>;
} & Omit<AsideProps, 'children'>> = ({
  title,
  children,
  footer,
  className,
  headerProps,
  contentProps,
  footerProps,
  ...asideProps
}) => {
  return (
    <Aside {...asideProps} className={className}>
      {title && (
        <AsideHeader border {...headerProps}>
          <h2 className="font-semibold text-lg">{title}</h2>
        </AsideHeader>
      )}
      
      <AsideContent {...contentProps}>
        {children}
      </AsideContent>
      
      {footer && (
        <AsideFooter border {...footerProps}>
          {footer}
        </AsideFooter>
      )}
    </Aside>
  );
};