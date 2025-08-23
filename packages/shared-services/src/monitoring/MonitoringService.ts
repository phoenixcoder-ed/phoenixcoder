import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ServiceErrorType, ValidationError } from '../types/ServiceError';
import { ServiceConfig } from '../types/ServiceConfig';
import { SERVICE_EVENTS } from '../types/ServiceConstants';
import { EventEmitter } from 'eventemitter3';

/**
 * 监控服务配置
 */
export interface MonitoringConfig extends ServiceConfig {
  /** 指标收集间隔（毫秒） */
  metricsInterval?: number;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval?: number;
  /** 数据保留时间（小时） */
  dataRetentionHours?: number;
  /** 是否启用告警 */
  enableAlerts?: boolean;
  /** 告警检查间隔（毫秒） */
  alertCheckInterval?: number;
  /** 最大数据点数量 */
  maxDataPoints?: number;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
  /** 是否启用系统监控 */
  enableSystemMonitoring?: boolean;
  /** 健康检查器配置 */
  healthCheckers?: {
    database?: boolean;
    redis?: boolean;
    http?: boolean;
  };
}

/**
 * 指标类型枚举
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

/**
 * 指标数据点
 */
export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

/**
 * 指标定义
 */
export interface Metric {
  name: string;
  type: MetricType;
  description: string;
  unit?: string;
  labels?: string[];
  dataPoints: MetricDataPoint[];
  lastValue?: number;
  totalValue?: number;
  count?: number;
  min?: number;
  max?: number;
  avg?: number;
  percentiles?: Record<string, number>;
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  duration: number;
  timestamp: Date;
  details?: Record<string, any>;
}

/**
 * 系统信息
 */
export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  cpu: {
    cores: number;
    usage: number;
    loadAverage: number[];
  };
  uptime: number;
  pid: number;
  timestamp: Date;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  errorRate: {
    rate: number;
    count: number;
    total: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: {
    usage: number;
    userTime: number;
    systemTime: number;
  };
  gc: {
    collections: number;
    duration: number;
    freed: number;
  };
  eventLoop: {
    lag: number;
    utilization: number;
  };
}

/**
 * 告警规则
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: {
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    duration?: number; // 持续时间（秒）
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  actions: AlertAction[];
  lastTriggered?: Date;
  triggerCount: number;
}

/**
 * 告警动作
 */
export interface AlertAction {
  type: 'email' | 'webhook' | 'log' | 'notification';
  config: Record<string, any>;
}

/**
 * 告警事件
 */
export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: string;
  value: number;
  threshold: number;
  severity: string;
  message: string;
  timestamp: Date;
  resolved?: Date;
  duration?: number;
}

/**
 * 监控查询参数
 */
export interface MonitoringQueryParams {
  metrics?: string[];
  startTime?: Date;
  endTime?: Date;
  interval?: number; // 采样间隔（秒）
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  labels?: Record<string, string>;
  limit?: number;
}

/**
 * 监控统计信息
 */
export interface MonitoringStats {
  totalMetrics: number;
  activeAlerts: number;
  healthChecks: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
  dataPoints: {
    total: number;
    lastHour: number;
    lastDay: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  uptime: number;
  lastUpdate: Date;
}

/**
 * 监控事件接口
 */
export interface MonitoringEvents {
  'metric:recorded': (metric: string, value: number, labels?: Record<string, string>) => void;
  'alert:triggered': (alert: AlertEvent) => void;
  'alert:resolved': (alert: AlertEvent) => void;
  'health:check': (result: HealthCheckResult) => void;
  'performance:updated': (metrics: PerformanceMetrics) => void;
  'system:info': (info: SystemInfo) => void;
  'monitoring:error': (error: ServiceError) => void;
}

/**
 * 健康检查器接口
 */
export interface HealthChecker {
  name: string;
  check(): Promise<HealthCheckResult>;
}

/**
 * 数据库健康检查器
 */
export class DatabaseHealthChecker implements HealthChecker {
  name = 'database';
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // 这里应该实现实际的数据库连接检查
      // 为了简化，这里只是模拟
      await new Promise(resolve => setTimeout(resolve, 10));
      
