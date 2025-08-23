import { NavigateFunction } from 'react-router-dom';

import { setupHttpInterceptor } from './httpInterceptor';

/**
 * 应用初始化器
 * 负责设置全局配置和拦截器
 */
export class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  /**
   * 初始化应用
   * @param navigate React Router 导航函数
   */
  public initialize(navigate: NavigateFunction): void {
    if (this.isInitialized) {
      return;
    }

    try {
      // 设置HTTP拦截器
      setupHttpInterceptor(navigate);

      // 设置全局错误处理
      this.setupGlobalErrorHandlers();

      // 设置性能监控
      this.setupPerformanceMonitoring();

      this.isInitialized = true;
      console.log('应用初始化完成');
    } catch (initError) {
      console.error('应用初始化失败:', initError);
      throw initError;
    }
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandlers(): void {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      console.error('未处理的Promise拒绝:', event.reason);
      // 可以在这里添加错误上报逻辑
    });

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      console.error('全局JavaScript错误:', event.error);
      // 可以在这里添加错误上报逻辑
    });
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    // 监控页面加载性能
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType(
            'navigation'
          )[0] as PerformanceNavigationTiming;
          if (perfData) {
            console.log('页面加载性能:', {
              domContentLoaded:
                perfData.domContentLoadedEventEnd -
                perfData.domContentLoadedEventStart,
              loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
              totalTime: perfData.loadEventEnd - perfData.fetchStart,
            });
          }
        }, 0);
      });
    }
  }

  /**
   * 重置初始化状态（主要用于测试）
   */
  public reset(): void {
    this.isInitialized = false;
  }
}

export default AppInitializer;
