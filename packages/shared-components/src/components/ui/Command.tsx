import React from 'react';
import { cn } from '../../utils/cn';
import { Search } from 'lucide-react';

export interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  filter?: (value: string, search: string) => number;
  shouldFilter?: boolean;
  loop?: boolean;
}

export interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  heading?: string;
}

export interface CommandItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  children: React.ReactNode;
  className?: string;
  value?: string;
  disabled?: boolean;
  onSelect?: (value: string) => void;
}

export interface CommandSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface CommandShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
}

const CommandContext = React.createContext<{
  search: string;
  setSearch: (search: string) => void;
  filtered: { count: number; items: Map<string, number> };
  value: string;
  onValueChange: (value: string) => void;
  filter: (value: string, search: string) => number;
  shouldFilter: boolean;
}>({ 
  search: '', 
  setSearch: () => {}, 
  filtered: { count: 0, items: new Map() }, 
  value: '', 
  onValueChange: () => {}, 
  filter: () => 0,
  shouldFilter: true
});

const useCommand = () => {
  const context = React.useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a Command');
  }
  return context;
};

const defaultFilter = (value: string, search: string) => {
  if (!search) return 1;
  return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
};

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ 
    className, 
    children, 
    value: controlledValue = '', 
    onValueChange, 
    filter = defaultFilter,
    shouldFilter = true,
    ...props 
  }, ref) => {
    const [search, setSearch] = React.useState('');
    const [value, setValue] = React.useState(controlledValue);
    const [filtered, setFiltered] = React.useState({ count: 0, items: new Map() });

    const currentValue = controlledValue || value;

    const handleValueChange = (newValue: string) => {
      setValue(newValue);
      onValueChange?.(newValue);
    };

    React.useEffect(() => {
      if (!shouldFilter) {
        setFiltered({ count: 0, items: new Map() });
        return;
      }

      const items = new Map();
      let count = 0;

      // This would be implemented with actual filtering logic
      // For now, we'll just track the structure
      setFiltered({ count, items });
    }, [search, shouldFilter, filter]);

    return (
      <CommandContext.Provider value={{
        search,
        setSearch,
        filtered,
        value: currentValue,
        onValueChange: handleValueChange,
        filter,
        shouldFilter
      }}>
        <div
          ref={ref}
          className={cn(
            'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </CommandContext.Provider>
    );
  }
);

Command.displayName = 'Command';

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, ...props }, ref) => {
    const { search, setSearch } = useCommand();

    return (
      <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          ref={ref}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CommandInput.displayName = 'CommandInput';

const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CommandList.displayName = 'CommandList';

const CommandEmpty = React.forwardRef<HTMLDivElement, CommandEmptyProps>(
  ({ className, children, ...props }, ref) => {
    const { filtered } = useCommand();

    if (filtered.count > 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn('py-6 text-center text-sm', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CommandEmpty.displayName = 'CommandEmpty';

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, children, heading, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('overflow-hidden p-1 text-foreground', className)}
        {...props}
      >
        {heading && (
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {heading}
          </div>
        )}
        {children}
      </div>
    );
  }
);

CommandGroup.displayName = 'CommandGroup';

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ className, children, value, disabled, onSelect, ...props }, ref) => {
    const { onValueChange } = useCommand();

    const handleSelect = () => {
      if (disabled) return;
      
      const selectValue = value || (typeof children === 'string' ? children : '');
      onSelect?.(selectValue);
      onValueChange(selectValue);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
          'hover:bg-accent hover:text-accent-foreground',
          'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        onClick={handleSelect}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CommandItem.displayName = 'CommandItem';

const CommandSeparator = React.forwardRef<HTMLDivElement, CommandSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('-mx-1 h-px bg-border', className)}
        {...props}
      />
    );
  }
);

CommandSeparator.displayName = 'CommandSeparator';

const CommandShortcut = React.forwardRef<HTMLSpanElement, CommandShortcutProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'ml-auto text-xs tracking-widest text-muted-foreground',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

CommandShortcut.displayName = 'CommandShortcut';

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut
};