import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ValidationError, ServiceErrorType } from '../types/ServiceError';
import { WorkflowServiceConfig } from '../types/ServiceConfig';
import { SERVICE_EVENTS } from '../types/ServiceConstants';
import { EventEmitter } from 'eventemitter3';

/**
 * 工作流节点类型
 */
export type WorkflowNodeType = 
  | 'start' 
  | 'end' 
  | 'task' 
  | 'decision' 
  | 'parallel' 
  | 'merge' 
  | 'delay' 
  | 'webhook' 
  | 'script' 
  | 'approval' 
  | 'notification' 
  | 'condition';

/**
 * 工作流节点状态
 */
export type WorkflowNodeStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'skipped' 
  | 'cancelled' 
  | 'waiting';

/**
 * 工作流执行状态
 */
export type WorkflowExecutionStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'paused';

/**
 * 工作流节点配置
 */
export interface WorkflowNodeConfig {
  timeout?: number; // 超时时间（毫秒）
  retryCount?: number; // 重试次数
  retryDelay?: number; // 重试延迟（毫秒）
  condition?: string; // 条件表达式
  script?: string; // 脚本代码
  webhookUrl?: string; // Webhook URL
  approvers?: string[]; // 审批人列表
  notificationTemplate?: string; // 通知模板
  delayDuration?: number; // 延迟时间（毫秒）
  parallelBranches?: string[]; // 并行分支
  mergeStrategy?: 'all' | 'any' | 'first'; // 合并策略
  variables?: Record<string, any>; // 节点变量
  metadata?: Record<string, any>; // 元数据
}

/**
 * 工作流节点
 */
export interface WorkflowNode {
  id: string;
  name: string;
  type: WorkflowNodeType;
  description?: string;
  config: WorkflowNodeConfig;
  inputs: string[]; // 输入连接
  outputs: string[]; // 输出连接
  position: { x: number; y: number }; // 节点位置
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 工作流连接
 */
export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string; // 连接条件
  label?: string; // 连接标签
  metadata?: Record<string, any>;
}

/**
 * 工作流定义
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables: Record<string, any>; // 工作流变量
  triggers: WorkflowTrigger[]; // 触发器
  settings: WorkflowSettings; // 工作流设置
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  metadata?: Record<string, any>;
}

/**
 * 工作流触发器
 */
export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  config: {
    schedule?: string; // Cron 表达式
    webhookUrl?: string;
    eventType?: string;
    eventFilter?: Record<string, any>;
  };
  isActive: boolean;
}

/**
 * 工作流设置
 */
export interface WorkflowSettings {
  maxConcurrentExecutions: number;
  executionTimeout: number; // 执行超时时间（毫秒）
  retryPolicy: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
  };
  errorHandling: {
    onError: 'stop' | 'continue' | 'retry';
    notifyOnError: boolean;
    errorNotificationTemplate?: string;
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    includeVariables: boolean;
  };
}

/**
 * 工作流执行实例
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: string;
  status: WorkflowExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // 执行时长（毫秒）
  triggeredBy: string; // 触发方式
  triggerData?: Record<string, any>; // 触发数据
  variables: Record<string, any>; // 执行变量
  nodeExecutions: WorkflowNodeExecution[]; // 节点执行记录
  error?: string; // 错误信息
  result?: any; // 执行结果
  metadata?: Record<string, any>;
}

/**
 * 工作流节点执行记录
 */
export interface WorkflowNodeExecution {
  id: string;
  nodeId: string;
  executionId: string;
  status: WorkflowNodeStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  attempts: number;
  input?: any; // 输入数据
  output?: any; // 输出数据
  error?: string; // 错误信息
  logs: WorkflowExecutionLog[]; // 执行日志
  metadata?: Record<string, any>;
}

/**
 * 工作流执行日志
 */
export interface WorkflowExecutionLog {
  id: string;
  executionId: string;
  nodeId?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  data?: any;
}

/**
 * 工作流创建数据
 */
export interface WorkflowCreateData {
  name: string;
  description?: string;
  nodes: Omit<WorkflowNode, 'id' | 'createdAt' | 'updatedAt'>[];
  connections: Omit<WorkflowConnection, 'id'>[];
  variables?: Record<string, any>;
  triggers?: Omit<WorkflowTrigger, 'id'>[];
  settings?: Partial<WorkflowSettings>;
  createdBy?: string;
  metadata?: Record<string, any>;
}

/**
 * 工作流更新数据
 */
