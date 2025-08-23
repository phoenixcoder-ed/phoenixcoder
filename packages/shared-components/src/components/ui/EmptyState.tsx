import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { FileX, Search, Inbox, AlertCircle, Wifi, RefreshCw, Plus, ArrowLeft } from 'lucide-react';

// 空状态类型
export type EmptyStateType = 
  | 'no-data'
  | 'no-results'
  | 'no-content'
  | 'error'
  | 'offline'
  | 'loading'
  | 'custom';

// 空状态尺寸
export type EmptyStateSize = 'sm' | 'md' | 'lg' | 'xl';

// 空状态属性接口
export interface EmptyStateProps {
  type?: EmptyStateType;
  size?: EmptyStateSize;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  actions?: React.ReactNode[];
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  className?: string;
  imageClassName?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

// 默认配置
const defaultConfigs: Record<EmptyStateType, {
  icon: React.ReactNode;
  title: string;
  description: string;
}> = {
  'no-data': {
    icon: <Inbox className="h-12 w-12" />,
    title: 'No data available',
    description: 'There is no data to display at the moment.'
  },
  'no-results': {
    icon: <Search className="h-12 w-12" />,
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.'
  },
  'no-content': {
    icon: <FileX className="h-12 w-12" />,
    title: 'No content',
    description: 'This area is empty. Add some content to get started.'
  },
  'error': {
    icon: <AlertCircle className="h-12 w-12" />,
    title: 'Something went wrong',
    description: 'An error occurred while loading the content.'
  },
  'offline': {
    icon: <Wifi className="h-12 w-12" />,
    title: 'You are offline',
    description: 'Please check your internet connection and try again.'
  },
  'loading': {
    icon: <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>,
    title: 'Loading...',
    description: 'Please wait while we load the content.'
  },
  'custom': {
    icon: <Inbox className="h-12 w-12" />,
    title: 'Empty',
    description: 'No content available.'
  }
};

// 尺寸配置
const sizeConfigs = {
  sm: {
    container: 'py-8',
    icon: 'h-8 w-8',
    title: 'text-lg',
    description: 'text-sm',
    spacing: 'space-y-2'
  },
  md: {
    container: 'py-12',
    icon: 'h-12 w-12',
    title: 'text-xl',
    description: 'text-base',
    spacing: 'space-y-3'
  },
  lg: {
    container: 'py-16',
    icon: 'h-16 w-16',
    title: 'text-2xl',
    description: 'text-lg',
    spacing: 'space-y-4'
  },
  xl: {
    container: 'py-20',
    icon: 'h-20 w-20',
    title: 'text-3xl',
    description: 'text-xl',
    spacing: 'space-y-6'
  }
};

// 空状态主组件
export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  size = 'md',
  icon,
  title,
  description,
  image,
  imageAlt = 'Empty state illustration',
  actions = [],
  primaryAction,
  secondaryAction,
  className,
  imageClassName,
  contentClassName,
  children
}) => {
  const config = defaultConfigs[type];
  const sizeConfig = sizeConfigs[size];
  
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeConfig.container,
      className
    )}>
      <div className={cn(
        'flex flex-col items-center',
        sizeConfig.spacing,
        contentClassName
      )}>
        {/* 图片或图标 */}
        {image ? (
          <img
            src={image}
            alt={imageAlt}
            className={cn(
              'max-w-xs opacity-60',
              imageClassName
            )}
          />
        ) : (
          <div className={cn(
            'text-muted-foreground',
            sizeConfig.icon
          )}>
            {displayIcon}
          </div>
        )}
        
        {/* 标题 */}
        {displayTitle && (
          <h3 className={cn(
            'font-semibold text-foreground',
            sizeConfig.title
          )}>
            {displayTitle}
          </h3>
        )}
        
        {/* 描述 */}
        {displayDescription && (
          <p className={cn(
            'text-muted-foreground max-w-md',
            sizeConfig.description
          )}>
            {displayDescription}
          </p>
        )}
        
        {/* 自定义内容 */}
        {children}
        
        {/* 操作按钮 */}
        {(primaryAction || secondaryAction || actions.length > 0) && (
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                loading={primaryAction.loading}
                disabled={primaryAction.disabled}
              >
                {primaryAction.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
                loading={secondaryAction.loading}
                disabled={secondaryAction.disabled}
              >
                {secondaryAction.label}
              </Button>
            )}
            
            {actions.map((action, index) => (
              <React.Fragment key={index}>{action}</React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 无数据状态组件
export const NoDataState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="no-data" {...props} />
);

// 无搜索结果状态组件
export const NoResultsState: React.FC<Omit<EmptyStateProps, 'type'> & {
  searchTerm?: string;
  onClearSearch?: () => void;
}> = ({ searchTerm, onClearSearch, ...props }) => (
  <EmptyState
    type="no-results"
    title={searchTerm ? `No results for "${searchTerm}"` : 'No results found'}
    description="Try adjusting your search or filter criteria."
    secondaryAction={onClearSearch ? {
      label: 'Clear search',
      onClick: onClearSearch
    } : undefined}
    {...props}
  />
);

// 无内容状态组件
export const NoContentState: React.FC<Omit<EmptyStateProps, 'type'> & {
  onCreateContent?: () => void;
  createLabel?: string;
}> = ({ onCreateContent, createLabel = 'Create content', ...props }) => (
  <EmptyState
    type="no-content"
    primaryAction={onCreateContent ? {
      label: createLabel,
      onClick: onCreateContent
    } : undefined}
    icon={<Plus className="h-12 w-12" />}
    {...props}
  />
);

// 错误状态组件
export const ErrorState: React.FC<Omit<EmptyStateProps, 'type'> & {
  onRetry?: () => void;
  retryLabel?: string;
  error?: Error | string;
}> = ({ onRetry, retryLabel = 'Try again', error, ...props }) => (
  <EmptyState
    type="error"
    description={error ? (typeof error === 'string' ? error : error.message) : 'An error occurred while loading the content.'}
    primaryAction={onRetry ? {
      label: retryLabel,
      onClick: onRetry
    } : undefined}
    icon={<RefreshCw className="h-12 w-12" />}
    {...props}
  />
);

// 离线状态组件
export const OfflineState: React.FC<Omit<EmptyStateProps, 'type'> & {
  onRetry?: () => void;
  retryLabel?: string;
}> = ({ onRetry, retryLabel = 'Retry', ...props }) => (
  <EmptyState
    type="offline"
    primaryAction={onRetry ? {
      label: retryLabel,
      onClick: onRetry
    } : undefined}
    {...props}
  />
);

// 加载状态组件
export const LoadingState: React.FC<Omit<EmptyStateProps, 'type'> & {
  loadingText?: string;
}> = ({ loadingText = 'Loading...', ...props }) => (
  <EmptyState
    type="loading"
    title={loadingText}
    description="Please wait while we load the content."
    {...props}
  />
);

// 空页面状态组件
export const EmptyPageState: React.FC<Omit<EmptyStateProps, 'type'> & {
  onGoBack?: () => void;
  backLabel?: string;
  pageTitle?: string;
}> = ({ onGoBack, backLabel = 'Go back', pageTitle = 'Page not found', ...props }) => (
  <EmptyState
    type="custom"
    size="lg"
    title={pageTitle}
    description="The page you are looking for does not exist or has been moved."
    primaryAction={onGoBack ? {
      label: backLabel,
      onClick: onGoBack
    } : undefined}
    icon={<ArrowLeft className="h-16 w-16" />}
    {...props}
  />
);

// 空列表状态组件
export const EmptyListState: React.FC<Omit<EmptyStateProps, 'type'> & {
  listName?: string;
  onAddItem?: () => void;
  addLabel?: string;
}> = ({ listName = 'items', onAddItem, addLabel = 'Add item', ...props }) => (
  <EmptyState
    type="no-content"
    title={`No ${listName} yet`}
    description={`You haven't added any ${listName} yet. Create your first one to get started.`}
    primaryAction={onAddItem ? {
      label: addLabel,
      onClick: onAddItem
    } : undefined}
    icon={<Plus className="h-12 w-12" />}
    {...props}
  />
);

// 空搜索状态组件
export const EmptySearchState: React.FC<Omit<EmptyStateProps, 'type'> & {
  searchTerm?: string;
  onClearSearch?: () => void;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}> = ({ searchTerm, onClearSearch, suggestions = [], onSuggestionClick, ...props }) => (
  <EmptyState
    type="no-results"
    title={searchTerm ? `No results for "${searchTerm}"` : 'No search results'}
    description="Try different keywords or check your spelling."
    secondaryAction={onClearSearch ? {
      label: 'Clear search',
      onClick: onClearSearch
    } : undefined}
    {...props}
  >
    {suggestions.length > 0 && (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-2">Try searching for:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick?.(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    )}
  </EmptyState>
);