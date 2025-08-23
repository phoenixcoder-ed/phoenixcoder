import React from 'react';
import { cn } from '../../utils/cn';

// 头部组件属性接口
export interface HeaderProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  variant?: 'default' | 'sticky' | 'fixed' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  border?: boolean;
  shadow?: boolean;
  backdrop?: boolean;
  transparent?: boolean;
  centered?: boolean;
  fullWidth?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  zIndex?: 10 | 20 | 30 | 40 | 50;
}

// 头部内容组件属性接口
export interface HeaderContentProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around';
  align?: 'start' | 'end' | 'center' | 'baseline';
  gap?: 2 | 4 | 6 | 8;
}

// 头部品牌组件属性接口
export interface HeaderBrandProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  href?: string;
  onClick?: () => void;
}

// 头部导航组件属性接口
export interface HeaderNavProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  direction?: 'horizontal' | 'vertical';
  gap?: 2 | 4 | 6 | 8;
}

// 头部操作组件属性接口
export interface HeaderActionsProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  gap?: 2 | 4 | 6 | 8;
}

// 变体配置
const variantConfig = {
  default: 'relative',
  sticky: 'sticky top-0',
  fixed: 'fixed top-0 left-0 right-0',
  floating: 'fixed top-4 left-4 right-4 rounded-lg'
};

// 尺寸配置
const sizeConfig = {
  sm: 'h-12',
  md: 'h-16',
  lg: 'h-20'
};

// 最大宽度配置
const maxWidthConfig = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full'
};

// 内边距配置
const paddingConfig = {
  none: '',
  sm: 'px-4',
  md: 'px-6',
  lg: 'px-8'
};

// 层级配置
const zIndexConfig = {
  10: 'z-10',
  20: 'z-20',
  30: 'z-30',
  40: 'z-40',
  50: 'z-50'
};

// 对齐配置
const justifyConfig = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around'
};

const alignConfig = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline'
};

// 间距配置
const gapConfig = {
  2: 'gap-2',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8'
};

// 方向配置
const directionConfig = {
  horizontal: 'flex-row',
  vertical: 'flex-col'
};

// 头部组件
export const Header: React.FC<HeaderProps> = ({
  children,
  className,
  as: Component = 'header',
  variant = 'default',
  size = 'md',
  border = false,
  shadow = false,
  backdrop = false,
  transparent = false,
  centered = false,
  fullWidth = false,
  maxWidth = 'full',
  padding = 'md',
  zIndex = 40
}) => {
  return (
    <Component
      className={cn(
        'w-full',
        variantConfig[variant],
        sizeConfig[size],
        !transparent && 'bg-background',
        border && 'border-b border-border',
        shadow && 'shadow-sm',
        backdrop && 'backdrop-blur-sm bg-background/80',
        zIndexConfig[zIndex],
        className
      )}
    >
      <div
        className={cn(
          'h-full flex items-center',
          !fullWidth && 'mx-auto',
          !fullWidth && maxWidthConfig[maxWidth],
          paddingConfig[padding],
          centered && 'justify-center'
        )}
      >
        {children}
      </div>
    </Component>
  );
};

// 头部内容组件
export const HeaderContent: React.FC<HeaderContentProps> = ({
  children,
  className,
  as: Component = 'div',
  justify = 'between',
  align = 'center',
  gap = 4
}) => {
  return (
    <Component
      className={cn(
        'flex w-full',
        justifyConfig[justify],
        alignConfig[align],
        gapConfig[gap],
        className
      )}
    >
      {children}
    </Component>
  );
};

// 头部品牌组件
export const HeaderBrand: React.FC<HeaderBrandProps> = ({
  children,
  className,
  as,
  href,
  onClick
}) => {
  const Component = as || (href ? 'a' : onClick ? 'button' : 'div');
  
  return (
    <Component
      className={cn(
        'flex items-center font-semibold text-lg',
        (href || onClick) && 'hover:opacity-80 transition-opacity',
        onClick && 'cursor-pointer',
        className
      )}
      href={href}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};

// 头部导航组件
export const HeaderNav: React.FC<HeaderNavProps> = ({
  children,
  className,
  as: Component = 'nav',
  direction = 'horizontal',
  gap = 6
}) => {
  return (
    <Component
      className={cn(
        'flex',
        directionConfig[direction],
        gapConfig[gap],
        className
      )}
    >
      {children}
    </Component>
  );
};

// 头部操作组件
export const HeaderActions: React.FC<HeaderActionsProps> = ({
  children,
  className,
  as: Component = 'div',
  gap = 4
}) => {
  return (
    <Component
      className={cn(
        'flex items-center',
        gapConfig[gap],
        className
      )}
    >
      {children}
    </Component>
  );
};

// 响应式头部组件
export const ResponsiveHeader: React.FC<HeaderProps & {
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
}> = ({
  children,
  mobileBreakpoint = 'md',
  showMobileMenu = false,
  onMobileMenuToggle,
  ...props
}) => {
  return (
    <Header {...props}>
      <HeaderContent>
        <div className={cn('flex items-center justify-between w-full')}>
          <div className="flex items-center gap-4">
            {children}
          </div>
          
          {/* 移动端菜单按钮 */}
          {onMobileMenuToggle && (
            <button
              className={cn(
                'flex items-center justify-center p-2 rounded-md',
                `${mobileBreakpoint}:hidden`,
                'hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={onMobileMenuToggle}
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {showMobileMenu ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          )}
        </div>
      </HeaderContent>
    </Header>
  );
};

// 简单头部组件
export const SimpleHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}> = ({
  title,
  subtitle,
  actions,
  className
}) => {
  return (
    <Header className={className}>
      <HeaderContent>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && (
          <HeaderActions>
            {actions}
          </HeaderActions>
        )}
      </HeaderContent>
    </Header>
  );
};