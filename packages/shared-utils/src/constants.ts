// 应用常量
export const APP_CONFIG = {
  NAME: 'PhoenixCoder',
  VERSION: '2.0.0',
  DESCRIPTION: 'AI-Powered Coding Challenge Platform',
  AUTHOR: 'PhoenixCoder Team',
  HOMEPAGE: 'https://phoenixcoder.com',
  REPOSITORY: 'https://github.com/phoenixcoder/phoenixcoder',
  SUPPORT_EMAIL: 'support@phoenixcoder.com',
  FEEDBACK_EMAIL: 'feedback@phoenixcoder.com',
} as const;

// 环境常量
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

// API 常量
export const API_CONFIG = {
  BASE_URL: {
    DEVELOPMENT: 'http://localhost:8001',
    STAGING: 'https://api-staging.phoenixcoder.com',
    PRODUCTION: 'https://api.phoenixcoder.com',
  },
  TIMEOUT: 30000, // 30秒
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒
} as const;

// 认证常量
export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'user_info',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5分钟缓冲
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24小时
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30天
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
} as const;

// 用户等级常量
export const USER_LEVELS = {
  BEGINNER: {
    name: '新手',
    level: 1,
    minExp: 0,
    maxExp: 999,
    color: '#10B981',
    icon: '🌱',
  },
  INTERMEDIATE: {
    name: '进阶',
    level: 2,
    minExp: 1000,
    maxExp: 4999,
    color: '#3B82F6',
    icon: '🚀',
  },
  ADVANCED: {
    name: '高级',
    level: 3,
    minExp: 5000,
    maxExp: 14999,
    color: '#8B5CF6',
    icon: '⭐',
  },
  EXPERT: {
    name: '专家',
    level: 4,
    minExp: 15000,
    maxExp: 39999,
    color: '#F59E0B',
    icon: '👑',
  },
  MASTER: {
    name: '大师',
    level: 5,
    minExp: 40000,
    maxExp: Infinity,
    color: '#EF4444',
    icon: '🏆',
  },
} as const;

// 技能等级常量
export const SKILL_LEVELS = {
  NOVICE: {
    name: '初学者',
    level: 1,
    color: '#6B7280',
    description: '刚开始学习该技能',
  },
  BEGINNER: {
    name: '入门',
    level: 2,
    color: '#10B981',
    description: '掌握基础知识',
  },
  INTERMEDIATE: {
    name: '中级',
    level: 3,
    color: '#3B82F6',
    description: '能够独立完成常见任务',
  },
  ADVANCED: {
    name: '高级',
    level: 4,
    color: '#8B5CF6',
    description: '能够解决复杂问题',
  },
  EXPERT: {
    name: '专家',
    level: 5,
    color: '#F59E0B',
    description: '该领域的专业人士',
  },
} as const;

// 任务难度常量
export const TASK_DIFFICULTIES = {
  EASY: {
    name: '简单',
    level: 1,
    color: '#10B981',
    icon: '🟢',
    expMultiplier: 1.0,
    timeEstimate: '1-2小时',
  },
  MEDIUM: {
    name: '中等',
    level: 2,
    color: '#F59E0B',
    icon: '🟡',
    expMultiplier: 1.5,
    timeEstimate: '3-6小时',
  },
  HARD: {
    name: '困难',
    level: 3,
    color: '#EF4444',
    icon: '🔴',
    expMultiplier: 2.0,
    timeEstimate: '1-2天',
  },
  EXPERT: {
    name: '专家级',
    level: 4,
    color: '#8B5CF6',
    icon: '🟣',
    expMultiplier: 3.0,
    timeEstimate: '3-7天',
  },
} as const;

// 奖励类型常量
export const REWARD_TYPES = {
  EXPERIENCE: {
    name: '经验值',
    icon: '⭐',
    color: '#F59E0B',
  },
  COINS: {
    name: '金币',
    icon: '🪙',
    color: '#EAB308',
  },
  BADGE: {
    name: '徽章',
    icon: '🏅',
    color: '#8B5CF6',
  },
  CERTIFICATE: {
    name: '证书',
    icon: '📜',
    color: '#3B82F6',
  },
} as const;

// 任务状态常量
export const TASK_STATUSES = {
  DRAFT: {
    name: '草稿',
    color: '#6B7280',
    icon: '📝',
  },
  PUBLISHED: {
    name: '已发布',
    color: '#10B981',
    icon: '📢',
  },
  IN_PROGRESS: {
    name: '进行中',
    color: '#3B82F6',
    icon: '⏳',
  },
  SUBMITTED: {
    name: '已提交',
    color: '#F59E0B',
    icon: '📤',
  },
  UNDER_REVIEW: {
    name: '审核中',
    color: '#8B5CF6',
    icon: '👀',
  },
  COMPLETED: {
    name: '已完成',
    color: '#10B981',
    icon: '✅',
  },
  REJECTED: {
    name: '已拒绝',
    color: '#EF4444',
    icon: '❌',
  },
  CANCELLED: {
    name: '已取消',
    color: '#6B7280',
    icon: '🚫',
  },
  EXPIRED: {
    name: '已过期',
    color: '#DC2626',
    icon: '⏰',
  },
} as const;

