/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  
  test: {
    // 测试环境配置
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    
    // 测试文件匹配规则
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'coverage',
      'build'
    ],
    
    // 超时和重试配置
    testTimeout: 10000,
    hookTimeout: 10000,
    retry: 2,
    
    // 并行测试配置
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
        minThreads: 1,
        maxThreads: 4
      }
    },
    
    // 依赖配置
    deps: {
      optimizer: {
        web: {
          include: ['@testing-library/react', '@testing-library/jest-dom']
        }
      }
    },
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/vite-env.d.ts',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.{js,ts}',
        'src/main.tsx',
        'src/App.tsx'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75
        }
      },
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      skipFull: false
    },
    
    // 报告配置
    reporters: [
      'default',
      'verbose',
      'json',
      'html',
      'junit'
    ],
    outputFile: {
      json: './test-reports/test-results.json',
      html: './test-reports/test-results.html',
      junit: './test-reports/junit.xml'
    },
    
    // 监听模式配置已在 exclude 中处理
    
    // 快照配置
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace('/src/', '/src/__snapshots__/') + snapExtension
    },
    
    // 模拟配置
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    
    // 性能配置
    logHeapUsage: true,
    
    // 自定义匹配器 - 在 Vitest 4.0 中已移除 setupFilesAfterEnv
    // setupFilesAfterEnv: ['./tests/setup-after-env.ts']
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/services': resolve(__dirname, './src/services'),
      '@/types': resolve(__dirname, './src/types'),
      '@/store': resolve(__dirname, './src/store'),
      '@/assets': resolve(__dirname, './src/assets'),
      '@/constants': resolve(__dirname, './src/constants'),
      '@/config': resolve(__dirname, './src/config')
    }
  },
  
  define: {
    __DEV__: true,
    __TEST__: true,
    __PROD__: false,
    'import.meta.env.VITE_APP_API_URL': JSON.stringify('http://localhost:8001'),
    'import.meta.env.MODE': JSON.stringify('test'),
    'import.meta.env.DEV': true,
    'import.meta.env.PROD': false
  },
  
  // 优化配置
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event'
    ]
  }
})