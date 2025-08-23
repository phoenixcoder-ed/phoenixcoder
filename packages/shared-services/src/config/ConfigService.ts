import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ServiceErrorType, ValidationError, handleUnknownError } from '../types/ServiceError';
import { ServiceConfig } from '../types/ServiceConfig';
import { SERVICE_EVENTS } from '../types/ServiceConstants';
import { EventEmitter } from 'eventemitter3';

/**
 * 配置值类型
 */
export type ConfigValue = string | number | boolean | object | null | undefined;

/**
 * 配置项定义
 */
export interface ConfigItem {
  key: string;
  value: ConfigValue;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  defaultValue?: ConfigValue;
  required?: boolean;
  validation?: ConfigValidation;
  sensitive?: boolean; // 敏感信息，不会在日志中显示
  environment?: string; // 环境变量名
  source?: 'env' | 'file' | 'default' | 'override';
  lastModified?: Date;
  version?: string;
}

/**
 * 配置验证规则
 */
export interface ConfigValidation {
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

/**
 * 配置模式定义
 */
export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    defaultValue?: ConfigValue;
    required?: boolean;
    validation?: ConfigValidation;
    sensitive?: boolean;
    environment?: string;
  };
}

/**
 * 配置查询参数
 */
export interface ConfigQueryParams {
  keys?: string[];
  prefix?: string;
  environment?: string;
  source?: string;
  includeDefaults?: boolean;
  includeSensitive?: boolean;
}

/**
 * 配置更新数据
 */
export interface ConfigUpdateData {
  key: string;
  value: ConfigValue;
  source?: 'override' | 'file';
  version?: string;
}

/**
 * 配置统计信息
 */
export interface ConfigStats {
  totalConfigs: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  requiredConfigs: number;
  sensitiveConfigs: number;
  validationErrors: number;
  lastUpdate: Date;
  environments: string[];
}

/**
 * 配置服务配置接口
 */
export interface ConfigServiceConfig extends ServiceConfig {
  /** 环境变量前缀 */
  envPrefix?: string;
  /** 配置文件路径 */
  configFile?: string;
  /** 默认配置 */
  defaults?: Record<string, ConfigValue>;
  /** 是否启用文件监听 */
  watchEnabled?: boolean;
  /** 配置模式 */
  schema?: ConfigSchema;
}

/**
 * 配置事件接口
 */
export interface ConfigEvents {
  'config:loaded': (configs: ConfigItem[]) => void;
  'config:updated': (key: string, oldValue: ConfigValue, newValue: ConfigValue) => void;
  'config:added': (config: ConfigItem) => void;
  'config:removed': (key: string) => void;
  'config:validated': (key: string, valid: boolean, error?: string) => void;
  'config:reloaded': (source: string) => void;
  'config:error': (error: ServiceError) => void;
}

/**
 * 配置提供者接口
 */
export interface ConfigProvider {
  name: string;
  priority: number;
  load(): Promise<Record<string, ConfigValue>>;
  watch?(callback: (changes: Record<string, ConfigValue>) => void): void;
  unwatch?(): void;
}

/**
 * 环境变量配置提供者
 */
class EnvironmentConfigProvider implements ConfigProvider {
  name = 'environment';
  priority = 100;
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  async load(): Promise<Record<string, ConfigValue>> {
    const configs: Record<string, ConfigValue> = {};
    
    for (const [key, value] of Object.entries(process.env)) {
      if (!this.prefix || key.startsWith(this.prefix)) {
        const configKey = this.prefix ? key.slice(this.prefix.length) : key;
        configs[configKey] = this.parseValue(value);
      }
    }
    
    return configs;
  }

  private parseValue(value: string | undefined): ConfigValue {
    if (value === undefined) return undefined;
    if (value === '') return '';
    
    // 尝试解析为布尔值
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // 尝试解析为数字
    const numValue = Number(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return numValue;
    }
    
    // 尝试解析为JSON
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value);
      } catch {
        // 解析失败，返回原字符串
      }
    }
    
    return value;
  }
}

/**
 * 文件配置提供者
 */
