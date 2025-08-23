import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ServiceErrorType } from '../types/ServiceError';
import { LoggerConfig } from '../types/ServiceConfig';
import { SERVICE_EVENTS, LOG_LEVELS } from '../types/ServiceConstants';
import { EventEmitter } from 'eventemitter3';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  error?: Error;
  stack?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  source?: {
    file?: string;
    line?: number;
    function?: string;
  };
  performance?: {
    duration?: number;
    memory?: number;
    cpu?: number;
  };
}

/**
 * 日志查询参数
 */
export interface LogQueryParams {
  level?: LogLevel;
  minLevel?: LogLevel;
  maxLevel?: LogLevel;
  category?: string;
  tags?: string[];
  userId?: string;
  sessionId?: string;
  requestId?: string;
  startTime?: Date;
  endTime?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'level' | 'category';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 日志输出器接口
 */
export interface LogAppender {
  name: string;
  level: LogLevel;
  format: LogFormatter;
  write(entry: LogEntry): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

/**
 * 日志格式化器接口
 */
export interface LogFormatter {
  format(entry: LogEntry): string;
}

/**
 * 简单文本格式化器
 */
export class SimpleTextFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level].padEnd(5);
    const category = entry.category ? `[${entry.category}]` : '';
    const message = entry.message;
    const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    
    return `${timestamp} ${level} ${category} ${message}${metadata}`;
  }
}

/**
 * JSON格式化器
 */
export class JsonFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    return JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: LogLevel[entry.level],
      message: entry.message,
      category: entry.category,
      tags: entry.tags,
      metadata: entry.metadata,
      error: entry.error ? {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack
      } : undefined,
      userId: entry.userId,
      sessionId: entry.sessionId,
      requestId: entry.requestId,
      source: entry.source,
      performance: entry.performance
    });
  }
}

/**
 * 控制台输出器
 */
export class ConsoleAppender implements LogAppender {
  name = 'console';
  level: LogLevel;
  format: LogFormatter;

  constructor(level: LogLevel = LogLevel.INFO, formatter: LogFormatter = new SimpleTextFormatter()) {
    this.level = level;
    this.format = formatter;
  }

  async write(entry: LogEntry): Promise<void> {
    if (entry.level < this.level) return;

    const formatted = this.format.format(entry);
    
    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }
  }
}

/**
 * 文件输出器
 */
export class FileAppender implements LogAppender {
  name = 'file';
  level: LogLevel;
  format: LogFormatter;
  private filePath: string;
  private maxSize: number;
  private maxFiles: number;
  private currentSize: number = 0;
  private writeStream: any = null;

  constructor(
    filePath: string,
    level: LogLevel = LogLevel.INFO,
    formatter: LogFormatter = new JsonFormatter(),
    maxSize: number = 10 * 1024 * 1024, // 10MB
    maxFiles: number = 5
  ) {
    this.filePath = filePath;
    this.level = level;
    this.format = formatter;
    this.maxSize = maxSize;
    this.maxFiles = maxFiles;
  }

  async write(entry: LogEntry): Promise<void> {
    if (entry.level < this.level) return;

    const formatted = this.format.format(entry) + '\n';
    
    // 这里应该实现文件写入逻辑
    // 包括文件轮转、大小检查等
    // 为了简化，这里只是模拟
    this.currentSize += formatted.length;
    
    if (this.currentSize > this.maxSize) {
      await this.rotateFile();
    }
  }

  async flush(): Promise<void> {
    // 刷新文件缓冲区
  }

  async close(): Promise<void> {
    // 关闭文件流
    if (this.writeStream) {
      this.writeStream.close();
      this.writeStream = null;
    }
  }

  private async rotateFile(): Promise<void> {
    // 实现文件轮转逻辑
    this.currentSize = 0;
  }
}

/**
 * 远程输出器
 */
export class RemoteAppender implements LogAppender {
  name = 'remote';
  level: LogLevel;
  format: LogFormatter;
  private endpoint: string;
  private apiKey?: string;
  private batchSize: number;
  private flushInterval: number;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    endpoint: string,
    level: LogLevel = LogLevel.WARN,
    formatter: LogFormatter = new JsonFormatter(),
    apiKey?: string,
    batchSize: number = 100,
    flushInterval: number = 5000
  ) {
    this.endpoint = endpoint;
    this.level = level;
    this.format = formatter;
    this.apiKey = apiKey;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    
    this.startFlushTimer();
  }

  async write(entry: LogEntry): Promise<void> {
    if (entry.level < this.level) return;

    this.buffer.push(entry);
    
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0);
    
    try {
      // 发送到远程服务器
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          entries: entries.map(entry => this.format.format(entry))
        })
      });
      
      if (!response.ok) {
        throw new Error(`远程日志发送失败: ${response.status}`);
      }
    } catch (error: unknown) {
      // 发送失败，重新加入缓冲区
      this.buffer.unshift(...entries);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    await this.flush();
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      try {
        await this.flush();
      } catch (error: unknown) {
        // 忽略定时刷新错误
        const errorObj = error instanceof Error ? error : new Error(String(error));
        console.error('定时刷新错误:', errorObj.message);
      }
    }, this.flushInterval);
  }
}

/**
 * 日志统计信息
 */
export interface LogStats {
  totalEntries: number;
  entriesByLevel: Record<string, number>;
  entriesByCategory: Record<string, number>;
  recentActivity: {
    lastHour: number;
    lastDay: number;
    lastWeek: number;
  };
  errorRate: number;
  averageEntriesPerMinute: number;
  topCategories: {
    category: string;
    count: number;
  }[];
  topErrors: {
    message: string;
    count: number;
    lastOccurrence: Date;
  }[];
}

/**
 * 日志事件接口
 */
export interface LoggingEvents {
  'log:entry': (entry: LogEntry) => void;
  'log:error': (error: ServiceError) => void;
  'log:appender:error': (appender: string, error: Error) => void;
  'log:buffer:full': (appender: string) => void;
  'log:stats:updated': (stats: LogStats) => void;
}

/**
 * 日志服务类
 */
export class LoggingService extends BaseService implements IService {
  private appenders: Map<string, LogAppender>;
  private eventEmitter: EventEmitter<LoggingEvents>;
  private entries: LogEntry[] = [];
  private maxEntries: number;
  private stats: LogStats;
  private statsUpdateInterval: NodeJS.Timeout | null = null;
  private defaultLevel: LogLevel;
  private categories: Map<string, LogLevel> = new Map();

  constructor(config: LoggerConfig) {
    super(config, 'LoggingService', '1.0.0');
    
    this.appenders = new Map();
    this.eventEmitter = new EventEmitter();
    this.maxEntries = 10000; // 默认最大条目数
    this.defaultLevel = this.parseLogLevel(config.level || 'INFO');
    
    // 初始化统计信息
    this.stats = {
      totalEntries: 0,
      entriesByLevel: {},
      entriesByCategory: {},
      recentActivity: {
        lastHour: 0,
        lastDay: 0,
        lastWeek: 0
      },
      errorRate: 0,
      averageEntriesPerMinute: 0,
      topCategories: [],
      topErrors: []
    };
    
    // 设置默认输出器
    this.addAppender(new ConsoleAppender(this.defaultLevel));
    
    // 设置分类级别
    // 分类级别配置暂时不支持
    // if (config.categories) {
    //   for (const [category, level] of Object.entries(config.categories)) {
    //     this.categories.set(category, this.parseLogLevel(level));
    //   }
    // }
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 启动统计更新
    this.startStatsUpdate();
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
      this.statsUpdateInterval = null;
    }
    
    // 关闭所有输出器
    for (const appender of this.appenders.values()) {
      if (appender.close) {
        await appender.close();
      }
    }
    
