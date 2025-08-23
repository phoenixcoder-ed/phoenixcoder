import * as React from 'react';
import { cn } from '../../utils/cn';
import { Check, ChevronRight, Circle, Dot } from 'lucide-react';

// 下拉菜单组件属性接口
export interface DropdownMenuProps {
  children?: React.ReactNode;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  dir?: 'ltr' | 'rtl';
}

// 下拉菜单触发器属性接口
export interface DropdownMenuTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-haspopup'> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

// 下拉菜单内容属性接口
export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionBoundary?: Element | null;
  collisionPadding?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;
  arrowPadding?: number;
  sticky?: 'partial' | 'always';
  hideWhenDetached?: boolean;
  forceMount?: boolean;
  loop?: boolean;
}

// 下拉菜单项属性接口
export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  textValue?: string;
  asChild?: boolean;
  inset?: boolean;
}

// 下拉菜单复选框项属性接口
export interface DropdownMenuCheckboxItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'aria-checked'> {
  children?: React.ReactNode;
  className?: string;
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  disabled?: boolean;
  textValue?: string;
  asChild?: boolean;
  'aria-checked'?: boolean | 'false' | 'true' | 'mixed';
}

// 下拉菜单单选项属性接口
export interface DropdownMenuRadioItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  value: string;
  disabled?: boolean;
  textValue?: string;
  asChild?: boolean;
}

// 下拉菜单标签属性接口
export interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  inset?: boolean;
  asChild?: boolean;
}

// 下拉菜单分隔符属性接口
export interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// 下拉菜单快捷键属性接口
export interface DropdownMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  className?: string;
}

// 下拉菜单子菜单属性接口
export interface DropdownMenuSubProps {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// 下拉菜单子菜单触发器属性接口
export interface DropdownMenuSubTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  textValue?: string;
  asChild?: boolean;
  inset?: boolean;
}

// 下拉菜单子菜单内容属性接口
export interface DropdownMenuSubContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionBoundary?: Element | null;
  collisionPadding?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;
  arrowPadding?: number;
  sticky?: 'partial' | 'always';
  hideWhenDetached?: boolean;
  forceMount?: boolean;
  loop?: boolean;
}

// 下拉菜单单选组属性接口
export interface DropdownMenuRadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  loop?: boolean;
}

// 下拉菜单上下文
interface DropdownMenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modal: boolean;
  dir?: 'ltr' | 'rtl';
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

const useDropdownMenu = () => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
};

// 下拉菜单子菜单上下文
interface DropdownMenuSubContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DropdownMenuSubContext = React.createContext<DropdownMenuSubContextValue | null>(null);

const useDropdownMenuSub = () => {
  const context = React.useContext(DropdownMenuSubContext);
  return context;
};

// 下拉菜单单选组上下文
interface DropdownMenuRadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const DropdownMenuRadioGroupContext = React.createContext<DropdownMenuRadioGroupContextValue | null>(null);

const useDropdownMenuRadioGroup = () => {
  const context = React.useContext(DropdownMenuRadioGroupContext);
  return context;
};

// 下拉菜单根组件
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  dir = 'ltr'
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [controlledOpen, onOpenChange]);
  
  const contextValue: DropdownMenuContextValue = {
    open,
    onOpenChange: handleOpenChange,
    modal,
    dir
  };
  
  return (
    <DropdownMenuContext.Provider value={contextValue}>
      {children}
    </DropdownMenuContext.Provider>
  );
};

// 下拉菜单触发器组件
export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>((
  {
    children,
    className,
    asChild = false,
    ...props
  },
  ref
) => {
  const { open, onOpenChange } = useDropdownMenu();
  
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onOpenChange(!open);
    props.onClick?.(event);
  }, [open, onOpenChange, props]);
  
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenChange(!open);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      onOpenChange(true);
    }
    props.onKeyDown?.(event);
  }, [open, onOpenChange, props]);
  
  if (asChild) {
    return React.cloneElement(
      React.Children.only(children) as React.ReactElement<any>,
      {
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        'data-state': open ? 'open' : 'closed',
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        ref,
        ...props
      }
    );
  }
  
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-md text-sm font-medium',
        'transition-colors focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      aria-expanded={open}
      aria-haspopup="menu"
      data-state={open ? 'open' : 'closed'}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </button>
  );
});

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

