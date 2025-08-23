import React from 'react';
import { cn } from '../../utils/cn';

// 网格组件属性接口
export interface GridProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | 'none';
  rows?: 1 | 2 | 3 | 4 | 5 | 6 | 'auto' | 'none';
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
  gapX?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
  gapY?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
  autoFit?: boolean;
  autoFill?: boolean;
  minColWidth?: string;
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  };
}

// 网格项组件属性接口
export interface GridItemProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full' | 'auto';
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full' | 'auto';
  colStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 'auto';
  colEnd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 'auto';
  rowStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'auto';
  rowEnd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'auto';
  order?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'first' | 'last' | 'none';
  responsive?: {
    sm?: Partial<Pick<GridItemProps, 'colSpan' | 'rowSpan' | 'colStart' | 'colEnd' | 'rowStart' | 'rowEnd' | 'order'>>;
    md?: Partial<Pick<GridItemProps, 'colSpan' | 'rowSpan' | 'colStart' | 'colEnd' | 'rowStart' | 'rowEnd' | 'order'>>;
    lg?: Partial<Pick<GridItemProps, 'colSpan' | 'rowSpan' | 'colStart' | 'colEnd' | 'rowStart' | 'rowEnd' | 'order'>>;
    xl?: Partial<Pick<GridItemProps, 'colSpan' | 'rowSpan' | 'colStart' | 'colEnd' | 'rowStart' | 'rowEnd' | 'order'>>;
  };
}

// 列数配置
const colsConfig = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
  auto: 'grid-cols-auto',
  none: 'grid-cols-none'
};

// 行数配置
const rowsConfig = {
  1: 'grid-rows-1',
  2: 'grid-rows-2',
  3: 'grid-rows-3',
  4: 'grid-rows-4',
  5: 'grid-rows-5',
  6: 'grid-rows-6',
  auto: 'grid-rows-auto',
  none: 'grid-rows-none'
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

// 列跨度配置
const colSpanConfig = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
  full: 'col-span-full',
  auto: 'col-auto'
};

// 行跨度配置
const rowSpanConfig = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
  4: 'row-span-4',
  5: 'row-span-5',
  6: 'row-span-6',
  full: 'row-span-full',
  auto: 'row-auto'
};

// 列开始配置
const colStartConfig = {
  1: 'col-start-1',
  2: 'col-start-2',
  3: 'col-start-3',
  4: 'col-start-4',
  5: 'col-start-5',
  6: 'col-start-6',
  7: 'col-start-7',
  8: 'col-start-8',
  9: 'col-start-9',
  10: 'col-start-10',
  11: 'col-start-11',
  12: 'col-start-12',
  13: 'col-start-13',
  auto: 'col-start-auto'
};

// 列结束配置
const colEndConfig = {
  1: 'col-end-1',
  2: 'col-end-2',
  3: 'col-end-3',
  4: 'col-end-4',
  5: 'col-end-5',
  6: 'col-end-6',
  7: 'col-end-7',
  8: 'col-end-8',
  9: 'col-end-9',
  10: 'col-end-10',
  11: 'col-end-11',
  12: 'col-end-12',
  13: 'col-end-13',
  auto: 'col-end-auto'
};

// 行开始配置
const rowStartConfig = {
  1: 'row-start-1',
  2: 'row-start-2',
  3: 'row-start-3',
  4: 'row-start-4',
  5: 'row-start-5',
  6: 'row-start-6',
  7: 'row-start-7',
  auto: 'row-start-auto'
};

