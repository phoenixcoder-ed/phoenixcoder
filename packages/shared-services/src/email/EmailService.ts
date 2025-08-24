import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ServiceErrorType, ValidationError, handleUnknownError } from '../types/ServiceError';
import { EmailServiceConfig } from '../types/ServiceConfig';
import { SERVICE_EVENTS } from '../types/ServiceConstants';
import { EventEmitter } from 'eventemitter3';
import { createTransport, Transporter, SendMailOptions } from 'nodemailer';
// import { readFile } from 'fs/promises';
// import { join } from 'path';

/**
 * 邮件地址接口
 */
export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * 邮件附件接口
 */
export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  cid?: string; // Content-ID for inline attachments
}

/**
 * 邮件内容接口
 */
export interface EmailContent {
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  replyTo?: EmailAddress;
  references?: string[];
  inReplyTo?: string;
}

/**
 * 邮件发送选项
 */
export interface EmailSendOptions {
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  content: EmailContent;
  templateId?: string;
  templateData?: Record<string, unknown>;
  sendAt?: Date; // 定时发送
  retryCount?: number;
  priority?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * 邮件模板接口
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  textTemplate?: string;
  htmlTemplate?: string;
  variables: string[];
  category?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 邮件模板创建数据
 */
export interface EmailTemplateCreateData {
  name: string;
  subject: string;
  textTemplate?: string;
  htmlTemplate?: string;
  category?: string;
  description?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 邮件模板更新数据
 */
export interface EmailTemplateUpdateData {
  name?: string;
  subject?: string;
  textTemplate?: string;
  htmlTemplate?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * 邮件发送结果
 */
export interface EmailSendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
  envelope: {
    from: string;
    to: string[];
  };
}

/**
 * 邮件队列项
 */
export interface EmailQueueItem {
  id: string;
  options: EmailSendOptions;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  processedAt?: Date;
  sentAt?: Date;
  error?: string;
  result?: EmailSendResult;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 邮件查询参数
 */
export interface EmailQueryParams {
  status?: EmailQueueItem['status'];
  from?: string;
  to?: string;
  subject?: string;
  templateId?: string;
  tags?: string[];
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  sentAfter?: Date;
  sentBefore?: Date;
  sortBy?: 'createdAt' | 'scheduledAt' | 'sentAt' | 'attempts';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 邮件模板查询参数
 */
export interface EmailTemplateQueryParams {
  category?: string;
  isActive?: boolean;
  search?: string;
  createdBy?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 邮件统计信息
 */
export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  totalProcessing: number;
  sentToday: number;
  failedToday: number;
  averageDeliveryTime: number;
  deliveryRate: number;
  bounceRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  topFailureReasons: { reason: string; count: number }[];
  sendingVolumeByDay: Record<string, number>;
  templateUsage: Record<string, number>;
}

/**
 * SMTP配置
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
  rateDelta?: number;
  rateLimit?: number;
}

/**
 * 邮件服务配置
 */
export interface EmailServiceOptions {
  smtp: SMTPConfig;
  defaultFrom: EmailAddress;
  templatesPath?: string;
  queueConcurrency?: number;
  retryDelay?: number;
  maxRetries?: number;
  enableTracking?: boolean;
  trackingDomain?: string;
  unsubscribeUrl?: string;
  webhookUrl?: string;
}

/**
 * 邮件事件接口
 */
export interface EmailEvents {
  'email:queued': (item: EmailQueueItem) => void;
  'email:sending': (item: EmailQueueItem) => void;
  'email:sent': (item: EmailQueueItem, result: EmailSendResult) => void;
  'email:failed': (item: EmailQueueItem, error: Error) => void;
  'email:retry': (item: EmailQueueItem, attempt: number) => void;
  'email:cancelled': (item: EmailQueueItem) => void;
  'email:opened': (messageId: string, recipient: string) => void;
  'email:clicked': (messageId: string, recipient: string, url: string) => void;
  'email:bounced': (messageId: string, recipient: string, reason: string) => void;
  'email:unsubscribed': (recipient: string) => void;
  'template:created': (template: EmailTemplate) => void;
  'template:updated': (template: EmailTemplate) => void;
  'template:deleted': (templateId: string) => void;
  'queue:processed': (processed: number, pending: number) => void;
  'email:error': (error: ServiceError) => void;
}

/**
 * 邮件服务类
 */
export class EmailService extends BaseService implements IService {
  private eventEmitter: EventEmitter<EmailEvents>;
  private transporter: Transporter;
  private templates: Map<string, EmailTemplate>;
  private queue: Map<string, EmailQueueItem>;
  private options: EmailServiceOptions;
  private stats: EmailStats;
  private isProcessing: boolean;
  private processingInterval?: NodeJS.Timeout;

