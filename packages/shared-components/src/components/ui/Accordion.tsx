import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown, ChevronRight, Plus, Minus } from 'lucide-react';

// 手风琴组件属性接口
export interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  variant?: 'default' | 'bordered' | 'separated' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  animationDuration?: number;
  disabled?: boolean;
  collapsible?: boolean;
}

// 手风琴项属性接口
export interface AccordionItemProps {
  children?: React.ReactNode;
  className?: string;
  value: string;
  disabled?: boolean;
}

// 手风琴触发器属性接口
export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  showIcon?: boolean;
  iconType?: 'chevron' | 'plus' | 'arrow';
  asChild?: boolean;
}

// 手风琴内容属性接口
export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  forceMount?: boolean;
}

// 变体配置
const variantConfig = {
  default: 'border-b border-border',
  bordered: 'border border-border rounded-lg mb-2',
  separated: 'bg-background border border-border rounded-lg mb-4 shadow-sm',
  ghost: 'hover:bg-accent/50 rounded-lg'
};

// 尺寸配置
const sizeConfig = {
  sm: {
    trigger: 'py-2 px-3 text-sm',
    content: 'px-3 pb-2',
    icon: 'h-3 w-3'
  },
  md: {
    trigger: 'py-3 px-4 text-sm',
    content: 'px-4 pb-3',
    icon: 'h-4 w-4'
  },
  lg: {
    trigger: 'py-4 px-6 text-base',
    content: 'px-6 pb-4',
    icon: 'h-5 w-5'
  }
};

// 图标类型配置
const iconTypeConfig = {
  chevron: {
    closed: ChevronRight,
    open: ChevronDown
  },
  plus: {
    closed: Plus,
    open: Minus
  },
  arrow: {
    closed: ChevronRight,
    open: ChevronDown
  }
};

// 手风琴上下文
interface AccordionContextValue {
  type: 'single' | 'multiple';
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  collapsible: boolean;
  variant: AccordionProps['variant'];
  size: AccordionProps['size'];
  disabled: boolean;
  animated: boolean;
  animationDuration: number;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

const useAccordion = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an Accordion');
  }
  return context;
};

// 手风琴项上下文
interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  disabled: boolean;
  toggle: () => void;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

const useAccordionItem = () => {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error('useAccordionItem must be used within an AccordionItem');
  }
  return context;
};

// 手风琴根组件
export const Accordion: React.FC<AccordionProps> = ({
  children,
  className,
  type = 'single',
  collapsible = false,
  defaultValue,
  value: controlledValue,
  onValueChange,
  variant = 'default',
  size = 'md',
  disabled = false,
  animated = true,
  animationDuration = 200
}) => {
  const [internalValue, setInternalValue] = React.useState<string | string[]>(() => {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return type === 'multiple' ? [] : '';
  });
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleValueChange = React.useCallback((newValue: string | string[]) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  }, [controlledValue, onValueChange]);
  
  const contextValue: AccordionContextValue = {
    type,
    value,
    onValueChange: handleValueChange,
    collapsible,
    variant,
    size,
    disabled,
    animated,
    animationDuration
  };
  
  return (
    <AccordionContext.Provider value={contextValue}>
      <div
        className={cn(
          'w-full',
          variant === 'separated' && 'space-y-0',
          className
        )}
        data-orientation="vertical"
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// 手风琴项组件
export const AccordionItem: React.FC<AccordionItemProps> = ({
  children,
  className,
  value,
  disabled: itemDisabled = false
}) => {
  const {
    type,
    value: accordionValue,
    onValueChange,
    collapsible,
    variant = 'default',
    disabled: accordionDisabled
  } = useAccordion();
  
  const disabled = accordionDisabled || itemDisabled;
  
  const isOpen = React.useMemo(() => {
    if (type === 'multiple') {
      return Array.isArray(accordionValue) && accordionValue.includes(value);
    }
    return accordionValue === value;
  }, [type, accordionValue, value]);
  
  const toggle = React.useCallback(() => {
    if (disabled) return;
    
    if (type === 'multiple') {
      const currentValue = Array.isArray(accordionValue) ? accordionValue : [];
      if (isOpen) {
        onValueChange(currentValue.filter(v => v !== value));
      } else {
        onValueChange([...currentValue, value]);
      }
    } else {
      if (isOpen && collapsible) {
        onValueChange('');
      } else if (!isOpen) {
        onValueChange(value);
      }
    }
  }, [type, accordionValue, value, isOpen, disabled, collapsible, onValueChange]);
  
  const itemContextValue: AccordionItemContextValue = {
    value,
    isOpen,
    disabled,
    toggle
  };
  
  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <div
        className={cn(
          variantConfig[variant],
          disabled && 'opacity-50',
          className
        )}
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={disabled ? '' : undefined}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

// 手风琴触发器组件
export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>((
  {
    children,
    className,
    icon,
    iconPosition = 'right',
    showIcon = true,
    iconType = 'chevron',
    asChild = false,
    ...props
  },
  ref
) => {
  const { size = 'md', variant = 'default', animated, animationDuration } = useAccordion();
  const { isOpen, disabled, toggle } = useAccordionItem();
  
  const IconComponent = icon ? null : iconTypeConfig[iconType][isOpen ? 'open' : 'closed'];
  
  const triggerContent = (
    <>
      {/* 左侧图标 */}
      {showIcon && iconPosition === 'left' && (
        <span className={cn(
          'inline-flex items-center transition-transform',
          animated && `duration-${animationDuration}`,
          iconType === 'chevron' && isOpen && 'rotate-90',
          iconType === 'arrow' && isOpen && 'rotate-90'
        )}>
          {icon || (IconComponent && <IconComponent className={sizeConfig[size].icon} />)}
        </span>
      )}
      
      {/* 内容 */}
      <span className="flex-1 text-left">
        {children}
      </span>
      
      {/* 右侧图标 */}
      {showIcon && iconPosition === 'right' && (
        <span className={cn(
          'inline-flex items-center transition-transform',
          animated && `duration-${animationDuration}`,
          iconType === 'chevron' && isOpen && 'rotate-90',
          iconType === 'arrow' && isOpen && 'rotate-90'
        )}>
          {icon || (IconComponent && <IconComponent className={sizeConfig[size].icon} />)}
        </span>
      )}
    </>
  );
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: toggle,
      disabled,
      'aria-expanded': isOpen,
      ref,
      ...props
    });
  }
  
  return (
    <button
      ref={ref}
      className={cn(
        'flex w-full items-center justify-between',
        'font-medium transition-all',
        'hover:underline focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        '[&[data-state=open]>svg]:rotate-180',
        sizeConfig[size].trigger,
        className
      )}
      onClick={toggle}
      disabled={disabled}
      aria-expanded={isOpen}
      data-state={isOpen ? 'open' : 'closed'}
      {...props}
    >
      {triggerContent}
    </button>
  );
});

