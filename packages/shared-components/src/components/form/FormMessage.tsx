import React from 'react';
import { cn } from '../../utils/cn';
import { useFormField } from './FormField';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// 消息类型枚举
export enum MessageType {
  ERROR = 'error',
  SUCCESS = 'success',
  WARNING = 'warning',
  INFO = 'info'
}

// 表单消息属性接口
export interface FormMessageProps {
  children?: React.ReactNode;
  className?: string;
  type?: MessageType;
  message?: string;
  showIcon?: boolean;
}

// 消息类型配置
const messageTypeConfig = {
  [MessageType.ERROR]: {
    icon: AlertCircle,
    className: 'text-red-600',
    bgClassName: 'bg-red-50 border-red-200'
  },
  [MessageType.SUCCESS]: {
    icon: CheckCircle,
    className: 'text-green-600',
    bgClassName: 'bg-green-50 border-green-200'
  },
  [MessageType.WARNING]: {
    icon: AlertTriangle,
    className: 'text-yellow-600',
    bgClassName: 'bg-yellow-50 border-yellow-200'
  },
  [MessageType.INFO]: {
    icon: Info,
    className: 'text-blue-600',
    bgClassName: 'bg-blue-50 border-blue-200'
  }
};

// 表单消息组件
export const FormMessage: React.FC<FormMessageProps> = ({
  children,
  className,
  type = MessageType.ERROR,
  message,
  showIcon = true
}) => {
  const { formMessageId } = useFormField();
  const config = messageTypeConfig[type];
  const Icon = config.icon;
  
  const content = children || message;
  
  if (!content) {
    return null;
  }
  
  return (
    <div
      id={formMessageId}
      className={cn(
        'flex items-start gap-2 text-sm',
        config.className,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      )}
      
      <div className="flex-1">
        {content}
      </div>
    </div>
  );
};

// 带背景的表单消息组件
export const FormMessageBox: React.FC<FormMessageProps> = ({
  children,
  className,
  type = MessageType.ERROR,
  message,
  showIcon = true
}) => {
  const { formMessageId } = useFormField();
  const config = messageTypeConfig[type];
  const Icon = config.icon;
  
  const content = children || message;
  
  if (!content) {
    return null;
  }
  
  return (
    <div
      id={formMessageId}
      className={cn(
        'flex items-start gap-2 text-sm p-3 rounded-md border',
        config.className,
        config.bgClassName,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      )}
      
      <div className="flex-1">
        {content}
      </div>
    </div>
  );
};