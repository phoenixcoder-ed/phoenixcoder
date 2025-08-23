import React, { createContext, useContext, useId } from 'react';
import { cn } from '../../utils/cn';

// 表单字段上下文
interface FormFieldContextValue {
  id: string;
  name: string;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
}

const FormFieldContext = createContext<FormFieldContextValue | undefined>(undefined);

// 表单字段属性接口
export interface FormFieldProps {
  name: string;
  children: React.ReactNode;
  className?: string;
}

// 表单字段组件
export const FormField: React.FC<FormFieldProps> = ({
  name,
  children,
  className
}) => {
  const id = useId();
  
  const contextValue: FormFieldContextValue = {
    id,
    name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`
  };
  
  return (
    <FormFieldContext.Provider value={contextValue}>
      <div className={cn('space-y-2', className)}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
};

// 使用表单字段上下文的 Hook
export const useFormField = () => {
  const context = useContext(FormFieldContext);
  
  if (!context) {
    throw new Error('useFormField must be used within a FormField');
  }
  
  return context;
};

// 导出类型
export type { FormFieldContextValue };