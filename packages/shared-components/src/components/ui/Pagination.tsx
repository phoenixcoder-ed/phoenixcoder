import * as React from 'react';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

// 分页组件属性接口
export interface PaginationProps {
  children?: React.ReactNode;
  className?: string;
}

// 分页内容属性接口
export interface PaginationContentProps extends React.HTMLAttributes<HTMLUListElement> {
  children?: React.ReactNode;
  className?: string;
}

// 分页项属性接口
export interface PaginationItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode;
  className?: string;
}

// 分页链接属性接口
export interface PaginationLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode;
  className?: string;
  isActive?: boolean;
  size?: 'default' | 'sm' | 'lg';
  asChild?: boolean;
}

// 分页上一页属性接口
export interface PaginationPreviousProps extends PaginationLinkProps {
  children?: React.ReactNode;
}

// 分页下一页属性接口
export interface PaginationNextProps extends PaginationLinkProps {
  children?: React.ReactNode;
}

// 分页省略号属性接口
export interface PaginationEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

// 分页尺寸配置
const paginationSizeVariants = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3 py-2',
  lg: 'h-11 px-8 py-2'
};

// 分页根组件
export const Pagination: React.FC<PaginationProps> = ({
  children,
  className
}) => {
  return (
    <nav
      className={cn('mx-auto flex w-full justify-center', className)}
      role="navigation"
      aria-label="pagination"
    >
      {children}
    </nav>
  );
};

// 分页内容组件
export const PaginationContent = React.forwardRef<HTMLUListElement, PaginationContentProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  return (
    <ul
      ref={ref}
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    >
      {children}
    </ul>
  );
});

PaginationContent.displayName = 'PaginationContent';

// 分页项组件
export const PaginationItem = React.forwardRef<HTMLLIElement, PaginationItemProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  return (
    <li
      ref={ref}
      className={cn('', className)}
      {...props}
    >
      {children}
    </li>
  );
});

PaginationItem.displayName = 'PaginationItem';

// 分页链接组件
export const PaginationLink = React.forwardRef<HTMLAnchorElement, PaginationLinkProps>((
  {
    children,
    className,
    isActive = false,
    size = 'default',
    asChild = false,
    ...props
  },
  ref
) => {
  const linkClasses = cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    paginationSizeVariants[size],
    isActive
      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
      : 'hover:bg-accent hover:text-accent-foreground',
    className
  );
  
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(child, {
      ...(child.props as any),
      className: cn((child.props as any)?.className, linkClasses),
      'aria-current': isActive ? 'page' : undefined,
      ...props
    });
  }
  
  return (
    <a
      ref={ref}
      className={linkClasses}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </a>
  );
});

PaginationLink.displayName = 'PaginationLink';

// 分页上一页组件
export const PaginationPrevious = React.forwardRef<HTMLAnchorElement, PaginationPreviousProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  return (
    <PaginationLink
      ref={ref}
      className={cn('gap-1 pl-2.5', className)}
      aria-label="Go to previous page"
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      {children || <span>Previous</span>}
    </PaginationLink>
  );
});

PaginationPrevious.displayName = 'PaginationPrevious';

// 分页下一页组件
export const PaginationNext = React.forwardRef<HTMLAnchorElement, PaginationNextProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  return (
    <PaginationLink
      ref={ref}
      className={cn('gap-1 pr-2.5', className)}
      aria-label="Go to next page"
      {...props}
    >
      {children || <span>Next</span>}
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
});

PaginationNext.displayName = 'PaginationNext';

// 分页省略号组件
export const PaginationEllipsis = React.forwardRef<HTMLSpanElement, PaginationEllipsisProps>((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <span
      ref={ref}
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      aria-hidden="true"
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
});

PaginationEllipsis.displayName = 'PaginationEllipsis';

// 简单分页组件
export const SimplePagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  showPrevNext?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  disabled?: boolean;
  previousLabel?: React.ReactNode;
  nextLabel?: React.ReactNode;
  firstLabel?: React.ReactNode;
  lastLabel?: React.ReactNode;
}> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  size = 'default',
  showPrevNext = true,
  showFirstLast = false,
  maxVisiblePages = 5,
  disabled = false,
  previousLabel,
  nextLabel,
  firstLabel = 'First',
  lastLabel = 'Last'
}) => {
  // 计算显示的页码
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大显示页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 计算显示范围
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);
      
      // 调整范围以确保显示足够的页码
      if (endPage - startPage + 1 < maxVisiblePages) {
        if (startPage === 1) {
          endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        } else {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
      }
      
      // 添加第一页和省略号
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('ellipsis');
        }
      }
      
      // 添加中间页码
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // 添加省略号和最后一页
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('ellipsis');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  const visiblePages = getVisiblePages();
  const canGoPrevious = currentPage > 1 && !disabled;
  const canGoNext = currentPage < totalPages && !disabled;
  
  const handlePageChange = (page: number) => {
    if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };
  
  return (
    <Pagination className={className}>
      <PaginationContent>
        {/* 第一页按钮 */}
        {showFirstLast && currentPage > 1 && (
          <PaginationItem>
            <PaginationLink
              size={size}
              onClick={() => handlePageChange(1)}
              className={disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            >
              {firstLabel}
            </PaginationLink>
          </PaginationItem>
        )}
        
        {/* 上一页按钮 */}
        {showPrevNext && (
          <PaginationItem>
            <PaginationPrevious
              size={size}
              onClick={() => handlePageChange(currentPage - 1)}
              className={cn(
                !canGoPrevious && 'pointer-events-none opacity-50',
                canGoPrevious && 'cursor-pointer'
              )}
            >
              {previousLabel}
            </PaginationPrevious>
          </PaginationItem>
        )}
        
        {/* 页码 */}
        {visiblePages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          
          return (
            <PaginationItem key={page}>
              <PaginationLink
                size={size}
                isActive={page === currentPage}
                onClick={() => handlePageChange(page)}
                className={cn(
                  disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                )}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        
        {/* 下一页按钮 */}
        {showPrevNext && (
          <PaginationItem>
            <PaginationNext
              size={size}
              onClick={() => handlePageChange(currentPage + 1)}
              className={cn(
                !canGoNext && 'pointer-events-none opacity-50',
                canGoNext && 'cursor-pointer'
              )}
            >
              {nextLabel}
            </PaginationNext>
          </PaginationItem>
        )}
        
        {/* 最后一页按钮 */}
        {showFirstLast && currentPage < totalPages && (
          <PaginationItem>
            <PaginationLink
              size={size}
              onClick={() => handlePageChange(totalPages)}
              className={disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            >
              {lastLabel}
            </PaginationLink>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
};

// 数字分页组件
export const NumberPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  maxVisiblePages?: number;
  disabled?: boolean;
}> = (props) => {
  return (
    <SimplePagination
      {...props}
      showPrevNext={false}
      showFirstLast={false}
    />
  );
};

// 箭头分页组件
export const ArrowPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  showPageInfo?: boolean;
  previousLabel?: React.ReactNode;
  nextLabel?: React.ReactNode;
}> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  size = 'default',
  disabled = false,
  showPageInfo = true,
  previousLabel,
  nextLabel
}) => {
  const canGoPrevious = currentPage > 1 && !disabled;
  const canGoNext = currentPage < totalPages && !disabled;
  
  const handlePageChange = (page: number) => {
    if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };
  
  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            size={size}
            onClick={() => handlePageChange(currentPage - 1)}
            className={cn(
              !canGoPrevious && 'pointer-events-none opacity-50',
              canGoPrevious && 'cursor-pointer'
            )}
          >
            {previousLabel}
          </PaginationPrevious>
        </PaginationItem>
        
        {showPageInfo && (
          <PaginationItem>
            <span className="flex h-10 items-center px-4 text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </PaginationItem>
        )}
        
        <PaginationItem>
          <PaginationNext
            size={size}
            onClick={() => handlePageChange(currentPage + 1)}
            className={cn(
              !canGoNext && 'pointer-events-none opacity-50',
              canGoNext && 'cursor-pointer'
            )}
          >
            {nextLabel}
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

// 响应式分页组件
export const ResponsivePagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  mobileMaxPages?: number;
  desktopMaxPages?: number;
}> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  size = 'default',
  disabled = false,
  mobileMaxPages = 3,
  desktopMaxPages = 7
}) => {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (isMobile) {
    return (
      <ArrowPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        className={className}
        size={size}
        disabled={disabled}
        showPageInfo={true}
      />
    );
  }
  
  return (
    <SimplePagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      className={className}
      size={size}
      disabled={disabled}
      maxVisiblePages={desktopMaxPages}
      showPrevNext={true}
      showFirstLast={totalPages > desktopMaxPages}
    />
  );
};