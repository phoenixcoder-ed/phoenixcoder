import React from 'react';
import { cn } from '../../utils/cn';

// 导航栏组件属性接口
export interface NavbarProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  variant?: 'default' | 'sticky' | 'fixed' | 'floating';
  position?: 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg';
  border?: boolean;
  shadow?: boolean;
  backdrop?: boolean;
  transparent?: boolean;
  centered?: boolean;
  fullWidth?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  zIndex?: 10 | 20 | 30 | 40 | 50;
}

// 导航栏品牌组件属性接口
export interface NavbarBrandProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  href?: string;
  logo?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

// 导航栏内容组件属性接口
export interface NavbarContentProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end';
  gap?: 'none' | 'sm' | 'md' | 'lg';
}

// 导航栏菜单组件属性接口
export interface NavbarMenuProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  direction?: 'horizontal' | 'vertical';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end';
}

// 导航栏项目组件属性接口
export interface NavbarItemProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

// 导航栏操作组件属性接口
export interface NavbarActionsProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  gap?: 'none' | 'sm' | 'md' | 'lg';
}

// 变体配置
const variantConfig = {
  default: 'relative',
  sticky: 'sticky top-0',
  fixed: 'fixed',
  floating: 'fixed rounded-lg mx-4 mt-4'
};

// 位置配置
const positionConfig = {
  top: {
    default: 'top-0',
    sticky: 'top-0',
    fixed: 'top-0 left-0 right-0',
    floating: 'top-4 left-4 right-4'
  },
  bottom: {
    default: 'bottom-0',
    sticky: 'bottom-0',
    fixed: 'bottom-0 left-0 right-0',
    floating: 'bottom-4 left-4 right-4'
  }
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
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full'
};

// 内边距配置
const paddingConfig = {
  none: '',
  sm: 'px-4',
  md: 'px-6',
  lg: 'px-8'
};

// 间距配置
const gapConfig = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6'
};

// 对齐配置
const justifyConfig = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly'
};

const alignConfig = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end'
};

// 层级配置
const zIndexConfig = {
  10: 'z-10',
  20: 'z-20',
  30: 'z-30',
  40: 'z-40',
  50: 'z-50'
};

// 导航栏组件
export const Navbar: React.FC<NavbarProps> = ({
  children,
  className,
  as: Component = 'nav',
  variant = 'default',
  position = 'top',
  size = 'md',
  border = false,
  shadow = false,
  backdrop = false,
  transparent = false,
  centered = false,
  fullWidth = true,
  maxWidth = 'full',
  padding = 'md',
  zIndex = 40
}) => {
  const positionClasses = positionConfig[position][variant];
  
  return (
    <Component
      className={cn(
        'w-full flex items-center',
        variantConfig[variant],
        positionClasses,
        sizeConfig[size],
        border && 'border-b border-border',
        shadow && 'shadow-md',
        backdrop && 'backdrop-blur-md bg-background/80',
        !backdrop && !transparent && 'bg-background',
        transparent && 'bg-transparent',
        paddingConfig[padding],
        zIndexConfig[zIndex],
        className
      )}
    >
      <div
        className={cn(
          'w-full flex items-center',
          fullWidth ? 'w-full' : maxWidthConfig[maxWidth],
          centered && 'mx-auto'
        )}
      >
        {children}
      </div>
    </Component>
  );
};

// 导航栏品牌组件
export const NavbarBrand: React.FC<NavbarBrandProps> = ({
  children,
  className,
  as: Component = 'div',
  href,
  logo,
  title,
  subtitle
}) => {
  const content = (
    <div className="flex items-center gap-3">
      {logo && (
        <div className="flex-shrink-0">
          {logo}
        </div>
      )}
      {(title || subtitle) && (
        <div className="flex flex-col">
          {title && (
            <span className="font-bold text-lg leading-tight">{title}</span>
          )}
          {subtitle && (
            <span className="text-sm text-muted-foreground leading-tight">
              {subtitle}
            </span>
          )}
        </div>
      )}
      {!logo && !title && !subtitle && children}
    </div>
  );
  
  if (href) {
    return (
      <a
        href={href}
        className={cn(
          'flex items-center hover:opacity-80 transition-opacity',
          className
        )}
      >
        {content}
      </a>
    );
  }
  
  return (
    <Component className={cn('flex items-center', className)}>
      {content}
    </Component>
  );
};

// 导航栏内容组件
export const NavbarContent: React.FC<NavbarContentProps> = ({
  children,
  className,
  as: Component = 'div',
  justify = 'start',
  align = 'center',
  gap = 'md'
}) => {
  return (
    <Component
      className={cn(
        'flex',
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

// 导航栏菜单组件
export const NavbarMenu: React.FC<NavbarMenuProps> = ({
  children,
  className,
  as: Component = 'ul',
  direction = 'horizontal',
  gap = 'md',
  align = 'center'
}) => {
  return (
    <Component
      className={cn(
        'flex list-none',
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        alignConfig[align],
        gapConfig[gap],
        className
      )}
    >
      {children}
    </Component>
  );
};

// 导航栏项目组件
export const NavbarItem: React.FC<NavbarItemProps> = ({
  children,
  className,
  as: Component = 'li',
  href,
  active = false,
  disabled = false,
  onClick
}) => {
  const content = (
    <span
      className={cn(
        'px-3 py-2 rounded-md text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        active && 'bg-accent text-accent-foreground',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        !disabled && 'cursor-pointer'
      )}
      onClick={!disabled ? onClick : undefined}
    >
      {children}
    </span>
  );
  
  return (
    <Component className={className}>
      {href && !disabled ? (
        <a href={href} className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </Component>
  );
};

// 导航栏操作组件
export const NavbarActions: React.FC<NavbarActionsProps> = ({
  children,
  className,
  as: Component = 'div',
  gap = 'sm'
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

// 响应式导航栏组件
export const ResponsiveNavbar: React.FC<NavbarProps & {
  brand?: React.ReactNode;
  menu?: React.ReactNode;
  actions?: React.ReactNode;
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  mobileMenuTrigger?: React.ReactNode;
}> = ({
  brand,
  menu,
  actions,
  mobileBreakpoint = 'lg',
  mobileMenuTrigger,
  children,
  ...navbarProps
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
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
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <>
      <Navbar {...navbarProps}>
        {/* 品牌 */}
        {brand && (
          <div className="flex-shrink-0">
            {brand}
          </div>
        )}
        
        {/* 桌面端菜单 */}
        {menu && !isMobile && (
          <div className="flex-1 flex justify-center">
            {menu}
          </div>
        )}
        
        {/* 操作按钮 */}
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
        
        {/* 移动端菜单触发器 */}
        {isMobile && (
          <div className="flex-1 flex justify-end">
            <button
              className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuTrigger || (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                  />
                </svg>
              )}
            </button>
          </div>
        )}
        
        {children}
      </Navbar>
      
      {/* 移动端菜单 */}
      {isMobile && isMobileMenuOpen && menu && (
        <div className="fixed inset-x-0 top-16 z-50 bg-background border-b border-border shadow-lg">
          <div className="p-4">
            {menu}
          </div>
        </div>
      )}
    </>
  );
};

// 简单导航栏组件
export const SimpleNavbar: React.FC<{
  brand?: React.ReactNode;
  title?: string;
  subtitle?: string;
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
} & Omit<NavbarProps, 'children'>> = ({
  brand,
  title,
  subtitle,
  logo,
  actions,
  className,
  ...navbarProps
}) => {
  return (
    <Navbar {...navbarProps} className={className}>
      <NavbarContent justify="between" className="w-full">
        {brand || (
          <NavbarBrand
            title={title}
            subtitle={subtitle}
            logo={logo}
          >
            {title && (
              <div className="flex flex-col">
                <span className="font-semibold">{title}</span>
                {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
              </div>
            )}
          </NavbarBrand>
        )}
        
        {actions && (
          <NavbarActions>
            {actions}
          </NavbarActions>
        )}
      </NavbarContent>
    </Navbar>
  );
};

// 类型已在接口定义时导出