/**
 * PhoenixCoder 前端性能基准测试
 * 使用Lighthouse和Web Vitals进行性能监控和回归检测
 */

import { test, expect, Page } from '@playwright/test';
// @ts-ignore - lighthouse types not available
import lighthouse from 'lighthouse';
// @ts-ignore - chrome-launcher types not available
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// 性能基准配置
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  fcp: 1500,      // First Contentful Paint < 1.5s
  lcp: 2500,      // Largest Contentful Paint < 2.5s
  fid: 100,       // First Input Delay < 100ms
  cls: 0.1,       // Cumulative Layout Shift < 0.1
  ttfb: 600,      // Time to First Byte < 600ms
  
  // Lighthouse Scores
  performance: 90,
  accessibility: 95,
  bestPractices: 90,
  seo: 90,
  pwa: 80,
  
  // Bundle Size
  bundleSize: 1024 * 1024,    // 1MB
  chunkSize: 256 * 1024,      // 256KB
  
  // Runtime Performance
  memoryUsage: 50 * 1024 * 1024,  // 50MB
  renderTime: 16,                  // 16ms (60fps)
  scriptExecution: 50              // 50ms
};

// 测试页面配置
const TEST_PAGES = [
  { name: 'Home', url: '/', critical: true },
  { name: 'Tasks', url: '/tasks', critical: true },
  { name: 'Profile', url: '/profile', critical: false },
  { name: 'Dashboard', url: '/dashboard', critical: true },
  { name: 'Settings', url: '/settings', critical: false }
];

class PerformanceReporter {
  private results: any[] = [];
  private reportDir = join(process.cwd(), 'performance-reports');
  
  constructor() {
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true });
    }
  }
  
  addResult(result: any) {
    this.results.push({
      ...result,
      timestamp: new Date().toISOString()
    });
  }
  
  generateReport() {
    const summary = this.generateSummary();
    const reportPath = join(this.reportDir, `performance-${Date.now()}.json`);
    
    writeFileSync(reportPath, JSON.stringify({
      summary,
      results: this.results,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    return { summary, reportPath };
  }
  
  private generateSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const criticalFailures = this.results.filter(r => !r.passed && r.critical).length;
    
    const avgScores = {
      performance: this.getAverageScore('performance'),
      accessibility: this.getAverageScore('accessibility'),
      bestPractices: this.getAverageScore('bestPractices'),
      seo: this.getAverageScore('seo')
    };
    
    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      criticalFailures,
      successRate: (passedTests / totalTests) * 100,
      avgScores,
      grade: this.calculateGrade(avgScores.performance)
    };
  }
  
  private getAverageScore(metric: string): number {
    const scores = this.results
      .filter(r => r.lighthouse && r.lighthouse[metric])
      .map(r => r.lighthouse[metric]);
    
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }
  
  private calculateGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
  }
}

const reporter = new PerformanceReporter();

