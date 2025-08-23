/**
 * 统一数据校验状态处理机制
 * 前后端通用的校验状态和错误处理类型定义
 */

// 校验状态枚举
export enum ValidationStatus {
  PENDING = 'pending', // 待校验
  VALIDATING = 'validating', // 校验中
  VALID = 'valid', // 校验通过
  INVALID = 'invalid', // 校验失败
  ERROR = 'error', // 校验异常
}

// 校验严重级别
export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// 校验错误类型
export enum ValidationErrorType {
  REQUIRED = 'required', // 必填字段
  FORMAT = 'format', // 格式错误
  LENGTH = 'length', // 长度错误
  RANGE = 'range', // 范围错误
  PATTERN = 'pattern', // 正则匹配错误
  UNIQUE = 'unique', // 唯一性错误
  DEPENDENCY = 'dependency', // 依赖关系错误
  BUSINESS = 'business', // 业务逻辑错误
  NETWORK = 'network', // 网络错误
  PERMISSION = 'permission', // 权限错误
  TIMEOUT = 'timeout', // 超时错误
  UNKNOWN = 'unknown', // 未知错误
}

// 校验错误详情
export interface ValidationError {
  type: ValidationErrorType;
  severity: ValidationSeverity;
  field: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  source: 'client' | 'server';
}

// 字段校验状态
export interface FieldValidationState {
  status: ValidationStatus;
  errors: ValidationError[];
  warnings: ValidationError[];
  touched: boolean;
  dirty: boolean;
  validatedAt?: string;
  lastValue?: unknown;
}

// 表单校验状态
export interface FormValidationState {
  status: ValidationStatus;
  fields: Record<string, FieldValidationState>;
  globalErrors: ValidationError[];
  isSubmitting: boolean;
  submitAttempts: number;
  lastSubmitAt?: string;
}

// 校验规则接口
export interface ValidationRule {
  type: ValidationErrorType;
  message: string;
  validator: (
    value: unknown,
    context?: ValidationContext
  ) => boolean | Promise<boolean>;
  async?: boolean;
  debounceMs?: number;
  dependencies?: string[];
}

// 校验上下文
export interface ValidationContext {
  formData: Record<string, unknown>;
  fieldName: string;
  isSubmitting: boolean;
  userPermissions?: string[];
  metadata?: Record<string, unknown>;
}

// 校验结果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata?: Record<string, unknown>;
}

// 异步校验配置
export interface AsyncValidationConfig {
  url: string;
  method: 'GET' | 'POST';
  debounceMs: number;
  timeoutMs: number;
  retryCount: number;
  headers?: Record<string, string>;
}

// 校验策略
export interface ValidationStrategy {
  validateOnChange: boolean;
  validateOnBlur: boolean;
  validateOnSubmit: boolean;
  debounceMs: number;
  skipValidationStates: ValidationStatus[];
  maxRetries: number;
}

// 校验事件
export interface ValidationEvent {
  type:
    | 'field_change'
    | 'field_blur'
    | 'form_submit'
    | 'validation_complete'
    | 'validation_error';
  fieldName?: string;
  value?: unknown;
  result?: ValidationResult;
  timestamp: string;
}

// 校验监听器
export type ValidationListener = (event: ValidationEvent) => void;

// 校验器配置
export interface ValidatorConfig {
  rules: ValidationRule[];
  strategy: ValidationStrategy;
  asyncConfig?: AsyncValidationConfig;
  listeners?: ValidationListener[];
}

// 前端异常状态（需要跳过的状态）
export enum FrontendExceptionState {
  NETWORK_OFFLINE = 'network_offline', // 网络离线
  SERVER_UNAVAILABLE = 'server_unavailable', // 服务器不可用
  PERMISSION_DENIED = 'permission_denied', // 权限被拒绝
  SESSION_EXPIRED = 'session_expired', // 会话过期
  RATE_LIMITED = 'rate_limited', // 请求频率限制
  MAINTENANCE_MODE = 'maintenance_mode', // 维护模式
  BROWSER_UNSUPPORTED = 'browser_unsupported', // 浏览器不支持
  FEATURE_DISABLED = 'feature_disabled', // 功能已禁用
}

// 异常状态处理策略
export interface ExceptionHandlingStrategy {
  skipValidation: boolean;
  showFallbackUI: boolean;
  enableOfflineMode: boolean;
  retryConfig?: {
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
  };
  fallbackMessage?: string;
}

// 异常状态配置
export type ExceptionStateConfig = Record<
  FrontendExceptionState,
  ExceptionHandlingStrategy
>;
