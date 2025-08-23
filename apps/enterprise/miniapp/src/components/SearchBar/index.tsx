import React from 'react';
import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';
import { AtInput, AtIcon } from 'taro-ui';
import './index.scss';

// 定义组件props类型
interface SearchBarProps {
    placeholder?: string;
    _value?: string;
    onChange?: (_value: string) => void;
    onSearch?: (_value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    _value,
    onChange,
    onSearch: _onSearch,
    placeholder = '搜索任务...',
}) => {
    const handleChange = (_value: string) => {
        if (onChange) {
            onChange(_value);
        }
    };

    const handleSearch = () => {
        // Search functionality can be implemented here
    };

    return (
        <View className="search-bar-container">
            <AtInput
                className="search-input"
                placeholder={placeholder}
                value={_value}
                onChange={handleChange}
                onConfirm={handleSearch}
                prefix={<AtIcon type="search" size={16} />}
            />
        </View>
    );
};

export default SearchBar;
