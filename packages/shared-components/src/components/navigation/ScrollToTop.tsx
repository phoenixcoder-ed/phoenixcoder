import React from 'react';
import { cn } from '../../utils/cn';
import { ArrowUp, ChevronUp } from 'lucide-react';

// 滚动到顶部组件属性接口
export interface ScrollToTopProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left' | 'top-center';
  icon?: React.ReactNode;
  showThreshold?: number;
  smooth?: boolean;
  duration?: number;
  offset?: number;
  hideOnTop?: boolean;
  showProgress?: boolean;
  progressColor?: string;
  disabled?: boolean;
  onClick?: () => void;
  onShow?: () => void;
  onHide?: () => void;
  zIndex?: 10 | 20 | 30 | 40 | 50;
  rounded?: boolean;
  shadow?: boolean;
  backdrop?: boolean;
  tooltip?: string;
}

// 滚动进度组件属性接口
export interface ScrollProgressProps {
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  height?: number;
  color?: string;
  backgroundColor?: string;
  zIndex?: 10 | 20 | 30 | 40 | 50;
  smooth?: boolean;
}

// 变体配置
const variantConfig = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  floating: 'bg-background/80 backdrop-blur-sm border border-border hover:bg-background shadow-lg'
};

// 尺寸配置
const sizeConfig = {
  sm: {
    button: 'h-8 w-8',
    icon: 'h-3 w-3'
  },
  md: {
    button: 'h-10 w-10',
    icon: 'h-4 w-4'
  },
  lg: {
    button: 'h-12 w-12',
    icon: 'h-5 w-5'
  }
};

// 位置配置
const positionConfig = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
  'top-center': 'top-6 left-1/2 -translate-x-1/2'
};

// 层级配置
const zIndexConfig = {
  10: 'z-10',
  20: 'z-20',
  30: 'z-30',
  40: 'z-40',
  50: 'z-50'
};

// 滚动到顶部组件
export const ScrollToTop: React.FC<ScrollToTopProps> = ({
  children,
  className,
  variant = 'floating',
  size = 'md',
  position = 'bottom-right',
  icon,
  showThreshold = 300,
  smooth = true,
  duration = 500,
  offset = 0,
  hideOnTop = true,
  showProgress = false,
  progressColor = 'currentColor',
  disabled = false,
  onClick,
  onShow,
  onHide,
  zIndex = 40,
  rounded = true,
  shadow = false,
  backdrop = false,
  tooltip
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isScrolling, setIsScrolling] = React.useState(false);
  
  // 处理滚动事件
  const handleScroll = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
    
    setScrollProgress(progress);
    
    const shouldShow = scrollTop > showThreshold;
    if (shouldShow !== isVisible) {
      setIsVisible(shouldShow);
      if (shouldShow && onShow) {
        onShow();
      } else if (!shouldShow && onHide) {
        onHide();
      }
    }
  }, [showThreshold, isVisible, onShow, onHide]);
  
  // 监听滚动事件
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const throttledHandleScroll = throttle(handleScroll, 16); // 60fps
    
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    handleScroll(); // 初始检查
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [handleScroll]);
  
  // 滚动到顶部
  const scrollToTop = React.useCallback(() => {
    if (disabled || isScrolling) return;
    
    if (onClick) {
      onClick();
    }
    
    if (typeof window === 'undefined') return;
    
    setIsScrolling(true);
    
    if (smooth && 'scrollTo' in window) {
      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
      
      // 监听滚动完成
      const checkScrollEnd = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop <= offset + 10) {
          setIsScrolling(false);
        } else {
          requestAnimationFrame(checkScrollEnd);
        }
      };
      requestAnimationFrame(checkScrollEnd);
    } else {
      // 自定义动画
      const startTime = Date.now();
      const startScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const distance = startScrollTop - offset;
      
      const animateScroll = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 缓动函数 (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentScrollTop = startScrollTop - (distance * easeOut);
        
        window.scrollTo(0, currentScrollTop);
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          setIsScrolling(false);
        }
      };
      
      requestAnimationFrame(animateScroll);
    }
  }, [disabled, isScrolling, onClick, smooth, offset, duration]);
  
  // 默认图标
  const defaultIcon = icon || <ArrowUp className={sizeConfig[size].icon} />;
  
  // 如果设置了隐藏且在顶部，不显示
  if (hideOnTop && !isVisible) {
    return null;
  }
  
  return (
    <button
      className={cn(
        'fixed inline-flex items-center justify-center',
        'font-medium transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantConfig[variant],
        sizeConfig[size].button,
        positionConfig[position],
        rounded ? 'rounded-full' : 'rounded-md',
        shadow && 'shadow-lg',
        backdrop && 'backdrop-blur-sm',
        zIndexConfig[zIndex],
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        isScrolling && 'scale-95',
        className
      )}
      onClick={scrollToTop}
      disabled={disabled || isScrolling}
      title={tooltip || 'Scroll to top'}
      aria-label="Scroll to top"
    >
      {/* 进度环 */}
      {showProgress && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 36 36"
        >
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.2"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke={progressColor}
            strokeWidth="2"
            strokeDasharray="100"
            strokeDashoffset={100 - scrollProgress}
            strokeLinecap="round"
            className="transition-all duration-150"
          />
        </svg>
      )}
      
      {/* 图标 */}
      <span className={cn('relative', isScrolling && 'animate-pulse')}>
        {children || defaultIcon}
      </span>
    </button>
  );
};

