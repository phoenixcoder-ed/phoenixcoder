import React from 'react';
import { cn } from '../../utils/cn';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: number;
}

export const RichTextEditor = React.forwardRef<
  HTMLDivElement,
  RichTextEditorProps
>(({ value = '', onChange, placeholder, disabled, className, minHeight = 200 }, ref) => {
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    onChange?.(content);
  };

  return (
    <div
      ref={ref}
      contentEditable={!disabled}
      onInput={handleInput}
      dangerouslySetInnerHTML={{ __html: value }}
      className={cn(
        'min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      style={{ minHeight }}
      data-placeholder={placeholder}
    />
  );
});

RichTextEditor.displayName = 'RichTextEditor';