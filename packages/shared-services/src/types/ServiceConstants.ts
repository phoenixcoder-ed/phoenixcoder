/**
 * 服务状态常量
 */
export const SERVICE_STATUS = {
  /** 未初始化 */
  UNINITIALIZED: 'uninitialized',
  /** 初始化中 */
  INITIALIZING: 'initializing',
  /** 运行中 */
  RUNNING: 'running',
  /** 暂停中 */
  PAUSED: 'paused',
  /** 停止中 */
  STOPPING: 'stopping',
  /** 已停止 */
  STOPPED: 'stopped',
  /** 错误状态 */
  ERROR: 'error',
  /** 维护中 */
  MAINTENANCE: 'maintenance'
} as const;

/**
 * 服务优先级常量
 */
export const SERVICE_PRIORITY = {
  /** 低优先级 */
  LOW: 'low',
  /** 普通优先级 */
  NORMAL: 'normal',
  /** 高优先级 */
  HIGH: 'high',
  /** 关键优先级 */
  CRITICAL: 'critical'
} as const;

/**
 * 服务类型常量
 */
export const SERVICE_TYPE = {
  /** 核心服务 */
  CORE: 'core',
  /** 业务服务 */
  BUSINESS: 'business',
  /** 工具服务 */
  UTILITY: 'utility',
  /** 第三方服务 */
  THIRD_PARTY: 'third_party',
  /** 缓存服务 */
  CACHE: 'cache',
  /** 存储服务 */
  STORAGE: 'storage',
  /** 网络服务 */
  NETWORK: 'network',
  /** 认证服务 */
  AUTH: 'auth',
  /** 分析服务 */
  ANALYTICS: 'analytics',
  /** 通知服务 */
  NOTIFICATION: 'notification'
} as const;

/**
 * 服务事件常量
 */