  constructor(config: EmailServiceConfig) {
    super(config, 'EmailService', '1.0.0');
    
    this.eventEmitter = new EventEmitter();
    this.templates = new Map();
    this.queue = new Map();
    this.isProcessing = false;
    
    this.options = {
      queueConcurrency: 5,
      retryDelay: 60000, // 1分钟
      maxRetries: 3,
      enableTracking: false,
      ...config.emailOptions,
      smtp: {
        ...config.emailOptions?.smtp,
        secure: config.emailOptions?.smtp?.secure ?? false
      }
    };
    
    // 创建邮件传输器
    this.transporter = createTransport({
      ...this.options.smtp,
      secure: this.options.smtp.secure ?? false
    });
    
    // 初始化统计信息
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      totalPending: 0,
      totalProcessing: 0,
      sentToday: 0,
      failedToday: 0,
      averageDeliveryTime: 0,
      deliveryRate: 0,
      bounceRate: 0,
      openRate: 0,
      clickRate: 0,
      unsubscribeRate: 0,
      topFailureReasons: [],
      sendingVolumeByDay: {},
      templateUsage: {}
    };
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 验证SMTP连接
    await this.verifyConnection();
    
    // 加载邮件模板
    await this.loadTemplates();
    
    // 启动队列处理
    this.startQueueProcessing();
    
    // 更新统计信息
    await this.updateStats();
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    // 停止队列处理
    this.stopQueueProcessing();
    
    // 关闭传输器
    this.transporter.close();
    
    // 清理事件监听器
    this.eventEmitter.removeAllListeners();
    
