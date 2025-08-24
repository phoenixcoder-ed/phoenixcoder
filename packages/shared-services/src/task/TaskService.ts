import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ValidationError, NotFoundError, AuthorizationError, ServiceErrorType } from '../types/ServiceError';
import { ApiConfig } from '../types/ServiceConfig';

import {
  Task,
  TaskCategory,
  TaskDifficulty,
  TaskStatus,
  PaginatedResponse
} from '@phoenixcoder/shared-types';
import { ApiClient, buildURL } from '@phoenixcoder/shared-utils';
import { EventEmitter } from 'eventemitter3';

/**
 * 任务查询参数
 */
export interface TaskQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus | TaskStatus[];
  difficulty?: TaskDifficulty | TaskDifficulty[];
  category?: TaskCategory | TaskCategory[];
  assigneeId?: string;
  creatorId?: string;
  skills?: string[];
  tags?: string[];
  minReward?: number;
  maxReward?: number;
  deadline?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeExpired?: boolean;
  [key: string]: unknown;
}

/**
 * 任务创建数据
 */
export interface TaskCreateData {
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  skills: string[];
  tags?: string[];
  reward: number;
  deadline?: Date;
  requirements?: string;
  deliverables?: string;
  attachments?: string[];
  isPublic?: boolean;
  maxAssignees?: number;
}

/**
 * 任务更新数据
 */
export interface TaskUpdateData {
  title?: string;
  description?: string;
  difficulty?: TaskDifficulty;
  skills?: string[];
  tags?: string[];
  reward?: number;
  deadline?: Date;
  requirements?: string;
  deliverables?: string;
  attachments?: string[];
  isPublic?: boolean;
  maxAssignees?: number;
}

/**
 * 任务分配数据
 */
export interface TaskAssignmentData {
  assigneeId: string;
  message?: string;
  estimatedHours?: number;
}

/**
 * 任务提交数据
 */
export interface TaskSubmissionData {
  description: string;
  attachments?: string[];
  deliverables: string[];
  notes?: string;
}

/**
 * 任务评价数据
 */
export interface TaskReviewData {
  rating: number; // 1-5
  comment?: string;
  feedback?: string;
  approved: boolean;
}

/**
 * 任务统计信息
 */
export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byDifficulty: Record<TaskDifficulty, number>;
  byCategory: Record<TaskCategory, number>;
  totalReward: number;
  averageReward: number;
  completionRate: number;
  averageCompletionTime: number;
}

/**
 * 任务事件接口
 */
export interface TaskEvents {
  'task:created': (task: Task) => void;
  'task:updated': (task: Task) => void;
  'task:deleted': (taskId: string) => void;
  'task:assigned': (task: Task, assigneeId: string) => void;
  'task:unassigned': (task: Task, assigneeId: string) => void;
  'task:submitted': (task: Task) => void;
  'task:reviewed': (task: Task, reviewData: TaskReviewData) => void;
  'task:status-changed': (task: Task, oldStatus: TaskStatus, newStatus: TaskStatus) => void;
  'task:search-completed': (result: PaginatedResponse<Task>) => void;
  'task:stats-fetched': (stats: TaskStats) => void;
  'task:my-tasks-fetched': (tasks: Task[]) => void;
  'task:recommended-tasks-fetched': (tasks: Task[]) => void;
  'task:batch-fetched': (tasks: Task[]) => void;
  'task:deadline-approaching': (task: Task, hoursLeft: number) => void;
  'task:overdue': (task: Task) => void;
  'task:error': (error: ServiceError) => void;
}

/**
 * 任务服务类
 */
export class TaskService extends BaseService implements IService {
  private apiClient: ApiClient;
  private eventEmitter: EventEmitter<TaskEvents>;
  private taskCache: Map<string, { task: Task; timestamp: number }>;
  private readonly CACHE_TTL = 300000; // 5分钟缓存
  private deadlineCheckInterval?: NodeJS.Timeout;
  private baseURL: string;