class FileConfigProvider implements ConfigProvider {
  name = 'file';
  priority = 50;
  private filePath: string;
  private watchCallback?: (changes: Record<string, ConfigValue>) => void;
  private watcher?: any;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async load(): Promise<Record<string, ConfigValue>> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const content = await fs.readFile(this.filePath, 'utf-8');
      const ext = path.extname(this.filePath).toLowerCase();
      
      switch (ext) {
        case '.json':
          return JSON.parse(content);
        case '.yaml':
        case '.yml':
          // 这里应该使用yaml解析库
          throw new Error('YAML support not implemented');
        case '.env':
          return this.parseEnvFile(content);
        default:
          throw new Error(`Unsupported file format: ${ext}`);
      }
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'ConfigService', 'load', ServiceErrorType.DATA);
      const fileError = new ServiceError({
        message: `加载配置文件失败: ${this.filePath} - ${serviceError.message}`,
        code: serviceError.code,
        type: serviceError.type,
        serviceName: serviceError.serviceName,
        operation: serviceError.operation,
        retryable: serviceError.retryable,
        innerError: serviceError
      });
      throw fileError;
    }
  }

  watch(callback: (changes: Record<string, ConfigValue>) => void): void {
    this.watchCallback = callback;
    
    // 这里应该实现文件监听逻辑
    // 为了简化，这里只是模拟
    if (typeof window === 'undefined') {
      const fs = require('fs');
      this.watcher = fs.watchFile(this.filePath, async () => {
        try {
          const newConfigs = await this.load();
          this.watchCallback?.(newConfigs);
        } catch (error: unknown) {
          // 忽略监听错误
        }
      });
    }
  }

  unwatch(): void {
    if (this.watcher) {
      const fs = require('fs');
      fs.unwatchFile(this.filePath);
      this.watcher = null;
    }
    this.watchCallback = undefined;
  }

  private parseEnvFile(content: string): Record<string, ConfigValue> {
    const configs: Record<string, ConfigValue> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) continue;
      
      const key = trimmed.slice(0, equalIndex).trim();
      const value = trimmed.slice(equalIndex + 1).trim();
      
      // 移除引号
      const unquoted = value.replace(/^["']|["']$/g, '');
      configs[key] = this.parseValue(unquoted);
    }
    
    return configs;
  }

  private parseValue(value: string): ConfigValue {
    if (value === '') return '';
    
    // 尝试解析为布尔值
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // 尝试解析为数字
    const numValue = Number(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return numValue;
    }
    
    return value;
  }
}

/**
 * 默认配置提供者
 */
class DefaultConfigProvider implements ConfigProvider {
  name = 'default';
  priority = 10;
  private defaults: Record<string, ConfigValue>;

  constructor(defaults: Record<string, ConfigValue>) {
    this.defaults = defaults;
  }

  async load(): Promise<Record<string, ConfigValue>> {
    return { ...this.defaults };
  }
}

/**
 * 配置服务类
 */
export class ConfigService extends BaseService implements IService {
  private eventEmitter: EventEmitter<ConfigEvents>;
  private configs: Map<string, ConfigItem>;
  private schema: ConfigSchema;
  private providers: ConfigProvider[];
  private stats: ConfigStats;
  private watchEnabled: boolean;

  constructor(config: ConfigServiceConfig) {
    super(config, 'ConfigService', '1.0.0');
    
    this.eventEmitter = new EventEmitter();
    this.configs = new Map();
    this.schema = {};
    this.providers = [];
    this.watchEnabled = config.watchEnabled ?? true;
    
    // 初始化统计信息
    this.stats = {
      totalConfigs: 0,
      byType: {},
      bySource: {},
      requiredConfigs: 0,
      sensitiveConfigs: 0,
      validationErrors: 0,
      lastUpdate: new Date(),
      environments: []
    };
    
    // 添加默认提供者
    this.addProvider(new EnvironmentConfigProvider(config.envPrefix));
    
    if (config.configFile) {
      this.addProvider(new FileConfigProvider(config.configFile));
    }
    
    if (config.defaults) {
      this.addProvider(new DefaultConfigProvider(config.defaults));
    }
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 加载配置
    await this.loadConfigs();
    
    // 启动监听
    if (this.watchEnabled) {
      this.startWatching();
    }
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    
    // 停止监听
    this.stopWatching();
    
    this.configs.clear();
    this.providers = [];
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<boolean> {
    try {
      // 检查必需配置是否存在
      for (const [key, schemaItem] of Object.entries(this.schema)) {
        if (schemaItem.required && !this.has(key)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 设置配置模式
   */
  setSchema(schema: ConfigSchema): void {
    this.schema = { ...schema };
    
    // 验证现有配置
    this.validateAllConfigs();
  }

  /**
   * 添加配置提供者
   */
  addProvider(provider: ConfigProvider): void {
    this.providers.push(provider);
    this.providers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 移除配置提供者
   */
  removeProvider(name: string): boolean {
    const index = this.providers.findIndex(p => p.name === name);
    if (index !== -1) {
      const provider = this.providers[index];
      provider.unwatch?.();
      this.providers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 加载配置
   */
  async loadConfigs(): Promise<void> {
    try {
      const allConfigs: Record<string, ConfigValue> = {};
      
      // 按优先级加载配置
      for (const provider of this.providers) {
        try {
          const configs = await provider.load();
          Object.assign(allConfigs, configs);
        } catch (error: unknown) {
          const serviceError = handleUnknownError(error, 'ConfigService', 'loadConfigs', ServiceErrorType.DATA);
          const providerError = new ServiceError({
            message: `配置提供者 ${provider.name} 加载失败: ${serviceError.message}`,
            code: serviceError.code,
            type: serviceError.type,
            serviceName: serviceError.serviceName,
            operation: serviceError.operation,
            retryable: serviceError.retryable,
            innerError: serviceError
          });
          this.eventEmitter.emit('config:error', providerError);
        }
      }
      
      // 处理配置项
      for (const [key, value] of Object.entries(allConfigs)) {
        this.setConfigItem(key, value, 'env');
      }
      
      // 应用模式默认值
      this.applySchemaDefaults();
      
      // 验证配置
      this.validateAllConfigs();
      
      // 更新统计
      this.updateStats();
      
      // 发射事件
      const configItems = Array.from(this.configs.values());
      this.eventEmitter.emit('config:loaded', configItems);
      this.emit(SERVICE_EVENTS.CONFIG_LOADED, configItems);
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'ConfigService', 'loadConfigs', ServiceErrorType.DATA);
      const loadError = new ServiceError({
        message: `加载配置失败: ${serviceError.message}`,
        code: serviceError.code,
        type: serviceError.type,
        serviceName: serviceError.serviceName,
        operation: serviceError.operation,
        retryable: serviceError.retryable,
        innerError: serviceError
      });
      this.eventEmitter.emit('config:error', loadError);
      throw loadError;
    }
  }

  /**
   * 重新加载配置
   */
  async reloadConfigs(source?: string): Promise<void> {
    if (source) {
      const provider = this.providers.find(p => p.name === source);
      if (provider) {
        try {
          const configs = await provider.load();
          for (const [key, value] of Object.entries(configs)) {
            this.setConfigItem(key, value, source as any);
          }
          this.eventEmitter.emit('config:reloaded', source);
        } catch (error: unknown) {
          const serviceError = handleUnknownError(error, 'ConfigService', 'reloadConfigs', ServiceErrorType.DATA);
          const reloadError = new ServiceError({
            message: `重新加载配置源 ${source} 失败: ${serviceError.message}`,
            code: serviceError.code,
            type: serviceError.type,
            serviceName: serviceError.serviceName,
            operation: serviceError.operation,
            retryable: serviceError.retryable,
            innerError: serviceError
          });
          this.eventEmitter.emit('config:error', reloadError);
          throw reloadError;
        }
      }
    } else {
      await this.loadConfigs();
    }
  }

  /**
   * 获取配置值
   */
  get<T = ConfigValue>(key: string, defaultValue?: T): T {
    const config = this.configs.get(key);
    if (config !== undefined) {
      return config.value as T;
    }
    
    // 检查模式默认值
    const schemaItem = this.schema[key];
    if (schemaItem?.defaultValue !== undefined) {
      return schemaItem.defaultValue as T;
    }
    
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    
    throw new ValidationError(`配置项 ${key} 不存在且没有默认值`, [{ field: 'key', message: `配置项 ${key} 不存在且没有默认值`, code: 'CONFIG_NOT_FOUND' }]);
  }

  /**
   * 获取字符串配置
   */
  getString(key: string, defaultValue?: string): string {
    const value = this.get(key, defaultValue);
    return String(value);
  }

  /**
   * 获取数字配置
   */
  getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue);
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(`配置项 ${key} 不是有效的数字: ${value}`, [{ field: key, message: `配置项 ${key} 不是有效的数字: ${value}`, code: 'INVALID_NUMBER' }]);
    }
    return num;
  }

  /**
   * 获取布尔配置
   */
  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue) as ConfigValue;
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }

  /**
   * 获取对象配置
   */
  getObject<T = any>(key: string, defaultValue?: T): T {
    const value = this.get(key, defaultValue);
    if (typeof value === 'object' && value !== null) {
      return value as T;
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        throw new ValidationError(`配置项 ${key} 不是有效的JSON对象: ${value}`, [{ field: key, message: `配置项 ${key} 不是有效的JSON对象: ${value}`, code: 'INVALID_JSON' }]);
      }
    }
    throw new ValidationError(`配置项 ${key} 不是对象类型: ${value}`, [{ field: key, message: `配置项 ${key} 不是对象类型: ${value}`, code: 'INVALID_OBJECT' }]);
  }

  /**
   * 获取数组配置
   */
  getArray<T = any>(key: string, defaultValue?: T[]): T[] {
    const value = this.get(key, defaultValue) as ConfigValue;
    if (Array.isArray(value)) {
      return value as T[];
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed as T[];
        }
      } catch {
        // 尝试按逗号分割
        return value.split(',').map((item: any) => item.trim()) as T[];
      }
    }
    throw new ValidationError(`配置项 ${key} 不是数组类型: ${value}`, [{ field: key, message: `配置项 ${key} 不是数组类型: ${value}`, code: 'INVALID_ARRAY' }]);
  }

  /**
   * 设置配置值
   */
  set(key: string, value: ConfigValue, source: 'override' | 'file' = 'override'): void {
    const oldValue = this.configs.get(key)?.value;
    this.setConfigItem(key, value, source);
    
    // 验证配置
    this.validateConfig(key);
    
    // 更新统计
    this.updateStats();
    
    // 发射事件
    if (oldValue !== undefined) {
      this.eventEmitter.emit('config:updated', key, oldValue, value);
      this.emit(SERVICE_EVENTS.CONFIG_UPDATED, { key, oldValue, newValue: value });
    } else {
      const config = this.configs.get(key)!;
      this.eventEmitter.emit('config:added', config);
      this.emit(SERVICE_EVENTS.CONFIG_ADDED, config);
    }
  }

  /**
   * 检查配置是否存在
   */
  has(key: string): boolean {
    return this.configs.has(key) || this.schema[key]?.defaultValue !== undefined;
  }

  /**
   * 删除配置
   */
  delete(key: string): boolean {
    const deleted = this.configs.delete(key);
    if (deleted) {
      this.updateStats();
      this.eventEmitter.emit('config:removed', key);
      this.emit(SERVICE_EVENTS.CONFIG_REMOVED, { key });
    }
    return deleted;
  }

  /**
   * 获取所有配置键
   */
  keys(): string[] {
    const configKeys = Array.from(this.configs.keys());
    const schemaKeys = Object.keys(this.schema);
    return Array.from(new Set([...configKeys, ...schemaKeys]));
  }

  /**
   * 获取配置项
   */
  getConfigItem(key: string): ConfigItem | undefined {
    return this.configs.get(key);
  }

  /**
   * 获取所有配置项
   */
  getAllConfigs(): ConfigItem[] {
    return Array.from(this.configs.values());
  }

  /**
   * 查询配置
   */
  async queryConfigs(params: ConfigQueryParams = {}): Promise<ConfigItem[]> {
    try {
      let results = Array.from(this.configs.values());
      
      // 按键过滤
      if (params.keys && params.keys.length > 0) {
        results = results.filter(config => params.keys!.includes(config.key));
      }
      
      // 按前缀过滤
      if (params.prefix) {
        results = results.filter(config => config.key.startsWith(params.prefix!));
      }
      
      // 按环境过滤
      if (params.environment) {
        results = results.filter(config => config.environment === params.environment);
      }
      
      // 按来源过滤
      if (params.source) {
        results = results.filter(config => config.source === params.source);
      }
      
      // 是否包含默认值
      if (params.includeDefaults) {
        for (const [key, schemaItem] of Object.entries(this.schema)) {
          if (!this.configs.has(key) && schemaItem.defaultValue !== undefined) {
            results.push({
              key,
              value: schemaItem.defaultValue,
              type: schemaItem.type,
              description: schemaItem.description,
              defaultValue: schemaItem.defaultValue,
              required: schemaItem.required,
              validation: schemaItem.validation,
              sensitive: schemaItem.sensitive,
              environment: schemaItem.environment,
              source: 'default'
            });
          }
        }
      }
      
      // 是否包含敏感信息
      if (!params.includeSensitive) {
        results = results.map(config => {
          if (config.sensitive) {
            return {
              ...config,
              value: '***'
            };
          }
          return config;
        });
      }
      
      return results;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'ConfigService', 'queryConfigs', ServiceErrorType.DATA);
      const queryError = new ServiceError({
        message: `查询配置失败: ${serviceError.message}`,
        code: serviceError.code,
        type: serviceError.type,
        serviceName: serviceError.serviceName,
        operation: serviceError.operation,
        retryable: serviceError.retryable,
        innerError: serviceError
      });
      this.eventEmitter.emit('config:error', queryError);
      throw queryError;
    }
  }

  /**
   * 批量更新配置
   */
  async updateConfigs(updates: ConfigUpdateData[]): Promise<void> {
    try {
      for (const update of updates) {
        this.set(update.key, update.value, update.source);
      }
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'ConfigService', 'updateConfigs', ServiceErrorType.DATA);
      const updateError = new ServiceError({
        message: `批量更新配置失败: ${serviceError.message}`,
        code: serviceError.code,
        type: serviceError.type,
        serviceName: serviceError.serviceName,
        operation: serviceError.operation,
        retryable: serviceError.retryable,
        innerError: serviceError
      });
      this.eventEmitter.emit('config:error', updateError);
      throw updateError;
    }
  }

  /**
   * 验证配置
   */
  validateConfig(key: string): boolean {
    const config = this.configs.get(key);
    const schemaItem = this.schema[key];
    
    if (!config && !schemaItem) {
      return true; // 没有配置和模式，认为有效
    }
    
    try {
      // 检查必需性
      if (schemaItem?.required && (!config || config.value === undefined || config.value === null)) {
        throw new ValidationError(`必需配置项 ${key} 缺失`, [{ field: key, message: `必需配置项 ${key} 缺失`, code: 'REQUIRED_CONFIG_MISSING' }]);
      }
      
      if (!config || config.value === undefined || config.value === null) {
        return true; // 可选配置项可以为空
      }
      
      // 检查类型
      if (schemaItem?.type) {
        if (!this.validateType(config.value, schemaItem.type)) {
          throw new ValidationError(`配置项 ${key} 类型错误，期望 ${schemaItem.type}，实际 ${typeof config.value}`, [{ field: key, message: `配置项 ${key} 类型错误，期望 ${schemaItem.type}，实际 ${typeof config.value}`, code: 'TYPE_MISMATCH' }]);
        }
      }
      
      // 检查验证规则
      if (schemaItem?.validation) {
        const validation = schemaItem.validation;
        
        // 数值范围检查
        if (typeof config.value === 'number') {
          if (validation.min !== undefined && config.value < validation.min) {
            throw new ValidationError(`配置项 ${key} 值 ${config.value} 小于最小值 ${validation.min}`, [{ field: key, message: `配置项 ${key} 值 ${config.value} 小于最小值 ${validation.min}`, code: 'VALUE_TOO_SMALL' }]);
          }
          if (validation.max !== undefined && config.value > validation.max) {
            throw new ValidationError(`配置项 ${key} 值 ${config.value} 大于最大值 ${validation.max}`, [{ field: key, message: `配置项 ${key} 值 ${config.value} 大于最大值 ${validation.max}`, code: 'VALUE_TOO_LARGE' }]);
          }
        }
        
        // 字符串长度检查
        if (typeof config.value === 'string') {
          if (validation.min !== undefined && config.value.length < validation.min) {
            throw new ValidationError(`配置项 ${key} 长度 ${config.value.length} 小于最小长度 ${validation.min}`, [{ field: key, message: `配置项 ${key} 长度 ${config.value.length} 小于最小长度 ${validation.min}`, code: 'LENGTH_TOO_SHORT' }]);
          }
          if (validation.max !== undefined && config.value.length > validation.max) {
            throw new ValidationError(`配置项 ${key} 长度 ${config.value.length} 大于最大长度 ${validation.max}`, [{ field: key, message: `配置项 ${key} 长度 ${config.value.length} 大于最大长度 ${validation.max}`, code: 'LENGTH_TOO_LONG' }]);
          }
        }
        
        // 正则表达式检查
        if (validation.pattern && typeof config.value === 'string') {
          if (!validation.pattern.test(config.value)) {
            throw new ValidationError(`配置项 ${key} 值 ${config.value} 不匹配模式 ${validation.pattern}`, [{ field: key, message: `配置项 ${key} 值 ${config.value} 不匹配模式 ${validation.pattern}`, code: 'PATTERN_MISMATCH' }]);
          }
        }
        
        // 枚举值检查
        if (validation.enum && !validation.enum.includes(config.value)) {
          throw new ValidationError(`配置项 ${key} 值 ${config.value} 不在允许的枚举值中: ${validation.enum.join(', ')}`, [{ field: key, message: `配置项 ${key} 值 ${config.value} 不在允许的枚举值中: ${validation.enum.join(', ')}`, code: 'INVALID_ENUM_VALUE' }]);
        }
        
        // 自定义验证
        if (validation.custom) {
          const result = validation.custom(config.value);
          if (result !== true) {
            const message = typeof result === 'string' ? result : `配置项 ${key} 自定义验证失败`;
            throw new ValidationError(message, [{ field: key, message, code: 'CUSTOM_VALIDATION_FAILED' }]);
          }
        }
      }
      
      this.eventEmitter.emit('config:validated', key, true);
      return true;
    } catch (error) {
      this.stats.validationErrors++;
      const message = error instanceof ValidationError ? error.message : `配置项 ${key} 验证失败`;
      this.eventEmitter.emit('config:validated', key, false, message);
      throw error;
    }
  }

  /**
   * 获取配置统计信息
   */
  async getStats(): Promise<ConfigStats> {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  async resetStats(): Promise<void> {
    this.stats = {
      totalConfigs: this.configs.size,
      byType: {},
      bySource: {},
      requiredConfigs: 0,
      sensitiveConfigs: 0,
      validationErrors: 0,
      lastUpdate: new Date(),
      environments: []
    };
    
    this.updateStats();
  }

  /**
   * 监听配置事件
   */
  override on<T extends string | symbol>(event: T, fn: (...args: any[]) => void, context?: any): this {
    return super.on(event, fn, context);
  }

  /**
   * 监听配置事件（类型安全版本）
   */
  onConfigEvent<K extends keyof ConfigEvents>(event: K, listener: ConfigEvents[K]): void {
    this.eventEmitter.on(event, listener as any);
  }

  /**
   * 移除配置事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: any[]) => void) | undefined, context?: any, once?: boolean | undefined): this {
    return super.off(event, fn, context, once);
  }

  /**
   * 移除配置事件监听（类型安全版本）
   */
  offConfigEvent<K extends keyof ConfigEvents>(event: K, listener: ConfigEvents[K]): void {
    this.eventEmitter.off(event, listener as any);
  }

  /**
   * 设置配置项
   */
  private setConfigItem(key: string, value: ConfigValue, source: 'env' | 'file' | 'default' | 'override'): void {
    const schemaItem = this.schema[key];
    const type = this.inferType(value) || schemaItem?.type || 'string';
    
    const config: ConfigItem = {
      key,
      value,
      type,
      description: schemaItem?.description,
      defaultValue: schemaItem?.defaultValue,
      required: schemaItem?.required,
      validation: schemaItem?.validation,
      sensitive: schemaItem?.sensitive,
      environment: schemaItem?.environment,
      source,
      lastModified: new Date()
    };
    
    this.configs.set(key, config);
  }

  /**
   * 推断值类型
   */
  private inferType(value: ConfigValue): 'string' | 'number' | 'boolean' | 'object' | 'array' | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  /**
   * 验证类型
   */
  private validateType(value: ConfigValue, expectedType: 'string' | 'number' | 'boolean' | 'object' | 'array'): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * 应用模式默认值
   */
  private applySchemaDefaults(): void {
    for (const [key, schemaItem] of Object.entries(this.schema)) {
      if (!this.configs.has(key) && schemaItem.defaultValue !== undefined) {
        this.setConfigItem(key, schemaItem.defaultValue, 'default');
      }
    }
  }

  /**
   * 验证所有配置
   */
  private validateAllConfigs(): void {
    this.stats.validationErrors = 0;
    
    for (const key of this.keys()) {
      try {
        this.validateConfig(key);
      } catch (error) {
        // 验证错误已在validateConfig中处理
      }
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.totalConfigs = this.configs.size;
    this.stats.byType = {};
    this.stats.bySource = {};
    this.stats.requiredConfigs = 0;
    this.stats.sensitiveConfigs = 0;
    this.stats.environments = [];
    
    for (const config of this.configs.values()) {
      // 按类型统计
      this.stats.byType[config.type] = (this.stats.byType[config.type] || 0) + 1;
      
      // 按来源统计
      if (config.source) {
        this.stats.bySource[config.source] = (this.stats.bySource[config.source] || 0) + 1;
      }
      
      // 必需配置统计
      if (config.required) {
        this.stats.requiredConfigs++;
      }
      
      // 敏感配置统计
      if (config.sensitive) {
        this.stats.sensitiveConfigs++;
      }
      
      // 环境统计
      if (config.environment && !this.stats.environments.includes(config.environment)) {
        this.stats.environments.push(config.environment);
      }
    }
    
    this.stats.lastUpdate = new Date();
  }

  /**
   * 启动监听
   */
  private startWatching(): void {
    for (const provider of this.providers) {
      if (provider.watch) {
        provider.watch(async (changes) => {
          try {
            for (const [key, value] of Object.entries(changes)) {
              this.setConfigItem(key, value, provider.name as any);
            }
            this.validateAllConfigs();
            this.updateStats();
            this.eventEmitter.emit('config:reloaded', provider.name);
          } catch (error: unknown) {
            const serviceError = handleUnknownError(error, 'ConfigService', 'startWatching', ServiceErrorType.DATA);
            const watchError = new ServiceError({
              message: `配置监听更新失败: ${provider.name} - ${serviceError.message}`,
              code: serviceError.code,
              type: serviceError.type,
              serviceName: serviceError.serviceName,
              operation: serviceError.operation,
              retryable: serviceError.retryable,
              innerError: serviceError
            });
            this.eventEmitter.emit('config:error', watchError);
          }
        });
      }
    }
  }

  /**
   * 停止监听
   */
  private stopWatching(): void {
    for (const provider of this.providers) {
      provider.unwatch?.();
    }
  }
}

// 全局配置服务实例
let configServiceInstance: ConfigService | null = null;

/**
 * 创建配置服务实例
 */
export function createConfigService(config: ConfigServiceConfig): ConfigService {
  return new ConfigService(config);
}

/**
 * 获取配置服务实例
 */
export function getConfigService(): ConfigService | null {
  return configServiceInstance;
}

/**
 * 初始化配置服务
 */
export async function initConfigService(config: ConfigServiceConfig): Promise<ConfigService> {
  if (configServiceInstance) {
    await configServiceInstance.destroy();
  }
  
  configServiceInstance = new ConfigService(config);
  await configServiceInstance.initialize();
  
  return configServiceInstance;
}

/**
 * 销毁配置服务
 */
export async function destroyConfigService(): Promise<void> {
  if (configServiceInstance) {
    await configServiceInstance.destroy();
    configServiceInstance = null;
  }
}



// 导出默认实例
export default ConfigService;