      return {
        name: this.name,
        status: 'healthy',
        message: '数据库连接正常',
        duration: Date.now() - startTime,
        timestamp: new Date(),
        details: {
          connectionString: this.connectionString.replace(/\/\/.*@/, '//***@')
        }
      };
    } catch (error: unknown) {
        return {
          name: this.name,
          status: 'unhealthy',
          message: `数据库连接失败: ${error instanceof Error ? error.message : String(error)}`,
          duration: Date.now() - startTime,
          timestamp: new Date(),
          details: {
            error: error instanceof Error ? error.message : String(error)
          }
        };
      }
  }
}

/**
 * Redis健康检查器
 */
export class RedisHealthChecker implements HealthChecker {
  name = 'redis';
  private host: string;
  private port: number;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // 这里应该实现实际的Redis连接检查
      // 为了简化，这里只是模拟
      await new Promise(resolve => setTimeout(resolve, 5));
      
      return {
        name: this.name,
        status: 'healthy',
        message: 'Redis连接正常',
        duration: Date.now() - startTime,
        timestamp: new Date(),
        details: {
          host: this.host,
          port: this.port
        }
      };
    } catch (error: unknown) {
        return {
          name: this.name,
          status: 'unhealthy',
          message: `Redis连接失败: ${error instanceof Error ? error.message : String(error)}`,
          duration: Date.now() - startTime,
          timestamp: new Date(),
          details: {
            error: error instanceof Error ? error.message : String(error),
            host: this.host,
            port: this.port
          }
        };
      }
  }
}

/**
 * HTTP服务健康检查器
 */
export class HttpHealthChecker implements HealthChecker {
  name: string;
  private url: string;
  private timeout: number;

  constructor(name: string, url: string, timeout: number = 5000) {
    this.name = name;
    this.url = url;
    this.timeout = timeout;
  }

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(this.url, {
        signal: controller.signal,
        method: 'GET'
      });
      
      clearTimeout(timeoutId);
      
      const status = response.ok ? 'healthy' : 'degraded';
      const message = response.ok ? 'HTTP服务正常' : `HTTP服务响应异常: ${response.status}`;
      
      return {
        name: this.name,
        status,
        message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        details: {
          url: this.url,
          status: response.status,
          statusText: response.statusText
        }
      };
    } catch (error: unknown) {
        return {
          name: this.name,
          status: 'unhealthy',
          message: `HTTP服务检查失败: ${error instanceof Error ? error.message : String(error)}`,
          duration: Date.now() - startTime,
          timestamp: new Date(),
          details: {
            error: error instanceof Error ? error.message : String(error),
            url: this.url
          }
        };
      }
  }
}

/**
 * 监控服务类
 */
export class MonitoringService extends BaseService implements IService {
  private eventEmitter: EventEmitter<MonitoringEvents>;
  protected override metrics: Map<string, Metric>;
  private healthCheckers: Map<string, HealthChecker>;
  private alertRules: Map<string, AlertRule>;
  private activeAlerts: Map<string, AlertEvent>;
  private stats: MonitoringStats;
  private collectInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;
  private performanceMetrics: PerformanceMetrics;
  private requestTimes: number[] = [];
  private requestCount = 0;
  private errorCount = 0;