export interface WorkflowUpdateData {
  name?: string;
  description?: string;
  nodes?: Omit<WorkflowNode, 'id' | 'createdAt' | 'updatedAt'>[];
  connections?: Omit<WorkflowConnection, 'id'>[];
  variables?: Record<string, any>;
  triggers?: Omit<WorkflowTrigger, 'id'>[];
  settings?: Partial<WorkflowSettings>;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 工作流查询参数
 */
export interface WorkflowQueryParams {
  name?: string;
  isActive?: boolean;
  createdBy?: string;
  hasNodes?: WorkflowNodeType[];
  hasTriggers?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 工作流执行查询参数
 */
export interface WorkflowExecutionQueryParams {
  workflowId?: string;
  status?: WorkflowExecutionStatus;
  triggeredBy?: string;
  startedAfter?: Date;
  startedBefore?: Date;
  completedAfter?: Date;
  completedBefore?: Date;
  durationMin?: number;
  durationMax?: number;
  sortBy?: 'startedAt' | 'completedAt' | 'duration';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 工作流统计信息
 */
export interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  runningExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  executionsByStatus: Record<WorkflowExecutionStatus, number>;
  executionsByWorkflow: Record<string, number>;
  executionsByDay: Record<string, number>;
  topFailureReasons: { reason: string; count: number }[];
  nodeTypeUsage: Record<WorkflowNodeType, number>;
  triggerTypeUsage: Record<string, number>;
}

/**
 * 工作流事件接口
 */
export interface WorkflowEvents {
  'workflow:created': (workflow: WorkflowDefinition) => void;
  'workflow:updated': (workflow: WorkflowDefinition) => void;
  'workflow:deleted': (workflowId: string) => void;
  'workflow:activated': (workflowId: string) => void;
  'workflow:deactivated': (workflowId: string) => void;
  'execution:started': (execution: WorkflowExecution) => void;
  'execution:completed': (execution: WorkflowExecution) => void;
  'execution:failed': (execution: WorkflowExecution, error: Error) => void;
  'execution:cancelled': (execution: WorkflowExecution) => void;
  'execution:paused': (execution: WorkflowExecution) => void;
  'execution:resumed': (execution: WorkflowExecution) => void;
  'node:started': (nodeExecution: WorkflowNodeExecution) => void;
  'node:completed': (nodeExecution: WorkflowNodeExecution) => void;
  'node:failed': (nodeExecution: WorkflowNodeExecution, error: Error) => void;
  'node:skipped': (nodeExecution: WorkflowNodeExecution) => void;
  'node:retry': (nodeExecution: WorkflowNodeExecution, attempt: number) => void;
  'trigger:fired': (workflowId: string, triggerId: string, data: any) => void;
  'workflow:error': (error: ServiceError) => void;
}

/**
 * 工作流服务类
 */
export class WorkflowService extends BaseService implements IService {
  private eventEmitter: EventEmitter<WorkflowEvents>;
  private workflows: Map<string, WorkflowDefinition>;
  private executions: Map<string, WorkflowExecution>;
  private nodeExecutions: Map<string, WorkflowNodeExecution>;
  private executionLogs: Map<string, WorkflowExecutionLog[]>;
  private stats: WorkflowStats;
  private executionQueue: string[];
  private isProcessing: boolean;
  private processingInterval?: NodeJS.Timeout;
  private maxConcurrentExecutions: number;

