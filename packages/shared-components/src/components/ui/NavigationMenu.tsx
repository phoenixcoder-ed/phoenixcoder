import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface NavigationMenuProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  delayDuration?: number;
  skipDelayDuration?: number;
  dir?: 'ltr' | 'rtl';
  orientation?: 'horizontal' | 'vertical';
}

export interface NavigationMenuListProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode;
  className?: string;
}

export interface NavigationMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
  className?: string;
  value?: string;
}

export interface NavigationMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export interface NavigationMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  forceMount?: boolean;
}

export interface NavigationMenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  active?: boolean;
}

export interface NavigationMenuIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  forceMount?: boolean;
}

export interface NavigationMenuViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  forceMount?: boolean;
}

const NavigationMenuContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  delayDuration: number;
  skipDelayDuration: number;
  dir: 'ltr' | 'rtl';
  orientation: 'horizontal' | 'vertical';
  isRootMenu: boolean;
}>({ 
  delayDuration: 200,
  skipDelayDuration: 300,
  dir: 'ltr',
  orientation: 'horizontal',
  isRootMenu: true
});

const useNavigationMenu = () => {
  const context = React.useContext(NavigationMenuContext);
  if (!context) {
    throw new Error('useNavigationMenu must be used within a NavigationMenu');
  }
  return context;
};

const NavigationMenuItemContext = React.createContext<{
  value?: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onTriggerEnter: () => void;
  onTriggerLeave: () => void;
  onContentEnter: () => void;
  onContentLeave: () => void;
  wasEscapeCloseRef: React.MutableRefObject<boolean>;
}>({ 
  triggerRef: { current: null },
  contentRef: { current: null },
  onTriggerEnter: () => {},
  onTriggerLeave: () => {},
  onContentEnter: () => {},
  onContentLeave: () => {},
  wasEscapeCloseRef: { current: false }
});

const useNavigationMenuItem = () => {
  const context = React.useContext(NavigationMenuItemContext);
  if (!context) {
    throw new Error('useNavigationMenuItem must be used within a NavigationMenuItem');
  }
  return context;
};

const NavigationMenu = React.forwardRef<HTMLElement, NavigationMenuProps>(
  ({ 
    className, 
    children, 
    value: controlledValue,
    onValueChange,
    defaultValue,
    delayDuration = 200,
    skipDelayDuration = 300,
    dir = 'ltr',
    orientation = 'horizontal',
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
      <NavigationMenuContext.Provider 
        value={{ 
          value, 
          onValueChange: handleValueChange, 
          delayDuration, 
          skipDelayDuration, 
          dir, 
          orientation,
          isRootMenu: true
        }}
      >
        <nav
          ref={ref}
          className={cn(
            'relative z-10 flex max-w-max flex-1 items-center justify-center',
            className
          )}
          data-orientation={orientation}
          dir={dir}
          {...props}
        >
          {children}
        </nav>
      </NavigationMenuContext.Provider>
    );
  }
);

NavigationMenu.displayName = 'NavigationMenu';

const NavigationMenuList = React.forwardRef<HTMLUListElement, NavigationMenuListProps>(
  ({ className, children, ...props }, ref) => {
    const { orientation } = useNavigationMenu();

    return (
      <ul
        ref={ref}
        className={cn(
          'group flex flex-1 list-none items-center justify-center space-x-1',
          orientation === 'vertical' && 'flex-col space-x-0 space-y-1',
          className
        )}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </ul>
    );
  }
);

NavigationMenuList.displayName = 'NavigationMenuList';

const NavigationMenuItem = React.forwardRef<HTMLLIElement, NavigationMenuItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { value: menuValue, onValueChange, delayDuration } = useNavigationMenu();
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const wasEscapeCloseRef = React.useRef(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const openTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
    const closeTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

    const isSelected = value && menuValue === value;

    const handleOpen = React.useCallback(() => {
      if (value && onValueChange) {
        onValueChange(value);
        setIsOpen(true);
      }
    }, [value, onValueChange]);

    const handleClose = React.useCallback(() => {
      if (onValueChange) {
        onValueChange('');
        setIsOpen(false);
      }
    }, [onValueChange]);

    const onTriggerEnter = React.useCallback(() => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      openTimerRef.current = setTimeout(handleOpen, delayDuration);
    }, [handleOpen, delayDuration]);

    const onTriggerLeave = React.useCallback(() => {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
      }
      closeTimerRef.current = setTimeout(handleClose, delayDuration);
    }, [handleClose, delayDuration]);

    const onContentEnter = React.useCallback(() => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    }, []);

    const onContentLeave = React.useCallback(() => {
      closeTimerRef.current = setTimeout(handleClose, delayDuration);
    }, [handleClose, delayDuration]);

    React.useEffect(() => {
      setIsOpen(!!isSelected);
    }, [isSelected]);

    React.useEffect(() => {
      return () => {
        if (openTimerRef.current) {
          clearTimeout(openTimerRef.current);
        }
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
        }
      };
    }, []);

    return (
      <NavigationMenuItemContext.Provider 
        value={{
          value,
          triggerRef,
          contentRef,
          onTriggerEnter,
          onTriggerLeave,
          onContentEnter,
          onContentLeave,
          wasEscapeCloseRef
        }}
      >
        <li ref={ref} className={className} {...props}>
          {children}
        </li>
      </NavigationMenuItemContext.Provider>
    );
  }
);

