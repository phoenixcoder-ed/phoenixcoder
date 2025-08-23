import React, { useState, useEffect } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  Star, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Hash, 
  Type, 
  Clock, 
  Eye, 
  Heart, 
  MessageSquare, 
  Users, 
  Award, 
  Target, 
  Zap, 
  BarChart, 
  Activity, 
  Bookmark, 
  Flag, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Plus, 
  Minus, 
  Equal, 
  Percent, 
  Hash as HashIcon, 
  AtSign, 
  Globe, 
  MapPin, 
  Building, 
  User, 
  Tag, 
  Folder, 
  File, 
  Image, 
  Video, 
  Music, 
  Code, 
  FileText, 
  Link, 
  Mail, 
  Phone, 
  Settings, 
  Filter, 
  Search, 
  Grid, 
  List, 
  Layers, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Popover } from '../ui/Popover';
import { Tooltip } from '../ui/Tooltip';
import { Separator } from '../ui/Separator';

// 排序方向枚举
export type SortDirection = 'asc' | 'desc';

// 排序字段类型
export type SortFieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'rating' 
  | 'price' 
  | 'percentage' 
  | 'count' 
  | 'duration' 
  | 'size' 
  | 'priority' 
  | 'status' 
  | 'custom';

// 排序字段接口
export interface SortField {
  /** 字段ID */
  id: string;
  /** 字段名称 */
  name: string;
  /** 字段标签 */
  label: string;
  /** 字段类型 */
  type: SortFieldType;
  /** 字段描述 */
  description?: string;
  /** 字段图标 */
  icon?: React.ComponentType<{ className?: string }>;
  /** 默认排序方向 */
  defaultDirection?: SortDirection;
  /** 是否支持排序 */
  sortable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 是否推荐 */
  recommended?: boolean;
  /** 是否热门 */
  popular?: boolean;
  /** 排序权重 */
  weight?: number;
  /** 分组 */
  group?: string;
  /** 格式化函数 */
  format?: (value: any) => string;
  /** 比较函数 */
  compare?: (a: any, b: any, direction: SortDirection) => number;
}

// 排序选项接口
export interface SortOption {
  /** 字段ID */
  field: string;
  /** 排序方向 */
  direction: SortDirection;
  /** 排序权重 */
  weight?: number;
}

// 排序预设接口
export interface SortPreset {
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
  /** 排序选项 */
  options: SortOption[];
  /** 是否默认 */
  default?: boolean;
  /** 是否收藏 */
  favorited?: boolean;
  /** 创建时间 */
  createdAt?: Date;
  /** 使用次数 */
  usageCount?: number;
}

// SortSelector 组件属性接口
export interface SortSelectorProps {
  /** 排序字段 */
  fields: SortField[];
  /** 当前排序选项 */
  value?: SortOption[];
  /** 排序预设 */
  presets?: SortPreset[];
  /** 显示模式 */
  mode?: 'dropdown' | 'buttons' | 'tabs' | 'list' | 'compact';
  /** 显示尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 显示变体 */
  variant?: 'default' | 'outline' | 'ghost' | 'minimal';
  /** 布局方向 */
  layout?: 'horizontal' | 'vertical';
  /** 是否支持多字段排序 */
  multiple?: boolean;
  /** 最大排序字段数 */
  maxFields?: number;
  /** 是否显示方向 */
  showDirection?: boolean;
  /** 是否显示图标 */
  showIcons?: boolean;
  /** 是否显示标签 */
  showLabels?: boolean;
  /** 是否显示描述 */
  showDescription?: boolean;
  /** 是否显示预设 */
  showPresets?: boolean;
  /** 是否显示清除按钮 */
  showClear?: boolean;
  /** 是否显示应用按钮 */
  showApply?: boolean;
  /** 是否显示分组 */
  showGroups?: boolean;
  /** 是否自动应用 */
  autoApply?: boolean;
  /** 应用延迟（毫秒） */
  applyDelay?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 错误信息 */
  error?: string;
  /** 值变化回调 */
  onChange?: (value: SortOption[]) => void;
  /** 应用回调 */
  onApply?: (value: SortOption[]) => void;
  /** 清除回调 */
  onClear?: () => void;
  /** 预设选择回调 */
  onPresetSelect?: (preset: SortPreset) => void;
  /** 预设保存回调 */
  onPresetSave?: (name: string, options: SortOption[]) => void;
  /** 预设删除回调 */
  onPresetDelete?: (presetId: string) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 排序字段类型图标配置
const sortFieldTypeIcons = {
  text: Type,
  number: Hash,
  date: Calendar,
  boolean: CheckCircle,
  rating: Star,
  price: DollarSign,
  percentage: Percent,
  count: HashIcon,
  duration: Clock,
  size: BarChart,
  priority: Flag,
  status: AlertCircle,
  custom: Settings
};

// 排序方向图标配置
const sortDirectionIcons = {
  asc: { icon: ArrowUp, label: '升序' },
  desc: { icon: ArrowDown, label: '降序' }
};

// 尺寸配置
const sizeConfig = {
  sm: {
    container: 'text-sm',
    button: 'h-8 px-3 text-sm',
    badge: 'text-xs px-1.5 py-0.5',
    icon: 'w-3 h-3',
    spacing: 'space-y-2 space-x-2'
  },
  default: {
    container: 'text-sm',
    button: 'h-10 px-4 text-sm',
    badge: 'text-xs px-2 py-1',
    icon: 'w-4 h-4',
    spacing: 'space-y-3 space-x-3'
  },
  lg: {
    container: 'text-base',
    button: 'h-12 px-6 text-base',
    badge: 'text-sm px-2.5 py-1',
    icon: 'w-5 h-5',
    spacing: 'space-y-4 space-x-4'
  }
};

// 格式化排序选项
const formatSortOption = (option: SortOption, fields: SortField[]): string => {
  const field = fields.find(f => f.id === option.field);
  if (!field) return '';
  
  const directionLabel = sortDirectionIcons[option.direction].label;
  return `${field.label} (${directionLabel})`;
};

// 获取字段图标
const getFieldIcon = (field: SortField) => {
  return field.icon || sortFieldTypeIcons[field.type] || Type;
};

// 排序字段项组件
const SortFieldItem: React.FC<{
  field: SortField;
  selected?: boolean;
  direction?: SortDirection;
  weight?: number;
  size: 'sm' | 'default' | 'lg';
  showDirection?: boolean;
  showIcons?: boolean;
  showLabels?: boolean;
  showDescription?: boolean;
  disabled?: boolean;
  onClick?: (field: SortField, direction: SortDirection) => void;
  onRemove?: () => void;
}> = ({ 
  field, 
  selected, 
  direction = 'asc', 
  weight, 
  size, 
  showDirection = true, 
  showIcons = true, 
  showLabels = true, 
  showDescription = false,
  disabled,
  onClick,
  onRemove
}) => {
  const sizeStyles = sizeConfig[size];
  const IconComponent = getFieldIcon(field);
  const DirectionIcon = sortDirectionIcons[direction].icon;
  
  return (
    <div className={cn(
      'flex items-center gap-2 p-2 rounded-md transition-colors',
      selected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50',
      disabled && 'opacity-50 cursor-not-allowed',
      !disabled && 'cursor-pointer'
    )}>
      {showIcons && (
        <IconComponent className={cn('text-gray-500', sizeStyles.icon)} />
      )}
      
      <div className="flex-1 min-w-0">
        {showLabels && (
          <div className={cn('font-medium truncate', sizeStyles.container)}>
            {field.label}
            
            {field.recommended && (
              <Badge variant="outline" className={cn('ml-2', sizeStyles.badge)}>
                推荐
              </Badge>
            )}
            
            {field.popular && (
              <Badge variant="outline" className={cn('ml-2 text-orange-600', sizeStyles.badge)}>
                热门
              </Badge>
            )}
          </div>
        )}
        
        {showDescription && field.description && (
          <div className={cn('text-muted-foreground truncate', 
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
            {field.description}
          </div>
        )}
      </div>
      
      {weight !== undefined && (
        <Badge variant="outline" className={sizeStyles.badge}>
          {weight}
        </Badge>
      )}
      
      {selected && showDirection && (
        <Button
          size="sm"
          variant="ghost"
          className="h-auto w-auto p-1"
          onClick={(e) => {
            e.stopPropagation();
            const newDirection = direction === 'asc' ? 'desc' : 'asc';
            onClick?.(field, newDirection);
          }}
        >
          <DirectionIcon className={sizeStyles.icon} />
        </Button>
      )}
      
      {selected && onRemove && (
        <Button
          size="sm"
          variant="ghost"
          className="h-auto w-auto p-1"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className={sizeStyles.icon} />
        </Button>
      )}
    </div>
  );
};

/**
 * SortSelector 排序选择器组件
 */
export const SortSelector: React.FC<SortSelectorProps> = ({
  fields,
  value = [],
  presets = [],
  mode = 'dropdown',
  size = 'default',
  variant = 'default',
  layout = 'horizontal',
  multiple = false,
  maxFields = 3,
  showDirection = true,
  showIcons = true,
  showLabels = true,
  showDescription = false,
  showPresets = false,
  showClear = true,
  showApply = false,
  showGroups = false,
  autoApply = true,
  applyDelay = 300,
  disabled = false,
  loading = false,
  placeholder = '选择排序方式',
  error,
  onChange,
  onApply,
  onClear,
  onPresetSelect,
  onPresetSave,
  onPresetDelete,
  className
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [applyTimeout, setApplyTimeout] = useState<NodeJS.Timeout | number>();
  
  const sizeStyles = sizeConfig[size];
  
  // 同步外部值
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // 自动应用
  useEffect(() => {
    if (autoApply && onChange) {
      if (applyTimeout) {
        clearTimeout(applyTimeout);
      }
      
      const timeout = setTimeout(() => {
        onChange(localValue);
      }, applyDelay);
      
      setApplyTimeout(timeout);
    }
    
    return () => {
      if (applyTimeout) {
        clearTimeout(applyTimeout);
      }
    };
  }, [localValue, autoApply, applyDelay, onChange]);
  
  // 处理字段选择
  const handleFieldSelect = (field: SortField, direction: SortDirection = field.defaultDirection || 'asc') => {
    if (field.disabled || disabled) return;
    
    let newValue: SortOption[];
    
    if (multiple) {
      const existingIndex = localValue.findIndex(option => option.field === field.id);
      
      if (existingIndex >= 0) {
        // 更新现有字段的方向
        newValue = localValue.map((option, index) => 
          index === existingIndex 
            ? { ...option, direction }
            : option
        );
      } else {
        // 添加新字段
        if (localValue.length >= maxFields) {
          // 移除最后一个字段
          newValue = [
            ...localValue.slice(0, maxFields - 1),
            { field: field.id, direction, weight: localValue.length + 1 }
          ];
        } else {
          newValue = [
            ...localValue,
            { field: field.id, direction, weight: localValue.length + 1 }
          ];
        }
      }
    } else {
      newValue = [{ field: field.id, direction }];
    }
    
    setLocalValue(newValue);
    
    if (!autoApply) {
      onChange?.(newValue);
    }
  };
  
  // 处理字段移除
  const handleFieldRemove = (fieldId: string) => {
    const newValue = localValue.filter(option => option.field !== fieldId);
    setLocalValue(newValue);
    
    if (!autoApply) {
      onChange?.(newValue);
    }
  };
  
  // 处理清除
  const handleClear = () => {
    setLocalValue([]);
    onChange?.([]);
    onClear?.();
  };
  
  // 处理应用
  const handleApply = () => {
    onApply?.(localValue);
  };
  
  // 处理预设选择
  const handlePresetSelect = (preset: SortPreset) => {
    setLocalValue(preset.options);
    onChange?.(preset.options);
    onPresetSelect?.(preset);
    setIsOpen(false);
  };
  
  // 获取选中的字段
  const selectedFields = localValue.map(option => {
    const field = fields.find(f => f.id === option.field);
    return field ? { field, option } : null;
  }).filter(Boolean) as { field: SortField; option: SortOption }[];
  
  // 获取可用字段
  const availableFields = fields.filter(field => 
    !field.hidden && 
    field.sortable !== false &&
    (!multiple || !localValue.some(option => option.field === field.id))
  );
  
  // 字段分组
  const groupedFields = availableFields.reduce((groups, field) => {
    const group = field.group || '默认';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(field);
    return groups;
  }, {} as Record<string, SortField[]>);
  
  // 获取显示文本
  const getDisplayText = () => {
    if (localValue.length === 0) {
      return placeholder;
    }
    
    if (localValue.length === 1) {
      return formatSortOption(localValue[0], fields);
    }
    
    return `${localValue.length} 个排序条件`;
  };
  
  // 渲染按钮模式
  const renderButtonMode = () => (
    <div className={cn(
      'flex flex-wrap gap-2',
      layout === 'vertical' && 'flex-col',
      className
    )}>
      {availableFields.map((field) => {
        const selected = localValue.some(option => option.field === field.id);
        const option = localValue.find(option => option.field === field.id);
        const IconComponent = getFieldIcon(field);
        
        return (
          <Button
            key={field.id}
            size={size}
            variant={selected ? 'default' : variant}
            disabled={disabled || field.disabled}
            className="flex items-center gap-2"
            onClick={() => {
              if (selected && option) {
                const newDirection = option.direction === 'asc' ? 'desc' : 'asc';
                handleFieldSelect(field, newDirection);
              } else {
                handleFieldSelect(field);
              }
            }}
          >
            {showIcons && (
              <IconComponent className={sizeStyles.icon} />
            )}
            
            {showLabels && field.label}
            
            {selected && showDirection && option && (
              <>
                <Separator orientation="vertical" className="h-4" />
                {React.createElement(sortDirectionIcons[option.direction].icon, {
                  className: sizeStyles.icon
                })}
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
  
  // 渲染标签模式
  const renderTabMode = () => (
    <div className={cn(
      'flex border-b',
      layout === 'vertical' && 'flex-col border-b-0 border-r',
      className
    )}>
      {availableFields.map((field) => {
        const selected = localValue.some(option => option.field === field.id);
        const option = localValue.find(option => option.field === field.id);
        const IconComponent = getFieldIcon(field);
        
        return (
          <button
            key={field.id}
            disabled={disabled || field.disabled}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors',
              selected 
                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                : 'border-transparent hover:text-gray-700 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed',
              sizeStyles.container
            )}
            onClick={() => {
              if (selected && option) {
                const newDirection = option.direction === 'asc' ? 'desc' : 'asc';
                handleFieldSelect(field, newDirection);
              } else {
                handleFieldSelect(field);
              }
            }}
          >
            {showIcons && (
              <IconComponent className={sizeStyles.icon} />
            )}
            
            {showLabels && field.label}
            
            {selected && showDirection && option && (
              React.createElement(sortDirectionIcons[option.direction].icon, {
                className: cn('ml-1', sizeStyles.icon)
              })
            )}
          </button>
        );
      })}
    </div>
  );
  
  // 渲染列表模式
  const renderListMode = () => (
    <div className={cn('space-y-2', className)}>
      {/* 已选择的字段 */}
      {selectedFields.length > 0 && (
        <div className="space-y-2">
          <div className={cn('font-medium', sizeStyles.container)}>已选择的排序</div>
          
          {selectedFields.map(({ field, option }, index) => (
            <SortFieldItem
              key={field.id}
              field={field}
              selected
              direction={option.direction}
              weight={option.weight || index + 1}
              size={size}
              showDirection={showDirection}
              showIcons={showIcons}
              showLabels={showLabels}
              showDescription={showDescription}
              disabled={disabled}
              onClick={handleFieldSelect}
              onRemove={() => handleFieldRemove(field.id)}
            />
          ))}
        </div>
      )}
      
      {/* 可用字段 */}
      {availableFields.length > 0 && (
        <div className="space-y-2">
          <div className={cn('font-medium', sizeStyles.container)}>可用字段</div>
          
          {showGroups ? (
            Object.entries(groupedFields).map(([groupName, groupFields]) => (
              <div key={groupName} className="space-y-1">
                <div className={cn('text-muted-foreground font-medium', 
                  size === 'sm' ? 'text-xs' : 'text-sm'
                )}>
                  {groupName}
                </div>
                
                {groupFields.map((field) => (
                  <SortFieldItem
                    key={field.id}
                    field={field}
                    size={size}
                    showDirection={false}
                    showIcons={showIcons}
                    showLabels={showLabels}
                    showDescription={showDescription}
                    disabled={disabled}
                    onClick={handleFieldSelect}
                  />
                ))}
              </div>
            ))
          ) : (
            availableFields.map((field) => (
              <SortFieldItem
                key={field.id}
                field={field}
                size={size}
                showDirection={false}
                showIcons={showIcons}
                showLabels={showLabels}
                showDescription={showDescription}
                disabled={disabled}
                onClick={handleFieldSelect}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
  
  // 渲染紧凑模式
  const renderCompactMode = () => (
    <div className={cn('flex items-center gap-2', className)}>
      {selectedFields.map(({ field, option }, index) => {
        const IconComponent = getFieldIcon(field);
        const DirectionIcon = sortDirectionIcons[option.direction].icon;
        
        return (
          <Badge
            key={field.id}
            variant="outline"
            className={cn('flex items-center gap-1', sizeStyles.badge)}
          >
            {showIcons && (
              <IconComponent className={sizeStyles.icon} />
            )}
            
            {showLabels && field.label}
            
            {showDirection && (
              <DirectionIcon className={sizeStyles.icon} />
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="h-auto w-auto p-0 hover:bg-transparent"
              onClick={() => handleFieldRemove(field.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        );
      })}
      
      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={
          <Button
            size={size}
            variant="outline"
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Plus className={sizeStyles.icon} />
            添加排序
          </Button>
        }
        content={
          <div className="w-80 max-h-96 overflow-y-auto p-4 space-y-4">
            {renderListMode()}
          </div>
        }
      />
    </div>
  );
  
  // 渲染下拉模式
  const renderDropdownMode = () => (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <Button
          size={size}
          variant={variant}
          disabled={disabled}
          className={cn('flex items-center justify-between gap-2 min-w-48', className)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ArrowUpDown className={sizeStyles.icon} />
            
            <span className="truncate">{getDisplayText()}</span>
            
            {localValue.length > 0 && (
              <Badge variant="outline" className={sizeStyles.badge}>
                {localValue.length}
              </Badge>
            )}
          </div>
          
          <ChevronDown className={cn('transition-transform', 
            isOpen && 'rotate-180',
            sizeStyles.icon
          )} />
        </Button>
      }
      content={
        <div className="w-80 max-h-96 overflow-y-auto p-4 space-y-4">
          {/* 预设 */}
          {showPresets && presets.length > 0 && (
            <div className="space-y-2">
              <div className={cn('font-medium', sizeStyles.container)}>预设排序</div>
              
              <div className="space-y-1">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    className={cn(
                      'w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors hover:bg-gray-50',
                      sizeStyles.container
                    )}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.icon && (
                      <preset.icon className={cn('text-gray-500', sizeStyles.icon)} />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{preset.label}</div>
                      
                      {preset.description && (
                        <div className={cn('text-muted-foreground truncate', 
                          size === 'sm' ? 'text-xs' : 'text-sm'
                        )}>
                          {preset.description}
                        </div>
                      )}
                    </div>
                    
                    {preset.favorited && (
                      <Heart className={cn('text-red-500 fill-current', sizeStyles.icon)} />
                    )}
                  </button>
                ))}
              </div>
              
              <Separator />
            </div>
          )}
          
          {/* 排序字段 */}
          {renderListMode()}
          
          {/* 操作按钮 */}
          {(showClear || showApply) && (
            <>
              <Separator />
              
              <div className="flex items-center justify-between gap-2">
                {showClear && (
                  <Button
                    size={size}
                    variant="outline"
                    disabled={disabled || localValue.length === 0}
                    onClick={handleClear}
                  >
                    清除
                  </Button>
                )}
                
                {showApply && !autoApply && (
                  <Button
                    size={size}
                    disabled={disabled}
                    onClick={handleApply}
                  >
                    应用
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      }
    />
  );
  
  // 错误状态
  if (error) {
    return (
      <div className={cn('text-red-600 flex items-center gap-2', sizeStyles.container, className)}>
        <X className={sizeStyles.icon} />
        {error}
      </div>
    );
  }
  
  // 加载状态
  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', sizeStyles.container, className)}>
        <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', sizeStyles.icon)} />
        加载中...
      </div>
    );
  }
  
  // 根据模式渲染
  switch (mode) {
    case 'buttons':
      return renderButtonMode();
    case 'tabs':
      return renderTabMode();
    case 'list':
      return renderListMode();
    case 'compact':
      return renderCompactMode();
    default:
      return renderDropdownMode();
  }
};

// 类型已在 @phoenixcoder/shared-types 中定义，无需重复导出

export default SortSelector;