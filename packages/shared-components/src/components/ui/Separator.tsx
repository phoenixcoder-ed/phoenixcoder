import React from 'react';
import { cn } from '../../utils/cn';

// 分隔符组件属性接口
export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'dashed' | 'dotted' | 'double' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'muted' | 'accent' | 'primary' | 'destructive';
  decorative?: boolean;
  withText?: boolean;
  textPosition?: 'center' | 'left' | 'right';
  icon?: React.ReactNode;
  fade?: boolean;
  animated?: boolean;
  length?: 'full' | 'auto' | number;
}

// 变体配置
const variantConfig = {
  default: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
  double: 'border-double border-2',
  gradient: 'border-none bg-gradient-to-r'
};

// 尺寸配置
const sizeConfig = {
  sm: {
    horizontal: 'border-t',
    vertical: 'border-l w-px',
    thickness: '1px'
  },
  md: {
    horizontal: 'border-t',
    vertical: 'border-l w-0.5',
    thickness: '1px'
  },
  lg: {
    horizontal: 'border-t-2',
    vertical: 'border-l-2 w-1',
    thickness: '2px'
  }
};

// 间距配置
const spacingConfig = {
  none: '',
  sm: 'my-2',
  md: 'my-4',
  lg: 'my-6',
  xl: 'my-8'
};

// 垂直间距配置
const verticalSpacingConfig = {
  none: '',
  sm: 'mx-2',
  md: 'mx-4',
  lg: 'mx-6',
  xl: 'mx-8'
};

// 颜色配置
const colorConfig = {
  default: 'border-border',
  muted: 'border-muted',
  accent: 'border-accent',
  primary: 'border-primary',
  destructive: 'border-destructive'
};

// 渐变颜色配置
const gradientConfig = {
  default: 'from-transparent via-border to-transparent',
  muted: 'from-transparent via-muted to-transparent',
  accent: 'from-transparent via-accent to-transparent',
  primary: 'from-transparent via-primary to-transparent',
  destructive: 'from-transparent via-destructive to-transparent'
};

// 分隔符组件
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>((
  {
    children,
    className,
    orientation = 'horizontal',
    variant = 'default',
    size = 'md',
    spacing = 'md',
    color = 'default',
    decorative = true,
    withText = false,
    textPosition = 'center',
    icon,
    fade = false,
    animated = false,
    length = 'full',
    ...props
  },
  ref
) => {
  const isHorizontal = orientation === 'horizontal';
  const hasContent = withText || children || icon;
  
  // 基础样式
  const baseClasses = cn(
    'shrink-0',
    decorative && 'select-none',
    animated && 'transition-all duration-300',
    fade && (isHorizontal ? 'opacity-60' : 'opacity-60')
  );
  
  // 分隔线样式
  const separatorClasses = cn(
    baseClasses,
    isHorizontal ? spacingConfig[spacing] : verticalSpacingConfig[spacing],
    variant === 'gradient' ? (
      isHorizontal ? (
        cn(
          'h-px w-full',
          gradientConfig[color],
          typeof length === 'number' ? '' : 'w-full'
        )
      ) : (
        cn(
          'w-px h-full',
          gradientConfig[color].replace('to-r', 'to-b'),
          typeof length === 'number' ? '' : 'h-full'
        )
      )
    ) : (
      cn(
        variantConfig[variant],
        colorConfig[color],
        isHorizontal ? sizeConfig[size].horizontal : sizeConfig[size].vertical
      )
    )
  );
  
  // 长度样式
  const lengthStyle = typeof length === 'number' ? {
    [isHorizontal ? 'width' : 'height']: `${length}px`
  } : {};
  
  // 如果有内容，使用带文本的分隔符
  if (hasContent) {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center',
          isHorizontal ? spacingConfig[spacing] : verticalSpacingConfig[spacing],
          className
        )}
        role={decorative ? 'presentation' : 'separator'}
        aria-orientation={orientation}
        {...props}
      >
        {/* 左侧/上侧分隔线 */}
        {textPosition !== 'left' && (
          <div
            className={cn(
              'flex-1',
              variant === 'gradient' ? (
                isHorizontal ? (
                  cn('h-px', gradientConfig[color])
                ) : (
                  cn('w-px', gradientConfig[color].replace('to-r', 'to-b'))
                )
              ) : (
                cn(
                  variantConfig[variant],
                  colorConfig[color],
                  isHorizontal ? sizeConfig[size].horizontal : sizeConfig[size].vertical
                )
              )
            )}
          />
        )}
        
        {/* 内容 */}
        <div className={cn(
          'flex items-center justify-center',
          isHorizontal ? 'px-3' : 'py-3',
          'text-sm text-muted-foreground bg-background'
        )}>
          {icon && (
            <span className={cn(
              'inline-flex items-center',
              (children || withText) && (isHorizontal ? 'mr-2' : 'mb-2')
            )}>
              {icon}
            </span>
          )}
          {children}
        </div>
        
        {/* 右侧/下侧分隔线 */}
        {textPosition !== 'right' && (
          <div
            className={cn(
              'flex-1',
              variant === 'gradient' ? (
                isHorizontal ? (
                  cn('h-px', gradientConfig[color])
                ) : (
                  cn('w-px', gradientConfig[color].replace('to-r', 'to-b'))
                )
              ) : (
                cn(
                  variantConfig[variant],
                  colorConfig[color],
                  isHorizontal ? sizeConfig[size].horizontal : sizeConfig[size].vertical
                )
              )
            )}
          />
        )}
      </div>
    );
  }
  
  // 普通分隔符
  return (
    <div
      ref={ref}
      className={cn(separatorClasses, className)}
      style={lengthStyle}
      role={decorative ? 'presentation' : 'separator'}
      aria-orientation={orientation}
      {...props}
    />
  );
});

