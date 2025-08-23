import React from 'react';
import { cn } from '../../utils/cn';

// 标签组件属性接口
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  error?: boolean;
  description?: string;
  tooltip?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  truncate?: boolean;
  uppercase?: boolean;
  asChild?: boolean;
}

// 变体配置
const variantConfig = {
  default: 'text-foreground',
  secondary: 'text-muted-foreground',
  destructive: 'text-destructive',
  outline: 'text-foreground border border-input px-2 py-1 rounded-md',
  ghost: 'text-muted-foreground hover:text-foreground'
};

// 尺寸配置
const sizeConfig = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

// 字重配置
const weightConfig = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold'
};

// 标签组件
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>((
  {
    children,
    className,
    variant = 'default',
    size = 'md',
    weight = 'medium',
    required = false,
    optional = false,
    disabled = false,
    error = false,
    description,
    tooltip,
    icon,
    iconPosition = 'left',
    truncate = false,
    uppercase = false,
    asChild = false,
    ...props
  },
  ref
) => {
  const labelContent = (
    <>
      {/* 图标 - 左侧 */}
      {icon && iconPosition === 'left' && (
        <span className="inline-flex items-center mr-1.5">
          {icon}
        </span>
      )}
      
      {/* 文本内容 */}
      <span className={cn(
        truncate && 'truncate',
        uppercase && 'uppercase'
      )}>
        {children}
      </span>
      
      {/* 必填标识 */}
      {required && (
        <span className="text-destructive ml-1" aria-label="required">
          *
        </span>
      )}
      
      {/* 可选标识 */}
      {optional && (
        <span className="text-muted-foreground ml-1 text-xs">
          (optional)
        </span>
      )}
      
      {/* 图标 - 右侧 */}
      {icon && iconPosition === 'right' && (
        <span className="inline-flex items-center ml-1.5">
          {icon}
        </span>
      )}
    </>
  );
  
  if (asChild) {
    return (
      <span
        className={cn(
          'inline-flex items-center cursor-pointer',
          'transition-colors duration-200',
          variantConfig[variant],
          sizeConfig[size],
          weightConfig[weight],
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'text-destructive',
          className
        )}
        title={tooltip}
        {...(props as any)}
      >
        {labelContent}
      </span>
    );
  }
  
  return (
    <div className="space-y-1">
      <label
        ref={ref}
        className={cn(
          'inline-flex items-center cursor-pointer',
          'transition-colors duration-200',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          variantConfig[variant],
          sizeConfig[size],
          weightConfig[weight],
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'text-destructive',
          className
        )}
        title={tooltip}
        {...props}
      >
        {labelContent}
      </label>
      
      {/* 描述文本 */}
      {description && (
        <p className={cn(
          'text-xs text-muted-foreground',
          error && 'text-destructive',
          disabled && 'opacity-50'
        )}>
          {description}
        </p>
      )}
    </div>
  );
});

Label.displayName = 'Label';

// 简单标签组件
export const SimpleLabel: React.FC<{
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}> = ({ children, required, className }) => {
  return (
    <Label
      variant="default"
      size="md"
      required={required}
      className={className}
    >
      {children}
    </Label>
  );
};

// 表单标签组件
export const FormLabel: React.FC<{
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  description?: string;
  error?: boolean;
  className?: string;
}> = ({
  children,
  htmlFor,
  required,
  optional,
  description,
  error,
  className
}) => {
  return (
    <Label
      htmlFor={htmlFor}
      variant="default"
      size="md"
      weight="medium"
      required={required}
      optional={optional}
      description={description}
      error={error}
      className={className}
    >
      {children}
    </Label>
  );
};

// 字段标签组件
export const FieldLabel: React.FC<{
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}> = ({
  children,
  htmlFor,
  required,
  disabled,
  tooltip,
  className
}) => {
  return (
    <Label
      htmlFor={htmlFor}
      variant="default"
      size="sm"
      weight="medium"
      required={required}
      disabled={disabled}
      tooltip={tooltip}
      className={className}
    >
      {children}
    </Label>
  );
};

// 描述性标签组件
export const DescriptiveLabel: React.FC<{
  children: React.ReactNode;
  description: string;
  htmlFor?: string;
  required?: boolean;
  error?: boolean;
  className?: string;
}> = ({
  children,
  description,
  htmlFor,
  required,
  error,
  className
}) => {
  return (
    <Label
      htmlFor={htmlFor}
      variant="default"
      size="md"
      weight="medium"
      required={required}
      description={description}
      error={error}
      className={className}
    >
      {children}
    </Label>
  );
};

// 图标标签组件
export const IconLabel: React.FC<{
  children: React.ReactNode;
  icon: React.ReactNode;
  iconPosition?: 'left' | 'right';
  htmlFor?: string;
  required?: boolean;
  className?: string;
}> = ({
  children,
  icon,
  iconPosition = 'left',
  htmlFor,
  required,
  className
}) => {
  return (
    <Label
      htmlFor={htmlFor}
      variant="default"
      size="md"
      weight="medium"
      required={required}
      icon={icon}
      iconPosition={iconPosition}
      className={className}
    >
      {children}
    </Label>
  );
};