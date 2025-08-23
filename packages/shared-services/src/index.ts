/**
 * 共享服务包主入口文件
 * 统一导出所有服务模块
 */

// 基础服务
export { BaseService } from './base/BaseService';
export type { ServiceConfig } from './types/ServiceConfig';
export { ServiceStatus } from './interfaces/IService';

// 错误类型
export {
  ServiceError,
  ValidationError,
  ServiceErrorType,
  ConfigurationError,
  InitializationError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  AuthorizationError
} from './types/ServiceError';
export type {
  ServiceErrorOptions,
  ServiceErrorJSON,
  ValidationErrorDetail
} from './types/ServiceError';

// 成就服务
export { AchievementService } from './achievement/AchievementService';

// API服务
export { ApiService } from './api/ApiService';

// 认证服务
export { AuthService } from './auth/AuthService';

// 缓存服务
export { CacheService } from './cache/CacheService';

// 配置服务
export { ConfigService } from './config/ConfigService';

// 邮件服务
export { EmailService } from './email/EmailService';

// 文件服务
export { FileService } from './file/FileService';

// 日志服务
export { LoggingService } from './logging/LoggingService';

// 监控服务
export { MonitoringService } from './monitoring/MonitoringService';

// 通知服务
export { NotificationService } from './notification/NotificationService';

// 安全服务
export { SecurityService } from './security/SecurityService';

// 技能服务
export { SkillService } from './skill/SkillService';

// 任务服务
export { TaskService } from './task/TaskService';

// 用户服务
export { UserService } from './user/UserService';

// 工作流服务
export { WorkflowService } from './workflow/WorkflowService';