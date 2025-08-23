import React from 'react';
import { cn } from '../../utils/cn';

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed = false, onPressedChange, variant = 'default', size = 'default', onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPressedChange?.(!pressed);
      onClick?.(event);
    };

    const toggleVariants = {
      variant: {
        default: 'bg-transparent hover:bg-muted hover:text-muted-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-3',
        sm: 'h-9 px-2.5',
        lg: 'h-11 px-5',
      },
    };

    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variantClasses = toggleVariants.variant[variant];
    const sizeClasses = toggleVariants.size[size];

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        data-state={pressed ? 'on' : 'off'}
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

Toggle.displayName = 'Toggle';

// Toggle Group 组件
export interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, type = 'single', value, onValueChange, orientation = 'horizontal', disabled, children, ...props }, ref) => {
    const handleToggle = (itemValue: string) => {
      if (disabled) return;

      if (type === 'single') {
        const newValue = value === itemValue ? '' : itemValue;
        onValueChange?.(newValue);
      } else {
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = currentValues.includes(itemValue)
          ? currentValues.filter(v => v !== itemValue)
          : [...currentValues, itemValue];
        onValueChange?.(newValues);
      }
    };

    const isPressed = (itemValue: string) => {
      if (type === 'single') {
        return value === itemValue;
      }
      return Array.isArray(value) && value.includes(itemValue);
    };

    const orientationClasses = {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-1',
          orientationClasses[orientation],
          className
        )}
        role="group"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === ToggleGroupItem) {
            const childProps = child.props as ToggleGroupItemProps;
            return React.cloneElement(child as React.ReactElement<any>, {
              ...childProps,
              pressed: isPressed(childProps.value),
              onPressedChange: () => handleToggle(childProps.value),
              disabled: disabled || childProps.disabled,
            });
          }
          return child;
        })}
      </div>
    );
  }
);

ToggleGroup.displayName = 'ToggleGroup';

// Toggle Group Item 组件
export interface ToggleGroupItemProps extends Omit<ToggleProps, 'pressed' | 'onPressedChange'> {
  value: string;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    return (
      <Toggle
        ref={ref}
        className={cn(
          'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
          className
        )}
        {...props}
      />
    );
  }
);

ToggleGroupItem.displayName = 'ToggleGroupItem';

export { Toggle, ToggleGroup, ToggleGroupItem };