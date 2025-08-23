import React from 'react';
import { cn } from '../../utils/cn';
import { ArrowLeft, ChevronLeft } from 'lucide-react';

// 返回按钮组件属性接口
export interface BackButtonProps {
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  disabled?: boolean;
  loading?: boolean;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  onBack?: () => void;
  fallbackUrl?: string;
  text?: string;
  showIcon?: boolean;
  rounded?: boolean;
}

// 变体配置
const variantConfig = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline'
};

// 尺寸配置
const sizeConfig = {
  sm: {
    button: 'h-8 px-3 text-sm',
    iconOnly: 'h-8 w-8',
    icon: 'h-3 w-3'
  },
  md: {
    button: 'h-10 px-4 text-sm',
    iconOnly: 'h-10 w-10',
    icon: 'h-4 w-4'
  },
  lg: {
    button: 'h-12 px-6 text-base',
    iconOnly: 'h-12 w-12',
    icon: 'h-5 w-5'
  }
};

// 返回按钮组件
export const BackButton: React.FC<BackButtonProps> = ({
  children,
  className,
  as: Component = 'button',
  variant = 'ghost',
  size = 'md',
  icon,
  iconPosition = 'left',
  iconOnly = false,
  disabled = false,
  loading = false,
  href,
  external = false,
  onClick,
  onBack,
  fallbackUrl = '/',
  text = 'Back',
  showIcon = true,
  rounded = false
}) => {
  // 处理返回逻辑
  const handleBack = React.useCallback(() => {
    if (disabled || loading) return;
    
    if (onBack) {
      onBack();
      return;
    }
    
    if (onClick) {
      onClick();
      return;
    }
    
    // 浏览器返回逻辑
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // 如果没有历史记录，跳转到回退URL
        window.location.href = fallbackUrl;
      }
    }
  }, [disabled, loading, onBack, onClick, fallbackUrl]);
  
  // 默认图标
  const defaultIcon = showIcon ? (
    icon || <ArrowLeft className={sizeConfig[size].icon} />
  ) : null;
  
  // 加载图标
  const loadingIcon = (
    <svg
      className={cn(sizeConfig[size].icon, 'animate-spin')}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
  
  // 显示的图标
  const displayIcon = loading ? loadingIcon : defaultIcon;
  
  // 显示的文本
  const displayText = children || text;
  
  // 基础样式
  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    variantConfig[variant],
    iconOnly ? sizeConfig[size].iconOnly : sizeConfig[size].button,
    rounded ? 'rounded-full' : 'rounded-md',
    className
  );
  
  // 内容渲染
  const content = (
    <>
      {displayIcon && iconPosition === 'left' && (
        <span className="flex-shrink-0">
          {displayIcon}
        </span>
      )}
      
      {!iconOnly && (
        <span className={loading ? 'opacity-70' : ''}>
          {displayText}
        </span>
      )}
      
      {displayIcon && iconPosition === 'right' && (
        <span className="flex-shrink-0">
          {displayIcon}
        </span>
      )}
    </>
  );
  
  // 如果有href且不是禁用状态，渲染为链接
  if (href && !disabled) {
    return (
      <a
        href={href}
        className={baseClasses}
        onClick={onClick}
        {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      >
        {content}
      </a>
    );
  }
  
  // 渲染为按钮
  return (
    <Component
      className={baseClasses}
      disabled={disabled || loading}
      onClick={handleBack}
      type={Component === 'button' ? 'button' : undefined}
      aria-label={iconOnly ? (typeof displayText === 'string' ? displayText : 'Go back') : undefined}
    >
      {content}
    </Component>
  );
};

// 简单返回按钮组件
export const SimpleBackButton: React.FC<{
  text?: string;
  className?: string;
  onClick?: () => void;
} & Pick<BackButtonProps, 'variant' | 'size' | 'disabled'>> = ({
  text = 'Back',
  className,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false
}) => {
  return (
    <BackButton
      variant={variant}
      size={size}
      disabled={disabled}
      text={text}
      className={className}
      onClick={onClick}
    />
  );
};

// 图标返回按钮组件
export const IconBackButton: React.FC<{
  icon?: React.ReactNode;
  tooltip?: string;
  className?: string;
  onClick?: () => void;
} & Pick<BackButtonProps, 'variant' | 'size' | 'disabled'>> = ({
  icon,
  tooltip,
  className,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false
}) => {
  return (
    <BackButton
      variant={variant}
      size={size}
      disabled={disabled}
      iconOnly
      icon={icon}
      className={className}
      onClick={onClick}
      text={tooltip || 'Go back'}
    />
  );
};

// 面包屑返回按钮组件
export const BreadcrumbBackButton: React.FC<{
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  separator?: React.ReactNode;
  className?: string;
  itemClassName?: string;
  separatorClassName?: string;
}> = ({
  items,
  separator,
  className,
  itemClassName,
  separatorClassName
}) => {
  const defaultSeparator = (
    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
  );
  
  return (
    <nav className={cn('flex items-center space-x-1', className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className={cn('flex-shrink-0', separatorClassName)}>
              {separator || defaultSeparator}
            </span>
          )}
          
          {item.href ? (
            <a
              href={item.href}
              className={cn(
                'text-sm font-medium text-muted-foreground hover:text-foreground',
                'transition-colors',
                itemClassName
              )}
              onClick={item.onClick}
            >
              {item.label}
            </a>
          ) : (
            <button
              className={cn(
                'text-sm font-medium text-muted-foreground hover:text-foreground',
                'transition-colors',
                itemClassName
              )}
              onClick={item.onClick}
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// 导航返回按钮组件
export const NavigationBackButton: React.FC<{
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  backButtonProps?: Partial<BackButtonProps>;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  actionsClassName?: string;
}> = ({
  title,
  subtitle,
  actions,
  showBackButton = true,
  backButtonProps,
  className,
  titleClassName,
  subtitleClassName,
  actionsClassName
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-4">
        {showBackButton && (
          <BackButton
            variant="ghost"
            size="md"
            iconOnly
            {...backButtonProps}
          />
        )}
        
        {(title || subtitle) && (
          <div className="flex flex-col">
            {title && (
              <h1 className={cn('text-lg font-semibold', titleClassName)}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className={cn('text-sm text-muted-foreground', subtitleClassName)}>
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
      
      {actions && (
        <div className={cn('flex items-center gap-2', actionsClassName)}>
          {actions}
        </div>
      )}
    </div>
  );
};

// 响应式返回按钮组件
export const ResponsiveBackButton: React.FC<BackButtonProps & {
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  mobileVariant?: 'default' | 'outline' | 'ghost' | 'link';
  mobileSize?: 'sm' | 'md' | 'lg';
  mobileIconOnly?: boolean;
}> = ({
  mobileBreakpoint = 'md',
  mobileVariant,
  mobileSize,
  mobileIconOnly,
  variant = 'ghost',
  size = 'md',
  iconOnly = false,
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
    <BackButton
      {...props}
      variant={isMobile && mobileVariant ? mobileVariant : variant}
      size={isMobile && mobileSize ? mobileSize : size}
      iconOnly={isMobile && mobileIconOnly !== undefined ? mobileIconOnly : iconOnly}
    />
  );
};