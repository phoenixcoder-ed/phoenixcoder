import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';

// 面包屑组件属性接口
export interface BreadcrumbProps {
  children?: React.ReactNode;
  className?: string;
  separator?: React.ReactNode;
  maxItems?: number;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
  expandText?: string;
  homeIcon?: React.ReactNode;
  showHomeIcon?: boolean;
}

// 面包屑列表属性接口
export interface BreadcrumbListProps extends React.HTMLAttributes<HTMLOListElement> {
  children?: React.ReactNode;
  className?: string;
}

// 面包屑项属性接口
export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode;
  className?: string;
}

// 面包屑链接属性接口
export interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
  active?: boolean;
}

// 面包屑页面属性接口
export interface BreadcrumbPageProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  className?: string;
}

// 面包屑分隔符属性接口
export interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode;
  className?: string;
}

// 面包屑省略号属性接口
export interface BreadcrumbEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

// 面包屑上下文
interface BreadcrumbContextValue {
  separator: React.ReactNode;
  maxItems?: number;
  itemsBeforeCollapse: number;
  itemsAfterCollapse: number;
  expandText: string;
  homeIcon?: React.ReactNode;
  showHomeIcon: boolean;
}

const BreadcrumbContext = React.createContext<BreadcrumbContextValue | null>(null);

const useBreadcrumb = () => {
  const context = React.useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a Breadcrumb');
  }
  return context;
};

// 面包屑根组件
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  children,
  className,
  separator = <ChevronRight className="h-4 w-4" />,
  maxItems,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 1,
  expandText = 'Show more',
  homeIcon = <Home className="h-4 w-4" />,
  showHomeIcon = false
}) => {
  const contextValue: BreadcrumbContextValue = {
    separator,
    maxItems,
    itemsBeforeCollapse,
    itemsAfterCollapse,
    expandText,
    homeIcon,
    showHomeIcon
  };
  
  return (
    <BreadcrumbContext.Provider value={contextValue}>
      <nav
        className={cn('flex', className)}
        aria-label="breadcrumb"
      >
        {children}
      </nav>
    </BreadcrumbContext.Provider>
  );
};

// 面包屑列表组件
export const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  const { maxItems, itemsBeforeCollapse, itemsAfterCollapse, expandText } = useBreadcrumb();
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // 将 children 转换为数组
  const items = React.Children.toArray(children);
  const totalItems = items.length;
  
  // 判断是否需要折叠
  const shouldCollapse = maxItems && totalItems > maxItems && !isExpanded;
  
  let displayItems = items;
  
  if (shouldCollapse) {
    const startItems = items.slice(0, itemsBeforeCollapse);
    const endItems = items.slice(-itemsAfterCollapse);
    
    displayItems = [
      ...startItems,
      <BreadcrumbItem key="ellipsis">
        <BreadcrumbEllipsis
          className="cursor-pointer"
          onClick={() => setIsExpanded(true)}
          title={expandText}
        />
      </BreadcrumbItem>,
      ...endItems
    ];
  }
  
  return (
    <ol
      ref={ref}
      className={cn(
        'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
        className
      )}
      {...props}
    >
      {displayItems}
    </ol>
  );
});

BreadcrumbList.displayName = 'BreadcrumbList';

// 面包屑项组件
export const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>((
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
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    >
      {children}
    </li>
  );
});

BreadcrumbItem.displayName = 'BreadcrumbItem';

// 面包屑链接组件
export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>((
  {
    children,
    className,
    asChild = false,
    active = false,
    ...props
  },
  ref
) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(
        'transition-colors hover:text-foreground',
        active && 'text-foreground',
        className,
        (children as any).props?.className
      ),
      ref,
      'aria-current': active ? 'page' : undefined,
      ...props
    });
  }
  
  return (
    <a
      ref={ref}
      className={cn(
        'transition-colors hover:text-foreground',
        active && 'text-foreground',
        className
      )}
      aria-current={active ? 'page' : undefined}
      {...props}
    >
      {children}
    </a>
  );
});

