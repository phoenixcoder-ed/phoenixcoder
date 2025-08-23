import React from 'react';
import { cn } from '../../utils/cn';

// 页脚组件属性接口
export interface FooterProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  variant?: 'default' | 'sticky' | 'fixed' | 'floating';
  position?: 'bottom' | 'top';
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

// 页脚内容组件属性接口
export interface FooterContentProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  wrap?: boolean;
}

// 页脚区块组件属性接口
export interface FooterSectionProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  title?: string;
  description?: string;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end';
}

// 页脚链接组件属性接口
export interface FooterLinkProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

// 页脚版权组件属性接口
export interface FooterCopyrightProps {
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  text?: string;
  year?: number | string;
  company?: string;
  align?: 'start' | 'center' | 'end';
}

// 变体配置
const variantConfig = {
  default: 'relative',
  sticky: 'sticky bottom-0',
  fixed: 'fixed bottom-0 left-0 right-0',
  floating: 'fixed bottom-4 left-4 right-4 rounded-lg'
};

// 尺寸配置
const sizeConfig = {
  sm: 'py-4',
  md: 'py-6',
  lg: 'py-8'
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
const alignConfig = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly'
};

// 间距配置
const spacingConfig = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6'
};

// 文本对齐配置
const textAlignConfig = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right'
};

// 页脚组件
export const Footer: React.FC<FooterProps> = ({
  children,
  className,
  as: Component = 'footer',
  variant = 'default',
  position = 'bottom',
  size = 'md',
  border = false,
  shadow = false,
  backdrop = false,
  transparent = false,
  centered = false,
  fullWidth = true,
  maxWidth = 'full',
  padding = 'md',
  zIndex = 10
}) => {
  return (
    <Component
      className={cn(
        'w-full',
        variantConfig[variant],
        sizeConfig[size],
        border && (
          position === 'bottom' ? 'border-t border-border' : 'border-b border-border'
        ),
        shadow && 'shadow-lg',
        backdrop && 'backdrop-blur-sm bg-background/95',
        !backdrop && !transparent && 'bg-background',
        transparent && 'bg-transparent',
        paddingConfig[padding],
        zIndexConfig[zIndex],
        className
      )}
    >
      <div
        className={cn(
          'w-full',
          !fullWidth && maxWidthConfig[maxWidth],
          centered && 'mx-auto'
        )}
      >
        {children}
      </div>
    </Component>
  );
};

