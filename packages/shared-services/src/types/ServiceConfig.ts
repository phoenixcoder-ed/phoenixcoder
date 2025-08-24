/**
 * 基础服务配置接口
 */
export interface ServiceConfig {
  /** 服务名称 */
  name?: string;
  /** 服务版本 */
  version?: string;
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 环境类型 */
  environment?: 'development' | 'staging' | 'production';
  /** 服务超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 是否启用日志 */
  enableLogging?: boolean;
  /** 是否启用监控 */
  enableMonitoring?: boolean;
  /** 自定义配置 */
  custom?: Record<string, unknown>;
}

/**
 * API 服务配置
 */
export interface ApiConfig extends ServiceConfig {
  /** API 基础 URL */
  baseURL: string;
  /** 默认请求头 */
  defaultHeaders?: Record<string, string>;
  /** 请求超时时间 */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟 */
  retryDelay?: number;
  /** 是否启用请求拦截器 */
  enableRequestInterceptor?: boolean;
  /** 是否启用响应拦截器 */
  enableResponseInterceptor?: boolean;
  /** 是否启用错误拦截器 */
  enableErrorInterceptor?: boolean;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存 TTL */
  cacheTTL?: number;
  /** 并发请求限制 */
  concurrencyLimit?: number;
  /** 请求队列大小 */
  queueSize?: number;
}

/**
 * 认证服务配置
 */
export interface AuthConfig extends ServiceConfig {
  /** 认证服务器 URL */
  authServerURL: string;
  /** 客户端 ID */
  clientId: string;
  /** 客户端密钥 */
  clientSecret?: string;
  /** 重定向 URI */
  redirectUri?: string;
  /** 授权范围 */
  scope?: string[];
  /** Token 存储键 */
  tokenStorageKey?: string;
  /** Refresh Token 存储键 */
  refreshTokenStorageKey?: string;
  /** Token 过期前刷新时间（秒） */
  refreshBeforeExpiry?: number;
  /** 是否启用自动刷新 */
  autoRefresh?: boolean;
  /** 是否启用记住我功能 */
  rememberMe?: boolean;
  /** 记住我持续时间（毫秒） */
  rememberMeDuration?: number;
  /** 是否启用双因素认证 */
  enable2FA?: boolean;
  /** 是否启用 PKCE */
  enablePKCE?: boolean;
  /** 是否启用状态参数 */
  enableState?: boolean;
}

/**
 * 缓存服务配置
 */
export interface CacheConfig extends ServiceConfig {
  /** 缓存策略 */
  strategy?: 'lru' | 'lfu' | 'fifo' | 'ttl';
  /** 最大缓存大小 */
  maxSize?: number;
  /** 默认 TTL（毫秒） */
  defaultTTL?: number;
  /** 最大 TTL（毫秒） */
  maxTTL?: number;
  /** 是否启用压缩 */
  enableCompression?: boolean;
  /** 是否启用序列化 */
  enableSerialization?: boolean;
  /** 是否启用持久化 */
  enablePersistence?: boolean;
  /** 持久化存储类型 */
  persistenceType?: 'localStorage' | 'sessionStorage' | 'indexedDB';
  /** 缓存键前缀 */
  keyPrefix?: string;
  /** 是否启用统计 */
  enableStats?: boolean;
  /** 清理间隔（毫秒） */
  cleanupInterval?: number;
}

/**
 * 存储服务配置
 */
export interface StorageConfig extends ServiceConfig {
  /** 存储类型 */
  type?: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory';
  /** 存储键前缀 */
  prefix?: string;
  /** 是否启用加密 */
  enableEncryption?: boolean;
  /** 加密密钥 */
  encryptionKey?: string;
  /** 是否启用压缩 */
  enableCompression?: boolean;
  /** 是否启用版本控制 */
  enableVersioning?: boolean;
  /** 当前版本 */
  version?: string;
  /** 最大存储大小（字节） */
  maxSize?: number;
  /** 是否启用过期检查 */
  enableExpiration?: boolean;
  /** 清理间隔（毫秒） */
  cleanupInterval?: number;
}

/**
 * 通知服务配置
 */
