import React from 'react';
import { cn } from '../../utils/cn';
import { useFormField } from './FormField';

// 表单控件属性接口
export interface FormControlProps {
  children: React.ReactNode;
  className?: string;
}

// 表单控件组件
export const FormControl: React.FC<FormControlProps> = ({
  children,
  className
}) => {
  const { formItemId, formDescriptionId, formMessageId } = useFormField();
  
  return (
    <div className={cn('relative', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            id: formItemId,
            'aria-describedby': `${formDescriptionId} ${formMessageId}`,
            'aria-invalid': false, // 这里可以根据验证状态动态设置
            ...(child.props || {})
          });
        }
        return child;
      })}
    </div>
  );
};