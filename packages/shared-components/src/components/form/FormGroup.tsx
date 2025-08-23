import React from 'react';
import { cn } from '../../utils/cn';

export interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

const spacingClasses = {
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6'
};

export const FormGroup = React.forwardRef<
  HTMLDivElement,
  FormGroupProps
>(({ children, className, spacing = 'md' }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'w-full',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
});

FormGroup.displayName = 'FormGroup';