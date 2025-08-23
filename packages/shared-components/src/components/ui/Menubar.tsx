import React from 'react';
import { cn } from '../../utils/cn';
import { Check, ChevronRight, Circle } from 'lucide-react';

export interface MenubarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  dir?: 'ltr' | 'rtl';
  loop?: boolean;
}

export interface MenubarMenuProps {
  children: React.ReactNode;
  value: string;
}

export interface MenubarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export interface MenubarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionBoundary?: Element | null;
  collisionPadding?: number;
  arrowPadding?: number;
  sticky?: 'partial' | 'always';
  hideWhenDetached?: boolean;
  forceMount?: boolean;
  loop?: boolean;
}

export interface MenubarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  textValue?: string;
  asChild?: boolean;
  inset?: boolean;
}

export interface MenubarCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  textValue?: string;
  asChild?: boolean;
}

export interface MenubarRadioItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  value: string;
  disabled?: boolean;
  textValue?: string;
  asChild?: boolean;
}

export interface MenubarLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
  asChild?: boolean;
}

export interface MenubarSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface MenubarShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
}

export interface MenubarSubProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface MenubarSubTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  textValue?: string;
  asChild?: boolean;
  inset?: boolean;
}

export interface MenubarSubContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionBoundary?: Element | null;
  collisionPadding?: number;
  arrowPadding?: number;
  sticky?: 'partial' | 'always';
  hideWhenDetached?: boolean;
  forceMount?: boolean;
  loop?: boolean;
}

export interface MenubarRadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  loop?: boolean;
}

const MenubarContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  dir: 'ltr' | 'rtl';
  loop: boolean;
}>({ 
  dir: 'ltr',
  loop: false
});

const useMenubar = () => {
  const context = React.useContext(MenubarContext);
  if (!context) {
    throw new Error('useMenubar must be used within a Menubar');
  }
  return context;
};

