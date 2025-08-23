import React from 'react';
import { cn } from '../../utils/cn';

// 容器组件属性接口
export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
  fluid?: boolean;
}

// 尺寸配置
const sizeConfig = {
  xs: 'max-w-xs',
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
  sm: 'px-4 py-2',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
  xl: 'px-12 py-8'
};

// 容器组件
export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  as: Component = 'div',
  size = 'full',
  padding = 'md',
  center = true,
  fluid = false
}) => {
  return (
    <Component
      className={cn(
        'w-full',
        !fluid && sizeConfig[size],
        paddingConfig[padding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </Component>
  );
};

// 响应式容器组件
export const ResponsiveContainer: React.FC<ContainerProps & {
  breakpoints?: {
    sm?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    md?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    lg?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    xl?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  };
}> = ({
  children,
  className,
  as: Component = 'div',
  size = 'full',
  padding = 'md',
  center = true,
  fluid = false,
  breakpoints = {}
}) => {
  const responsiveClasses = Object.entries(breakpoints)
    .map(([breakpoint, breakpointSize]) => {
      switch (breakpoint) {
        case 'sm':
          return `sm:${sizeConfig[breakpointSize]}`;
        case 'md':
          return `md:${sizeConfig[breakpointSize]}`;
        case 'lg':
          return `lg:${sizeConfig[breakpointSize]}`;
        case 'xl':
          return `xl:${sizeConfig[breakpointSize]}`;
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      className={cn(
        'w-full',
        !fluid && sizeConfig[size],
        responsiveClasses,
        paddingConfig[padding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </Component>
  );
};

// 流体容器组件
export const FluidContainer: React.FC<Omit<ContainerProps, 'size' | 'fluid'>> = ({
  children,
  className,
  as: Component = 'div',
  padding = 'md',
  center = false
}) => {
  return (
    <Component
      className={cn(
        'w-full',
        paddingConfig[padding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </Component>
  );
};

// 固定宽度容器组件
export const FixedContainer: React.FC<ContainerProps & {
  width?: number | string;
}> = ({
  children,
  className,
  as: Component = 'div',
  padding = 'md',
  center = true,
  width
}) => {
  const style = width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined;

  return (
    <Component
      className={cn(
        paddingConfig[padding],
        center && 'mx-auto',
        className
      )}
      style={style}
    >
      {children}
    </Component>
  );
};