// 滚动进度条组件
export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className,
  position = 'top',
  height = 4,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  zIndex = 50,
  smooth = true
}) => {
  const [progress, setProgress] = React.useState(0);
  
  // 处理滚动事件
  const handleScroll = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
    
    setProgress(Math.min(Math.max(scrollProgress, 0), 100));
  }, []);
  
  // 监听滚动事件
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const throttledHandleScroll = throttle(handleScroll, 16);
    
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [handleScroll]);
  
  const isHorizontal = position === 'top' || position === 'bottom';
  
  return (
    <div
      className={cn(
        'fixed',
        position === 'top' && 'top-0 left-0 right-0',
        position === 'bottom' && 'bottom-0 left-0 right-0',
        position === 'left' && 'left-0 top-0 bottom-0',
        position === 'right' && 'right-0 top-0 bottom-0',
        zIndexConfig[zIndex],
        className
      )}
      style={{
        [isHorizontal ? 'height' : 'width']: `${height}px`,
        backgroundColor
      }}
    >
      <div
        className={cn(
          'h-full transition-all',
          smooth ? 'duration-150 ease-out' : 'duration-0'
        )}
        style={{
          backgroundColor: color,
          [isHorizontal ? 'width' : 'height']: `${progress}%`,
          transformOrigin: isHorizontal ? 'left' : 'top'
        }}
      />
    </div>
  );
};

// 简单滚动到顶部组件
export const SimpleScrollToTop: React.FC<{
  className?: string;
  showThreshold?: number;
  smooth?: boolean;
} & Pick<ScrollToTopProps, 'variant' | 'size' | 'position'>> = ({
  className,
  showThreshold = 300,
  smooth = true,
  variant = 'floating',
  size = 'md',
  position = 'bottom-right'
}) => {
  return (
    <ScrollToTop
      variant={variant}
      size={size}
      position={position}
      showThreshold={showThreshold}
      smooth={smooth}
      className={className}
    />
  );
};

// 带进度的滚动到顶部组件
export const ProgressScrollToTop: React.FC<{
  className?: string;
  showThreshold?: number;
  progressColor?: string;
} & Pick<ScrollToTopProps, 'variant' | 'size' | 'position'>> = ({
  className,
  showThreshold = 300,
  progressColor = '#3b82f6',
  variant = 'floating',
  size = 'md',
  position = 'bottom-right'
}) => {
  return (
    <ScrollToTop
      variant={variant}
      size={size}
      position={position}
      showThreshold={showThreshold}
      showProgress
      progressColor={progressColor}
      className={className}
    />
  );
};

// 多目标滚动组件
export const MultiScrollToTop: React.FC<{
  targets: Array<{
    label: string;
    selector: string;
    offset?: number;
  }>;
  className?: string;
  buttonClassName?: string;
} & Pick<ScrollToTopProps, 'variant' | 'size' | 'position'>> = ({
  targets,
  className,
  buttonClassName,
  variant = 'floating',
  size = 'md',
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const scrollToTarget = (selector: string, offset = 0) => {
    const element = document.querySelector(selector);
    if (element) {
      const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
    setIsOpen(false);
  };
  
  return (
    <div className={cn('fixed', positionConfig[position], zIndexConfig[40], className)}>
      {/* 目标列表 */}
      {isOpen && (
        <div className="mb-2 space-y-1">
          {targets.map((target, index) => (
            <button
              key={index}
              className={cn(
                'block w-full px-3 py-2 text-sm',
                'bg-background/80 backdrop-blur-sm border border-border',
                'hover:bg-accent hover:text-accent-foreground',
                'rounded-md transition-colors',
                buttonClassName
              )}
              onClick={() => scrollToTarget(target.selector, target.offset)}
            >
              {target.label}
            </button>
          ))}
        </div>
      )}
      
      {/* 主按钮 */}
      <ScrollToTop
        variant={variant}
        size={size}
        position="bottom-right"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        icon={
          <ChevronUp
            className={cn(
              sizeConfig[size].icon,
              'transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        }
      />
    </div>
  );
};

// 节流函数
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}