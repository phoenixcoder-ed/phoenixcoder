import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ServiceErrorType, ValidationError, NotFoundError } from '../types/ServiceError';
import { CacheConfig } from '../types/ServiceConfig';
import { SERVICE_EVENTS, CACHE_STRATEGIES } from '../types/ServiceConstants';
import { EventEmitter } from 'eventemitter3';

/**
 * 缓存项接口
 */
export interface CacheItem<T = any> {
  key: string;
  value: T;
  ttl?: number;
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
  lastAccessed: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * 缓存查询参数
 */
export interface CacheQueryParams {
  pattern?: string;
  tags?: string[];
  prefix?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'key' | 'createdAt' | 'lastAccessed' | 'accessCount';
  sortOrder?: 'asc' | 'desc';
  includeExpired?: boolean;
}

/**
 * 缓存设置选项
 */
export interface CacheSetOptions {
  ttl?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  overwrite?: boolean;
  compress?: boolean;
  serialize?: boolean;
}

/**
 * 缓存获取选项
 */
export interface CacheGetOptions {
  updateAccessTime?: boolean;
  deserialize?: boolean;
  decompress?: boolean;
  defaultValue?: any;
}

/**
 * 缓存删除选项
 */
export interface CacheDeleteOptions {
  pattern?: string;
  tags?: string[];
  prefix?: string;
  olderThan?: Date;
  accessedBefore?: Date;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  totalKeys: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  expiredCount: number;
  memoryUsage: {
    used: number;
    available: number;
    percentage: number;
  };
  topKeys: {
    key: string;
    accessCount: number;
    size: number;
  }[];
  recentActivity: {
    sets: number;
    gets: number;
    deletes: number;
    evictions: number;
  };
}

/**
 * 缓存事件接口
 */
export interface CacheEvents {
  'cache:set': (key: string, value: any, options?: CacheSetOptions) => void;
  'cache:get': (key: string, value: any | null, hit: boolean) => void;
  'cache:delete': (key: string, existed: boolean) => void;
  'cache:clear': (pattern?: string) => void;
  'cache:expire': (key: string) => void;
  'cache:evict': (key: string, reason: string) => void;
  'cache:hit': (key: string) => void;
  'cache:miss': (key: string) => void;
  'cache:error': (error: ServiceError) => void;
}

/**
 * 缓存策略接口
 */
export interface CacheStrategy {
  name: string;
  shouldEvict(item: CacheItem, stats: CacheStats): boolean;
  selectEvictionCandidate(items: CacheItem[]): CacheItem | null;
}

/**
 * LRU缓存策略
 */
export class LRUCacheStrategy implements CacheStrategy {
  name = 'LRU';

  shouldEvict(item: CacheItem, stats: CacheStats): boolean {
    return stats.memoryUsage.percentage > 90;
  }

  selectEvictionCandidate(items: CacheItem[]): CacheItem | null {
    if (items.length === 0) return null;
    
    return items.reduce((oldest, current) => 
      current.lastAccessed < oldest.lastAccessed ? current : oldest
    );
  }
}

/**
 * LFU缓存策略
 */
export class LFUCacheStrategy implements CacheStrategy {
  name = 'LFU';

  shouldEvict(item: CacheItem, stats: CacheStats): boolean {
    return stats.memoryUsage.percentage > 90;
  }

  selectEvictionCandidate(items: CacheItem[]): CacheItem | null {
    if (items.length === 0) return null;
    
    return items.reduce((leastUsed, current) => 
      current.accessCount < leastUsed.accessCount ? current : leastUsed
    );
  }
}

/**
 * TTL缓存策略
 */
export class TTLCacheStrategy implements CacheStrategy {
  name = 'TTL';

  shouldEvict(item: CacheItem, stats: CacheStats): boolean {
    return item.expiresAt ? item.expiresAt <= new Date() : false;
  }

  selectEvictionCandidate(items: CacheItem[]): CacheItem | null {
    const expiredItems = items.filter(item => 
      item.expiresAt && item.expiresAt <= new Date()
    );
    
    if (expiredItems.length === 0) return null;
    
    return expiredItems.reduce((earliest, current) => 
      current.expiresAt! < earliest.expiresAt! ? current : earliest
    );
  }
}

/**
 * 缓存服务类
 */
export class CacheService extends BaseService implements IService {
  private cache: Map<string, CacheItem>;
  private eventEmitter: EventEmitter<CacheEvents>;
  private strategy: CacheStrategy;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxSize: number;
  private defaultTTL: number;
  private compressionEnabled: boolean;
  private serializationEnabled: boolean;

  constructor(config: CacheConfig) {
    super(config, 'CacheService', '1.0.0');
    
    this.cache = new Map();
    this.eventEmitter = new EventEmitter();
    this.maxSize = config.maxSize || 1000;
    this.defaultTTL = config.defaultTTL || 3600000; // 1小时
    this.compressionEnabled = config.enableCompression || false;
    this.serializationEnabled = config.enableSerialization !== false;
    
    // 初始化缓存策略
    this.strategy = this.createStrategy(config.strategy || 'LRU');
    
    // 初始化统计信息
    this.stats = {
      totalKeys: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      expiredCount: 0,
      memoryUsage: {
        used: 0,
        available: this.maxSize,
        percentage: 0
      },
      topKeys: [],
      recentActivity: {
        sets: 0,
        gets: 0,
        deletes: 0,
        evictions: 0
      }
    };
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 启动定期清理
    this.startCleanup();
    
    // 启动统计更新
    this.startStatsUpdate();
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    this.cache.clear();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<boolean> {
    try {
      // 测试基本缓存操作
      const testKey = '__health_check__';
      const testValue = { timestamp: Date.now() };
      
      await this.set(testKey, testValue, { ttl: 1000 });
      const retrieved = await this.get(testKey);
      await this.delete(testKey);
      
      return retrieved !== null && (retrieved as any)?.timestamp === testValue.timestamp;
    } catch (error) {
      return false;
    }
  }

  /**
   * 设置缓存项
   */
  async set<T>(key: string, value: T, options: CacheSetOptions = {}): Promise<void> {
    try {
      if (!key || key.trim() === '') {
        throw new ValidationError('缓存键不能为空', [{ field: 'key', message: '缓存键不能为空', code: 'EMPTY_KEY' }]);
      }

      const ttl = options.ttl || this.defaultTTL;
      const now = new Date();
      const expiresAt = ttl > 0 ? new Date(now.getTime() + ttl) : undefined;
      
      // 检查是否需要覆盖
      const existing = this.cache.get(key);
      if (existing && !options.overwrite) {
        throw new ValidationError(`缓存键 ${key} 已存在`, [{ field: 'key', message: `缓存键 ${key} 已存在`, code: 'KEY_EXISTS' }]);
      }

      // 序列化和压缩处理
      let processedValue = value;
      if (options.serialize !== false && this.serializationEnabled) {
        processedValue = this.serialize(value) as T;
      }
      if (options.compress && this.compressionEnabled) {
        processedValue = this.compress(processedValue) as T;
      }

      // 创建缓存项
      const cacheItem: CacheItem<T> = {
        key,
        value: processedValue,
        ttl,
        createdAt: now,
        expiresAt,
        accessCount: 0,
        lastAccessed: now,
        tags: options.tags,
        metadata: options.metadata
      };

      // 检查容量限制
      if (this.cache.size >= this.maxSize && !existing) {
        await this.evictItems();
      }

      // 设置缓存项
      this.cache.set(key, cacheItem);
      
      // 更新统计
      this.stats.recentActivity.sets++;
      this.updateStats();
      
      this.eventEmitter.emit('cache:set', key, value, options);
      this.emit(SERVICE_EVENTS.CACHE_SET, { key, value, options });
    } catch (error) {
      const serviceError = new ServiceError({ message: '设置缓存失败', code: 'CACHE_SET_ERROR', type: ServiceErrorType.CACHE, serviceName: 'CacheService', operation: 'set', innerError: error instanceof Error ? error : new Error(String(error)) });
      this.eventEmitter.emit('cache:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取缓存项
   */
  async get<T>(key: string, options: CacheGetOptions = {}): Promise<T | null> {
    try {
      if (!key || key.trim() === '') {
        throw new ValidationError('缓存键不能为空', [{ field: 'key', message: '缓存键不能为空', code: 'EMPTY_KEY' }]);
      }

      const cacheItem = this.cache.get(key);
      
      if (!cacheItem) {
        this.stats.missCount++;
        this.stats.recentActivity.gets++;
        this.eventEmitter.emit('cache:miss', key);
        this.eventEmitter.emit('cache:get', key, null, false);
        return options.defaultValue || null;
      }

      // 检查是否过期
      if (cacheItem.expiresAt && cacheItem.expiresAt <= new Date()) {
        this.cache.delete(key);
        this.stats.expiredCount++;
        this.stats.missCount++;
        this.stats.recentActivity.gets++;
        this.eventEmitter.emit('cache:expire', key);
        this.eventEmitter.emit('cache:miss', key);
        this.eventEmitter.emit('cache:get', key, null, false);
        return options.defaultValue || null;
      }

      // 更新访问信息
      if (options.updateAccessTime !== false) {
        cacheItem.accessCount++;
        cacheItem.lastAccessed = new Date();
      }

      // 反序列化和解压缩处理
      let value = cacheItem.value;
      if (options.decompress && this.compressionEnabled) {
        value = this.decompress(value);
      }
      if (options.deserialize !== false && this.serializationEnabled) {
        value = this.deserialize(value);
      }

      // 更新统计
      this.stats.hitCount++;
      this.stats.recentActivity.gets++;
      this.updateStats();
      
      this.eventEmitter.emit('cache:hit', key);
      this.eventEmitter.emit('cache:get', key, value, true);
      this.emit(SERVICE_EVENTS.CACHE_GET, { key, value, hit: true });
      
      return value as T;
    } catch (error) {
      const serviceError = new ServiceError({ message: '获取缓存失败', code: 'CACHE_GET_ERROR', type: ServiceErrorType.CACHE, serviceName: 'CacheService', operation: 'get', innerError: error instanceof Error ? error : new Error(String(error)) });
      this.eventEmitter.emit('cache:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 检查缓存项是否存在
   */
  async has(key: string): Promise<boolean> {
    try {
      if (!key || key.trim() === '') {
        return false;
      }

      const cacheItem = this.cache.get(key);
      
      if (!cacheItem) {
        return false;
      }

      // 检查是否过期
      if (cacheItem.expiresAt && cacheItem.expiresAt <= new Date()) {
        this.cache.delete(key);
        this.stats.expiredCount++;
        this.eventEmitter.emit('cache:expire', key);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 删除缓存项
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!key || key.trim() === '') {
        throw new ValidationError('缓存键不能为空', [{ field: 'key', message: '缓存键不能为空', code: 'EMPTY_KEY' }]);
      }

      const existed = this.cache.has(key);
      const deleted = this.cache.delete(key);
      
      if (deleted) {
        this.stats.recentActivity.deletes++;
        this.updateStats();
      }
      
      this.eventEmitter.emit('cache:delete', key, existed);
      this.emit(SERVICE_EVENTS.CACHE_DELETE, { key, existed });
      
      return deleted;
    } catch (error) {
      const serviceError = new ServiceError({ message: '删除缓存失败', code: 'CACHE_DELETE_ERROR', type: ServiceErrorType.CACHE, serviceName: 'CacheService', operation: 'delete', innerError: error instanceof Error ? error : new Error(String(error)) });
      this.eventEmitter.emit('cache:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 批量删除缓存项
   */
  async deleteMany(options: CacheDeleteOptions): Promise<number> {
    try {
      let deletedCount = 0;
      const keysToDelete: string[] = [];
      
      for (const [key, item] of Array.from(this.cache.entries())) {
        let shouldDelete = false;
        
        // 按模式匹配
        if (options.pattern && !this.matchPattern(key, options.pattern)) {
          continue;
        }
        
        // 按前缀匹配
        if (options.prefix && !key.startsWith(options.prefix)) {
          continue;
        }
        
        // 按标签匹配
        if (options.tags && options.tags.length > 0) {
          const itemTags = item.tags || [];
          const hasMatchingTag = options.tags.some(tag => itemTags.includes(tag));
          if (!hasMatchingTag) {
            continue;
          }
        }
        
        // 按创建时间过滤
        if (options.olderThan && item.createdAt >= options.olderThan) {
          continue;
        }
        
        // 按访问时间过滤
        if (options.accessedBefore && item.lastAccessed >= options.accessedBefore) {
          continue;
        }
        
        keysToDelete.push(key);
      }
      
      // 执行删除
      for (const key of keysToDelete) {
        if (this.cache.delete(key)) {
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        this.stats.recentActivity.deletes += deletedCount;
        this.updateStats();
      }
      
      this.emit(SERVICE_EVENTS.CACHE_BATCH_DELETE, { deletedCount, options });
      return deletedCount;
    } catch (error) {
      const serviceError = new ServiceError({ message: '批量删除缓存失败', code: 'CACHE_BATCH_DELETE_ERROR', type: ServiceErrorType.CACHE, serviceName: 'CacheService', operation: 'deleteMany', innerError: error instanceof Error ? error : new Error(String(error)) });
      this.eventEmitter.emit('cache:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 清空缓存
   */
  async clear(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // 按模式清空
        const keysToDelete = Array.from(this.cache.keys())
          .filter(key => this.matchPattern(key, pattern));
        
        for (const key of keysToDelete) {
          this.cache.delete(key);
        }
      } else {
        // 清空所有
        this.cache.clear();
      }
      
      this.updateStats();
      
      this.eventEmitter.emit('cache:clear', pattern);
      this.emit(SERVICE_EVENTS.CACHE_CLEAR, { pattern });
    } catch (error) {
      const serviceError = new ServiceError({ message: '清空缓存失败', code: 'CACHE_CLEAR_ERROR', type: ServiceErrorType.CACHE, serviceName: 'CacheService', operation: 'clear', innerError: error instanceof Error ? error : new Error(String(error)) });
      this.eventEmitter.emit('cache:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取缓存键列表
   */
  async keys(params: CacheQueryParams = {}): Promise<string[]> {
    try {
      let keys = Array.from(this.cache.keys());
      
      // 按模式过滤
      if (params.pattern) {
        keys = keys.filter(key => this.matchPattern(key, params.pattern!));
      }
      
      // 按前缀过滤
      if (params.prefix) {
        keys = keys.filter(key => key.startsWith(params.prefix!));
      }
      
      // 按标签过滤
      if (params.tags && params.tags.length > 0) {
        keys = keys.filter(key => {
          const item = this.cache.get(key);
          if (!item || !item.tags) return false;
          return params.tags!.some(tag => item.tags!.includes(tag));
        });
      }
      
      // 排序
      if (params.sortBy) {
        keys.sort((a, b) => {
          const itemA = this.cache.get(a)!;
          const itemB = this.cache.get(b)!;
          
          let valueA: any, valueB: any;
          
          switch (params.sortBy) {
            case 'key':
              valueA = a;
              valueB = b;
              break;
            case 'createdAt':
              valueA = itemA.createdAt.getTime();
              valueB = itemB.createdAt.getTime();
              break;
            case 'lastAccessed':
              valueA = itemA.lastAccessed.getTime();
              valueB = itemB.lastAccessed.getTime();
              break;
            case 'accessCount':
              valueA = itemA.accessCount;
              valueB = itemB.accessCount;
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
        keys = keys.slice(start, end);
      }
      
      return keys;
    } catch (error) {
      const serviceError = new ServiceError({ message: '获取缓存键列表失败', code: 'CACHE_KEYS_ERROR', type: ServiceErrorType.CACHE, serviceName: 'CacheService', operation: 'keys', innerError: error instanceof Error ? error : new Error(String(error)) });
      this.eventEmitter.emit('cache:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取缓存项列表
   */
  async items(params: CacheQueryParams = {}): Promise<CacheItem[]> {
    try {
      const keys = await this.keys(params);
      const items: CacheItem[] = [];
      
      for (const key of keys) {
        const item = this.cache.get(key);
        if (item) {
          // 检查是否包含过期项
          if (!params.includeExpired && item.expiresAt && item.expiresAt <= new Date()) {
            continue;
          }
          items.push({ ...item });
        }
      }
      
      return items;
    } catch (error) {
      const serviceError = new ServiceError({ message: '获取缓存统计失败', code: 'CACHE_STATS_ERROR', type: ServiceErrorType.CACHE, serviceName: 'CacheService', operation: 'getStats', innerError: error instanceof Error ? error : new Error(String(error)) });
      this.eventEmitter.emit('cache:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<CacheStats> {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  async resetStats(): Promise<void> {
    this.stats.hitCount = 0;
    this.stats.missCount = 0;
    this.stats.evictionCount = 0;
    this.stats.expiredCount = 0;
    this.stats.recentActivity = {
      sets: 0,
      gets: 0,
      deletes: 0,
      evictions: 0
    };
    this.updateStats();
  }

  /**
   * 设置缓存策略
   */
  setStrategy(strategy: string | CacheStrategy): void {
    if (typeof strategy === 'string') {
      this.strategy = this.createStrategy(strategy);
    } else {
      this.strategy = strategy;
    }
  }

  /**
   * 获取当前缓存策略
   */
  getStrategy(): CacheStrategy {
    return this.strategy;
  }

  /**
   * 手动触发清理
   */
  async cleanup(): Promise<{ expired: number; evicted: number }> {
    const expired = await this.cleanupExpired();
    const evicted = await this.evictItems();
    
    return { expired, evicted };
  }

  /**
   * 监听缓存事件
   */
  override on<T extends string | symbol>(event: T, fn: (...args: any[]) => void, context?: any): this {
    return super.on(event, fn, context);
  }

  /**
   * 监听缓存事件（类型安全版本）
   */
  onCacheEvent<K extends keyof CacheEvents>(event: K, listener: CacheEvents[K]): void {
    super.on(event as string, listener as any);
  }

  /**
   * 移除缓存事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: any[]) => void) | undefined, context?: any, once?: boolean | undefined): this {
    return super.off(event, fn, context, once);
  }

  /**
   * 移除缓存事件监听（类型安全版本）
   */
  offCacheEvent<K extends keyof CacheEvents>(event: K, listener: CacheEvents[K]): void {
    super.off(event as string, listener as any);
  }

  /**
   * 创建缓存策略
   */
  private createStrategy(strategyName: string): CacheStrategy {
    switch (strategyName.toUpperCase()) {
      case 'LRU':
        return new LRUCacheStrategy();
      case 'LFU':
        return new LFUCacheStrategy();
      case 'TTL':
        return new TTLCacheStrategy();
      default:
        return new LRUCacheStrategy();
    }
  }

  /**
   * 模式匹配
   */
  private matchPattern(key: string, pattern: string): boolean {
    // 简单的通配符匹配，支持 * 和 ?
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
      .replace(/\\\*/g, '.*') // * 匹配任意字符
      .replace(/\\\?/g, '.'); // ? 匹配单个字符
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  /**
   * 序列化
   */
  private serialize(value: any): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      throw new ServiceError({ message: '序列化失败', code: 'CACHE_SERIALIZE_ERROR', type: ServiceErrorType.CACHE, serviceName: 'CacheService', operation: 'serialize', innerError: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  /**
   * 反序列化
   */
  private deserialize(value: any): any {
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value;
    } catch (error) {
      throw new ServiceError({ message: '反序列化失败', code: 'CACHE_DESERIALIZE_ERROR', type: ServiceErrorType.CACHE, serviceName: 'CacheService', operation: 'deserialize', innerError: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  /**
   * 压缩
   */
  private compress(value: any): any {
    // 这里可以实现具体的压缩逻辑
    // 例如使用 zlib 或其他压缩库
    return value;
  }

  /**
   * 解压缩
   */
  private decompress(value: any): any {
    // 这里可以实现具体的解压缩逻辑
    return value;
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.totalKeys = this.cache.size;
    this.stats.totalSize = this.calculateTotalSize();
    this.stats.hitRate = this.stats.hitCount + this.stats.missCount > 0 
      ? this.stats.hitCount / (this.stats.hitCount + this.stats.missCount) 
      : 0;
    
    this.stats.memoryUsage = {
      used: this.cache.size,
      available: this.maxSize - this.cache.size,
      percentage: (this.cache.size / this.maxSize) * 100
    };
    
    // 更新热门键
    this.updateTopKeys();
  }

  /**
   * 计算总大小
   */
  private calculateTotalSize(): number {
    let totalSize = 0;
    for (const item of Array.from(this.cache.values())) {
      totalSize += this.calculateItemSize(item);
    }
    return totalSize;
  }

  /**
   * 计算单个项大小
   */
  private calculateItemSize(item: CacheItem): number {
    // 简单的大小估算
    const keySize = item.key.length * 2; // UTF-16
    const valueSize = JSON.stringify(item.value).length * 2;
    const metadataSize = item.metadata ? JSON.stringify(item.metadata).length * 2 : 0;
    return keySize + valueSize + metadataSize + 100; // 额外的对象开销
  }

  /**
   * 更新热门键
   */
  private updateTopKeys(): void {
    const items = Array.from(this.cache.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);
    
    this.stats.topKeys = items.map(item => ({
      key: item.key,
      accessCount: item.accessCount,
      size: this.calculateItemSize(item)
    }));
  }

  /**
   * 清理过期项
   */
  private async cleanupExpired(): Promise<number> {
    let expiredCount = 0;
    const now = new Date();
    
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (item.expiresAt && item.expiresAt <= now) {
        this.cache.delete(key);
        expiredCount++;
        this.eventEmitter.emit('cache:expire', key);
      }
    }
    
    if (expiredCount > 0) {
      this.stats.expiredCount += expiredCount;
      this.updateStats();
    }
    
    return expiredCount;
  }

  /**
   * 驱逐缓存项
   */
  private async evictItems(): Promise<number> {
    let evictedCount = 0;
    const items = Array.from(this.cache.values());
    
    while (this.cache.size >= this.maxSize && items.length > 0) {
      const candidate = this.strategy.selectEvictionCandidate(items);
      if (!candidate) break;
      
      this.cache.delete(candidate.key);
      evictedCount++;
      this.stats.recentActivity.evictions++;
      
      // 从候选列表中移除
      const index = items.indexOf(candidate);
      if (index > -1) {
        items.splice(index, 1);
      }
      
      this.eventEmitter.emit('cache:evict', candidate.key, this.strategy.name);
    }
    
    if (evictedCount > 0) {
      this.stats.evictionCount += evictedCount;
      this.updateStats();
    }
    
    return evictedCount;
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpired();
    }, 60000); // 每分钟清理一次过期项
  }

  /**
   * 启动统计更新
   */
  private startStatsUpdate(): void {
    setInterval(() => {
      this.updateStats();
    }, 30000); // 每30秒更新一次统计
  }
}

// 全局缓存服务实例
let cacheServiceInstance: CacheService | null = null;

/**
 * 创建缓存服务实例
 */
export function createCacheService(config: CacheConfig): CacheService {
  return new CacheService(config);
}

/**
 * 获取缓存服务实例
 */
export function getCacheService(): CacheService | null {
  return cacheServiceInstance;
}

/**
 * 初始化缓存服务
 */
export async function initCacheService(config: CacheConfig): Promise<CacheService> {
  if (cacheServiceInstance) {
    await cacheServiceInstance.destroy();
  }
  
  cacheServiceInstance = new CacheService(config);
  await cacheServiceInstance.initialize();
  
  return cacheServiceInstance;
}

/**
 * 销毁缓存服务
 */
export async function destroyCacheService(): Promise<void> {
  if (cacheServiceInstance) {
    await cacheServiceInstance.destroy();
    cacheServiceInstance = null;
  }
}



// 导出策略类


// 导出默认实例
export default CacheService;