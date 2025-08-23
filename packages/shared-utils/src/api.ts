import type { ApiResponse, ApiError } from '@phoenixcoder/shared-types';

// HTTP 方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// 请求配置接口
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  keepalive?: boolean;
  mode?: RequestMode;
}

// 响应拦截器类型
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ErrorInterceptor = (error: Error) => Error | Promise<Error>;

// API 客户端类
export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
    this.defaultTimeout = 10000; // 10秒
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  // 添加错误拦截器
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  // 设置默认头部
  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  // 移除默认头部
  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  // 设置认证令牌
  setAuthToken(token: string, type: string = 'Bearer'): void {
    this.setDefaultHeader('Authorization', `${type} ${token}`);
  }

  // 移除认证令牌
  removeAuthToken(): void {
    this.removeDefaultHeader('Authorization');
  }

  // 构建完整URL
  private buildURL(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    const baseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    const path = url.startsWith('/') ? url : `/${url}`;
    
    return `${baseURL}${path}`;
  }

  // 应用请求拦截器
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let result = config;
    
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result);
    }
    
    return result;
  }

  // 应用响应拦截器
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let result = response;
    
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result);
    }
    
    return result;
  }

  // 应用错误拦截器
  private async applyErrorInterceptors(error: Error): Promise<Error> {
    let result = error;
    
    for (const interceptor of this.errorInterceptors) {
      result = await interceptor(result);
    }
    
    return result;
  }

  // 核心请求方法
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    try {
      // 应用请求拦截器
      const processedConfig = await this.applyRequestInterceptors(config);
      
      // 构建请求配置
      const requestConfig: RequestInit = {
        method: processedConfig.method || 'GET',
        headers: {
          ...this.defaultHeaders,
          ...processedConfig.headers,
        },
        signal: processedConfig.signal,
        credentials: processedConfig.credentials,
        cache: processedConfig.cache,
        redirect: processedConfig.redirect,
        referrer: processedConfig.referrer,
        referrerPolicy: processedConfig.referrerPolicy,
        integrity: processedConfig.integrity,
        keepalive: processedConfig.keepalive,
        mode: processedConfig.mode,
      };

      // 处理请求体
      if (processedConfig.body && processedConfig.method !== 'GET' && processedConfig.method !== 'HEAD') {
        if (typeof processedConfig.body === 'object' && !(processedConfig.body instanceof FormData)) {
          requestConfig.body = JSON.stringify(processedConfig.body);
        } else {
          requestConfig.body = processedConfig.body;
        }
      }

      // 设置超时
      const timeout = processedConfig.timeout || this.defaultTimeout;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (!requestConfig.signal) {
        requestConfig.signal = controller.signal;
      }

      try {
        // 发送请求
        let response = await fetch(this.buildURL(url), requestConfig);
        clearTimeout(timeoutId);

        // 应用响应拦截器
        response = await this.applyResponseInterceptors(response);

        // 解析响应
        const data = await this.parseResponse<T>(response);

        if (!response.ok) {
          const error: ApiError = {
            code: response.status.toString(),
            message: response.statusText,
            details: data as Record<string, any>,
          };
          
          return {
            success: false,
            error,
          };
        }

        return {
          success: true,
          data,
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      const processedError = await this.applyErrorInterceptors(error as Error);
      
      const apiError: ApiError = {
        code: 'NETWORK_ERROR',
        message: processedError.message,
        details: processedError as Record<string, any>,
      };

      return {
        success: false,
        error: apiError,
      };
    }
  }

  // 解析响应
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType?.includes('text/')) {
      return await response.text() as T;
    }
    
    if (contentType?.includes('application/octet-stream') || contentType?.includes('application/pdf')) {
      return await response.blob() as T;
    }
    
    return await response.text() as T;
  }

  // HTTP 方法快捷方式
  async get<T = any>(url: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T = any>(url: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  async put<T = any>(url: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  async patch<T = any>(url: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }

  async delete<T = any>(url: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  async head(url: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<void>> {
    return this.request<void>(url, { ...config, method: 'HEAD' });
  }

  async options(url: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<void>> {
    return this.request<void>(url, { ...config, method: 'OPTIONS' });
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient();

// 重试机制
export const withRetry = async <T>(
  fn: () => Promise<ApiResponse<T>>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<ApiResponse<T>> => {
  let lastError: ApiError | undefined = undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      
      // 如果是客户端错误（4xx），不重试
      if (result.error?.code && result.error.code.startsWith('4')) {
        return result;
      }
      
      if (attempt < maxRetries) {
        await sleep(delay * Math.pow(2, attempt)); // 指数退避
      }
    } catch (error) {
      lastError = {
        code: 'RETRY_ERROR',
        message: (error as Error).message,
        details: error as Record<string, any>,
      };
      
      if (attempt < maxRetries) {
        await sleep(delay * Math.pow(2, attempt));
      }
    }
  }
  
  return {
    success: false,
    error: lastError || { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' },
  };
};

// 并发请求
export const concurrent = async <T>(
  requests: (() => Promise<ApiResponse<T>>)[]
): Promise<ApiResponse<T>[]> => {
  return Promise.all(requests.map(request => request()));
};

// 串行请求
export const sequential = async <T>(
  requests: (() => Promise<ApiResponse<T>>)[]
): Promise<ApiResponse<T>[]> => {
  const results: ApiResponse<T>[] = [];
  
  for (const request of requests) {
    const result = await request();
    results.push(result);
  }
  
  return results;
};

// 请求缓存
class ApiRequestCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000): void { // 默认5分钟
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const requestCache = new ApiRequestCache();

// 带缓存的请求
export const withCache = async <T>(
  key: string,
  fn: () => Promise<ApiResponse<T>>,
  ttl?: number
): Promise<ApiResponse<T>> => {
  const cached = requestCache.get(key);
  
  if (cached) {
    return {
      success: true,
      data: cached,
    };
  }
  
  const result = await fn();
  
  if (result.success && result.data) {
    requestCache.set(key, result.data, ttl);
  }
  
  return result;
};

// URL 构建工具
export const buildURL = (base: string, path: string, params?: Record<string, any>): string => {
  const baseURL = base.endsWith('/') ? base.slice(0, -1) : base;
  const pathname = path.startsWith('/') ? path : `/${path}`;
  let url = `${baseURL}${pathname}`;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
};

// 查询参数处理
export const parseQueryString = (queryString: string): Record<string, string | string[]> => {
  const params: Record<string, string | string[]> = {};
  const searchParams = new URLSearchParams(queryString);
  
  for (const [key, value] of searchParams.entries()) {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  }
  
  return params;
};

export const stringifyQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
};

// 文件上传
export const uploadFile = async (
  url: string,
  file: File,
  options: {
    fieldName?: string;
    additionalFields?: Record<string, string>;
    onProgress?: (progress: number) => void;
    signal?: AbortSignal;
  } = {}
): Promise<ApiResponse<any>> => {
  const {
    fieldName = 'file',
    additionalFields = {},
    onProgress,
    signal,
  } = options;
  
  const formData = new FormData();
  formData.append(fieldName, file);
  
  Object.entries(additionalFields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  // 如果支持进度回调，使用 XMLHttpRequest
  if (onProgress) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
      
      xhr.addEventListener('load', async () => {
        try {
          const data = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: true,
              data,
            });
          } else {
            resolve({
              success: false,
              error: {
                code: xhr.status.toString(),
                message: xhr.statusText,
                details: data as Record<string, any>,
              },
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: 'Failed to parse response',
              details: error as Record<string, any>,
            },
          });
        }
      });
      
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Upload failed',
            details: undefined,
          },
        });
      });
      
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          resolve({
            success: false,
            error: {
              code: 'ABORTED',
              message: 'Upload aborted',
              details: undefined,
            },
          });
        });
      }
      
      xhr.open('POST', url);
      xhr.send(formData);
    });
  }
  
  // 使用 fetch API
  return apiClient.post(url, formData, { signal });
};

