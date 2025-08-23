import React from 'react';
import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';
import { AtInput, AtIcon } from 'taro-ui';
import './index.scss';

// 定义组件props类型
interface SearchBarProps {
    placeholder?: string;
    value?: string;
    onChange?: (_value: string) => void;
    onSearch?: () => void;
    disabled?: boolean;
    showSearchButton?: boolean;
    className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
    _value,
    onChange,
    onSearch,
    placeholder = '搜索...',
    disabled = false,
    showSearchButton = true,
    className = '',
}) => {
    const handleChange = (_value: string) => {
        if (onChange) {
            onChange(_value);
        }
    };

    const handleSearch = () => {
        if (onSearch) {
            onSearch();
        }
    };

    return (
        <View className={`search-bar-container ${className}`}>
            <AtInput
                className="search-input"
                placeholder={placeholder}
                value={_value}
                onChange={handleChange}
                onConfirm={handleSearch}
                disabled={disabled}
                prefix={<AtIcon type="search" size={16} />}
            />
            {showSearchButton && (
                <View className="search-button" onClick={handleSearch}>
                    <AtIcon type="search" size={16} />
                </View>
            )}
        </View>
    );
};

export default SearchBar;
