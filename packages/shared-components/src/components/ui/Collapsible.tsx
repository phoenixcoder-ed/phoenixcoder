import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface CollapsibleProps {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  forceMount?: boolean;
}

const CollapsibleContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
}>({ open: false, onOpenChange: () => {}, disabled: false });

const useCollapsible = () => {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible');
  }
  return context;
};

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ className, children, open: controlledOpen, defaultOpen = false, onOpenChange, disabled = false, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
      if (disabled) return;
      
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    };

    return (
      <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange, disabled }}>
        <div
          ref={ref}
          className={cn('w-full', className)}
          data-state={open ? 'open' : 'closed'}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);

Collapsible.displayName = 'Collapsible';

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { open, onOpenChange, disabled } = useCollapsible();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onOpenChange(!open);
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex w-full items-center justify-between py-4 font-medium transition-all hover:underline',
          '[&[data-state=open]>svg]:rotate-180',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        data-state={open ? 'open' : 'closed'}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    );
  }
);

CollapsibleTrigger.displayName = 'CollapsibleTrigger';

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children, forceMount = false, ...props }, ref) => {
    const { open } = useCollapsible();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [height, setHeight] = React.useState<number | undefined>(open ? undefined : 0);

    React.useEffect(() => {
      const element = contentRef.current;
      if (!element) return;

      if (open) {
        const scrollHeight = element.scrollHeight;
        setHeight(scrollHeight);
        
        const timer = setTimeout(() => {
          setHeight(undefined);
        }, 200);
        
        return () => clearTimeout(timer);
      } else {
        setHeight(element.scrollHeight);
        
        const animationFrame = requestAnimationFrame(() => {
          setHeight(0);
        });
        
        return () => cancelAnimationFrame(animationFrame);
      }
    }, [open]);

    if (!forceMount && !open && height === 0) {
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
          'overflow-hidden text-sm transition-all duration-200 ease-in-out',
          className
        )}
        style={{ height }}
        data-state={open ? 'open' : 'closed'}
        {...props}
      >
        <div className="pb-4 pt-0">
          {children}
        </div>
      </div>
    );
  }
);

CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };