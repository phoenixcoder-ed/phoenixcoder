import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ThemeToggle from '@/components/ThemeToggle';

// 模拟主题变化监听器
const mockThemeChangeListener = {
    off: vi.fn(),
};

describe('ThemeToggle 主题切换组件测试', () => {
    beforeEach(() => {
        // 重置所有mock
        vi.clearAllMocks();

        // 模拟Taro API
        global.Taro.getStorageSync = vi.fn();
        global.Taro.setStorageSync = vi.fn();
        global.Taro.getSystemInfoSync = vi.fn(() => ({
            theme: 'dark',
            platform: 'devtools',
            system: 'iOS 10.0.1',
        }));
        global.Taro.onThemeChange = vi.fn(() => mockThemeChangeListener);
        global.Taro.eventCenter = {
            trigger: vi.fn(),
        };

        // 模拟document
        global.document = {
            documentElement: {
                setAttribute: vi.fn(),
            },
        } as any;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('组件渲染', () => {
        it('应该正确渲染主题切换组件', () => {
            // 模拟没有存储的主题，使用系统默认主题
            global.Taro.getStorageSync.mockReturnValue(null);

            render(<ThemeToggle />);

            // 检查组件是否渲染
            expect(screen.getByText('暗色模式')).toBeInTheDocument();
        });

        it('应该根据初始主题显示正确的文本', () => {
            // 测试亮色模式
            global.Taro.getStorageSync.mockReturnValue(null);
            global.Taro.getSystemInfoSync.mockReturnValue({ theme: 'light' });

            render(<ThemeToggle initialTheme="light" />);

            expect(screen.getByText('亮色模式')).toBeInTheDocument();
        });
    });

    describe('主题初始化', () => {
        it('应该优先使用存储的主题设置', () => {
            // 模拟存储中有主题设置
            global.Taro.getStorageSync.mockReturnValue('light');

            const mockOnChange = vi.fn();
            render(<ThemeToggle onChange={mockOnChange} />);

            expect(global.Taro.getStorageSync).toHaveBeenCalledWith('theme');
            expect(mockOnChange).toHaveBeenCalledWith('light');
        });

        it('应该在没有存储主题时使用系统主题', () => {
            // 模拟没有存储的主题
            global.Taro.getStorageSync.mockReturnValue(null);
            global.Taro.getSystemInfoSync.mockReturnValue({ theme: 'dark' });

            const mockOnChange = vi.fn();
            render(<ThemeToggle onChange={mockOnChange} />);

            expect(global.Taro.getSystemInfoSync).toHaveBeenCalled();
            expect(mockOnChange).toHaveBeenCalledWith('dark');
        });

        it('应该在系统主题不可用时使用默认主题', () => {
            // 模拟没有存储的主题且系统主题不可用
            global.Taro.getStorageSync.mockReturnValue(null);
            global.Taro.getSystemInfoSync.mockReturnValue({});

            const mockOnChange = vi.fn();
            render(<ThemeToggle initialTheme="light" onChange={mockOnChange} />);

            expect(mockOnChange).toHaveBeenCalledWith('dark'); // 默认使用dark主题
        });
    });

    describe('主题切换功能', () => {
        it('应该在点击开关时切换主题', () => {
            global.Taro.getStorageSync.mockReturnValue('light');

            const mockOnChange = vi.fn();
            render(<ThemeToggle onChange={mockOnChange} />);

            // 清除初始化时的调用
            mockOnChange.mockClear();

            // 模拟点击开关
            const switchElement = screen.getByRole('switch');
            fireEvent.change(switchElement, { detail: { value: true } });

            expect(mockOnChange).toHaveBeenCalledWith('dark');
            expect(global.Taro.setStorageSync).toHaveBeenCalledWith('theme', 'dark');
        });

        it('应该在切换主题时更新DOM属性', () => {
            global.Taro.getStorageSync.mockReturnValue('light');

            render(<ThemeToggle />);

            // 模拟点击开关切换到暗色模式
            const switchElement = screen.getByRole('switch');
            fireEvent.change(switchElement, { detail: { value: true } });

            expect(global.document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
        });

        it('应该在切换主题时触发全局事件', () => {
            global.Taro.getStorageSync.mockReturnValue('light');

            render(<ThemeToggle />);

            // 模拟点击开关
            const switchElement = screen.getByRole('switch');
            fireEvent.change(switchElement, { detail: { value: true } });

            expect(global.Taro.eventCenter.trigger).toHaveBeenCalledWith('themeChange', { theme: 'dark' });
        });
    });

    describe('系统主题监听', () => {
        it('应该监听系统主题变化', () => {
            global.Taro.getStorageSync.mockReturnValue(null);

            render(<ThemeToggle />);

            expect(global.Taro.onThemeChange).toHaveBeenCalled();
        });

        it('应该在系统主题变化时更新组件状态', () => {
            global.Taro.getStorageSync.mockReturnValue(null);

            // 模拟系统主题变化回调
            let themeChangeCallback: (_themeInfo: { theme: string }) => void;
            global.Taro.onThemeChange.mockImplementation((callback) => {
                themeChangeCallback = callback;
                return mockThemeChangeListener;
            });

            const mockOnChange = vi.fn();
            render(<ThemeToggle onChange={mockOnChange} />);

            // 清除初始化时的调用
            mockOnChange.mockClear();

            // 模拟系统主题变化
            themeChangeCallback({ theme: 'light' });

            expect(mockOnChange).toHaveBeenCalledWith('light');
            expect(screen.getByText('亮色模式')).toBeInTheDocument();
        });

        it('应该在组件卸载时移除主题监听器', () => {
            global.Taro.getStorageSync.mockReturnValue(null);
            global.Taro.onThemeChange.mockReturnValue(mockThemeChangeListener);

            const { unmount } = render(<ThemeToggle />);

            unmount();

            expect(mockThemeChangeListener.off).toHaveBeenCalled();
        });
    });

    describe('样式类名', () => {
        it('应该在暗色模式时应用正确的样式类', () => {
            global.Taro.getStorageSync.mockReturnValue('dark');

            render(<ThemeToggle />);

            const labelElement = screen.getByText('暗色模式');
            expect(labelElement).toHaveClass('darkLabel');
        });

        it('应该在亮色模式时应用正确的样式类', () => {
            global.Taro.getStorageSync.mockReturnValue('light');

            render(<ThemeToggle />);

            const labelElement = screen.getByText('亮色模式');
            expect(labelElement).toHaveClass('lightLabel');
        });
    });

    describe('开关状态', () => {
        it('应该在暗色模式时开关为开启状态', () => {
            global.Taro.getStorageSync.mockReturnValue('dark');

            render(<ThemeToggle />);

            const switchElement = screen.getByRole('switch');
            expect(switchElement).toBeChecked();
        });

        it('应该在亮色模式时开关为关闭状态', () => {
            global.Taro.getStorageSync.mockReturnValue('light');

            render(<ThemeToggle />);

            const switchElement = screen.getByRole('switch');
            expect(switchElement).not.toBeChecked();
        });
    });

    describe('错误处理', () => {
        it('应该处理存储API异常', () => {
            // 模拟存储API抛出异常
            global.Taro.getStorageSync.mockImplementation(() => {
                throw new Error('Storage error');
            });

            // 组件应该能正常渲染，不会崩溃
            expect(() => {
                render(<ThemeToggle />);
            }).not.toThrow();
        });

        it('应该处理系统信息API异常', () => {
            global.Taro.getStorageSync.mockReturnValue(null);
            global.Taro.getSystemInfoSync.mockImplementation(() => {
                throw new Error('System info error');
            });

            // 组件应该能正常渲染，使用默认主题
            expect(() => {
                render(<ThemeToggle />);
            }).not.toThrow();
        });
    });
});
