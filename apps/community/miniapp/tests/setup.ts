import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock @tarojs/taro module
vi.mock('@tarojs/taro', () => {
    return {
        default: {
            navigateTo: vi.fn(),
            navigateBack: vi.fn(),
            redirectTo: vi.fn(),
            switchTab: vi.fn(),
            reLaunch: vi.fn(),
            showToast: vi.fn(),
            showModal: vi.fn(),
            showLoading: vi.fn(),
            hideLoading: vi.fn(),
            getStorageSync: vi.fn(),
            setStorageSync: vi.fn(),
            removeStorageSync: vi.fn(),
            clearStorageSync: vi.fn(),
            request: vi.fn(),
            uploadFile: vi.fn(),
            downloadFile: vi.fn(),
            getSystemInfo: vi.fn(),
            getSystemInfoSync: vi.fn(() => ({
                platform: 'devtools',
                system: 'iOS 10.0.1',
                version: '6.6.3',
                SDKVersion: '2.4.0',
                brand: 'devtools',
                model: 'iPhone 6',
                pixelRatio: 2,
                screenWidth: 375,
                screenHeight: 667,
                windowWidth: 375,
                windowHeight: 667,
                statusBarHeight: 20,
                language: 'zh_CN',
                fontSizeSetting: 16,
                theme: 'dark',
            })),
            onThemeChange: vi.fn(),
            ENV_TYPE: {
                WEAPP: 'WEAPP',
                WEB: 'WEB',
                RN: 'RN',
                SWAN: 'SWAN',
                ALIPAY: 'ALIPAY',
                TT: 'TT',
            },
            getEnv: vi.fn(() => 'WEAPP'),
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
            eventCenter: {
                trigger: vi.fn(),
            },
        },
    };
});

// 模拟Taro环境
const mockTaro = {
    // 模拟Taro的基础API
    navigateTo: vi.fn(),
    navigateBack: vi.fn(),
    redirectTo: vi.fn(),
    switchTab: vi.fn(),
    reLaunch: vi.fn(),
    showToast: vi.fn(),
    showModal: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    clearStorageSync: vi.fn(),
    request: vi.fn(),
    uploadFile: vi.fn(),
    downloadFile: vi.fn(),
    getSystemInfo: vi.fn(),
    getSystemInfoSync: vi.fn(() => ({
        platform: 'devtools',
        system: 'iOS 10.0.1',
        version: '6.6.3',
        SDKVersion: '2.4.0',
        brand: 'devtools',
        model: 'iPhone 6',
        pixelRatio: 2,
        screenWidth: 375,
        screenHeight: 667,
        windowWidth: 375,
        windowHeight: 667,
        statusBarHeight: 20,
        language: 'zh_CN',
        fontSizeSetting: 16,
        theme: 'dark',
    })),
    onThemeChange: vi.fn(),
    // 环境变量
    ENV_TYPE: {
        WEAPP: 'WEAPP',
        WEB: 'WEB',
        RN: 'RN',
        SWAN: 'SWAN',
        ALIPAY: 'ALIPAY',
        TT: 'TT',
    },
    getEnv: vi.fn(() => 'WEAPP'),
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
    // 事件中心
    eventCenter: {
        trigger: vi.fn(),
    },
};

// 设置到全局对象
(globalThis as any).Taro = mockTaro;
(globalThis as any).global = globalThis;
(globalThis as any).global.Taro = mockTaro;

// 模拟小程序全局对象
(globalThis as any).wx = {
    // 基础API
    navigateTo: vi.fn(),
    navigateBack: vi.fn(),
    redirectTo: vi.fn(),
    switchTab: vi.fn(),
    reLaunch: vi.fn(),
    showToast: vi.fn(),
    showModal: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    // 存储API
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    clearStorageSync: vi.fn(),
    // 网络API
    request: vi.fn(),
    uploadFile: vi.fn(),
    downloadFile: vi.fn(),
    // 系统信息
    getSystemInfo: vi.fn(),
    getSystemInfoSync: vi.fn(() => ({
        platform: 'devtools',
        system: 'iOS 10.0.1',
        version: '6.6.3',
        SDKVersion: '2.4.0',
    })),
};

// 模拟process.env
process.env.TARO_ENV = 'weapp';
process.env.NODE_ENV = 'test';

// 模拟window对象的一些属性
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// 模拟IntersectionObserver
(globalThis as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// 模拟ResizeObserver
(globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// 模拟全局 document 对象到 global
(globalThis as any).global.document = {
    documentElement: {
        setAttribute: vi.fn(),
        appendChild: vi.fn(),
        getAttribute: vi.fn(),
        classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(() => false),
            toggle: vi.fn(),
        },
    },
    body: {
        appendChild: vi.fn(),
    },
    createElement: vi.fn(() => ({
        setAttribute: vi.fn(),
        appendChild: vi.fn(),
    })),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
};

// 清理函数，在每个测试后重置所有mock
afterEach(() => {
    vi.clearAllMocks();
});
