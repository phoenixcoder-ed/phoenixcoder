import React from 'react';
import { cn } from '../../utils/cn';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  type?: 'auto' | 'always' | 'scroll' | 'hover';
  scrollHideDelay?: number;
  dir?: 'ltr' | 'rtl';
  orientation?: 'vertical' | 'horizontal' | 'both';
  asChild?: boolean;
}

export interface ScrollAreaViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export interface ScrollAreaScrollbarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  forceMount?: boolean;
}

export interface ScrollAreaThumbProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface ScrollAreaCornerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const ScrollAreaContext = React.createContext<{
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  type: 'auto' | 'always' | 'scroll' | 'hover';
  scrollHideDelay: number;
  dir: 'ltr' | 'rtl';
  orientation: 'vertical' | 'horizontal' | 'both';
}>({ 
  scrollAreaRef: { current: null },
  viewportRef: { current: null },
  type: 'hover',
  scrollHideDelay: 600,
  dir: 'ltr',
  orientation: 'both'
});

const useScrollArea = () => {
  const context = React.useContext(ScrollAreaContext);
  if (!context) {
    throw new Error('useScrollArea must be used within a ScrollArea');
  }
  return context;
};

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ 
    className, 
    children, 
    type = 'hover',
    scrollHideDelay = 600,
    dir = 'ltr',
    orientation = 'both',
    ...props 
  }, ref) => {
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = React.useState(false);
    const [showScrollbar, setShowScrollbar] = React.useState(type === 'always');
    const hideTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

    React.useImperativeHandle(ref, () => scrollAreaRef.current!, []);

    const handleScroll = React.useCallback(() => {
      if (type === 'hover' || type === 'scroll') {
        setIsScrolling(true);
        setShowScrollbar(true);
        
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        
        hideTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
          if (type === 'scroll') {
            setShowScrollbar(false);
          }
        }, scrollHideDelay);
      }
    }, [type, scrollHideDelay]);

    const handleMouseEnter = React.useCallback(() => {
      if (type === 'hover') {
        setShowScrollbar(true);
      }
    }, [type]);

    const handleMouseLeave = React.useCallback(() => {
      if (type === 'hover' && !isScrolling) {
        setShowScrollbar(false);
      }
    }, [type, isScrolling]);

    React.useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      viewport.addEventListener('scroll', handleScroll);
      return () => viewport.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    React.useEffect(() => {
      return () => {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
      };
    }, []);

    return (
      <ScrollAreaContext.Provider 
        value={{ 
          scrollAreaRef, 
          viewportRef, 
          type, 
          scrollHideDelay, 
          dir, 
          orientation 
        }}
      >
        <div
          ref={scrollAreaRef}
          className={cn('relative overflow-hidden', className)}
          data-orientation={orientation}
          dir={dir}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...props}
        >
          {children}
          {(orientation === 'vertical' || orientation === 'both') && (
            <ScrollAreaScrollbar 
              orientation="vertical" 
              className={cn(
                'transition-opacity duration-150',
                showScrollbar ? 'opacity-100' : 'opacity-0'
              )}
            >
              <ScrollAreaThumb />
            </ScrollAreaScrollbar>
          )}
          {(orientation === 'horizontal' || orientation === 'both') && (
            <ScrollAreaScrollbar 
              orientation="horizontal"
              className={cn(
                'transition-opacity duration-150',
                showScrollbar ? 'opacity-100' : 'opacity-0'
              )}
            >
              <ScrollAreaThumb />
            </ScrollAreaScrollbar>
          )}
          {orientation === 'both' && <ScrollAreaCorner />}
        </div>
      </ScrollAreaContext.Provider>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