const MenubarMenuContext = React.createContext<{
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({ 
  value: '',
  open: false,
  onOpenChange: () => {}
});

const useMenubarMenu = () => {
  const context = React.useContext(MenubarMenuContext);
  if (!context) {
    throw new Error('useMenubarMenu must be used within a MenubarMenu');
  }
  return context;
};

const MenubarSubContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({ 
  open: false,
  onOpenChange: () => {}
});

const useMenubarSub = () => {
  const context = React.useContext(MenubarSubContext);
  return context;
};

const MenubarRadioGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

const useMenubarRadioGroup = () => {
  const context = React.useContext(MenubarRadioGroupContext);
  return context;
};

const Menubar = React.forwardRef<HTMLDivElement, MenubarProps>(
  ({ 
    className, 
    children, 
    value: controlledValue,
    onValueChange,
    defaultValue,
    dir = 'ltr',
    loop = false,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleValueChange = React.useCallback((newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    }, [controlledValue, onValueChange]);

    return (
      <MenubarContext.Provider value={{ value, onValueChange: handleValueChange, dir, loop }}>
        <div
          ref={ref}
          className={cn(
            'flex h-10 items-center space-x-1 rounded-md border bg-background p-1',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </MenubarContext.Provider>
    );
  }
);

Menubar.displayName = 'Menubar';

const MenubarMenu = React.forwardRef<HTMLDivElement, MenubarMenuProps>(
  ({ children, value }, ref) => {
    const { value: menubarValue, onValueChange } = useMenubar();
    const [open, setOpen] = React.useState(false);

    const isOpen = menubarValue === value;

    const handleOpenChange = React.useCallback((newOpen: boolean) => {
      setOpen(newOpen);
      if (newOpen) {
        onValueChange?.(value);
      } else if (isOpen) {
        onValueChange?.('');
      }
    }, [value, onValueChange, isOpen]);

    React.useEffect(() => {
      setOpen(isOpen);
    }, [isOpen]);

    return (
      <MenubarMenuContext.Provider value={{ value, open, onOpenChange: handleOpenChange }}>
        <div ref={ref}>
          {children}
        </div>
      </MenubarMenuContext.Provider>
    );
  }
);

MenubarMenu.displayName = 'MenubarMenu';

const MenubarTrigger = React.forwardRef<HTMLButtonElement, MenubarTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useMenubarMenu();

    return (
      <button
        ref={ref}
        className={cn(
          'flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none',
          'focus:bg-accent focus:text-accent-foreground',
          'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          open && 'bg-accent text-accent-foreground',
          className
        )}
        data-state={open ? 'open' : 'closed'}
        onClick={() => onOpenChange(!open)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

MenubarTrigger.displayName = 'MenubarTrigger';

const MenubarContent = React.forwardRef<HTMLDivElement, MenubarContentProps>(
  ({ 
    className, 
    children, 
    side = 'bottom',
    sideOffset = 4,
    align = 'start',
    alignOffset = 0,
    avoidCollisions = true,
    collisionPadding = 8,
    loop = false,
    ...props 
  }, ref) => {
    const { open } = useMenubarMenu();

    if (!open) return null;

    return (
      <>
        <div className="fixed inset-0 z-40" />
        <div
          ref={ref}
          className={cn(
            'absolute z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95',
            side === 'bottom' && 'slide-in-from-top-2',
            side === 'top' && 'slide-in-from-bottom-2',
            side === 'right' && 'slide-in-from-left-2',
            side === 'left' && 'slide-in-from-right-2',
            className
          )}
          style={{
            top: side === 'bottom' ? '100%' : undefined,
            bottom: side === 'top' ? '100%' : undefined,
            left: side === 'right' ? '100%' : align === 'start' ? 0 : undefined,
            right: side === 'left' ? '100%' : align === 'end' ? 0 : undefined,
            marginTop: side === 'bottom' ? sideOffset : undefined,
            marginBottom: side === 'top' ? sideOffset : undefined,
            marginLeft: side === 'right' ? sideOffset : undefined,
            marginRight: side === 'left' ? sideOffset : undefined
          }}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);

MenubarContent.displayName = 'MenubarContent';

const MenubarItem = React.forwardRef<HTMLDivElement, MenubarItemProps>(
  ({ className, children, disabled, inset, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
          'focus:bg-accent focus:text-accent-foreground',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          inset && 'pl-8',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        data-disabled={disabled}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MenubarItem.displayName = 'MenubarItem';

const MenubarCheckboxItem = React.forwardRef<HTMLDivElement, MenubarCheckboxItemProps>(
  ({ className, children, checked, onCheckedChange, disabled, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
          'focus:bg-accent focus:text-accent-foreground',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        data-disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {checked && <Check className="h-4 w-4" />}
        </span>
        {children}
      </div>
    );
  }
);

MenubarCheckboxItem.displayName = 'MenubarCheckboxItem';

const MenubarRadioItem = React.forwardRef<HTMLDivElement, MenubarRadioItemProps>(
  ({ className, children, value, disabled, ...props }, ref) => {
    const { value: groupValue, onValueChange } = useMenubarRadioGroup() || {};
    const isSelected = groupValue === value;

    const handleClick = () => {
      if (!disabled && onValueChange) {
        onValueChange(value);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
          'focus:bg-accent focus:text-accent-foreground',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        data-disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <Circle className="h-2 w-2 fill-current" />}
        </span>
        {children}
      </div>
    );
  }
);

MenubarRadioItem.displayName = 'MenubarRadioItem';

const MenubarLabel = React.forwardRef<HTMLDivElement, MenubarLabelProps>(
  ({ className, children, inset, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-2 py-1.5 text-sm font-semibold',
          inset && 'pl-8',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MenubarLabel.displayName = 'MenubarLabel';

const MenubarSeparator = React.forwardRef<HTMLDivElement, MenubarSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('-mx-1 my-1 h-px bg-muted', className)}
        {...props}
      />
    );
  }
);

MenubarSeparator.displayName = 'MenubarSeparator';

const MenubarShortcut = React.forwardRef<HTMLSpanElement, MenubarShortcutProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

MenubarShortcut.displayName = 'MenubarShortcut';

const MenubarSub = React.forwardRef<HTMLDivElement, MenubarSubProps>(
  ({ children, open: controlledOpen, defaultOpen = false, onOpenChange }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

    const handleOpenChange = React.useCallback((newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    }, [controlledOpen, onOpenChange]);

    return (
      <MenubarSubContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
        <div ref={ref}>
          {children}
        </div>
      </MenubarSubContext.Provider>
    );
  }
);

MenubarSub.displayName = 'MenubarSub';

const MenubarSubTrigger = React.forwardRef<HTMLDivElement, MenubarSubTriggerProps>(
  ({ className, children, disabled, inset, ...props }, ref) => {
    const { open, onOpenChange } = useMenubarSub() || { open: false, onOpenChange: () => {} };

    return (
      <div
        ref={ref}
        className={cn(
          'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
          'focus:bg-accent focus:text-accent-foreground',
          'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          inset && 'pl-8',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        data-state={open ? 'open' : 'closed'}
        onMouseEnter={() => onOpenChange(true)}
        onMouseLeave={() => onOpenChange(false)}
        {...props}
      >
        {children}
        <ChevronRight className="ml-auto h-4 w-4" />
      </div>
    );
  }
);

MenubarSubTrigger.displayName = 'MenubarSubTrigger';

const MenubarSubContent = React.forwardRef<HTMLDivElement, MenubarSubContentProps>(
  ({ className, children, sideOffset = 4, ...props }, ref) => {
    const { open } = useMenubarSub() || { open: false };

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute left-full top-0 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
          'animate-in slide-in-from-left-1',
          className
        )}
        style={{
          marginLeft: sideOffset
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MenubarSubContent.displayName = 'MenubarSubContent';

const MenubarRadioGroup = React.forwardRef<HTMLDivElement, MenubarRadioGroupProps>(
  ({ className, children, value, onValueChange, ...props }, ref) => {
    return (
      <MenubarRadioGroupContext.Provider value={{ value, onValueChange }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </MenubarRadioGroupContext.Provider>
    );
  }
);

MenubarRadioGroup.displayName = 'MenubarRadioGroup';

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarRadioGroup
};