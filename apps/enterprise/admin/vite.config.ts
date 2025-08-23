import { defineConfig, loadEnv } from 'vite';
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
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
    },
    base: "./",
    // 只暴露必要的环境变量，而不是整个process.env对象
    define: {
      'import.meta.env.VITE_APP_API_URL': JSON.stringify(env.VITE_APP_API_URL),
    },
  };
});
