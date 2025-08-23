// 存储类型
export type StorageType = 'localStorage' | 'sessionStorage' | 'memory';

// 存储项接口
export interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  ttl?: number; // 生存时间（毫秒）
  version?: string;
}

// 存储配置
export interface StorageConfig {
  prefix?: string;
  defaultTTL?: number;
  version?: string;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

// 内存存储实现
class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] || null;
  }

  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

// 存储管理器类
export class StorageManager {
  private storage: Storage;
  private config: Required<StorageConfig>;

  constructor(type: StorageType = 'localStorage', config: StorageConfig = {}) {
    this.config = {
      prefix: '',
      defaultTTL: 0, // 0 表示永不过期
      version: '1.0.0',
      serialize: JSON.stringify,
      deserialize: JSON.parse,
      ...config,
    };

    switch (type) {
      case 'localStorage':
        this.storage = typeof window !== 'undefined' ? window.localStorage : new MemoryStorage();
        break;
      case 'sessionStorage':
        this.storage = typeof window !== 'undefined' ? window.sessionStorage : new MemoryStorage();
        break;
      case 'memory':
        this.storage = new MemoryStorage();
        break;
      default:
        this.storage = new MemoryStorage();
    }
  }

  // 生成完整的键名
  private getFullKey(key: string): string {
    return this.config.prefix ? `${this.config.prefix}:${key}` : key;
  }

  // 检查项是否过期
  private isExpired(item: StorageItem): boolean {
    if (!item.ttl || item.ttl === 0) {
      return false;
    }
    
    return Date.now() - item.timestamp > item.ttl;
  }

  // 检查版本是否匹配
  private isVersionValid(item: StorageItem): boolean {
    if (!item.version) {
      return true;
    }
    
    return item.version === this.config.version;
  }

  // 设置项
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL,
        version: this.config.version,
      };

      const serialized = this.config.serialize(item);
      this.storage.setItem(this.getFullKey(key), serialized);
      
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  // 获取项
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const serialized = this.storage.getItem(this.getFullKey(key));
      
      if (!serialized) {
        return defaultValue;
      }

      const item: StorageItem<T> = this.config.deserialize(serialized);

      // 检查版本
      if (!this.isVersionValid(item)) {
        this.remove(key);
        return defaultValue;
      }

      // 检查过期
      if (this.isExpired(item)) {
        this.remove(key);
        return defaultValue;
      }

      return item.value;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  // 检查项是否存在且有效
  has(key: string): boolean {
    try {
      const serialized = this.storage.getItem(this.getFullKey(key));
      
      if (!serialized) {
        return false;
      }

      const item: StorageItem = this.config.deserialize(serialized);

      // 检查版本和过期
      if (!this.isVersionValid(item) || this.isExpired(item)) {
        this.remove(key);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Storage has error:', error);
      return false;
    }
  }

  // 移除项
  remove(key: string): boolean {
    try {
      this.storage.removeItem(this.getFullKey(key));
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  // 清空所有项（仅清空带前缀的项）
  clear(): boolean {
    try {
      if (this.config.prefix) {
        // 只清空带前缀的项
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key && key.startsWith(`${this.config.prefix}:`)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => this.storage.removeItem(key));
      } else {
        // 清空所有项
        this.storage.clear();
      }
      
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  // 获取所有键
  keys(): string[] {
    const keys: string[] = [];
    
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          if (this.config.prefix) {
            if (key.startsWith(`${this.config.prefix}:`)) {
              keys.push(key.substring(this.config.prefix.length + 1));
            }
          } else {
            keys.push(key);
          }
        }
      }
    } catch (error) {
      console.error('Storage keys error:', error);
    }
    
    return keys;
  }

  // 获取存储大小（字节）
  size(): number {
    let size = 0;
    
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          const value = this.storage.getItem(key);
          if (value) {
            size += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.error('Storage size error:', error);
    }
    
    return size;
  }

  // 清理过期项
  cleanup(): number {
    let cleanedCount = 0;
    
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          const shouldCheck = this.config.prefix ? 
            key.startsWith(`${this.config.prefix}:`) : true;
          
          if (shouldCheck) {
            const value = this.storage.getItem(key);
            if (value) {
              try {
                const item: StorageItem = this.config.deserialize(value);
                if (!this.isVersionValid(item) || this.isExpired(item)) {
                  keysToRemove.push(key);
                }
              } catch {
                // 无法解析的项也删除
                keysToRemove.push(key);
              }
            }
          }
        }
      }
      
      keysToRemove.forEach(key => {
        this.storage.removeItem(key);
        cleanedCount++;
      });
    } catch (error) {
      console.error('Storage cleanup error:', error);
    }
    
    return cleanedCount;
  }

  // 导出数据
  export(): Record<string, any> {
    const data: Record<string, any> = {};
    
    try {
      const keys = this.keys();
      keys.forEach(key => {
        const value = this.get(key);
        if (value !== undefined) {
          data[key] = value;
        }
      });
    } catch (error) {
      console.error('Storage export error:', error);
    }
    
    return data;
  }

  // 导入数据
  import(data: Record<string, any>, overwrite: boolean = false): boolean {
    try {
      Object.entries(data).forEach(([key, value]) => {
        if (overwrite || !this.has(key)) {
          this.set(key, value);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Storage import error:', error);
      return false;
    }
  }
}

// 创建默认存储实例
export const localStorage = new StorageManager('localStorage', { prefix: 'app' });
export const sessionStorage = new StorageManager('sessionStorage', { prefix: 'app' });
export const memoryStorage = new StorageManager('memory', { prefix: 'app' });

// 便捷函数
export const setLocal = <T>(key: string, value: T, ttl?: number): boolean => {
  return localStorage.set(key, value, ttl);
};

export const getLocal = <T>(key: string, defaultValue?: T): T | undefined => {
  return localStorage.get(key, defaultValue);
};

export const removeLocal = (key: string): boolean => {
  return localStorage.remove(key);
};

export const hasLocal = (key: string): boolean => {
  return localStorage.has(key);
};

export const setSession = <T>(key: string, value: T, ttl?: number): boolean => {
  return sessionStorage.set(key, value, ttl);
};

export const getSession = <T>(key: string, defaultValue?: T): T | undefined => {
  return sessionStorage.get(key, defaultValue);
};

export const removeSession = (key: string): boolean => {
  return sessionStorage.remove(key);
};

export const hasSession = (key: string): boolean => {
  return sessionStorage.has(key);
};

// Cookie 工具函数
export interface CookieOptions {
  expires?: Date | number; // 过期时间或天数
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  if (typeof document === 'undefined') {
    return;
  }

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    let expires: Date;
    if (typeof options.expires === 'number') {
      expires = new Date(Date.now() + options.expires * 24 * 60 * 60 * 1000);
    } else {
      expires = options.expires;
    }
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  if (options.httpOnly) {
    cookieString += '; httponly';
  }

  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
};

export const removeCookie = (name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void => {
  setCookie(name, '', {
    ...options,
    expires: new Date(0),
  });
};

export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

export const getAllCookies = (): Record<string, string> => {
  if (typeof document === 'undefined') {
    return {};
  }

  const cookies: Record<string, string> = {};
  const cookieStrings = document.cookie.split(';');

  for (let cookie of cookieStrings) {
    cookie = cookie.trim();
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }

  return cookies;
};

// 存储事件监听
export type StorageEventCallback = (event: {
  key: string;
  oldValue: any;
  newValue: any;
  storageArea: Storage;
}) => void;

class StorageEventManager {
  private listeners = new Map<string, Set<StorageEventCallback>>();
  private isListening = false;

  constructor() {
    this.handleStorageEvent = this.handleStorageEvent.bind(this);
  }

  private handleStorageEvent(event: StorageEvent): void {
    if (!event.key) return;

    const callbacks = this.listeners.get(event.key) || new Set();
    const allCallbacks = this.listeners.get('*') || new Set();

    const customEvent = {
      key: event.key,
      oldValue: event.oldValue ? JSON.parse(event.oldValue) : null,
      newValue: event.newValue ? JSON.parse(event.newValue) : null,
      storageArea: event.storageArea!,
    };

    [...callbacks, ...allCallbacks].forEach(callback => {
      try {
        callback(customEvent);
      } catch (error) {
        console.error('Storage event callback error:', error);
      }
    });
  }

  private startListening(): void {
    if (!this.isListening && typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
      this.isListening = true;
    }
  }

  private stopListening(): void {
    if (this.isListening && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
      this.isListening = false;
    }
  }

  on(key: string, callback: StorageEventCallback): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(callback);
    this.startListening();

    // 返回取消监听的函数
    return () => {
      this.off(key, callback);
    };
  }

  off(key: string, callback: StorageEventCallback): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(key);
      }
    }

    // 如果没有监听器了，停止监听
    if (this.listeners.size === 0) {
      this.stopListening();
    }
  }

  once(key: string, callback: StorageEventCallback): () => void {
    const onceCallback: StorageEventCallback = (event) => {
      callback(event);
      this.off(key, onceCallback);
    };

    return this.on(key, onceCallback);
  }

  removeAllListeners(key?: string): void {
    if (key) {
      this.listeners.delete(key);
    } else {
      this.listeners.clear();
      this.stopListening();
    }
  }
}