export interface NotificationConfig extends ServiceConfig {
  /** API 基础 URL */
  baseUrl: string;
  /** WebSocket URL */
  websocketUrl?: string;
  /** 通知类型 */
  types?: ('push' | 'email' | 'sms' | 'inApp')[];
  /** 推送服务配置 */
  push?: {
    /** 服务 Worker 路径 */
    serviceWorkerPath?: string;
    /** VAPID 公钥 */
    vapidPublicKey?: string;
    /** 是否启用 */
    enabled?: boolean;
  };
  /** 邮件服务配置 */
  email?: {
    /** SMTP 服务器 */
    smtpServer?: string;
    /** SMTP 端口 */
    smtpPort?: number;
    /** 用户名 */
    username?: string;
    /** 密码 */
    password?: string;
    /** 发件人 */
    from?: string;
    /** 是否启用 */
    enabled?: boolean;
  };
  /** 短信服务配置 */
  sms?: {
    /** 服务提供商 */
    provider?: string;
    /** API 密钥 */
    apiKey?: string;
    /** 发送号码 */
    from?: string;
    /** 是否启用 */
    enabled?: boolean;
  };
  /** 应用内通知配置 */
  inApp?: {
    /** 最大通知数量 */
    maxNotifications?: number;
    /** 自动清理时间（毫秒） */
    autoCleanupTime?: number;
    /** 是否启用声音 */
    enableSound?: boolean;
    /** 是否启用振动 */
    enableVibration?: boolean;
    /** 是否启用 */
    enabled?: boolean;
  };
  /** 批处理配置 */
  batch?: {
    /** 批处理大小 */
    size?: number;
    /** 批处理间隔（毫秒） */
    interval?: number;
    /** 是否启用 */
    enabled?: boolean;
  };
  /** 重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxAttempts?: number;
    /** 重试延迟（毫秒） */
    delay?: number;
    /** 退避倍数 */
    backoffMultiplier?: number;
    /** 是否启用 */
    enabled?: boolean;
  };
}

/**
 * 分析服务配置
 */
export interface AnalyticsConfig extends ServiceConfig {
  /** 分析提供商 */
  provider?: 'google' | 'mixpanel' | 'amplitude' | 'custom';
  /** 跟踪 ID */
  trackingId?: string;
  /** API 密钥 */
  apiKey?: string;
  /** 是否启用自动跟踪 */
  enableAutoTracking?: boolean;
  /** 是否跟踪页面浏览 */
  trackPageViews?: boolean;
  /** 是否跟踪用户交互 */
  trackUserInteractions?: boolean;
  /** 是否跟踪错误 */
  trackErrors?: boolean;
  /** 是否跟踪性能 */
  trackPerformance?: boolean;
  /** 批处理配置 */
  batch?: {
    /** 批处理大小 */
    size?: number;
    /** 刷新间隔（毫秒） */
    flushInterval?: number;
    /** 是否启用 */
    enabled?: boolean;
  };
  /** 采样率 */
  sampleRate?: number;
  /** 是否启用调试 */
  enableDebug?: boolean;
  /** 自定义维度 */
  customDimensions?: Record<string, string>;
  /** 自定义指标 */
  customMetrics?: Record<string, number>;
}

/**
 * 日志服务配置
 */
export interface LoggerConfig extends ServiceConfig {
  /** 日志级别 */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** 是否启用控制台输出 */
  enableConsole?: boolean;
  /** 是否启用远程日志 */
  enableRemote?: boolean;
  /** 是否启用文件日志 */
  enableFile?: boolean;
  /** 远程日志配置 */
  remote?: {
    /** 远程日志服务 URL */
    url?: string;
    /** API 密钥 */
    apiKey?: string;
    /** 批处理大小 */
    batchSize?: number;
    /** 刷新间隔（毫秒） */
    flushInterval?: number;
  };
  /** 文件日志配置 */
  file?: {
    /** 日志文件路径 */
    path?: string;
    /** 最大文件大小（字节） */
    maxSize?: number;
    /** 最大文件数量 */
    maxFiles?: number;
    /** 是否启用压缩 */
    compress?: boolean;
  };
  /** 日志格式 */
  format?: 'json' | 'text' | 'structured';
  /** 是否包含时间戳 */
  includeTimestamp?: boolean;
  /** 是否包含堆栈跟踪 */
  includeStackTrace?: boolean;
  /** 是否启用颜色 */
  enableColors?: boolean;
  /** 自定义字段 */
  customFields?: Record<string, unknown>;
}