// 下拉菜单内容组件
export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>((
  {
    children,
    className,
    side = 'bottom',
    sideOffset = 4,
    align = 'center',
    alignOffset = 0,
    avoidCollisions = true,
    collisionPadding = 8,
    arrowPadding = 0,
    sticky = 'partial',
    hideWhenDetached = false,
    forceMount = false,
    loop = false,
    ...props
  },
  ref
) => {
  const { open, onOpenChange, dir } = useDropdownMenu();
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // 处理外部点击关闭
  React.useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (contentRef.current && !contentRef.current.contains(target)) {
        onOpenChange(false);
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);
  
  if (!forceMount && !open) {
    return null;
  }
  
  return (
    <div
      ref={(node) => {
        if (node) {
          (contentRef as React.MutableRefObject<HTMLDivElement>).current = node;
        }
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        side === 'bottom' && 'data-[side=bottom]:slide-in-from-top-2',
        side === 'left' && 'data-[side=left]:slide-in-from-right-2',
        side === 'right' && 'data-[side=right]:slide-in-from-left-2',
        side === 'top' && 'data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      data-state={open ? 'open' : 'closed'}
      data-side={side}
      data-align={align}
      dir={dir}
      {...props}
    >
      {children}
    </div>
  );
});

DropdownMenuContent.displayName = 'DropdownMenuContent';

// 下拉菜单项组件
export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>((
  {
    children,
    className,
    disabled = false,
    textValue,
    asChild = false,
    inset = false,
    ...props
  },
  ref
) => {
  const { onOpenChange } = useDropdownMenu();
  
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    
    props.onClick?.(event);
    
    // 点击后关闭菜单
    if (!event.defaultPrevented) {
      onOpenChange(false);
    }
  }, [disabled, props, onOpenChange]);
  
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
    
    props.onKeyDown?.(event);
  }, [disabled, handleClick, props]);
  
  if (asChild) {
    return React.cloneElement(
      React.Children.only(children) as React.ReactElement<any>,
      {
        'data-disabled': disabled ? '' : undefined,
        'aria-disabled': disabled,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        ref,
        ...props
      }
    );
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'transition-colors focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      data-disabled={disabled ? '' : undefined}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
});

DropdownMenuItem.displayName = 'DropdownMenuItem';

// 下拉菜单复选框项组件
export const DropdownMenuCheckboxItem = React.forwardRef<HTMLDivElement, DropdownMenuCheckboxItemProps>((
  {
    children,
    className,
    checked = false,
    onCheckedChange,
    disabled = false,
    textValue,
    asChild = false,
    ...props
  },
  ref
) => {
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    
    event.preventDefault();
    onCheckedChange?.(!checked);
    props.onClick?.(event);
  }, [disabled, checked, onCheckedChange, props]);
  
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(
      child,
      {
        ...props,
        ...{
          'data-state': checked ? 'checked' : 'unchecked',
          'data-disabled': disabled ? '' : undefined,
          'aria-checked': checked === 'indeterminate' ? 'mixed' : checked,
          'aria-disabled': disabled,
          onClick: handleClick,
          ref
        }
      } as any
    );
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
        'transition-colors focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      data-state={checked ? 'checked' : 'unchecked'}
      data-disabled={disabled ? '' : undefined}
      aria-checked={checked === 'indeterminate' ? 'mixed' : checked}
      aria-disabled={disabled}
      role="menuitemcheckbox"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
});

DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

// 下拉菜单单选项组件
export const DropdownMenuRadioItem = React.forwardRef<HTMLDivElement, DropdownMenuRadioItemProps>((
  {
    children,
    className,
    value,
    disabled = false,
    textValue,
    asChild = false,
    ...props
  },
  ref
) => {
  const radioGroup = useDropdownMenuRadioGroup();
  const isSelected = radioGroup?.value === value;
  
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    
    event.preventDefault();
    radioGroup?.onValueChange?.(value);
    props.onClick?.(event);
  }, [disabled, value, radioGroup, props]);
  
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(
      child,
      {
        ...props,
        ...{
          'data-state': isSelected ? 'checked' : 'unchecked',
          'data-disabled': disabled ? '' : undefined,
          'aria-checked': isSelected,
          'aria-disabled': disabled,
          onClick: handleClick,
          ref
        }
      } as any
    );
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
        'transition-colors focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      data-state={isSelected ? 'checked' : 'unchecked'}
      data-disabled={disabled ? '' : undefined}
      aria-checked={isSelected}
      aria-disabled={disabled}
      role="menuitemradio"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Circle className="h-2 w-2 fill-current" />}
      </span>
      {children}
    </div>
  );
});

DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

// 下拉菜单标签组件
export const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>((
  {
    children,
    className,
    inset = false,
    asChild = false,
    ...props
  },
  ref
) => {
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(
      child,
      {
        ...props,
        ref
      } as any
    );
  }
  
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
});

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

// 下拉菜单分隔符组件
export const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>((
  { className, ...props },
  ref
) => {
  return (
    <div
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      role="separator"
      aria-orientation="horizontal"
      {...props}
    />
  );
});

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

// 下拉菜单快捷键组件
export const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    >
      {children}
    </span>
  );
};

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

