import * as React from 'react';
import { cn } from '../../utils/cn';

export interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
}

export interface HoverCardTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export interface HoverCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
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
}

const HoverCardContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  openDelay: number;
  closeDelay: number;
}>({ 
  open: false, 
  setOpen: () => {}, 
  openDelay: 700,
  closeDelay: 300
});

const useHoverCard = () => {
  const context = React.useContext(HoverCardContext);
  if (!context) {
    throw new Error('useHoverCard must be used within a HoverCard');
  }
  return context;
};

const HoverCard = React.forwardRef<HTMLDivElement, HoverCardProps>(
  ({ className, children, openDelay = 700, closeDelay = 300, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const openTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleOpenChange = React.useCallback((newOpen: boolean) => {
      // Clear existing timeouts
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }

      if (newOpen) {
        openTimeoutRef.current = setTimeout(() => {
          setOpen(true);
        }, openDelay);
      } else {
        closeTimeoutRef.current = setTimeout(() => {
          setOpen(false);
        }, closeDelay);
      }
    }, [openDelay, closeDelay]);

    React.useEffect(() => {
      return () => {
        if (openTimeoutRef.current) {
          clearTimeout(openTimeoutRef.current);
        }
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    }, []);

    return (
      <HoverCardContext.Provider value={{ open, setOpen: handleOpenChange, openDelay, closeDelay }}>
        <div ref={ref} className={cn('relative inline-block', className)} {...props}>
          {children}
        </div>
      </HoverCardContext.Provider>
    );
  }
);

HoverCard.displayName = 'HoverCard';

const HoverCardTrigger = React.forwardRef<HTMLDivElement, HoverCardTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { setOpen } = useHoverCard();

    const handleMouseEnter = () => {
      setOpen(true);
    };

    const handleMouseLeave = () => {
      setOpen(false);
    };

    return (
      <div
        ref={ref}
        className={cn('cursor-pointer', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    );
  }
);

HoverCardTrigger.displayName = 'HoverCardTrigger';

const HoverCardContent = React.forwardRef<HTMLDivElement, HoverCardContentProps>(
  ({ 
    className, 
    children, 
    side = 'bottom', 
    sideOffset = 4, 
    align = 'center',
    alignOffset = 0,
    avoidCollisions = true,
    collisionPadding = 10,
    arrowPadding = 0,
    sticky = 'partial',
    hideWhenDetached = false,
    forceMount = false,
    ...props 
  }, ref) => {
    const { open } = useHoverCard();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });

    React.useEffect(() => {
      if (open && contentRef.current) {
        const content = contentRef.current;
        const trigger = content.parentElement?.querySelector('[data-hover-card-trigger]');
        
        if (trigger) {
          const triggerRect = trigger.getBoundingClientRect();
          const contentRect = content.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          let x = 0;
          let y = 0;

          // Calculate position based on side
          switch (side) {
            case 'top':
              x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
              y = triggerRect.top - contentRect.height - sideOffset;
              break;
            case 'right':
              x = triggerRect.right + sideOffset;
              y = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
              break;
            case 'bottom':
              x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
              y = triggerRect.bottom + sideOffset;
              break;
            case 'left':
              x = triggerRect.left - contentRect.width - sideOffset;
              y = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
              break;
          }

          // Apply align offset
          if (side === 'top' || side === 'bottom') {
            if (align === 'start') x = triggerRect.left + alignOffset;
            if (align === 'end') x = triggerRect.right - contentRect.width - alignOffset;
          } else {
            if (align === 'start') y = triggerRect.top + alignOffset;
            if (align === 'end') y = triggerRect.bottom - contentRect.height - alignOffset;
          }

          // Avoid collisions if enabled
          if (avoidCollisions) {
            x = Math.max(collisionPadding, Math.min(x, viewportWidth - contentRect.width - collisionPadding));
            y = Math.max(collisionPadding, Math.min(y, viewportHeight - contentRect.height - collisionPadding));
          }

          setPosition({ x, y });
        }
      }
    }, [open, side, sideOffset, align, alignOffset, avoidCollisions, collisionPadding]);

    if (!open && !forceMount) return null;

    return (
      <>
        {open && <div className="fixed inset-0 z-40" />}
        <div
          ref={(node) => {
            if (node) {
              (contentRef as React.MutableRefObject<HTMLDivElement>).current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }
          }}
          className={cn(
            'fixed z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
            'animate-in fade-in-0 zoom-in-95',
            !open && 'animate-out fade-out-0 zoom-out-95',
            className
          )}
          style={{
            left: position.x,
            top: position.y,
            visibility: open ? 'visible' : 'hidden'
          }}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);

HoverCardContent.displayName = 'HoverCardContent';

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
};