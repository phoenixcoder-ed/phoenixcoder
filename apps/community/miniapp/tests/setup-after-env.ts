/**
 * 测试环境增强配置
 * 在每个测试文件执行前运行
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 扩展 expect 匹配器
expect.extend({
    toBeInTheDocument: (received) => {
        const pass = received && received.ownerDocument && received.ownerDocument.body.contains(received);
        return {
            message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
            pass,
        };
    },

    toHaveClass: (received, className) => {
        const pass = received && received.classList && received.classList.contains(className);
        return {
            message: () => `expected element ${pass ? 'not ' : ''}to have class "${className}"`,
            pass,
        };
    },

    toBeVisible: (received) => {
        const pass = received && received.style.display !== 'none' && received.style.visibility !== 'hidden';
        return {
            message: () => `expected element ${pass ? 'not ' : ''}to be visible`,
            pass,
        };
    },
});

// 全局测试工具函数
global.createMockComponent = (name: string, props: any = {}) => {
    return vi.fn(() => {
        return {
            type: name,
            props,
            children: [],
        };
    });
};

// 模拟 Taro API
vi.mock('@tarojs/taro', () => ({
    // 导航相关
    navigateTo: vi.fn(),
    navigateBack: vi.fn(),
    redirectTo: vi.fn(),
    switchTab: vi.fn(),
    reLaunch: vi.fn(),

    // 存储相关
    setStorage: vi.fn(),
    getStorage: vi.fn(),
    removeStorage: vi.fn(),
    clearStorage: vi.fn(),
    setStorageSync: vi.fn(),
    getStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    clearStorageSync: vi.fn(),

    // 网络请求
    request: vi.fn(),
    uploadFile: vi.fn(),
    downloadFile: vi.fn(),

    // 界面相关
    showToast: vi.fn(),
    showModal: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    showActionSheet: vi.fn(),

    // 设备信息
    getSystemInfo: vi.fn(),
    getSystemInfoSync: vi.fn(),

    // 用户信息
    getUserInfo: vi.fn(),
    getUserProfile: vi.fn(),

    // 登录
    login: vi.fn(),
    checkSession: vi.fn(),

    // 支付
    requestPayment: vi.fn(),

    // 分享
    showShareMenu: vi.fn(),
    hideShareMenu: vi.fn(),

    // 环境变量
    getEnv: vi.fn(() => 'h5'),
    ENV_TYPE: {
        WEAPP: 'WEAPP',
        WEB: 'WEB',
        RN: 'RN',
        SWAN: 'SWAN',
        ALIPAY: 'ALIPAY',
        TT: 'TT',
        QQ: 'QQ',
        JD: 'JD',
    },

    // 事件中心
    eventCenter: {
        on: vi.fn(),
        off: vi.fn(),
        trigger: vi.fn(),
    },

    // 页面生命周期
    getCurrentInstance: vi.fn(() => ({
        page: {
            onLoad: vi.fn(),
            onShow: vi.fn(),
            onHide: vi.fn(),
            onUnload: vi.fn(),
        },
        router: {
            params: {},
            path: '/pages/index/index',
        },
    })),

    // 其他常用API
    createSelectorQuery: vi.fn(() => ({
        select: vi.fn(() => ({
            boundingClientRect: vi.fn(() => ({
                exec: vi.fn(),
            })),
        })),
    })),

    createIntersectionObserver: vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
    })),
}));

// 模拟 Taro 组件
vi.mock('@tarojs/components', () => ({
    View: 'view',
    Text: 'text',
    Button: 'button',
    Image: 'image',
    Input: 'input',
    Textarea: 'textarea',
    ScrollView: 'scroll-view',
    Swiper: 'swiper',
    SwiperItem: 'swiper-item',
    Navigator: 'navigator',
    Form: 'form',
    Label: 'label',
    Picker: 'picker',
    PickerView: 'picker-view',
    PickerViewColumn: 'picker-view-column',
    Slider: 'slider',
    Switch: 'switch',
    Checkbox: 'checkbox',
    CheckboxGroup: 'checkbox-group',
    Radio: 'radio',
    RadioGroup: 'radio-group',
    RichText: 'rich-text',
    Progress: 'progress',
    Icon: 'icon',
    Map: 'map',
    Canvas: 'canvas',
    OpenData: 'open-data',
    WebView: 'web-view',
    Ad: 'ad',
    Block: 'block',
}));

// 模拟共享模块
vi.mock('@phoenixcoder/shared-miniapp', () => ({
    // 工具函数
    formatDate: vi.fn((_date) => '2024-01-01'),
    formatCurrency: vi.fn((_amount) => '¥100.00'),
    validateEmail: vi.fn(() => true),
    validatePhone: vi.fn(() => true),

    // 常量
    API_BASE_URL: 'https://api.test.com',
    APP_VERSION: '1.0.0',

    // 类型定义
    UserRole: {
        ADMIN: 'admin',
        USER: 'user',
        GUEST: 'guest',
    },
}));

// 全局错误处理
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

// 测试环境变量
process.env.NODE_ENV = 'test';
process.env.TARO_ENV = 'h5';

// 模拟 console 方法（可选，用于减少测试输出噪音）
if (process.env.VITEST_SILENT === 'true') {
    global.console = {
        ...console,
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };
}

// 清理函数
afterEach(() => {
    // 清理所有模拟
    vi.clearAllMocks();

    // 清理 DOM
    document.body.innerHTML = '';

    // 重置环境变量
    process.env.NODE_ENV = 'test';
    process.env.TARO_ENV = 'h5';
});

// 测试超时处理
beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

// 导出测试工具
export const testUtils = {
    // 创建模拟组件
    createMockComponent: global.createMockComponent,

    // 等待异步操作
    waitFor: async (callback: () => void, timeout = 5000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            try {
                callback();
                return;
            } catch {
                await new Promise((resolve) => setTimeout(resolve, 10));
            }
        }
        throw new Error(`waitFor timeout after ${timeout}ms`);
    },

    // 模拟用户交互
    mockUserInteraction: {
        tap: vi.fn(),
        longPress: vi.fn(),
        swipe: vi.fn(),
        scroll: vi.fn(),
    },

    // 模拟网络请求
    mockRequest: {
        success: (data: any) => Promise.resolve({ data, statusCode: 200 }),
        error: (message: string) => Promise.reject(new Error(message)),
        loading: () => new Promise((resolve) => setTimeout(resolve, 1000)),
    },
};