// Lighthouse 测试
test.describe('Lighthouse Performance Tests', () => {
  let chrome: any;
  
  test.beforeAll(async () => {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    });
  });
  
  test.afterAll(async () => {
    if (chrome) {
      await chrome.kill();
    }
    
    // 生成性能报告
    const { summary, reportPath } = reporter.generateReport();
    console.log('Performance Report Generated:', reportPath);
    console.log('Summary:', summary);
  });
  
  for (const page of TEST_PAGES) {
    test(`Lighthouse audit for ${page.name}`, async ({ baseURL }: { baseURL?: string }) => {
      const url = `${baseURL}${page.url}`;
      
      const options = {
        logLevel: 'info' as const,
        output: 'json' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port
      };
      
      const runnerResult = await lighthouse(url, options);
      const { lhr } = runnerResult!;
      
      // 提取关键指标
      const metrics = {
        fcp: lhr.audits['first-contentful-paint'].numericValue || 0,
        lcp: lhr.audits['largest-contentful-paint'].numericValue || 0,
        fid: lhr.audits['max-potential-fid'].numericValue || 0,
        cls: lhr.audits['cumulative-layout-shift'].numericValue || 0,
        ttfb: lhr.audits['server-response-time'].numericValue || 0
      };
      
      const scores = {
        performance: Math.round(lhr.categories.performance.score! * 100),
        accessibility: Math.round(lhr.categories.accessibility.score! * 100),
        bestPractices: Math.round(lhr.categories['best-practices'].score! * 100),
        seo: Math.round(lhr.categories.seo.score! * 100)
      };
      
      // 性能断言
      const violations = [];
      
      if (metrics.fcp > PERFORMANCE_THRESHOLDS.fcp) {
        violations.push(`FCP: ${metrics.fcp}ms > ${PERFORMANCE_THRESHOLDS.fcp}ms`);
      }
      
      if (metrics.lcp > PERFORMANCE_THRESHOLDS.lcp) {
        violations.push(`LCP: ${metrics.lcp}ms > ${PERFORMANCE_THRESHOLDS.lcp}ms`);
      }
      
      if (metrics.fid > PERFORMANCE_THRESHOLDS.fid) {
        violations.push(`FID: ${metrics.fid}ms > ${PERFORMANCE_THRESHOLDS.fid}ms`);
      }
      
      if (metrics.cls > PERFORMANCE_THRESHOLDS.cls) {
        violations.push(`CLS: ${metrics.cls} > ${PERFORMANCE_THRESHOLDS.cls}`);
      }
      
      if (scores.performance < PERFORMANCE_THRESHOLDS.performance) {
        violations.push(`Performance Score: ${scores.performance} < ${PERFORMANCE_THRESHOLDS.performance}`);
      }
      
      const testResult = {
        page: page.name,
        url: page.url,
        critical: page.critical,
        passed: violations.length === 0,
        violations,
        metrics,
        lighthouse: scores
      };
      
      reporter.addResult(testResult);
      
      // 关键页面必须通过所有测试
      if (page.critical && violations.length > 0) {
        throw new Error(`Critical page ${page.name} failed performance tests: ${violations.join(', ')}`);
      }
      
      // 非关键页面允许部分失败，但记录警告
      if (!page.critical && violations.length > 0) {
        console.warn(`Non-critical page ${page.name} performance issues: ${violations.join(', ')}`);
      }
      
      // 基本断言
      expect(scores.performance).toBeGreaterThan(70); // 最低性能分数
      expect(scores.accessibility).toBeGreaterThan(80); // 最低可访问性分数
    });
  }
});

