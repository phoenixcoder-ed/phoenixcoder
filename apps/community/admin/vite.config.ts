import { defineConfig, loadEnv } from 'vite';
import react from "@vitejs/plugin-react";
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_APP_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      testMatch: ['**/*.test.tsx'],
      coverage: {
        provider: 'istanbul',
        reporter: ['text', 'json', 'html'],
      },
      globals: true,
    },
    build: {
      sourcemap: mode === "development" || mode === "test",
      minify: mode === "prod",
      rollupOptions: {
        output: {
          manualChunks: {
            // 将React相关库分离到单独的chunk
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // 将UI库分离到单独的chunk
            'ui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            // 将状态管理库分离到单独的chunk
            'state-vendor': ['@reduxjs/toolkit', 'react-redux', 'zustand', '@tanstack/react-query'],
            // 将工具库分离到单独的chunk
            'utils-vendor': ['axios', 'react-quill'],
          },
          chunkFileNames: (chunkInfo) => {
             const facadeModuleId = chunkInfo.facadeModuleId
               ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^.]*$/, '') || 'chunk'
               : 'chunk';
             return `js/${facadeModuleId}-[hash].js`;
           },
        },
      },
      chunkSizeWarningLimit: 1000, // 提高警告阈值到1000kb
    },
    base: "./",
    // 只暴露必要的环境变量，而不是整个process.env对象
    define: {
      'import.meta.env.VITE_APP_API_URL': JSON.stringify(env.VITE_APP_API_URL),
    },
  };
});
