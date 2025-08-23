import React from 'react';
import { cn } from '../../utils/cn';

// 弹性布局组件属性接口
export interface FlexProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  wrap?: 'wrap' | 'wrap-reverse' | 'nowrap';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
  gapX?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
  gapY?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
  responsive?: {
    sm?: Partial<Pick<FlexProps, 'direction' | 'wrap' | 'justify' | 'align'>>;
    md?: Partial<Pick<FlexProps, 'direction' | 'wrap' | 'justify' | 'align'>>;
    lg?: Partial<Pick<FlexProps, 'direction' | 'wrap' | 'justify' | 'align'>>;
    xl?: Partial<Pick<FlexProps, 'direction' | 'wrap' | 'justify' | 'align'>>;
  };
}

// 弹性项组件属性接口
export interface FlexItemProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  flex?: 'auto' | 'initial' | 'none' | '1' | number | string;
  grow?: 0 | 1 | number;
  shrink?: 0 | 1 | number;
  basis?: 'auto' | 'full' | 'px' | string;
  order?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'first' | 'last' | 'none';
  alignSelf?: 'auto' | 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  responsive?: {
    sm?: Partial<Pick<FlexItemProps, 'flex' | 'grow' | 'shrink' | 'basis' | 'order' | 'alignSelf'>>;
    md?: Partial<Pick<FlexItemProps, 'flex' | 'grow' | 'shrink' | 'basis' | 'order' | 'alignSelf'>>;
    lg?: Partial<Pick<FlexItemProps, 'flex' | 'grow' | 'shrink' | 'basis' | 'order' | 'alignSelf'>>;
    xl?: Partial<Pick<FlexItemProps, 'flex' | 'grow' | 'shrink' | 'basis' | 'order' | 'alignSelf'>>;
  };
}

// 方向配置
const directionConfig = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  col: 'flex-col',
  'col-reverse': 'flex-col-reverse'
};

// 换行配置
const wrapConfig = {
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
  nowrap: 'flex-nowrap'
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

// 交叉轴对齐配置
const alignConfig = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch'
};

// 间距配置
const gapConfig = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
  16: 'gap-16',
  20: 'gap-20',
  24: 'gap-24'
};

// X轴间距配置
const gapXConfig = {
  0: 'gap-x-0',
  1: 'gap-x-1',
  2: 'gap-x-2',
  3: 'gap-x-3',
  4: 'gap-x-4',
  5: 'gap-x-5',
  6: 'gap-x-6',
  8: 'gap-x-8',
  10: 'gap-x-10',
  12: 'gap-x-12',
  16: 'gap-x-16',
  20: 'gap-x-20',
  24: 'gap-x-24'
};

// Y轴间距配置
const gapYConfig = {
  0: 'gap-y-0',
  1: 'gap-y-1',
  2: 'gap-y-2',
  3: 'gap-y-3',
  4: 'gap-y-4',
  5: 'gap-y-5',
  6: 'gap-y-6',
  8: 'gap-y-8',
  10: 'gap-y-10',
  12: 'gap-y-12',
  16: 'gap-y-16',
  20: 'gap-y-20',
  24: 'gap-y-24'
};

// 弹性配置
const flexConfig = {
  auto: 'flex-auto',
  initial: 'flex-initial',
  none: 'flex-none',
  '1': 'flex-1'
};

// 增长配置
const growConfig = {
  0: 'flex-grow-0',
  1: 'flex-grow'
};

// 收缩配置
const shrinkConfig = {
  0: 'flex-shrink-0',
  1: 'flex-shrink'
};

// 基础配置
const basisConfig = {
  auto: 'basis-auto',
  full: 'basis-full',
  px: 'basis-px'
};

