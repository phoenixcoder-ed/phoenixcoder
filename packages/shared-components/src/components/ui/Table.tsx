import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown, ChevronUp, ChevronsUpDown, ArrowUpDown } from 'lucide-react';

// 表格组件属性接口
export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'striped' | 'hover';
  size?: 'sm' | 'md' | 'lg';
  stickyHeader?: boolean;
  responsive?: boolean;
}

// 表格头部属性接口
export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children?: React.ReactNode;
  className?: string;
}

// 表格主体属性接口
export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children?: React.ReactNode;
  className?: string;
}

// 表格底部属性接口
export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children?: React.ReactNode;
  className?: string;
}

// 表格行属性接口
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children?: React.ReactNode;
  className?: string;
  selected?: boolean;
  clickable?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

// 表格头部单元格属性接口
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  sticky?: boolean;
}

// 表格单元格属性接口
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  sticky?: boolean;
  truncate?: boolean;
}

// 表格标题属性接口
export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  children?: React.ReactNode;
  className?: string;
}

// 表格变体配置
const tableVariants = {
  default: '',
  bordered: 'border border-border',
  striped: '[&_tbody_tr:nth-child(odd)]:bg-muted/50',
  hover: '[&_tbody_tr:hover]:bg-muted/50'
};

// 表格尺寸配置
const tableSizes = {
  sm: '[&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 text-xs',
  md: '[&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2 text-sm',
  lg: '[&_th]:px-4 [&_th]:py-3 [&_td]:px-4 [&_td]:py-3 text-base'
};

// 表格行变体配置
const tableRowVariants = {
  default: '',
  success: 'bg-green-50 dark:bg-green-950/20',
  warning: 'bg-yellow-50 dark:bg-yellow-950/20',
  error: 'bg-red-50 dark:bg-red-950/20'
};

// 对齐配置
const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
};

// 表格根组件
export const Table = React.forwardRef<HTMLTableElement, TableProps>((
  {
    children,
    className,
    variant = 'default',
    size = 'md',
    stickyHeader = false,
    responsive = false,
    ...props
  },
  ref
) => {
  const tableClasses = cn(
    'w-full caption-bottom text-sm',
    tableVariants[variant],
    tableSizes[size],
    stickyHeader && '[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10',
    className
  );
  
  if (responsive) {
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={tableClasses}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
  
  return (
    <table
      ref={ref}
      className={tableClasses}
      {...props}
    >
      {children}
    </table>
  );
});

Table.displayName = 'Table';

// 表格头部组件
export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  return (
    <thead
      ref={ref}
      className={cn('[&_tr]:border-b', className)}
      {...props}
    >
      {children}
    </thead>
  );
});

TableHeader.displayName = 'TableHeader';

// 表格主体组件
export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  return (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    >
      {children}
    </tbody>
  );
});

TableBody.displayName = 'TableBody';

// 表格底部组件
export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  return (
    <tfoot
      ref={ref}
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  );
});

TableFooter.displayName = 'TableFooter';

// 表格行组件
export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>((
  {
    children,
    className,
    selected = false,
    clickable = false,
    variant = 'default',
    ...props
  },
  ref
) => {
  return (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        selected && 'bg-muted',
        clickable && 'cursor-pointer',
        tableRowVariants[variant],
        className
      )}
      data-state={selected ? 'selected' : undefined}
      {...props}
    >
      {children}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

// 表格头部单元格组件
export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>((
  {
    children,
    className,
    sortable = false,
    sortDirection = null,
    onSort,
    align = 'left',
    width,
    sticky = false,
    ...props
  },
  ref
) => {
  const handleSort = () => {
    if (sortable && onSort) {
      onSort();
    }
  };
  
  const getSortIcon = () => {
    if (!sortable) return null;
    
    if (sortDirection === 'asc') {
      return <ChevronUp className="ml-2 h-4 w-4" />;
    }
    
    if (sortDirection === 'desc') {
      return <ChevronDown className="ml-2 h-4 w-4" />;
    }
    
    return <ChevronsUpDown className="ml-2 h-4 w-4" />;
  };
  
  const cellStyle = width ? { width } : undefined;
  
  return (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        alignClasses[align],
        sortable && 'cursor-pointer select-none hover:bg-muted/50',
        sticky && 'sticky left-0 z-10 bg-background',
        className
      )}
      style={cellStyle}
      onClick={handleSort}
      {...props}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon()}
      </div>
    </th>
  );
});

TableHead.displayName = 'TableHead';

// 表格单元格组件
export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>((
  {
    children,
    className,
    align = 'left',
    width,
    sticky = false,
    truncate = false,
    ...props
  },
  ref
) => {
  const cellStyle = width ? { width } : undefined;
  
  return (
    <td
      ref={ref}
      className={cn(
        'p-4 align-middle [&:has([role=checkbox])]:pr-0',
        alignClasses[align],
        sticky && 'sticky left-0 z-10 bg-background',
        truncate && 'max-w-0 truncate',
        className
      )}
      style={cellStyle}
      {...props}
    >
      {children}
    </td>
  );
});

