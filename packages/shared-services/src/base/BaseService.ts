import { EventEmitter } from 'eventemitter3';
import type { IService } from '../interfaces/IService';
import type { ServiceConfig } from '../types/ServiceConfig';
import { ServiceError, ServiceErrorType } from '../types/ServiceError';
// import { LoggingService } from '../logging/LoggingService'; // 避免循环依赖

/**
 * 简单日志接口
 */
interface SimpleLogger {
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
}

/**
 * 简单日志实现
 */
class SimpleLoggerImpl implements SimpleLogger {
  constructor(private serviceName: string, private debugEnabled: boolean = false) {}

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (this.debugEnabled) {
      // eslint-disable-next-line no-console
      console.debug(`[${this.serviceName}] DEBUG: ${message}`, metadata || '');
    }
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.info(`[${this.serviceName}] INFO: ${message}`, metadata || '');
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.warn(`[${this.serviceName}] WARN: ${message}`, metadata || '');
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.error(`[${this.serviceName}] ERROR: ${message}`, metadata || '');
  }
}

/**
 * 基础服务类
 * 为所有服务提供通用的基础功能
 */
export abstract class BaseService extends EventEmitter implements IService {
  protected readonly config: ServiceConfig;
  protected readonly logger: SimpleLogger;
  protected isInitialized = false;
  protected isDestroyed = false;
  protected readonly serviceName: string;
  protected readonly version: string;
  protected startTime: Date;
  protected metrics: Map<string, unknown> = new Map();

  constructor(config: ServiceConfig, serviceName: string, version = '1.0.0') {
    super();
    this.config = config;
    this.serviceName = serviceName;
    this.version = version;
    this.logger = new SimpleLoggerImpl(serviceName, config.debug || false);
    this.startTime = new Date();
    
    // 绑定错误处理
    this.on('error', this.handleError.bind(this));
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Service already initialized', { service: this.serviceName });
      return;
    }

    if (this.isDestroyed) {
      throw new ServiceError({
          message: 'Cannot initialize destroyed service',
          code: 'SERVICE_DESTROYED',
          type: ServiceErrorType.BUSINESS_LOGIC,
          serviceName: this.serviceName,
          operation: 'initialize'
        });
    }

