import React from 'react';
import { cn } from '../../utils/cn';

// 侧边栏导航组件属性接口
export interface SidebarProps {
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
export interface SidebarHeaderProps {
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  title?: string;
  subtitle?: string;
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  border?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  sticky?: boolean;
}

// 侧边栏导航组件属性接口
export interface SidebarNavProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// 侧边栏导航组组件属性接口
export interface SidebarNavGroupProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

// 侧边栏导航项组件属性接口
export interface SidebarNavItemProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  href?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  tooltip?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  subItems?: React.ReactNode;
}

// 侧边栏底部组件属性接口
export interface SidebarFooterProps {
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
  sm: 'space-y-1',
  md: 'space-y-2',
  lg: 'space-y-4'
};

// 层级配置
const zIndexConfig = {
  10: 'z-10',
  20: 'z-20',
  30: 'z-30',
  40: 'z-40',
  50: 'z-50'
};

// 侧边栏导航组件
export const Sidebar: React.FC<SidebarProps> = ({
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
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  children,
  className,
  as: Component = 'header',
  title,
  subtitle,
  logo,
  actions,
  border = false,
  padding = 'md',
  sticky = false
}) => {
  const hasContent = title || subtitle || logo || actions;
  
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
      {hasContent ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logo && (
              <div className="flex-shrink-0">
                {logo}
              </div>
            )}
            {(title || subtitle) && (
              <div className="flex flex-col">
                {title && (
                  <h2 className="font-semibold text-lg leading-tight">{title}</h2>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground leading-tight">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </Component>
  );
};

// 侧边栏导航组件
export const SidebarNav: React.FC<SidebarNavProps> = ({
  children,
  className,
  as: Component = 'nav',
  spacing = 'sm',
  padding = 'md'
}) => {
  return (
    <Component
      className={cn(
        'flex-1 overflow-y-auto',
        paddingConfig[padding],
        spacingConfig[spacing],
        className
      )}
    >
      {children}
    </Component>
  );
};

// 侧边栏导航组组件
export const SidebarNavGroup: React.FC<SidebarNavGroupProps> = ({
  children,
  className,
  title,
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
  spacing = 'sm'
}) => {
  const handleToggleCollapse = () => {
    if (onCollapsedChange) {
      onCollapsedChange(!collapsed);
    }
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
          {collapsible && (
            <button
              className="p-1 rounded hover:bg-accent hover:text-accent-foreground"
              onClick={handleToggleCollapse}
              aria-label={collapsed ? 'Expand group' : 'Collapse group'}
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      )}
      
      {!collapsed && (
        <div className={cn(spacingConfig[spacing])}>
          {children}
        </div>
      )}
    </div>
  );
};

// 侧边栏导航项组件
export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  children,
  className,
  as: Component = 'div',
  href,
  icon,
  badge,
  active = false,
  disabled = false,
  onClick,
  tooltip,
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
  subItems
}) => {
  const handleClick = () => {
    if (!disabled) {
      if (collapsible && onCollapsedChange) {
        onCollapsedChange(!collapsed);
      }
      if (onClick) {
        onClick();
      }
    }
  };
  
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        active && 'bg-accent text-accent-foreground',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        !disabled && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
      title={tooltip}
    >
      {icon && (
        <div className="flex-shrink-0">
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        {children}
      </div>
      
      {badge && (
        <div className="flex-shrink-0">
          {badge}
        </div>
      )}
      
      {collapsible && (
        <div className="flex-shrink-0">
          <svg
            className={cn(
              'w-4 h-4 transition-transform',
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
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      )}
    </div>
  );
  
  return (
    <Component>
      {href && !disabled ? (
        <a href={href} className="block">
          {content}
        </a>
      ) : (
        content
      )}
      
      {/* 子项目 */}
      {subItems && !collapsed && (
        <div className="ml-6 mt-1 space-y-1">
          {subItems}
        </div>
      )}
    </Component>
  );
};

// 侧边栏底部组件
export const SidebarFooter: React.FC<SidebarFooterProps> = ({
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
export const ResponsiveSidebar: React.FC<SidebarProps & {
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
    <Sidebar
      {...props}
      variant={isMobile ? mobileVariant : variant}
      collapsible={isMobile ? true : props.collapsible}
      backdrop={isMobile ? true : props.backdrop}
    />
  );
};

// 导航侧边栏组件
export const NavigationSidebar: React.FC<{
  title?: string;
  subtitle?: string;
  logo?: React.ReactNode;
  headerActions?: React.ReactNode;
  navItems: Array<{
    id: string;
    label: string;
    href?: string;
    icon?: React.ReactNode;
    badge?: React.ReactNode;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    subItems?: Array<{
      id: string;
      label: string;
      href?: string;
      active?: boolean;
      disabled?: boolean;
      onClick?: () => void;
    }>;
  }>;
  navGroups?: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      label: string;
      href?: string;
      icon?: React.ReactNode;
      badge?: React.ReactNode;
      active?: boolean;
      disabled?: boolean;
      onClick?: () => void;
    }>;
  }>;
  footer?: React.ReactNode;
  className?: string;
  headerProps?: Partial<SidebarHeaderProps>;
  navProps?: Partial<SidebarNavProps>;
  footerProps?: Partial<SidebarFooterProps>;
} & Omit<SidebarProps, 'children'>> = ({
  title,
  subtitle,
  logo,
  headerActions,
  navItems,
  navGroups,
  footer,
  className,
  headerProps,
  navProps,
  footerProps,
  ...sidebarProps
}) => {
  return (
    <Sidebar {...sidebarProps} className={className}>
      {(title || subtitle || logo || headerActions) && (
        <SidebarHeader
          title={title}
          subtitle={subtitle}
          logo={logo}
          actions={headerActions}
          border
          {...headerProps}
        />
      )}
      
      <SidebarNav {...navProps}>
        {/* 导航组 */}
        {navGroups?.map((group) => (
          <SidebarNavGroup key={group.id} title={group.title}>
            {group.items.map((item) => (
              <SidebarNavItem
                key={item.id}
                href={item.href}
                icon={item.icon}
                badge={item.badge}
                active={item.active}
                disabled={item.disabled}
                onClick={item.onClick}
              >
                {item.label}
              </SidebarNavItem>
            ))}
          </SidebarNavGroup>
        ))}
        
        {/* 导航项 */}
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            href={item.href}
            icon={item.icon}
            badge={item.badge}
            active={item.active}
            disabled={item.disabled}
            onClick={item.onClick}
            collapsible={!!item.subItems}
            subItems={
              item.subItems && (
                <>
                  {item.subItems.map((subItem) => (
                    <SidebarNavItem
                      key={subItem.id}
                      href={subItem.href}
                      active={subItem.active}
                      disabled={subItem.disabled}
                      onClick={subItem.onClick}
                    >
                      {subItem.label}
                    </SidebarNavItem>
                  ))}
                </>
              )
            }
          >
            {item.label}
          </SidebarNavItem>
        ))}
      </SidebarNav>
      
      {footer && (
        <SidebarFooter border {...footerProps}>
          {footer}
        </SidebarFooter>
      )}
    </Sidebar>
  );
};