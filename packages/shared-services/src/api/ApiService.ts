import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ValidationError, TimeoutError, NetworkError, ServiceErrorType } from '../types/ServiceError';
import { ApiConfig } from '../types/ServiceConfig';
import { SERVICE_EVENTS, HTTP_METHODS } from '../types/ServiceConstants';
import type { ApiResponse as SharedApiResponse } from '@phoenixcoder/shared-types';
import type { RequestConfig, HttpMethod } from '@phoenixcoder/shared-utils';
import { ApiClient } from '@phoenixcoder/shared-utils';
import { EventEmitter } from 'eventemitter3';

/**
 * API 请求选项接口
 */
export interface ApiRequestOptions {
  method?: string;
  url?: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'text' | 'arrayBuffer';
  timeout?: number;
  skipAuth?: boolean;
  skipCache?: boolean;
  retries?: number;
  retryDelay?: number;
  cacheTtl?: number;
  onUploadProgress?: (progress: number) => void;
  onDownloadProgress?: (progress: number) => void;
}

/**
 * API 响应接口 - 扩展 shared-types 中的 ApiResponse
 */
export interface ApiResponse<T = unknown> extends SharedApiResponse<T> {
  config?: ApiRequestOptions;
}

/**
 * API 事件接口
 */
export interface ApiEvents {
  'api:request': (config: ApiRequestOptions) => void;
  'api:response': (response: ApiResponse) => void;
  'api:error': (error: ServiceError) => void;
  'api:retry': (attempt: number, config: ApiRequestOptions) => void;
}

/**
 * API 服务类
 */
export class ApiService extends BaseService implements IService {
  private apiClient: ApiClient;
  private eventEmitter: EventEmitter<ApiEvents>;
  private requestCache: Map<string, { data: unknown; timestamp: number; ttl: number }>;
  private pendingRequests: Map<string, Promise<ApiResponse>>;