  constructor(config: ApiConfig) {
    super(config, 'TaskService', '1.0.0');
    
    this.baseURL = config.baseURL;
    this.apiClient = new ApiClient(config.baseURL, {
      'Content-Type': 'application/json'
    });

    this.eventEmitter = new EventEmitter();
    this.taskCache = new Map();
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 启动缓存清理
    this.startCacheCleanup();
    
    // 启动截止日期检查
    this.startDeadlineCheck();
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    this.taskCache.clear();
    
    if (this.deadlineCheckInterval) {
      clearInterval(this.deadlineCheckInterval);
    }
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiClient.get('/tasks/health');
      return { success: response.success, status: 'healthy' };
    } catch (error: unknown) {
      return { success: false, status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取任务列表
   */
  async getTasks(params: TaskQueryParams = {}): Promise<PaginatedResponse<Task>> {
    try {
      const url = buildURL(this.baseURL, '/tasks', params);
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<Task>;
      
      // 缓存任务数据
      result.data.forEach(task => {
        this.setTaskCache(task.id, task);
      });
      
      this.eventEmitter.emit('task:search-completed', result);
      return result;
    } catch (error: unknown) {
      const serviceError = new ServiceError({
        message: '获取任务列表失败',
        code: 'TASK_LIST_FETCH_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'getTasks'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 根据ID获取任务
   */
  async getTaskById(taskId: string, useCache: boolean = true): Promise<Task> {
    // 检查缓存
    if (useCache) {
      const cached = this.getTaskFromCache(taskId);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.apiClient.get(`/tasks/${taskId}`);
      const task = response.data as Task;
      
      // 更新缓存
      this.setTaskCache(taskId, task);
      
      this.eventEmitter.emit('task:created', task);
      return task;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        throw new NotFoundError(`任务 ${taskId} 不存在`, 'task', 'TaskService');
      }
      const serviceError = new ServiceError({
        message: '获取任务失败',
        code: 'TASK_FETCH_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'getTaskById'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 创建任务
   */
  async createTask(taskData: TaskCreateData): Promise<Task> {
    try {
      const response = await this.apiClient.post('/tasks', taskData);
      const task = response.data as Task;
      
      // 更新缓存
      this.setTaskCache(task.id, task);
      
      this.eventEmitter.emit('task:created', task);
      
      return task;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 400) {
        throw new ValidationError('任务数据验证失败', [{
          field: 'taskData',
          message: '任务数据格式不正确',
          code: 'INVALID_TASK_DATA'
        }], 'TaskService');
      }
      const serviceError = new ServiceError({
        message: '创建任务失败',
        code: 'TASK_CREATE_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'createTask'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新任务
   */
  async updateTask(taskId: string, updateData: TaskUpdateData): Promise<Task> {
    try {
      const response = await this.apiClient.put(`/tasks/${taskId}`, updateData);
      const task = response.data as Task;
      
      // 更新缓存
      this.setTaskCache(taskId, task);
      
      this.eventEmitter.emit('task:updated', task);
      
      return task;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        throw new NotFoundError(`任务 ${taskId} 不存在`, 'task', 'TaskService');
      }
      if (err.response?.status === 400) {
        throw new ValidationError('任务数据验证失败', [{
          field: 'updateData',
          message: '任务更新数据格式不正确',
          code: 'INVALID_UPDATE_DATA'
        }], 'TaskService');
      }
      if (err.response?.status === 403) {
        throw new AuthorizationError('无权限更新此任务', err, 'TaskService');
      }
      const serviceError = new ServiceError({
        message: '更新任务失败',
        code: 'TASK_UPDATE_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'updateTask'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/tasks/${taskId}`);
      
      // 清除缓存
      this.taskCache.delete(taskId);
      
      this.eventEmitter.emit('task:deleted', taskId);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        throw new NotFoundError(`任务 ${taskId} 不存在`, 'task', 'TaskService');
      }
      if (err.response?.status === 403) {
        throw new AuthorizationError('无权限删除此任务', err, 'TaskService');
      }
      const serviceError = new ServiceError({
        message: '删除任务失败',
        code: 'TASK_DELETE_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'deleteTask'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 分配任务
   */
  async assignTask(taskId: string, assignmentData: TaskAssignmentData): Promise<Task> {
    try {
      const response = await this.apiClient.post(`/tasks/${taskId}/assign`, assignmentData);
      const task = response.data as Task;
      
      // 更新缓存
      this.setTaskCache(taskId, task);
      
      this.eventEmitter.emit('task:assigned', task, assignmentData.assigneeId);
      
      return task;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        throw new NotFoundError(`任务 ${taskId} 不存在`, 'task', 'TaskService');
      }
      if (err.response?.status === 400) {
        throw new ValidationError('任务分配数据验证失败', [{
          field: 'assignmentData',
          message: '任务分配数据格式不正确',
          code: 'INVALID_ASSIGNMENT_DATA'
        }], 'TaskService');
      }
      if (err.response?.status === 403) {
        throw new AuthorizationError('无权限分配此任务', err, 'TaskService');
      }
      const serviceError = new ServiceError({
        message: '分配任务失败',
        code: 'TASK_ASSIGN_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'assignTask'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 取消分配任务
   */
  async unassignTask(taskId: string, assigneeId: string): Promise<Task> {
    try {
      const response = await this.apiClient.delete(`/tasks/${taskId}/assign/${assigneeId}`);
      const task = response.data as Task;
      
      // 更新缓存
      this.setTaskCache(taskId, task);
      
      // 发射取消分配事件
      this.eventEmitter.emit('task:unassigned', task, assigneeId);
      
      return task;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        throw new NotFoundError(`任务 ${taskId} 或分配关系不存在`, 'taskOrAssignment', 'TaskService');
      }
      if (err.response?.status === 403) {
        throw new AuthorizationError('无权限取消分配此任务', err, 'TaskService');
      }
      const serviceError = new ServiceError({
        message: '取消分配任务失败',
        code: 'TASK_UNASSIGN_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'unassignTask'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 提交任务
   */
  async submitTask(taskId: string, submissionData: TaskSubmissionData): Promise<Task> {
    try {
      const response = await this.apiClient.post(`/tasks/${taskId}/submit`, submissionData);
      const task = response.data as Task;
      
      // 更新缓存
      this.setTaskCache(taskId, task);
      
      this.eventEmitter.emit('task:submitted', task);
      
      return task;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        throw new NotFoundError(`任务 ${taskId} 不存在`, 'task', 'TaskService');
      }
      if (err.response?.status === 400) {
        throw new ValidationError('任务提交数据验证失败', [{
          field: 'submissionData',
          message: '任务提交数据格式不正确',
          code: 'INVALID_SUBMISSION_DATA'
        }], 'TaskService');
      }
      if (err.response?.status === 403) {
        throw new AuthorizationError('无权限提交此任务', err, 'TaskService');
      }
      const serviceError = new ServiceError({
        message: '提交任务失败',
        code: 'TASK_SUBMIT_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'submitTask'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 审核任务
   */
  async reviewTask(taskId: string, reviewData: TaskReviewData): Promise<Task> {
    try {
      const response = await this.apiClient.post(`/tasks/${taskId}/review`, reviewData);
      const task = response.data as Task;
      
      // 更新缓存
      this.setTaskCache(taskId, task);
      
      this.eventEmitter.emit('task:reviewed', task, reviewData);
      
      return task;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        throw new NotFoundError(`任务 ${taskId} 不存在`, 'task', 'TaskService');
      }
      if (err.response?.status === 400) {
        throw new ValidationError('任务审核数据验证失败', [{
          field: 'reviewData',
          message: '任务审核数据格式不正确',
          code: 'INVALID_REVIEW_DATA'
        }], 'TaskService');
      }
      if (err.response?.status === 403) {
        throw new AuthorizationError('无权限审核此任务', err, 'TaskService');
      }
      const serviceError = new ServiceError({
        message: '审核任务失败',
        code: 'TASK_REVIEW_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'reviewTask'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId: string, status: TaskStatus, reason?: string): Promise<Task> {
    try {
      const oldTask = await this.getTaskById(taskId);
      const oldStatus = oldTask.status;
      
      const response = await this.apiClient.patch(`/tasks/${taskId}/status`, { status, reason });
      const task = response.data as Task;
      
      // 更新缓存
      this.setTaskCache(taskId, task);
      
      this.eventEmitter.emit('task:status-changed', task, oldStatus, status);
      
      return task;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        throw new NotFoundError(`任务 ${taskId} 不存在`, 'task', 'TaskService');
      }
      if (err.response?.status === 400) {
        throw new ValidationError('任务状态更新数据验证失败', [{
          field: 'status',
          message: '任务状态数据格式不正确',
          code: 'INVALID_STATUS_DATA'
        }], 'TaskService');
      }
      if (err.response?.status === 403) {
        throw new AuthorizationError('无权限更新此任务状态', err, 'TaskService');
      }
      const serviceError = new ServiceError({
        message: '更新任务状态失败',
        code: 'TASK_STATUS_UPDATE_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'updateTaskStatus'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 搜索任务
   */
  async searchTasks(query: string, filters: Partial<TaskQueryParams> = {}): Promise<PaginatedResponse<Task>> {
    try {
      const params = { ...filters, search: query };
      const url = buildURL(this.baseURL, '/tasks/search', params);
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<Task>;
      
      // 缓存搜索结果中的任务
      result.data.forEach(task => {
        this.setTaskCache(task.id, task);
      });
      
      this.eventEmitter.emit('task:search-completed', result);
      return result;
    } catch (error: unknown) {
      const serviceError = new ServiceError({
        message: '搜索任务失败',
        code: 'TASK_SEARCH_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'searchTasks'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(filters: Partial<TaskQueryParams> = {}): Promise<TaskStats> {
    try {
      const response = await this.apiClient.get(buildURL(this.baseURL, '/tasks/stats', filters));
      const stats = response.data as TaskStats;
      
      this.eventEmitter.emit('task:stats-fetched', stats);
      return stats;
    } catch (error: unknown) {
      const serviceError = new ServiceError({
        message: '获取任务统计信息失败',
        code: 'TASK_STATS_FETCH_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'getTaskStats'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取我的任务
   */
  async getMyTasks(params: Partial<TaskQueryParams> = {}): Promise<PaginatedResponse<Task>> {
    try {
      const response = await this.apiClient.get(buildURL(this.baseURL, '/tasks/my', params));
      const result = response.data as PaginatedResponse<Task>;
      
      // 缓存任务数据
      result.data.forEach(task => {
        this.setTaskCache(task.id, task);
      });
      
      this.eventEmitter.emit('task:my-tasks-fetched', result.data);
      return result;
    } catch (error: unknown) {
      const serviceError = new ServiceError({
        message: '获取我的任务失败',
        code: 'MY_TASKS_FETCH_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'getMyTasks'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取推荐任务
   */
  async getRecommendedTasks(params: Partial<TaskQueryParams> = {}): Promise<PaginatedResponse<Task>> {
    try {
      const response = await this.apiClient.get(buildURL(this.baseURL, '/tasks/recommended', params));
      const result = response.data as PaginatedResponse<Task>;
      
      // 缓存任务数据
      result.data.forEach(task => {
        this.setTaskCache(task.id, task);
      });
      
      this.eventEmitter.emit('task:recommended-tasks-fetched', result.data);
      return result;
    } catch (error: unknown) {
      const serviceError = new ServiceError({
        message: '获取推荐任务失败',
        code: 'RECOMMENDED_TASKS_FETCH_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'getRecommendedTasks'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 批量获取任务
   */
  async getTasksByIds(taskIds: string[]): Promise<Task[]> {
    try {
      const response = await this.apiClient.post('/tasks/batch', { taskIds });
      const tasks = response.data as Task[];
      
      // 更新缓存
      tasks.forEach(task => {
        this.setTaskCache(task.id, task);
      });
      
      this.eventEmitter.emit('task:batch-fetched', tasks);
      return tasks;
    } catch (error: unknown) {
      const serviceError = new ServiceError({
        message: '批量获取任务失败',
        code: 'BATCH_TASKS_FETCH_FAILED',
        type: ServiceErrorType.BUSINESS_LOGIC,
        serviceName: 'TaskService',
        operation: 'getTasksByIds'
      });
      this.eventEmitter.emit('task:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 清除任务缓存
   */
  clearTaskCache(taskId?: string): void {
    if (taskId) {
      this.taskCache.delete(taskId);
    } else {
      this.taskCache.clear();
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; tasks: string[] } {
    return {
      size: this.taskCache.size,
      tasks: Array.from(this.taskCache.keys())
    };
  }

  /**
   * 监听任务事件
   */
  override on<T extends string | symbol>(event: T, fn?: ((...args: unknown[]) => void) | undefined, context?: unknown): this {
    if (fn) {
      super.on(event, fn, context);
    }
    return this;
  }

  /**
   * 移除任务事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: unknown[]) => void) | undefined, context?: unknown): this {
    if (fn) {
      super.off(event, fn, context);
    }
    return this;
  }

  /**
   * 监听任务事件（类型安全版本）
   */
  onTaskEvent<K extends keyof TaskEvents>(event: K, listener: TaskEvents[K]): void {
    this.eventEmitter.on(event, listener as (...args: unknown[]) => void);
  }

  /**
   * 移除任务事件监听（类型安全版本）
   */
  offTaskEvent<K extends keyof TaskEvents>(event: K, listener: TaskEvents[K]): void {
    super.off(event, listener as (...args: unknown[]) => void);
  }

  /**
   * 从缓存获取任务
   */
  private getTaskFromCache(taskId: string): Task | null {
    const cached = this.taskCache.get(taskId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.task;
    }
    if (cached) {
      this.taskCache.delete(taskId);
    }
    return null;
  }

  /**
   * 设置任务缓存
   */
  private setTaskCache(taskId: string, task: Task): void {
    this.taskCache.set(taskId, {
      task,
      timestamp: Date.now()
    });
  }

  /**
   * 启动缓存清理
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [taskId, cached] of this.taskCache.entries()) {
        if (now - cached.timestamp >= this.CACHE_TTL) {
          this.taskCache.delete(taskId);
        }
      }
    }, 60000); // 每分钟清理一次
  }

  /**
   * 启动截止日期检查
   */
  private startDeadlineCheck(): void {
    this.deadlineCheckInterval = setInterval(async () => {
      try {
        // 检查即将到期的任务
        const response = await this.apiClient.get('/tasks/deadline-check');
        const { approaching, overdue } = response.data as { approaching: Array<{ task: Task; hoursLeft: number }>; overdue: Task[] };
        
        // 发出即将到期事件
        approaching.forEach((item: { task: Task; hoursLeft: number }) => {
          this.eventEmitter.emit('task:deadline-approaching', item.task, item.hoursLeft);
        });
        
        // 发出已过期事件
        overdue.forEach((task: Task) => {
          this.eventEmitter.emit('task:overdue', task);
        });
      } catch (error: unknown) {
        // 静默处理错误，避免影响主要功能
        // eslint-disable-next-line no-console
        console.warn('Deadline check failed:', error);
      }
    }, 3600000); // 每小时检查一次
  }
}

/**
 * 创建任务服务实例
 */
export function createTaskService(config: ApiConfig): TaskService {
  return new TaskService(config);
}

/**
 * 默认任务服务实例
 */
let defaultTaskService: TaskService | null = null;

/**
 * 获取默认任务服务实例
 */
export function getTaskService(): TaskService {
  if (!defaultTaskService) {
    throw new Error('Task service not initialized. Call initTaskService first.');
  }
  return defaultTaskService;
}

/**
 * 初始化默认任务服务
 */
export function initTaskService(config: ApiConfig): TaskService {
  defaultTaskService = new TaskService(config);
  return defaultTaskService;
}

/**
 * 销毁默认任务服务
 */
export async function destroyTaskService(): Promise<void> {
  if (defaultTaskService) {
    await defaultTaskService.destroy();
    defaultTaskService = null;
  }
}