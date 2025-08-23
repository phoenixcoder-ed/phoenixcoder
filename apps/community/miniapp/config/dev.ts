import { defineConfig } from '@tarojs/cli'
import type { UserConfigExport } from '@tarojs/cli'

export default defineConfig({
    env: {
        NODE_ENV: '"development"',
    },
    defineConstants: {},
    weapp: {},
    h5: {
        devServer: {
            port: 8888,
        },
    },
} as UserConfigExport);