/**
 * 安全服务配置
 */
export interface SecurityConfig extends ServiceConfig {
  /** Token 过期时间（小时） */
  tokenExpiration?: number;
  /** 最大登录尝试次数 */
  maxLoginAttempts?: number;
  /** 账户锁定时长（分钟） */
  lockoutDuration?: number;
  /** 密码策略 */
  passwordPolicy?: {
    minLength?: number;
    maxLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    forbiddenPasswords?: string[];
    historyCount?: number;
    maxAge?: number;
  };
  /** 是否启用 CSRF 保护 */
  enableCSRF?: boolean;
  /** CSRF Token 名称 */
  csrfTokenName?: string;
  /** 是否启用速率限制 */
  enableRateLimit?: boolean;
  /** 速率限制配置 */
  rateLimit?: {
    /** 时间窗口（毫秒） */
    windowMs?: number;
    /** 最大请求数 */
    maxRequests?: number;
    /** 是否跳过成功请求 */
    skipSuccessfulRequests?: boolean;
    /** 是否跳过失败请求 */
    skipFailedRequests?: boolean;
  };
  /** 是否启用输入清理 */
  enableInputSanitization?: boolean;
  /** 是否启用 XSS 保护 */
  enableXSSProtection?: boolean;
  /** 是否启用内容安全策略 */
  enableCSP?: boolean;
  /** 内容安全策略 */
  csp?: {
    /** 默认源 */
    defaultSrc?: string[];
    /** 脚本源 */
    scriptSrc?: string[];
    /** 样式源 */
    styleSrc?: string[];
    /** 图片源 */
    imgSrc?: string[];
    /** 字体源 */
    fontSrc?: string[];
    /** 连接源 */
    connectSrc?: string[];
  };
  /** 加密配置 */
  encryption?: {
    /** 算法 */
    algorithm?: string;
    /** 密钥长度 */
    keyLength?: number;
    /** 初始化向量长度 */
    ivLength?: number;
    /** 盐长度 */
    saltLength?: number;
  };
  /** 加密密钥 */
  encryptionKey?: string;
  /** 审计日志保留时间（天） */
  auditLogRetention?: number;
  /** 会话配置 */
  session?: {
    /** 会话超时时间（分钟） */
    timeout?: number;
    /** 是否启用记住我功能 */
    enableRememberMe?: boolean;
    /** 记住我持续时间（天） */
    rememberMeDuration?: number;
  };
  /** JWT 密钥 */
  jwtSecret?: string;
  /** 是否启用双因素认证 */
  enableTwoFactor?: boolean;
  /** 安全配置（用于兼容性） */
  securityConfig?: Record<string, unknown>;
}

/**
 * SecurityServiceConfig 类型别名
 */
export type SecurityServiceConfig = SecurityConfig;

/**
 * 国际化服务配置
 */
export interface I18nConfig extends ServiceConfig {
  /** 默认语言 */
  defaultLocale?: string;
  /** 回退语言 */
  fallbackLocale?: string;
  /** 支持的语言列表 */
  supportedLocales?: string[];
  /** 语言包加载路径 */
  loadPath?: string;
  /** 是否启用命名空间 */
  enableNamespaces?: boolean;
  /** 默认命名空间 */
  defaultNamespace?: string;
  /** 是否启用插值 */
  enableInterpolation?: boolean;
  /** 插值前缀 */
  interpolationPrefix?: string;
  /** 插值后缀 */
  interpolationSuffix?: string;
  /** 是否启用复数 */
  enablePluralization?: boolean;
  /** 是否启用上下文 */
  enableContext?: boolean;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存 TTL（毫秒） */
  cacheTTL?: number;
  /** 是否启用懒加载 */
  enableLazyLoading?: boolean;
  /** 是否启用调试 */
  enableDebug?: boolean;
}

/**
 * 企业版服务配置
 */