// 顺序配置
const orderConfig = {
  1: 'order-1',
  2: 'order-2',
  3: 'order-3',
  4: 'order-4',
  5: 'order-5',
  6: 'order-6',
  7: 'order-7',
  8: 'order-8',
  9: 'order-9',
  10: 'order-10',
  11: 'order-11',
  12: 'order-12',
  first: 'order-first',
  last: 'order-last',
  none: 'order-none'
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
const generateResponsiveClasses = (responsive: FlexProps['responsive']) => {
  if (!responsive) return '';
  
  return Object.entries(responsive)
    .map(([breakpoint, props]) => {
      if (!props) return '';
      
      const classes = [];
      
      if (props.direction) {
        const className = directionConfig[props.direction];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.wrap) {
        const className = wrapConfig[props.wrap];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.justify) {
        const className = justifyConfig[props.justify];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.align) {
        const className = alignConfig[props.align];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      return classes.join(' ');
    })
    .filter(Boolean)
    .join(' ');
};

// 生成弹性项响应式类名
const generateFlexItemResponsiveClasses = (responsive: FlexItemProps['responsive']) => {
  if (!responsive) return '';
  
  return Object.entries(responsive)
    .map(([breakpoint, props]) => {
      if (!props) return '';
      
      const classes = [];
      
      if (props.flex) {
        if (typeof props.flex === 'string' && flexConfig[props.flex as keyof typeof flexConfig]) {
          classes.push(`${breakpoint}:${flexConfig[props.flex as keyof typeof flexConfig]}`);
        }
      }
      
      if (props.grow !== undefined) {
        const className = growConfig[props.grow as keyof typeof growConfig];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.shrink !== undefined) {
        const className = shrinkConfig[props.shrink as keyof typeof shrinkConfig];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.basis) {
        const className = basisConfig[props.basis as keyof typeof basisConfig];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.order) {
        const className = orderConfig[props.order];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.alignSelf) {
        const className = alignSelfConfig[props.alignSelf];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      return classes.join(' ');
    })
    .filter(Boolean)
    .join(' ');
};

// 弹性布局组件
export const Flex: React.FC<FlexProps> = ({
  children,
  className,
  as: Component = 'div',
  direction = 'row',
  wrap = 'nowrap',
  justify = 'start',
  align = 'stretch',
  gap,
  gapX,
  gapY,
  responsive
}) => {
  const responsiveClasses = generateResponsiveClasses(responsive);
  
  return (
    <Component
      className={cn(
        'flex',
        directionConfig[direction],
        wrapConfig[wrap],
        justifyConfig[justify],
        alignConfig[align],
        gap !== undefined && gapConfig[gap],
        gapX !== undefined && gapXConfig[gapX],
        gapY !== undefined && gapYConfig[gapY],
        responsiveClasses,
        className
      )}
    >
      {children}
    </Component>
  );
};

// 弹性项组件
export const FlexItem: React.FC<FlexItemProps> = ({
  children,
  className,
  as: Component = 'div',
  flex,
  grow,
  shrink,
  basis,
  order,
  alignSelf,
  responsive
}) => {
  const responsiveClasses = generateFlexItemResponsiveClasses(responsive);
  
  // 处理自定义 flex 值
  const flexStyle = (
    flex !== undefined && 
    typeof flex !== 'string' && 
    !(typeof flex === 'string' && flex in flexConfig)
  ) ? { flex } : undefined;
  
  // 处理自定义 basis 值
  const basisStyle = (
    basis !== undefined && 
    !basisConfig[basis as keyof typeof basisConfig]
  ) ? { flexBasis: basis } : undefined;
  
  const style = { ...flexStyle, ...basisStyle };
  
  return (
    <Component
      className={cn(
        flex && typeof flex === 'string' && flexConfig[flex as keyof typeof flexConfig],
        grow !== undefined && growConfig[grow as keyof typeof growConfig],
        shrink !== undefined && shrinkConfig[shrink as keyof typeof shrinkConfig],
        basis && basisConfig[basis as keyof typeof basisConfig],
        order && orderConfig[order],
        alignSelf && alignSelfConfig[alignSelf],
        responsiveClasses,
        className
      )}
      style={Object.keys(style).length > 0 ? style : undefined}
    >
      {children}
    </Component>
  );
};

// 水平布局组件
export const HStack: React.FC<Omit<FlexProps, 'direction'> & {
  spacing?: FlexProps['gap'];
}> = ({
  children,
  spacing,
  gap = spacing,
  align = 'center',
  ...props
}) => {
  return (
    <Flex
      {...props}
      direction="row"
      align={align}
      gap={gap}
    >
      {children}
    </Flex>
  );
};

// 垂直布局组件
export const VStack: React.FC<Omit<FlexProps, 'direction'> & {
  spacing?: FlexProps['gap'];
}> = ({
  children,
  spacing,
  gap = spacing,
  align = 'stretch',
  ...props
}) => {
  return (
    <Flex
      {...props}
      direction="col"
      align={align}
      gap={gap}
    >
      {children}
    </Flex>
  );
};

// 居中布局组件
export const Center: React.FC<Omit<FlexProps, 'justify' | 'align'>> = ({
  children,
  ...props
}) => {
  return (
    <Flex
      {...props}
      justify="center"
      align="center"
    >
      {children}
    </Flex>
  );
};

// 间隔组件
export const Spacer: React.FC<{
  className?: string;
}> = ({ className }) => {
  return <div className={cn('flex-1', className)} />;
};