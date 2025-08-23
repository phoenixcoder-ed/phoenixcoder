import React from 'react';
import { Palette } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

export interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  presetColors?: string[];
}

const defaultPresetColors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
  '#008000', '#000080', '#808080', '#c0c0c0', '#800000'
];

export const ColorPicker = React.forwardRef<
  HTMLButtonElement,
  ColorPickerProps
>(({ value, onChange, placeholder = 'Pick a color', disabled, className, presetColors = defaultPresetColors }, ref) => {
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
          <div className="flex items-center gap-2">
            {value ? (
              <div 
                className="w-4 h-4 rounded border border-border" 
                style={{ backgroundColor: value }}
              />
            ) : (
              <Palette className="h-4 w-4" />
            )}
            {value || placeholder}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full h-10 rounded border border-input cursor-pointer"
          />
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'w-8 h-8 rounded border-2 cursor-pointer transition-all',
                  value === color ? 'border-ring' : 'border-border hover:border-ring/50'
                )}
                style={{ backgroundColor: color }}
                onClick={() => onChange?.(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

ColorPicker.displayName = 'ColorPicker';