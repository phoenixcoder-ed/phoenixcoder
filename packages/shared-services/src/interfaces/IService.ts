/**
 * 基础服务接口
 * 定义所有服务必须实现的基本方法
 */
export interface IService {
  /**
   * 初始化服务
   */
  initialize(): Promise<void>;

  /**
   * 销毁服务
   */
  destroy(): Promise<void>;

  /**
   * 健康检查
   */
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>;

  /**
   * 获取服务信息
   */
  getInfo(): {
    name: string;
    version: string;
    initialized: boolean;
    destroyed: boolean;
    uptime: number;
    startTime: Date;
  };

  /**
   * 获取服务指标
   */
  getMetrics(): Record<string, any>;
}

/**
 * 可配置服务接口
 */
export interface IConfigurableService extends IService {
  /**
   * 更新配置
   */
  updateConfig(config: Partial<any>): Promise<void>;

  /**
   * 获取当前配置
   */
  getConfig(): any;
}

/**
 * 可缓存服务接口
 */
export interface ICacheableService extends IService {
  /**
   * 清除缓存
   */
  clearCache(pattern?: string): Promise<void>;

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };
}

/**
 * 可监控服务接口
 */
export interface IMonitorableService extends IService {
  /**
   * 开始监控
   */
  startMonitoring(): void;

  /**
   * 停止监控
   */
  stopMonitoring(): void;

  /**
   * 获取监控数据
   */
  getMonitoringData(): any;
}

/**
 * 可扩展服务接口
 */
export interface IExtensibleService extends IService {
  /**
   * 注册插件
   */
  registerPlugin(name: string, plugin: any): void;

  /**
   * 卸载插件
   */
  unregisterPlugin(name: string): void;

  /**
   * 获取已注册的插件
   */
  getPlugins(): Record<string, any>;
}

/**
 * 服务生命周期接口
 */
export interface IServiceLifecycle {
  /**
   * 服务启动前
   */
  onBeforeStart?(): Promise<void>;

  /**
   * 服务启动后
   */
  onAfterStart?(): Promise<void>;

  /**
   * 服务停止前
   */
  onBeforeStop?(): Promise<void>;

  /**
   * 服务停止后
   */
  onAfterStop?(): Promise<void>;

  /**
   * 服务错误处理
   */
  onError?(error: Error): Promise<void>;
}

/**
 * 服务依赖接口
 */
export interface IServiceDependency {
  /**
   * 获取依赖的服务名称列表
   */
  getDependencies(): string[];

  /**
   * 检查依赖是否满足
   */
  checkDependencies(): Promise<boolean>;

  /**
   * 等待依赖就绪
   */
  waitForDependencies(timeout?: number): Promise<void>;
}

/**
 * 服务事件接口
 */
export interface IServiceEvents {
  /**
   * 监听事件
   */
  on(event: string, listener: (...args: any[]) => void): void;

  /**
   * 移除事件监听
   */
  off(event: string, listener: (...args: any[]) => void): void;

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): boolean;

  /**
   * 一次性事件监听
   */
  once(event: string, listener: (...args: any[]) => void): void;
}

/**
 * 服务状态枚举
 */
export enum ServiceStatus {
  CREATED = 'created',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
  DESTROYED = 'destroyed'
}

/**
 * 服务优先级枚举
 */
export enum ServicePriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3
}

/**
 * 服务类型枚举
 */
export enum ServiceType {
  CORE = 'core',
  BUSINESS = 'business',
  UTILITY = 'utility',
  EXTERNAL = 'external',
  PLUGIN = 'plugin'
}