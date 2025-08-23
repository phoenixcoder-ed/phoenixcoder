import React from 'react';
import { cn } from '../../utils/cn';
import { Check, ChevronRight, Circle } from 'lucide-react';

export interface ContextMenuProps {
  children: React.ReactNode;
  className?: string;
}

export interface ContextMenuTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export interface ContextMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  alignOffset?: number;
}

export interface ContextMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  inset?: boolean;
}

export interface ContextMenuCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  checked?: boolean;
  disabled?: boolean;
}

export interface ContextMenuRadioItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  value: string;
  disabled?: boolean;
}

export interface ContextMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}

export interface ContextMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface ContextMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
}

export interface ContextMenuSubProps {
  children: React.ReactNode;
  className?: string;
}

export interface ContextMenuSubTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  inset?: boolean;
}

export interface ContextMenuSubContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const ContextMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
}>({ 
  open: false, 
  setOpen: () => {}, 
  position: { x: 0, y: 0 }, 
  setPosition: () => {} 
});

const useContextMenu = () => {
  const context = React.useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenu');
  }
  return context;
};

const ContextMenu = React.forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ className, children, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });

    React.useEffect(() => {
      const handleClickOutside = () => setOpen(false);
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };

      if (open) {
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
        };
      }
      
      return () => {};
    }, [open]);

    return (
      <ContextMenuContext.Provider value={{ open, setOpen, position, setPosition }}>
        <div ref={ref} className={cn('relative', className)} {...props}>
          {children}
        </div>
      </ContextMenuContext.Provider>
    );
  }
);

ContextMenu.displayName = 'ContextMenu';

const ContextMenuTrigger = React.forwardRef<HTMLDivElement, ContextMenuTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { setOpen, setPosition } = useContextMenu();

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
      setOpen(true);
    };

    return (
      <div
        ref={ref}
        className={cn('cursor-context-menu', className)}
        onContextMenu={handleContextMenu}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ContextMenuTrigger.displayName = 'ContextMenuTrigger';

const ContextMenuContent = React.forwardRef<HTMLDivElement, ContextMenuContentProps>(
  ({ className, children, sideOffset = 4, alignOffset = 0, ...props }, ref) => {
    const { open, position } = useContextMenu();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (open && contentRef.current) {
        const content = contentRef.current;
        const rect = content.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = position.x + sideOffset;
        let y = position.y + sideOffset;

        // Adjust position if content would overflow viewport
        if (x + rect.width > viewportWidth) {
          x = position.x - rect.width - sideOffset;
        }
        if (y + rect.height > viewportHeight) {
          y = position.y - rect.height - sideOffset;
        }

        content.style.left = `${Math.max(0, x)}px`;
        content.style.top = `${Math.max(0, y)}px`;
      }
    }, [open, position, sideOffset]);

    if (!open) return null;

    return (
      <>
        <div className="fixed inset-0 z-50" />
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
            'fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);

ContextMenuContent.displayName = 'ContextMenuContent';

const ContextMenuItem = React.forwardRef<HTMLDivElement, ContextMenuItemProps>(
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

ContextMenuItem.displayName = 'ContextMenuItem';

const ContextMenuCheckboxItem = React.forwardRef<HTMLDivElement, ContextMenuCheckboxItemProps>(
  ({ className, children, checked, disabled, ...props }, ref) => {
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

ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem';

const ContextMenuRadioItem = React.forwardRef<HTMLDivElement, ContextMenuRadioItemProps>(
  ({ className, children, disabled, ...props }, ref) => {
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
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Circle className="h-2 w-2 fill-current" />
        </span>
        {children}
      </div>
    );
  }
);

ContextMenuRadioItem.displayName = 'ContextMenuRadioItem';

const ContextMenuLabel = React.forwardRef<HTMLDivElement, ContextMenuLabelProps>(
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

ContextMenuLabel.displayName = 'ContextMenuLabel';

const ContextMenuSeparator = React.forwardRef<HTMLDivElement, ContextMenuSeparatorProps>(
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

ContextMenuSeparator.displayName = 'ContextMenuSeparator';

const ContextMenuShortcut = React.forwardRef<HTMLSpanElement, ContextMenuShortcutProps>(
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

ContextMenuShortcut.displayName = 'ContextMenuShortcut';

const ContextMenuSub = React.forwardRef<HTMLDivElement, ContextMenuSubProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);

ContextMenuSub.displayName = 'ContextMenuSub';

const ContextMenuSubTrigger = React.forwardRef<HTMLDivElement, ContextMenuSubTriggerProps>(
  ({ className, children, disabled, inset, ...props }, ref) => {
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
        {...props}
      >
        {children}
        <ChevronRight className="ml-auto h-4 w-4" />
      </div>
    );
  }
);

ContextMenuSubTrigger.displayName = 'ContextMenuSubTrigger';

const ContextMenuSubContent = React.forwardRef<HTMLDivElement, ContextMenuSubContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
          'animate-in slide-in-from-left-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ContextMenuSubContent.displayName = 'ContextMenuSubContent';

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
};