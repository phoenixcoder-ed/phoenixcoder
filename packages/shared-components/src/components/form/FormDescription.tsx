import React from 'react';
import { cn } from '../../utils/cn';
import { useFormField } from './FormField';

// 表单描述属性接口
export interface FormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

// 表单描述组件
export const FormDescription: React.FC<FormDescriptionProps> = ({
  children,
  className
}) => {
  const { formDescriptionId } = useFormField();
  
  return (
    <p
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
    >
      {children}
    </p>
  );
};