    try {
      this.logger.info('Initializing service', { service: this.serviceName });
      
      // 执行具体的初始化逻辑
      await this.onInitialize();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      this.logger.info('Service initialized successfully', { 
        service: this.serviceName,
        duration: Date.now() - this.startTime.getTime()
      });
    } catch (error) {
      this.logger.error('Failed to initialize service', {
        service: this.serviceName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new ServiceError({
        message: `Failed to initialize ${this.serviceName}: ${error instanceof Error ? error.message : String(error)}`,
        code: 'INITIALIZATION_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: this.serviceName,
        operation: 'initialize',
        innerError: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * 销毁服务
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      this.logger.warn('Service already destroyed', { service: this.serviceName });
      return;
    }

    try {
      this.logger.info('Destroying service', { service: this.serviceName });
      
      // 执行具体的销毁逻辑
      await this.onDestroy();
      
      this.isDestroyed = true;
      this.isInitialized = false;
      this.removeAllListeners();
      this.emit('destroyed');
      
      this.logger.info('Service destroyed successfully', { service: this.serviceName });
    } catch (error) {
      this.logger.error('Failed to destroy service', {
        service: this.serviceName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new ServiceError({
        message: `Failed to destroy ${this.serviceName}: ${error instanceof Error ? error.message : String(error)}`,
        code: 'DESTRUCTION_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: this.serviceName,
        operation: 'destroy',
        innerError: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * 检查服务健康状态
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: Record<string, unknown> }> {
    try {
      if (!this.isInitialized || this.isDestroyed) {
        return {
          status: 'unhealthy',
          details: {
            initialized: this.isInitialized,
            destroyed: this.isDestroyed,
            service: this.serviceName
          }
        };
      }

      // 执行具体的健康检查逻辑
      const healthDetails = await this.onHealthCheck();
      
      return {
        status: 'healthy',
        details: {
          service: this.serviceName,
          version: this.version,
          uptime: Date.now() - this.startTime.getTime(),
          ...healthDetails
        }
      };
    } catch (error) {
      this.logger.error('Health check failed', {
        service: this.serviceName,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        status: 'unhealthy',
        details: {
          service: this.serviceName,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

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
  } {
    return {
      name: this.serviceName,
      version: this.version,
      initialized: this.isInitialized,
      destroyed: this.isDestroyed,
      uptime: Date.now() - this.startTime.getTime(),
      startTime: this.startTime
    };
  }

  /**
   * 获取服务指标
   */
  getMetrics(): Record<string, unknown> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * 设置指标
   */
  protected setMetric(key: string, value: unknown): void {
    this.metrics.set(key, value);
    this.emit('metric', { key, value });
  }

  /**
   * 增加指标计数
   */
  protected incrementMetric(key: string, increment = 1): void {
    const current = this.metrics.get(key) || 0;
    this.setMetric(key, (current as number) + increment);
  }

  /**
   * 记录操作时间
   */
  protected recordTiming(key: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.setMetric(`${key}_duration`, duration);
    this.logger.debug('Operation timing recorded', {
      operation: key,
      duration,
      service: this.serviceName
    });
  }

  /**
   * 确保服务已初始化
   */
  protected ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new ServiceError({
        message: 'Service not initialized',
        code: 'SERVICE_NOT_INITIALIZED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: this.serviceName,
        operation: 'ensureInitialized'
      });
    }
    if (this.isDestroyed) {
      throw new ServiceError({
        message: 'Service is destroyed',
        code: 'SERVICE_DESTROYED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: this.serviceName,
        operation: 'ensureInitialized'
      });
    }
  }

  /**
   * 处理错误
   */
  protected handleError(error: Error): void {
    this.logger.error('Service error occurred', {
      service: this.serviceName,
      error: error.message,
      stack: error.stack
    });
    
    this.incrementMetric('errors');
  }

  /**
   * 执行带重试的操作
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
    backoff = 2
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          break;
        }
        
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        this.logger.warn('Operation failed, retrying', {
          service: this.serviceName,
          attempt,
          maxRetries,
          waitTime,
          error: lastError.message
        });
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw new ServiceError({
      message: `Operation failed after ${maxRetries} attempts: ${lastError!.message}`,
      code: 'RETRY_EXHAUSTED',
      type: ServiceErrorType.BUSINESS_LOGIC,
      serviceName: this.serviceName,
      operation: 'withRetry',
      innerError: lastError!
    });
  }

  /**
   * 执行带超时的操作
   */
  protected async withTimeout<T>(operation: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new ServiceError({
            message: `Timeout after ${timeout}ms`,
            code: 'OPERATION_TIMEOUT',
            type: ServiceErrorType.BUSINESS_LOGIC,
            serviceName: this.serviceName,
            innerError: new Error(`Operation timed out after ${timeout}ms`)
          }));
        }, timeout);
      })
    ]);
  }

  /**
   * 执行带缓存的操作
   */
  protected async withCache<T>(
    key: string,
    operation: () => Promise<T>,
    _ttl = 5 * 60 * 1000 // 5分钟
  ): Promise<T> {
    // 这里可以集成缓存服务
    // 暂时直接执行操作
    // TODO: 实现缓存逻辑，使用 key 和 _ttl 参数
    return operation();
  }

  // 具体方法，子类可以覆盖
  protected async onInitialize(): Promise<void> {
    await this.defaultOnInitialize();
  }

  protected async onDestroy(): Promise<void> {
    await this.defaultOnDestroy();
  }

  protected async onHealthCheck(): Promise<Record<string, unknown>> {
    return await this.defaultOnHealthCheck();
  }

  // 默认实现（子类可以覆盖）
  protected async defaultOnInitialize(): Promise<void> {
    // 默认初始化逻辑
  }

  protected async defaultOnDestroy(): Promise<void> {
    // 默认销毁逻辑
  }

  protected async defaultOnHealthCheck(): Promise<Record<string, unknown>> {
    // 默认健康检查逻辑
    return {};
  }

  // 静态方法
  static isService(obj: unknown): obj is BaseService {
    return obj instanceof BaseService;
  }

  static getServiceName(service: BaseService): string {
    return service.serviceName;
  }

  static getServiceVersion(service: BaseService): string {
    return service.version;
  }
}

/**
 * 服务装饰器
 */
export function Service(name: string, version = '1.0.0') {
  return function <T extends new (...args: any[]) => BaseService>(
    constructor: T
  ): T {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        Object.defineProperty(this, 'serviceName', {
          value: name,
          writable: false,
          enumerable: true,
          configurable: false
        });
        Object.defineProperty(this, 'version', {
          value: version,
          writable: false,
          enumerable: true,
          configurable: false
        });
      }
    };
  };
}

/**
 * 服务方法装饰器
 */
export function ServiceMethod(options: {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
} = {}) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (this: BaseService, ...args: unknown[]) {
      this.ensureInitialized();
      
      const startTime = Date.now();
      const methodName = `${this.serviceName}.${propertyKey}`;
      
      try {
        this.logger.debug('Service method called', {
          method: methodName,
          args: args.length
        });
        
        let operation = () => originalMethod.apply(this, args);
        
        // 应用重试
        if (options.retries && options.retries > 1) {
          operation = () => this.withRetry(operation, options.retries);
        }
        
        // 应用超时
        let result: unknown;
        if (options.timeout) {
          result = await this.withTimeout(operation(), options.timeout);
        } else {
          result = await operation();
        }
        
        this.recordTiming(methodName, startTime);
        this.incrementMetric(`${methodName}_calls`);
        
        return result;
      } catch (error) {
        this.incrementMetric(`${methodName}_errors`);
        this.logger.error('Service method failed', {
          method: methodName,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    };
    
    return descriptor;
  };
}