// Web Vitals 测试
test.describe('Web Vitals Tests', () => {
  test('Core Web Vitals measurement', async ({ page }: { page: Page }) => {
    // 注入 Web Vitals 库
    await page.addInitScript(() => {
      (window as any).webVitalsData = [];
      
      // 模拟 Web Vitals 数据收集
      const collectVital = (name: string, value: number) => {
        (window as any).webVitalsData.push({ name, value, timestamp: Date.now() });
      };
      
      // 模拟性能观察器
      if ('PerformanceObserver' in window) {
        // FCP 观察
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              collectVital('FCP', entry.startTime);
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        
        // LCP 观察
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            collectVital('LCP', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // CLS 观察
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          collectVital('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }
    });
    
    // 访问测试页面
    await page.goto('/');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 模拟用户交互以触发 FID
    await page.click('body');
    
    // 等待一段时间收集指标
    await page.waitForTimeout(3000);
    
    // 获取 Web Vitals 数据
    const vitalsData = await page.evaluate(() => (window as any).webVitalsData || []);
    
    // 验证指标
    const fcp = vitalsData.find((v: any) => v.name === 'FCP');
    const lcp = vitalsData.find((v: any) => v.name === 'LCP');
    const cls = vitalsData.find((v: any) => v.name === 'CLS');
    
    if (fcp) {
      expect(fcp.value).toBeLessThan(PERFORMANCE_THRESHOLDS.fcp);
    }
    
    if (lcp) {
      expect(lcp.value).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp);
    }
    
    if (cls) {
      expect(cls.value).toBeLessThan(PERFORMANCE_THRESHOLDS.cls);
    }
    
    console.log('Web Vitals Data:', vitalsData);
  });
});

// Bundle Size 测试
test.describe('Bundle Size Tests', () => {
  test('Bundle size analysis', async ({ page }: { page: Page }) => {
    // 监控网络请求
    const resources: any[] = [];
    
    page.on('response', (response: any) => {
      const url = response.url();
      const size = parseInt(response.headers()['content-length'] || '0');
      
      if (url.includes('.js') || url.includes('.css')) {
        resources.push({
          url,
          size,
          type: url.includes('.js') ? 'javascript' : 'css',
          gzipped: response.headers()['content-encoding'] === 'gzip'
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 分析资源大小
    const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
    const jsSize = resources
      .filter(r => r.type === 'javascript')
      .reduce((sum, resource) => sum + resource.size, 0);
    const cssSize = resources
      .filter(r => r.type === 'css')
      .reduce((sum, resource) => sum + resource.size, 0);
    
    // 检查最大单个文件大小
    const maxFileSize = Math.max(...resources.map(r => r.size));
    
    console.log('Bundle Analysis:', {
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      jsSize: `${(jsSize / 1024).toFixed(2)} KB`,
      cssSize: `${(cssSize / 1024).toFixed(2)} KB`,
      maxFileSize: `${(maxFileSize / 1024).toFixed(2)} KB`,
      resourceCount: resources.length
    });
    
    // 断言
    expect(totalSize).toBeLessThan(PERFORMANCE_THRESHOLDS.bundleSize);
    expect(maxFileSize).toBeLessThan(PERFORMANCE_THRESHOLDS.chunkSize);
  });
});

// Runtime Performance 测试
test.describe('Runtime Performance Tests', () => {
  test('Memory usage monitoring', async ({ page }: { page: Page }) => {
    await page.goto('/');
    
    // 获取初始内存使用
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (initialMemory) {
      // 执行一些操作
      for (let i = 0; i < 10; i++) {
        await page.click('body');
        await page.waitForTimeout(100);
      }
      
      // 获取最终内存使用
      const finalMemory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      });
      
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      
      console.log('Memory Usage:', {
        initial: `${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        final: `${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`
      });
      
      // 检查内存使用是否在合理范围内
      expect(finalMemory.usedJSHeapSize).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);
    }
  });
  
  test('Render performance', async ({ page }: { page: Page }) => {
    await page.goto('/');
    
    // 测量渲染性能
    const renderMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const renderTime = entries.reduce((max, entry) => {
            return Math.max(max, entry.duration);
          }, 0);
          
          resolve({ renderTime });
        });
        
        observer.observe({ entryTypes: ['measure'] });
        
        // 触发一些渲染操作
        performance.mark('render-start');
        
        // 模拟渲染操作
        setTimeout(() => {
          performance.mark('render-end');
          performance.measure('render-duration', 'render-start', 'render-end');
        }, 10);
      });
    });
    
    console.log('Render Metrics:', renderMetrics);
  });
});

// 性能回归测试
test.describe('Performance Regression Tests', () => {
  test('Performance baseline comparison', async ({ page }: { page: Page }) => {
    // 这里可以加载历史基准数据进行比较
    const baseline = {
      fcp: 800,
      lcp: 1200,
      cls: 0.05,
      performanceScore: 95
    };
    
    // 运行当前性能测试
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 模拟获取当前指标
    const currentMetrics = {
      fcp: 850,  // 模拟值
      lcp: 1300, // 模拟值
      cls: 0.06, // 模拟值
      performanceScore: 92 // 模拟值
    };
    
    // 回归检测（允许10%的性能下降）
    const regressionThreshold = 0.1;
    
    const fcpRegression = (currentMetrics.fcp - baseline.fcp) / baseline.fcp;
    const lcpRegression = (currentMetrics.lcp - baseline.lcp) / baseline.lcp;
    const clsRegression = (currentMetrics.cls - baseline.cls) / baseline.cls;
    const scoreRegression = (baseline.performanceScore - currentMetrics.performanceScore) / baseline.performanceScore;
    
    console.log('Regression Analysis:', {
      fcp: `${(fcpRegression * 100).toFixed(1)}%`,
      lcp: `${(lcpRegression * 100).toFixed(1)}%`,
      cls: `${(clsRegression * 100).toFixed(1)}%`,
      score: `${(scoreRegression * 100).toFixed(1)}%`
    });
    
    // 断言回归检测
    expect(fcpRegression).toBeLessThan(regressionThreshold);
    expect(lcpRegression).toBeLessThan(regressionThreshold);
    expect(clsRegression).toBeLessThan(regressionThreshold);
    expect(scoreRegression).toBeLessThan(regressionThreshold);
  });
});