  constructor(config: ApiConfig) {
    super(config, 'ApiService', '1.0.0');
    
    this.apiClient = new ApiClient(
      config.baseURL,
      config.defaultHeaders
    );

    this.eventEmitter = new EventEmitter();
    this.requestCache = new Map();
    this.pendingRequests = new Map();
    
    this.setupInterceptors();
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 清理过期缓存
    this.startCacheCleanup();
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    this.requestCache.clear();
    this.pendingRequests.clear();
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiClient.get('/health');
      return {
        success: response.success,
        status: response.success ? 'healthy' : 'unhealthy',
        endpoint: '/health',
        responseTime: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        endpoint: '/health',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * GET 请求
   */
  async get<T = unknown>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: HTTP_METHODS.GET, url });
  }

  /**
   * POST 请求
   */
  async post<T = unknown>(url: string, data?: unknown, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: HTTP_METHODS.POST, url, data });
  }

  /**
   * PUT 请求
   */
  async put<T = unknown>(url: string, data?: unknown, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: HTTP_METHODS.PUT, url, data });
  }

  /**
   * PATCH 请求
   */
  async patch<T = unknown>(url: string, data?: unknown, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: HTTP_METHODS.PATCH, url, data });
  }

  /**
   * DELETE 请求
   */
  async delete<T = unknown>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: HTTP_METHODS.DELETE, url });
  }

  /**
   * HEAD 请求
   */
  async head<T = unknown>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: HTTP_METHODS.HEAD, url });
  }

  /**
   * OPTIONS 请求
   */
  async options<T = unknown>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: HTTP_METHODS.OPTIONS, url });
  }

  /**
   * 通用请求方法
   */
  async request<T = unknown>(config: ApiRequestOptions): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(config);
    
    // 检查缓存
    if (!config.skipCache && config.method === HTTP_METHODS.GET) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 检查是否有相同的请求正在进行
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<ApiResponse<T>>;
    }

    // 创建请求Promise
    const requestPromise = this.executeRequest<T>(config);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;
      
      // 缓存GET请求的响应
      if (!config.skipCache && config.method === HTTP_METHODS.GET) {
        this.setCache(cacheKey, response, config.cacheTtl || 300000); // 默认5分钟
      }

      return response;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * 执行请求
   */
  private async executeRequest<T>(config: ApiRequestOptions): Promise<ApiResponse<T>> {
    const maxRetries = config.retries || 3;
    const retryDelay = config.retryDelay || 1000;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.eventEmitter.emit('api:request', config);
        this.emit(SERVICE_EVENTS.API_REQUEST, { config });

        const requestConfig: RequestConfig = {
          method: (config.method || 'GET') as HttpMethod,
          headers: config.headers,
          body: config.data,
          timeout: config.timeout
        };
        const response = await this.apiClient.request(config.url || '', requestConfig);
        const apiResponse: ApiResponse<T> = {
          data: response.data as T,
          success: response.success,
          message: response.message,
          error: response.error,
          config
        };

        this.eventEmitter.emit('api:response', apiResponse);
        this.emit(SERVICE_EVENTS.API_RESPONSE, {
          success: apiResponse.success,
          message: apiResponse.message,
          data: apiResponse.data
        });

        return apiResponse;
      } catch (error) {
        lastError = error as Error;
        
        // 判断是否应该重试
        if (attempt < maxRetries && this.shouldRetry(error, attempt)) {
          this.eventEmitter.emit('api:retry', attempt + 1, config);
          this.emit(SERVICE_EVENTS.API_RETRY, { attempt: attempt + 1, config });
          
          // 等待重试延迟
          await this.delay(retryDelay * Math.pow(2, attempt)); // 指数退避
          continue;
        }
        
        break;
      }
    }

    // 转换错误类型
    const serviceError = this.convertError(lastError!);
    this.eventEmitter.emit('api:error', serviceError);
    this.emit(SERVICE_EVENTS.API_ERROR, { error: serviceError });
    
    throw serviceError;
  }

  /**
   * 批量请求
   */
  async batch<T = unknown>(requests: ApiRequestOptions[]): Promise<ApiResponse<T>[]> {
    const promises = requests.map(config => this.request<T>(config));
    return Promise.all(promises);
  }

  /**
   * 并发请求（限制并发数）
   */
  async concurrent<T = unknown>(requests: ApiRequestOptions[], concurrency: number = 5): Promise<ApiResponse<T>[]> {
    const results: ApiResponse<T>[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < requests.length; i++) {
      const promise = this.request<T>(requests[i]).then(response => {
        results[i] = response;
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * 上传文件
   */
  async uploadFile(
    url: string,
    file: File | Blob,
    options: ApiRequestOptions & {
      fieldName?: string;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append(options.fieldName || 'file', file);

    return this.request({
      ...options,
      method: HTTP_METHODS.POST,
      url,
      data: formData,
      headers: {
        ...options.headers,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: options.onProgress
    });
  }

  /**
   * 下载文件
   */
  async downloadFile(
    url: string,
    options: ApiRequestOptions & {
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<ApiResponse<Blob>> {
    return this.request<Blob>({
      ...options,
      method: HTTP_METHODS.GET,
      url,
      responseType: 'blob',
      onDownloadProgress: options.onProgress
    });
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.requestCache.keys()) {
        if (regex.test(key)) {
          this.requestCache.delete(key);
        }
      }
    } else {
      this.requestCache.clear();
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys())
    };
  }

  /**
   * 监听API事件
   */
  onApiEvent<K extends keyof ApiEvents>(event: K, listener: ApiEvents[K]): void {
    this.eventEmitter.on(event, listener as (...args: unknown[]) => void);
  }

  /**
   * 移除API事件监听
   */
  offApiEvent<K extends keyof ApiEvents>(event: K, listener: ApiEvents[K]): void {
    this.eventEmitter.off(event, listener as (...args: unknown[]) => void);
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(config: ApiRequestOptions): string {
    const { method = 'GET', url, params, data } = config;
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<T>(key: string): ApiResponse<T> | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as ApiResponse<T>;
    }
    if (cached) {
      this.requestCache.delete(key);
    }
    return null;
  }

  /**
   * 设置缓存
   */
  private setCache<T>(key: string, data: ApiResponse<T>, ttl: number): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: unknown, _attempt: number): boolean {
    // 网络错误或5xx服务器错误可以重试
    const err = error as { code?: string; response?: { status?: number } };
    if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') {
      return true;
    }
    
    if (err.response) {
      const status = err.response.status;
      // 5xx服务器错误可以重试
      if (status && status >= 500 && status < 600) {
        return true;
      }
      // 429 限流错误可以重试
      if (status === 429) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 转换错误类型
   */
  private convertError(error: unknown): ServiceError {
    const err = error as { 
      code?: string; 
      message?: string;
      response?: { 
        status?: number;
        message?: string;
        error?: { code?: string };
      };
    };
    
    if (err.code === 'TIMEOUT') {
      return new TimeoutError('请求超时', 30000, 'ApiService');
    }
    
    if (err.code === 'NETWORK_ERROR') {
      return new NetworkError('网络错误', 'ApiService');
    }
    
    if (err.response) {
      const message = err.response.message || err.message || '未知错误';
      
      if (err.response.error?.code) {
        return new ValidationError(message, [{ field: 'response', message, code: err.response.error.code }], 'ApiService');
      }
      
      return new NetworkError(`HTTP错误: ${message}`, 'ApiService');
    }
    
    return new ServiceError({
      message: 'API请求失败',
      code: 'API_ERROR',
      type: ServiceErrorType.UNKNOWN,
      serviceName: 'ApiService'
    });
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.apiClient.addRequestInterceptor((config) => {
      // 添加请求ID用于追踪
      config.headers = config.headers || {};
      config.headers['X-Request-ID'] = this.generateRequestId();
      
      return config;
    });

    // 响应拦截器
    this.apiClient.addResponseInterceptor((response) => {
      // 记录响应时间
      if (this.config.debug) {
        // eslint-disable-next-line no-console
        console.log('[ApiService] Response received');
      }
      
      return response;
    });

    // 错误拦截器
    this.apiClient.addErrorInterceptor((error: Error) => {
      // 记录错误
      if (this.config.debug) {
        // eslint-disable-next-line no-console
        console.log('[ApiService] Error occurred:', error);
      }
      return error;
    });
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录指标
   */
  private recordMetric(name: string, value: number): void {
    // 这里可以集成监控系统，如 Prometheus、DataDog 等
    // 目前只是简单记录到控制台
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log(`[ApiService] Metric: ${name} = ${value}`);
    }
  }

  /**
   * 启动缓存清理
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.requestCache.entries()) {
        if (now - cached.timestamp >= cached.ttl) {
          this.requestCache.delete(key);
        }
      }
    }, 60000); // 每分钟清理一次
  }
}

/**
 * 创建API服务实例
 */
export function createApiService(config: ApiConfig): ApiService {
  return new ApiService(config);
}

/**
 * 默认API服务实例
 */
let defaultApiService: ApiService | null = null;

/**
 * 获取默认API服务实例
 */
export function getApiService(): ApiService {
  if (!defaultApiService) {
    throw new Error('API service not initialized. Call initApiService first.');
  }
  return defaultApiService;
}

/**
 * 初始化默认API服务
 */
export function initApiService(config: ApiConfig): ApiService {
  defaultApiService = new ApiService(config);
  return defaultApiService;
}

/**
 * 销毁默认API服务
 */
export async function destroyApiService(): Promise<void> {
  if (defaultApiService) {
    await defaultApiService.destroy();
    defaultApiService = null;
  }
}