export const SERVICE_EVENTS = {
  /** 服务初始化开始 */
  INITIALIZING: 'service:initializing',
  /** 服务初始化完成 */
  INITIALIZED: 'service:initialized',
  /** 服务启动 */
  STARTED: 'service:started',
  /** 服务停止 */
  STOPPED: 'service:stopped',
  /** 服务暂停 */
  PAUSED: 'service:paused',
  /** 服务恢复 */
  RESUMED: 'service:resumed',
  /** 服务错误 */
  ERROR: 'service:error',
  /** 服务警告 */
  WARNING: 'service:warning',
  /** 服务信息 */
  INFO: 'service:info',
  /** 服务调试 */
  DEBUG: 'service:debug',
  /** 健康检查 */
  HEALTH_CHECK: 'service:health_check',
  /** 配置更新 */
  CONFIG_UPDATED: 'service:config_updated',
  /** 依赖就绪 */
  DEPENDENCY_READY: 'service:dependency_ready',
  /** 依赖失败 */
  DEPENDENCY_FAILED: 'service:dependency_failed',
  /** 指标更新 */
  METRICS_UPDATED: 'service:metrics_updated',
  
  // 用户相关事件
  /** 用户列表获取完成 */
  USER_LIST_FETCHED: 'user:list_fetched',
  /** 用户获取完成 */
  USER_FETCHED: 'user:fetched',
  /** 用户创建完成 */
  USER_CREATED: 'user:created',
  /** 用户更新完成 */
  USER_UPDATED: 'user:updated',
  /** 用户删除完成 */
  USER_DELETED: 'user:deleted',
  /** 用户资料获取完成 */
  USER_PROFILE_FETCHED: 'user:profile_fetched',
  /** 用户资料更新完成 */
  USER_PROFILE_UPDATED: 'user:profile_updated',
  /** 用户偏好设置获取完成 */
  USER_PREFERENCES_FETCHED: 'user:preferences_fetched',
  /** 用户偏好设置更新完成 */
  USER_PREFERENCES_UPDATED: 'user:preferences_updated',
  /** 用户搜索完成 */
  USER_SEARCH_COMPLETED: 'user:search_completed',
  /** 用户头像上传完成 */
  USER_AVATAR_UPLOADED: 'user:avatar_uploaded',
  /** 用户批量获取完成 */
  USER_BATCH_FETCHED: 'user:batch_fetched',
  /** 用户注册 */
  USER_REGISTERED: 'user:registered',
  /** 用户登录 */
  USER_LOGIN: 'user:login',
  /** 用户登出 */
  USER_LOGOUT: 'user:logout',
  
  // 认证相关事件
  /** 认证登录 */
  AUTH_LOGIN: 'auth:login',
  /** 认证注册 */
  AUTH_REGISTER: 'auth:register',
  /** 认证登出 */
  AUTH_LOGOUT: 'auth:logout',
  /** 认证刷新 */
  AUTH_REFRESH: 'auth:refresh',
  /** 认证状态变化 */
  AUTH_STATE_CHANGE: 'auth:state_change',
  /** 密码修改 */
  PASSWORD_CHANGED: 'auth:password_changed',
  /** 密码重置 */
  PASSWORD_RESET: 'auth:password_reset',
  
  // 任务相关事件
  /** 任务列表获取完成 */
  TASK_LIST_FETCHED: 'task:list_fetched',

  /** 任务创建完成 */
  TASK_CREATED: 'task:created',
  /** 任务更新完成 */
  TASK_UPDATED: 'task:updated',
  /** 任务删除完成 */
  TASK_DELETED: 'task:deleted',
  /** 任务分配 */
  TASK_ASSIGNED: 'task:assigned',
  /** 任务取消分配 */
  TASK_UNASSIGNED: 'task:unassigned',
  /** 任务提交 */
  TASK_SUBMITTED: 'task:submitted',
  /** 任务审核 */
  TASK_REVIEWED: 'task:reviewed',
  /** 任务状态变化 */
  TASK_STATUS_CHANGED: 'task:status_changed',
  /** 任务搜索完成 */
  TASK_SEARCH_COMPLETED: 'task:search_completed',
  /** 任务统计获取完成 */
  TASK_STATS_FETCHED: 'task:stats_fetched',
  /** 我的任务获取完成 */
  MY_TASKS_FETCHED: 'task:my_tasks_fetched',
  /** 推荐任务获取完成 */
  RECOMMENDED_TASKS_FETCHED: 'task:recommended_tasks_fetched',
  /** 任务批量获取完成 */
  TASK_BATCH_FETCHED: 'task:batch_fetched',
  
  // 技能相关事件
  /** 技能列表获取完成 */
  SKILL_LIST_FETCHED: 'skill:list_fetched',
  /** 技能获取完成 */
  SKILL_FETCHED: 'skill:fetched',
  /** 技能创建完成 */
  SKILL_CREATED: 'skill:created',
  /** 技能更新完成 */
  SKILL_UPDATED: 'skill:updated',
  /** 技能删除完成 */
  SKILL_DELETED: 'skill:deleted',
  /** 用户技能获取完成 */
  USER_SKILLS_FETCHED: 'skill:user_skills_fetched',
  /** 用户技能添加 */
  USER_SKILL_ADDED: 'skill:user_skill_added',
  /** 用户技能更新 */
  USER_SKILL_UPDATED: 'skill:user_skill_updated',
  /** 用户技能移除 */
  USER_SKILL_REMOVED: 'skill:user_skill_removed',
  /** 技能评估 */
  SKILL_ASSESSED: 'skill:assessed',
  /** 用户技能验证 */
  USER_SKILL_VERIFIED: 'skill:user_skill_verified',
  /** 技能搜索完成 */
  SKILL_SEARCH_COMPLETED: 'skill:search_completed',
  /** 技能推荐获取完成 */
  SKILL_RECOMMENDATIONS_FETCHED: 'skill:recommendations_fetched',
  /** 技能统计获取完成 */
  SKILL_STATS_FETCHED: 'skill:stats_fetched',
  /** 热门技能获取完成 */
  TRENDING_SKILLS_FETCHED: 'skill:trending_skills_fetched',
  /** 技能批量获取完成 */
  SKILL_BATCH_FETCHED: 'skill:batch_fetched',
  
  // 成就相关事件
  /** 成就列表获取完成 */
  ACHIEVEMENT_LIST_FETCHED: 'achievement:list_fetched',
  /** 成就获取完成 */
  ACHIEVEMENT_FETCHED: 'achievement:fetched',
  /** 成就创建完成 */
  ACHIEVEMENT_CREATED: 'achievement:created',
  /** 成就更新完成 */
  ACHIEVEMENT_UPDATED: 'achievement:updated',
  /** 成就删除完成 */
  ACHIEVEMENT_DELETED: 'achievement:deleted',
  /** 用户成就获取完成 */
  USER_ACHIEVEMENTS_FETCHED: 'achievement:user_achievements_fetched',
  /** 成就进度更新 */
  ACHIEVEMENT_PROGRESS_UPDATED: 'achievement:progress_updated',
  /** 成就解锁 */
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  /** 成就搜索完成 */
  ACHIEVEMENT_SEARCH_COMPLETED: 'achievement:search_completed',
  /** 成就统计获取完成 */
  ACHIEVEMENT_STATS_FETCHED: 'achievement:stats_fetched',
  /** 用户成就统计获取完成 */
  USER_ACHIEVEMENT_STATS_FETCHED: 'achievement:user_achievement_stats_fetched',
  /** 成就排行榜获取完成 */
  ACHIEVEMENT_LEADERBOARD_FETCHED: 'achievement:leaderboard_fetched',
  /** 推荐成就获取完成 */
  RECOMMENDED_ACHIEVEMENTS_FETCHED: 'achievement:recommended_achievements_fetched',
  /** 即将到来的成就获取完成 */
  UPCOMING_ACHIEVEMENTS_FETCHED: 'achievement:upcoming_achievements_fetched',
  /** 成就批量获取完成 */
  ACHIEVEMENT_BATCH_FETCHED: 'achievement:batch_fetched',
  /** 成就条件检查完成 */
  ACHIEVEMENT_CONDITIONS_CHECKED: 'achievement:conditions_checked',
  
  // 工作流相关事件
  /** 工作流创建 */
  WORKFLOW_CREATED: 'workflow:created',
  /** 工作流更新 */
  WORKFLOW_UPDATED: 'workflow:updated',
  /** 工作流删除 */
  WORKFLOW_DELETED: 'workflow:deleted',
  /** 工作流激活 */
  WORKFLOW_ACTIVATED: 'workflow:activated',
  /** 工作流停用 */
  WORKFLOW_DEACTIVATED: 'workflow:deactivated',
  /** 工作流执行开始 */
  WORKFLOW_EXECUTION_STARTED: 'workflow:execution_started',
  /** 工作流执行完成 */
  WORKFLOW_EXECUTION_COMPLETED: 'workflow:execution_completed',
  /** 工作流执行失败 */
  WORKFLOW_EXECUTION_FAILED: 'workflow:execution_failed',
  /** 工作流执行取消 */
  WORKFLOW_EXECUTION_CANCELLED: 'workflow:execution_cancelled',
  /** 工作流执行暂停 */
  WORKFLOW_EXECUTION_PAUSED: 'workflow:execution_paused',
  /** 工作流执行恢复 */
  WORKFLOW_EXECUTION_RESUMED: 'workflow:execution_resumed',
  
  // API相关事件
  /** API请求 */
  API_REQUEST: 'api:request',
  /** API响应 */
  API_RESPONSE: 'api:response',
  /** API重试 */
  API_RETRY: 'api:retry',
  /** API错误 */
  API_ERROR: 'api:error',
  
  // 文件相关事件
  /** 文件上传 */
  FILE_UPLOADED: 'file:uploaded',
  /** 文件下载 */
  FILE_DOWNLOADED: 'file:downloaded',
  /** 文件更新 */
  FILE_UPDATED: 'file:updated',
  /** 文件删除 */
  FILE_DELETED: 'file:deleted',
  /** 文件处理 */
  FILE_PROCESSED: 'file:processed',
  /** 文件清理 */
  FILE_CLEANUP: 'file:cleanup',
  
  // 邮件相关事件
  /** 邮件排队 */
  EMAIL_QUEUED: 'email:queued',
  /** 邮件发送 */
  EMAIL_SENT: 'email:sent',
  /** 邮件取消 */
  EMAIL_CANCELLED: 'email:cancelled',
  /** 邮件重试 */
  EMAIL_RETRY: 'email:retry',
  /** 邮件模板创建 */
  EMAIL_TEMPLATE_CREATED: 'email:template_created',
  /** 邮件模板更新 */
  EMAIL_TEMPLATE_UPDATED: 'email:template_updated',
  /** 邮件模板删除 */
  EMAIL_TEMPLATE_DELETED: 'email:template_deleted',
  
  // 通知相关事件
  /** 通知列表获取完成 */
  NOTIFICATION_LIST_FETCHED: 'notification:list_fetched',
  /** 通知获取完成 */
  NOTIFICATION_FETCHED: 'notification:fetched',
  /** 通知创建完成 */
  NOTIFICATION_CREATED: 'notification:created',
  /** 通知批量创建完成 */
  NOTIFICATION_BATCH_CREATED: 'notification:batch_created',
  /** 通知发送完成 */
  NOTIFICATION_SENT: 'notification:sent',
  /** 通知已读 */
  NOTIFICATION_READ: 'notification:read',
  /** 通知批量已读 */
  NOTIFICATION_BATCH_READ: 'notification:batch_read',
  /** 通知删除完成 */
  NOTIFICATION_DELETED: 'notification:deleted',
  /** 用户通知获取完成 */
  USER_NOTIFICATIONS_FETCHED: 'notification:user_notifications_fetched',
  /** 未读数量获取完成 */
  UNREAD_COUNT_FETCHED: 'notification:unread_count_fetched',
  /** 通知模板创建完成 */
  NOTIFICATION_TEMPLATE_CREATED: 'notification:template_created',
  /** 通知模板更新完成 */
  NOTIFICATION_TEMPLATE_UPDATED: 'notification:template_updated',
  /** 通知模板删除完成 */
  NOTIFICATION_TEMPLATE_DELETED: 'notification:template_deleted',
  /** 通知模板获取完成 */
  NOTIFICATION_TEMPLATE_FETCHED: 'notification:template_fetched',
  /** 通知模板列表获取完成 */
  NOTIFICATION_TEMPLATE_LIST_FETCHED: 'notification:template_list_fetched',
  /** 通知偏好设置获取完成 */
  NOTIFICATION_PREFERENCES_FETCHED: 'notification:preferences_fetched',
  /** 通知偏好设置更新完成 */
  NOTIFICATION_PREFERENCES_UPDATED: 'notification:preferences_updated',
  /** 通知统计获取完成 */
  NOTIFICATION_STATS_FETCHED: 'notification:stats_fetched',
  /** 通知测试发送完成 */
  NOTIFICATION_TEST_SENT: 'notification:test_sent',
  /** WebSocket连接 */
  WEBSOCKET_CONNECTED: 'notification:websocket_connected',
  /** WebSocket断开连接 */
  WEBSOCKET_DISCONNECTED: 'notification:websocket_disconnected',
  /** WebSocket错误 */
  WEBSOCKET_ERROR: 'notification:websocket_error',
  
  // 缓存相关事件
  /** 缓存设置 */
  CACHE_SET: 'cache:set',
  /** 缓存获取 */
  CACHE_GET: 'cache:get',
  /** 缓存删除 */
  CACHE_DELETE: 'cache:delete',
  /** 缓存批量删除 */
  CACHE_BATCH_DELETE: 'cache:batch_delete',
  /** 缓存清理 */
  CACHE_CLEAR: 'cache:clear',
  
  // 配置相关事件
  /** 配置加载 */
  CONFIG_LOADED: 'config:loaded',
  /** 配置添加 */
  CONFIG_ADDED: 'config:added',
  /** 配置移除 */
  CONFIG_REMOVED: 'config:removed',
  
  // 监控相关事件
  /** 指标记录 */
  METRIC_RECORDED: 'monitoring:metric_recorded',
  /** 警报触发 */
  ALERT_TRIGGERED: 'monitoring:alert_triggered',
  /** 警报解决 */
  ALERT_RESOLVED: 'monitoring:alert_resolved',
  
  // 日志相关事件
  /** 日志条目 */
  LOG_ENTRY: 'logging:log_entry'
} as const;

