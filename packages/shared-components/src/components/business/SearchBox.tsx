import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  Star,
  FileText,
  User,
  Target,
  Award,
  Folder,
  File,
  Image,
  Video,
  Music,
  Code,
  Link,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  Globe,
  Eye,
  Heart,
  Clock,
  Share,
  Lock,
  Unlock,
  Archive,
  BarChart,
  ThumbsUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui/DropdownMenu';
import { Popover } from '../ui/Popover';
import { Separator } from '../ui/Separator';

// 搜索类型枚举
export type SearchType = 
  | 'all' 
  | 'text' 
  | 'user' 
  | 'task' 
  | 'skill' 
  | 'project' 
  | 'file' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'code' 
  | 'document' 
  | 'link' 
  | 'location' 
  | 'date' 
  | 'price' 
  | 'tag';

// 搜索范围枚举
export type SearchScope = 
  | 'global' 
  | 'current' 
  | 'favorites' 
  | 'recent' 
  | 'shared' 
  | 'private' 
  | 'public' 
  | 'archived';

// 排序方式枚举
export type SortOrder = 
  | 'relevance' 
  | 'date' 
  | 'name' 
  | 'size' 
  | 'popularity' 
  | 'rating' 
  | 'price' 
  | 'distance' 
  | 'alphabetical' 
  | 'reverse_alphabetical' 
  | 'newest' 
  | 'oldest' 
  | 'most_viewed' 
  | 'most_liked' 
  | 'most_shared';

// 排序方向枚举
export type SortDirection = 'asc' | 'desc';

// 搜索建议接口
export interface SearchSuggestion {
  /** 建议ID */
  id: string;
  /** 建议文本 */
  text: string;
  /** 建议类型 */
  type?: SearchType;
  /** 建议分类 */
  category?: string;
  /** 建议描述 */
  description?: string;
  /** 建议图标 */
  icon?: React.ComponentType<{ className?: string }>;
  /** 建议图片 */
  image?: string;
  /** 建议标签 */
  tags?: string[];
  /** 建议数据 */
  data?: Record<string, any>;
  /** 是否热门 */
  trending?: boolean;
  /** 是否收藏 */
  favorited?: boolean;
  /** 使用次数 */
  count?: number;
  /** 最后使用时间 */
  lastUsed?: Date;
  /** 点击回调 */
  onClick?: () => void;
}

// 搜索历史接口
export interface SearchHistory {
  /** 历史ID */
  id: string;
  /** 搜索查询 */
  query: string;
  /** 搜索类型 */
  type?: SearchType;
  /** 搜索范围 */
  scope?: SearchScope;
  /** 搜索时间 */
  timestamp: Date;
  /** 结果数量 */
  resultCount?: number;
  /** 是否收藏 */
  favorited?: boolean;
}

// 搜索过滤器接口
export interface SearchFilter {
  /** 过滤器ID */
  id: string;
  /** 过滤器名称 */
  name: string;
  /** 过滤器标签 */
  label: string;
  /** 过滤器类型 */
  type: 'select' | 'multiselect' | 'range' | 'date' | 'boolean' | 'text';
  /** 过滤器选项 */
  options?: Array<{
    value: string | number;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    count?: number;
  }>;
  /** 过滤器值 */
  value?: any;
  /** 是否必需 */
  required?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 过滤器描述 */
  description?: string;
  /** 值变化回调 */
  onChange?: (value: any) => void;
}

