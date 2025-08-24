/**
 * HTTP 响应错误详情
 */
export interface HttpErrorDetails {
  response?: {
    status?: number;
    statusText?: string;
    data?: unknown;
  };
  [key: string]: unknown;
}

/**
 * 服务错误基类
 */
export class ServiceError extends Error {
  /** 错误代码 */
  public code: string;
  /** 错误类型 */
  public readonly type: ServiceErrorType;
  /** HTTP状态码 */
  public httpStatus?: number;
  /** 错误详情 */
  public readonly details?: unknown;
  /** 错误时间戳 */
  public readonly timestamp: Date;
  /** 服务名称 */
  public readonly serviceName?: string;
  /** 操作名称 */
  public readonly operation?: string;
  /** 是否可重试 */
  public readonly retryable: boolean;
  /** 错误堆栈 */
  public override readonly stack?: string;
  /** 内部错误 */
  public readonly innerError?: Error;
  /** 错误上下文 */
  public readonly context?: Record<string, unknown>;

  override get name(): string {
    return this.constructor.name;
  }

  constructor(options: ServiceErrorOptions) {
    super(options.message);
    this.code = options.code;
    this.type = options.type;
    this.httpStatus = options.httpStatus;
    this.details = options.details;
    this.timestamp = new Date();
    this.serviceName = options.serviceName;
    this.operation = options.operation;
    this.retryable = options.retryable ?? false;
    this.innerError = options.innerError;
    this.context = options.context;

    // 保持错误堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 转换为 JSON 对象
   */
  toJSON(): ServiceErrorJSON {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      type: this.type,
      httpStatus: this.httpStatus,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      serviceName: this.serviceName,
      operation: this.operation,
      retryable: this.retryable,
      stack: this.stack,
      innerError: this.innerError ? {
        name: this.innerError.name,
        message: this.innerError.message,
        stack: this.innerError.stack
      } : undefined,
      context: this.context
    };
  }

  /**
   * 转换为字符串
   */
  override toString(): string {
    let result = `${this.name}: ${this.message}`;
    if (this.code) {
      result += ` (${this.code})`;
    }
    if (this.serviceName) {
      result += ` [${this.serviceName}`;
      if (this.operation) {
        result += `.${this.operation}`;
      }
      result += ']';
    }
    return result;
  }

  /**
   * 检查是否为特定类型的错误
   */
  isType(type: ServiceErrorType): boolean {
    return this.type === type;
  }

  /**
   * 检查是否为特定代码的错误
   */
  isCode(code: string): boolean {
    return this.code === code;
  }

  /**
   * 检查是否可重试
   */
  isRetryable(): boolean {
    return this.retryable;
  }
}

/**
 * 服务错误选项
 */
export interface ServiceErrorOptions {
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code: string;
  /** 错误类型 */
  type: ServiceErrorType;
  /** HTTP状态码 */
  httpStatus?: number;
  /** 错误详情 */
  details?: unknown;
  /** 服务名称 */
  serviceName?: string;
  /** 操作名称 */
  operation?: string;
  /** 是否可重试 */
  retryable?: boolean;
  /** 内部错误 */
  innerError?: Error;
  /** 错误上下文 */
  context?: Record<string, unknown>;
}

/**
 * 服务错误 JSON 表示
 */
