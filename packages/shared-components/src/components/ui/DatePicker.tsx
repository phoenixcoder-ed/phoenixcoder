import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'defaultValue' | 'value'> {
  value?: Date | string;
  defaultValue?: Date | string;
  onChange?: (date: Date | null) => void;
  format?: 'date' | 'datetime-local' | 'month' | 'week';
  min?: string;
  max?: string;
  error?: boolean;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    className, 
    value, 
    defaultValue, 
    onChange, 
    format = 'date',
    error = false,
    ...props 
  }, ref) => {
    const formatValue = (val: Date | string | undefined): string => {
      if (!val) return '';
      
      const date = val instanceof Date ? val : new Date(val);
      
      switch (format) {
        case 'date':
          return date.toISOString().split('T')[0];
        case 'datetime-local':
          return date.toISOString().slice(0, 16);
        case 'month':
          return date.toISOString().slice(0, 7);
        case 'week':
          const year = date.getFullYear();
          const week = getWeekNumber(date);
          return `${year}-W${week.toString().padStart(2, '0')}`;
        default:
          return date.toISOString().split('T')[0];
      }
    };

    const getWeekNumber = (date: Date): number => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (!inputValue) {
        onChange?.(null);
        return;
      }

      let date: Date;
      switch (format) {
        case 'datetime-local':
          date = new Date(inputValue);
          break;
        case 'month':
          date = new Date(inputValue + '-01');
          break;
        case 'week':
          const [year, week] = inputValue.split('-W');
          date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
          break;
        default:
          date = new Date(inputValue);
      }

      onChange?.(date);
    };

    return (
      <input
        ref={ref}
        type={format}
        value={formatValue(value)}
        defaultValue={formatValue(defaultValue)}
        onChange={handleChange}
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

DatePicker.displayName = 'DatePicker';

export { DatePicker };