Separator.displayName = 'Separator';

// 水平分隔符
export const HorizontalSeparator: React.FC<{
  className?: string;
  variant?: SeparatorProps['variant'];
  size?: SeparatorProps['size'];
  spacing?: SeparatorProps['spacing'];
  color?: SeparatorProps['color'];
}> = ({ className, variant, size, spacing, color }) => {
  return (
    <Separator
      orientation="horizontal"
      variant={variant}
      size={size}
      spacing={spacing}
      color={color}
      className={className}
    />
  );
};

// 垂直分隔符
export const VerticalSeparator: React.FC<{
  className?: string;
  variant?: SeparatorProps['variant'];
  size?: SeparatorProps['size'];
  spacing?: SeparatorProps['spacing'];
  color?: SeparatorProps['color'];
  height?: number;
}> = ({ className, variant, size, spacing, color, height }) => {
  return (
    <Separator
      orientation="vertical"
      variant={variant}
      size={size}
      spacing={spacing}
      color={color}
      length={height}
      className={cn('inline-block', className)}
    />
  );
};

// 文本分隔符
export const TextSeparator: React.FC<{
  children: React.ReactNode;
  className?: string;
  textPosition?: 'center' | 'left' | 'right';
  variant?: SeparatorProps['variant'];
  color?: SeparatorProps['color'];
}> = ({ children, className, textPosition = 'center', variant, color }) => {
  return (
    <Separator
      withText
      textPosition={textPosition}
      variant={variant}
      color={color}
      className={className}
    >
      {children}
    </Separator>
  );
};

// 图标分隔符
export const IconSeparator: React.FC<{
  icon: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  textPosition?: 'center' | 'left' | 'right';
  variant?: SeparatorProps['variant'];
  color?: SeparatorProps['color'];
}> = ({ icon, children, className, textPosition = 'center', variant, color }) => {
  return (
    <Separator
      icon={icon}
      withText={!!children}
      textPosition={textPosition}
      variant={variant}
      color={color}
      className={className}
    >
      {children}
    </Separator>
  );
};

// 渐变分隔符
export const GradientSeparator: React.FC<{
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  color?: SeparatorProps['color'];
  spacing?: SeparatorProps['spacing'];
}> = ({ className, orientation = 'horizontal', color = 'default', spacing = 'md' }) => {
  return (
    <Separator
      orientation={orientation}
      variant="gradient"
      color={color}
      spacing={spacing}
      className={className}
    />
  );
};

// 虚线分隔符
export const DashedSeparator: React.FC<{
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  color?: SeparatorProps['color'];
  spacing?: SeparatorProps['spacing'];
}> = ({ className, orientation = 'horizontal', color = 'default', spacing = 'md' }) => {
  return (
    <Separator
      orientation={orientation}
      variant="dashed"
      color={color}
      spacing={spacing}
      className={className}
    />
  );
};