// 技能分类常量
export const SKILL_CATEGORIES = {
  FRONTEND: {
    name: '前端开发',
    icon: '🎨',
    color: '#3B82F6',
    description: '用户界面和用户体验开发',
  },
  BACKEND: {
    name: '后端开发',
    icon: '⚙️',
    color: '#10B981',
    description: '服务器端逻辑和数据库开发',
  },
  MOBILE: {
    name: '移动开发',
    icon: '📱',
    color: '#8B5CF6',
    description: 'iOS和Android应用开发',
  },
  DEVOPS: {
    name: 'DevOps',
    icon: '🔧',
    color: '#F59E0B',
    description: '部署、运维和自动化',
  },
  DATA_SCIENCE: {
    name: '数据科学',
    icon: '📊',
    color: '#EF4444',
    description: '数据分析和机器学习',
  },
  SECURITY: {
    name: '网络安全',
    icon: '🔒',
    color: '#DC2626',
    description: '信息安全和网络防护',
  },
  DESIGN: {
    name: '设计',
    icon: '🎭',
    color: '#EC4899',
    description: 'UI/UX设计和视觉设计',
  },
  TESTING: {
    name: '测试',
    icon: '🧪',
    color: '#06B6D4',
    description: '软件测试和质量保证',
  },
} as const;

// 任务分类常量
export const TASK_CATEGORIES = {
  BUG_FIX: {
    name: 'Bug修复',
    icon: '🐛',
    color: '#EF4444',
    description: '修复软件缺陷和错误',
  },
  FEATURE_DEVELOPMENT: {
    name: '功能开发',
    icon: '✨',
    color: '#3B82F6',
    description: '开发新功能和特性',
  },
  CODE_REVIEW: {
    name: '代码审查',
    icon: '👀',
    color: '#8B5CF6',
    description: '审查和改进代码质量',
  },
  DOCUMENTATION: {
    name: '文档编写',
    icon: '📚',
    color: '#10B981',
    description: '编写技术文档和说明',
  },
  OPTIMIZATION: {
    name: '性能优化',
    icon: '⚡',
    color: '#F59E0B',
    description: '提升系统性能和效率',
  },
  REFACTORING: {
    name: '代码重构',
    icon: '🔄',
    color: '#06B6D4',
    description: '改进代码结构和可维护性',
  },
  TESTING: {
    name: '测试编写',
    icon: '🧪',
    color: '#84CC16',
    description: '编写单元测试和集成测试',
  },
  DEPLOYMENT: {
    name: '部署配置',
    icon: '🚀',
    color: '#EC4899',
    description: '配置部署和运维环境',
  },
} as const;

// 成就分类常量
export const ACHIEVEMENT_CATEGORIES = {
  LEARNING: {
    name: '学习成长',
    icon: '📚',
    color: '#3B82F6',
  },
  CONTRIBUTION: {
    name: '贡献奖励',
    icon: '🤝',
    color: '#10B981',
  },
  MILESTONE: {
    name: '里程碑',
    icon: '🏁',
    color: '#F59E0B',
  },
  SPECIAL: {
    name: '特殊成就',
    icon: '🌟',
    color: '#8B5CF6',
  },
  COMMUNITY: {
    name: '社区活跃',
    icon: '👥',
    color: '#EC4899',
  },
} as const;

// 成就稀有度常量
export const ACHIEVEMENT_RARITIES = {
  COMMON: {
    name: '普通',
    color: '#6B7280',
    icon: '🥉',
    probability: 0.6,
  },
  UNCOMMON: {
    name: '稀有',
    color: '#10B981',
    icon: '🥈',
    probability: 0.25,
  },
  RARE: {
    name: '史诗',
    color: '#8B5CF6',
    icon: '🥇',
    probability: 0.1,
  },
  LEGENDARY: {
    name: '传说',
    color: '#F59E0B',
    icon: '👑',
    probability: 0.05,
  },
} as const;

// 通知类型常量
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: {
    name: '任务分配',
    icon: '📋',
    color: '#3B82F6',
  },
  TASK_COMPLETED: {
    name: '任务完成',
    icon: '✅',
    color: '#10B981',
  },
  ACHIEVEMENT_UNLOCKED: {
    name: '成就解锁',
    icon: '🏆',
    color: '#F59E0B',
  },
  LEVEL_UP: {
    name: '等级提升',
    icon: '⬆️',
    color: '#8B5CF6',
  },
  MESSAGE_RECEIVED: {
    name: '消息接收',
    icon: '💬',
    color: '#06B6D4',
  },
  SYSTEM_UPDATE: {
    name: '系统更新',
    icon: '🔄',
    color: '#6B7280',
  },
} as const;