// 行结束配置
const rowEndConfig = {
  1: 'row-end-1',
  2: 'row-end-2',
  3: 'row-end-3',
  4: 'row-end-4',
  5: 'row-end-5',
  6: 'row-end-6',
  7: 'row-end-7',
  auto: 'row-end-auto'
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

// 生成响应式类名
const generateResponsiveClasses = (responsive: GridProps['responsive'], configMap: Record<string, string>, prefix: string) => {
  if (!responsive) return '';
  
  return Object.entries(responsive)
    .map(([breakpoint, value]) => {
      if (value === undefined) return '';
      const className = configMap[String(value)];
      if (!className) return '';
      return `${breakpoint}:${className.replace(prefix, `${breakpoint}:${prefix}`)}`;
    })
    .filter(Boolean)
    .join(' ');
};

// 网格组件
export const Grid: React.FC<GridProps> = ({
  children,
  className,
  as: Component = 'div',
  cols = 12,
  rows,
  gap,
  gapX,
  gapY,
  autoFit = false,
  autoFill = false,
  minColWidth = '250px',
  responsive
}) => {
  const responsiveClasses = generateResponsiveClasses(responsive, colsConfig, 'grid-cols-');
  
  const gridStyle = (autoFit || autoFill) ? {
    gridTemplateColumns: `repeat(${autoFit ? 'auto-fit' : 'auto-fill'}, minmax(${minColWidth}, 1fr))`
  } : undefined;
  
  return (
    <Component
      className={cn(
        'grid',
        !autoFit && !autoFill && cols && colsConfig[cols],
        rows && rowsConfig[rows],
        gap !== undefined && gapConfig[gap],
        gapX !== undefined && gapXConfig[gapX],
        gapY !== undefined && gapYConfig[gapY],
        responsiveClasses,
        className
      )}
      style={gridStyle}
    >
      {children}
    </Component>
  );
};

// 网格项组件
export const GridItem: React.FC<GridItemProps> = ({
  children,
  className,
  as: Component = 'div',
  colSpan,
  rowSpan,
  colStart,
  colEnd,
  rowStart,
  rowEnd,
  order,
  responsive
}) => {
  // 生成响应式类名
  const responsiveClasses = responsive ? Object.entries(responsive)
    .map(([breakpoint, props]) => {
      if (!props) return '';
      
      const classes = [];
      
      if (props.colSpan) {
        const className = colSpanConfig[props.colSpan];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.rowSpan) {
        const className = rowSpanConfig[props.rowSpan];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.colStart) {
        const className = colStartConfig[props.colStart];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.colEnd) {
        const className = colEndConfig[props.colEnd];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.rowStart) {
        const className = rowStartConfig[props.rowStart];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.rowEnd) {
        const className = rowEndConfig[props.rowEnd];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      if (props.order) {
        const className = orderConfig[props.order];
        if (className) classes.push(`${breakpoint}:${className}`);
      }
      
      return classes.join(' ');
    })
    .filter(Boolean)
    .join(' ') : '';
  
  return (
    <Component
      className={cn(
        colSpan && colSpanConfig[colSpan],
        rowSpan && rowSpanConfig[rowSpan],
        colStart && colStartConfig[colStart],
        colEnd && colEndConfig[colEnd],
        rowStart && rowStartConfig[rowStart],
        rowEnd && rowEndConfig[rowEnd],
        order && orderConfig[order],
        responsiveClasses,
        className
      )}
    >
      {children}
    </Component>
  );
};

// 自适应网格组件
export const AutoGrid: React.FC<Omit<GridProps, 'cols' | 'autoFit' | 'autoFill'> & {
  minItemWidth?: string;
  maxCols?: number;
}> = ({
  children,
  className,
  as: Component = 'div',
  minItemWidth = '250px',
  maxCols = 12,
  gap = 4,
  ...props
}) => {
  return (
    <Grid
      {...props}
      as={Component}
      className={className}
      autoFit
      minColWidth={minItemWidth}
      gap={gap}
    >
      {children}
    </Grid>
  );
};

// 响应式网格组件
export const ResponsiveGrid: React.FC<GridProps> = ({
  children,
  className,
  responsive = {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  },
  ...props
}) => {
  return (
    <Grid
      {...props}
      className={className}
      cols={1}
      responsive={responsive}
    >
      {children}
    </Grid>
  );
};