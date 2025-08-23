import React from 'react';
import { cn } from '../../utils/cn';

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection = React.forwardRef<
  HTMLDivElement,
  FormSectionProps
>(({ title, description, children, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'space-y-4',
        className
      )}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-medium leading-none">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
});

FormSection.displayName = 'FormSection';