/**
 * HTTP 状态码常量
 */
export const HTTP_STATUS = {
  // 成功状态码
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // 重定向状态码
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  
  // 客户端错误状态码
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // 服务器错误状态码
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

/**
 * HTTP 方法常量
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
} as const;

/**
 * 内容类型常量
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  XML: 'application/xml',
  HTML: 'text/html',
  TEXT: 'text/plain',
  FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  OCTET_STREAM: 'application/octet-stream',
  PDF: 'application/pdf',
  ZIP: 'application/zip',
  CSV: 'text/csv'
} as const;

/**
 * 缓存策略常量
 */
export const CACHE_STRATEGIES = {
  /** 最近最少使用 */
  LRU: 'lru',
  /** 最不经常使用 */
  LFU: 'lfu',
  /** 先进先出 */
  FIFO: 'fifo',
  /** 基于时间的过期 */
  TTL: 'ttl',
  /** 无缓存 */
  NONE: 'none'
} as const;

/**
 * 存储类型常量
 */
export const STORAGE_TYPES = {
  /** 本地存储 */
  LOCAL_STORAGE: 'localStorage',
  /** 会话存储 */
  SESSION_STORAGE: 'sessionStorage',
  /** IndexedDB */
  INDEXED_DB: 'indexedDB',
  /** 内存存储 */
  MEMORY: 'memory',
  /** Cookie */
  COOKIE: 'cookie'
} as const;

/**
 * 日志级别常量
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
} as const;

/**
 * 环境常量
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test'
} as const;

/**
 * 认证类型常量
 */
export const AUTH_TYPES = {
  /** Bearer Token */
  BEARER: 'Bearer',
  /** Basic 认证 */
  BASIC: 'Basic',
  /** API Key */
  API_KEY: 'ApiKey',
  /** OAuth 2.0 */
  OAUTH2: 'OAuth2',
  /** JWT */
  JWT: 'JWT',
  /** SAML */
  SAML: 'SAML',
  /** OIDC */
  OIDC: 'OIDC'
} as const;

/**
 * 通知类型常量
 */
export const NOTIFICATION_TYPES = {
  /** 推送通知 */
  PUSH: 'push',
  /** 邮件通知 */
  EMAIL: 'email',
  /** 短信通知 */
  SMS: 'sms',
  /** 应用内通知 */
  IN_APP: 'inApp',
  /** Webhook */
  WEBHOOK: 'webhook'
} as const;

/**
 * 通知优先级常量
 */
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

/**
 * 分析事件类型常量
 */
export const ANALYTICS_EVENT_TYPES = {
  /** 页面浏览 */
  PAGE_VIEW: 'page_view',
  /** 用户交互 */
  USER_INTERACTION: 'user_interaction',
  /** 自定义事件 */
  CUSTOM_EVENT: 'custom_event',
  /** 错误事件 */
  ERROR_EVENT: 'error_event',
  /** 性能事件 */
  PERFORMANCE_EVENT: 'performance_event',
  /** 转换事件 */
  CONVERSION_EVENT: 'conversion_event'
} as const;

/**
 * 文件类型常量
 */
export const FILE_TYPES = {
  // 图片类型
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_GIF: 'image/gif',
  IMAGE_WEBP: 'image/webp',
  IMAGE_SVG: 'image/svg+xml',
  
  // 文档类型
  DOC_PDF: 'application/pdf',
  DOC_WORD: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC_EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  DOC_POWERPOINT: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // 音频类型
  AUDIO_MP3: 'audio/mpeg',
  AUDIO_WAV: 'audio/wav',
  AUDIO_OGG: 'audio/ogg',
  
  // 视频类型
  VIDEO_MP4: 'video/mp4',
  VIDEO_WEBM: 'video/webm',
  VIDEO_OGG: 'video/ogg',
  
  // 压缩文件类型
  ARCHIVE_ZIP: 'application/zip',
  ARCHIVE_RAR: 'application/x-rar-compressed',
  ARCHIVE_TAR: 'application/x-tar',
  ARCHIVE_GZIP: 'application/gzip'
} as const;

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = {
  /** 默认超时时间（毫秒） */
  TIMEOUT: 30000,
  /** 默认重试次数 */
  RETRIES: 3,
  /** 默认重试延迟（毫秒） */
  RETRY_DELAY: 1000,
  /** 默认缓存 TTL（毫秒） */
  CACHE_TTL: 300000, // 5分钟
  /** 默认批处理大小 */
  BATCH_SIZE: 100,
  /** 默认并发限制 */
  CONCURRENCY_LIMIT: 10,
  /** 默认队列大小 */
  QUEUE_SIZE: 1000,
  /** 默认清理间隔（毫秒） */
  CLEANUP_INTERVAL: 60000, // 1分钟
  /** 默认健康检查间隔（毫秒） */
  HEALTH_CHECK_INTERVAL: 30000, // 30秒
  /** 默认指标收集间隔（毫秒） */
  METRICS_INTERVAL: 10000, // 10秒
  /** 默认日志缓冲区大小 */
  LOG_BUFFER_SIZE: 1000,
  /** 默认最大文件大小（字节） */
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  /** 默认分页大小 */
  PAGE_SIZE: 20,
  /** 默认最大分页大小 */
  MAX_PAGE_SIZE: 100
} as const;

/**
 * 正则表达式常量
 */
export const REGEX_PATTERNS = {
  /** 邮箱地址 */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** 手机号码（中国） */
  PHONE_CN: /^1[3-9]\d{9}$/,
  /** URL */
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  /** IPv4 地址 */
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  /** IPv6 地址 */
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  /** UUID */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  /** 密码强度（至少8位，包含大小写字母、数字和特殊字符） */
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  /** 中文字符 */
  CHINESE: /[\u4e00-\u9fa5]/,
  /** 数字 */
  NUMERIC: /^\d+$/,
  /** 字母 */
  ALPHABETIC: /^[a-zA-Z]+$/,
  /** 字母数字 */
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/
} as const;

/**
 * 错误代码常量
 */
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  
  // 认证错误
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // 业务错误
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // 网络错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // 数据错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATA_CORRUPTION: 'DATA_CORRUPTION',
  SERIALIZATION_ERROR: 'SERIALIZATION_ERROR',
  
  // 存储错误
  STORAGE_ERROR: 'STORAGE_ERROR',
  STORAGE_FULL: 'STORAGE_FULL',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  
  // 缓存错误
  CACHE_ERROR: 'CACHE_ERROR',
  CACHE_MISS: 'CACHE_MISS',
  CACHE_EXPIRED: 'CACHE_EXPIRED',
  
  // 限流错误
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // 配置错误
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  MISSING_CONFIGURATION: 'MISSING_CONFIGURATION',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION'
} as const;