const ScrollAreaViewport = React.forwardRef<HTMLDivElement, ScrollAreaViewportProps>(
  ({ className, children, ...props }, ref) => {
    const { viewportRef, orientation } = useScrollArea();

    return (
      <div
        ref={(node) => {
          if (node) {
            (viewportRef as React.MutableRefObject<HTMLDivElement>).current = node;
          }
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          'h-full w-full rounded-[inherit]',
          orientation === 'vertical' && 'overflow-y-auto overflow-x-hidden',
          orientation === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
          orientation === 'both' && 'overflow-auto',
          className
        )}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollAreaViewport.displayName = 'ScrollAreaViewport';

const ScrollAreaScrollbar = React.forwardRef<HTMLDivElement, ScrollAreaScrollbarProps>(
  ({ className, orientation = 'vertical', forceMount, ...props }, ref) => {
    const { viewportRef } = useScrollArea();
    const [thumbSize, setThumbSize] = React.useState(0);
    const [thumbPosition, setThumbPosition] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);
    const scrollbarRef = React.useRef<HTMLDivElement>(null);
    const thumbRef = React.useRef<HTMLDivElement>(null);

    const isVertical = orientation === 'vertical';

    const updateScrollbar = React.useCallback(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const scrollSize = isVertical ? viewport.scrollHeight : viewport.scrollWidth;
      const clientSize = isVertical ? viewport.clientHeight : viewport.clientWidth;
      const scrollPos = isVertical ? viewport.scrollTop : viewport.scrollLeft;

      const thumbSizeRatio = clientSize / scrollSize;
      const thumbPositionRatio = scrollPos / (scrollSize - clientSize);

      setThumbSize(Math.max(thumbSizeRatio * 100, 10)); // Minimum 10% size
      setThumbPosition(thumbPositionRatio * (100 - thumbSizeRatio * 100));
    }, [isVertical, viewportRef]);

    const handleThumbMouseDown = React.useCallback((event: React.MouseEvent) => {
      event.preventDefault();
      setIsDragging(true);
      
      const startPos = isVertical ? event.clientY : event.clientX;
      const viewport = viewportRef.current;
      const scrollbar = scrollbarRef.current;
      
      if (!viewport || !scrollbar) return;
      
      const scrollbarSize = isVertical ? scrollbar.clientHeight : scrollbar.clientWidth;
      const scrollSize = isVertical ? viewport.scrollHeight : viewport.scrollWidth;
      const clientSize = isVertical ? viewport.clientHeight : viewport.clientWidth;
      const startScrollPos = isVertical ? viewport.scrollTop : viewport.scrollLeft;
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentPos = isVertical ? moveEvent.clientY : moveEvent.clientX;
        const delta = currentPos - startPos;
        const scrollRatio = delta / scrollbarSize;
        const scrollDelta = scrollRatio * (scrollSize - clientSize);
        
        if (isVertical) {
          viewport.scrollTop = startScrollPos + scrollDelta;
        } else {
          viewport.scrollLeft = startScrollPos + scrollDelta;
        }
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, [isVertical, viewportRef]);

    React.useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      updateScrollbar();
      viewport.addEventListener('scroll', updateScrollbar);
      
      const resizeObserver = new ResizeObserver(updateScrollbar);
      resizeObserver.observe(viewport);
      
      return () => {
        viewport.removeEventListener('scroll', updateScrollbar);
        resizeObserver.disconnect();
      };
    }, [updateScrollbar, viewportRef]);

    if (thumbSize >= 100 && !forceMount) return null;

    return (
      <div
        ref={(node) => {
          scrollbarRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          'flex touch-none select-none transition-colors',
          isVertical
            ? 'absolute right-0 top-0 h-full w-2.5 border-l border-l-transparent p-[1px]'
            : 'absolute bottom-0 left-0 h-2.5 w-full border-t border-t-transparent p-[1px]',
          className
        )}
        data-orientation={orientation}
        {...props}
      >
        <div
          ref={thumbRef}
          className={cn(
            'relative flex-1 rounded-full bg-border transition-colors',
            'hover:bg-border/80',
            isDragging && 'bg-border/80'
          )}
          style={{
            [isVertical ? 'height' : 'width']: `${thumbSize}%`,
            [isVertical ? 'top' : 'left']: `${thumbPosition}%`
          }}
          onMouseDown={handleThumbMouseDown}
        />
      </div>
    );
  }
);

ScrollAreaScrollbar.displayName = 'ScrollAreaScrollbar';

const ScrollAreaThumb = React.forwardRef<HTMLDivElement, ScrollAreaThumbProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex-1 rounded-full bg-border transition-colors hover:bg-border/80',
          className
        )}
        {...props}
      />
    );
  }
);

ScrollAreaThumb.displayName = 'ScrollAreaThumb';

const ScrollAreaCorner = React.forwardRef<HTMLDivElement, ScrollAreaCornerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'absolute bottom-0 right-0 h-2.5 w-2.5 bg-transparent',
          className
        )}
        {...props}
      />
    );
  }
);

ScrollAreaCorner.displayName = 'ScrollAreaCorner';

export {
  ScrollArea,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner
};