// SearchBox 组件属性接口
export interface SearchBoxProps {
  /** 搜索值 */
  value?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 搜索类型 */
  type?: SearchType;
  /** 搜索范围 */
  scope?: SearchScope;
  /** 排序方式 */
  sortBy?: SortOrder;
  /** 排序方向 */
  sortDirection?: SortDirection;
  /** 搜索建议 */
  suggestions?: SearchSuggestion[];
  /** 搜索历史 */
  history?: SearchHistory[];
  /** 搜索过滤器 */
  filters?: SearchFilter[];
  /** 热门搜索 */
  trending?: string[];
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 显示变体 */
  variant?: 'default' | 'filled' | 'outline' | 'ghost' | 'minimal';
  /** 是否显示搜索图标 */
  showSearchIcon?: boolean;
  /** 是否显示清除按钮 */
  showClearButton?: boolean;
  /** 是否显示过滤按钮 */
  showFilterButton?: boolean;
  /** 是否显示排序按钮 */
  showSortButton?: boolean;
  /** 是否显示类型选择器 */
  showTypeSelector?: boolean;
  /** 是否显示范围选择器 */
  showScopeSelector?: boolean;
  /** 是否显示建议 */
  showSuggestions?: boolean;
  /** 是否显示历史 */
  showHistory?: boolean;
  /** 是否显示热门 */
  showTrending?: boolean;
  /** 是否自动聚焦 */
  autoFocus?: boolean;
  /** 是否自动完成 */
  autoComplete?: boolean;
  /** 是否实时搜索 */
  liveSearch?: boolean;
  /** 搜索延迟（毫秒） */
  searchDelay?: number;
  /** 最小搜索长度 */
  minSearchLength?: number;
  /** 最大建议数量 */
  maxSuggestions?: number;
  /** 最大历史数量 */
  maxHistory?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 搜索值变化回调 */
  onChange?: (value: string) => void;
  /** 搜索提交回调 */
  onSearch?: (query: string, options: {
    type: SearchType;
    scope: SearchScope;
    sortBy: SortOrder;
    sortDirection: SortDirection;
    filters: Record<string, any>;
  }) => void;
  /** 搜索清除回调 */
  onClear?: () => void;
  /** 类型变化回调 */
  onTypeChange?: (type: SearchType) => void;
  /** 范围变化回调 */
  onScopeChange?: (scope: SearchScope) => void;
  /** 排序变化回调 */
  onSortChange?: (sortBy: SortOrder, direction: SortDirection) => void;
  /** 过滤器变化回调 */
  onFilterChange?: (filters: Record<string, any>) => void;
  /** 建议选择回调 */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** 历史选择回调 */
  onHistorySelect?: (history: SearchHistory) => void;
  /** 聚焦回调 */
  onFocus?: () => void;
  /** 失焦回调 */
  onBlur?: () => void;
  /** 自定义样式类名 */
  className?: string;
}

// 搜索类型配置
const searchTypeConfig = {
  all: { label: '全部', icon: Search },
  text: { label: '文本', icon: FileText },
  user: { label: '用户', icon: User },
  task: { label: '任务', icon: Target },
  skill: { label: '技能', icon: Award },
  project: { label: '项目', icon: Folder },
  file: { label: '文件', icon: File },
  image: { label: '图片', icon: Image },
  video: { label: '视频', icon: Video },
  audio: { label: '音频', icon: Music },
  code: { label: '代码', icon: Code },
  document: { label: '文档', icon: FileText },
  link: { label: '链接', icon: Link },
  location: { label: '位置', icon: MapPin },
  date: { label: '日期', icon: Calendar },
  price: { label: '价格', icon: DollarSign },
  tag: { label: '标签', icon: Tag }
};

// 搜索范围配置
const searchScopeConfig = {
  global: { label: '全局', icon: Globe },
  current: { label: '当前', icon: Eye },
  favorites: { label: '收藏', icon: Heart },
  recent: { label: '最近', icon: Clock },
  shared: { label: '共享', icon: Share },
  private: { label: '私有', icon: Lock },
  public: { label: '公开', icon: Unlock },
  archived: { label: '归档', icon: Archive }
};