/**
 * 成功代码常量
 */
export const SUCCESS_CODES = {
  OPERATION_SUCCESS: 'OPERATION_SUCCESS',
  RESOURCE_CREATED: 'RESOURCE_CREATED',
  RESOURCE_UPDATED: 'RESOURCE_UPDATED',
  RESOURCE_DELETED: 'RESOURCE_DELETED',
  DATA_SYNCHRONIZED: 'DATA_SYNCHRONIZED',
  CACHE_UPDATED: 'CACHE_UPDATED',
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
  FILE_UPLOADED: 'FILE_UPLOADED',
  FILE_DOWNLOADED: 'FILE_DOWNLOADED',
  AUTHENTICATION_SUCCESS: 'AUTHENTICATION_SUCCESS',
  AUTHORIZATION_SUCCESS: 'AUTHORIZATION_SUCCESS'
} as const;

/**
 * 版本类型常量
 */
export const VERSION_TYPES = {
  MAJOR: 'major',
  MINOR: 'minor',
  PATCH: 'patch',
  PRERELEASE: 'prerelease',
  BUILD: 'build'
} as const;

/**
 * 功能开关常量
 */
export const FEATURE_FLAGS = {
  /** 启用缓存 */
  ENABLE_CACHE: 'enable_cache',
  /** 启用日志 */
  ENABLE_LOGGING: 'enable_logging',
  /** 启用监控 */
  ENABLE_MONITORING: 'enable_monitoring',
  /** 启用分析 */
  ENABLE_ANALYTICS: 'enable_analytics',
  /** 启用通知 */
  ENABLE_NOTIFICATIONS: 'enable_notifications',
  /** 启用调试模式 */
  ENABLE_DEBUG: 'enable_debug',
  /** 启用实验性功能 */
  ENABLE_EXPERIMENTAL: 'enable_experimental',
  /** 启用维护模式 */
  ENABLE_MAINTENANCE: 'enable_maintenance',
  /** 启用限流 */
  ENABLE_RATE_LIMITING: 'enable_rate_limiting',
  /** 启用安全功能 */
  ENABLE_SECURITY: 'enable_security'
} as const;