AccordionTrigger.displayName = 'AccordionTrigger';

// 手风琴内容组件
export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>((
  {
    children,
    className,
    forceMount = false,
    ...props
  },
  ref
) => {
  const { size = 'md', animated, animationDuration } = useAccordion();
  const { isOpen } = useAccordionItem();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | undefined>(isOpen ? undefined : 0);
  
  // 计算内容高度
  React.useEffect(() => {
    if (!animated) return;
    
    const element = contentRef.current;
    if (!element) return;
    
    if (isOpen) {
      const scrollHeight = element.scrollHeight;
      setHeight(scrollHeight);
      
      // 动画完成后移除固定高度
      const timer = setTimeout(() => {
        setHeight(undefined);
      }, animationDuration);
      
      return () => clearTimeout(timer);
    } else {
      setHeight(element.scrollHeight);
      
      // 强制重绘后设置为0
      requestAnimationFrame(() => {
        setHeight(0);
      });
      
      return () => {};
    }
  }, [isOpen, animated, animationDuration]);
  
  if (!forceMount && !isOpen && height === 0) {
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
        'overflow-hidden text-sm',
        animated && 'transition-all ease-in-out',
        sizeConfig[size].content,
        className
      )}
      style={{
        height: animated ? height : undefined,
        transitionDuration: animated ? `${animationDuration}ms` : undefined
      }}
      data-state={isOpen ? 'open' : 'closed'}
      {...props}
    >
      <div className="pb-4 pt-0">
        {children}
      </div>
    </div>
  );
});

AccordionContent.displayName = 'AccordionContent';

// 简单手风琴组件
export const SimpleAccordion: React.FC<{
  items: Array<{
    value: string;
    trigger: React.ReactNode;
    content: React.ReactNode;
    disabled?: boolean;
  }>;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
  variant?: AccordionProps['variant'];
  size?: AccordionProps['size'];
}> = ({
  items,
  type = 'single',
  defaultValue,
  className,
  variant,
  size
}) => {
  return (
    <Accordion
      type={type}
      defaultValue={defaultValue}
      variant={variant}
      size={size}
      className={className}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          disabled={item.disabled}
        >
          <AccordionTrigger>
            {item.trigger}
          </AccordionTrigger>
          <AccordionContent>
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

// FAQ 手风琴组件
export const FAQAccordion: React.FC<{
  faqs: Array<{
    question: string;
    answer: React.ReactNode;
    id?: string;
  }>;
  className?: string;
  searchable?: boolean;
}> = ({ faqs, className, searchable = false }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredFaqs = React.useMemo(() => {
    if (!searchTerm) return faqs;
    
    return faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [faqs, searchTerm]);
  
  return (
    <div className={className}>
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'w-full px-3 py-2 text-sm',
              'border border-input rounded-md',
              'bg-background placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
          />
        </div>
      )}
      
      <SimpleAccordion
        type="single"
        variant="separated"
        items={filteredFaqs.map((faq, index) => ({
          value: faq.id || `faq-${index}`,
          trigger: faq.question,
          content: faq.answer
        }))}
      />
    </div>
  );
};