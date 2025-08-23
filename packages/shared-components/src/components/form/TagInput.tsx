import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '../../utils/cn';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { X, Plus, Tag } from 'lucide-react';

// 标签接口
export interface TagItem {
  id: string;
  label: string;
  value: string;
  color?: string;
  disabled?: boolean;
}

// 标签输入组件属性接口
export interface TagInputProps {
  className?: string;
  placeholder?: string;
  value?: TagItem[];
  defaultValue?: TagItem[];
  onChange?: (tags: TagItem[]) => void;
  onTagAdd?: (tag: TagItem) => void;
  onTagRemove?: (tag: TagItem) => void;
  onInputChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  maxTags?: number;
  maxLength?: number;
  minLength?: number;
  allowDuplicates?: boolean;
  caseSensitive?: boolean;
  separator?: string | string[];
  suggestions?: string[];
  showSuggestions?: boolean;
  createOnBlur?: boolean;
  createOnEnter?: boolean;
  createOnSeparator?: boolean;
  validateTag?: (value: string) => boolean | string;
  formatTag?: (value: string) => string;
  renderTag?: (tag: TagItem, onRemove: () => void) => React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  error?: boolean;
  helperText?: string;
  addButtonText?: string;
  maxTagsText?: string;
  duplicateText?: string;
  invalidText?: string;
}

// 尺寸配置
const sizeConfig = {
  sm: {
    container: 'min-h-8 text-sm',
    input: 'text-sm',
    tag: 'text-xs h-6',
    button: 'h-6 px-2 text-xs'
  },
  md: {
    container: 'min-h-10 text-sm',
    input: 'text-sm',
    tag: 'text-xs h-7',
    button: 'h-7 px-3 text-sm'
  },
  lg: {
    container: 'min-h-12 text-base',
    input: 'text-base',
    tag: 'text-sm h-8',
    button: 'h-8 px-4 text-sm'
  }
};

// 变体配置
const variantConfig = {
  default: 'border-input bg-background',
  outline: 'border-2 border-input bg-transparent',
  filled: 'border-input bg-muted'
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 默认分隔符
const defaultSeparators = [',', ';', '\n', '\t'];

// 标签验证
const defaultValidateTag = (value: string): boolean => {
  return value.trim().length > 0;
};

// 标签格式化
const defaultFormatTag = (value: string): string => {
  return value.trim();
};

// 检查是否为分隔符
const isSeparator = (key: string, separators: string | string[]): boolean => {
  const seps = Array.isArray(separators) ? separators : [separators];
  return seps.includes(key);
};

// 建议项组件
const SuggestionItem: React.FC<{
  suggestion: string;
  selected: boolean;
  onClick: () => void;
  size: 'sm' | 'md' | 'lg';
}> = ({ suggestion, selected, onClick, size }) => {
  return (
    <div
      className={cn(
        'px-3 py-2 cursor-pointer hover:bg-accent transition-colors',
        {
          'bg-accent': selected
        },
        sizeConfig[size].input
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <span>{suggestion}</span>
      </div>
    </div>
  );
};

// 标签输入组件
export const TagInput: React.FC<TagInputProps> = ({
  className,
  placeholder = '输入标签...',
  value,
  defaultValue = [],
  onChange,
  onTagAdd,
  onTagRemove,
  onInputChange,
  disabled = false,
  readOnly = false,
  maxTags,
  maxLength,
  minLength = 1,
  allowDuplicates = false,
  caseSensitive = false,
  separator = defaultSeparators,
  suggestions = [],
  showSuggestions = true,
  createOnBlur = true,
  createOnEnter = true,
  createOnSeparator = true,
  validateTag = defaultValidateTag,
  formatTag = defaultFormatTag,
  renderTag,
  size = 'md',
  variant = 'default',
  error = false,
  helperText,
  addButtonText = '添加',
  maxTagsText = '已达到最大标签数量',
  duplicateText = '标签已存在',
  invalidText = '无效的标签'
}) => {
  const [tags, setTags] = useState<TagItem[]>(value || defaultValue);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestionList, setShowSuggestionList] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // 同步外部值
  useEffect(() => {
    if (value !== undefined) {
      setTags(value);
    }
  }, [value]);
  
  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionList(false);
        setSelectedSuggestionIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 过滤建议
  const filteredSuggestions = suggestions.filter(suggestion => {
    if (!inputValue) return false;
    
    const query = caseSensitive ? inputValue : inputValue.toLowerCase();
    const suggestionText = caseSensitive ? suggestion : suggestion.toLowerCase();
    
    // 排除已存在的标签
    const exists = tags.some(tag => {
      const tagValue = caseSensitive ? tag.value : tag.value.toLowerCase();
      const suggestionValue = caseSensitive ? suggestion : suggestion.toLowerCase();
      return tagValue === suggestionValue;
    });
    
    return !exists && suggestionText.includes(query);
  });
  
  // 创建标签
  const createTag = (tagValue: string): TagItem | null => {
    const formattedValue = formatTag(tagValue);
    
    // 验证长度
    if (formattedValue.length < minLength) {
      setErrorMessage(`标签长度不能少于 ${minLength} 个字符`);
      return null;
    }
    
    if (maxLength && formattedValue.length > maxLength) {
      setErrorMessage(`标签长度不能超过 ${maxLength} 个字符`);
      return null;
    }
    
    // 验证标签
    const validation = validateTag(formattedValue);
    if (validation === false) {
      setErrorMessage(invalidText);
      return null;
    }
    if (typeof validation === 'string') {
      setErrorMessage(validation);
      return null;
    }
    
    // 检查重复
    if (!allowDuplicates) {
      const exists = tags.some(tag => {
        const existingValue = caseSensitive ? tag.value : tag.value.toLowerCase();
        const newValue = caseSensitive ? formattedValue : formattedValue.toLowerCase();
        return existingValue === newValue;
      });
      
      if (exists) {
        setErrorMessage(duplicateText);
        return null;
      }
    }
    
    // 检查最大数量
    if (maxTags && tags.length >= maxTags) {
      setErrorMessage(maxTagsText);
      return null;
    }
    
    setErrorMessage('');
    return {
      id: generateId(),
      label: formattedValue,
      value: formattedValue
    };
  };
  
  // 添加标签
  const addTag = (tagValue: string) => {
    const tag = createTag(tagValue);
    if (!tag) return;
    
    const newTags = [...tags, tag];
    setTags(newTags);
    onChange?.(newTags);
    onTagAdd?.(tag);
    setInputValue('');
    setShowSuggestionList(false);
    setSelectedSuggestionIndex(-1);
  };
  
  // 移除标签
  const removeTag = (tagToRemove: TagItem) => {
    if (tagToRemove.disabled) return;
    
    const newTags = tags.filter(tag => tag.id !== tagToRemove.id);
    setTags(newTags);
    onChange?.(newTags);
    onTagRemove?.(tagToRemove);
    setErrorMessage('');
  };
  
  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onInputChange?.(newValue);
    setErrorMessage('');
    
    // 显示建议
    if (showSuggestions && newValue && filteredSuggestions.length > 0) {
      setShowSuggestionList(true);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestionList(false);
    }
    
    // 检查分隔符
    if (createOnSeparator) {
      const separators = Array.isArray(separator) ? separator : [separator];
      for (const sep of separators) {
        if (newValue.includes(sep)) {
          const parts = newValue.split(sep);
          const tagValue = parts[0];
          const remaining = parts.slice(1).join(sep);
          
          if (tagValue) {
            addTag(tagValue);
          }
          
          setInputValue(remaining);
          return;
        }
      }
    }
  };
  
  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (showSuggestionList && selectedSuggestionIndex >= 0) {
          addTag(filteredSuggestions[selectedSuggestionIndex]);
        } else if (createOnEnter && inputValue) {
          addTag(inputValue);
        }
        break;
        
      case 'Backspace':
        if (!inputValue && tags.length > 0) {
          const lastTag = tags[tags.length - 1];
          if (!lastTag.disabled) {
            removeTag(lastTag);
          }
        }
        break;
        
      case 'ArrowDown':
        if (showSuggestionList) {
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        if (showSuggestionList) {
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
        }
        break;
        
      case 'Escape':
        setShowSuggestionList(false);
        setSelectedSuggestionIndex(-1);
        break;
        
      default:
        if (createOnSeparator && isSeparator(e.key, separator)) {
          e.preventDefault();
          if (inputValue) {
            addTag(inputValue);
          }
        }
        break;
    }
  };
  
  // 处理失焦
  const handleBlur = () => {
    if (createOnBlur && inputValue) {
      addTag(inputValue);
    }
    
    setTimeout(() => {
      setShowSuggestionList(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };
  
  // 处理聚焦
  const handleFocus = () => {
    if (showSuggestions && inputValue && filteredSuggestions.length > 0) {
      setShowSuggestionList(true);
    }
  };
  
  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };
  
  // 渲染标签
  const renderTagItem = (tag: TagItem) => {
    if (renderTag) {
      return renderTag(tag, () => removeTag(tag));
    }
    
    return (
      <Badge
        key={tag.id}
        variant="secondary"
        className={cn(
          'flex items-center gap-1 max-w-32',
          sizeConfig[size].tag,
          {
            'opacity-50': tag.disabled
          }
        )}
        style={{ backgroundColor: tag.color }}
      >
        <span className="truncate">{tag.label}</span>
        {!tag.disabled && !readOnly && (
          <X
            className="w-3 h-3 hover:bg-muted-foreground/20 rounded-full cursor-pointer flex-shrink-0"
            onClick={() => removeTag(tag)}
          />
        )}
      </Badge>
    );
  };
  
  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* 主容器 */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-1 p-2 border rounded-md transition-colors',
          sizeConfig[size].container,
          variantConfig[variant],
          {
            'border-red-500': error || errorMessage,
            'opacity-50 cursor-not-allowed': disabled,
            'bg-muted/50': readOnly,
            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2': !disabled && !readOnly
          }
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* 标签列表 */}
        {tags.map(renderTagItem)}
        
        {/* 输入框 */}
        {!readOnly && (!maxTags || tags.length < maxTags) && (
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={tags.length === 0 ? placeholder : ''}
            disabled={disabled}
            className={cn(
              'flex-1 min-w-20 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0',
              sizeConfig[size].input
            )}
          />
        )}
        
        {/* 添加按钮 */}
        {inputValue && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => addTag(inputValue)}
            disabled={disabled}
            className={sizeConfig[size].button}
          >
            <Plus className="w-3 h-3 mr-1" />
            {addButtonText}
          </Button>
        )}
      </div>
      
      {/* 建议列表 */}
      {showSuggestionList && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <SuggestionItem
              key={suggestion}
              suggestion={suggestion}
              selected={index === selectedSuggestionIndex}
              onClick={() => handleSuggestionClick(suggestion)}
              size={size}
            />
          ))}
        </div>
      )}
      
      {/* 错误消息 */}
      {errorMessage && (
        <div className="mt-1 text-xs text-red-600">
          {errorMessage}
        </div>
      )}
      
      {/* 帮助文本 */}
      {helperText && !errorMessage && (
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