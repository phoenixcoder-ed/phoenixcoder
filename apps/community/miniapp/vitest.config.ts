import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // 测试环境配置
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    
    // 测试文件匹配规则
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
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
    timeout: 15000,
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
      inline: [
        '@tarojs/taro', 
        '@tarojs/components',
        '@tarojs/runtime',
        '@phoenixcoder/shared-miniapp'
      ],
      external: ['canvas']
    },
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.{js,ts}',
        'src/app.config.ts',
        'src/app.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      },
      all: true,
      skipFull: false
    },
    
    // 报告配置
    reporter: [
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
    
    // 监听模式配置
    watch: true,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ],
    
    // 快照配置
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace('/tests/', '/tests/__snapshots__/') + snapExtension
    },
    
    // 模拟配置
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    
    // 性能配置
    logHeapUsage: true,
    
    // 自定义匹配器
    setupFilesAfterEnv: ['./tests/setup-after-env.ts']
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/assets': resolve(__dirname, './src/assets'),
      '@/store': resolve(__dirname, './src/store'),
      '@/types': resolve(__dirname, './src/types'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/services': resolve(__dirname, './src/services'),
      '@/constants': resolve(__dirname, './src/constants'),
      '@/config': resolve(__dirname, './src/config')
    }
  },
  
  define: {
    __DEV__: true,
    __TEST__: true,
    __PROD__: false,
    process: {
      env: {
        TARO_ENV: 'h5',
        NODE_ENV: 'test'
      }
    }
  },
  
  // 优化配置
  optimizeDeps: {
    include: [
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event'
    ]
  }
})
