import React, { useState, useEffect, useCallback } from 'react';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Star, 
  Tag, 
  User, 
  Target, 
  Award, 
  Clock, 
  TrendingUp, 
  BarChart, 
  Settings, 
  RotateCcw, 
  Check, 
  Plus, 
  Minus, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  SortAsc, 
  SortDesc, 
  Grid, 
  List, 
  Layers, 
  Folder, 
  File, 
  Image, 
  Video, 
  Music, 
  Code, 
  FileText, 
  Link, 
  Globe, 
  Lock, 
  Unlock, 
  Heart, 
  Share, 
  Archive, 
  Trash, 
  Flag, 
  Bell, 
  Mail, 
  Phone, 
  MessageSquare, 
  Home, 
  Building, 
  Store, 
  School, 
  Hospital, 
  Factory, 
  Car, 
  Plane, 
  Ship, 
  Bike,
  Zap
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { Separator } from '../ui/Separator';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Popover } from '../ui/Popover';
import { Tooltip } from '../ui/Tooltip';
import { Accordion } from '../ui/Accordion';

// 过滤器类型枚举
export type FilterType = 
  | 'text' 
  | 'select' 
  | 'multiselect' 
  | 'checkbox' 
  | 'radio' 
  | 'range' 
  | 'date' 
  | 'daterange' 
  | 'boolean' 
  | 'tags' 
  | 'rating' 
  | 'color' 
  | 'location' 
  | 'price' 
  | 'custom';

// 过滤器分组类型
export type FilterGroupType = 
  | 'basic' 
  | 'advanced' 
  | 'custom' 
  | 'quick' 
  | 'saved' 
  | 'recent';

// 过滤器选项接口
export interface FilterOption {
  /** 选项值 */
  value: string | number | boolean;
  /** 选项标签 */
  label: string;
  /** 选项描述 */
  description?: string;
  /** 选项图标 */
  icon?: React.ComponentType<{ className?: string }>;
  /** 选项图片 */
  image?: string;
  /** 选项颜色 */
  color?: string;
  /** 选项数量 */
  count?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否推荐 */
  recommended?: boolean;
  /** 是否热门 */
  popular?: boolean;
  /** 子选项 */
  children?: FilterOption[];
}

// 过滤器配置接口
export interface FilterConfig {
  /** 过滤器ID */
  id: string;
  /** 过滤器名称 */
  name: string;
  /** 过滤器标签 */
  label: string;
  /** 过滤器类型 */
  type: FilterType;
  /** 过滤器分组 */
  group?: FilterGroupType;
  /** 过滤器描述 */
  description?: string;
  /** 过滤器图标 */
  icon?: React.ComponentType<{ className?: string }>;
  /** 过滤器选项 */
  options?: FilterOption[];
  /** 默认值 */
  defaultValue?: any;
  /** 当前值 */
  value?: any;
  /** 占位符 */
  placeholder?: string;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步长 */
  step?: number;
  /** 是否必需 */
  required?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 是否默认展开 */
  defaultExpanded?: boolean;
  /** 是否支持搜索 */
  searchable?: boolean;
  /** 是否支持多选 */
  multiple?: boolean;
  /** 是否支持清除 */
  clearable?: boolean;
  /** 最大选择数量 */
  maxSelections?: number;
  /** 验证函数 */
  validate?: (value: any) => boolean | string;
  /** 格式化函数 */
  format?: (value: any) => string;
  /** 解析函数 */
  parse?: (value: string) => any;
  /** 值变化回调 */
  onChange?: (value: any) => void;
  /** 自定义渲染函数 */
  render?: (props: {
    value: any;
    onChange: (value: any) => void;
    config: FilterConfig;
  }) => React.ReactNode;
}

// 过滤器预设接口
export interface FilterPreset {
  /** 预设ID */
  id: string;
  /** 预设名称 */
  name: string;
  /** 预设标签 */
  label: string;
  /** 预设描述 */
  description?: string;
  /** 预设图标 */
  icon?: React.ComponentType<{ className?: string }>;
  /** 预设值 */
  values: Record<string, any>;
  /** 是否默认 */
  default?: boolean;
  /** 是否收藏 */
  favorited?: boolean;
  /** 创建时间 */
  createdAt?: Date;
  /** 使用次数 */
  usageCount?: number;
}

// FilterPanel 组件属性接口
export interface FilterPanelProps {
  /** 过滤器配置 */
  filters: FilterConfig[];
  /** 过滤器值 */
  values?: Record<string, any>;
  /** 过滤器预设 */
  presets?: FilterPreset[];
  /** 显示模式 */
  mode?: 'panel' | 'sidebar' | 'modal' | 'inline' | 'compact';
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 显示变体 */
  variant?: 'default' | 'outlined' | 'filled' | 'minimal';
  /** 布局方向 */
  layout?: 'vertical' | 'horizontal' | 'grid';
  /** 网格列数 */
  columns?: number;
  /** 是否显示标题 */
  showTitle?: boolean;
  /** 标题文本 */
  title?: string;
  /** 是否显示搜索 */
  showSearch?: boolean;
  /** 是否显示预设 */
  showPresets?: boolean;
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 是否显示应用按钮 */
  showApply?: boolean;
  /** 是否显示计数 */
  showCount?: boolean;
  /** 是否显示分组 */
  showGroups?: boolean;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 是否默认展开 */
  defaultExpanded?: boolean;
  /** 是否自动应用 */
  autoApply?: boolean;
  /** 应用延迟（毫秒） */
  applyDelay?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 结果数量 */
  resultCount?: number;
  /** 值变化回调 */
  onChange?: (values: Record<string, any>) => void;
  /** 应用回调 */
  onApply?: (values: Record<string, any>) => void;
  /** 重置回调 */
  onReset?: () => void;
  /** 预设选择回调 */
  onPresetSelect?: (preset: FilterPreset) => void;
  /** 预设保存回调 */
  onPresetSave?: (name: string, values: Record<string, any>) => void;
  /** 预设删除回调 */
  onPresetDelete?: (presetId: string) => void;
  /** 搜索回调 */
  onSearch?: (query: string) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 过滤器分组配置
const filterGroupConfig = {
  basic: { label: '基础筛选', icon: Filter },
  advanced: { label: '高级筛选', icon: Settings },
  custom: { label: '自定义', icon: Layers },
  quick: { label: '快速筛选', icon: Zap },
  saved: { label: '已保存', icon: Heart },
  recent: { label: '最近使用', icon: Clock }
};

// 过滤器类型图标配置
const filterTypeIcons = {
  text: Search,
  select: List,
  multiselect: Grid,
  checkbox: Check,
  radio: Target,
  range: BarChart,
  date: Calendar,
  daterange: Calendar,
  boolean: Settings,
  tags: Tag,
  rating: Star,
  color: Eye,
  location: MapPin,
  price: DollarSign,
  custom: Layers
};

// 尺寸配置
const sizeConfig = {
  sm: {
    container: 'text-sm',
    title: 'text-base font-medium',
    label: 'text-xs font-medium',
    input: 'h-8 text-sm',
    button: 'h-8 px-3 text-sm',
    badge: 'text-xs px-1.5 py-0.5',
    icon: 'w-3 h-3',
    spacing: 'space-y-3'
  },
  default: {
    container: 'text-sm',
    title: 'text-lg font-semibold',
    label: 'text-sm font-medium',
    input: 'h-10 text-sm',
    button: 'h-10 px-4 text-sm',
    badge: 'text-xs px-2 py-1',
    icon: 'w-4 h-4',
    spacing: 'space-y-4'
  },
  lg: {
    container: 'text-base',
    title: 'text-xl font-semibold',
    label: 'text-base font-medium',
    input: 'h-12 text-base',
    button: 'h-12 px-6 text-base',
    badge: 'text-sm px-2.5 py-1',
    icon: 'w-5 h-5',
    spacing: 'space-y-5'
  }
};

// 格式化数值
const formatValue = (value: any, config: FilterConfig): string => {
  if (config.format) {
    return config.format(value);
  }
  
  if (value === null || value === undefined) {
    return '';
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 ? `${value.length} 项` : '无';
  }
  
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  
  if (typeof value === 'number') {
    if (config.type === 'price') {
      return `¥${value.toLocaleString()}`;
    }
    if (config.type === 'rating') {
      return `${value} 星`;
    }
    return value.toString();
  }
  
  return String(value);
};

// 验证值
const validateValue = (value: any, config: FilterConfig): boolean | string => {
  if (config.validate) {
    return config.validate(value);
  }
  
  if (config.required && (value === null || value === undefined || value === '')) {
    return `${config.label}是必需的`;
  }
  
  if (config.type === 'range' && Array.isArray(value)) {
    const [min, max] = value;
    if (config.min !== undefined && min < config.min) {
      return `最小值不能小于 ${config.min}`;
    }
    if (config.max !== undefined && max > config.max) {
      return `最大值不能大于 ${config.max}`;
    }
  }
  
  if (config.multiple && Array.isArray(value) && config.maxSelections) {
    if (value.length > config.maxSelections) {
      return `最多只能选择 ${config.maxSelections} 项`;
    }
  }
  
  return true;
};

// 过滤器项组件
const FilterItem: React.FC<{
  config: FilterConfig;
  value: any;
  size: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  onChange: (value: any) => void;
}> = ({ config, value, size, disabled, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded ?? true);
  
  const sizeStyles = sizeConfig[size];
  const IconComponent = config.icon || filterTypeIcons[config.type];
  
  // 过滤选项
  const filteredOptions = config.options?.filter(option => 
    !searchQuery || 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // 渲染文本输入
  const renderTextInput = () => (
    <Input
      value={value || ''}
      placeholder={config.placeholder}
      disabled={disabled || config.disabled}
      className={sizeStyles.input}
      onChange={(e) => onChange(e.target.value)}
    />
  );
  
  // 渲染选择器
  const renderSelect = () => (
    <div className="space-y-2">
      {config.searchable && filteredOptions.length > 5 && (
        <Input
          value={searchQuery}
          placeholder="搜索选项..."
          disabled={disabled || config.disabled}
          className={sizeStyles.input}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}
      
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filteredOptions.map((option) => {
          const isSelected = config.multiple 
            ? Array.isArray(value) && value.includes(option.value)
            : value === option.value;
          
          return (
            <div
              key={String(option.value)}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
                isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => {
                if (option.disabled || disabled || config.disabled) return;
                
                if (config.multiple) {
                  const currentValue = Array.isArray(value) ? value : [];
                  const newValue = isSelected
                    ? currentValue.filter(v => v !== option.value)
                    : [...currentValue, option.value];
                  onChange(newValue);
                } else {
                  onChange(option.value);
                }
              }}
            >
              {config.multiple ? (
                <Checkbox
                  checked={isSelected}
                  disabled={option.disabled || disabled || config.disabled}
                  onChange={() => {}} // 由父级处理
                />
              ) : (
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 transition-colors',
                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                )}>
                  {isSelected && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
              )}
              
              {option.icon && (
                <option.icon className={cn('text-gray-500', sizeStyles.icon)} />
              )}
              
              {option.image && (
                <img 
                  src={option.image} 
                  alt={option.label}
                  className={cn('rounded object-cover', sizeStyles.icon)}
                />
              )}
              
              {option.color && (
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: option.color }}
                />
              )}
              
              <div className="flex-1 min-w-0">
                <div className={cn('font-medium truncate', sizeStyles.container)}>
                  {option.label}
                  {option.recommended && (
                    <Badge variant="outline" className={cn('ml-2', sizeStyles.badge)}>
                      推荐
                    </Badge>
                  )}
                  {option.popular && (
                    <Badge variant="outline" className={cn('ml-2 text-orange-600', sizeStyles.badge)}>
                      热门
                    </Badge>
                  )}
                </div>
                
                {option.description && (
                  <div className={cn('text-muted-foreground truncate', 
                    size === 'sm' ? 'text-xs' : 'text-sm'
                  )}>
                    {option.description}
                  </div>
                )}
              </div>
              
              {option.count !== undefined && (
                <Badge variant="outline" className={sizeStyles.badge}>
                  {option.count}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
  
  // 渲染范围滑块
  const renderRange = () => {
    const currentValue = Array.isArray(value) ? value : [config.min || 0, config.max || 100];
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatValue(currentValue[0], config)}</span>
          <span>{formatValue(currentValue[1], config)}</span>
        </div>
        
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">最小值</div>
          <Slider
            value={currentValue[0]}
            min={config.min}
            max={currentValue[1]}
            step={config.step}
            disabled={disabled || config.disabled}
            onChange={(newMin) => onChange([newMin, currentValue[1]])}
          />
          
          <div className="text-xs text-muted-foreground">最大值</div>
          <Slider
            value={currentValue[1]}
            min={currentValue[0]}
            max={config.max}
            step={config.step}
            disabled={disabled || config.disabled}
            onChange={(newMax) => onChange([currentValue[0], newMax])}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{config.min}</span>
          <span>{config.max}</span>
        </div>
      </div>
    );
  };
  
  // 渲染日期输入
  const renderDate = () => (
    <Input
      type={config.type === 'daterange' ? 'date' : 'date'}
      value={value || ''}
      disabled={disabled || config.disabled}
      className={sizeStyles.input}
      onChange={(e) => onChange(e.target.value)}
    />
  );
  
  // 渲染布尔开关
  const renderBoolean = () => (
    <div className="flex items-center justify-between">
      <span className={sizeStyles.container}>{config.label}</span>
      <Switch
        checked={Boolean(value)}
        disabled={disabled || config.disabled}
        onChange={onChange}
      />
    </div>
  );
  
  // 渲染标签输入
  const renderTags = () => {
    const tags = Array.isArray(value) ? value : [];
    const [inputValue, setInputValue] = useState('');
    
    const addTag = (tag: string) => {
      if (tag.trim() && !tags.includes(tag.trim())) {
        onChange([...tags, tag.trim()]);
        setInputValue('');
      }
    };
    
    const removeTag = (tagToRemove: string) => {
      onChange(tags.filter(tag => tag !== tagToRemove));
    };
    
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className={cn('flex items-center gap-1', sizeStyles.badge)}
            >
              {tag}
              <Button
                size="sm"
                variant="ghost"
                className="h-auto w-auto p-0 hover:bg-transparent"
                onClick={() => removeTag(tag)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
        
        <Input
          value={inputValue}
          placeholder={config.placeholder || '输入标签后按回车'}
          disabled={disabled || config.disabled}
          className={sizeStyles.input}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(inputValue);
            }
          }}
        />
      </div>
    );
  };
  
  // 渲染评分
  const renderRating = () => {
    const rating = Number(value) || 0;
    const maxRating = config.max || 5;
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= rating;
          
          return (
            <button
              key={index}
              type="button"
              disabled={disabled || config.disabled}
              className={cn(
                'transition-colors',
                disabled || config.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
              )}
              onClick={() => onChange(starValue)}
            >
              <Star 
                className={cn(
                  sizeStyles.icon,
                  isFilled ? 'text-yellow-500 fill-current' : 'text-gray-300'
                )}
              />
            </button>
          );
        })}
        
        <span className={cn('ml-2 text-muted-foreground', sizeStyles.container)}>
          {rating} / {maxRating}
        </span>
      </div>
    );
  };
  
  // 渲染自定义组件
  const renderCustom = () => {
    if (config.render) {
      return config.render({ value, onChange, config });
    }
    return null;
  };
  
  // 渲染过滤器内容
  const renderFilterContent = () => {
    switch (config.type) {
      case 'text':
        return renderTextInput();
      case 'select':
      case 'multiselect':
      case 'checkbox':
      case 'radio':
        return renderSelect();
      case 'range':
        return renderRange();
      case 'date':
      case 'daterange':
        return renderDate();
      case 'boolean':
        return renderBoolean();
      case 'tags':
        return renderTags();
      case 'rating':
        return renderRating();
      case 'custom':
        return renderCustom();
      default:
        return renderTextInput();
    }
  };
  
  if (config.hidden) {
    return null;
  }
  
  const hasError = validateValue(value, config) !== true;
  
  return (
    <div className={cn('space-y-2', disabled && 'opacity-50')}>
      {config.type !== 'boolean' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {IconComponent && (
              <IconComponent className={cn('text-gray-500', sizeStyles.icon)} />
            )}
            
            <label className={cn(sizeStyles.label, hasError && 'text-red-600')}>
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          
          {config.collapsible && (
            <Button
              size="sm"
              variant="ghost"
              className="h-auto w-auto p-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className={sizeStyles.icon} />
              ) : (
                <ChevronDown className={sizeStyles.icon} />
              )}
            </Button>
          )}
          
          {config.clearable && value && (
            <Button
              size="sm"
              variant="ghost"
              className="h-auto w-auto p-1"
              onClick={() => onChange(config.multiple ? [] : null)}
            >
              <X className={sizeStyles.icon} />
            </Button>
          )}
        </div>
      )}
      
      {config.description && (
        <div className={cn('text-muted-foreground', 
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {config.description}
        </div>
      )}
      
      {(!config.collapsible || isExpanded) && (
        <div className={cn(hasError && 'border border-red-200 rounded-md p-2')}>
          {renderFilterContent()}
        </div>
      )}
      
      {hasError && typeof validateValue(value, config) === 'string' && (
        <div className={cn('text-red-600 flex items-center gap-1', 
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          <X className="w-3 h-3" />
          {validateValue(value, config)}
        </div>
      )}
    </div>
  );
};

/**
 * FilterPanel 过滤面板组件
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values = {},
  presets = [],
  mode = 'panel',
  size = 'default',
  variant = 'default',
  layout = 'vertical',
  columns = 1,
  showTitle = true,
  title = '筛选条件',
  showSearch = false,
  showPresets = false,
  showReset = true,
  showApply = true,
  showCount = false,
  showGroups = true,
  collapsible = false,
  defaultExpanded = true,
  autoApply = false,
  applyDelay = 300,
  disabled = false,
  loading = false,
  error,
  resultCount,
  onChange,
  onApply,
  onReset,
  onPresetSelect,
  onPresetSave,
  onPresetDelete,
  onSearch,
  className
}) => {
  const [localValues, setLocalValues] = useState(values);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [applyTimeout, setApplyTimeout] = useState<NodeJS.Timeout>();
  
  const sizeStyles = sizeConfig[size];
  
  // 同步外部值
  useEffect(() => {
    setLocalValues(values);
  }, [values]);
  
  // 自动应用
  useEffect(() => {
    if (autoApply && onChange) {
      if (applyTimeout) {
        clearTimeout(applyTimeout);
      }
      
      const timeout = setTimeout(() => {
        onChange(localValues);
      }, applyDelay);
      
      setApplyTimeout(timeout);
    }
    
    return () => {
      if (applyTimeout) {
        clearTimeout(applyTimeout);
      }
    };
  }, [localValues, autoApply, applyDelay, onChange]);
  
  // 处理值变化
  const handleValueChange = (filterId: string, value: any) => {
    const newValues = { ...localValues, [filterId]: value };
    setLocalValues(newValues);
    
    if (!autoApply) {
      onChange?.(newValues);
    }
  };
  
  // 处理重置
  const handleReset = () => {
    const resetValues: Record<string, any> = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        resetValues[filter.id] = filter.defaultValue;
      }
    });
    
    setLocalValues(resetValues);
    onChange?.(resetValues);
    onReset?.();
  };
  
  // 处理应用
  const handleApply = () => {
    onApply?.(localValues);
  };
  
  // 处理预设选择
  const handlePresetSelect = (preset: FilterPreset) => {
    setLocalValues(preset.values);
    onChange?.(preset.values);
    onPresetSelect?.(preset);
  };
  
  // 过滤器分组
  const groupedFilters = filters.reduce((groups, filter) => {
    const group = filter.group || 'basic';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(filter);
    return groups;
  }, {} as Record<string, FilterConfig[]>);
  
  // 过滤搜索
  const filteredFilters = filters.filter(filter => 
    !searchQuery || 
    filter.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    filter.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // 活跃过滤器数量
  const activeFilterCount = Object.keys(localValues).filter(key => {
    const value = localValues[key];
    return value !== null && value !== undefined && value !== '' && 
           (!Array.isArray(value) || value.length > 0);
  }).length;
  
  // 获取容器样式
  const getContainerStyles = () => {
    const baseStyles = cn(
      'bg-white border rounded-lg',
      sizeStyles.spacing,
      disabled && 'opacity-50 pointer-events-none'
    );
    
    switch (variant) {
      case 'outlined':
        return cn(baseStyles, 'border-gray-300');
      case 'filled':
        return cn(baseStyles, 'bg-gray-50 border-gray-200');
      case 'minimal':
        return cn(baseStyles, 'border-transparent shadow-none');
      default:
        return cn(baseStyles, 'border-gray-200 shadow-sm');
    }
  };
  
  // 获取布局样式
  const getLayoutStyles = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-4';
      case 'grid':
        return `grid gap-4 grid-cols-${columns}`;
      default:
        return sizeStyles.spacing;
    }
  };
  
  const containerContent = (
    <div className={cn(getContainerStyles(), className)}>
      {/* 标题栏 */}
      {showTitle && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Filter className={sizeStyles.icon} />
            <h3 className={sizeStyles.title}>{title}</h3>
            
            {showCount && activeFilterCount > 0 && (
              <Badge variant="outline" className={sizeStyles.badge}>
                {activeFilterCount}
              </Badge>
            )}
            
            {resultCount !== undefined && (
              <Badge variant="outline" className={sizeStyles.badge}>
                {resultCount} 个结果
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {collapsible && (
              <Button
                size={size}
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className={sizeStyles.icon} />
                ) : (
                  <ChevronDown className={sizeStyles.icon} />
                )}
              </Button>
            )}
          </div>
        </div>
      )}
      
      {(!collapsible || isExpanded) && (
        <div className="p-4 space-y-4">
          {/* 搜索框 */}
          {showSearch && (
            <Input
              value={searchQuery}
              placeholder="搜索过滤器..."
              disabled={disabled}
              className={sizeStyles.input}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
            />
          )}
          
          {/* 预设 */}
          {showPresets && presets.length > 0 && (
            <div className="space-y-2">
              <div className={sizeStyles.label}>快速预设</div>
              
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    size={size}
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.icon && (
                      <preset.icon className={sizeStyles.icon} />
                    )}
                    {preset.label}
                    
                    {preset.favorited && (
                      <Heart className={cn('text-red-500 fill-current', sizeStyles.icon)} />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* 错误信息 */}
          {error && (
            <div className={cn('text-red-600 flex items-center gap-2', sizeStyles.container)}>
              <X className={sizeStyles.icon} />
              {error}
            </div>
          )}
          
          {/* 过滤器 */}
          {showGroups ? (
            <Accordion
              type="multiple"
              defaultValue={Object.keys(groupedFilters)}
              className={getLayoutStyles()}
            >
              {Object.entries(groupedFilters).map(([groupKey, groupFilters]) => {
                const groupConfig = filterGroupConfig[groupKey as FilterGroupType];
                
                return (
                  <div key={groupKey} className="border rounded-lg">
                    <div className="flex items-center gap-2 p-3 border-b bg-gray-50">
                      {groupConfig?.icon && (
                        <groupConfig.icon className={sizeStyles.icon} />
                      )}
                      <span className={sizeStyles.label}>
                        {groupConfig?.label || groupKey}
                      </span>
                      
                      <Badge variant="outline" className={sizeStyles.badge}>
                        {groupFilters.length}
                      </Badge>
                    </div>
                    
                    <div className={cn('p-3', getLayoutStyles())}>
                      {groupFilters
                        .filter(filter => 
                          !searchQuery || 
                          filteredFilters.includes(filter)
                        )
                        .map((filter) => (
                          <FilterItem
                            key={filter.id}
                            config={filter}
                            value={localValues[filter.id]}
                            size={size}
                            disabled={disabled || loading}
                            onChange={(value) => handleValueChange(filter.id, value)}
                          />
                        ))
                      }
                    </div>
                  </div>
                );
              })}
            </Accordion>
          ) : (
            <div className={getLayoutStyles()}>
              {filteredFilters.map((filter) => (
                <FilterItem
                  key={filter.id}
                  config={filter}
                  value={localValues[filter.id]}
                  size={size}
                  disabled={disabled || loading}
                  onChange={(value) => handleValueChange(filter.id, value)}
                />
              ))}
            </div>
          )}
          
          {/* 操作按钮 */}
          {(showReset || showApply) && (
            <>
              <Separator />
              
              <div className="flex items-center justify-between gap-2">
                {showReset && (
                  <Button
                    size={size}
                    variant="outline"
                    disabled={disabled || loading || activeFilterCount === 0}
                    onClick={handleReset}
                  >
                    <RotateCcw className={cn('mr-2', sizeStyles.icon)} />
                    重置
                  </Button>
                )}
                
                {showApply && !autoApply && (
                  <Button
                    size={size}
                    disabled={disabled || loading}
                    onClick={handleApply}
                  >
                    {loading ? (
                      <div className={cn('animate-spin rounded-full border-2 border-white border-t-transparent mr-2', sizeStyles.icon)} />
                    ) : (
                      <Check className={cn('mr-2', sizeStyles.icon)} />
                    )}
                    应用筛选
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
  
  // 根据模式返回不同的容器
  switch (mode) {
    case 'sidebar':
      return (
        <div className={cn('w-80 h-full overflow-y-auto', className)}>
          {containerContent}
        </div>
      );
    
    case 'modal':
      return (
        <div className={cn('w-full max-w-2xl max-h-[80vh] overflow-y-auto', className)}>
          {containerContent}
        </div>
      );
    
    case 'inline':
      return (
        <div className={cn('w-full', className)}>
          {containerContent}
        </div>
      );
    
    case 'compact':
      return (
        <Popover
          trigger={
            <Button size={size} variant="outline" className="flex items-center gap-2">
              <Filter className={sizeStyles.icon} />
              筛选
              {activeFilterCount > 0 && (
                <Badge variant="destructive" className={sizeStyles.badge}>
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          }
          content={containerContent}
        />
      );
    
    default:
      return containerContent;
  }
};



export default FilterPanel;