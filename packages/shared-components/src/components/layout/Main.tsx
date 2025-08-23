import React from 'react';
import { cn } from '../../utils/cn';

// 主内容组件属性接口
export interface MainProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  variant?: 'default' | 'contained' | 'fluid' | 'centered';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingX?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  minHeight?: 'auto' | 'screen' | 'content' | string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
  centered?: boolean;
  scrollable?: boolean;
  role?: string;
}

// 主内容区域组件属性接口
export interface MainContentProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'vertical' | 'horizontal';
  align?: 'start' | 'end' | 'center' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around';
}

// 主内容头部组件属性接口
export interface MainHeaderProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  sticky?: boolean;
  border?: boolean;
  background?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// 主内容主体组件属性接口
export interface MainBodyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  flex?: boolean;
  scrollable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

// 主内容底部组件属性接口
export interface MainFooterProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  sticky?: boolean;
  border?: boolean;
  background?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// 变体配置
const variantConfig = {
  default: '',
  contained: 'mx-auto',
  fluid: 'w-full',
  centered: 'mx-auto flex items-center justify-center'
};

// 尺寸配置
const sizeConfig = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'w-full'
};

// 最大宽度配置
const maxWidthConfig = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-full'
};

// 内边距配置
const paddingConfig = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12'
};

// X轴内边距配置
const paddingXConfig = {
  none: '',
  sm: 'px-4',
  md: 'px-6',
  lg: 'px-8',
  xl: 'px-12'
};

// Y轴内边距配置
const paddingYConfig = {
  none: '',
  sm: 'py-4',
  md: 'py-6',
  lg: 'py-8',
  xl: 'py-12'
};

// 最小高度配置
const minHeightConfig = {
  auto: 'min-h-0',
  screen: 'min-h-screen',
  content: 'min-h-fit'
};

// 间距配置
const spacingConfig = {
  none: 'space-y-0',
  sm: 'space-y-4',
  md: 'space-y-6',
  lg: 'space-y-8',
  xl: 'space-y-12'
};

// 方向配置
const directionConfig = {
  vertical: 'flex-col',
  horizontal: 'flex-row'
};

// 对齐配置
const alignConfig = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  stretch: 'items-stretch'
};

const justifyConfig = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around'
};

// 主内容组件
export const Main: React.FC<MainProps> = ({
  children,
  className,
  as: Component = 'main',
  variant = 'default',
  size = 'full',
  padding,
  paddingX,
  paddingY,
  minHeight = 'auto',
  maxWidth = 'full',
  centered = false,
  scrollable = false,
  role = 'main'
}) => {
  // 处理自定义最小高度
  const minHeightStyle = (
    minHeight && 
    !minHeightConfig[minHeight as keyof typeof minHeightConfig]
  ) ? { minHeight } : undefined;
  
  return (
    <Component
      className={cn(
        'w-full',
        variantConfig[variant],
        variant !== 'fluid' && sizeConfig[size],
        variant === 'contained' && maxWidthConfig[maxWidth],
        padding && paddingConfig[padding],
        paddingX && paddingXConfig[paddingX],
        paddingY && paddingYConfig[paddingY],
        minHeight && minHeightConfig[minHeight as keyof typeof minHeightConfig],
        centered && 'flex items-center justify-center',
        scrollable && 'overflow-auto',
        className
      )}
      style={minHeightStyle}
      role={role}
    >
      {children}
    </Component>
  );
};

// 主内容区域组件
export const MainContent: React.FC<MainContentProps> = ({
  children,
  className,
  as: Component = 'div',
  spacing = 'md',
  direction = 'vertical',
  align = 'stretch',
  justify = 'start'
}) => {
  return (
    <Component
      className={cn(
        'flex',
        directionConfig[direction],
        direction === 'vertical' && spacingConfig[spacing],
        alignConfig[align],
        justifyConfig[justify],
        className
      )}
    >
      {children}
    </Component>
  );
};

// 主内容头部组件
export const MainHeader: React.FC<MainHeaderProps> = ({
  children,
  className,
  as: Component = 'header',
  sticky = false,
  border = false,
  background = false,
  padding = 'md'
}) => {
  return (
    <Component
      className={cn(
        'w-full',
        sticky && 'sticky top-0 z-10',
        border && 'border-b border-border',
        background && 'bg-background',
        paddingConfig[padding],
        className
      )}
    >
      {children}
    </Component>
  );
};

// 主内容主体组件
export const MainBody: React.FC<MainBodyProps> = ({
  children,
  className,
  as: Component = 'div',
  flex = true,
  scrollable = false,
  padding = 'none'
}) => {
  return (
    <Component
      className={cn(
        'w-full',
        flex && 'flex-1',
        scrollable && 'overflow-auto',
        paddingConfig[padding],
        className
      )}
    >
      {children}
    </Component>
  );
};

// 主内容底部组件
export const MainFooter: React.FC<MainFooterProps> = ({
  children,
  className,
  as: Component = 'footer',
  sticky = false,
  border = false,
  background = false,
  padding = 'md'
}) => {
  return (
    <Component
      className={cn(
        'w-full',
        sticky && 'sticky bottom-0 z-10',
        border && 'border-t border-border',
        background && 'bg-background',
        paddingConfig[padding],
        className
      )}
    >
      {children}
    </Component>
  );
};

// 页面布局组件
export const PageLayout: React.FC<{
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerProps?: Partial<MainHeaderProps>;
  bodyProps?: Partial<MainBodyProps>;
  footerProps?: Partial<MainFooterProps>;
}> = ({
  header,
  children,
  footer,
  className,
  headerProps,
  bodyProps,
  footerProps
}) => {
  return (
    <Main className={cn('flex flex-col min-h-screen', className)}>
      {header && (
        <MainHeader {...headerProps}>
          {header}
        </MainHeader>
      )}
      
      <MainBody flex scrollable {...bodyProps}>
        {children}
      </MainBody>
      
      {footer && (
        <MainFooter {...footerProps}>
          {footer}
        </MainFooter>
      )}
    </Main>
  );
};

// 容器布局组件
export const ContainerLayout: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxWidth?: MainProps['maxWidth'];
  padding?: MainProps['padding'];
  centered?: boolean;
}> = ({
  children,
  className,
  maxWidth = '6xl',
  padding = 'lg',
  centered = true
}) => {
  return (
    <Main
      variant="contained"
      maxWidth={maxWidth}
      padding={padding}
      centered={centered}
      className={className}
    >
      {children}
    </Main>
  );
};

// 全屏布局组件
export const FullscreenLayout: React.FC<{
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}> = ({
  children,
  className,
  scrollable = true
}) => {
  return (
    <Main
      variant="fluid"
      minHeight="screen"
      scrollable={scrollable}
      className={className}
    >
      {children}
    </Main>
  );
};

// 类型已在 @phoenixcoder/shared-types 中定义，无需重复导出