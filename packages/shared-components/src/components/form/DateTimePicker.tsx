import React from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

export interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  format24h?: boolean;
}

export const DateTimePicker = React.forwardRef<
  HTMLButtonElement,
  DateTimePickerProps
>(({ value, onChange, placeholder = 'Pick date and time', disabled, className, format24h = true }, ref) => {
  const formatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !format24h
    });
    
    return `${dateStr} ${timeStr}`;
  };

  const handleDateTimeChange = (dateValue: string, timeValue: string) => {
    if (dateValue && timeValue) {
      const newDate = new Date(`${dateValue}T${timeValue}`);
      onChange?.(newDate);
    } else {
      onChange?.(undefined);
    }
  };

  const dateValue = value ? value.toISOString().split('T')[0] : '';
  const timeValue = value ? value.toTimeString().split(' ')[0].substring(0, 5) : '';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {value ? formatDateTime(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Date</label>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => handleDateTimeChange(e.target.value, timeValue)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Time</label>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => handleDateTimeChange(dateValue, e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

DateTimePicker.displayName = 'DateTimePicker';