// 通知优先级常量
export const NOTIFICATION_PRIORITIES = {
  LOW: {
    name: '低',
    level: 1,
    color: '#6B7280',
  },
  NORMAL: {
    name: '普通',
    level: 2,
    color: '#3B82F6',
  },
  HIGH: {
    name: '高',
    level: 3,
    color: '#F59E0B',
  },
  URGENT: {
    name: '紧急',
    level: 4,
    color: '#EF4444',
  },
} as const;

// 文件类型常量
export const FILE_TYPES = {
  IMAGE: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  DOCUMENT: {
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.md'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  CODE: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb', '.swift', '.kt'],
    mimeTypes: ['text/javascript', 'text/typescript', 'text/x-python', 'text/x-java-source', 'text/x-c++src', 'text/x-csrc'],
    maxSize: 1 * 1024 * 1024, // 1MB
  },
  ARCHIVE: {
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
} as const;

// 分页常量
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,
  DEFAULT_PAGE: 1,
} as const;

// 搜索常量
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  DEBOUNCE_DELAY: 300, // 毫秒
  MAX_RESULTS: 50,
  HIGHLIGHT_CLASS: 'search-highlight',
} as const;

// 缓存常量
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5分钟
  SHORT_TTL: 1 * 60 * 1000, // 1分钟
  LONG_TTL: 60 * 60 * 1000, // 1小时
  PERSISTENT_TTL: 24 * 60 * 60 * 1000, // 24小时
  MAX_SIZE: 100, // 最大缓存项数
} as const;

// 主题常量
export const THEMES = {
  LIGHT: {
    name: '浅色主题',
    value: 'light',
    icon: '☀️',
  },
  DARK: {
    name: '深色主题',
    value: 'dark',
    icon: '🌙',
  },
  AUTO: {
    name: '跟随系统',
    value: 'auto',
    icon: '🔄',
  },
} as const;

// 语言常量
export const LANGUAGES = {
  ZH_CN: {
    name: '简体中文',
    value: 'zh-CN',
    flag: '🇨🇳',
  },
  EN_US: {
    name: 'English',
    value: 'en-US',
    flag: '🇺🇸',
  },
  JA_JP: {
    name: '日本語',
    value: 'ja-JP',
    flag: '🇯🇵',
  },
  KO_KR: {
    name: '한국어',
    value: 'ko-KR',
    flag: '🇰🇷',
  },
} as const;

// 时区常量
export const TIMEZONES = {
  UTC: 'UTC',
  BEIJING: 'Asia/Shanghai',
  TOKYO: 'Asia/Tokyo',
  SEOUL: 'Asia/Seoul',
  NEW_YORK: 'America/New_York',
  LOS_ANGELES: 'America/Los_Angeles',
  LONDON: 'Europe/London',
  PARIS: 'Europe/Paris',
} as const;

// 日期格式常量
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY_DATE: 'YYYY年MM月DD日',
  DISPLAY_TIME: 'HH:mm',
  DISPLAY_DATETIME: 'YYYY年MM月DD日 HH:mm',
  RELATIVE: 'relative',
} as const;

// 正则表达式常量
export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^1[3-9]\d{9}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  CHINESE: /[\u4e00-\u9fa5]/,
  NUMBER: /^\d+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
} as const;

// 错误代码常量
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  
  // 认证错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  
  // 业务错误
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // 文件错误
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // 系统错误
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

// 成功代码常量
export const SUCCESS_CODES = {
  OPERATION_SUCCESS: 'OPERATION_SUCCESS',
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  DELETED: 'DELETED',
  UPLOADED: 'UPLOADED',
  SENT: 'SENT',
  COMPLETED: 'COMPLETED',
} as const;

// 版本类型常量
export const VERSION_TYPES = {
  COMMUNITY: {
    name: '社区版',
    value: 'community',
    features: {
      maxApiCalls: 100,
      maxStorage: 1024 * 1024 * 1024, // 1GB
      maxUsers: 1,
      advancedAnalytics: false,
      teamCollaboration: false,
      prioritySupport: false,
    },
  },
  ENTERPRISE: {
    name: '企业版',
    value: 'enterprise',
    features: {
      maxApiCalls: 10000,
      maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
      maxUsers: Infinity,
      advancedAnalytics: true,
      teamCollaboration: true,
      prioritySupport: true,
    },
  },
} as const;

// 功能开关常量
export const FEATURE_FLAGS = {
  DARK_MODE: 'dark_mode',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  TEAM_COLLABORATION: 'team_collaboration',
  ADVANCED_SEARCH: 'advanced_search',
  FILE_UPLOAD: 'file_upload',
  REAL_TIME_CHAT: 'real_time_chat',
  CODE_REVIEW: 'code_review',
  AUTOMATED_TESTING: 'automated_testing',
  DEPLOYMENT_PIPELINE: 'deployment_pipeline',
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  theme: THEMES.AUTO.value,
  language: LANGUAGES.ZH_CN.value,
  timezone: TIMEZONES.BEIJING,
  dateFormat: DATE_FORMATS.DISPLAY_DATETIME,
  pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  notifications: {
    email: true,
    push: true,
    inApp: true,
  },
  privacy: {
    showProfile: true,
    showActivity: true,
    allowMessages: true,
  },
} as const;