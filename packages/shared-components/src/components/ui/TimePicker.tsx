import React from 'react';
import { cn } from '../../utils/cn';

export interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onChange?: (time: string) => void;
  format?: '12' | '24';
  step?: number;
  error?: boolean;
}

const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  ({ 
    className, 
    value, 
    defaultValue, 
    onChange, 
    format = '24',
    step = 1,
    error = false,
    ...props 
  }, ref) => {
    const formatTime = (time: string): string => {
      if (!time) return '';
      
      if (format === '12') {
        // 转换为12小时制显示，但input[type="time"]始终使用24小时制
        return time;
      }
      
      return time;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const timeValue = e.target.value;
      onChange?.(timeValue);
    };

    return (
      <input
        ref={ref}
        type="time"
        value={formatTime(value || '')}
        defaultValue={formatTime(defaultValue || '')}
        onChange={handleChange}
        step={step}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
    );
  }
);

TimePicker.displayName = 'TimePicker';

export { TimePicker };