    // 清理数据
    this.templates.clear();
    this.queue.clear();
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<Record<string, unknown>> {
    try {
      await this.verifyConnection();
      return { success: true, status: 'healthy', queueSize: this.queue.size, templatesCount: this.templates.size };
    } catch (error) {
      return { success: false, status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 发送邮件
   */
  async sendEmail(options: EmailSendOptions): Promise<string> {
    try {
      // 验证邮件选项
      this.validateEmailOptions(options);
      
      // 创建队列项
      const queueItem: EmailQueueItem = {
        id: this.generateId(),
        options,
        status: 'pending',
        attempts: 0,
        maxAttempts: options.retryCount || this.options.maxRetries || 3,
        scheduledAt: options.sendAt || new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 添加到队列
      this.queue.set(queueItem.id, queueItem);
      
      // 发射事件
      this.eventEmitter.emit('email:queued', queueItem);
      this.emit(SERVICE_EVENTS.EMAIL_QUEUED, queueItem);
      
      // 更新统计
      await this.updateStats();
      
      return queueItem.id;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'EmailService', 'sendEmail', ServiceErrorType.EXTERNAL_SERVICE);
      this.eventEmitter.emit('email:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 批量发送邮件
   */
  async sendBulkEmails(emailList: EmailSendOptions[]): Promise<string[]> {
    const queueIds: string[] = [];
    
    for (const options of emailList) {
      try {
        const queueId = await this.sendEmail(options);
        queueIds.push(queueId);
      } catch (error) {
        // 继续处理其他邮件
      }
    }
    
    return queueIds;
  }

  /**
   * 立即发送邮件（跳过队列）
   */
  async sendEmailNow(options: EmailSendOptions): Promise<EmailSendResult> {
    try {
      // 验证邮件选项
      this.validateEmailOptions(options);
      
      // 准备邮件内容
      const mailOptions = await this.prepareMailOptions(options);
      
      // 发送邮件
      const result = await this.transporter.sendMail(mailOptions);
      
      // 转换结果格式
      const sendResult: EmailSendResult = {
        messageId: result.messageId,
        accepted: result.accepted as string[],
        rejected: result.rejected as string[],
        pending: result.pending as string[],
        response: result.response,
        envelope: result.envelope
      };
      
      // 发射事件
      this.emit(SERVICE_EVENTS.EMAIL_SENT, { options, result: sendResult });
      
      return sendResult;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'EmailService', 'sendEmailNow', ServiceErrorType.EXTERNAL_SERVICE);
      this.eventEmitter.emit('email:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    const items = Array.from(this.queue.values());
    
    return {
      pending: items.filter(item => item.status === 'pending').length,
      processing: items.filter(item => item.status === 'processing').length,
      sent: items.filter(item => item.status === 'sent').length,
      failed: items.filter(item => item.status === 'failed').length,
      cancelled: items.filter(item => item.status === 'cancelled').length
    };
  }

  /**
   * 查询邮件队列
   */
  async queryEmails(params: EmailQueryParams = {}): Promise<EmailQueueItem[]> {
    try {
      let items = Array.from(this.queue.values());
      
      // 应用过滤条件
      if (params.status) {
        items = items.filter(item => item.status === params.status);
      }
      
      if (params.from) {
        items = items.filter(item => 
          item.options.from.email.includes(params.from!) ||
          (item.options.from.name && item.options.from.name.includes(params.from!))
        );
      }
      
      if (params.to) {
        items = items.filter(item => 
          item.options.to.some(addr => 
            addr.email.includes(params.to!) ||
            (addr.name && addr.name.includes(params.to!))
          )
        );
      }
      
      if (params.subject) {
        items = items.filter(item => 
          item.options.content.subject.includes(params.subject!)
        );
      }
      
      if (params.templateId) {
        items = items.filter(item => item.options.templateId === params.templateId);
      }
      
      if (params.tags && params.tags.length > 0) {
        items = items.filter(item => 
          item.options.tags && params.tags!.some(tag => item.options.tags!.includes(tag))
        );
      }
      
      if (params.scheduledAfter) {
        items = items.filter(item => item.scheduledAt >= params.scheduledAfter!);
      }
      
      if (params.scheduledBefore) {
        items = items.filter(item => item.scheduledAt <= params.scheduledBefore!);
      }
      
      if (params.sentAfter && params.sentBefore) {
        items = items.filter(item => 
          item.sentAt && item.sentAt >= params.sentAfter! && item.sentAt <= params.sentBefore!
        );
      }
      
      // 排序
      if (params.sortBy) {
        items.sort((a, b) => {
          let aValue: number | string, bValue: number | string;
          
          switch (params.sortBy) {
            case 'createdAt':
              aValue = a.createdAt.getTime();
              bValue = b.createdAt.getTime();
              break;
            case 'scheduledAt':
              aValue = a.scheduledAt.getTime();
              bValue = b.scheduledAt.getTime();
              break;
            case 'sentAt':
              aValue = a.sentAt?.getTime() || 0;
              bValue = b.sentAt?.getTime() || 0;
              break;
            case 'attempts':
              aValue = a.attempts;
              bValue = b.attempts;
              break;
            default:
              return 0;
          }
          
          if (params.sortOrder === 'desc') {
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
          } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          }
        });
      }
      
      // 分页
      const offset = params.offset || 0;
      const limit = params.limit || 50;
      
      return items.slice(offset, offset + limit);
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'EmailService', 'queryEmails', ServiceErrorType.DATA);
      this.eventEmitter.emit('email:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 取消邮件发送
   */
  async cancelEmail(queueId: string): Promise<void> {
    try {
      const item = this.queue.get(queueId);
      if (!item) {
        throw new ValidationError('队列项不存在', [{ field: 'id', message: '队列项不存在', code: 'QUEUE_ITEM_NOT_FOUND' }]);
      }
      
      if (item.status === 'processing' || item.status === 'sent') {
        throw new ValidationError('无法取消正在处理或已发送的邮件', [{ field: 'status', message: '无法取消正在处理或已发送的邮件', code: 'INVALID_STATUS_FOR_CANCEL' }]);
      }
      
      item.status = 'cancelled';
      item.updatedAt = new Date();
      
      // 发射事件
      this.eventEmitter.emit('email:cancelled', item);
      this.emit(SERVICE_EVENTS.EMAIL_CANCELLED, item);
      
      // 更新统计
      await this.updateStats();
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'EmailService', 'cancelEmail', ServiceErrorType.EXTERNAL_SERVICE);
      this.eventEmitter.emit('email:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 重试失败的邮件
   */
  async retryEmail(queueId: string): Promise<void> {
    try {
      const item = this.queue.get(queueId);
      if (!item) {
        throw new ValidationError('队列项不存在', [{ field: 'id', message: '队列项不存在', code: 'QUEUE_ITEM_NOT_FOUND' }]);
      }
      
      if (item.status !== 'failed') {
        throw new ValidationError('只能重试失败的邮件', [{ field: 'status', message: '只能重试失败的邮件', code: 'INVALID_STATUS_FOR_RETRY' }]);
      }
      
      item.status = 'pending';
      item.attempts = 0;
      item.error = undefined;
      item.scheduledAt = new Date();
      item.updatedAt = new Date();
      
      // 发射事件
      this.eventEmitter.emit('email:retry', item, item.attempts);
      this.emit(SERVICE_EVENTS.EMAIL_RETRY, item);
      
      // 更新统计
      await this.updateStats();
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'EmailService', 'retryEmail', ServiceErrorType.EXTERNAL_SERVICE);
      this.eventEmitter.emit('email:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 创建邮件模板
   */
  async createTemplate(data: EmailTemplateCreateData): Promise<EmailTemplate> {
    try {
      // 验证模板数据
      this.validateTemplateData(data);
      
      // 提取模板变量
      const variables = this.extractTemplateVariables(data.subject, data.textTemplate, data.htmlTemplate);
      
      // 创建模板
      const template: EmailTemplate = {
        id: this.generateId(),
        name: data.name,
        subject: data.subject,
        textTemplate: data.textTemplate,
        htmlTemplate: data.htmlTemplate,
        variables,
        category: data.category,
        description: data.description,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: data.createdBy,
        metadata: data.metadata
      };
      
      // 保存模板
      this.templates.set(template.id, template);
      await this.saveTemplates();
      
      // 发射事件
      this.eventEmitter.emit('template:created', template);
      this.emit(SERVICE_EVENTS.EMAIL_TEMPLATE_CREATED, template);
      
      return template;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'EmailService', 'createTemplate', ServiceErrorType.DATA);
      this.eventEmitter.emit('email:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新邮件模板
   */
  async updateTemplate(templateId: string, data: EmailTemplateUpdateData): Promise<EmailTemplate> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new ValidationError('邮件模板不存在', [{ field: 'name', message: '邮件模板不存在', code: 'TEMPLATE_NOT_FOUND' }]);
      }
      
      // 更新模板
      const updatedTemplate = {
        ...template,
        ...data,
        updatedAt: new Date()
      };
      
      // 重新提取变量（如果模板内容有变化）
      if (data.subject || data.textTemplate || data.htmlTemplate) {
        updatedTemplate.variables = this.extractTemplateVariables(
          updatedTemplate.subject,
          updatedTemplate.textTemplate,
          updatedTemplate.htmlTemplate
        );
      }
      
      // 保存更新
      this.templates.set(templateId, updatedTemplate);
      await this.saveTemplates();
      
      // 发射事件
      this.eventEmitter.emit('template:updated', updatedTemplate);
      this.emit(SERVICE_EVENTS.EMAIL_TEMPLATE_UPDATED, updatedTemplate);
      
      return updatedTemplate;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'EmailService', 'updateTemplate', ServiceErrorType.DATA);
      this.eventEmitter.emit('email:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 删除邮件模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new ValidationError('邮件模板不存在', [{ field: 'name', message: '邮件模板不存在', code: 'TEMPLATE_NOT_FOUND' }]);
      }
      
      // 删除模板
      this.templates.delete(templateId);
      await this.saveTemplates();
      
      // 发射事件
      this.eventEmitter.emit('template:deleted', templateId);
      this.emit(SERVICE_EVENTS.EMAIL_TEMPLATE_DELETED, templateId);
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'EmailService', 'deleteTemplate', ServiceErrorType.DATA);
      this.eventEmitter.emit('email:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取邮件模板
   */
  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  /**
   * 查询邮件模板
   */
  async queryTemplates(params: EmailTemplateQueryParams = {}): Promise<EmailTemplate[]> {
    try {
      let templates = Array.from(this.templates.values());
      
      // 应用过滤条件
      if (params.category) {
        templates = templates.filter(t => t.category === params.category);
      }
      
      if (params.isActive !== undefined) {
        templates = templates.filter(t => t.isActive === params.isActive);
      }
      
      if (params.createdBy) {
        templates = templates.filter(t => t.createdBy === params.createdBy);
      }
      
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(searchTerm) ||
          t.subject.toLowerCase().includes(searchTerm) ||
          (t.description && t.description.toLowerCase().includes(searchTerm))
        );
      }
      
      // 排序
      if (params.sortBy) {
        templates.sort((a, b) => {
          let aValue: number | string, bValue: number | string;
          
          switch (params.sortBy) {
            case 'name':
              aValue = a.name;
              bValue = b.name;
              break;
            case 'createdAt':
              aValue = a.createdAt.getTime();
              bValue = b.createdAt.getTime();
              break;
            case 'updatedAt':
              aValue = a.updatedAt.getTime();
              bValue = b.updatedAt.getTime();
              break;
            default:
              return 0;
          }
          
          if (params.sortOrder === 'desc') {
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
          } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          }
        });
      }
      
      // 分页
      const offset = params.offset || 0;
      const limit = params.limit || 50;
      
      return templates.slice(offset, offset + limit);
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'EmailService', 'queryTemplates', ServiceErrorType.DATA);
      this.eventEmitter.emit('email:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 渲染邮件模板
   */
  async renderTemplate(templateId: string, data: Record<string, unknown>): Promise<EmailContent> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new ValidationError('邮件模板不存在', [{ field: 'name', message: '邮件模板不存在', code: 'TEMPLATE_NOT_FOUND' }]);
      }
      
      if (!template.isActive) {
        throw new ValidationError('邮件模板已禁用', [{ field: 'enabled', message: '邮件模板已禁用', code: 'TEMPLATE_DISABLED' }]);
      }
      
      // 渲染模板
      const subject = this.renderTemplateString(template.subject, data);
      const text = template.textTemplate ? this.renderTemplateString(template.textTemplate, data) : undefined;
      const html = template.htmlTemplate ? this.renderTemplateString(template.htmlTemplate, data) : undefined;
      
      return {
        subject,
        text,
        html
      };
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'EmailService', 'renderTemplate', ServiceErrorType.VALIDATION);
      this.eventEmitter.emit('email:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取邮件统计信息
   */
  async getStats(): Promise<EmailStats> {
    await this.updateStats();
    return { ...this.stats };
  }

  /**
   * 验证SMTP连接
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error: unknown) {
      throw handleUnknownError(error, 'EmailService', 'verifyConnection', ServiceErrorType.EXTERNAL_SERVICE);
    }
  }

  /**
   * 监听邮件事件
   */
  override on<T extends string | symbol>(event: T, fn: (...args: unknown[]) => void, context?: unknown): this {
    return super.on(event, fn, context);
  }

  /**
   * 监听邮件事件（类型安全版本）
   */
  onEmailEvent<K extends keyof EmailEvents>(event: K, listener: EmailEvents[K]): void {
    this.eventEmitter.on(event, listener as (...args: unknown[]) => void);
  }

  /**
   * 移除邮件事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: unknown[]) => void) | undefined, context?: unknown, once?: boolean | undefined): this {
    return super.off(event, fn, context, once);
  }

  /**
   * 移除邮件事件监听（类型安全版本）
   */
  offEmailEvent<K extends keyof EmailEvents>(event: K, listener: EmailEvents[K]): void {
    this.eventEmitter.off(event, listener as (...args: unknown[]) => void);
  }

  /**
   * 验证邮件选项
   */
  private validateEmailOptions(options: EmailSendOptions): void {
    if (!options.from || !options.from.email) {
      throw new ValidationError('发件人邮箱地址不能为空', [{ field: 'from', message: '发件人邮箱地址不能为空', code: 'EMPTY_SENDER' }], 'EmailService');
    }
    
    if (!options.to || options.to.length === 0) {
      throw new ValidationError('收件人邮箱地址不能为空', [{ field: 'to', message: '收件人邮箱地址不能为空', code: 'EMPTY_RECIPIENT' }]);
    }
    
    if (!options.content.subject) {
      throw new ValidationError('邮件主题不能为空', [{ field: 'subject', message: '邮件主题不能为空', code: 'EMPTY_SUBJECT' }]);
    }
    
    if (!options.content.text && !options.content.html) {
      throw new ValidationError('邮件内容不能为空', [{ field: 'content', message: '邮件内容不能为空', code: 'EMPTY_CONTENT' }]);
    }
    
    // 验证邮箱地址格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(options.from.email)) {
      throw new ValidationError('发件人邮箱地址格式无效', [{ field: 'from.email', message: '发件人邮箱地址格式无效', code: 'INVALID_SENDER_EMAIL' }], 'EmailService');
    }
    
    for (const recipient of options.to) {
      if (!emailRegex.test(recipient.email)) {
        throw new ValidationError(`收件人邮箱地址格式无效: ${recipient.email}`, [{ field: 'to', message: `收件人邮箱地址格式无效: ${recipient.email}`, code: 'INVALID_RECIPIENT_EMAIL' }], 'EmailService');
      }
    }
    
    if (options.cc) {
      for (const recipient of options.cc) {
        if (!emailRegex.test(recipient.email)) {
          throw new ValidationError(`抄送邮箱地址格式无效: ${recipient.email}`, [{ field: 'cc', message: `抄送邮箱地址格式无效: ${recipient.email}`, code: 'INVALID_CC_EMAIL' }], 'EmailService');
        }
      }
    }
    
    if (options.bcc) {
      for (const recipient of options.bcc) {
        if (!emailRegex.test(recipient.email)) {
          throw new ValidationError(`密送邮箱地址格式无效: ${recipient.email}`, [{ field: 'bcc', message: `密送邮箱地址格式无效: ${recipient.email}`, code: 'INVALID_BCC_EMAIL' }], 'EmailService');
        }
      }
    }
  }

  /**
   * 验证模板数据
   */
  private validateTemplateData(data: EmailTemplateCreateData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('模板名称不能为空', [{ field: 'name', message: '模板名称不能为空', code: 'EMPTY_TEMPLATE_NAME' }], 'EmailService');
    }
    
    if (!data.subject || data.subject.trim().length === 0) {
      throw new ValidationError('邮件主题不能为空', [{ field: 'subject', message: '邮件主题不能为空', code: 'EMPTY_TEMPLATE_SUBJECT' }], 'EmailService');
    }
    
    if (!data.textTemplate && !data.htmlTemplate) {
      throw new ValidationError('模板内容不能为空', [{ field: 'template', message: '模板内容不能为空', code: 'EMPTY_TEMPLATE_CONTENT' }], 'EmailService');
    }
    
    // 检查模板名称是否已存在
    const existingTemplate = Array.from(this.templates.values())
      .find(t => t.name === data.name);
    
    if (existingTemplate) {
      throw new ValidationError('模板名称已存在', [{ field: 'name', message: '模板名称已存在', code: 'DUPLICATE_TEMPLATE_NAME' }], 'EmailService');
    }
  }

  /**
   * 准备邮件选项
   */
  private async prepareMailOptions(options: EmailSendOptions): Promise<SendMailOptions> {
    let content = options.content;
    
    // 如果使用模板，先渲染模板
    if (options.templateId && options.templateData) {
      content = await this.renderTemplate(options.templateId, options.templateData);
    }
    
    // 构建邮件选项
    const mailOptions: SendMailOptions = {
      from: this.formatEmailAddress(options.from),
      to: options.to.map(addr => this.formatEmailAddress(addr)),
      subject: content.subject,
      text: content.text,
      html: content.html,
      attachments: content.attachments?.map(att => ({
         filename: att.filename,
         content: att.content as Buffer | string,
         path: att.path,
         contentType: att.contentType,
         cid: att.cid
       })),
      headers: content.headers,
      priority: content.priority,
      replyTo: content.replyTo ? this.formatEmailAddress(content.replyTo) : undefined,
      references: content.references,
      inReplyTo: content.inReplyTo
    };
    
    if (options.cc && options.cc.length > 0) {
      mailOptions.cc = options.cc.map(addr => this.formatEmailAddress(addr));
    }
    
    if (options.bcc && options.bcc.length > 0) {
      mailOptions.bcc = options.bcc.map(addr => this.formatEmailAddress(addr));
    }
    
    // 添加跟踪（如果启用）
    if (this.options.enableTracking && mailOptions.html && typeof mailOptions.html === 'string') {
      mailOptions.html = this.addTrackingPixel(mailOptions.html, options);
    }
    
    return mailOptions;
  }

  /**
   * 格式化邮箱地址
   */
  private formatEmailAddress(address: EmailAddress): string {
    if (address.name) {
      return `"${address.name}" <${address.email}>`;
    }
    return address.email;
  }

  /**
   * 添加跟踪像素
   */
  private addTrackingPixel(html: string, _options: EmailSendOptions): string {
    if (!this.options.trackingDomain) {
      return html;
    }
    
    const trackingId = this.generateId();
    const trackingPixel = `<img src="${this.options.trackingDomain}/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
    
    return html + trackingPixel;
  }

  /**
   * 提取模板变量
   */
  private extractTemplateVariables(...templates: (string | undefined)[]): string[] {
    const variables = new Set<string>();
    const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g;
    
    for (const template of templates) {
      if (template) {
        let match;
        while ((match = variableRegex.exec(template)) !== null) {
          variables.add(match[1]);
        }
      }
    }
    
    return Array.from(variables);
  }

  /**
   * 渲染模板字符串
   */
  private renderTemplateString(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g, (match, variable) => {
      const value = this.getNestedValue(data, variable);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && (current as any)[key] !== undefined ? (current as any)[key] : undefined;
    }, obj);
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 启动队列处理
   */
  private startQueueProcessing(): void {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    // 每10秒处理一次队列
    this.processingInterval = setInterval(() => {
      this.processQueue().catch((error: unknown) => {
        const serviceError = handleUnknownError(error, 'EmailService', 'processQueue', ServiceErrorType.INTERNAL_SERVICE);
        this.eventEmitter.emit('email:error', serviceError);
      });
    }, 10000);
  }

  /**
   * 停止队列处理
   */
  private stopQueueProcessing(): void {
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    const now = new Date();
    const pendingItems = Array.from(this.queue.values())
      .filter(item => item.status === 'pending' && item.scheduledAt <= now)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
      .slice(0, this.options.queueConcurrency || 5);
    
    const promises = pendingItems.map(item => this.processQueueItem(item));
    await Promise.allSettled(promises);
    
    // 发射队列处理事件
    const processed = pendingItems.length;
    const pending = Array.from(this.queue.values()).filter(item => item.status === 'pending').length;
    this.eventEmitter.emit('queue:processed', processed, pending);
  }

  /**
   * 处理队列项
   */
  private async processQueueItem(item: EmailQueueItem): Promise<void> {
    try {
      // 标记为处理中
      item.status = 'processing';
      item.processedAt = new Date();
      item.updatedAt = new Date();
      
      // 发射事件
      this.eventEmitter.emit('email:sending', item);
      
      // 发送邮件
      const result = await this.sendEmailNow(item.options);
      
      // 标记为已发送
      item.status = 'sent';
      item.sentAt = new Date();
      item.result = result;
      item.updatedAt = new Date();
      
      // 发射事件
      this.eventEmitter.emit('email:sent', item, result);
      
    } catch (error: unknown) {
      // 增加尝试次数
      item.attempts++;
      item.error = error instanceof Error ? error.message : String(error);
      item.updatedAt = new Date();
      
      if (item.attempts >= item.maxAttempts) {
        // 标记为失败
        item.status = 'failed';
        this.eventEmitter.emit('email:failed', item, error instanceof Error ? error : new Error(String(error)));
      } else {
        // 重新排队
        item.status = 'pending';
        item.scheduledAt = new Date(Date.now() + (this.options.retryDelay || 60000));
        this.eventEmitter.emit('email:retry', item, item.attempts);
      }
    }
  }

  /**
   * 加载邮件模板
   */
  private async loadTemplates(): Promise<void> {
    try {
      if (this.options.templatesPath) {
        // 从文件系统加载模板
        // 这里应该实现从文件系统加载模板的逻辑
      }
    } catch (error: unknown) {
      // 加载失败不影响服务启动
      const serviceError = handleUnknownError(error, 'EmailService', 'loadTemplates', ServiceErrorType.INTERNAL_SERVICE);
      this.eventEmitter.emit('email:error', serviceError);
    }
  }

  /**
   * 保存邮件模板
   */
  private async saveTemplates(): Promise<void> {
    try {
      if (this.options.templatesPath) {
        // 保存模板到文件系统
        // 这里应该实现保存模板到文件系统的逻辑
      }
    } catch (error: unknown) {
      // 保存失败不影响主流程
      const serviceError = handleUnknownError(error, 'EmailService', 'saveTemplates', ServiceErrorType.INTERNAL_SERVICE);
      this.eventEmitter.emit('email:error', serviceError);
    }
  }

  /**
   * 更新统计信息
   */
  private async updateStats(): Promise<void> {
    const items = Array.from(this.queue.values());
    const today = new Date().toISOString().split('T')[0];
    
    this.stats.totalSent = items.filter(item => item.status === 'sent').length;
    this.stats.totalFailed = items.filter(item => item.status === 'failed').length;
    this.stats.totalPending = items.filter(item => item.status === 'pending').length;
    this.stats.totalProcessing = items.filter(item => item.status === 'processing').length;
    
    this.stats.sentToday = items.filter(item => 
      item.status === 'sent' && 
      item.sentAt && 
      item.sentAt.toISOString().split('T')[0] === today
    ).length;
    
    this.stats.failedToday = items.filter(item => 
      item.status === 'failed' && 
      item.updatedAt.toISOString().split('T')[0] === today
    ).length;
    
    // 计算平均投递时间
    const sentItems = items.filter(item => item.status === 'sent' && item.sentAt && item.processedAt);
    if (sentItems.length > 0) {
      const totalDeliveryTime = sentItems.reduce((sum, item) => {
        return sum + (item.sentAt!.getTime() - item.processedAt!.getTime());
      }, 0);
      this.stats.averageDeliveryTime = totalDeliveryTime / sentItems.length;
    }
    
    // 计算投递率
    const totalAttempted = this.stats.totalSent + this.stats.totalFailed;
    this.stats.deliveryRate = totalAttempted > 0 ? (this.stats.totalSent / totalAttempted) * 100 : 0;
    
    // 按日期统计发送量
    this.stats.sendingVolumeByDay = {};
    for (const item of items) {
      if (item.sentAt) {
        const day = item.sentAt.toISOString().split('T')[0];
        this.stats.sendingVolumeByDay[day] = (this.stats.sendingVolumeByDay[day] || 0) + 1;
      }
    }
    
    // 模板使用统计
    this.stats.templateUsage = {};
    for (const item of items) {
      if (item.options.templateId) {
        this.stats.templateUsage[item.options.templateId] = 
          (this.stats.templateUsage[item.options.templateId] || 0) + 1;
      }
    }
    
    // 失败原因统计
    const failureReasons: Record<string, number> = {};
    for (const item of items) {
      if (item.status === 'failed' && item.error) {
        failureReasons[item.error] = (failureReasons[item.error] || 0) + 1;
      }
    }
    
    this.stats.topFailureReasons = Object.entries(failureReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

// 全局邮件服务实例
let emailServiceInstance: EmailService | null = null;

/**
 * 创建邮件服务实例
 */
export function createEmailService(config: EmailServiceConfig): EmailService {
  return new EmailService(config);
}

/**
 * 获取邮件服务实例
 */
export function getEmailService(): EmailService | null {
  return emailServiceInstance;
}

/**
 * 初始化邮件服务
 */
export async function initEmailService(config: EmailServiceConfig): Promise<EmailService> {
  if (emailServiceInstance) {
    await emailServiceInstance.destroy();
  }
  
  emailServiceInstance = new EmailService(config);
  await emailServiceInstance.initialize();
  
  return emailServiceInstance;
}

/**
 * 销毁邮件服务
 */
export async function destroyEmailService(): Promise<void> {
  if (emailServiceInstance) {
    await emailServiceInstance.destroy();
    emailServiceInstance = null;
  }
}



// 导出默认实例
export default EmailService;