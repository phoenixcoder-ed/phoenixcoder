import React from 'react';
import { cn } from '../../utils/cn';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  showValue?: boolean;
  variant?: 'default' | 'primary' | 'secondary';
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ 
    className, 
    value, 
    defaultValue = 0, 
    min = 0, 
    max = 100, 
    step = 1, 
    onChange, 
    showValue = false,
    variant = 'default',
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const sliderVariants = {
      variant: {
        default: 'accent-slate-500',
        primary: 'accent-blue-500',
        secondary: 'accent-gray-500',
      },
    };

    const variantClasses = sliderVariants.variant[variant];

    return (
      <div className="w-full">
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          className={cn(
            'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider',
            variantClasses,
            className
          )}
          {...props}
        />
        {showValue && (
          <div className="mt-1 text-sm text-center text-muted-foreground">
            {currentValue}
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };