import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from '@tarojs/components';
import { Icon } from './Icon';
import './TagInput.scss';

export interface TagInputProps {
    /** 初始标签列表 */
    initialTags?: string[];
    /** 标签变化时的回调 */
    onTagsChange?: (_tags: string[]) => void;
    /** 最大标签数量 */
    maxTags?: number;
    /** 占位符文本 */
    placeholder?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 输入框宽度 */
    inputWidth?: string;
    /** 标签分隔符，默认为逗号 */
    separator?: string;
}

/**
 * 标签输入组件
 * @example <TagInput initialTags={['javascript', 'react']} onTagsChange={handleTagsChange} />
 */
const TagInput: React.FC<TagInputProps> = ({
    initialTags = [],
    onTagsChange,
    maxTags = 10,
    placeholder = '添加标签，按回车或逗号分隔',
    disabled = false,
    inputWidth = '120px',
    separator = ',',
}) => {
    const [_tags, setTags] = useState<string[]>(initialTags);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // 监听标签变化并调用回调
    useEffect(() => {
        if (onTagsChange) {
            onTagsChange(_tags);
        }
    }, [_tags, onTagsChange]);

    // 聚焦输入框
    const focusInput = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // 添加标签
    const addTag = (tag: string) => {
        if (!tag.trim()) return;
        if (_tags.length >= maxTags) return;
        if (_tags.includes(tag.trim())) return;

        setTags([..._tags, tag.trim()]);
        setInputValue('');
    };

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    // 处理键盘事件
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // 按回车或分隔符添加标签
        if (e.key === 'Enter' || value.includes(separator)) {
            e.preventDefault();
            const tag = value.split(separator)[0];
            addTag(tag);
        }

        // 按退格键删除最后一个标签（如果输入框为空）
        if (e.key === 'Backspace' && !value && _tags.length > 0) {
            e.preventDefault();
            setTags(_tags.slice(0, -1));
        }
    };

    // 删除标签
    const removeTag = (index: number) => {
        setTags(_tags.filter((_, i) => i !== index));
    };

    return (
        <View className={`phoenix-tag-input ${disabled ? 'disabled' : ''}`} onClick={focusInput}>
            {/* 标签列表 */}
            <View className="tag-list">
                {_tags.map((tag, index) => (
                    <View key={index} className="tag-item">
                        <Text className="tag-text">{tag}</Text>
                        <TouchableOpacity
                            className="tag-remove"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(index);
                            }}
                            disabled={disabled}
                        >
                            <Icon name="check" size={14} color="#999" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* 输入框 */}
            <TextInput
                ref={inputRef}
                className="tag-input"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                style={{ width: inputWidth }}
                autoFocus
            />
        </View>
    );
};

export default TagInput;
