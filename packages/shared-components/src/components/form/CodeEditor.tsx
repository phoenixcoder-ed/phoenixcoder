import React from 'react';
import { cn } from '../../utils/cn';

export interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  language?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: number;
  showLineNumbers?: boolean;
}

export const CodeEditor = React.forwardRef<
  HTMLTextAreaElement,
  CodeEditorProps
>(({ 
  value = '', 
  onChange, 
  language = 'javascript',
  placeholder, 
  disabled, 
  className, 
  minHeight = 200,
  showLineNumbers = true 
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={cn('relative', className)}>
      {showLineNumbers && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted border-r border-border flex flex-col text-xs text-muted-foreground font-mono">
          {value.split('\n').map((_, index) => (
            <div key={index} className="px-2 py-0.5 text-right">
              {index + 1}
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full rounded-md border border-input bg-background text-sm ring-offset-background font-mono',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          showLineNumbers ? 'pl-14 pr-3 py-2' : 'px-3 py-2'
        )}
        style={{ minHeight }}
        data-language={language}
      />
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';