    this.appenders.clear();
    this.entries = [];
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<boolean> {
    try {
      // 测试日志记录
      await this.info('健康检查测试日志', { timestamp: Date.now() });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 添加输出器
   */
  addAppender(appender: LogAppender): void {
    this.appenders.set(appender.name, appender);
  }

  /**
   * 移除输出器
   */
  async removeAppender(name: string): Promise<boolean> {
    const appender = this.appenders.get(name);
    if (!appender) return false;
    
    if (appender.close) {
      await appender.close();
    }
    
    return this.appenders.delete(name);
  }

  /**
   * 获取输出器
   */
  getAppender(name: string): LogAppender | undefined {
    return this.appenders.get(name);
  }

  /**
   * 获取所有输出器
   */
  getAppenders(): LogAppender[] {
    return Array.from(this.appenders.values());
  }

  /**
   * 设置分类日志级别
   */
  setCategoryLevel(category: string, level: LogLevel | string): void {
    const logLevel = typeof level === 'string' ? this.parseLogLevel(level) : level;
    this.categories.set(category, logLevel);
  }

  /**
   * 获取分类日志级别
   */
  getCategoryLevel(category: string): LogLevel {
    return this.categories.get(category) || this.defaultLevel;
  }

  /**
   * 记录TRACE级别日志
   */
  async trace(message: string, metadata?: Record<string, any>, category?: string): Promise<void> {
    await this.log(LogLevel.TRACE, message, metadata, category);
  }

  /**
   * 记录DEBUG级别日志
   */
  async debug(message: string, metadata?: Record<string, any>, category?: string): Promise<void> {
    await this.log(LogLevel.DEBUG, message, metadata, category);
  }

  /**
   * 记录INFO级别日志
   */
  async info(message: string, metadata?: Record<string, any>, category?: string): Promise<void> {
    await this.log(LogLevel.INFO, message, metadata, category);
  }

  /**
   * 记录WARN级别日志
   */
  async warn(message: string, metadata?: Record<string, any>, category?: string): Promise<void> {
    await this.log(LogLevel.WARN, message, metadata, category);
  }

  /**
   * 记录ERROR级别日志
   */
  async error(message: string, error?: Error, metadata?: Record<string, any>, category?: string): Promise<void> {
    const logMetadata = { ...metadata };
    if (error) {
      logMetadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    await this.log(LogLevel.ERROR, message, logMetadata, category, error);
  }

  /**
   * 记录FATAL级别日志
   */
  async fatal(message: string, error?: Error, metadata?: Record<string, any>, category?: string): Promise<void> {
    const logMetadata = { ...metadata };
    if (error) {
      logMetadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    await this.log(LogLevel.FATAL, message, logMetadata, category, error);
  }

  /**
   * 记录日志
   */
  async log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    category?: string,
    error?: Error
  ): Promise<void> {
    try {
      // 检查级别
      const categoryLevel = category ? this.getCategoryLevel(category) : this.defaultLevel;
      if (level < categoryLevel) {
        return;
      }

      // 创建日志条目
      const entry: LogEntry = {
        id: this.generateId(),
        timestamp: new Date(),
        level,
        message,
        category,
        metadata,
        error,
        stack: error?.stack,
        userId: metadata?.userId,
        sessionId: metadata?.sessionId,
        requestId: metadata?.requestId,
        source: this.getSourceInfo(),
        performance: metadata?.performance
      };

      // 添加到内存存储
      this.addEntry(entry);
      
      // 写入所有输出器
      const writePromises = Array.from(this.appenders.values()).map(async (appender) => {
        try {
          await appender.write(entry);
        } catch (error: unknown) {
          this.eventEmitter.emit('log:appender:error', appender.name, this.handleUnknownError(error));
        }
      });
      
      await Promise.allSettled(writePromises);
      
      // 发射事件
      this.eventEmitter.emit('log:entry', entry);
      this.emit(SERVICE_EVENTS.LOG_ENTRY, entry);
      
      // 更新统计
      this.updateStats(entry);
    } catch (error: unknown) {
      const serviceError = new ServiceError({ message: '写入日志失败', code: 'LOG_WRITE_ERROR', type: ServiceErrorType.DATA, serviceName: 'LoggingService', operation: 'write', innerError: this.handleUnknownError(error) });
      this.eventEmitter.emit('log:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 查询日志
   */
  async query(params: LogQueryParams = {}): Promise<LogEntry[]> {
    try {
      let results = [...this.entries];
      
      // 按级别过滤
      if (params.level !== undefined) {
        results = results.filter(entry => entry.level === params.level);
      }
      
      if (params.minLevel !== undefined) {
        results = results.filter(entry => entry.level >= params.minLevel!);
      }
      
      if (params.maxLevel !== undefined) {
        results = results.filter(entry => entry.level <= params.maxLevel!);
      }
      
      // 按分类过滤
      if (params.category) {
        results = results.filter(entry => entry.category === params.category);
      }
      
      // 按标签过滤
      if (params.tags && params.tags.length > 0) {
        results = results.filter(entry => {
          if (!entry.tags) return false;
          return params.tags!.some(tag => entry.tags!.includes(tag));
        });
      }
      
      // 按用户过滤
      if (params.userId) {
        results = results.filter(entry => entry.userId === params.userId);
      }
      
      // 按会话过滤
      if (params.sessionId) {
        results = results.filter(entry => entry.sessionId === params.sessionId);
      }
      
      // 按请求过滤
      if (params.requestId) {
        results = results.filter(entry => entry.requestId === params.requestId);
      }
      
      // 按时间范围过滤
      if (params.startTime) {
        results = results.filter(entry => entry.timestamp >= params.startTime!);
      }
      
      if (params.endTime) {
        results = results.filter(entry => entry.timestamp <= params.endTime!);
      }
      
      // 按搜索关键词过滤
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        results = results.filter(entry => 
          entry.message.toLowerCase().includes(searchLower) ||
          (entry.category && entry.category.toLowerCase().includes(searchLower))
        );
      }
      
      // 排序
      if (params.sortBy) {
        results.sort((a, b) => {
          let valueA: any, valueB: any;
          
          switch (params.sortBy) {
            case 'timestamp':
              valueA = a.timestamp.getTime();
              valueB = b.timestamp.getTime();
              break;
            case 'level':
              valueA = a.level;
              valueB = b.level;
              break;
            case 'category':
              valueA = a.category || '';
              valueB = b.category || '';
              break;
            default:
              return 0;
          }
          
          const result = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
          return params.sortOrder === 'desc' ? -result : result;
        });
      }
      
      // 分页
      if (params.offset || params.limit) {
        const start = params.offset || 0;
        const end = params.limit ? start + params.limit : undefined;
        results = results.slice(start, end);
      }
      
      return results;
    } catch (error: unknown) {
      const serviceError = new ServiceError({ message: '查询日志失败', code: 'LOG_QUERY_ERROR', type: ServiceErrorType.DATA, serviceName: 'LoggingService', operation: 'query', innerError: this.handleUnknownError(error) });
      this.eventEmitter.emit('log:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取日志统计信息
   */
  async getStats(): Promise<LogStats> {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  async resetStats(): Promise<void> {
    this.stats = {
      totalEntries: 0,
      entriesByLevel: {},
      entriesByCategory: {},
      recentActivity: {
        lastHour: 0,
        lastDay: 0,
        lastWeek: 0
      },
      errorRate: 0,
      averageEntriesPerMinute: 0,
      topCategories: [],
      topErrors: []
    };
  }

  /**
   * 清空日志
   */
  async clear(): Promise<void> {
    this.entries = [];
    await this.resetStats();
  }

  /**
   * 刷新所有输出器
   */
  async flush(): Promise<void> {
    const flushPromises = Array.from(this.appenders.values()).map(async (appender) => {
      if (appender.flush) {
        try {
          await appender.flush();
        } catch (error: unknown) {
          this.eventEmitter.emit('log:appender:error', appender.name, this.handleUnknownError(error));
        }
      }
    });
    
    await Promise.allSettled(flushPromises);
  }

  /**
   * 监听日志事件
   */
  override on<T extends string | symbol>(event: T, fn: (...args: any[]) => void, context?: any): this {
    return super.on(event, fn, context);
  }

  /**
   * 监听日志事件（类型安全版本）
   */
  onLoggingEvent<K extends keyof LoggingEvents>(event: K, listener: LoggingEvents[K]): void {
    this.eventEmitter.on(event, listener as any);
  }

  /**
   * 移除日志事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: any[]) => void) | undefined, context?: any, once?: boolean | undefined): this {
    return super.off(event, fn, context, once);
  }

  /**
   * 移除日志事件监听（类型安全版本）
   */
  offLoggingEvent<K extends keyof LoggingEvents>(event: K, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * 处理未知错误类型
   */
  private handleUnknownError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'string') {
      return new Error(error);
    }
    return new Error(String(error));
  }

  /**
   * 解析日志级别
   */
  private parseLogLevel(level: string): LogLevel {
    const upperLevel = level.toUpperCase();
    switch (upperLevel) {
      case 'TRACE': return LogLevel.TRACE;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return LogLevel.INFO;
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取源码信息
   */
  private getSourceInfo(): LogEntry['source'] {
    // 这里可以通过错误堆栈获取调用位置信息
    // 为了简化，返回空对象
    return {};
  }

  /**
   * 添加日志条目到内存存储
   */
  private addEntry(entry: LogEntry): void {
    this.entries.push(entry);
    
    // 限制内存中的日志数量
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(entry: LogEntry): void {
    this.stats.totalEntries++;
    
    // 按级别统计
    const levelName = LogLevel[entry.level];
    this.stats.entriesByLevel[levelName] = (this.stats.entriesByLevel[levelName] || 0) + 1;
    
    // 按分类统计
    if (entry.category) {
      this.stats.entriesByCategory[entry.category] = (this.stats.entriesByCategory[entry.category] || 0) + 1;
    }
    
    // 计算错误率
    const errorCount = (this.stats.entriesByLevel['ERROR'] || 0) + (this.stats.entriesByLevel['FATAL'] || 0);
    this.stats.errorRate = this.stats.totalEntries > 0 ? errorCount / this.stats.totalEntries : 0;
    
    // 更新最近活动
    this.updateRecentActivity();
    
    // 更新热门分类
    this.updateTopCategories();
    
    // 更新热门错误
    if (entry.level >= LogLevel.ERROR) {
      this.updateTopErrors(entry);
    }
  }

  /**
   * 更新最近活动统计
   */
  private updateRecentActivity(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    this.stats.recentActivity.lastHour = this.entries.filter(entry => entry.timestamp >= oneHourAgo).length;
    this.stats.recentActivity.lastDay = this.entries.filter(entry => entry.timestamp >= oneDayAgo).length;
    this.stats.recentActivity.lastWeek = this.entries.filter(entry => entry.timestamp >= oneWeekAgo).length;
    
    // 计算平均每分钟日志数
    const totalMinutes = this.entries.length > 0 
      ? (now.getTime() - this.entries[0].timestamp.getTime()) / (1000 * 60)
      : 1;
    this.stats.averageEntriesPerMinute = this.stats.totalEntries / Math.max(totalMinutes, 1);
  }

  /**
   * 更新热门分类
   */
  private updateTopCategories(): void {
    const categories = Object.entries(this.stats.entriesByCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    this.stats.topCategories = categories;
  }

  /**
   * 更新热门错误
   */
  private updateTopErrors(entry: LogEntry): void {
    const existingError = this.stats.topErrors.find(error => error.message === entry.message);
    
    if (existingError) {
      existingError.count++;
      existingError.lastOccurrence = entry.timestamp;
    } else {
      this.stats.topErrors.push({
        message: entry.message,
        count: 1,
        lastOccurrence: entry.timestamp
      });
    }
    
    // 保持前10个错误
    this.stats.topErrors.sort((a, b) => b.count - a.count);
    this.stats.topErrors = this.stats.topErrors.slice(0, 10);
  }

  /**
   * 启动统计更新
   */
  private startStatsUpdate(): void {
    this.statsUpdateInterval = setInterval(() => {
      this.updateRecentActivity();
      this.eventEmitter.emit('log:stats:updated', this.stats);
    }, 60000); // 每分钟更新一次
  }
}

// 全局日志服务实例
let loggingServiceInstance: LoggingService | null = null;

/**
 * 创建日志服务实例
 */
export function createLoggingService(config: LoggerConfig): LoggingService {
  return new LoggingService(config);
}

/**
 * 获取日志服务实例
 */
export function getLoggingService(): LoggingService | null {
  return loggingServiceInstance;
}

/**
 * 初始化日志服务
 */
export async function initLoggingService(config: LoggerConfig): Promise<LoggingService> {
  if (loggingServiceInstance) {
    await loggingServiceInstance.destroy();
  }
  
  loggingServiceInstance = new LoggingService(config);
  await loggingServiceInstance.initialize();
  
  return loggingServiceInstance;
}

/**
 * 销毁日志服务
 */
export async function destroyLoggingService(): Promise<void> {
  if (loggingServiceInstance) {
    await loggingServiceInstance.destroy();
    loggingServiceInstance = null;
  }
}



// 格式化器和输出器已在类声明时导出

// 导出默认实例
export default LoggingService;