export interface EnterpriseConfig extends ServiceConfig {
  /** 是否启用企业功能 */
  enabled?: boolean;
  /** 许可证密钥 */
  licenseKey?: string;
  /** 许可证服务器 URL */
  licenseServerURL?: string;
  /** 功能开关 */
  features?: {
    /** SAML 单点登录 */
    saml?: boolean;
    /** LDAP 集成 */
    ldap?: boolean;
    /** OIDC 集成 */
    oidc?: boolean;
    /** 高级分析 */
    advancedAnalytics?: boolean;
    /** 团队管理 */
    teamManagement?: boolean;
    /** 合规性 */
    compliance?: boolean;
    /** 审计日志 */
    audit?: boolean;
    /** 自定义品牌 */
    customBranding?: boolean;
    /** API 限制提升 */
    enhancedApiLimits?: boolean;
    /** 优先支持 */
    prioritySupport?: boolean;
  };
  /** SAML 配置 */
  saml?: {
    /** 身份提供商 URL */
    idpURL?: string;
    /** 证书 */
    certificate?: string;
    /** 私钥 */
    privateKey?: string;
    /** 实体 ID */
    entityId?: string;
  };
  /** LDAP 配置 */
  ldap?: {
    /** 服务器 URL */
    serverURL?: string;
    /** 绑定 DN */
    bindDN?: string;
    /** 绑定密码 */
    bindPassword?: string;
    /** 搜索基础 */
    searchBase?: string;
    /** 用户过滤器 */
    userFilter?: string;
    /** 组过滤器 */
    groupFilter?: string;
  };
  /** OIDC 配置 */
  oidc?: {
    /** 发现 URL */
    discoveryURL?: string;
    /** 客户端 ID */
    clientId?: string;
    /** 客户端密钥 */
    clientSecret?: string;
    /** 重定向 URI */
    redirectUri?: string;
    /** 授权范围 */
    scope?: string[];
  };
  /** 审计配置 */
  audit?: {
    /** 是否启用 */
    enabled?: boolean;
    /** 审计事件类型 */
    eventTypes?: string[];
    /** 保留天数 */
    retentionDays?: number;
    /** 是否启用实时审计 */
    enableRealtime?: boolean;
  };
  /** 合规性配置 */
  compliance?: {
    /** 合规标准 */
    standards?: ('gdpr' | 'hipaa' | 'sox' | 'pci')[];
    /** 数据保留策略 */
    dataRetention?: {
      /** 用户数据保留天数 */
      userData?: number;
      /** 日志数据保留天数 */
      logData?: number;
      /** 审计数据保留天数 */
      auditData?: number;
    };
    /** 是否启用数据加密 */
    enableDataEncryption?: boolean;
    /** 是否启用访问控制 */
    enableAccessControl?: boolean;
  };
}

/**
 * 服务配置工厂
 */
export class ServiceConfigFactory {
  /**
   * 创建默认配置
   */
  static createDefault(): ServiceConfig {
    return {
      debug: process.env.NODE_ENV === 'development',
      environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      enableCache: true,
      enableLogging: true,
      enableMonitoring: true,
      custom: {}
    };
  }

  /**
   * 合并配置
   */
  static merge<T extends ServiceConfig>(
    defaultConfig: T,
    userConfig: Partial<T>
  ): T {
    return {
      ...defaultConfig,
      ...userConfig,
      custom: {
        ...defaultConfig.custom,
        ...userConfig.custom
      }
    };
  }

  /**
   * 验证配置
   */
  static validate(config: ServiceConfig): boolean {
    if (config.timeout && config.timeout <= 0) {
      throw new Error('Timeout must be greater than 0');
    }
    if (config.retries && config.retries < 0) {
      throw new Error('Retries must be greater than or equal to 0');
    }
    if (config.retryDelay && config.retryDelay <= 0) {
      throw new Error('Retry delay must be greater than 0');
    }
    return true;
  }

  /**
   * 从环境变量创建配置
   */
  static fromEnvironment(): ServiceConfig {
    return {
      debug: process.env.DEBUG === 'true',
      environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
      timeout: parseInt(process.env.SERVICE_TIMEOUT || '30000'),
      retries: parseInt(process.env.SERVICE_RETRIES || '3'),
      retryDelay: parseInt(process.env.SERVICE_RETRY_DELAY || '1000'),
      enableCache: process.env.ENABLE_CACHE !== 'false',
      enableLogging: process.env.ENABLE_LOGGING !== 'false',
      enableMonitoring: process.env.ENABLE_MONITORING !== 'false'
    };
  }
}