/**
 * 时间常量（毫秒）
 */
export const TIME_CONSTANTS = {
  /** 1秒 */
  SECOND: 1000,
  /** 1分钟 */
  MINUTE: 60 * 1000,
  /** 1小时 */
  HOUR: 60 * 60 * 1000,
  /** 1天 */
  DAY: 24 * 60 * 60 * 1000,
  /** 1周 */
  WEEK: 7 * 24 * 60 * 60 * 1000,
  /** 1月（30天） */
  MONTH: 30 * 24 * 60 * 60 * 1000,
  /** 1年（365天） */
  YEAR: 365 * 24 * 60 * 60 * 1000
} as const;

/**
 * 字节大小常量
 */
export const BYTE_SIZES = {
  /** 1KB */
  KB: 1024,
  /** 1MB */
  MB: 1024 * 1024,
  /** 1GB */
  GB: 1024 * 1024 * 1024,
  /** 1TB */
  TB: 1024 * 1024 * 1024 * 1024
} as const;

/**
 * 服务常量类型定义
 */
export type ServiceStatus = typeof SERVICE_STATUS[keyof typeof SERVICE_STATUS];
export type ServicePriority = typeof SERVICE_PRIORITY[keyof typeof SERVICE_PRIORITY];
export type ServiceType = typeof SERVICE_TYPE[keyof typeof SERVICE_TYPE];
export type ServiceEvent = typeof SERVICE_EVENTS[keyof typeof SERVICE_EVENTS];
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];
export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];
export type CacheStrategy = typeof CACHE_STRATEGIES[keyof typeof CACHE_STRATEGIES];
export type StorageType = typeof STORAGE_TYPES[keyof typeof STORAGE_TYPES];
export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];
export type Environment = typeof ENVIRONMENTS[keyof typeof ENVIRONMENTS];
export type AuthType = typeof AUTH_TYPES[keyof typeof AUTH_TYPES];
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type NotificationPriority = typeof NOTIFICATION_PRIORITIES[keyof typeof NOTIFICATION_PRIORITIES];
export type AnalyticsEventType = typeof ANALYTICS_EVENT_TYPES[keyof typeof ANALYTICS_EVENT_TYPES];
export type FileType = typeof FILE_TYPES[keyof typeof FILE_TYPES];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type SuccessCode = typeof SUCCESS_CODES[keyof typeof SUCCESS_CODES];
export type VersionType = typeof VERSION_TYPES[keyof typeof VERSION_TYPES];
export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];