  constructor(config: MonitoringConfig) {
    super(config, 'MonitoringService', '1.0.0');
    
    this.eventEmitter = new EventEmitter();
    this.metrics = new Map();
    this.healthCheckers = new Map();
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    
    // 初始化统计信息
    this.stats = {
      totalMetrics: 0,
      activeAlerts: 0,
      healthChecks: {
        total: 0,
        healthy: 0,
        unhealthy: 0,
        degraded: 0
      },
      dataPoints: {
        total: 0,
        lastHour: 0,
        lastDay: 0
      },
      performance: {
        avgResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      uptime: 0,
      lastUpdate: new Date()
    };
    
    // 初始化性能指标
    this.performanceMetrics = {
      responseTime: {
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      },
      throughput: {
        requestsPerSecond: 0,
        requestsPerMinute: 0
      },
      errorRate: {
        rate: 0,
        count: 0,
        total: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      },
      cpu: {
        usage: 0,
        userTime: 0,
        systemTime: 0
      },
      gc: {
        collections: 0,
        duration: 0,
        freed: 0
      },
      eventLoop: {
        lag: 0,
        utilization: 0
      }
    };
    
    // 注册默认指标
    this.registerDefaultMetrics();
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 启动数据收集
    this.startDataCollection();
    
    // 启动健康检查
    this.startHealthChecks();
    
    // 启动告警检查
    this.startAlertChecks();
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    
    if (this.collectInterval) {
      clearInterval(this.collectInterval);
      this.collectInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }
    
    this.metrics.clear();
    this.healthCheckers.clear();
    this.alertRules.clear();
    this.activeAlerts.clear();
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<boolean> {
    try {
      // 检查基本功能
      this.recordMetric('health_check', 1);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 记录指标
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    try {
      let metric = this.metrics.get(name);
      
      if (!metric) {
        metric = {
          name,
          type: MetricType.GAUGE,
          description: `自动创建的指标: ${name}`,
          dataPoints: [],
          lastValue: value,
          totalValue: value,
          count: 1,
          min: value,
          max: value,
          avg: value
        };
        this.metrics.set(name, metric);
        this.stats.totalMetrics++;
      }
      
      // 添加数据点
      const dataPoint: MetricDataPoint = {
        timestamp: new Date(),
        value,
        labels
      };
      
      metric.dataPoints.push(dataPoint);
      metric.lastValue = value;
      metric.count = (metric.count || 0) + 1;
      
      // 更新统计信息
      if (metric.type === MetricType.COUNTER) {
        metric.totalValue = (metric.totalValue || 0) + value;
      } else {
        metric.totalValue = value;
      }
      
      metric.min = Math.min(metric.min || value, value);
      metric.max = Math.max(metric.max || value, value);
      metric.avg = metric.dataPoints.reduce((sum, dp) => sum + dp.value, 0) / metric.dataPoints.length;
      
      // 限制数据点数量
      if (metric.dataPoints.length > 1000) {
        metric.dataPoints.shift();
      }
      
      // 更新统计
      this.updateDataPointStats();
      
      // 发射事件
      this.eventEmitter.emit('metric:recorded', name, value, labels);
      this.emit(SERVICE_EVENTS.METRIC_RECORDED, { name, value, labels });
    } catch (error: unknown) {
      const err = this.handleUnknownError(error);
      const serviceError = new ServiceError({ message: '记录指标失败', code: 'METRIC_RECORD_ERROR', type: ServiceErrorType.DATA, serviceName: 'MonitoringService', operation: 'recordMetric', innerError: err });
      this.eventEmitter.emit('monitoring:error', serviceError);
    }
  }

  /**
   * 增加计数器
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    let metric = this.metrics.get(name);
    
    if (!metric) {
      metric = {
        name,
        type: MetricType.COUNTER,
        description: `计数器: ${name}`,
        dataPoints: [],
        totalValue: 0,
        count: 0
      };
      this.metrics.set(name, metric);
      this.stats.totalMetrics++;
    }
    
    this.recordMetric(name, value, labels);
  }

  /**
   * 设置仪表盘值
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    let metric = this.metrics.get(name);
    
    if (!metric) {
      metric = {
        name,
        type: MetricType.GAUGE,
        description: `仪表盘: ${name}`,
        dataPoints: [],
        lastValue: value,
        count: 0
      };
      this.metrics.set(name, metric);
      this.stats.totalMetrics++;
    }
    
    this.recordMetric(name, value, labels);
  }

  /**
   * 记录直方图
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    let metric = this.metrics.get(name);
    
    if (!metric) {
      metric = {
        name,
        type: MetricType.HISTOGRAM,
        description: `直方图: ${name}`,
        dataPoints: [],
        count: 0,
        percentiles: {}
      };
      this.metrics.set(name, metric);
      this.stats.totalMetrics++;
    }
    
    this.recordMetric(name, value, labels);
    
    // 计算百分位数
    this.calculatePercentiles(metric);
  }

  /**
   * 记录请求时间
   */
  recordRequestTime(duration: number, success: boolean = true): void {
    this.requestTimes.push(duration);
    this.requestCount++;
    
    if (!success) {
      this.errorCount++;
    }
    
    // 限制数组大小
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }
    
    // 记录指标
    this.recordHistogram('http_request_duration_ms', duration);
    this.incrementCounter('http_requests_total', 1, { status: success ? 'success' : 'error' });
    
    // 更新性能指标
    this.updatePerformanceMetrics();
  }

  /**
   * 获取指标
   */
  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 查询指标
   */
  async queryMetrics(params: MonitoringQueryParams = {}): Promise<Metric[]> {
    try {
      let results = Array.from(this.metrics.values());
      
      // 按指标名称过滤
      if (params.metrics && params.metrics.length > 0) {
        results = results.filter(metric => params.metrics!.includes(metric.name));
      }
      
      // 按时间范围过滤数据点
      if (params.startTime || params.endTime) {
        results = results.map(metric => ({
          ...metric,
          dataPoints: metric.dataPoints.filter(dp => {
            if (params.startTime && dp.timestamp < params.startTime) return false;
            if (params.endTime && dp.timestamp > params.endTime) return false;
            return true;
          })
        }));
      }
      
      // 按标签过滤
      if (params.labels) {
        results = results.map(metric => ({
          ...metric,
          dataPoints: metric.dataPoints.filter(dp => {
            if (!dp.labels) return false;
            return Object.entries(params.labels!).every(([key, value]) => dp.labels![key] === value);
          })
        }));
      }
      
      // 限制结果数量
      if (params.limit) {
        results = results.slice(0, params.limit);
      }
      
      return results;
    } catch (error: unknown) {
      const err = this.handleUnknownError(error);
      const serviceError = new ServiceError({ message: '查询指标失败', code: 'METRIC_QUERY_ERROR', type: ServiceErrorType.DATA, serviceName: 'MonitoringService', operation: 'queryMetrics', innerError: err });
      this.eventEmitter.emit('monitoring:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 添加健康检查器
   */
  addHealthChecker(checker: HealthChecker): void {
    this.healthCheckers.set(checker.name, checker);
    this.stats.healthChecks.total++;
  }

  /**
   * 移除健康检查器
   */
  removeHealthChecker(name: string): boolean {
    const removed = this.healthCheckers.delete(name);
    if (removed) {
      this.stats.healthChecks.total--;
    }
    return removed;
  }

  /**
   * 执行健康检查
   */
  async runHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    
    for (const checker of this.healthCheckers.values()) {
      try {
        const result = await checker.check();
        results.push(result);
        
        // 更新统计
        switch (result.status) {
          case 'healthy':
            this.stats.healthChecks.healthy++;
            break;
          case 'unhealthy':
            this.stats.healthChecks.unhealthy++;
            break;
          case 'degraded':
            this.stats.healthChecks.degraded++;
            break;
        }
        
        // 记录指标
        this.setGauge(`health_check_${checker.name}`, result.status === 'healthy' ? 1 : 0);
        this.recordHistogram(`health_check_duration_${checker.name}`, result.duration);
        
        // 发射事件
        this.eventEmitter.emit('health:check', result);
        this.emit(SERVICE_EVENTS.HEALTH_CHECK, result);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const result: HealthCheckResult = {
          name: checker.name,
          status: 'unhealthy',
          message: `健康检查失败: ${errorMessage}`,
          duration: 0,
          timestamp: new Date(),
          details: { error: errorMessage }
        };
        
        results.push(result);
        this.stats.healthChecks.unhealthy++;
        
        this.eventEmitter.emit('health:check', result);
      }
    }
    
    return results;
  }

  /**
   * 添加告警规则
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  /**
   * 移除告警规则
   */
  removeAlertRule(id: string): boolean {
    return this.alertRules.delete(id);
  }

  /**
   * 获取告警规则
   */
  getAlertRule(id: string): AlertRule | undefined {
    return this.alertRules.get(id);
  }

  /**
   * 获取所有告警规则
   */
  getAllAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * 获取系统信息
   */
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const systemInfo: SystemInfo = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: {
          total: memoryUsage.heapTotal + memoryUsage.external,
          used: memoryUsage.heapUsed,
          free: memoryUsage.heapTotal - memoryUsage.heapUsed,
          usage: memoryUsage.heapUsed / (memoryUsage.heapTotal + memoryUsage.external)
        },
        cpu: {
          cores: require('os').cpus().length,
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // 转换为秒
          loadAverage: require('os').loadavg()
        },
        uptime: process.uptime(),
        pid: process.pid,
        timestamp: new Date()
      };
      
      // 记录系统指标
      this.setGauge('system_memory_usage', systemInfo.memory.usage);
      this.setGauge('system_cpu_usage', systemInfo.cpu.usage);
      this.setGauge('system_uptime', systemInfo.uptime);
      
      // 发射事件
      this.eventEmitter.emit('system:info', systemInfo);
      
      return systemInfo;
    } catch (error: unknown) {
      const err = this.handleUnknownError(error);
      const serviceError = new ServiceError({ message: '获取系统信息失败', code: 'SYSTEM_INFO_ERROR', type: ServiceErrorType.DATA, serviceName: 'MonitoringService', operation: 'getSystemInfo', innerError: err });
      this.eventEmitter.emit('monitoring:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取性能指标
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return { ...this.performanceMetrics };
  }

  /**
   * 获取监控统计信息
   */
  async getStats(): Promise<MonitoringStats> {
    // 更新运行时间
    this.stats.uptime = (Date.now() - this.startTime.getTime()) / 1000;
    this.stats.lastUpdate = new Date();
    
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  async resetStats(): Promise<void> {
    this.stats = {
      totalMetrics: this.metrics.size,
      activeAlerts: this.activeAlerts.size,
      healthChecks: {
        total: this.healthCheckers.size,
        healthy: 0,
        unhealthy: 0,
        degraded: 0
      },
      dataPoints: {
        total: 0,
        lastHour: 0,
        lastDay: 0
      },
      performance: {
        avgResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      uptime: 0,
      lastUpdate: new Date()
    };
    
    this.requestTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * 监听监控事件
   */
  override on<T extends string | symbol>(event: T, fn: (...args: any[]) => void, context?: any): this {
    return super.on(event, fn, context);
  }

  /**
   * 监听监控事件（类型安全版本）
   */
  onMonitoringEvent<K extends keyof MonitoringEvents>(event: K, listener: MonitoringEvents[K]): void {
    this.eventEmitter.on(event, listener as any);
  }

  /**
   * 移除监控事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: any[]) => void) | undefined, context?: any, once?: boolean | undefined): this {
    return super.off(event, fn, context, once);
  }

  /**
   * 移除监控事件监听（类型安全版本）
   */
  offMonitoringEvent<K extends keyof MonitoringEvents>(event: K, listener: MonitoringEvents[K]): void {
    this.eventEmitter.off(event, listener as any);
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
   * 注册默认指标
   */
  private registerDefaultMetrics(): void {
    // HTTP请求指标
    this.metrics.set('http_requests_total', {
      name: 'http_requests_total',
      type: MetricType.COUNTER,
      description: 'HTTP请求总数',
      dataPoints: [],
      totalValue: 0,
      count: 0
    });
    
    this.metrics.set('http_request_duration_ms', {
      name: 'http_request_duration_ms',
      type: MetricType.HISTOGRAM,
      description: 'HTTP请求持续时间（毫秒）',
      dataPoints: [],
      count: 0,
      percentiles: {}
    });
    
    // 系统指标
    this.metrics.set('system_memory_usage', {
      name: 'system_memory_usage',
      type: MetricType.GAUGE,
      description: '系统内存使用率',
      dataPoints: [],
      lastValue: 0,
      count: 0
    });
    
    this.metrics.set('system_cpu_usage', {
      name: 'system_cpu_usage',
      type: MetricType.GAUGE,
      description: '系统CPU使用率',
      dataPoints: [],
      lastValue: 0,
      count: 0
    });
    
    this.stats.totalMetrics = this.metrics.size;
  }

  /**
   * 启动数据收集
   */
  private startDataCollection(): void {
    this.collectInterval = setInterval(async () => {
      try {
        // 收集系统信息
        await this.getSystemInfo();
        
        // 更新性能指标
        this.updatePerformanceMetrics();
        
        // 发射性能更新事件
        this.eventEmitter.emit('performance:updated', this.performanceMetrics);
      } catch (error: unknown) {
        const err = this.handleUnknownError(error);
        // 记录收集错误但不抛出
        console.warn('Data collection error:', err.message);
      }
    }, 30000); // 每30秒收集一次
  }

  /**
   * 启动健康检查
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.runHealthChecks();
      } catch (error: unknown) {
        const err = this.handleUnknownError(error);
        // 记录健康检查错误但不抛出
        console.warn('Health check error:', err.message);
      }
    }, 60000); // 每分钟检查一次
  }

  /**
   * 启动告警检查
   */
  private startAlertChecks(): void {
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts();
    }, 10000); // 每10秒检查一次
  }

  /**
   * 检查告警
   */
  private checkAlerts(): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;
      
      const metric = this.metrics.get(rule.metric);
      if (!metric || !metric.lastValue) continue;
      
      const value = metric.lastValue;
      const threshold = rule.condition.threshold;
      let triggered = false;
      
      switch (rule.condition.operator) {
        case '>':
          triggered = value > threshold;
          break;
        case '<':
          triggered = value < threshold;
          break;
        case '>=':
          triggered = value >= threshold;
          break;
        case '<=':
          triggered = value <= threshold;
          break;
        case '==':
          triggered = value === threshold;
          break;
        case '!=':
          triggered = value !== threshold;
          break;
      }
      
      if (triggered) {
        this.triggerAlert(rule, value);
      } else {
        this.resolveAlert(rule.id);
      }
    }
  }

  /**
   * 触发告警
   */
  private triggerAlert(rule: AlertRule, value: number): void {
    const existingAlert = this.activeAlerts.get(rule.id);
    
    if (!existingAlert) {
      const alert: AlertEvent = {
        id: this.generateId(),
        ruleId: rule.id,
        ruleName: rule.name,
        metric: rule.metric,
        value,
        threshold: rule.condition.threshold,
        severity: rule.severity,
        message: `${rule.name}: ${rule.metric} = ${value} ${rule.condition.operator} ${rule.condition.threshold}`,
        timestamp: new Date()
      };
      
      this.activeAlerts.set(rule.id, alert);
      this.stats.activeAlerts++;
      
      // 更新规则统计
      rule.lastTriggered = new Date();
      rule.triggerCount++;
      
      // 执行告警动作
      this.executeAlertActions(rule, alert);
      
      // 发射事件
      this.eventEmitter.emit('alert:triggered', alert);
      this.emit(SERVICE_EVENTS.ALERT_TRIGGERED, alert);
    }
  }

  /**
   * 解决告警
   */
  private resolveAlert(ruleId: string): void {
    const alert = this.activeAlerts.get(ruleId);
    
    if (alert) {
      alert.resolved = new Date();
      alert.duration = alert.resolved.getTime() - alert.timestamp.getTime();
      
      this.activeAlerts.delete(ruleId);
      this.stats.activeAlerts--;
      
      // 发射事件
      this.eventEmitter.emit('alert:resolved', alert);
      this.emit(SERVICE_EVENTS.ALERT_RESOLVED, alert);
    }
  }

  /**
   * 执行告警动作
   */
  private async executeAlertActions(rule: AlertRule, alert: AlertEvent): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'log':
            console.error(`[ALERT] ${alert.message}`);
            break;
          case 'webhook':
            if (action.config.url) {
              await fetch(action.config.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alert)
              });
            }
            break;
          case 'email':
            // 这里应该实现邮件发送逻辑
            break;
          case 'notification':
            // 这里应该实现通知发送逻辑
            break;
        }
      } catch (error: unknown) {
        const err = this.handleUnknownError(error);
        // 记录动作执行错误但不抛出
        console.warn('Alert action execution error:', err.message);
      }
    }
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(): void {
    if (this.requestTimes.length === 0) return;
    
    const sortedTimes = [...this.requestTimes].sort((a, b) => a - b);
    
    this.performanceMetrics.responseTime = {
      avg: this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length,
      min: Math.min(...this.requestTimes),
      max: Math.max(...this.requestTimes),
      p50: this.getPercentile(sortedTimes, 0.5),
      p95: this.getPercentile(sortedTimes, 0.95),
      p99: this.getPercentile(sortedTimes, 0.99)
    };
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestTimes.length; // 简化计算
    
    this.performanceMetrics.throughput = {
      requestsPerSecond: recentRequests / 60,
      requestsPerMinute: recentRequests
    };
    
    this.performanceMetrics.errorRate = {
      rate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      count: this.errorCount,
      total: this.requestCount
    };
    
    // 更新统计中的性能数据
    this.stats.performance.avgResponseTime = this.performanceMetrics.responseTime.avg;
    this.stats.performance.requestsPerSecond = this.performanceMetrics.throughput.requestsPerSecond;
    this.stats.performance.errorRate = this.performanceMetrics.errorRate.rate;
  }

  /**
   * 计算百分位数
   */
  private calculatePercentiles(metric: Metric): void {
    if (metric.dataPoints.length === 0) return;
    
    const values = metric.dataPoints.map(dp => dp.value).sort((a, b) => a - b);
    
    metric.percentiles = {
      p50: this.getPercentile(values, 0.5),
      p90: this.getPercentile(values, 0.9),
      p95: this.getPercentile(values, 0.95),
      p99: this.getPercentile(values, 0.99)
    };
  }

  /**
   * 获取百分位数值
   */
  private getPercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = Math.ceil(sortedValues.length * percentile) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * 更新数据点统计
   */
  private updateDataPointStats(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let totalDataPoints = 0;
    let lastHourDataPoints = 0;
    let lastDayDataPoints = 0;
    
    for (const metric of this.metrics.values()) {
      totalDataPoints += metric.dataPoints.length;
      lastHourDataPoints += metric.dataPoints.filter(dp => dp.timestamp >= oneHourAgo).length;
      lastDayDataPoints += metric.dataPoints.filter(dp => dp.timestamp >= oneDayAgo).length;
    }
    
    this.stats.dataPoints = {
      total: totalDataPoints,
      lastHour: lastHourDataPoints,
      lastDay: lastDayDataPoints
    };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 全局监控服务实例
let monitoringServiceInstance: MonitoringService | null = null;

/**
 * 创建监控服务实例
 */
export function createMonitoringService(config: MonitoringConfig): MonitoringService {
  return new MonitoringService(config);
}

/**
 * 获取监控服务实例
 */
export function getMonitoringService(): MonitoringService | null {
  return monitoringServiceInstance;
}

/**
 * 初始化监控服务
 */
export async function initMonitoringService(config: MonitoringConfig): Promise<MonitoringService> {
  if (monitoringServiceInstance) {
    await monitoringServiceInstance.destroy();
  }
  
  monitoringServiceInstance = new MonitoringService(config);
  await monitoringServiceInstance.initialize();
  
  return monitoringServiceInstance;
}

/**
 * 销毁监控服务
 */
export async function destroyMonitoringService(): Promise<void> {
  if (monitoringServiceInstance) {
    await monitoringServiceInstance.destroy();
    monitoringServiceInstance = null;
  }
}



// 导出默认实例
export default MonitoringService;