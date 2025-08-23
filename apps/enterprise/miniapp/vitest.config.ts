/// <reference types="vitest" />
/// <reference types="vitest/globals" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        // 自动退出相关配置
        watch: false, // 默认不启用 watch 模式
        run: true, // 运行一次后退出
        bail: 1, // 遇到第一个失败的测试就停止
        // 可选：设置超时时间
        testTimeout: 10000, // 单个测试超时时间 10 秒
        hookTimeout: 10000, // hook 超时时间 10 秒
        deps: {
            inline: ['@tarojs/taro'],
        },
        include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'tests/', 'dist/', '**/*.d.ts', '**/*.config.*'],
        },
        typecheck: {
            include: ['tests/**/*.{test,spec}.{ts,tsx}'],
        },
    },
    resolve: {
        alias: {
            '@': '/Users/zhuwencan/work/phoenixcoder/phoenixcoder-miniapp/src',
            '@/components': '/Users/zhuwencan/work/phoenixcoder/phoenixcoder-miniapp/src/components',
            '@/pages': '/Users/zhuwencan/work/phoenixcoder/phoenixcoder-miniapp/src/pages',
            '@/utils': '/Users/zhuwencan/work/phoenixcoder/phoenixcoder-miniapp/src/utils',
            '@/redux': '/Users/zhuwencan/work/phoenixcoder/phoenixcoder-miniapp/src/redux',
        },
    },
    define: {
        'process.env.TARO_ENV': '"weapp"',
        'process.env.NODE_ENV': '"test"',
        'process.env.TARO_PLATFORM': '"weapp"',
        ENABLE_INNER_HTML: 'true',
        ENABLE_ADJACENT_HTML: 'true',
        ENABLE_SIZE_APIS: 'true',
        ENABLE_CLONE_NODE: 'true',
        ENABLE_TEMPLATE_CONTENT: 'true',
        ENABLE_MUTATION_OBSERVER: 'true',
        ENABLE_CONTAINS: 'true',
    },
});
