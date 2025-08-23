import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { ChevronDown, X, Search, Check } from 'lucide-react';

// 选项接口
export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  group?: string;
}

// 选项组接口
export interface MultiSelectGroup {
  label: string;
  options: MultiSelectOption[];
}

// 多选组件属性接口
export interface MultiSelectProps {
  className?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxSelectedText?: string;
  options: MultiSelectOption[] | MultiSelectGroup[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  onSearch?: (query: string) => void;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  selectAll?: boolean;
  maxSelected?: number;
  maxHeight?: number;
  showCount?: boolean;
  showSearch?: boolean;
  closeOnSelect?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
}

// 尺寸配置
const sizeConfig = {
  sm: {
    trigger: 'h-8 text-sm',
    dropdown: 'text-sm',
    badge: 'text-xs'
  },
  md: {
    trigger: 'h-10 text-sm',
    dropdown: 'text-sm',
    badge: 'text-xs'
  },
  lg: {
    trigger: 'h-12 text-base',
    dropdown: 'text-base',
    badge: 'text-sm'
  }
};

// 变体配置
const variantConfig = {
  default: 'border-input bg-background',
  outline: 'border-2 border-input bg-transparent',
  ghost: 'border-transparent bg-transparent hover:bg-accent'
};

// 检查是否为分组选项
const isGroupedOptions = (options: MultiSelectOption[] | MultiSelectGroup[]): options is MultiSelectGroup[] => {
  return options.length > 0 && 'options' in options[0];
};

// 获取所有选项
const getAllOptions = (options: MultiSelectOption[] | MultiSelectGroup[]): MultiSelectOption[] => {
  if (isGroupedOptions(options)) {
    return options.reduce((acc, group) => acc.concat(group.options), [] as MultiSelectOption[]);
  }
  return options;
};

// 过滤选项
const filterOptions = (options: MultiSelectOption[], query: string): MultiSelectOption[] => {
  if (!query) return options;
  const lowerQuery = query.toLowerCase();
  return options.filter(option => 
    option.label.toLowerCase().includes(lowerQuery) ||
    option.description?.toLowerCase().includes(lowerQuery)
  );
};

// 选项项组件
const OptionItem: React.FC<{
  option: MultiSelectOption;
  selected: boolean;
  onToggle: (value: string) => void;
  size: 'sm' | 'md' | 'lg';
}> = ({ option, selected, onToggle, size }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent transition-colors',
        {
          'opacity-50 cursor-not-allowed': option.disabled,
          'bg-accent': selected
        },
        sizeConfig[size].dropdown
      )}
      onClick={() => !option.disabled && onToggle(option.value)}
    >
      <Checkbox
        checked={selected}
        disabled={option.disabled}
        onChange={() => !option.disabled && onToggle(option.value)}
        className="pointer-events-none"
      />
      
      {option.icon && (
        <div className="flex-shrink-0">
          {option.icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{option.label}</div>
        {option.description && (
          <div className="text-xs text-muted-foreground truncate">
            {option.description}
          </div>
        )}
      </div>
      
      {selected && (
        <Check className="w-4 h-4 text-primary flex-shrink-0" />
      )}
    </div>
  );
};

// 多选组件
export const MultiSelect: React.FC<MultiSelectProps> = ({
  className,
  placeholder = '请选择...',
  searchPlaceholder = '搜索选项...',
  emptyText = '暂无选项',
  maxSelectedText = '已达到最大选择数量',
  options,
  value,
  defaultValue = [],
  onChange,
  onSearch,
  disabled = false,
  loading = false,
  searchable = true,
  clearable = true,
  selectAll = false,
  maxSelected,
  maxHeight = 300,
  showCount = true,
  showSearch = true,
  closeOnSelect = false,
  variant = 'default',
  size = 'md',
  error = false,
  helperText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(value || defaultValue);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  // 同步外部值
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValues(value);
    }
  }, [value]);
  
  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 获取所有选项
  const allOptions = getAllOptions(options);
  
  // 过滤选项
  const filteredOptions = filterOptions(allOptions, searchQuery);
  
  // 获取选中的选项
  const selectedOptions = allOptions.filter(option => selectedValues.includes(option.value));
  
  // 处理选项切换
  const handleToggle = (optionValue: string) => {
    let newValues: string[];
    
    if (selectedValues.includes(optionValue)) {
      newValues = selectedValues.filter(v => v !== optionValue);
    } else {
      if (maxSelected && selectedValues.length >= maxSelected) {
        return; // 达到最大选择数量
      }
      newValues = [...selectedValues, optionValue];
    }
    
    setSelectedValues(newValues);
    onChange?.(newValues);
    
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };
  
  // 处理全选
  const handleSelectAll = () => {
    const availableOptions = filteredOptions.filter(option => !option.disabled);
    const allSelected = availableOptions.every(option => selectedValues.includes(option.value));
    
    let newValues: string[];
    if (allSelected) {
      // 取消全选
      newValues = selectedValues.filter(value => 
        !availableOptions.some(option => option.value === value)
      );
    } else {
      // 全选
      const newSelections = availableOptions
        .filter(option => !selectedValues.includes(option.value))
        .map(option => option.value);
      
      newValues = [...selectedValues, ...newSelections];
      
      // 检查最大选择数量
      if (maxSelected && newValues.length > maxSelected) {
        newValues = newValues.slice(0, maxSelected);
      }
    }
    
    setSelectedValues(newValues);
    onChange?.(newValues);
  };
  
  // 处理清空
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedValues([]);
    onChange?.([]);
  };
  
  // 移除单个选项
  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValues = selectedValues.filter(v => v !== optionValue);
    setSelectedValues(newValues);
    onChange?.(newValues);
  };
  
  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };
  
  // 渲染选项
  const renderOptions = () => {
    if (isGroupedOptions(options)) {
      return options.map((group) => {
        const groupOptions = filterOptions(group.options, searchQuery);
        if (groupOptions.length === 0) return null;
        
        return (
          <div key={group.label}>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
              {group.label}
            </div>
            {groupOptions.map((option) => (
              <OptionItem
                key={option.value}
                option={option}
                selected={selectedValues.includes(option.value)}
                onToggle={handleToggle}
                size={size}
              />
            ))}
          </div>
        );
      });
    }
    
    return filteredOptions.map((option) => (
      <OptionItem
        key={option.value}
        option={option}
        selected={selectedValues.includes(option.value)}
        onToggle={handleToggle}
        size={size}
      />
    ));
  };
  
  return (
    <div className={cn('relative', className)}>
      {/* 触发器 */}
      <Button
        ref={triggerRef}
        variant="outline"
        className={cn(
          'w-full justify-between font-normal',
          sizeConfig[size].trigger,
          variantConfig[variant],
          {
            'border-red-500': error,
            'opacity-50 cursor-not-allowed': disabled
          }
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="flex-1 flex items-center gap-1 min-w-0">
          {selectedValues.length === 0 ? (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedOptions.slice(0, 3).map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className={cn('max-w-24', sizeConfig[size].badge)}
                >
                  <span className="truncate">{option.label}</span>
                  <X
                    className="w-3 h-3 ml-1 hover:bg-muted-foreground/20 rounded-full cursor-pointer"
                    onClick={(e) => handleRemove(option.value, e)}
                  />
                </Badge>
              ))}
              
              {selectedValues.length > 3 && (
                <Badge variant="outline" className={sizeConfig[size].badge}>
                  +{selectedValues.length - 3}
                </Badge>
              )}
              
              {showCount && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({selectedValues.length})
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {clearable && selectedValues.length > 0 && (
            <X
              className="w-4 h-4 hover:bg-muted-foreground/20 rounded-full cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              { 'rotate-180': isOpen }
            )}
          />
        </div>
      </Button>
      
      {/* 下拉框 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg',
            sizeConfig[size].dropdown
          )}
          style={{ maxHeight }}
        >
          {/* 搜索框 */}
          {searchable && showSearch && (
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}
          
          {/* 全选按钮 */}
          {selectAll && filteredOptions.length > 0 && (
            <div className="p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="w-full justify-start"
              >
                <Checkbox
                  checked={filteredOptions.every(option => 
                    option.disabled || selectedValues.includes(option.value)
                  )}
                  className="mr-2"
                />
                全选
              </Button>
            </div>
          )}
          
          {/* 选项列表 */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                加载中...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              renderOptions()
            )}
          </div>
          
          {/* 最大选择提示 */}
          {maxSelected && selectedValues.length >= maxSelected && (
            <div className="p-2 border-t text-xs text-muted-foreground text-center">
              {maxSelectedText}
            </div>
          )}
        </div>
      )}
      
      {/* 帮助文本 */}
      {helperText && (
        <div className={cn(
          'mt-1 text-xs',
          error ? 'text-red-600' : 'text-muted-foreground'
        )}>
          {helperText}
        </div>
      )}
    </div>
  );
};

// 导出类型
// 类型已在 @phoenixcoder/shared-types 中定义，无需重复导出