// 下拉菜单子菜单组件
export const DropdownMenuSub: React.FC<DropdownMenuSubProps> = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [controlledOpen, onOpenChange]);
  
  const contextValue: DropdownMenuSubContextValue = {
    open,
    onOpenChange: handleOpenChange
  };
  
  return (
    <DropdownMenuSubContext.Provider value={contextValue}>
      {children}
    </DropdownMenuSubContext.Provider>
  );
};

// 下拉菜单子菜单触发器组件
export const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, DropdownMenuSubTriggerProps>((
  {
    children,
    className,
    disabled = false,
    textValue,
    asChild = false,
    inset = false,
    ...props
  },
  ref
) => {
  const sub = useDropdownMenuSub();
  
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    
    event.preventDefault();
    sub?.onOpenChange(!sub.open);
    props.onClick?.(event);
  }, [disabled, sub, props]);
  
  const handleMouseEnter = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled) {
      sub?.onOpenChange(true);
    }
    props.onMouseEnter?.(event);
  }, [disabled, sub, props]);
  
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(
      child,
      {
        ...props,
        ...{
          'data-state': sub?.open ? 'open' : 'closed',
          'data-disabled': disabled ? '' : undefined,
          'aria-expanded': sub?.open,
          'aria-disabled': disabled,
          onClick: handleClick,
          onMouseEnter: handleMouseEnter,
          ref
        }
      } as any
    );
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'focus:bg-accent data-[state=open]:bg-accent',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      data-state={sub?.open ? 'open' : 'closed'}
      data-disabled={disabled ? '' : undefined}
      aria-expanded={sub?.open}
      aria-disabled={disabled}
      role="menuitem"
      aria-haspopup="menu"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </div>
  );
});

DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

// 下拉菜单子菜单内容组件
export const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, DropdownMenuSubContentProps>((
  {
    children,
    className,
    sideOffset = 4,
    alignOffset = -4,
    avoidCollisions = true,
    collisionPadding = 8,
    arrowPadding = 0,
    sticky = 'partial',
    hideWhenDetached = false,
    forceMount = false,
    loop = false,
    ...props
  },
  ref
) => {
  const sub = useDropdownMenuSub();
  
  if (!forceMount && !sub?.open) {
    return null;
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      data-state={sub?.open ? 'open' : 'closed'}
      {...props}
    >
      {children}
    </div>
  );
});

DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

// 下拉菜单单选组组件
export const DropdownMenuRadioGroup = React.forwardRef<HTMLDivElement, DropdownMenuRadioGroupProps>((
  {
    children,
    className,
    value,
    onValueChange,
    loop = false,
    ...props
  },
  ref
) => {
  const contextValue: DropdownMenuRadioGroupContextValue = {
    value,
    onValueChange
  };
  
  return (
    <DropdownMenuRadioGroupContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={className}
        role="group"
        {...props}
      >
        {children}
      </div>
    </DropdownMenuRadioGroupContext.Provider>
  );
});

DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup';

// 简单下拉菜单组件
export const SimpleDropdownMenu: React.FC<{
  trigger: React.ReactNode;
  items: Array<{
    type?: 'item' | 'checkbox' | 'radio' | 'separator' | 'label';
    label?: React.ReactNode;
    value?: string;
    checked?: boolean;
    disabled?: boolean;
    shortcut?: string;
    onClick?: () => void;
    onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  }>;
  className?: string;
  contentClassName?: string;
  side?: DropdownMenuContentProps['side'];
  align?: DropdownMenuContentProps['align'];
  radioValue?: string;
  onRadioValueChange?: (value: string) => void;
}> = ({
  trigger,
  items,
  className,
  contentClassName,
  side,
  align,
  radioValue,
  onRadioValueChange
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent className={contentClassName} side={side} align={align}>
        <DropdownMenuRadioGroup value={radioValue} onValueChange={onRadioValueChange}>
          {items.map((item, index) => {
            const key = item.value || `item-${index}`;
            
            switch (item.type) {
              case 'separator':
                return <DropdownMenuSeparator key={key} />;
              
              case 'label':
                return (
                  <DropdownMenuLabel key={key}>
                    {item.label}
                  </DropdownMenuLabel>
                );
              
              case 'checkbox':
                return (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={item.checked}
                    onCheckedChange={item.onCheckedChange}
                    disabled={item.disabled}
                  >
                    {item.label}
                    {item.shortcut && (
                      <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
                    )}
                  </DropdownMenuCheckboxItem>
                );
              
              case 'radio':
                return (
                  <DropdownMenuRadioItem
                    key={key}
                    value={item.value!}
                    disabled={item.disabled}
                  >
                    {item.label}
                    {item.shortcut && (
                      <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
                    )}
                  </DropdownMenuRadioItem>
                );
              
              default:
                return (
                  <DropdownMenuItem
                    key={key}
                    disabled={item.disabled}
                    onClick={item.onClick}
                  >
                    {item.label}
                    {item.shortcut && (
                      <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                );
            }
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};