BreadcrumbLink.displayName = 'BreadcrumbLink';

// 面包屑页面组件
export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, BreadcrumbPageProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  return (
    <span
      ref={ref}
      className={cn('font-normal text-foreground', className)}
      role="link"
      aria-disabled="true"
      aria-current="page"
      {...props}
    >
      {children}
    </span>
  );
});

BreadcrumbPage.displayName = 'BreadcrumbPage';

// 面包屑分隔符组件
export const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, BreadcrumbSeparatorProps>((
  {
    children,
    className,
    ...props
  },
  ref
) => {
  const { separator } = useBreadcrumb();
  
  return (
    <li
      ref={ref}
      className={cn('[&>svg]:size-3.5', className)}
      role="presentation"
      aria-hidden="true"
      {...props}
    >
      {children || separator}
    </li>
  );
});

BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

// 面包屑省略号组件
export const BreadcrumbEllipsis = React.forwardRef<HTMLSpanElement, BreadcrumbEllipsisProps>((
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
      role="presentation"
      aria-hidden="true"
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More</span>
    </span>
  );
});

BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

// 简单面包屑组件
export const SimpleBreadcrumb: React.FC<{
  items: Array<{
    label: React.ReactNode;
    href?: string;
    onClick?: () => void;
    active?: boolean;
  }>;
  className?: string;
  separator?: React.ReactNode;
  maxItems?: number;
  showHomeIcon?: boolean;
  homeHref?: string;
  onHomeClick?: () => void;
}> = ({
  items,
  className,
  separator,
  maxItems,
  showHomeIcon = false,
  homeHref = '/',
  onHomeClick
}) => {
  return (
    <Breadcrumb
      className={className}
      separator={separator}
      maxItems={maxItems}
      showHomeIcon={showHomeIcon}
    >
      <BreadcrumbList>
        {showHomeIcon && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={homeHref}
                onClick={onHomeClick}
                className="flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {items.length > 0 && <BreadcrumbSeparator />}
          </>
        )}
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {isLast || item.active ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={item.href}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

// 路径面包屑组件
export const PathBreadcrumb: React.FC<{
  path: string;
  className?: string;
  separator?: React.ReactNode;
  maxItems?: number;
  showHomeIcon?: boolean;
  baseHref?: string;
  onNavigate?: (path: string) => void;
  pathLabels?: Record<string, string>;
}> = ({
  path,
  className,
  separator,
  maxItems,
  showHomeIcon = true,
  baseHref = '',
  onNavigate,
  pathLabels = {}
}) => {
  const segments = path.split('/').filter(Boolean);
  
  const items = segments.map((segment, index) => {
    const segmentPath = '/' + segments.slice(0, index + 1).join('/');
    const label = pathLabels[segment] || segment;
    
    return {
      label,
      href: baseHref + segmentPath,
      onClick: onNavigate ? () => onNavigate(segmentPath) : undefined
    };
  });
  
  return (
    <SimpleBreadcrumb
      items={items}
      className={className}
      separator={separator}
      maxItems={maxItems}
      showHomeIcon={showHomeIcon}
      homeHref={baseHref + '/'}
      onHomeClick={onNavigate ? () => onNavigate('/') : undefined}
    />
  );
};

// 响应式面包屑组件
export const ResponsiveBreadcrumb: React.FC<{
  items: Array<{
    label: React.ReactNode;
    href?: string;
    onClick?: () => void;
    active?: boolean;
  }>;
  className?: string;
  separator?: React.ReactNode;
  mobileMaxItems?: number;
  desktopMaxItems?: number;
  showHomeIcon?: boolean;
}> = ({
  items,
  className,
  separator,
  mobileMaxItems = 2,
  desktopMaxItems,
  showHomeIcon = false
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
  
  const maxItems = isMobile ? mobileMaxItems : desktopMaxItems;
  
  return (
    <SimpleBreadcrumb
      items={items}
      className={className}
      separator={separator}
      maxItems={maxItems}
      showHomeIcon={showHomeIcon}
    />
  );
};