  constructor(config: WorkflowServiceConfig) {
    super(config, 'WorkflowService', '1.0.0');
    
    this.eventEmitter = new EventEmitter();
    this.workflows = new Map();
    this.executions = new Map();
    this.nodeExecutions = new Map();
    this.executionLogs = new Map();
    this.executionQueue = [];
    this.isProcessing = false;
    this.maxConcurrentExecutions = config.maxConcurrentExecutions || 10;
    
    // 初始化统计信息
    this.stats = {
      totalWorkflows: 0,
      activeWorkflows: 0,
      totalExecutions: 0,
      runningExecutions: 0,
      completedExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      successRate: 0,
      executionsByStatus: {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        paused: 0
      },
      executionsByWorkflow: {},
      executionsByDay: {},
      topFailureReasons: [],
      nodeTypeUsage: {
        start: 0,
        end: 0,
        task: 0,
        decision: 0,
        parallel: 0,
        merge: 0,
        delay: 0,
        webhook: 0,
        script: 0,
        approval: 0,
        notification: 0,
        condition: 0
      },
      triggerTypeUsage: {}
    };
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 启动执行队列处理
    this.startExecutionProcessing();
    
    // 更新统计信息
    await this.updateStats();
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    // 停止执行队列处理
    this.stopExecutionProcessing();
    
    // 取消所有运行中的执行
    const runningExecutions = Array.from(this.executions.values())
      .filter(execution => execution.status === 'running');
    
    for (const execution of runningExecutions) {
      await this.cancelExecution(execution.id);
    }
    
    // 清理事件监听器
    this.eventEmitter.removeAllListeners();
    
    // 清理数据
    this.workflows.clear();
    this.executions.clear();
    this.nodeExecutions.clear();
    this.executionLogs.clear();
    this.executionQueue.length = 0;
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<boolean> {
    return this.isProcessing;
  }

  /**
   * 创建工作流
   */
  async createWorkflow(data: WorkflowCreateData): Promise<WorkflowDefinition> {
    try {
      // 验证工作流数据
      this.validateWorkflowData(data);
      
      // 创建工作流
      const workflow: WorkflowDefinition = {
        id: this.generateId(),
        name: data.name,
        description: data.description,
        version: '1.0.0',
        nodes: data.nodes.map(node => ({
          ...node,
          id: this.generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        connections: data.connections.map(conn => ({
          ...conn,
          id: this.generateId()
        })),
        variables: data.variables || {},
        triggers: (data.triggers || []).map(trigger => ({
          ...trigger,
          id: this.generateId()
        })),
        settings: {
          maxConcurrentExecutions: 5,
          executionTimeout: 3600000, // 1小时
          retryPolicy: {
            enabled: true,
            maxRetries: 3,
            retryDelay: 60000 // 1分钟
          },
          errorHandling: {
            onError: 'stop',
            notifyOnError: true
          },
          logging: {
            enabled: true,
            level: 'info',
            includeVariables: false
          },
          ...data.settings
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: data.createdBy,
        metadata: data.metadata
      };
      
      // 保存工作流
      this.workflows.set(workflow.id, workflow);
      
      // 发射事件
      this.eventEmitter.emit('workflow:created', workflow);
      this.emit(SERVICE_EVENTS.WORKFLOW_CREATED, workflow);
      
      // 更新统计
      await this.updateStats();
      
      return workflow;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '工作流创建失败', code: 'WORKFLOW_CREATE_ERROR', type: ServiceErrorType.DATA, serviceName: 'WorkflowService', operation: 'createWorkflow', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新工作流
   */
  async updateWorkflow(workflowId: string, data: WorkflowUpdateData): Promise<WorkflowDefinition> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new ValidationError('工作流不存在', [{ field: 'workflowId', message: '工作流不存在', code: 'WORKFLOW_NOT_FOUND' }]);
      }
      
      // 处理节点更新
      let updatedNodes = workflow.nodes;
      if (data.nodes) {
        updatedNodes = data.nodes.map((nodeData, index) => ({
          ...nodeData,
          id: workflow.nodes[index]?.id || this.generateId(),
          createdAt: workflow.nodes[index]?.createdAt || new Date(),
          updatedAt: new Date()
        }));
      }
      
      // 处理连接更新
      let updatedConnections = workflow.connections;
      if (data.connections) {
        updatedConnections = data.connections.map((connData, index) => ({
          ...connData,
          id: workflow.connections[index]?.id || this.generateId()
        }));
      }
      
      // 处理触发器更新
      let updatedTriggers = workflow.triggers;
      if (data.triggers) {
        updatedTriggers = data.triggers.map((triggerData, index) => ({
          ...triggerData,
          id: workflow.triggers[index]?.id || this.generateId()
        }));
      }
      
      // 更新工作流
      const updatedWorkflow: WorkflowDefinition = {
        ...workflow,
        name: data.name ?? workflow.name,
        description: data.description ?? workflow.description,
        nodes: updatedNodes,
        connections: updatedConnections,
        variables: data.variables ?? workflow.variables,
        triggers: updatedTriggers,
        settings: data.settings ? { ...workflow.settings, ...data.settings } : workflow.settings,
        isActive: data.isActive ?? workflow.isActive,
        metadata: data.metadata ?? workflow.metadata,
        version: this.incrementVersion(workflow.version),
        updatedAt: new Date()
      };
      
      // 如果更新了节点，重新生成ID和时间戳
      if (data.nodes) {
        updatedWorkflow.nodes = data.nodes.map(node => ({
          ...node,
          id: this.generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }));
      }
      
      // 如果更新了连接，重新生成ID
      if (data.connections) {
        updatedWorkflow.connections = data.connections.map(conn => ({
          ...conn,
          id: this.generateId()
        }));
      }
      
      // 如果更新了触发器，重新生成ID
      if (data.triggers) {
        updatedWorkflow.triggers = data.triggers.map(trigger => ({
          ...trigger,
          id: this.generateId()
        }));
      }
      
      // 保存更新
      this.workflows.set(workflowId, updatedWorkflow);
      
      // 发射事件
      this.eventEmitter.emit('workflow:updated', updatedWorkflow);
      this.emit(SERVICE_EVENTS.WORKFLOW_UPDATED, updatedWorkflow);
      
      // 更新统计
      await this.updateStats();
      
      return updatedWorkflow;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '工作流更新失败', code: 'WORKFLOW_UPDATE_ERROR', type: ServiceErrorType.DATA, serviceName: 'WorkflowService', operation: 'updateWorkflow', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 删除工作流
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new ValidationError('工作流不存在', [{ field: 'workflowId', message: '工作流不存在', code: 'WORKFLOW_NOT_FOUND' }]);
      }
      
      // 检查是否有运行中的执行
      const runningExecutions = Array.from(this.executions.values())
        .filter(execution => execution.workflowId === workflowId && execution.status === 'running');
      
      if (runningExecutions.length > 0) {
        throw new ValidationError('无法删除有运行中执行的工作流', [{ field: 'workflowId', message: '无法删除有运行中执行的工作流', code: 'WORKFLOW_HAS_RUNNING_EXECUTIONS' }]);
      }
      
      // 删除工作流
      this.workflows.delete(workflowId);
      
      // 删除相关执行记录
      const executionsToDelete = Array.from(this.executions.entries())
        .filter(([_, execution]) => execution.workflowId === workflowId)
        .map(([id]) => id);
      
      for (const executionId of executionsToDelete) {
        this.executions.delete(executionId);
        this.executionLogs.delete(executionId);
      }
      
      // 删除相关节点执行记录
      const nodeExecutionsToDelete = Array.from(this.nodeExecutions.entries())
        .filter(([_, nodeExecution]) => executionsToDelete.includes(nodeExecution.executionId))
        .map(([id]) => id);
      
      for (const nodeExecutionId of nodeExecutionsToDelete) {
        this.nodeExecutions.delete(nodeExecutionId);
      }
      
      // 发射事件
      this.eventEmitter.emit('workflow:deleted', workflowId);
      this.emit(SERVICE_EVENTS.WORKFLOW_DELETED, workflowId);
      
      // 更新统计
      await this.updateStats();
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '工作流删除失败', code: 'WORKFLOW_DELETE_ERROR', type: ServiceErrorType.DATA, serviceName: 'WorkflowService', operation: 'deleteWorkflow', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取工作流
   */
  async getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * 查询工作流
   */
  async queryWorkflows(params: WorkflowQueryParams = {}): Promise<WorkflowDefinition[]> {
    try {
      let workflows = Array.from(this.workflows.values());
      
      // 应用过滤条件
      if (params.name) {
        workflows = workflows.filter(w => w.name.includes(params.name!));
      }
      
      if (params.isActive !== undefined) {
        workflows = workflows.filter(w => w.isActive === params.isActive);
      }
      
      if (params.createdBy) {
        workflows = workflows.filter(w => w.createdBy === params.createdBy);
      }
      
      if (params.hasNodes && params.hasNodes.length > 0) {
        workflows = workflows.filter(w => 
          params.hasNodes!.some(nodeType => 
            w.nodes.some(node => node.type === nodeType)
          )
        );
      }
      
      if (params.hasTriggers && params.hasTriggers.length > 0) {
        workflows = workflows.filter(w => 
          params.hasTriggers!.some(triggerType => 
            w.triggers.some(trigger => trigger.type === triggerType)
          )
        );
      }
      
      if (params.createdAfter) {
        workflows = workflows.filter(w => w.createdAt >= params.createdAfter!);
      }
      
      if (params.createdBefore) {
        workflows = workflows.filter(w => w.createdAt <= params.createdBefore!);
      }
      
      if (params.updatedAfter) {
        workflows = workflows.filter(w => w.updatedAt >= params.updatedAfter!);
      }
      
      if (params.updatedBefore) {
        workflows = workflows.filter(w => w.updatedAt <= params.updatedBefore!);
      }
      
      // 排序
      if (params.sortBy) {
        workflows.sort((a, b) => {
          let aValue: any, bValue: any;
          
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
      
      return workflows.slice(offset, offset + limit);
    } catch (error) {
      const serviceError = new ServiceError({ message: '工作流查询失败', code: 'WORKFLOW_QUERY_ERROR', type: ServiceErrorType.DATA, serviceName: 'WorkflowService', operation: 'queryWorkflows', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 激活工作流
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new ValidationError('工作流不存在', [{ field: 'workflowId', message: '工作流不存在', code: 'WORKFLOW_NOT_FOUND' }]);
      }
      
      workflow.isActive = true;
      workflow.updatedAt = new Date();
      
      // 发射事件
      this.eventEmitter.emit('workflow:activated', workflowId);
      this.emit(SERVICE_EVENTS.WORKFLOW_ACTIVATED, workflowId);
      
      // 更新统计
      await this.updateStats();
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '工作流激活失败', code: 'WORKFLOW_ACTIVATE_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'WorkflowService', operation: 'activateWorkflow', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 停用工作流
   */
  async deactivateWorkflow(workflowId: string): Promise<void> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new ValidationError('工作流不存在', [{ field: 'workflowId', message: '工作流不存在', code: 'WORKFLOW_NOT_FOUND' }]);
      }
      
      workflow.isActive = false;
      workflow.updatedAt = new Date();
      
      // 发射事件
      this.eventEmitter.emit('workflow:deactivated', workflowId);
      this.emit(SERVICE_EVENTS.WORKFLOW_DEACTIVATED, workflowId);
      
      // 更新统计
      await this.updateStats();
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '工作流停用失败', code: 'WORKFLOW_DEACTIVATE_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'WorkflowService', operation: 'deactivateWorkflow', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(
    workflowId: string, 
    triggerData?: Record<string, any>, 
    triggeredBy: string = 'manual'
  ): Promise<string> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new ValidationError('工作流不存在', [{ field: 'workflowId', message: '工作流不存在', code: 'WORKFLOW_NOT_FOUND' }]);
      }
      
      if (!workflow.isActive) {
        throw new ValidationError('工作流未激活', [{ field: 'isActive', message: '工作流未激活', code: 'WORKFLOW_NOT_ACTIVE' }]);
      }
      
      // 检查并发执行限制
      const runningExecutions = Array.from(this.executions.values())
        .filter(execution => 
          execution.workflowId === workflowId && 
          execution.status === 'running'
        ).length;
      
      if (runningExecutions >= workflow.settings.maxConcurrentExecutions) {
        throw new ValidationError('超过最大并发执行数限制', [{ field: 'concurrency', message: '超过最大并发执行数限制', code: 'MAX_CONCURRENT_EXECUTIONS_EXCEEDED' }]);
      }
      
      // 创建执行实例
      const execution: WorkflowExecution = {
        id: this.generateId(),
        workflowId,
        workflowVersion: workflow.version,
        status: 'pending',
        startedAt: new Date(),
        triggeredBy,
        triggerData,
        variables: { ...workflow.variables, ...triggerData },
        nodeExecutions: [],
        metadata: {}
      };
      
      // 保存执行实例
      this.executions.set(execution.id, execution);
      this.executionLogs.set(execution.id, []);
      
      // 添加到执行队列
      this.executionQueue.push(execution.id);
      
      // 发射事件
      this.eventEmitter.emit('execution:started', execution);
      this.emit(SERVICE_EVENTS.WORKFLOW_EXECUTION_STARTED, execution);
      
      // 更新统计
      await this.updateStats();
      
      return execution.id;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '工作流执行失败', code: 'WORKFLOW_EXECUTE_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'WorkflowService', operation: 'executeWorkflow', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 取消工作流执行
   */
  async cancelExecution(executionId: string): Promise<void> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new ValidationError('执行实例不存在', [{ field: 'executionId', message: '执行实例不存在', code: 'EXECUTION_NOT_FOUND' }]);
      }
      
      if (execution.status === 'completed' || execution.status === 'cancelled') {
        throw new ValidationError('执行已完成或已取消', [{ field: 'status', message: '执行已完成或已取消', code: 'EXECUTION_ALREADY_FINISHED' }]);
      }
      
      // 更新执行状态
      execution.status = 'cancelled';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      
      // 取消所有运行中的节点
      const runningNodeExecutions = execution.nodeExecutions
        .filter(nodeExecution => nodeExecution.status === 'running');
      
      for (const nodeExecution of runningNodeExecutions) {
        nodeExecution.status = 'cancelled';
        nodeExecution.completedAt = new Date();
        nodeExecution.duration = nodeExecution.completedAt.getTime() - nodeExecution.startedAt.getTime();
      }
      
      // 从队列中移除
      const queueIndex = this.executionQueue.indexOf(executionId);
      if (queueIndex > -1) {
        this.executionQueue.splice(queueIndex, 1);
      }
      
      // 记录日志
      this.addExecutionLog(executionId, 'info', '工作流执行已取消');
      
      // 发射事件
      this.eventEmitter.emit('execution:cancelled', execution);
      this.emit(SERVICE_EVENTS.WORKFLOW_EXECUTION_CANCELLED, execution);
      
      // 更新统计
      await this.updateStats();
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '执行取消失败', code: 'EXECUTION_CANCEL_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'WorkflowService', operation: 'cancelExecution', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 暂停工作流执行
   */
  async pauseExecution(executionId: string): Promise<void> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new ValidationError('执行实例不存在', [{ field: 'executionId', message: '执行实例不存在', code: 'EXECUTION_NOT_FOUND' }]);
      }
      
      if (execution.status !== 'running') {
        throw new ValidationError('只能暂停运行中的执行', [{ field: 'status', message: '只能暂停运行中的执行', code: 'INVALID_EXECUTION_STATUS' }]);
      }
      
      execution.status = 'paused';
      
      // 记录日志
      this.addExecutionLog(executionId, 'info', '工作流执行已暂停');
      
      // 发射事件
      this.eventEmitter.emit('execution:paused', execution);
      this.emit(SERVICE_EVENTS.WORKFLOW_EXECUTION_PAUSED, execution);
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '执行暂停失败', code: 'EXECUTION_PAUSE_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'WorkflowService', operation: 'pauseExecution', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 恢复工作流执行
   */
  async resumeExecution(executionId: string): Promise<void> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) {
        throw new ValidationError('执行实例不存在', [{ field: 'executionId', message: '执行实例不存在', code: 'EXECUTION_NOT_FOUND' }]);
      }
      
      if (execution.status !== 'paused') {
        throw new ValidationError('只能恢复暂停的执行', [{ field: 'status', message: '只能恢复暂停的执行', code: 'INVALID_EXECUTION_STATUS' }]);
      }
      
      execution.status = 'running';
      
      // 重新添加到队列
      if (!this.executionQueue.includes(executionId)) {
        this.executionQueue.push(executionId);
      }
      
      // 记录日志
      this.addExecutionLog(executionId, 'info', '工作流执行已恢复');
      
      // 发射事件
      this.eventEmitter.emit('execution:resumed', execution);
      this.emit(SERVICE_EVENTS.WORKFLOW_EXECUTION_RESUMED, execution);
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '执行恢复失败', code: 'EXECUTION_RESUME_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'WorkflowService', operation: 'resumeExecution', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取工作流执行
   */
  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    return this.executions.get(executionId) || null;
  }

  /**
   * 查询工作流执行
   */
  async queryExecutions(params: WorkflowExecutionQueryParams = {}): Promise<WorkflowExecution[]> {
    try {
      let executions = Array.from(this.executions.values());
      
      // 应用过滤条件
      if (params.workflowId) {
        executions = executions.filter(e => e.workflowId === params.workflowId);
      }
      
      if (params.status) {
        executions = executions.filter(e => e.status === params.status);
      }
      
      if (params.triggeredBy) {
        executions = executions.filter(e => e.triggeredBy === params.triggeredBy);
      }
      
      if (params.startedAfter) {
        executions = executions.filter(e => e.startedAt >= params.startedAfter!);
      }
      
      if (params.startedBefore) {
        executions = executions.filter(e => e.startedAt <= params.startedBefore!);
      }
      
      if (params.completedAfter && params.completedBefore) {
        executions = executions.filter(e => 
          e.completedAt && 
          e.completedAt >= params.completedAfter! && 
          e.completedAt <= params.completedBefore!
        );
      }
      
      if (params.durationMin !== undefined || params.durationMax !== undefined) {
        executions = executions.filter(e => {
          if (!e.duration) return false;
          if (params.durationMin !== undefined && e.duration < params.durationMin) return false;
          if (params.durationMax !== undefined && e.duration > params.durationMax) return false;
          return true;
        });
      }
      
      // 排序
      if (params.sortBy) {
        executions.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (params.sortBy) {
            case 'startedAt':
              aValue = a.startedAt.getTime();
              bValue = b.startedAt.getTime();
              break;
            case 'completedAt':
              aValue = a.completedAt?.getTime() || 0;
              bValue = b.completedAt?.getTime() || 0;
              break;
            case 'duration':
              aValue = a.duration || 0;
              bValue = b.duration || 0;
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
      
      return executions.slice(offset, offset + limit);
    } catch (error) {
      const serviceError = new ServiceError({ message: '执行查询失败', code: 'EXECUTION_QUERY_ERROR', type: ServiceErrorType.DATA, serviceName: 'WorkflowService', operation: 'getExecutions', innerError: error as Error });
      this.eventEmitter.emit('workflow:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取执行日志
   */
  async getExecutionLogs(executionId: string): Promise<WorkflowExecutionLog[]> {
    return this.executionLogs.get(executionId) || [];
  }

  /**
   * 获取工作流统计信息
   */
  async getStats(): Promise<WorkflowStats> {
    await this.updateStats();
    return { ...this.stats };
  }

  /**
   * 监听工作流事件
   */
  onWorkflowEvent<K extends keyof WorkflowEvents>(event: K, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * 移除工作流事件监听
   */
  offWorkflowEvent<K extends keyof WorkflowEvents>(event: K, listener: (...args: any[]) => void): void {
    super.off(event, listener);
  }

  /**
   * 验证工作流数据
   */
  private validateWorkflowData(data: WorkflowCreateData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('工作流名称不能为空', [{ field: 'name', message: '工作流名称不能为空', code: 'EMPTY_NAME' }]);
    }
    
    if (!data.nodes || data.nodes.length === 0) {
      throw new ValidationError('工作流必须包含至少一个节点', [{ field: 'nodes', message: '工作流必须包含至少一个节点', code: 'EMPTY_NODES' }]);
    }
    
    // 检查是否有开始节点
    const startNodes = data.nodes.filter(node => node.type === 'start');
    if (startNodes.length === 0) {
      throw new ValidationError('工作流必须包含一个开始节点', [{ field: 'nodes', message: '工作流必须包含一个开始节点', code: 'MISSING_START_NODE' }]);
    }
    
    if (startNodes.length > 1) {
      throw new ValidationError('工作流只能包含一个开始节点', [{ field: 'nodes', message: '工作流只能包含一个开始节点', code: 'MULTIPLE_START_NODES' }]);
    }
    
    // 检查是否有结束节点
    const endNodes = data.nodes.filter(node => node.type === 'end');
    if (endNodes.length === 0) {
      throw new ValidationError('工作流必须包含至少一个结束节点', [{ field: 'nodes', message: '工作流必须包含至少一个结束节点', code: 'MISSING_END_NODE' }]);
    }
    
    // 验证连接
    if (data.connections) {
      for (const connection of data.connections) {
        const sourceNode = data.nodes.find(node => node.name === connection.sourceNodeId);
        const targetNode = data.nodes.find(node => node.name === connection.targetNodeId);
        
        if (!sourceNode) {
          throw new ValidationError(`连接的源节点不存在: ${connection.sourceNodeId}`, [{ field: 'sourceNodeId', message: `连接的源节点不存在: ${connection.sourceNodeId}`, code: 'SOURCE_NODE_NOT_FOUND' }]);
        }
        
        if (!targetNode) {
          throw new ValidationError(`连接的目标节点不存在: ${connection.targetNodeId}`, [{ field: 'targetNodeId', message: `连接的目标节点不存在: ${connection.targetNodeId}`, code: 'TARGET_NODE_NOT_FOUND' }]);
        }
      }
    }
    
    // 检查工作流名称是否已存在
    const existingWorkflow = Array.from(this.workflows.values())
      .find(w => w.name === data.name);
    
    if (existingWorkflow) {
      throw new ValidationError('工作流名称已存在', [{ field: 'name', message: '工作流名称已存在', code: 'WORKFLOW_NAME_EXISTS' }]);
    }
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 递增版本号
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  /**
   * 添加执行日志
   */
  private addExecutionLog(
    executionId: string, 
    level: 'debug' | 'info' | 'warn' | 'error', 
    message: string, 
    data?: any,
    nodeId?: string
  ): void {
    const logs = this.executionLogs.get(executionId) || [];
    
    const log: WorkflowExecutionLog = {
      id: this.generateId(),
      executionId,
      nodeId,
      level,
      message,
      timestamp: new Date(),
      data
    };
    
    logs.push(log);
    this.executionLogs.set(executionId, logs);
  }

  /**
   * 启动执行队列处理
   */
  private startExecutionProcessing(): void {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    // 每5秒处理一次队列
    this.processingInterval = setInterval(() => {
      this.processExecutionQueue().catch(error => {
        const serviceError = new ServiceError({ message: '执行队列处理失败', code: 'EXECUTION_PROCESS_ERROR', type: ServiceErrorType.INTERNAL_SERVICE, serviceName: 'WorkflowService', operation: 'processExecutionQueue', innerError: error });
        this.eventEmitter.emit('workflow:error', serviceError);
      });
    }, 5000);
  }

  /**
   * 停止执行队列处理
   */
  private stopExecutionProcessing(): void {
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * 处理执行队列
   */
  private async processExecutionQueue(): Promise<void> {
    // 获取当前运行中的执行数量
    const runningCount = Array.from(this.executions.values())
      .filter(execution => execution.status === 'running').length;
    
    // 计算可以启动的新执行数量
    const availableSlots = this.maxConcurrentExecutions - runningCount;
    
    if (availableSlots <= 0 || this.executionQueue.length === 0) {
      return;
    }
    
    // 处理队列中的执行
    const executionsToProcess = this.executionQueue.splice(0, availableSlots);
    
    for (const executionId of executionsToProcess) {
      try {
        await this.processExecution(executionId);
      } catch (error) {
        // 处理单个执行失败不影响其他执行
      }
    }
  }

  /**
   * 处理单个执行
   */
  private async processExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return;
    }
    
    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      execution.status = 'failed';
      execution.error = '工作流不存在';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      return;
    }
    
    try {
      // 更新执行状态
      execution.status = 'running';
      
      // 记录日志
      this.addExecutionLog(executionId, 'info', '开始执行工作流');
      
      // 查找开始节点
      const startNode = workflow.nodes.find(node => node.type === 'start');
      if (!startNode) {
        throw new Error('未找到开始节点');
      }
      
      // 执行工作流
      await this.executeNode(execution, startNode);
      
      // 如果执行完成
      if (execution.status === 'running') {
        execution.status = 'completed';
        execution.completedAt = new Date();
        execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
        
        // 记录日志
        this.addExecutionLog(executionId, 'info', '工作流执行完成');
        
        // 发射事件
        this.eventEmitter.emit('execution:completed', execution);
        this.emit(SERVICE_EVENTS.WORKFLOW_EXECUTION_COMPLETED, execution);
      }
    } catch (error) {
      // 执行失败
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      
      // 记录日志
      this.addExecutionLog(executionId, 'error', '工作流执行失败', { error: execution.error });
      
      // 发射事件
      this.eventEmitter.emit('execution:failed', execution, error as Error);
      this.emit(SERVICE_EVENTS.WORKFLOW_EXECUTION_FAILED, execution);
    }
    
    // 更新统计
    await this.updateStats();
  }

  /**
   * 执行节点
   */
  private async executeNode(execution: WorkflowExecution, node: WorkflowNode): Promise<void> {
    // 创建节点执行记录
    const nodeExecution: WorkflowNodeExecution = {
      id: this.generateId(),
      nodeId: node.id,
      executionId: execution.id,
      status: 'running',
      startedAt: new Date(),
      attempts: 0,
      logs: []
    };
    
    // 保存节点执行记录
    this.nodeExecutions.set(nodeExecution.id, nodeExecution);
    execution.nodeExecutions.push(nodeExecution);
    
    // 发射事件
    this.eventEmitter.emit('node:started', nodeExecution);
    
    // 记录日志
    this.addExecutionLog(execution.id, 'info', `开始执行节点: ${node.name}`, null, node.id);
    
    try {
      // 根据节点类型执行不同逻辑
      switch (node.type) {
        case 'start':
          await this.executeStartNode(execution, node, nodeExecution);
          break;
        case 'end':
          await this.executeEndNode(execution, node, nodeExecution);
          break;
        case 'task':
          await this.executeTaskNode(execution, node, nodeExecution);
          break;
        case 'decision':
          await this.executeDecisionNode(execution, node, nodeExecution);
          break;
        case 'delay':
          await this.executeDelayNode(execution, node, nodeExecution);
          break;
        case 'script':
          await this.executeScriptNode(execution, node, nodeExecution);
          break;
        default:
          throw new Error(`不支持的节点类型: ${node.type}`);
      }
      
      // 节点执行成功
      nodeExecution.status = 'completed';
      nodeExecution.completedAt = new Date();
      nodeExecution.duration = nodeExecution.completedAt.getTime() - nodeExecution.startedAt.getTime();
      
      // 发射事件
      this.eventEmitter.emit('node:completed', nodeExecution);
      
      // 记录日志
      this.addExecutionLog(execution.id, 'info', `节点执行完成: ${node.name}`, null, node.id);
      
    } catch (error) {
      // 节点执行失败
      nodeExecution.status = 'failed';
      nodeExecution.error = error instanceof Error ? error.message : String(error);
      nodeExecution.completedAt = new Date();
      nodeExecution.duration = nodeExecution.completedAt.getTime() - nodeExecution.startedAt.getTime();
      
      // 发射事件
      this.eventEmitter.emit('node:failed', nodeExecution, error as Error);
      
      // 记录日志
      this.addExecutionLog(execution.id, 'error', `节点执行失败: ${node.name}`, { error: nodeExecution.error }, node.id);
      
      throw error;
    }
  }

  /**
   * 执行开始节点
   */
  private async executeStartNode(
    execution: WorkflowExecution, 
    node: WorkflowNode, 
    nodeExecution: WorkflowNodeExecution
  ): Promise<void> {
    // 开始节点只是标记工作流开始，直接执行下一个节点
    const workflow = this.workflows.get(execution.workflowId)!;
    const nextNodes = this.getNextNodes(workflow, node);
    
    for (const nextNode of nextNodes) {
      await this.executeNode(execution, nextNode);
    }
  }

  /**
   * 执行结束节点
   */
  private async executeEndNode(
    execution: WorkflowExecution, 
    node: WorkflowNode, 
    nodeExecution: WorkflowNodeExecution
  ): Promise<void> {
    // 结束节点标记工作流结束
    // 这里可以添加结束时的清理逻辑
  }

  /**
   * 执行任务节点
   */
  private async executeTaskNode(
    execution: WorkflowExecution, 
    node: WorkflowNode, 
    nodeExecution: WorkflowNodeExecution
  ): Promise<void> {
    // 这里应该实现具体的任务执行逻辑
    // 例如调用外部API、执行数据库操作等
    
    // 模拟任务执行
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 继续执行下一个节点
    const workflow = this.workflows.get(execution.workflowId)!;
    const nextNodes = this.getNextNodes(workflow, node);
    
    for (const nextNode of nextNodes) {
      await this.executeNode(execution, nextNode);
    }
  }

  /**
   * 执行决策节点
   */
  private async executeDecisionNode(
    execution: WorkflowExecution, 
    node: WorkflowNode, 
    nodeExecution: WorkflowNodeExecution
  ): Promise<void> {
    // 根据条件决定执行哪个分支
    const condition = node.config.condition;
    if (!condition) {
      throw new Error('决策节点缺少条件表达式');
    }
    
    // 这里应该实现条件表达式的评估
    // 简化实现，假设条件总是为真
    const conditionResult = true;
    
    const workflow = this.workflows.get(execution.workflowId)!;
    const nextNodes = this.getNextNodes(workflow, node);
    
    // 根据条件结果选择分支
    if (conditionResult && nextNodes.length > 0) {
      await this.executeNode(execution, nextNodes[0]);
    } else if (nextNodes.length > 1) {
      await this.executeNode(execution, nextNodes[1]);
    }
  }

  /**
   * 执行延迟节点
   */
  private async executeDelayNode(
    execution: WorkflowExecution, 
    node: WorkflowNode, 
    nodeExecution: WorkflowNodeExecution
  ): Promise<void> {
    const delayDuration = node.config.delayDuration || 1000;
    
    // 延迟执行
    await new Promise(resolve => setTimeout(resolve, delayDuration));
    
    // 继续执行下一个节点
    const workflow = this.workflows.get(execution.workflowId)!;
    const nextNodes = this.getNextNodes(workflow, node);
    
    for (const nextNode of nextNodes) {
      await this.executeNode(execution, nextNode);
    }
  }

  /**
   * 执行脚本节点
   */
  private async executeScriptNode(
    execution: WorkflowExecution, 
    node: WorkflowNode, 
    nodeExecution: WorkflowNodeExecution
  ): Promise<void> {
    const script = node.config.script;
    if (!script) {
      throw new Error('脚本节点缺少脚本代码');
    }
    
    // 这里应该实现脚本执行逻辑
    // 出于安全考虑，实际实现中应该使用沙箱环境
    
    // 模拟脚本执行
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 继续执行下一个节点
    const workflow = this.workflows.get(execution.workflowId)!;
    const nextNodes = this.getNextNodes(workflow, node);
    
    for (const nextNode of nextNodes) {
      await this.executeNode(execution, nextNode);
    }
  }

  /**
   * 获取下一个节点
   */
  private getNextNodes(workflow: WorkflowDefinition, currentNode: WorkflowNode): WorkflowNode[] {
    const connections = workflow.connections.filter(conn => conn.sourceNodeId === currentNode.id);
    const nextNodes: WorkflowNode[] = [];
    
    for (const connection of connections) {
      const nextNode = workflow.nodes.find(node => node.id === connection.targetNodeId);
      if (nextNode) {
        nextNodes.push(nextNode);
      }
    }
    
    return nextNodes;
  }

  /**
   * 更新统计信息
   */
  private async updateStats(): Promise<void> {
    const workflows = Array.from(this.workflows.values());
    const executions = Array.from(this.executions.values());
    
    this.stats.totalWorkflows = workflows.length;
    this.stats.activeWorkflows = workflows.filter(w => w.isActive).length;
    this.stats.totalExecutions = executions.length;
    this.stats.runningExecutions = executions.filter(e => e.status === 'running').length;
    this.stats.completedExecutions = executions.filter(e => e.status === 'completed').length;
    this.stats.failedExecutions = executions.filter(e => e.status === 'failed').length;
    
    // 计算平均执行时间
    const completedExecutions = executions.filter(e => e.status === 'completed' && e.duration);
    if (completedExecutions.length > 0) {
      const totalDuration = completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0);
      this.stats.averageExecutionTime = totalDuration / completedExecutions.length;
    }
    
    // 计算成功率
    const finishedExecutions = executions.filter(e => e.status === 'completed' || e.status === 'failed');
    if (finishedExecutions.length > 0) {
      this.stats.successRate = (this.stats.completedExecutions / finishedExecutions.length) * 100;
    }
    
    // 按状态统计执行
    this.stats.executionsByStatus = {
      pending: executions.filter(e => e.status === 'pending').length,
      running: executions.filter(e => e.status === 'running').length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      cancelled: executions.filter(e => e.status === 'cancelled').length,
      paused: executions.filter(e => e.status === 'paused').length
    };
    
    // 按工作流统计执行
    this.stats.executionsByWorkflow = {};
    for (const execution of executions) {
      this.stats.executionsByWorkflow[execution.workflowId] = 
        (this.stats.executionsByWorkflow[execution.workflowId] || 0) + 1;
    }
    
    // 按天统计执行
    this.stats.executionsByDay = {};
    for (const execution of executions) {
      const day = execution.startedAt.toISOString().split('T')[0];
      this.stats.executionsByDay[day] = (this.stats.executionsByDay[day] || 0) + 1;
    }
    
    // 统计失败原因
    const failedExecutions = executions.filter(e => e.status === 'failed' && e.error);
    const failureReasons: Record<string, number> = {};
    for (const execution of failedExecutions) {
      const reason = execution.error!;
      failureReasons[reason] = (failureReasons[reason] || 0) + 1;
    }
    this.stats.topFailureReasons = Object.entries(failureReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // 统计节点类型使用情况
    this.stats.nodeTypeUsage = {
      start: 0,
      end: 0,
      task: 0,
      decision: 0,
      parallel: 0,
      merge: 0,
      delay: 0,
      webhook: 0,
      script: 0,
      approval: 0,
      notification: 0,
      condition: 0
    };
    
    for (const workflow of workflows) {
      for (const node of workflow.nodes) {
        this.stats.nodeTypeUsage[node.type]++;
      }
    }
    
    // 统计触发器类型使用情况
    this.stats.triggerTypeUsage = {};
    for (const workflow of workflows) {
      for (const trigger of workflow.triggers) {
        this.stats.triggerTypeUsage[trigger.type] = 
          (this.stats.triggerTypeUsage[trigger.type] || 0) + 1;
      }
    }
  }
}

// 导出工作流服务
export default WorkflowService;