/**
 * API 配置文件
 * 统一管理所有API相关的配置
 */

// API基础URL配置
export const API_BASE_URL =
  import.meta.env.VITE_APP_API_URL || 'http://localhost:8000/api';

// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    // OAuth相关
    oauthCallback: '/auth/oauth/callback',
    oauthGithub: '/auth/oauth/github',
    oauthWechat: '/auth/oauth/wechat',
    oauthGoogle: '/auth/oauth/google',
  },

  // 校验相关
  validation: {
    field: '/validation/field',
    form: '/validation/form',
    register: '/validation/register',
    health: '/validation/health',
    exceptionStates: '/validation/exception-states',
    uniqueCheck: '/validation/unique-check',
    demoData: '/validation/demo-data',
  },

  // 用户管理
  users: {
    list: '/users',
    create: '/users',
    update: '/users',
    delete: '/users',
  },

  // 面试题相关
  interviewQuestions: {
    list: '/interview-questions',
    create: '/interview-questions',
    update: '/interview-questions',
    delete: '/interview-questions',
  },

  // 成长相关
  growth: {
    profile: '/growth/profile',
    skills: '/growth/skills',
    achievements: '/growth/achievements',
  },
} as const;

// 请求超时配置
export const REQUEST_TIMEOUT = 10000; // 10秒

// 重试配置
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1秒
};

// 健康检查配置
export const HEALTH_CHECK = {
  endpoint: API_ENDPOINTS.validation.health,
  interval: 30000, // 30秒
};