// 下载文件
export const downloadFile = async (
  url: string,
  filename?: string,
  options: {
    signal?: AbortSignal;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<void> => {
  const { signal, onProgress } = options;
  
  const response = await fetch(url, { signal });
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }
  
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get response reader');
  }
  
  const chunks: BlobPart[] = [];
  let loaded = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;
    
    chunks.push(value);
    loaded += value.length;
    
    if (onProgress && total > 0) {
      onProgress((loaded / total) * 100);
    }
  }
  
  const blob = new Blob(chunks);
  const downloadUrl = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(downloadUrl);
};

// 工具函数
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 常用的请求拦截器
export const authInterceptor = (token: string, type: string = 'Bearer'): RequestInterceptor => {
  return (config) => {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `${type} ${token}`,
      },
    };
  };
};

export const loggingInterceptor: RequestInterceptor = (config) => {
  console.log('API Request:', config);
  return config;
};

// 常用的响应拦截器
export const responseLoggingInterceptor: ResponseInterceptor = (response) => {
  console.log('API Response:', response);
  return response;
};

// 常用的错误拦截器
export const errorLoggingInterceptor: ErrorInterceptor = (error) => {
  console.error('API Error:', error);
  return error;
};

// API 状态码常量
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// 内容类型常量
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  PDF: 'application/pdf',
  OCTET_STREAM: 'application/octet-stream',
} as const;