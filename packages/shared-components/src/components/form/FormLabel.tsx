import React from 'react';
import { cn } from '../../utils/cn';
import { useFormField } from './FormField';

// 表单标签属性接口
export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  optional?: boolean;
}

// 表单标签组件
export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  className,
  required = false,
  optional = false,
  ...props
}) => {
  const { formItemId } = useFormField();
  
  return (
    <label
      htmlFor={formItemId}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
      {optional && (
        <span className="text-muted-foreground ml-1 font-normal">
          (可选)
        </span>
      )}
    </label>
  );
};