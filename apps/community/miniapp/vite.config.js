import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // 尝试将react-native别名到空模块
            'react-native': path.resolve(__dirname, 'src/mocks/react-native.js'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: ['mixed-decls', 'legacy-js-api', 'import'],
                quietDeps: true,
                api: 'modern-compiler',
            },
        },
    },
    optimizeDeps: {
        exclude: ['react-native'],
    },
});