import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.e2e' });

/**
 * PhoenixCoder E2E测试配置
 * 
 * 该配置文件定义了Playwright测试的运行环境、浏览器设置、
 * 测试超时、重试策略等参数。
 */
export default defineConfig({
  // 测试目录
  testDir: './tests',
  
  // 全局超时设置
  timeout: 30 * 1000, // 30秒
  expect: {
    timeout: 5 * 1000, // 5秒
  },
  
  // 测试运行配置
  fullyParallel: true, // 完全并行运行
  forbidOnly: !!process.env.CI, // CI环境禁用.only
  retries: process.env.CI ? 2 : 0, // CI环境重试2次
  workers: process.env.CI ? 1 : undefined, // CI环境单线程
  
  // 报告配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // 输出目录
  outputDir: 'test-results/',
  
  // 全局设置
  use: {
    // 基础URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // 浏览器设置
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // 录制设置
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // 网络设置
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },
  
  // 项目配置 - 多浏览器测试
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // 移动端测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // 平板测试
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],
  
  // Web服务器配置（可选）
  webServer: process.env.CI ? undefined : [
    {
      command: 'cd ../../apps/community/server && python main.py',
      port: 8000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../../apps/community/admin && pnpm run preview',
      port: 3000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});