import path from 'path';
import { defineConfig } from '@tarojs/cli';
import type { UserConfigExport } from '@tarojs/cli';
import type { Compiler } from '@tarojs/taro';
import devConfig from './dev';
import prodConfig from './prod';

interface IDefineConfigParam {
    mode: string;
}

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
const baseConfig: UserConfigExport = {
    projectName: 'phoenixcoder-miniapp',
    date: '2025-8-6',
    designWidth: 750,
    alias: {
        '@': path.resolve(__dirname, '..', 'src'),
        '@/components': path.resolve(__dirname, '..', 'src/components'),
        '@/assets': path.resolve(__dirname, '..', 'src/assets'),
        '@/graphql': path.resolve(__dirname, '..', 'src/components'),
        '@/pages': path.resolve(__dirname, '..', 'src/pages'),
        '@/utils': path.resolve(__dirname, '..', 'src/utils'),
        '@/typed': path.resolve(__dirname, '..', 'src/typed'),
        '@/constants': path.resolve(__dirname, '..', 'src/constants'),
    },
    deviceRatio: {
        '640': 2.34 / 2,
        '750': 1,
        '828': 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    framework: 'react',
    compiler: 'vite',
    plugins: [
        '@tarojs/plugin-framework-react',
        '@tarojs/plugin-generator'
    ],
    platform: 'weapp',
    babel: {
        sourceMap: true,
        presets: [
            [
                'env',
                {
                    modules: false,
                },
            ],
        ],
        plugins: ['transform-decorators-legacy', 'transform-class-properties', 'transform-object-rest-spread'],
    },
    defineConstants: {},
    copy: {
        patterns: [],
        options: {},
    },
    weapp: {
        postcss: {
            pxtransform: {
                enable: true,
                config: {},
            },
            cssModules: {
                enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
                config: {
                    namingPattern: 'module', // 转换模式，取值为 global/module
                    generateScopedName: '[name]__[local]___[hash:base64:5]',
                },
            },
        },
        sass: {
            silenceDeprecations: ['mixed-decls', 'legacy-js-api'],
            quietDeps: true,
        },
    },
    h5: {
        publicPath: '/',
        staticDirectory: 'static',
        miniCssExtractPluginOption: {
            ignoreOrder: true,
            filename: 'css/[name].[hash].css',
            chunkFilename: 'css/[name].[chunkhash].css',
        },
        postcss: {
            autoprefixer: {
                enable: true,
                config: {},
            },
            cssModules: {
                enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
                config: {
                    namingPattern: 'module', // 转换模式，取值为 global/module
                    generateScopedName: '[name]__[local]___[hash:base64:5]',
                },
            },
        },
    },
    rn: {
        appName: 'taroDemo',
        postcss: {
            cssModules: {
                enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
            },
        },
    },
};

export default defineConfig(({ mode }: IDefineConfigParam) => {
    if (mode === 'development') {
        return {
            ...baseConfig,
            ...devConfig,
        };
    }
    return {
        ...baseConfig,
        ...prodConfig,
    };
});