// 排序方式配置
const sortOrderConfig = {
  relevance: { label: '相关性', icon: TrendingUp },
  date: { label: '日期', icon: Calendar },
  name: { label: '名称', icon: SortAsc },
  size: { label: '大小', icon: BarChart },
  popularity: { label: '热度', icon: TrendingUp },
  rating: { label: '评分', icon: Star },
  price: { label: '价格', icon: DollarSign },
  distance: { label: '距离', icon: MapPin },
  alphabetical: { label: 'A-Z', icon: SortAsc },
  reverse_alphabetical: { label: 'Z-A', icon: SortDesc },
  newest: { label: '最新', icon: ArrowUp },
  oldest: { label: '最旧', icon: ArrowDown },
  most_viewed: { label: '最多查看', icon: Eye },
  most_liked: { label: '最多点赞', icon: ThumbsUp },
  most_shared: { label: '最多分享', icon: Share }
};

// 尺寸配置
const sizeConfig = {
  sm: {
    container: 'h-8',
    input: 'text-sm px-3',
    button: 'h-6 w-6',
    icon: 'w-3 h-3',
    badge: 'text-xs px-1.5 py-0.5',
    dropdown: 'text-sm'
  },
  default: {
    container: 'h-10',
    input: 'text-sm px-4',
    button: 'h-8 w-8',
    icon: 'w-4 h-4',
    badge: 'text-xs px-2 py-1',
    dropdown: 'text-sm'
  },
  lg: {
    container: 'h-12',
    input: 'text-base px-5',
    button: 'h-10 w-10',
    icon: 'w-5 h-5',
    badge: 'text-sm px-2.5 py-1',
    dropdown: 'text-base'
  }
};

// 格式化时间
const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
};

// 高亮搜索文本
const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

