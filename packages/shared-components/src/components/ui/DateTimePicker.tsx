import React from 'react';
import { cn } from '../../utils/cn';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';

export interface DateTimePickerProps {
  value?: Date;
  defaultValue?: Date;
  onChange?: (dateTime: Date | null) => void;
  dateProps?: React.ComponentProps<typeof DatePicker>;
  timeProps?: React.ComponentProps<typeof TimePicker>;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

const DateTimePicker = React.forwardRef<HTMLDivElement, DateTimePickerProps>(
  ({ 
    className, 
    value, 
    defaultValue, 
    onChange, 
    dateProps = {},
    timeProps = {},
    error = false,
    disabled = false,
    ...props 
  }, ref) => {
    const [date, setDate] = React.useState<Date | null>(defaultValue || null);
    const [time, setTime] = React.useState<string>('');

    const currentDateTime = value || date;

    React.useEffect(() => {
      if (currentDateTime) {
        const timeString = currentDateTime.toTimeString().slice(0, 5);
        setTime(timeString);
      }
    }, [currentDateTime]);

    const handleDateChange = (newDate: Date | null) => {
      if (!newDate) {
        setDate(null);
        onChange?.(null);
        return;
      }

      const updatedDateTime = new Date(newDate);
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        updatedDateTime.setHours(hours, minutes);
      }

      if (value === undefined) {
        setDate(updatedDateTime);
      }
      onChange?.(updatedDateTime);
    };

    const handleTimeChange = (newTime: string) => {
      setTime(newTime);
      
      if (!currentDateTime) return;

      const [hours, minutes] = newTime.split(':').map(Number);
      const updatedDateTime = new Date(currentDateTime);
      updatedDateTime.setHours(hours, minutes);

      if (value === undefined) {
        setDate(updatedDateTime);
      }
      onChange?.(updatedDateTime);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex space-x-2',
          className
        )}
        {...props}
      >
        <div className="flex-1">
          <DatePicker
            value={currentDateTime || undefined}
            onChange={handleDateChange}
            error={error}
            disabled={disabled}
            {...dateProps}
          />
        </div>
        <div className="flex-1">
          <TimePicker
            value={time}
            onChange={handleTimeChange}
            error={error}
            disabled={disabled}
            {...timeProps}
          />
        </div>
      </div>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

export { DateTimePicker };
export default DateTimePicker;