export const storageEvents = new StorageEventManager();

// 存储配额检查
export const getStorageQuota = async (): Promise<{
  quota: number;
  usage: number;
  available: number;
  percentage: number;
} | null> => {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const available = quota - usage;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      quota,
      usage,
      available,
      percentage,
    };
  } catch (error) {
    console.error('Failed to get storage quota:', error);
    return null;
  }
};

// 存储压缩工具（简单的 LZ 压缩）
export const compressString = (str: string): string => {
  const dict: Record<string, number> = {};
  const data = str.split('');
  const result: (string | number)[] = [];
  let dictSize = 256;
  let w = '';

  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const wc = w + c;

    if (dict[wc]) {
      w = wc;
    } else {
      result.push(w.length > 1 ? dict[w] : w.charCodeAt(0));
      dict[wc] = dictSize++;
      w = c;
    }
  }

  if (w) {
    result.push(w.length > 1 ? dict[w] : w.charCodeAt(0));
  }

  return result.join(',');
};

export const decompressString = (compressed: string): string => {
  const dict: Record<number, string> = {};
  const data = compressed.split(',').map(Number);
  let dictSize = 256;
  let w = String.fromCharCode(data[0]);
  let result = w;

  for (let i = 1; i < data.length; i++) {
    const k = data[i];
    let entry: string;

    if (dict[k]) {
      entry = dict[k];
    } else if (k === dictSize) {
      entry = w + w.charAt(0);
    } else {
      entry = String.fromCharCode(k);
    }

    result += entry;
    dict[dictSize++] = w + entry.charAt(0);
    w = entry;
  }

  return result;
};

// 存储常量
export const STORAGE_EVENTS = {
  SET: 'storage:set',
  GET: 'storage:get',
  REMOVE: 'storage:remove',
  CLEAR: 'storage:clear',
  CLEANUP: 'storage:cleanup',
} as const;

export const STORAGE_LIMITS = {
  LOCAL_STORAGE: 5 * 1024 * 1024, // 5MB
  SESSION_STORAGE: 5 * 1024 * 1024, // 5MB
  COOKIE: 4 * 1024, // 4KB
} as const;