// 建议项组件
const SuggestionItem: React.FC<{
  suggestion: SearchSuggestion;
  query: string;
  size: 'sm' | 'default' | 'lg';
  onSelect: (suggestion: SearchSuggestion) => void;
}> = ({ suggestion, query, size, onSelect }) => {
  const sizeStyles = sizeConfig[size];
  const IconComponent = suggestion.icon || searchTypeConfig[suggestion.type || 'all'].icon;

  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors',
        size === 'sm' ? 'p-2' : size === 'lg' ? 'p-4' : 'p-3'
      )}
      onClick={() => onSelect(suggestion)}
    >
      {suggestion.image ? (
        <img 
          src={suggestion.image} 
          alt={suggestion.text}
          className={cn('rounded object-cover', sizeStyles.button)}
        />
      ) : (
        <div className={cn('flex items-center justify-center rounded bg-gray-100', sizeStyles.button)}>
          <IconComponent className={cn('text-gray-500', sizeStyles.icon)} />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className={cn('font-medium truncate', sizeStyles.dropdown)}>
          {highlightText(suggestion.text, query)}
        </div>
        
        {suggestion.description && (
          <div className={cn('text-muted-foreground truncate', 
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
            {suggestion.description}
          </div>
        )}
        
        {suggestion.tags && suggestion.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {suggestion.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className={sizeStyles.badge}>
                {tag}
              </Badge>
            ))}
            {suggestion.tags.length > 3 && (
              <span className={cn('text-muted-foreground', sizeStyles.badge)}>
                +{suggestion.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {suggestion.trending && (
          <Badge variant="outline" className={cn('text-red-600', sizeStyles.badge)}>
            <TrendingUp className={cn('mr-1', 
              size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
            )} />
            热门
          </Badge>
        )}
        
        {suggestion.favorited && (
          <Star className={cn('text-yellow-500 fill-current', sizeStyles.icon)} />
        )}
        
        {suggestion.count && (
          <span className={cn('text-muted-foreground', sizeStyles.badge)}>
            {suggestion.count}
          </span>
        )}
      </div>
    </div>
  );
};

// 历史项组件
const HistoryItem: React.FC<{
  history: SearchHistory;
  size: 'sm' | 'default' | 'lg';
  onSelect: (history: SearchHistory) => void;
  onRemove?: (id: string) => void;
}> = ({ history, size, onSelect, onRemove }) => {
  const sizeStyles = sizeConfig[size];
  const typeConfig = searchTypeConfig[history.type || 'all'];
  const IconComponent = typeConfig.icon;

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 hover:bg-gray-50 group transition-colors',
      size === 'sm' ? 'p-2' : size === 'lg' ? 'p-4' : 'p-3'
    )}>
      <div className={cn('flex items-center justify-center rounded bg-gray-100', sizeStyles.button)}>
        <IconComponent className={cn('text-gray-500', sizeStyles.icon)} />
      </div>
      
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onSelect(history)}
      >
        <div className={cn('font-medium truncate', sizeStyles.dropdown)}>
          {history.query}
        </div>
        
        <div className={cn('text-muted-foreground flex items-center gap-2', 
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          <span>{formatTime(history.timestamp)}</span>
          
          {history.resultCount !== undefined && (
            <>
              <span>•</span>
              <span>{history.resultCount} 个结果</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {history.favorited && (
          <Star className={cn('text-yellow-500 fill-current', sizeStyles.icon)} />
        )}
        
        {onRemove && (
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity',
              sizeStyles.button
            )}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(history.id);
            }}
          >
            <X className={sizeStyles.icon} />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * SearchBox 搜索框组件
 */
export const SearchBox: React.FC<SearchBoxProps> = ({
  value = '',
  placeholder = '搜索...',
  type = 'all',
  scope = 'global',
  sortBy = 'relevance',
  sortDirection = 'desc',
  suggestions = [],
  history = [],
  filters = [],
  trending = [],
  size = 'default',
  variant = 'default',
  showSearchIcon = true,
  showClearButton = true,
  showFilterButton = false,
  showSortButton = false,
  showTypeSelector = false,
  showScopeSelector = false,
  showSuggestions = true,
  showHistory = true,
  showTrending = true,
  autoFocus = false,
  autoComplete = true,
  liveSearch = false,
  searchDelay = 300,
  minSearchLength = 1,
  maxSuggestions = 10,
  maxHistory = 5,
  disabled = false,
  readOnly = false,
  loading = false,
  error,
  onChange,
  onSearch,
  onClear,
  onTypeChange,
  onScopeChange,
  onSortChange,
  onFilterChange,
  onSuggestionSelect,
  onHistorySelect,
  onFocus,
  onBlur,
  className
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sizeStyles = sizeConfig[size];
  const hasValue = inputValue.length > 0;
  const showSuggestionsDropdown = showDropdown && isFocused && (
    (hasValue && suggestions.length > 0) ||
    (!hasValue && (history.length > 0 || trending.length > 0))
  );

  // 同步外部值
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 自动聚焦
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // 实时搜索
  useEffect(() => {
    if (liveSearch && hasValue && inputValue.length >= minSearchLength) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, searchDelay);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [inputValue, liveSearch, minSearchLength, searchDelay]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理输入变化
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange?.(newValue);
    
    if (newValue.length >= minSearchLength) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // 处理搜索
  const handleSearch = useCallback(() => {
    if (onSearch && inputValue.trim()) {
      onSearch(inputValue.trim(), {
        type,
        scope,
        sortBy,
        sortDirection,
        filters: activeFilters
      });
    }
    setShowDropdown(false);
  }, [inputValue, type, scope, sortBy, sortDirection, activeFilters, onSearch]);

  // 处理清除
  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    onClear?.();
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // 处理聚焦
  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
    onFocus?.();
  };

  // 处理失焦
  const handleBlur = () => {
    setIsFocused(false);
    // 延迟关闭下拉框，以便点击建议项
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
    onBlur?.();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // 处理建议选择
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setInputValue(suggestion.text);
    onChange?.(suggestion.text);
    onSuggestionSelect?.(suggestion);
    setShowDropdown(false);
    
    if (suggestion.onClick) {
      suggestion.onClick();
    } else {
      handleSearch();
    }
  };

  // 处理历史选择
  const handleHistorySelect = (historyItem: SearchHistory) => {
    setInputValue(historyItem.query);
    onChange?.(historyItem.query);
    onHistorySelect?.(historyItem);
    setShowDropdown(false);
    handleSearch();
  };

  // 处理热门搜索选择
  const handleTrendingSelect = (query: string) => {
    setInputValue(query);
    onChange?.(query);
    setShowDropdown(false);
    handleSearch();
  };

  // 处理过滤器变化
  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...activeFilters, [filterId]: value };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // 获取变体样式
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return 'bg-gray-100 border-gray-100 focus-within:bg-white focus-within:border-blue-500';
      case 'outline':
        return 'bg-transparent border-gray-300 focus-within:border-blue-500';
      case 'ghost':
        return 'bg-transparent border-transparent hover:bg-gray-50 focus-within:bg-white focus-within:border-blue-500';
      case 'minimal':
        return 'bg-transparent border-transparent focus-within:border-blue-500';
      default:
        return 'bg-white border-gray-300 focus-within:border-blue-500';
    }
  };

  // 过滤建议
  const filteredSuggestions = suggestions
    .filter(suggestion => 
      !hasValue || 
      suggestion.text.toLowerCase().includes(inputValue.toLowerCase())
    )
    .slice(0, maxSuggestions);

  // 过滤历史
  const filteredHistory = history
    .filter(item => 
      !hasValue || 
      item.query.toLowerCase().includes(inputValue.toLowerCase())
    )
    .slice(0, maxHistory);

  return (
    <div className={cn('relative', className)}>
      {/* 主搜索框 */}
      <div className={cn(
        'flex items-center border rounded-lg transition-all duration-200',
        sizeStyles.container,
        getVariantStyles(),
        error && 'border-red-500 focus-within:border-red-500',
        disabled && 'opacity-50 cursor-not-allowed',
        isFocused && 'ring-2 ring-blue-500/20'
      )}>
        {/* 类型选择器 */}
        {showTypeSelector && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size={size}
                  variant="ghost"
                  className="shrink-0 rounded-r-none border-r"
                  disabled={disabled}
                >
                  {React.createElement(searchTypeConfig[type].icon, {
                    className: sizeStyles.icon
                  })}
                  <span className="ml-1">{searchTypeConfig[type].label}</span>
                  <ChevronDown className={cn('ml-1', sizeStyles.icon)} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.entries(searchTypeConfig).map(([key, config]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onTypeChange?.(key as SearchType)}
                  >
                    {React.createElement(config.icon, {
                      className: "mr-2 h-4 w-4"
                    })}
                    {config.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        
        {/* 搜索图标 */}
        {showSearchIcon && !showTypeSelector && (
          <div className="pl-3">
            <Search className={cn('text-gray-400', sizeStyles.icon)} />
          </div>
        )}
        
        {/* 输入框 */}
        <Input
          ref={inputRef}
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete ? 'on' : 'off'}
          className={cn(
            'flex-1 border-0 bg-transparent focus:ring-0 focus:outline-none',
            sizeStyles.input,
            showSearchIcon && !showTypeSelector && 'pl-0'
          )}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        
        {/* 加载指示器 */}
        {loading && (
          <div className="px-3">
            <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', sizeStyles.icon)} />
          </div>
        )}
        
        {/* 清除按钮 */}
        {showClearButton && hasValue && !loading && (
          <Button
            size={size}
            variant="ghost"
            className={cn('shrink-0', sizeStyles.button)}
            onClick={handleClear}
            disabled={disabled}
          >
            <X className={sizeStyles.icon} />
          </Button>
        )}
        
        {/* 过滤按钮 */}
        {showFilterButton && filters.length > 0 && (
          <Popover
            trigger={
              <Button
                size={size}
                variant="ghost"
                className={cn('shrink-0', sizeStyles.button)}
                disabled={disabled}
              >
                <Filter className={sizeStyles.icon} />
                {Object.keys(activeFilters).length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-1 h-4 w-4 p-0 text-xs"
                  >
                    {Object.keys(activeFilters).length}
                  </Badge>
                )}
              </Button>
            }
            content={
              <div className="w-80 p-4 space-y-4">
                <div className="font-medium">搜索过滤器</div>
                
                {filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <label className="text-sm font-medium">
                      {filter.label}
                      {filter.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {filter.description && (
                      <div className="text-xs text-muted-foreground">
                        {filter.description}
                      </div>
                    )}
                    
                    {/* 这里可以根据 filter.type 渲染不同的输入组件 */}
                    {filter.type === 'select' && filter.options && (
                      <select
                        value={activeFilters[filter.id] || ''}
                        onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                        disabled={filter.disabled}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">请选择...</option>
                        {filter.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                            {option.count && ` (${option.count})`}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {filter.type === 'text' && (
                      <Input
                        value={activeFilters[filter.id] || ''}
                        onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                        disabled={filter.disabled}
                        placeholder={`输入${filter.label}...`}
                      />
                    )}
                    
                    {filter.type === 'boolean' && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={activeFilters[filter.id] || false}
                          onChange={(e) => handleFilterChange(filter.id, e.target.checked)}
                          disabled={filter.disabled}
                          className="rounded"
                        />
                        <span className="text-sm">启用{filter.label}</span>
                      </label>
                    )}
                  </div>
                ))}
                
                <div className="flex justify-between pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveFilters({})}
                  >
                    清除全部
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleSearch()}
                  >
                    应用过滤器
                  </Button>
                </div>
              </div>
            }
          />
        )}
        
        {/* 排序按钮 */}
        {showSortButton && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size={size}
                variant="ghost"
                className={cn('shrink-0', sizeStyles.button)}
                disabled={disabled}
              >
                {sortDirection === 'asc' ? (
                  <SortAsc className={sizeStyles.icon} />
                ) : (
                  <SortDesc className={sizeStyles.icon} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(sortOrderConfig).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onSortChange?.(key as SortOrder, sortDirection)}
                >
                  {React.createElement(config.icon, {
                    className: "mr-2 h-4 w-4"
                  })}
                  {config.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onSortChange?.(sortBy, 'asc')}
              >
                <SortAsc className="mr-2 h-4 w-4" />
                升序
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSortChange?.(sortBy, 'desc')}
              >
                <SortDesc className="mr-2 h-4 w-4" />
                降序
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* 范围选择器 */}
        {showScopeSelector && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size={size}
                variant="ghost"
                className={cn('shrink-0 rounded-l-none border-l', sizeStyles.button)}
                disabled={disabled}
              >
                {React.createElement(searchScopeConfig[scope].icon, {
                  className: sizeStyles.icon
                })}
                <ChevronDown className={cn('ml-1', sizeStyles.icon)} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(searchScopeConfig).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onScopeChange?.(key as SearchScope)}
                >
                  {React.createElement(config.icon, {
                    className: "mr-2 h-4 w-4"
                  })}
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* 错误信息 */}
      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      {/* 下拉建议 */}
      {showSuggestionsDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* 搜索建议 */}
          {hasValue && filteredSuggestions.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                搜索建议
              </div>
              
              {filteredSuggestions.map((suggestion) => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  query={inputValue}
                  size={size}
                  onSelect={handleSuggestionSelect}
                />
              ))}
            </div>
          )}
          
          {/* 搜索历史 */}
          {!hasValue && showHistory && filteredHistory.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b flex items-center justify-between">
                <span>搜索历史</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-auto p-0 text-xs"
                  onClick={() => {/* 清除历史 */}}
                >
                  清除
                </Button>
              </div>
              
              {filteredHistory.map((item) => (
                <HistoryItem
                  key={item.id}
                  history={item}
                  size={size}
                  onSelect={handleHistorySelect}
                  onRemove={(id) => {/* 删除历史项 */}}
                />
              ))}
            </div>
          )}
          
          {/* 热门搜索 */}
          {!hasValue && showTrending && trending.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                热门搜索
              </div>
              
              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {trending.map((query, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      className="h-auto py-1 px-2 text-xs"
                      onClick={() => handleTrendingSelect(query)}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* 空状态 */}
          {hasValue && filteredSuggestions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">没有找到相关建议</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 注意：类型已在上面定义时直接导出

export default SearchBox;