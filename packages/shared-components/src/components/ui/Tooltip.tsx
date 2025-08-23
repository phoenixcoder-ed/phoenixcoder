import React from 'react';
import { cn } from '../../utils/cn';

export interface TooltipProps {
  /** 提示内容 */
  content: React.ReactNode;
  /** 子元素 */
  children: React.ReactNode;
  /** 位置 */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** 是否禁用 */
  disabled?: boolean;
  /** 延迟显示时间(ms) */
  delay?: number;
  /** 自定义样式 */
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  disabled = false,
  delay = 200,
  className
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;
    
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none transition-opacity duration-200';
    
    const placementClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-1',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-1',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-1',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-1'
    };

    const visibilityClasses = isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none';

    return cn(baseClasses, placementClasses[placement], visibilityClasses, className);
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-0 h-0';
    
    const arrowClasses = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900',
      right: 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900'
    };

    return cn(baseClasses, arrowClasses[placement]);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <div
        ref={tooltipRef}
        className={getTooltipClasses()}
        role="tooltip"
      >
        {content}
        <div className={getArrowClasses()} />
      </div>
    </div>
  );
};

export default Tooltip;