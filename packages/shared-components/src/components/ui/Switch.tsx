import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  error?: string;
  switchSize?: 'default' | 'sm' | 'lg';
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, error, switchSize = 'default', id, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
    
    const switchVariants = {
      size: {
        default: 'h-6 w-11',
        sm: 'h-5 w-9',
        lg: 'h-7 w-12',
      },
      thumb: {
        default: 'h-5 w-5',
        sm: 'h-4 w-4',
        lg: 'h-6 w-6',
      },
    };

    const sizeClasses = switchVariants.size[switchSize];
    const thumbClasses = switchVariants.thumb[switchSize];

    return (
      <div className="flex items-start space-x-2">
        <div className="relative">
          <input
            type="checkbox"
            id={switchId}
            ref={ref}
            className="sr-only"
            {...props}
          />
          <label
            htmlFor={switchId}
            className={cn(
              'relative inline-flex cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              'bg-input data-[state=checked]:bg-primary',
              sizeClasses,
              error && 'border-destructive',
              className
            )}
          >
            <span
              className={cn(
                'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform',
                'translate-x-0 data-[state=checked]:translate-x-5',
                thumbClasses
              )}
            />
          </label>
        </div>
        {(label || description || error) && (
          <div className="flex flex-col space-y-1">
            {label && (
              <label
                htmlFor={switchId}
                className={cn(
                  'text-sm font-medium leading-none cursor-pointer',
                  error && 'text-destructive'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };