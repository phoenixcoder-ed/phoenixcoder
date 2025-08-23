import React from 'react';
import { cn } from '../../utils/cn';

// 堆叠布局组件属性接口
export interface StackProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  direction?: 'vertical' | 'horizontal';
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
  align?: 'start' | 'end' | 'center' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  divider?: React.ReactNode;
  responsive?: {
    sm?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify' | 'wrap'>>;
    md?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify' | 'wrap'>>;
    lg?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify' | 'wrap'>>;
    xl?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify' | 'wrap'>>;
  };
}

// 堆叠项组件属性接口
export interface StackItemProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  flex?: 'auto' | 'initial' | 'none' | '1' | number | string;
  grow?: boolean;
  shrink?: boolean;
  basis?: 'auto' | 'full' | string;
  order?: number;
  alignSelf?: 'auto' | 'start' | 'end' | 'center' | 'baseline' | 'stretch';
}

// 方向配置
const directionConfig = {
  vertical: {
    flex: 'flex-col',
    gap: {
      0: 'space-y-0',
      1: 'space-y-1',
      2: 'space-y-2',
      3: 'space-y-3',
      4: 'space-y-4',
      5: 'space-y-5',
      6: 'space-y-6',
      8: 'space-y-8',
      10: 'space-y-10',
      12: 'space-y-12',
      16: 'space-y-16',
      20: 'space-y-20',
      24: 'space-y-24'
    }
  },
  horizontal: {
    flex: 'flex-row',
    gap: {
      0: 'space-x-0',
      1: 'space-x-1',
      2: 'space-x-2',
      3: 'space-x-3',
      4: 'space-x-4',
      5: 'space-x-5',
      6: 'space-x-6',
      8: 'space-x-8',
      10: 'space-x-10',
      12: 'space-x-12',
      16: 'space-x-16',
      20: 'space-x-20',
      24: 'space-x-24'
    }
  }
};

// 对齐配置
const alignConfig = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  stretch: 'items-stretch'
};

// 主轴对齐配置
const justifyConfig = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly'
};

// 弹性配置
const flexConfig = {
  auto: 'flex-auto',
  initial: 'flex-initial',
  none: 'flex-none',
  '1': 'flex-1'
};

// 自对齐配置
const alignSelfConfig = {
  auto: 'self-auto',
  start: 'self-start',
  end: 'self-end',
  center: 'self-center',
  baseline: 'self-baseline',
  stretch: 'self-stretch'
};

// 生成响应式类名
const generateResponsiveClasses = (responsive: StackProps['responsive']) => {
  if (!responsive) return '';
  
  return Object.entries(responsive)
    .map(([breakpoint, props]) => {
      if (!props) return '';
      
      const classes = [];
      
      if (props.direction) {
        const className = directionConfig[props.direction].flex;
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.spacing !== undefined && props.direction) {
        const className = directionConfig[props.direction].gap[props.spacing];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.align) {
        const className = alignConfig[props.align];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.justify) {
        const className = justifyConfig[props.justify];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.wrap) {
        classes.push(`${breakpoint}:flex-wrap`);
      }
      
      return classes.join(' ');
    })
    .filter(Boolean)
    .join(' ');
};

// 插入分隔符的辅助函数
const insertDividers = (children: React.ReactNode, divider: React.ReactNode) => {
  const childArray = React.Children.toArray(children);
  const result: React.ReactNode[] = [];
  
  childArray.forEach((child, index) => {
    result.push(child);
    if (index < childArray.length - 1) {
      result.push(
        <div key={`divider-${index}`} className="flex-shrink-0">
          {divider}
        </div>
      );
    }
  });
  
  return result;
};

// 堆叠布局组件
export const Stack: React.FC<StackProps> = ({
  children,
  className,
  as: Component = 'div',
  direction = 'vertical',
  spacing = 4,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  divider,
  responsive
}) => {
  const responsiveClasses = generateResponsiveClasses(responsive);
  const config = directionConfig[direction];
  
  const processedChildren = divider ? insertDividers(children, divider) : children;
  
  return (
    <Component
      className={cn(
        'flex',
        config.flex,
        !divider && config.gap[spacing],
        alignConfig[align],
        justifyConfig[justify],
        wrap && 'flex-wrap',
        responsiveClasses,
        className
      )}
    >
      {processedChildren}
    </Component>
  );
};

// 堆叠项组件
export const StackItem: React.FC<StackItemProps> = ({
  children,
  className,
  as: Component = 'div',
  flex,
  grow = false,
  shrink = false,
  basis,
  order,
  alignSelf
}) => {
  // 处理自定义 flex 值
  const flexStyle = (
    flex !== undefined && 
    typeof flex !== 'string' && 
    typeof flex === 'number'
  ) ? { flex } : undefined;
  
  // 处理自定义 basis 值
  const basisStyle = (
    basis !== undefined && 
    basis !== 'auto' && 
    basis !== 'full'
  ) ? { flexBasis: basis } : undefined;
  
  // 处理自定义 order 值
  const orderStyle = order !== undefined ? { order } : undefined;
  
  const style = { ...flexStyle, ...basisStyle, ...orderStyle };
  
  return (
    <Component
      className={cn(
        flex && typeof flex === 'string' && flexConfig[flex as keyof typeof flexConfig],
        grow && 'flex-grow',
        shrink && 'flex-shrink',
        basis === 'auto' && 'basis-auto',
        basis === 'full' && 'basis-full',
        alignSelf && alignSelfConfig[alignSelf],
        className
      )}
      style={Object.keys(style).length > 0 ? style : undefined}
    >
      {children}
    </Component>
  );
};

// 垂直堆叠组件
export const VStack: React.FC<Omit<StackProps, 'direction'>> = ({
  children,
  align = 'stretch',
  ...props
}) => {
  return (
    <Stack
      {...props}
      direction="vertical"
      align={align}
    >
      {children}
    </Stack>
  );
};

// 水平堆叠组件
export const HStack: React.FC<Omit<StackProps, 'direction'>> = ({
  children,
  align = 'center',
  ...props
}) => {
  return (
    <Stack
      {...props}
      direction="horizontal"
      align={align}
    >
      {children}
    </Stack>
  );
};

// 分隔堆叠组件
export const DividedStack: React.FC<StackProps & {
  dividerColor?: 'gray' | 'slate' | 'zinc' | 'neutral' | 'stone';
  dividerOpacity?: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90;
}> = ({
  children,
  direction = 'vertical',
  dividerColor = 'gray',
  dividerOpacity = 20,
  ...props
}) => {
  const dividerClass = direction === 'vertical' 
    ? `border-t border-${dividerColor}-${dividerOpacity * 10}`
    : `border-l border-${dividerColor}-${dividerOpacity * 10}`;
  
  const divider = <div className={dividerClass} />;
  
  return (
    <Stack
      {...props}
      direction={direction}
      divider={divider}
      spacing={0}
    >
      {children}
    </Stack>
  );
};

// 响应式堆叠组件
export const ResponsiveStack: React.FC<StackProps & {
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  verticalOnMobile?: boolean;
}> = ({
  children,
  breakpoint = 'md',
  verticalOnMobile = true,
  direction = 'horizontal',
  ...props
}) => {
  const responsive = verticalOnMobile ? {
    [breakpoint]: { direction }
  } : undefined;
  
  return (
    <Stack
      {...props}
      direction={verticalOnMobile ? 'vertical' : direction}
      responsive={responsive}
    >
      {children}
    </Stack>
  );
};