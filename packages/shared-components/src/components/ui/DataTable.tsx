import React from 'react';
import { cn } from '../../utils/cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';
import { Button } from './Button';
import { Input } from './Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './Pagination';
import { Search, Filter, Download, RefreshCw, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

// 数据表格列定义接口
export interface DataTableColumn<T = any> {
  key: string;
  title: React.ReactNode;
  dataIndex?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
  className?: string;
  headerClassName?: string;
}

// 数据表格属性接口
export interface DataTableProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  className?: string;
  loading?: boolean;
  empty?: React.ReactNode;
  rowKey?: string | ((record: T, index: number) => string);
  onRowClick?: (record: T, index: number) => void;
  onRowDoubleClick?: (record: T, index: number) => void;
  rowSelection?: {
    selectedRowKeys?: string[];
    onChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
    onSelect?: (record: T, selected: boolean, selectedRows: T[], nativeEvent: Event) => void;
    onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean; name?: string };
  };
  pagination?: {
    current?: number;
    pageSize?: number;
    total?: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: (total: number, range: [number, number]) => React.ReactNode;
    onChange?: (page: number, pageSize: number) => void;
    onShowSizeChange?: (current: number, size: number) => void;
    pageSizeOptions?: string[];
  } | false;
  scroll?: {
    x?: string | number;
    y?: string | number;
  };
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  showHeader?: boolean;
  sticky?: boolean;
  expandable?: {
    expandedRowKeys?: string[];
    defaultExpandedRowKeys?: string[];
    expandedRowRender?: (record: T, index: number, indent: number, expanded: boolean) => React.ReactNode;
    expandRowByClick?: boolean;
    expandIcon?: (props: { expanded: boolean; onExpand: (expanded: boolean) => void; record: T }) => React.ReactNode;
    onExpand?: (expanded: boolean, record: T) => void;
    onExpandedRowsChange?: (expandedKeys: string[]) => void;
  };
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  filters?: Record<string, any>;
  onFilter?: (filters: Record<string, any>) => void;
  searchValue?: string;
  onSearch?: (value: string) => void;
  toolbar?: {
    title?: React.ReactNode;
    actions?: React.ReactNode[];
    search?: boolean;
    filter?: boolean;
    export?: boolean;
    refresh?: boolean;
    onExport?: () => void;
    onRefresh?: () => void;
  };
}

// 数据表格上下文
interface DataTableContextValue {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  filters?: Record<string, any>;
  onFilter?: (filters: Record<string, any>) => void;
  selectedRowKeys?: string[];
  onRowSelect?: (key: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

const DataTableContext = React.createContext<DataTableContextValue | null>(null);

const useDataTable = () => {
  const context = React.useContext(DataTableContext);
  if (!context) {
    throw new Error('useDataTable must be used within a DataTable');
  }
  return context;
};

// 数据表格工具栏组件
const DataTableToolbar: React.FC<{
  title?: React.ReactNode;
  actions?: React.ReactNode[];
  search?: boolean;
  filter?: boolean;
  export?: boolean;
  refresh?: boolean;
  searchValue?: string;
  onSearch?: (value: string) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  className?: string;
}> = ({
  title,
  actions = [],
  search = false,
  filter = false,
  export: showExport = false,
  refresh = false,
  searchValue = '',
  onSearch,
  onExport,
  onRefresh,
  className
}) => {
  const [searchInput, setSearchInput] = React.useState(searchValue);
  
  React.useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);
  
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onSearch?.(value);
  };
  
  return (
    <div className={cn('flex items-center justify-between p-4 border-b', className)}>
      <div className="flex items-center space-x-4">
        {title && (
          <h3 className="text-lg font-semibold">{title}</h3>
        )}
        
        {search && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {filter && (
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        )}
        
        {showExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
        
        {refresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
        
        {actions.map((action, index) => (
          <React.Fragment key={index}>{action}</React.Fragment>
        ))}
      </div>
    </div>
  );
};

// 数据表格分页组件
const DataTablePagination: React.FC<{
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
  pageSizeOptions?: string[];
  className?: string;
}> = ({
  current,
  pageSize,
  total,
  showSizeChanger = true,
  showQuickJumper = false,
  showTotal,
  onChange,
  onShowSizeChange,
  pageSizeOptions = ['10', '20', '50', '100'],
  className
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (current - 1) * pageSize + 1;
  const endIndex = Math.min(current * pageSize, total);
  
  const handlePageChange = (page: number) => {
    if (page !== current && page >= 1 && page <= totalPages) {
      onChange?.(page, pageSize);
    }
  };
  
  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize, 10);
    if (size !== pageSize) {
      onShowSizeChange?.(current, size);
    }
  };
  
  return (
    <div className={cn('flex items-center justify-between p-4 border-t', className)}>
      <div className="flex items-center space-x-4">
        {showTotal && (
          <span className="text-sm text-muted-foreground">
            {showTotal(total, [startIndex, endIndex])}
          </span>
        )}
        
        {!showTotal && (
          <span className="text-sm text-muted-foreground">
            Showing {startIndex} to {endIndex} of {total} entries
          </span>
        )}
        
        {showSizeChanger && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
        )}
      </div>
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(current - 1)}
              className={cn(
                current <= 1 && 'pointer-events-none opacity-50',
                current > 1 && 'cursor-pointer'
              )}
            />
          </PaginationItem>
          
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNumber;
            
            if (totalPages <= 7) {
              pageNumber = i + 1;
            } else if (current <= 4) {
              pageNumber = i + 1;
            } else if (current >= totalPages - 3) {
              pageNumber = totalPages - 6 + i;
            } else {
              pageNumber = current - 3 + i;
            }
            
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  isActive={pageNumber === current}
                  onClick={() => handlePageChange(pageNumber)}
                  className="cursor-pointer"
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(current + 1)}
              className={cn(
                current >= totalPages && 'pointer-events-none opacity-50',
                current < totalPages && 'cursor-pointer'
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

// 数据表格主组件
export const DataTable = <T extends Record<string, any> = any>({
  data,
  columns,
  className,
  loading = false,
  empty = 'No data available',
  rowKey = 'id',
  onRowClick,
  onRowDoubleClick,
  rowSelection,
  pagination,
  scroll,
  size = 'middle',
  bordered = false,
  showHeader = true,
  sticky = false,
  expandable,
  sortBy,
  sortDirection,
  onSort,
  filters,
  onFilter,
  searchValue,
  onSearch,
  toolbar
}: DataTableProps<T>) => {
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<string[]>(
    rowSelection?.selectedRowKeys || []
  );
  const [expandedRowKeys, setExpandedRowKeys] = React.useState<string[]>(
    expandable?.expandedRowKeys || expandable?.defaultExpandedRowKeys || []
  );
  
  React.useEffect(() => {
    if (rowSelection?.selectedRowKeys) {
      setSelectedRowKeys(rowSelection.selectedRowKeys);
    }
  }, [rowSelection?.selectedRowKeys]);
  
  React.useEffect(() => {
    if (expandable?.expandedRowKeys) {
      setExpandedRowKeys(expandable.expandedRowKeys);
    }
  }, [expandable?.expandedRowKeys]);
  
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record, index);
    }
    return record[rowKey] || index.toString();
  };
  
  const handleRowSelect = (key: string, selected: boolean) => {
    const newSelectedRowKeys = selected
      ? [...selectedRowKeys, key]
      : selectedRowKeys.filter(k => k !== key);
    
    setSelectedRowKeys(newSelectedRowKeys);
    
    const selectedRows = data.filter((record, index) => 
      newSelectedRowKeys.includes(getRowKey(record, index))
    );
    
    rowSelection?.onChange?.(newSelectedRowKeys, selectedRows);
    
    const record = data.find((r, i) => getRowKey(r, i) === key);
    if (record) {
      rowSelection?.onSelect?.(record, selected, selectedRows, new Event('select'));
    }
  };
  
