import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ServiceErrorType, ValidationError, NotFoundError, handleUnknownError } from '../types/ServiceError';
import { NotificationConfig } from '../types/ServiceConfig';
// import { SERVICE_EVENTS, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../types/ServiceConstants';
import { Notification, NotificationChannel, PaginatedResponse } from '@phoenixcoder/shared-types';
import { ApiClient, buildURL } from '@phoenixcoder/shared-utils';
import { EventEmitter } from 'eventemitter3';

/**
 * 通知模板接口
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  title: string;
  content: string;
  channel: NotificationChannel[];
  variables?: string[];
  isActive: boolean;
  description?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 通知查询参数
 */
export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  type?: string | string[];
  channel?: NotificationChannel | NotificationChannel[];
  priority?: string | string[];
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 通知创建数据
 */
export interface NotificationCreateData {
  userId: string;
  type: string;
  title: string;
  content: string;
  channel?: NotificationChannel[];
  priority?: string;
  data?: Record<string, any>;
  templateId?: string;
  templateData?: Record<string, any>;
  scheduledAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  imageUrl?: string;
  tags?: string[];
}

/**
 * 批量通知创建数据
 */
export interface BatchNotificationCreateData {
  userIds: string[];
  type: string;
  title: string;
  content: string;
  channel?: NotificationChannel[];
  priority?: string;
  data?: Record<string, any>;
  templateId?: string;
  templateData?: Record<string, any>;
  scheduledAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  imageUrl?: string;
  tags?: string[];
}

/**
 * 通知模板创建数据
 */
export interface NotificationTemplateCreateData {
  name: string;
  type: string;
  title: string;
  content: string;
  channel: NotificationChannel[];
  variables?: string[];
  isActive?: boolean;
  description?: string;
  category?: string;
}

/**
 * 通知模板更新数据
 */
export interface NotificationTemplateUpdateData {
  name?: string;
  title?: string;
  content?: string;
  channel?: NotificationChannel[];
  variables?: string[];
  isActive?: boolean;
  description?: string;
  category?: string;
}

/**
 * 通知偏好设置
 */
export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  types: Record<string, {
    enabled: boolean;
    channels: NotificationChannel[];
    priority: string;
  }>;
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    timezone: string;
  };
  frequency?: {
    digest: boolean;
    immediate: boolean;
    daily: boolean;
    weekly: boolean;
  };
}

/**
 * 通知统计信息
 */
export interface NotificationStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byChannel: Record<NotificationChannel, number>;
  byPriority: Record<string, number>;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  recentActivity: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

/**
 * 通知发送结果
 */
export interface NotificationSendResult {
  notificationId: string;
  status: 'success' | 'failed' | 'partial';
  channels: Record<NotificationChannel, {
    status: 'success' | 'failed';
    messageId?: string;
    error?: string;
  }>;
  sentAt: Date;
  deliveredAt?: Date;
  error?: string;
}

/**
 * 通知事件接口
 */
export interface NotificationEvents {
  'notification:created': (notification: Notification) => void;
  'notification:sent': (result: NotificationSendResult) => void;
  'notification:delivered': (notificationId: string, channel: NotificationChannel) => void;
  'notification:read': (notificationId: string, userId: string) => void;
  'notification:clicked': (notificationId: string, userId: string) => void;
  'notification:failed': (notificationId: string, error: string) => void;
  'template:created': (template: NotificationTemplate) => void;
  'template:updated': (template: NotificationTemplate) => void;
  'template:deleted': (templateId: string) => void;
  'preferences:updated': (preferences: NotificationPreferences) => void;
  'notification:error': (error: ServiceError) => void;
  'notification:batch-read': (data: { notificationIds: string[]; userId: string }) => void;
  'notification:deleted': (data: { notificationId: string }) => void;
  'notification:user-notifications-fetched': (data: { userId: string; notifications: Notification[]; params: any }) => void;
  'notification:unread-count-fetched': (data: { userId: string; count: number }) => void;
}

/**
 * 通知服务类
 */
