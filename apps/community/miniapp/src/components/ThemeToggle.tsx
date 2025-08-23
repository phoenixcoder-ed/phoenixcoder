// 声明模块以解决类型问题
import React, { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Switch } from '@tarojs/components';
import styles from './ThemeToggle.module.scss';

// 扩展Taro类型定义
declare module '@tarojs/taro' {
    interface TaroStatic {
        getSystemInfoSync(): {
            theme: 'light' | 'dark';
            [key: string]: any;
        };
    }
}

type Theme = 'light' | 'dark';

interface ThemeToggleProps {
    initialTheme?: Theme;
    onChange?: (_theme: Theme) => void;
}

const ThemeToggle = ({ initialTheme = 'light', onChange }: ThemeToggleProps): React.ReactNode => {
    const [theme, setTheme] = useState<Theme>(initialTheme);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(theme === 'dark');

    // 初始化主题
    useEffect(() => {
        // 优先从本地存储获取主题
        const storedTheme = Taro.getStorageSync('theme') as Theme | null;
        if (storedTheme) {
            setTheme(storedTheme);
            setIsDarkMode(storedTheme === 'dark');
            applyTheme(storedTheme);
            if (onChange) {
                onChange(storedTheme);
            }
        } else {
            // 其次使用系统主题
            const systemTheme = Taro.getSystemInfoSync().theme || 'dark';
            const detectedTheme = systemTheme as Theme;
            setTheme(detectedTheme);
            setIsDarkMode(detectedTheme === 'dark');
            applyTheme(detectedTheme);
            if (onChange) {
                onChange(detectedTheme);
            }
        }

        // 监听系统主题变化
        const themeChangeListener = Taro.onThemeChange((res) => {
            const newTheme = res.theme as Theme;
            setTheme(newTheme);
            setIsDarkMode(newTheme === 'dark');
            applyTheme(newTheme);
            if (onChange) {
                onChange(newTheme);
            }
        });

        return () => {
            themeChangeListener?.off();
        };
    }, [onChange]);

    // 应用主题
    const applyTheme = (theme: Theme) => {
        // 保存主题到本地存储
        Taro.setStorageSync('theme', theme);

        // 更新全局样式变量
        document.documentElement.setAttribute('data-theme', theme);

        // 通知应用其他部分主题变化
        Taro.eventCenter.trigger('themeChange', { theme });
    };

    // 处理切换
    const handleToggle = (event: { detail: { value: boolean } }) => {
        const checked = event.detail.value;
        const newTheme: Theme = checked ? 'dark' : 'light';
        setTheme(newTheme);
        setIsDarkMode(checked);
        applyTheme(newTheme);
        if (onChange) {
            onChange(newTheme);
        }
    };

    return (
        <View className={styles.container}>
            <View className={`${styles.themeLabel} ${isDarkMode ? styles.darkLabel : styles.lightLabel}`}>
                {isDarkMode ? '暗色模式' : '亮色模式'}
            </View>
            <Switch checked={isDarkMode} onChange={handleToggle} className={styles.switch} color="#3D5AFE" />
        </View>
    );
};

export default ThemeToggle;