/**
 * 工作流服务配置
 */
export interface WorkflowServiceConfig extends ServiceConfig {
  /** 最大并发执行数 */
  maxConcurrentExecutions?: number;
  /** 执行超时时间（毫秒） */
  executionTimeout?: number;
  /** 是否启用持久化 */
  enablePersistence?: boolean;
  /** 持久化存储类型 */
  persistenceType?: 'memory' | 'database' | 'file';
  /** 是否启用调度器 */
  enableScheduler?: boolean;
  /** 调度器间隔（毫秒） */
  schedulerInterval?: number;
  /** 是否启用工作流验证 */
  enableValidation?: boolean;
  /** 是否启用工作流版本控制 */
  enableVersioning?: boolean;
  /** 工作流存储路径 */
  workflowStoragePath?: string;
  /** 是否启用工作流缓存 */
  enableWorkflowCache?: boolean;
  /** 工作流缓存 TTL（毫秒） */
  workflowCacheTTL?: number;
}

/**
 * 文件服务配置
 */
export interface FileServiceConfig extends ServiceConfig {
  /** 存储配置 */
  storage: {
    /** 存储类型 */
    type: 'local' | 's3' | 'azure' | 'gcp';
    /** 本地存储路径 */
    localPath?: string;
    /** 云存储配置 */
    cloud?: {
      /** 存储桶名称 */
      bucket: string;
      /** 区域 */
      region?: string;
      /** 访问密钥 */
      accessKey?: string;
      /** 密钥 */
      secretKey?: string;
      /** 端点 */
      endpoint?: string;
    };
  };
  /** 上传配置 */
  upload: {
    /** 最大文件大小（字节） */
    maxFileSize: number;
    /** 允许的文件类型 */
    allowedTypes: string[];
    /** 是否启用病毒扫描 */
    enableVirusScanning?: boolean;
    /** 是否启用重复检测 */
    enableDuplicateDetection?: boolean;
    /** 临时目录 */
    tempDir?: string;
  };
  /** 下载配置 */
  download: {
    /** 是否启用缓存 */
    enableCache?: boolean;
    /** 缓存 TTL（毫秒） */
    cacheTTL?: number;
    /** 是否启用压缩 */
    enableCompression?: boolean;
    /** 是否启用断点续传 */
    enableResume?: boolean;
  };
  /** 安全配置 */
  security: {
    /** 是否启用加密 */
    enableEncryption?: boolean;
    /** 加密算法 */
    encryptionAlgorithm?: string;
    /** 是否启用访问控制 */
    enableAccessControl?: boolean;
    /** 默认权限 */
    defaultPermissions?: string;
  };
  /** 清理配置 */
  cleanup: {
    /** 是否启用自动清理 */
    enableAutoCleanup?: boolean;
    /** 临时文件保留时间（毫秒） */
    tempFileRetention?: number;
    /** 清理间隔（毫秒） */
    cleanupInterval?: number;
  };
}

/**
 * 邮件服务配置
 */
export interface EmailServiceConfig extends ServiceConfig {
  /** 邮件服务选项 */
  emailOptions: {
    /** SMTP 配置 */
    smtp: {
      /** SMTP 服务器地址 */
      host: string;
      /** SMTP 端口 */
      port: number;
      /** 是否使用安全连接 */
      secure?: boolean;
      /** 认证信息 */
      auth?: {
        /** 用户名 */
        user: string;
        /** 密码 */
        pass: string;
      };
    };
    /** 默认发件人 */
    defaultFrom: {
      /** 邮箱地址 */
      email: string;
      /** 显示名称 */
      name?: string;
    };
    /** 模板路径 */
    templatesPath?: string;
    /** 队列并发数 */
    queueConcurrency?: number;
    /** 重试延迟（毫秒） */
    retryDelay?: number;
    /** 最大重试次数 */
    maxRetries?: number;
    /** 是否启用跟踪 */
    enableTracking?: boolean;
    /** 跟踪域名 */
    trackingDomain?: string;
    /** 取消订阅 URL */
    unsubscribeUrl?: string;
    /** Webhook URL */
    webhookUrl?: string;
  };
}