NavigationMenuItem.displayName = 'NavigationMenuItem';

const NavigationMenuTrigger = React.forwardRef<HTMLButtonElement, NavigationMenuTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { value, triggerRef, onTriggerEnter, onTriggerLeave } = useNavigationMenuItem();
    const { value: menuValue } = useNavigationMenu();
    const isOpen = value && menuValue === value;

    return (
      <button
        ref={(node) => {
          (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:bg-accent focus:text-accent-foreground focus:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',
          'data-[active]:bg-accent/50 data-[state=open]:bg-accent/50',
          isOpen && 'bg-accent/50',
          className
        )}
        data-state={isOpen ? 'open' : 'closed'}
        onMouseEnter={onTriggerEnter}
        onMouseLeave={onTriggerLeave}
        onFocus={onTriggerEnter}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            'relative top-[1px] ml-1 h-3 w-3 transition duration-200',
            'group-data-[state=open]:rotate-180',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>
    );
  }
);

NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

const NavigationMenuContent = React.forwardRef<HTMLDivElement, NavigationMenuContentProps>(
  ({ className, children, forceMount, ...props }, ref) => {
    const { value, contentRef, onContentEnter, onContentLeave } = useNavigationMenuItem();
    const { value: menuValue } = useNavigationMenu();
    const isOpen = value && menuValue === value;

    if (!isOpen && !forceMount) return null;

    return (
      <div
        ref={(node) => {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          'absolute left-0 top-0 w-full',
          'data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out',
          'data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out',
          'data-[motion=from-end]:slide-in-from-right-52',
          'data-[motion=from-start]:slide-in-from-left-52',
          'data-[motion=to-end]:slide-out-to-right-52',
          'data-[motion=to-start]:slide-out-to-left-52',
          className
        )}
        data-state={isOpen ? 'open' : 'closed'}
        onMouseEnter={onContentEnter}
        onMouseLeave={onContentLeave}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NavigationMenuContent.displayName = 'NavigationMenuContent';

const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(
  ({ className, children, active, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:bg-accent focus:text-accent-foreground',
          active && 'bg-accent text-accent-foreground',
          className
        )}
        data-active={active}
        {...props}
      >
        {children}
      </a>
    );
  }
);

NavigationMenuLink.displayName = 'NavigationMenuLink';

const NavigationMenuIndicator = React.forwardRef<HTMLDivElement, NavigationMenuIndicatorProps>(
  ({ className, forceMount, ...props }, ref) => {
    const { value } = useNavigationMenu();
    const isVisible = !!value;

    if (!isVisible && !forceMount) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden',
          'data-[state=visible]:animate-in data-[state=hidden]:animate-out',
          'data-[state=visible]:fade-in data-[state=hidden]:fade-out',
          className
        )}
        data-state={isVisible ? 'visible' : 'hidden'}
        {...props}
      >
        <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
      </div>
    );
  }
);

NavigationMenuIndicator.displayName = 'NavigationMenuIndicator';

const NavigationMenuViewport = React.forwardRef<HTMLDivElement, NavigationMenuViewportProps>(
  ({ className, forceMount, ...props }, ref) => {
    const { value } = useNavigationMenu();
    const isVisible = !!value;

    if (!isVisible && !forceMount) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute left-0 top-full flex justify-center',
          'data-[state=visible]:animate-in data-[state=hidden]:animate-out',
          'data-[state=visible]:zoom-in-90 data-[state=hidden]:zoom-out-95',
          className
        )}
        data-state={isVisible ? 'visible' : 'hidden'}
        {...props}
      >
        <div className="h-[var(--radix-navigation-menu-viewport-height)] w-full origin-top-center overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg" />
      </div>
    );
  }
);

NavigationMenuViewport.displayName = 'NavigationMenuViewport';

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport
};