TableCell.displayName = 'TableCell';

// 表格标题组件
export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  return (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </caption>
  );
});

TableCaption.displayName = 'TableCaption';

// 简单表格组件
export const SimpleTable: React.FC<{
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    title: React.ReactNode;
    render?: (value: any, record: Record<string, any>, index: number) => React.ReactNode;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    width?: string | number;
  }>;
  className?: string;
  variant?: 'default' | 'bordered' | 'striped' | 'hover';
  size?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
  stickyHeader?: boolean;
  onRowClick?: (record: Record<string, any>, index: number) => void;
  rowKey?: string | ((record: Record<string, any>, index: number) => string);
  emptyText?: React.ReactNode;
  loading?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}> = ({
  data,
  columns,
  className,
  variant = 'default',
  size = 'md',
  responsive = false,
  stickyHeader = false,
  onRowClick,
  rowKey = 'id',
  emptyText = 'No data available',
  loading = false,
  sortBy,
  sortDirection,
  onSort
}) => {
  const getRowKey = (record: Record<string, any>, index: number) => {
    if (typeof rowKey === 'function') {
      return rowKey(record, index);
    }
    return record[rowKey] || index;
  };
  
  const handleSort = (key: string) => {
    if (!onSort) return;
    
    let newDirection: 'asc' | 'desc' = 'asc';
    
    if (sortBy === key) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    onSort(key, newDirection);
  };
  
  const getSortDirection = (key: string) => {
    return sortBy === key ? sortDirection : null;
  };
  
  if (loading) {
    return (
      <Table
        className={className}
        variant={variant}
        size={size}
        responsive={responsive}
        stickyHeader={stickyHeader}
      >
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Loading...</span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }
  
  if (data.length === 0) {
    return (
      <Table
        className={className}
        variant={variant}
        size={size}
        responsive={responsive}
        stickyHeader={stickyHeader}
      >
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
              {emptyText}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }
  
  return (
    <Table
      className={className}
      variant={variant}
      size={size}
      responsive={responsive}
      stickyHeader={stickyHeader}
    >
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={index}
              sortable={column.sortable}
              sortDirection={getSortDirection(column.key)}
              onSort={() => handleSort(column.key)}
              align={column.align}
              width={column.width}
            >
              {column.title}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((record, index) => (
          <TableRow
            key={getRowKey(record, index)}
            clickable={!!onRowClick}
            onClick={() => onRowClick?.(record, index)}
          >
            {columns.map((column, colIndex) => {
              const value = record[column.key];
              const content = column.render ? column.render(value, record, index) : value;
              
              return (
                <TableCell
                  key={colIndex}
                  align={column.align}
                  width={column.width}
                >
                  {content}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// 可选择表格组件
export const SelectableTable: React.FC<{
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    title: React.ReactNode;
    render?: (value: any, record: Record<string, any>, index: number) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
    width?: string | number;
  }>;
  selectedRows?: string[];
  onSelectionChange?: (selectedRows: string[]) => void;
  className?: string;
  variant?: 'default' | 'bordered' | 'striped' | 'hover';
  size?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
  rowKey?: string | ((record: Record<string, any>, index: number) => string);
  selectAll?: boolean;
  onSelectAllChange?: (checked: boolean) => void;
}> = ({
  data,
  columns,
  selectedRows = [],
  onSelectionChange,
  className,
  variant = 'default',
  size = 'md',
  responsive = false,
  rowKey = 'id',
  selectAll = false,
  onSelectAllChange
}) => {
  const getRowKey = (record: Record<string, any>, index: number) => {
    if (typeof rowKey === 'function') {
      return rowKey(record, index);
    }
    return record[rowKey] || index.toString();
  };
  
  const handleRowSelect = (key: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelectedRows = checked
      ? [...selectedRows, key]
      : selectedRows.filter(row => row !== key);
    
    onSelectionChange(newSelectedRows);
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange || !onSelectAllChange) return;
    
    if (checked) {
      const allKeys = data.map((record, index) => getRowKey(record, index));
      onSelectionChange(allKeys);
    } else {
      onSelectionChange([]);
    }
    
    onSelectAllChange(checked);
  };
  
  const isRowSelected = (key: string) => selectedRows.includes(key);
  
  return (
    <Table
      className={className}
      variant={variant}
      size={size}
      responsive={responsive}
    >
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-gray-300"
            />
          </TableHead>
          {columns.map((column, index) => (
            <TableHead
              key={index}
              align={column.align}
              width={column.width}
            >
              {column.title}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((record, index) => {
          const key = getRowKey(record, index);
          const selected = isRowSelected(key);
          
          return (
            <TableRow
              key={key}
              selected={selected}
            >
              <TableCell>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => handleRowSelect(key, e.target.checked)}
                  className="rounded border-gray-300"
                />
              </TableCell>
              {columns.map((column, colIndex) => {
                const value = record[column.key];
                const content = column.render ? column.render(value, record, index) : value;
                
                return (
                  <TableCell
                    key={colIndex}
                    align={column.align}
                    width={column.width}
                  >
                    {content}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};