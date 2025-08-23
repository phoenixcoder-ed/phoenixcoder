import React from 'react';
import { cn } from '../../utils/cn';

// 区块组件属性接口
export interface SectionProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  variant?: 'default' | 'contained' | 'outlined' | 'elevated' | 'filled';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  centered?: boolean;
  fullHeight?: boolean;
  background?: 'none' | 'muted' | 'accent' | 'primary' | 'secondary';
  border?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  style?: React.CSSProperties;
}

// 区块头部组件属性接口
export interface SectionHeaderProps {
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  border?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
}

// 区块内容组件属性接口
export interface SectionContentProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  scrollable?: boolean;
  maxHeight?: string;
}

// 区块底部组件属性接口
export interface SectionFooterProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  border?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right' | 'between' | 'around';
}

// 变体配置
const variantConfig = {
  default: 'bg-background',
  contained: 'bg-background border border-border',
  outlined: 'border border-border',
  elevated: 'bg-background shadow-md border border-border',
  filled: 'bg-muted'
};

// 尺寸配置
const sizeConfig = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

// 间距配置
const spacingConfig = {
  none: 'space-y-0',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8'
};

// 内边距配置
const paddingConfig = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12'
};

// 外边距配置
const marginConfig = {
  none: '',
  sm: 'm-2',
  md: 'm-4',
  lg: 'm-6',
  xl: 'm-8'
};

// 最大宽度配置
const maxWidthConfig = {
  none: '',
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

// 背景配置
const backgroundConfig = {
  none: '',
  muted: 'bg-muted',
  accent: 'bg-accent',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground'
};

// 阴影配置
const shadowConfig = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
};

// 圆角配置
const roundedConfig = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full'
};

// 对齐配置
const alignConfig = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  between: 'flex justify-between items-center',
  around: 'flex justify-around items-center'
};

// 区块组件
export const Section: React.FC<SectionProps> = ({
  children,
  className,
  as: Component = 'section',
  variant = 'default',
  size = 'md',
  spacing = 'md',
  padding = 'md',
  margin = 'none',
  maxWidth = 'none',
  centered = false,
  fullHeight = false,
  background = 'none',
  border = false,
  shadow = 'none',
  rounded = 'none',
  style
}) => {
  return (
    <Component
      className={cn(
        'w-full',
        variantConfig[variant],
        sizeConfig[size],
        spacingConfig[spacing],
        paddingConfig[padding],
        marginConfig[margin],
        maxWidthConfig[maxWidth],
        centered && 'mx-auto',
        fullHeight && 'min-h-screen',
        background !== 'none' && backgroundConfig[background],
        border && 'border border-border',
        shadowConfig[shadow],
        roundedConfig[rounded],
        className
      )}
      style={style}
    >
      {children}
    </Component>
  );
};

// 区块头部组件
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  children,
  className,
  as: Component = 'header',
  title,
  subtitle,
  actions,
  border = false,
  padding = 'md',
  spacing = 'sm',
  align = 'left'
}) => {
  const hasContent = title || subtitle || actions;
  
  return (
    <Component
      className={cn(
        'flex-shrink-0',
        border && 'border-b border-border',
        paddingConfig[padding],
        hasContent && alignConfig[align],
        className
      )}
    >
      {hasContent ? (
        <>
          <div className={cn('flex-1', spacingConfig[spacing])}>
            {title && (
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </>
      ) : (
        children
      )}
    </Component>
  );
};

// 区块内容组件
export const SectionContent: React.FC<SectionContentProps> = ({
  children,
  className,
  as: Component = 'div',
  padding = 'md',
  spacing = 'md',
  scrollable = false,
  maxHeight,
  style,
  ...rest
}) => {
  return (
    <Component
      className={cn(
        'flex-1',
        paddingConfig[padding],
        spacingConfig[spacing],
        scrollable && 'overflow-y-auto',
        className
      )}
      style={{
        ...style,
        ...(maxHeight ? { maxHeight } : {})
      }}
      {...rest}
    >
      {children}
    </Component>
  );
};

// 区块底部组件
export const SectionFooter: React.FC<SectionFooterProps> = ({
  children,
  className,
  as: Component = 'footer',
  border = false,
  padding = 'md',
  align = 'left',
  ...rest
}) => {
  return (
    <Component
      className={cn(
        'flex-shrink-0',
        border && 'border-t border-border',
        paddingConfig[padding],
        alignConfig[align],
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
};

// 卡片区块组件
export const CardSection: React.FC<SectionProps & {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  headerProps?: Partial<SectionHeaderProps>;
  contentProps?: Partial<SectionContentProps>;
  footerProps?: Partial<SectionFooterProps>;
}> = ({
  title,
  subtitle,
  actions,
  footer,
  headerProps,
  contentProps,
  footerProps,
  children,
  variant = 'contained',
  rounded = 'lg',
  shadow = 'sm',
  ...sectionProps
}) => {
  return (
    <Section
      {...sectionProps}
      variant={variant}
      rounded={rounded}
      shadow={shadow}
      padding="none"
    >
      {(title || subtitle || actions) && (
        <SectionHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
          border
          {...headerProps}
        />
      )}
      
      <SectionContent {...contentProps}>
        {children}
      </SectionContent>
      
      {footer && (
        <SectionFooter border {...footerProps}>
          {footer}
        </SectionFooter>
      )}
    </Section>
  );
};

// 英雄区块组件
export const HeroSection: React.FC<SectionProps & {
  title?: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  backgroundImage?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}> = ({
  title,
  subtitle,
  description,
  actions,
  backgroundImage,
  overlay = false,
  overlayOpacity = 0.5,
  children,
  className,
  fullHeight = true,
  centered = true,
  padding = 'xl',
  ...sectionProps
}) => {
  return (
    <Section
      {...sectionProps}
      className={cn(
        'relative flex items-center justify-center',
        backgroundImage && 'bg-cover bg-center bg-no-repeat',
        className
      )}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
      fullHeight={fullHeight}
      centered={centered}
      padding={padding}
    >
      {/* 遮罩层 */}
      {overlay && backgroundImage && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {/* 内容 */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {title && (
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {title}
          </h1>
        )}
        {subtitle && (
          <h2 className="text-xl md:text-2xl font-semibold mb-4">
            {subtitle}
          </h2>
        )}
        {description && (
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            {description}
          </p>
        )}
        {actions && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {actions}
          </div>
        )}
        {children}
      </div>
    </Section>
  );
};

// 特性区块组件
export const FeatureSection: React.FC<SectionProps & {
  title?: string;
  subtitle?: string;
  features: Array<{
    icon?: React.ReactNode;
    title: string;
    description: string;
  }>;
  columns?: 1 | 2 | 3 | 4;
}> = ({
  title,
  subtitle,
  features,
  columns = 3,
  children,
  padding = 'xl',
  spacing = 'xl',
  ...sectionProps
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };
  
  return (
    <Section {...sectionProps} padding={padding} spacing={spacing}>
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className={cn('grid gap-8', gridCols[columns])}>
        {features.map((feature, index) => (
          <div key={index} className="text-center">
            {feature.icon && (
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
            )}
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
      
      {children}
    </Section>
  );
};