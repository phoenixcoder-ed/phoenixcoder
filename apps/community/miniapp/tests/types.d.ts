/// <reference types="vitest/globals" />

import { vi } from 'vitest';

declare global {
    // Taro 全局对象类型声明
    const Taro: {
        navigateTo: ReturnType<typeof vi.fn>;
        navigateBack: ReturnType<typeof vi.fn>;
        redirectTo: ReturnType<typeof vi.fn>;
        switchTab: ReturnType<typeof vi.fn>;
        reLaunch: ReturnType<typeof vi.fn>;
        showToast: ReturnType<typeof vi.fn>;
        showModal: ReturnType<typeof vi.fn>;
        showLoading: ReturnType<typeof vi.fn>;
        hideLoading: ReturnType<typeof vi.fn>;
        getStorageSync: ReturnType<typeof vi.fn>;
        setStorageSync: ReturnType<typeof vi.fn>;
        removeStorageSync: ReturnType<typeof vi.fn>;
        clearStorageSync: ReturnType<typeof vi.fn>;
        request: ReturnType<typeof vi.fn>;
        uploadFile: ReturnType<typeof vi.fn>;
        downloadFile: ReturnType<typeof vi.fn>;
        getSystemInfo: ReturnType<typeof vi.fn>;
        getSystemInfoSync: ReturnType<typeof vi.fn>;
        onThemeChange: ReturnType<typeof vi.fn>;
        ENV_TYPE: {
            WEAPP: string;
            WEB: string;
            RN: string;
            SWAN: string;
            ALIPAY: string;
            TT: string;
        };
        getEnv: ReturnType<typeof vi.fn>;
        getCurrentInstance: ReturnType<typeof vi.fn>;
        eventCenter: {
            trigger: ReturnType<typeof vi.fn>;
        };
    };

    // 小程序 wx 全局对象类型声明
    const wx: {
        navigateTo: ReturnType<typeof vi.fn>;
        navigateBack: ReturnType<typeof vi.fn>;
        redirectTo: ReturnType<typeof vi.fn>;
        switchTab: ReturnType<typeof vi.fn>;
        reLaunch: ReturnType<typeof vi.fn>;
        showToast: ReturnType<typeof vi.fn>;
        showModal: ReturnType<typeof vi.fn>;
        showLoading: ReturnType<typeof vi.fn>;
        hideLoading: ReturnType<typeof vi.fn>;
        getStorageSync: ReturnType<typeof vi.fn>;
        setStorageSync: ReturnType<typeof vi.fn>;
        removeStorageSync: ReturnType<typeof vi.fn>;
        clearStorageSync: ReturnType<typeof vi.fn>;
        request: ReturnType<typeof vi.fn>;
        uploadFile: ReturnType<typeof vi.fn>;
        downloadFile: ReturnType<typeof vi.fn>;
        getSystemInfo: ReturnType<typeof vi.fn>;
        getSystemInfoSync: ReturnType<typeof vi.fn>;
    };

    // 扩展 document 类型
    interface Document {
        documentElement: {
            setAttribute: ReturnType<typeof vi.fn>;
        };
    }

    // Node.js process 环境变量
    namespace NodeJS {
        interface ProcessEnv {
            TARO_ENV: string;
            NODE_ENV: string;
        }
    }
}

export {};