// 页脚内容组件
export const FooterContent: React.FC<FooterContentProps> = ({
  children,
  className,
  as: Component = 'div',
  direction = 'row',
  align = 'between',
  spacing = 'md',
  wrap = true
}) => {
  return (
    <Component
      className={cn(
        'flex',
        direction === 'column' ? 'flex-col' : 'flex-row',
        alignConfig[align],
        spacingConfig[spacing],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </Component>
  );
};

// 页脚区块组件
export const FooterSection: React.FC<FooterSectionProps> = ({
  children,
  className,
  as: Component = 'div',
  title,
  description,
  spacing = 'sm',
  align = 'start'
}) => {
  return (
    <Component
      className={cn(
        'flex flex-col',
        spacingConfig[spacing],
        textAlignConfig[align],
        className
      )}
    >
      {title && (
        <h3 className="font-semibold text-lg text-foreground">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {children}
    </Component>
  );
};

// 页脚链接组件
export const FooterLink: React.FC<FooterLinkProps> = ({
  children,
  className,
  href,
  external = false,
  disabled = false,
  onClick
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick();
    }
  };
  
  const linkProps = {
    className: cn(
      'text-sm text-muted-foreground hover:text-foreground',
      'transition-colors duration-200',
      disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
      !disabled && 'cursor-pointer',
      className
    ),
    onClick: handleClick,
    ...(external && { target: '_blank', rel: 'noopener noreferrer' })
  };
  
  if (href && !disabled) {
    return (
      <a href={href} {...linkProps}>
        {children}
        {external && (
          <svg
            className="inline-block w-3 h-3 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </a>
    );
  }
  
  return (
    <span {...linkProps}>
      {children}
    </span>
  );
};

// 页脚版权组件
export const FooterCopyright: React.FC<FooterCopyrightProps> = ({
  children,
  className,
  as: Component = 'div',
  text,
  year,
  company,
  align = 'center'
}) => {
  const currentYear = new Date().getFullYear();
  const displayYear = year || currentYear;
  
  const defaultText = company
    ? `© ${displayYear} ${company}. All rights reserved.`
    : `© ${displayYear} All rights reserved.`;
  
  return (
    <Component
      className={cn(
        'text-xs text-muted-foreground',
        textAlignConfig[align],
        className
      )}
    >
      {children || text || defaultText}
    </Component>
  );
};

// 简单页脚组件
export const SimpleFooter: React.FC<{
  copyright?: string;
  year?: number | string;
  company?: string;
  links?: Array<{
    label: string;
    href?: string;
    external?: boolean;
    onClick?: () => void;
  }>;
  className?: string;
} & Omit<FooterProps, 'children'>> = ({
  copyright,
  year,
  company,
  links,
  className,
  ...footerProps
}) => {
  return (
    <Footer {...footerProps} className={className}>
      <FooterContent align="between" direction="row">
        <FooterCopyright
          text={copyright}
          year={year}
          company={company}
          align="start"
        />
        
        {links && links.length > 0 && (
          <div className="flex items-center gap-4">
            {links.map((link, index) => (
              <FooterLink
                key={index}
                href={link.href}
                external={link.external}
                onClick={link.onClick}
              >
                {link.label}
              </FooterLink>
            ))}
          </div>
        )}
      </FooterContent>
    </Footer>
  );
};

// 多列页脚组件
export const MultiColumnFooter: React.FC<{
  sections: Array<{
    title: string;
    description?: string;
    links: Array<{
      label: string;
      href?: string;
      external?: boolean;
      onClick?: () => void;
    }>;
  }>;
  copyright?: string;
  year?: number | string;
  company?: string;
  socialLinks?: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
  }>;
  className?: string;
} & Omit<FooterProps, 'children'>> = ({
  sections,
  copyright,
  year,
  company,
  socialLinks,
  className,
  ...footerProps
}) => {
  return (
    <Footer {...footerProps} className={className}>
      <div className="space-y-8">
        {/* 主要内容区域 */}
        <FooterContent direction="row" align="start" spacing="lg">
          {sections.map((section, index) => (
            <FooterSection
              key={index}
              title={section.title}
              description={section.description}
              className="flex-1 min-w-0"
            >
              <div className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <FooterLink
                    key={linkIndex}
                    href={link.href}
                    external={link.external}
                    onClick={link.onClick}
                  >
                    {link.label}
                  </FooterLink>
                ))}
              </div>
            </FooterSection>
          ))}
        </FooterContent>
        
        {/* 分隔线 */}
        <div className="border-t border-border" />
        
        {/* 底部区域 */}
        <FooterContent align="between" direction="row">
          <FooterCopyright
            text={copyright}
            year={year}
            company={company}
            align="start"
          />
          
          {socialLinks && socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map((link, index) => (
                <FooterLink
                  key={index}
                  href={link.href}
                  external
                  className="flex items-center gap-2"
                >
                  {link.icon && (
                    <span className="w-4 h-4">
                      {link.icon}
                    </span>
                  )}
                  <span className="sr-only">{link.label}</span>
                </FooterLink>
              ))}
            </div>
          )}
        </FooterContent>
      </div>
    </Footer>
  );
};

// 响应式页脚组件
export const ResponsiveFooter: React.FC<FooterProps & {
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  mobileDirection?: 'row' | 'column';
}> = ({
  mobileBreakpoint = 'md',
  mobileDirection = 'column',
  children,
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
    <Footer {...props}>
      <FooterContent
        direction={isMobile ? mobileDirection : 'row'}
        align={isMobile ? 'center' : 'between'}
        spacing={isMobile ? 'lg' : 'md'}
      >
        {children}
      </FooterContent>
    </Footer>
  );
};

// 类型已在接口定义时导出