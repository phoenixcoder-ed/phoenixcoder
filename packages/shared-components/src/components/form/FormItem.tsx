import React from 'react';
import { cn } from '../../utils/cn';
import { useFormField } from './FormField';

// 表单项属性接口
export interface FormItemProps {
  children: React.ReactNode;
  className?: string;
}

// 表单项组件
export const FormItem: React.FC<FormItemProps> = ({
  children,
  className
}) => {
  const { formItemId } = useFormField();
  
  return (
    <div id={formItemId} className={cn('space-y-2', className)}>
      {children}
    </div>
  );
};