  const handleSelectAll = (selected: boolean) => {
    const allKeys = data.map((record, index) => getRowKey(record, index));
    const newSelectedRowKeys = selected ? allKeys : [];
    
    setSelectedRowKeys(newSelectedRowKeys);
    
    const selectedRows = selected ? data : [];
    const changeRows = selected ? data : data.filter((record, index) => 
      selectedRowKeys.includes(getRowKey(record, index))
    );
    
    rowSelection?.onChange?.(newSelectedRowKeys, selectedRows);
    rowSelection?.onSelectAll?.(selected, selectedRows, changeRows);
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
  
  const getSortIcon = (key: string) => {
    const direction = getSortDirection(key);
    
    if (direction === 'asc') {
      return <ChevronUp className="ml-2 h-4 w-4" />;
    }
    
    if (direction === 'desc') {
      return <ChevronDown className="ml-2 h-4 w-4" />;
    }
    
    return <ChevronsUpDown className="ml-2 h-4 w-4" />;
  };
  
  const isRowSelected = (key: string) => selectedRowKeys.includes(key);
  const isRowExpanded = (key: string) => expandedRowKeys.includes(key);
  
  const handleRowExpand = (key: string, expanded: boolean) => {
    const newExpandedRowKeys = expanded
      ? [...expandedRowKeys, key]
      : expandedRowKeys.filter(k => k !== key);
    
    setExpandedRowKeys(newExpandedRowKeys);
    
    const record = data.find((r, i) => getRowKey(r, i) === key);
    if (record) {
      expandable?.onExpand?.(expanded, record);
    }
    
    expandable?.onExpandedRowsChange?.(newExpandedRowKeys);
  };
  
  const contextValue: DataTableContextValue = {
    sortBy,
    sortDirection,
    onSort,
    filters,
    onFilter,
    selectedRowKeys,
    onRowSelect: handleRowSelect,
    onSelectAll: handleSelectAll
  };
  
  const tableSize = size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'md';
  const hasSelection = !!rowSelection;
  const hasExpansion = !!expandable;
  
  return (
    <DataTableContext.Provider value={contextValue}>
      <div className={cn('w-full', className)}>
        {/* 工具栏 */}
        {toolbar && (
          <DataTableToolbar
            title={toolbar.title}
            actions={toolbar.actions}
            search={toolbar.search}
            filter={toolbar.filter}
            export={toolbar.export}
            refresh={toolbar.refresh}
            searchValue={searchValue}
            onSearch={onSearch}
            onExport={toolbar.onExport}
            onRefresh={toolbar.onRefresh}
          />
        )}
        
        {/* 表格容器 */}
        <div className={cn(
          'relative overflow-auto',
          scroll?.x && 'overflow-x-auto',
          scroll?.y && 'overflow-y-auto'
        )}>
          <Table
            variant={bordered ? 'bordered' : 'default'}
            size={tableSize}
            stickyHeader={sticky}
            responsive={!!scroll?.x}
            style={{
              minWidth: scroll?.x,
              maxHeight: scroll?.y
            }}
          >
            {/* 表头 */}
            {showHeader && (
              <TableHeader>
                <TableRow>
                  {/* 选择列 */}
                  {hasSelection && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedRowKeys.length === data.length && data.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                  )}
                  
                  {/* 展开列 */}
                  {hasExpansion && (
                    <TableHead className="w-12" />
                  )}
                  
                  {/* 数据列 */}
                  {columns.map((column, index) => {
                    const dataIndex = column.dataIndex || column.key;
                    
                    return (
                      <TableHead
                        key={column.key || index}
                        className={cn(column.headerClassName)}
                        align={column.align}
                        width={column.width}
                        sortable={column.sortable}
                        sortDirection={getSortDirection(dataIndex)}
                        onSort={() => handleSort(dataIndex)}
                        style={{
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth
                        }}
                      >
                        <div className="flex items-center">
                          {column.title}
                          {column.sortable && getSortIcon(dataIndex)}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
            )}
            
            {/* 表体 */}
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (hasSelection ? 1 : 0) + (hasExpansion ? 1 : 0)} 
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (hasSelection ? 1 : 0) + (hasExpansion ? 1 : 0)} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    {empty}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((record, index) => {
                  const key = getRowKey(record, index);
                  const selected = isRowSelected(key);
                  const expanded = isRowExpanded(key);
                  
                  return (
                    <React.Fragment key={key}>
                      <TableRow
                        selected={selected}
                        clickable={!!onRowClick}
                        onClick={() => {
                          if (expandable?.expandRowByClick) {
                            handleRowExpand(key, !expanded);
                          }
                          onRowClick?.(record, index);
                        }}
                        onDoubleClick={() => onRowDoubleClick?.(record, index)}
                      >
                        {/* 选择列 */}
                        {hasSelection && (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => handleRowSelect(key, e.target.checked)}
                              className="rounded border-gray-300"
                              {...rowSelection?.getCheckboxProps?.(record)}
                            />
                          </TableCell>
                        )}
                        
                        {/* 展开列 */}
                        {hasExpansion && (
                          <TableCell>
                            {expandable?.expandIcon ? (
                              expandable.expandIcon({
                                expanded,
                                onExpand: (exp) => handleRowExpand(key, exp),
                                record
                              })
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRowExpand(key, !expanded)}
                              >
                                {expanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        )}
                        
                        {/* 数据列 */}
                        {columns.map((column, colIndex) => {
                          const dataIndex = column.dataIndex || column.key;
                          const value = record[dataIndex];
                          const content = column.render ? column.render(value, record, index) : value;
                          
                          return (
                            <TableCell
                              key={column.key || colIndex}
                              className={cn(
                                column.className,
                                column.ellipsis && 'max-w-0 truncate'
                              )}
                              align={column.align}
                              width={column.width}
                              truncate={column.ellipsis}
                              style={{
                                minWidth: column.minWidth,
                                maxWidth: column.maxWidth
                              }}
                            >
                              {content}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      
                      {/* 展开行 */}
                      {hasExpansion && expanded && expandable?.expandedRowRender && (
                        <TableRow>
                          <TableCell 
                            colSpan={columns.length + (hasSelection ? 1 : 0) + 1}
                            className="p-0"
                          >
                            <div className="p-4 bg-muted/50">
                              {expandable.expandedRowRender(record, index, 0, expanded)}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* 分页 */}
        {pagination && (
          <DataTablePagination
            current={pagination.current || 1}
            pageSize={pagination.pageSize || 10}
            total={pagination.total || 0}
            showSizeChanger={pagination.showSizeChanger}
            showQuickJumper={pagination.showQuickJumper}
            showTotal={pagination.showTotal}
            onChange={pagination.onChange}
            onShowSizeChange={pagination.onShowSizeChange}
            pageSizeOptions={pagination.pageSizeOptions}
          />
        )}
      </div>
    </DataTableContext.Provider>
  );
};