export interface ServiceErrorJSON {
  name: string;
  message: string;
  code: string;
  type: ServiceErrorType;
  httpStatus?: number;
  details?: unknown;
  timestamp: string;
  serviceName?: string;
  operation?: string;
  retryable: boolean;
  stack?: string;
  innerError?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

/**
 * 服务错误类型
 */
export enum ServiceErrorType {
  /** 配置错误 */
  CONFIGURATION = 'CONFIGURATION',
  /** 初始化错误 */
  INITIALIZATION = 'INITIALIZATION',
  /** 网络错误 */
  NETWORK = 'NETWORK',
  /** 超时错误 */
  TIMEOUT = 'TIMEOUT',
  /** 认证错误 */
  AUTHENTICATION = 'AUTHENTICATION',
  /** 授权错误 */
  AUTHORIZATION = 'AUTHORIZATION',
  /** 验证错误 */
  VALIDATION = 'VALIDATION',
  /** 业务逻辑错误 */
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  /** 数据错误 */
  DATA = 'DATA',
  /** 存储错误 */
  STORAGE = 'STORAGE',
  /** 缓存错误 */
  CACHE = 'CACHE',
  /** 外部服务错误 */
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  /** 内部服务错误 */
  INTERNAL_SERVICE = 'INTERNAL_SERVICE',
  /** 限流错误 */
  RATE_LIMIT = 'RATE_LIMIT',
  /** 资源不足错误 */
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  /** 不支持的操作 */
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN'
}

/**
 * 配置错误
 */
export class ConfigurationError extends ServiceError {
  constructor(message: string, details?: any, serviceName?: string) {
    super({
      message,
      code: 'CONFIG_ERROR',
      type: ServiceErrorType.CONFIGURATION,
      details,
      serviceName,
      retryable: false
    });
  }
}

/**
 * 初始化错误
 */
export class InitializationError extends ServiceError {
  constructor(message: string, details?: any, serviceName?: string) {
    super({
      message,
      code: 'INIT_ERROR',
      type: ServiceErrorType.INITIALIZATION,
      details,
      serviceName,
      retryable: false
    });
  }
}

/**
 * 网络错误
 */
export class NetworkError extends ServiceError {
  constructor(message: string, details?: any, serviceName?: string, retryable: boolean = true) {
    super({
      message,
      code: 'NETWORK_ERROR',
      type: ServiceErrorType.NETWORK,
      details,
      serviceName,
      retryable
    });
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends ServiceError {
  constructor(message: string, timeout: number, serviceName?: string, operation?: string) {
    super({
      message,
      code: 'TIMEOUT_ERROR',
      type: ServiceErrorType.TIMEOUT,
      details: { timeout },
      serviceName,
      operation,
      retryable: true
    });
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends ServiceError {
  constructor(message: string, details?: any, serviceName?: string) {
    super({
      message,
      code: 'AUTH_ERROR',
      type: ServiceErrorType.AUTHENTICATION,
      details,
      serviceName,
      retryable: false
    });
  }
}

/**
 * 授权错误
 */
export class AuthorizationError extends ServiceError {
  constructor(message: string, details?: any, serviceName?: string) {
    super({
      message,
      code: 'AUTHZ_ERROR',
      type: ServiceErrorType.AUTHORIZATION,
      details,
      serviceName,
      retryable: false
    });
  }
}

/**
 * 验证错误
 */
export class ValidationError extends ServiceError {
  constructor(message: string, validationErrors: ValidationErrorDetail[], serviceName?: string) {
    super({
      message,
      code: 'VALIDATION_ERROR',
      type: ServiceErrorType.VALIDATION,
      details: { errors: validationErrors },
      serviceName,
      retryable: false
    });
  }

  /**
   * 获取验证错误详情
   */
  getValidationErrors(): ValidationErrorDetail[] {
    const validationDetails = this.details as { errors?: ValidationErrorDetail[] } | undefined;
    return validationDetails?.errors || [];
  }
}

/**
 * 验证错误详情
 */
export interface ValidationErrorDetail {
  /** 字段名 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code: string;
  /** 当前值 */
  value?: unknown;
  /** 约束条件 */
  constraints?: Record<string, unknown>;
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends ServiceError {
  constructor(message: string, resource?: string, serviceName?: string) {
    super({
      message,
      code: 'NOT_FOUND_ERROR',
      type: ServiceErrorType.BUSINESS_LOGIC,
      details: { resource },
      serviceName,
      retryable: false
    });
  }
}

/**
 * 业务逻辑错误
 */
export class BusinessLogicError extends ServiceError {
  constructor(message: string, code: string, details?: unknown, serviceName?: string) {
    super({
      message,
      code,
      type: ServiceErrorType.BUSINESS_LOGIC,
      details,
      serviceName,
      retryable: false
    });
  }
}

/**
 * 数据错误
 */
export class DataError extends ServiceError {
  constructor(message: string, details?: unknown, serviceName?: string, retryable: boolean = false) {
    super({
      message,
      code: 'DATA_ERROR',
      type: ServiceErrorType.DATA,
      details,
      serviceName,
      retryable
    });
  }
}

/**
 * 存储错误
 */
export class StorageError extends ServiceError {
  constructor(message: string, details?: unknown, serviceName?: string, retryable: boolean = true) {
    super({
      message,
      code: 'STORAGE_ERROR',
      type: ServiceErrorType.STORAGE,
      details,
      serviceName,
      retryable
    });
  }
}

/**
 * 缓存错误
 */
export class CacheError extends ServiceError {
  constructor(message: string, details?: unknown, serviceName?: string, retryable: boolean = true) {
    super({
      message,
      code: 'CACHE_ERROR',
      type: ServiceErrorType.CACHE,
      details,
      serviceName,
      retryable
    });
  }
}

/**
 * 外部服务错误
 */
export class ExternalServiceError extends ServiceError {
  constructor(message: string, serviceUrl: string, statusCode?: number, serviceName?: string) {
    super({
      message,
      code: 'EXTERNAL_SERVICE_ERROR',
      type: ServiceErrorType.EXTERNAL_SERVICE,
      details: { serviceUrl, statusCode },
      serviceName,
      retryable: statusCode ? statusCode >= 500 : true
    });
  }
}

/**
 * 限流错误
 */
export class RateLimitError extends ServiceError {
  constructor(message: string, limit: number, resetTime?: Date, serviceName?: string) {
    super({
      message,
      code: 'RATE_LIMIT_ERROR',
      type: ServiceErrorType.RATE_LIMIT,
      details: { limit, resetTime: resetTime?.toISOString() },
      serviceName,
      retryable: true
    });
  }

  /**
   * 获取重置时间
   */
  getResetTime(): Date | undefined {
    const rateLimitDetails = this.details as { resetTime?: Date | string | number } | undefined;
    return rateLimitDetails?.resetTime ? new Date(rateLimitDetails.resetTime) : undefined;
  }

  /**
   * 获取限制数量
   */
  getLimit(): number {
    const rateLimitDetails = this.details as { limit?: number } | undefined;
    return rateLimitDetails?.limit || 0;
  }
}

/**
 * 资源不足错误
 */
export class ResourceExhaustedError extends ServiceError {
  constructor(message: string, resource: string, details?: unknown, serviceName?: string) {
    super({
      message,
      code: 'RESOURCE_EXHAUSTED_ERROR',
      type: ServiceErrorType.RESOURCE_EXHAUSTED,
      details: { resource, ...(details && typeof details === 'object' ? details as Record<string, unknown> : {}) },
      serviceName,
      retryable: true
    });
  }
}

/**
 * 不支持的操作错误
 */
export class UnsupportedOperationError extends ServiceError {
  constructor(message: string, operation: string, serviceName?: string) {
    super({
      message,
      code: 'UNSUPPORTED_OPERATION_ERROR',
      type: ServiceErrorType.UNSUPPORTED_OPERATION,
      details: { operation },
      serviceName,
      retryable: false
    });
  }
}

/**
 * 错误工厂
 */
export class ServiceErrorFactory {
  /**
   * 从普通错误创建服务错误
   */
  static fromError(
    error: Error,
    serviceName?: string,
    operation?: string,
    type: ServiceErrorType = ServiceErrorType.UNKNOWN
  ): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }

    return new ServiceError({
      message: error.message,
      code: 'UNKNOWN_ERROR',
      type,
      serviceName,
      operation,
      innerError: error,
      retryable: false
    });
  }

  /**
   * 从 HTTP 响应创建服务错误
   */
  static fromHttpResponse(
    status: number,
    statusText: string,
    data?: any,
    serviceName?: string
  ): ServiceError {
    let type: ServiceErrorType;
    let retryable = false;

    if (status >= 400 && status < 500) {
      if (status === 401) {
        type = ServiceErrorType.AUTHENTICATION;
      } else if (status === 403) {
        type = ServiceErrorType.AUTHORIZATION;
      } else if (status === 422) {
        type = ServiceErrorType.VALIDATION;
      } else if (status === 429) {
        type = ServiceErrorType.RATE_LIMIT;
        retryable = true;
      } else {
        type = ServiceErrorType.BUSINESS_LOGIC;
      }
    } else if (status >= 500) {
      type = ServiceErrorType.EXTERNAL_SERVICE;
      retryable = true;
    } else {
      type = ServiceErrorType.UNKNOWN;
    }

    return new ServiceError({
      message: data?.message || statusText || `HTTP ${status}`,
      code: `HTTP_${status}`,
      type,
      httpStatus: status,
      details: { status, statusText, data },
      serviceName,
      retryable
    });
  }

  /**
   * 创建超时错误
   */
  static timeout(
    timeout: number,
    serviceName?: string,
    operation?: string
  ): TimeoutError {
    return new TimeoutError(
      `Operation timed out after ${timeout}ms`,
      timeout,
      serviceName,
      operation
    );
  }

  /**
   * 创建网络错误
   */
  static network(
    message: string,
    details?: any,
    serviceName?: string
  ): NetworkError {
    return new NetworkError(message, details, serviceName);
  }

  /**
   * 创建验证错误
   */
  static validation(
    message: string,
    errors: ValidationErrorDetail[],
    serviceName?: string
  ): ValidationError {
    return new ValidationError(message, errors, serviceName);
  }

  /**
   * 创建业务逻辑错误
   */
  static businessLogic(
    message: string,
    code: string,
    details?: any,
    serviceName?: string
  ): BusinessLogicError {
    return new BusinessLogicError(message, code, details, serviceName);
  }

  /**
   * 创建限流错误
   */
  static rateLimit(
    limit: number,
    resetTime?: Date,
    serviceName?: string
  ): RateLimitError {
    return new RateLimitError(
      `Rate limit exceeded: ${limit} requests`,
      limit,
      resetTime,
      serviceName
    );
  }
}

/**
 * 错误处理器接口
 */
export interface ErrorHandler {
  /**
   * 处理错误
   */
  handle(error: ServiceError): void | Promise<void>;

  /**
   * 检查是否可以处理该错误
   */
  canHandle(error: ServiceError): boolean;
}

/**
 * 默认错误处理器
 */
export class DefaultErrorHandler implements ErrorHandler {
  handle(error: ServiceError): void {
    console.error('Service Error:', error.toString());
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }

  canHandle(_error: ServiceError): boolean {
    return true;
  }
}

/**
 * 错误处理器管理器
 */
export class ErrorHandlerManager {
  private handlers: ErrorHandler[] = [];

  /**
   * 添加错误处理器
   */
  addHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  /**
   * 移除错误处理器
   */
  removeHandler(handler: ErrorHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * 处理错误
   */
  async handle(error: ServiceError): Promise<void> {
    for (const handler of this.handlers) {
      if (handler.canHandle(error)) {
        await handler.handle(error);
      }
    }
  }

  /**
   * 清空所有处理器
   */
  clear(): void {
    this.handlers = [];
  }
}

/**
 * 全局错误处理器管理器实例
 */
export const globalErrorHandler = new ErrorHandlerManager();

// 添加默认错误处理器
globalErrorHandler.addHandler(new DefaultErrorHandler());

/**
 * 处理 catch 块中的 unknown 类型错误
 * 将 unknown 类型的错误转换为 ServiceError
 */
export function handleUnknownError(
  _error: unknown,
  serviceName?: string,
  operation?: string,
  defaultType: ServiceErrorType = ServiceErrorType.UNKNOWN
): ServiceError {
  // 如果已经是 ServiceError，直接返回
  if (_error instanceof ServiceError) {
    return _error;
  }

  // 如果是 Error 对象，检查是否为 HTTP 错误
  if (_error instanceof Error) {
    // 检查是否为 axios 错误或包含 HTTP 状态信息
    if ('response' in _error && _error.response && typeof _error.response === 'object') {
      const response = _error.response as any;
      if (response.status && response.statusText) {
        return ServiceErrorFactory.fromHttpResponse(
          response.status,
          response.statusText,
          response.data,
          serviceName
        );
      }
    }
    return ServiceErrorFactory.fromError(_error, serviceName, operation, defaultType);
  }

  // 如果是字符串，创建新的 ServiceError
  if (typeof _error === 'string') {
    return new ServiceError({
      message: _error,
      code: 'UNKNOWN_ERROR',
      type: defaultType,
      serviceName,
      operation,
      retryable: false
    });
  }

  // 如果是对象且有 message 属性
  if (_error && typeof _error === 'object' && 'message' in _error) {
    const message = typeof _error.message === 'string' ? _error.message : 'Unknown error occurred';
    return new ServiceError({
      message,
      code: 'UNKNOWN_ERROR',
      type: defaultType,
      serviceName,
      operation,
      details: _error,
      retryable: false
    });
  }

  // 其他情况，创建通用错误
  return new ServiceError({
    message: 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
    type: defaultType,
    serviceName,
    operation,
    details: { originalError: _error },
    retryable: false
  });
}