export class NotificationService extends BaseService implements IService {
  private apiClient: ApiClient;
  private eventEmitter: EventEmitter<NotificationEvents>;
  private notificationCache: Map<string, { notification: Notification; timestamp: number }>;
  private templateCache: Map<string, { template: NotificationTemplate; timestamp: number }>;
  private preferencesCache: Map<string, { preferences: NotificationPreferences; timestamp: number }>;
  private readonly CACHE_TTL = 300000; // 5分钟缓存
  private webSocketConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(protected override config: NotificationConfig) {
    super(config, 'NotificationService', '1.0.0');
    
    this.apiClient = new ApiClient(
      config.baseUrl,
      {
        'Content-Type': 'application/json'
      }
    );

    this.eventEmitter = new EventEmitter();
    this.notificationCache = new Map();
    this.templateCache = new Map();
    this.preferencesCache = new Map();
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 启动缓存清理
    this.startCacheCleanup();
    
    // 建立WebSocket连接用于实时通知
    if (this.config.websocketUrl) {
      await this.connectWebSocket();
    }
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    this.notificationCache.clear();
    this.templateCache.clear();
    this.preferencesCache.clear();
    
    // 关闭WebSocket连接
    if (this.webSocketConnection) {
      this.webSocketConnection.close();
      this.webSocketConnection = null;
    }
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/notifications/health');
      return response.status === 200;
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * 获取通知列表
   */
  async getNotifications(params: NotificationQueryParams = {}): Promise<PaginatedResponse<Notification>> {
    try {
      const url = buildURL(this.config.baseUrl, '/notifications', params);
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<Notification>;
      
      // 缓存通知数据
      result.data.forEach((notification: Notification) => {
        this.setNotificationCache(notification.id, notification);
      });
      
      // 移除事件触发，因为这是通用的获取通知方法
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'getNotifications', ServiceErrorType.DATA);
      serviceError.message = '获取通知列表失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 根据ID获取通知
   */
  async getNotificationById(notificationId: string, useCache: boolean = true): Promise<Notification> {
    // 检查缓存
    if (useCache) {
      const cached = this.getNotificationFromCache(notificationId);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.apiClient.get(`/notifications/${notificationId}`);
      const notification = response.data as Notification;
      
      // 更新缓存
      this.setNotificationCache(notificationId, notification);
      
      // 移除不存在的事件
      return notification;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error && (error as any).response?.status === 404) {
        throw new NotFoundError(`通知 ${notificationId} 不存在`, 'notification', 'NotificationService');
      }
      const serviceError = new ServiceError({
        message: '获取通知失败',
        code: 'NOTIFICATION_GET_ERROR',
        type: ServiceErrorType.DATA,
        serviceName: 'NotificationService',
        operation: 'getNotificationById',
        innerError: error instanceof Error ? error : undefined
      });
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 创建通知
   */
  async createNotification(notificationData: NotificationCreateData): Promise<Notification> {
    try {
      const response = await this.apiClient.post('/notifications', notificationData);
      const notification = response.data as Notification;
      
      // 更新缓存
      this.setNotificationCache(notification.id, notification);
      
      this.eventEmitter.emit('notification:created', notification);
      // this.emit(SERVICE_EVENTS.NOTIFICATION_CREATED, { notification });
      
      return notification;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'createNotification', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('通知数据验证失败', [{ field: 'notificationData', message: '通知数据验证失败', code: 'INVALID_NOTIFICATION_DATA' }], 'NotificationService');
      }
      serviceError.message = '创建通知失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 批量创建通知
   */
  async createBatchNotifications(batchData: BatchNotificationCreateData): Promise<Notification[]> {
    try {
      const response = await this.apiClient.post('/notifications/batch', batchData);
      const notifications = response.data as Notification[];
      
      // 更新缓存
      notifications.forEach(notification => {
        this.setNotificationCache(notification.id, notification);
      });
      
      // 移除不存在的事件
      return notifications;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'createBatchNotifications', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('批量通知数据验证失败', [{ field: 'batchData', message: '批量通知数据验证失败', code: 'INVALID_BATCH_DATA' }], 'NotificationService');
      }
      serviceError.message = '批量创建通知失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 发送通知
   */
  async sendNotification(notificationId: string): Promise<NotificationSendResult> {
    try {
      const response = await this.apiClient.post(`/notifications/${notificationId}/send`);
      const result = response.data as NotificationSendResult;
      
      // 清除缓存，强制重新获取
      this.notificationCache.delete(notificationId);
      
      this.eventEmitter.emit('notification:sent', result);
      // this.emit(SERVICE_EVENTS.NOTIFICATION_SENT, { result });
      
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'sendNotification', ServiceErrorType.EXTERNAL_SERVICE);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`通知 ${notificationId} 不存在`, 'notification', 'NotificationService');
      }
      serviceError.message = '发送通知失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await this.apiClient.post(`/notifications/${notificationId}/read`, { userId });
      
      // 清除缓存，强制重新获取
      this.notificationCache.delete(notificationId);
      
      this.eventEmitter.emit('notification:read', notificationId, userId);
      // this.emit(SERVICE_EVENTS.NOTIFICATION_READ, { notificationId, userId });
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'markAsRead', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`通知 ${notificationId} 不存在`, 'notification', 'NotificationService');
      }
      serviceError.message = '标记通知已读失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 批量标记通知为已读
   */
  async markBatchAsRead(notificationIds: string[], userId: string): Promise<void> {
    try {
      await this.apiClient.post('/notifications/batch-read', { notificationIds, userId });
      
      // 清除相关缓存
      notificationIds.forEach(id => {
        this.notificationCache.delete(id);
      });
      
      this.eventEmitter.emit('notification:batch-read', { notificationIds, userId });
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'markBatchAsRead', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('批量标记已读数据验证失败', [{ field: 'notificationIds', message: '批量标记已读数据验证失败', code: 'INVALID_BATCH_READ_DATA' }], 'NotificationService');
      }
      serviceError.message = '批量标记通知已读失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/notifications/${notificationId}`);
      
      // 清除缓存
      this.notificationCache.delete(notificationId);
      
      this.eventEmitter.emit('notification:deleted', { notificationId });
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'deleteNotification', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`通知 ${notificationId} 不存在`, 'notification', 'NotificationService');
      }
      serviceError.message = '删除通知失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取用户通知
   */
  async getUserNotifications(userId: string, params: Omit<NotificationQueryParams, 'userId'> = {}): Promise<PaginatedResponse<Notification>> {
    try {
      const queryParams = { ...params, userId };
      const url = buildURL(this.config.baseUrl, '/notifications', queryParams);
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<Notification>;
      
      // 缓存通知数据
      result.data.forEach(notification => {
        this.setNotificationCache(notification.id, notification);
      });
      
      this.eventEmitter.emit('notification:user-notifications-fetched', { userId, notifications: result.data, params });
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'getUserNotifications', ServiceErrorType.DATA);
      serviceError.message = '获取用户通知失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/notifications/unread-count`);
      const count = response.data.count as number;
      
      this.eventEmitter.emit('notification:unread-count-fetched', { userId, count });
      return count;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'getUnreadCount', ServiceErrorType.DATA);
      serviceError.message = '获取未读通知数量失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 创建通知模板
   */
  async createTemplate(templateData: NotificationTemplateCreateData): Promise<NotificationTemplate> {
    try {
      const response = await this.apiClient.post('/notification-templates', templateData);
      const template = response.data as NotificationTemplate;
      
      // 更新缓存
      this.setTemplateCache(template.id, template);
      
      this.eventEmitter.emit('template:created', template);
      // this.emit(SERVICE_EVENTS.NOTIFICATION_TEMPLATE_CREATED, { template });
      
      return template;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'createTemplate', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('通知模板数据验证失败', [{ field: 'templateData', message: '通知模板数据验证失败', code: 'TEMPLATE_VALIDATION_ERROR' }], 'NotificationService');
      }
      serviceError.message = '创建通知模板失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新通知模板
   */
  async updateTemplate(templateId: string, updateData: NotificationTemplateUpdateData): Promise<NotificationTemplate> {
    try {
      const response = await this.apiClient.put(`/notification-templates/${templateId}`, updateData);
      const template = response.data as NotificationTemplate;
      
      // 更新缓存
      this.setTemplateCache(templateId, template);
      
      this.eventEmitter.emit('template:updated', template);
      // this.emit(SERVICE_EVENTS.NOTIFICATION_TEMPLATE_UPDATED, { template });
      
      return template;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'updateTemplate', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`通知模板 ${templateId} 不存在`, 'notificationTemplate', 'NotificationService');
      }
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('通知模板更新数据验证失败', [{ field: 'updateData', message: '通知模板更新数据验证失败', code: 'TEMPLATE_UPDATE_VALIDATION_ERROR' }], 'NotificationService');
      }
      serviceError.message = '更新通知模板失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 删除通知模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/notification-templates/${templateId}`);
      
      // 清除缓存
      this.templateCache.delete(templateId);
      
      this.eventEmitter.emit('template:deleted', templateId);
      // this.emit(SERVICE_EVENTS.NOTIFICATION_TEMPLATE_DELETED, { templateId });
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'deleteTemplate', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`通知模板 ${templateId} 不存在`, 'notificationTemplate', 'NotificationService');
      }
      serviceError.message = '删除通知模板失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取通知模板
   */
  async getTemplate(templateId: string, useCache: boolean = true): Promise<NotificationTemplate> {
    // 检查缓存
    if (useCache) {
      const cached = this.getTemplateFromCache(templateId);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.apiClient.get(`/notification-templates/${templateId}`);
      const template = response.data as NotificationTemplate;
      
      // 更新缓存
      this.setTemplateCache(templateId, template);
      
      // this.emit(SERVICE_EVENTS.NOTIFICATION_TEMPLATE_FETCHED, { template });
      return template;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'getTemplate', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`通知模板 ${templateId} 不存在`, 'notificationTemplate', 'NotificationService');
      }
      serviceError.message = '获取通知模板失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取通知模板列表
   */
  async getTemplates(params: { page?: number; limit?: number; type?: string; category?: string } = {}): Promise<PaginatedResponse<NotificationTemplate>> {
    try {
      const url = buildURL(this.config.baseUrl, '/notification-templates', params);
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<NotificationTemplate>;
      
      // 缓存模板数据
      result.data.forEach(template => {
        this.setTemplateCache(template.id, template);
      });
      
      // this.emit(SERVICE_EVENTS.NOTIFICATION_TEMPLATE_LIST_FETCHED, { templates: result.items, params });
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'getTemplates', ServiceErrorType.DATA);
      serviceError.message = '获取通知模板列表失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取用户通知偏好
   */
  async getUserPreferences(userId: string, useCache: boolean = true): Promise<NotificationPreferences> {
    // 检查缓存
    if (useCache) {
      const cached = this.getPreferencesFromCache(userId);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.apiClient.get(`/users/${userId}/notification-preferences`);
      const preferences = response.data as NotificationPreferences;
      
      // 更新缓存
      this.setPreferencesCache(userId, preferences);
      
      // this.emit(SERVICE_EVENTS.NOTIFICATION_PREFERENCES_FETCHED, { userId, preferences });
      return preferences;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'getUserPreferences', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'NotificationService');
      }
      serviceError.message = '获取用户通知偏好失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新用户通知偏好
   */
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await this.apiClient.put(`/users/${userId}/notification-preferences`, preferences);
      const updatedPreferences = response.data as NotificationPreferences;
      
      // 更新缓存
      this.setPreferencesCache(userId, updatedPreferences);
      
      this.eventEmitter.emit('preferences:updated', updatedPreferences);
      // this.emit(SERVICE_EVENTS.NOTIFICATION_PREFERENCES_UPDATED, { userId, preferences: updatedPreferences });
      
      return updatedPreferences;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'updateUserPreferences', ServiceErrorType.DATA);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'NotificationService');
      }
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('通知偏好数据验证失败', [{ field: 'preferences', message: '通知偏好数据验证失败', code: 'PREFERENCES_VALIDATION_ERROR' }], 'NotificationService');
      }
      serviceError.message = '更新用户通知偏好失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取通知统计信息
   */
  async getNotificationStats(filters: Partial<NotificationQueryParams> = {}): Promise<NotificationStats> {
    try {
      const url = buildURL(this.config.baseUrl, '/notifications/stats', filters);
      const response = await this.apiClient.get(url);
      const stats = response.data as NotificationStats;
      
      // this.emit(SERVICE_EVENTS.NOTIFICATION_STATS_FETCHED, { stats });
      return stats;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'getNotificationStats', ServiceErrorType.DATA);
      serviceError.message = '获取通知统计失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 测试通知发送
   */
  async testNotification(testData: {
    userId: string;
    channel: NotificationChannel;
    title: string;
    content: string;
  }): Promise<NotificationSendResult> {
    try {
      const response = await this.apiClient.post('/notifications/test', testData);
      const result = response.data as NotificationSendResult;
      
      // this.emit(SERVICE_EVENTS.NOTIFICATION_TEST_SENT, { testData, result });
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'NotificationService', 'testNotification', ServiceErrorType.DATA);
      serviceError.message = '测试通知发送失败';
      this.eventEmitter.emit('notification:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 清除通知缓存
   */
  clearNotificationCache(notificationId?: string): void {
    if (notificationId) {
      this.notificationCache.delete(notificationId);
    } else {
      this.notificationCache.clear();
    }
  }

  /**
   * 清除模板缓存
   */
  clearTemplateCache(templateId?: string): void {
    if (templateId) {
      this.templateCache.delete(templateId);
    } else {
      this.templateCache.clear();
    }
  }

  /**
   * 清除偏好缓存
   */
  clearPreferencesCache(userId?: string): void {
    if (userId) {
      this.preferencesCache.delete(userId);
    } else {
      this.preferencesCache.clear();
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { notifications: number; templates: number; preferences: number } {
    return {
      notifications: this.notificationCache.size,
      templates: this.templateCache.size,
      preferences: this.preferencesCache.size
    };
  }

  /**
   * 监听通知事件
   */
  override on<T extends string | symbol>(event: T, fn: (...args: any[]) => void, context?: any): this {
    return super.on(event, fn, context);
  }

  /**
   * 监听通知事件（类型安全版本）
   */
  onNotificationEvent<K extends keyof NotificationEvents>(event: K, listener: NotificationEvents[K]): void {
    this.eventEmitter.on(event, listener as any);
  }

  /**
   * 移除通知事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: any[]) => void) | undefined, context?: any, once?: boolean | undefined): this {
    return super.off(event, fn, context, once);
  }

  /**
   * 移除通知事件监听（类型安全版本）
   */
  offNotificationEvent<K extends keyof NotificationEvents>(event: K, listener: NotificationEvents[K]): void {
    this.eventEmitter.off(event, listener as any);
  }

  /**
   * 建立WebSocket连接
   */
  private async connectWebSocket(): Promise<void> {
    if (!this.config.websocketUrl) {
      return;
    }

    try {
      this.webSocketConnection = new WebSocket(this.config.websocketUrl);
      
      this.webSocketConnection.onopen = () => {
        this.reconnectAttempts = 0;
        // this.emit(SERVICE_EVENTS.WEBSOCKET_CONNECTED, {});
      };
      
      this.webSocketConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error: unknown) {
          console.error('WebSocket message parse error:', error instanceof Error ? error.message : String(error));
        }
      };
      
      this.webSocketConnection.onclose = () => {
        // this.emit(SERVICE_EVENTS.WEBSOCKET_DISCONNECTED, {});
        this.handleWebSocketReconnect();
      };
      
      this.webSocketConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        // this.emit(SERVICE_EVENTS.WEBSOCKET_ERROR, { error });
      };
    } catch (error: unknown) {
      console.error('WebSocket connection error:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 处理WebSocket消息
   */
  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'notification:delivered':
        this.eventEmitter.emit('notification:delivered', data.notificationId, data.channel);
        break;
      case 'notification:read':
        this.eventEmitter.emit('notification:read', data.notificationId, data.userId);
        break;
      case 'notification:clicked':
        this.eventEmitter.emit('notification:clicked', data.notificationId, data.userId);
        break;
      case 'notification:failed':
        this.eventEmitter.emit('notification:failed', data.notificationId, data.error);
        break;
      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  }

  /**
   * 处理WebSocket重连
   */
  private handleWebSocketReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 指数退避
      
      setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    }
  }

  /**
   * 从缓存获取通知
   */
  private getNotificationFromCache(notificationId: string): Notification | null {
    const cached = this.notificationCache.get(notificationId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.notification;
    }
    if (cached) {
      this.notificationCache.delete(notificationId);
    }
    return null;
  }

  /**
   * 设置通知缓存
   */
  private setNotificationCache(notificationId: string, notification: Notification): void {
    this.notificationCache.set(notificationId, {
      notification,
      timestamp: Date.now()
    });
  }

  /**
   * 从缓存获取模板
   */
  private getTemplateFromCache(templateId: string): NotificationTemplate | null {
    const cached = this.templateCache.get(templateId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.template;
    }
    if (cached) {
      this.templateCache.delete(templateId);
    }
    return null;
  }

  /**
   * 设置模板缓存
   */
  private setTemplateCache(templateId: string, template: NotificationTemplate): void {
    this.templateCache.set(templateId, {
      template,
      timestamp: Date.now()
    });
  }

  /**
   * 从缓存获取偏好
   */
  private getPreferencesFromCache(userId: string): NotificationPreferences | null {
    const cached = this.preferencesCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.preferences;
    }
    if (cached) {
      this.preferencesCache.delete(userId);
    }
    return null;
  }

  /**
   * 设置偏好缓存
   */
  private setPreferencesCache(userId: string, preferences: NotificationPreferences): void {
    this.preferencesCache.set(userId, {
      preferences,
      timestamp: Date.now()
    });
  }

  /**
   * 启动缓存清理
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // 清理通知缓存
      for (const [notificationId, cached] of this.notificationCache.entries()) {
        if (now - cached.timestamp >= this.CACHE_TTL) {
          this.notificationCache.delete(notificationId);
        }
      }
      
      // 清理模板缓存
      for (const [templateId, cached] of this.templateCache.entries()) {
        if (now - cached.timestamp >= this.CACHE_TTL) {
          this.templateCache.delete(templateId);
        }
      }
      
      // 清理偏好缓存
      for (const [userId, cached] of this.preferencesCache.entries()) {
        if (now - cached.timestamp >= this.CACHE_TTL) {
          this.preferencesCache.delete(userId);
        }
      }
    }, 60000); // 每分钟清理一次过期缓存
  }
}

// 全局通知服务实例
let notificationServiceInstance: NotificationService | null = null;

/**
 * 创建通知服务实例
 */
export function createNotificationService(config: NotificationConfig): NotificationService {
  return new NotificationService(config);
}

/**
 * 获取通知服务实例
 */
export function getNotificationService(): NotificationService | null {
  return notificationServiceInstance;
}

/**
 * 初始化通知服务
 */
export async function initNotificationService(config: NotificationConfig): Promise<NotificationService> {
  if (notificationServiceInstance) {
    await notificationServiceInstance.destroy();
  }
  
  notificationServiceInstance = new NotificationService(config);
  await notificationServiceInstance.initialize();
  
  return notificationServiceInstance;
}

/**
 * 销毁通知服务
 */
export async function destroyNotificationService(): Promise<void> {
  if (notificationServiceInstance) {
    await notificationServiceInstance.destroy();
    notificationServiceInstance = null;
  }
}



// 导出默认实例
export default NotificationService;