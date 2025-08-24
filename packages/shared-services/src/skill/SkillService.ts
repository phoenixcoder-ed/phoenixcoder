import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ValidationError, NotFoundError, handleUnknownError, ServiceErrorType } from '../types/ServiceError';
import { ApiConfig } from '../types/ServiceConfig';

import { Skill, SkillLevel, SkillCategory, UserSkill, SkillAssessment, PaginatedResponse } from '@phoenixcoder/shared-types';
import { ApiClient, buildURL } from '@phoenixcoder/shared-utils';
import { EventEmitter } from 'eventemitter3';

/**
 * 技能查询参数
 */
export interface SkillQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: SkillCategory | SkillCategory[];
  level?: SkillLevel | SkillLevel[];
  tags?: string[];
  isActive?: boolean;
  verified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 用户技能查询参数
 */
export interface UserSkillQueryParams {
  userId?: string;
  skillId?: string;
  category?: SkillCategory;
  level?: SkillLevel;
  verified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 技能创建数据
 */
export interface SkillCreateData {
  name: string;
  description: string;
  category: SkillCategory;
  tags?: string[];
  icon?: string;
  color?: string;
  isActive?: boolean;
  prerequisites?: string[];
  relatedSkills?: string[];
}

/**
 * 技能更新数据
 */
export interface SkillUpdateData {
  name?: string;
  description?: string;
  category?: SkillCategory;
  tags?: string[];
  icon?: string;
  color?: string;
  isActive?: boolean;
  prerequisites?: string[];
  relatedSkills?: string[];
}

/**
 * 用户技能数据
 */
export interface UserSkillData {
  skillId: string;
  level: SkillLevel;
  experience?: number;
  certifications?: string[];
  projects?: string[];
  endorsements?: string[];
  selfAssessment?: number; // 1-10
  verified?: boolean;
}

/**
 * 技能评估数据
 */
export interface SkillAssessmentData {
  skillId: string;
  userId: string;
  assessorId: string;
  level: SkillLevel;
  score: number; // 1-100
  feedback?: string;
  evidence?: string[];
  validUntil?: Date;
}

/**
 * 技能推荐数据
 */
export interface SkillRecommendation {
  skill: Skill;
  reason: string;
  priority: number;
  relatedTasks?: number;
  marketDemand?: number;
  learningPath?: string[];
}

/**
 * 技能统计信息
 */
export interface SkillStats {
  total: number;
  byCategory: Record<SkillCategory, number>;
  byLevel: Record<SkillLevel, number>;
  mostPopular: Skill[];
  trending: Skill[];
  userCount: Record<string, number>;
  averageLevel: Record<string, number>;
}

/**
 * 技能事件接口
 */
export interface SkillEvents {
  'skill:created': (skill: Skill) => void;
  'skill:updated': (skill: Skill) => void;
  'skill:deleted': (skillId: string) => void;
  'skill:fetched': (skills: Skill[]) => void;
  'user-skill:added': (userSkill: UserSkill) => void;
  'user-skill:updated': (userSkill: UserSkill) => void;
  'user-skill:removed': (userId: string, skillId: string) => void;
  'user-skill:fetched': (userSkills: UserSkill[]) => void;
  'skill:assessed': (assessment: SkillAssessment) => void;
  'skill:verified': (userSkill: UserSkill) => void;
  'skill:search-completed': (data: { query: string; result: PaginatedResponse<Skill> }) => void;
  'skill:recommendations-fetched': (recommendations: SkillRecommendation[]) => void;
  'skill:stats-fetched': (stats: SkillStats) => void;
  'skill:trending-fetched': (skills: Skill[]) => void;
  'skill:batch-fetched': (skills: Skill[]) => void;
  'skill:error': (error: ServiceError) => void;
}

/**
 * 技能服务类
 */
export class SkillService extends BaseService implements IService {
  private apiClient: ApiClient;
  private eventEmitter: EventEmitter<SkillEvents>;
  private skillCache: Map<string, { skill: Skill; timestamp: number }>;
  private userSkillCache: Map<string, { userSkills: UserSkill[]; timestamp: number }>;
  private readonly CACHE_TTL = 600000; // 10分钟缓存
  private baseURL: string;

  constructor(config: ApiConfig) {
    super(config, 'SkillService', '1.0.0');
    
    this.baseURL = config.baseURL || '';
    this.apiClient = new ApiClient(
      this.baseURL,
      {
        'Content-Type': 'application/json'
      }
    );

    this.eventEmitter = new EventEmitter();
    this.skillCache = new Map();
    this.userSkillCache = new Map();
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 启动缓存清理
    this.startCacheCleanup();
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    this.skillCache.clear();
    this.userSkillCache.clear();
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiClient.get('/skills/health');
      return { success: response.status === 200, status: 'healthy' };
    } catch (error) {
      return { success: false, status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取技能列表
   */
  async getSkills(params: SkillQueryParams = {}): Promise<PaginatedResponse<Skill>> {
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      if (params.category) {
        if (Array.isArray(params.category)) {
          params.category.forEach(cat => queryParams.append('category', cat));
        } else {
          queryParams.append('category', params.category);
        }
      }
      if (params.level) {
        if (Array.isArray(params.level)) {
          params.level.forEach(lvl => queryParams.append('level', lvl.toString()));
        } else {
          queryParams.append('level', params.level.toString());
        }
      }
      if (params.verified !== undefined) queryParams.append('verified', params.verified.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const url = queryParams.toString() ? `/skills?${queryParams.toString()}` : '/skills';
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<Skill>;
      
      // 缓存技能数据
      result.data.forEach(skill => {
        this.setSkillCache(skill.id, skill);
      });
      
      this.eventEmitter.emit('skill:fetched', result.data);
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'getSkills', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '获取技能列表失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 根据ID获取技能
   */
  async getSkillById(skillId: string, useCache: boolean = true): Promise<Skill> {
    // 检查缓存
    if (useCache) {
      const cached = this.getSkillFromCache(skillId);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.apiClient.get(`/skills/${skillId}`);
      const skill = response.data as Skill;
      
      // 更新缓存
      this.setSkillCache(skillId, skill);
      
      this.eventEmitter.emit('skill:fetched', [skill]);
      return skill;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'getSkillById', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 404) {
        throw new NotFoundError(`技能 ${skillId} 不存在`, 'skill', 'SkillService');
      }
      serviceError.message = '获取技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 创建技能
   */
  async createSkill(skillData: SkillCreateData): Promise<Skill> {
    try {
      const response = await this.apiClient.post('/skills', skillData);
      const skill = response.data as Skill;
      
      // 更新缓存
      this.setSkillCache(skill.id, skill);
      
      this.eventEmitter.emit('skill:created', skill);
      
      return skill;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'createSkill', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 400) {
        throw new ValidationError('技能数据验证失败', [{ field: 'skillData', message: '技能数据验证失败', code: 'VALIDATION_FAILED' }], 'SkillService');
      }
      serviceError.message = '创建技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新技能
   */
  async updateSkill(skillId: string, updateData: SkillUpdateData): Promise<Skill> {
    try {
      const response = await this.apiClient.put(`/skills/${skillId}`, updateData);
      const skill = response.data as Skill;
      
      // 更新缓存
      this.setSkillCache(skillId, skill);
      
      this.eventEmitter.emit('skill:updated', skill);
      
      return skill;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'updateSkill', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 404) {
        throw new NotFoundError(`技能 ${skillId} 不存在`, 'skill', 'SkillService');
      }
      if (httpDetails?.response?.status === 400) {
        throw new ValidationError('技能数据验证失败', [{ field: 'updateData', message: '技能数据验证失败', code: 'VALIDATION_FAILED' }], 'SkillService');
      }
      serviceError.message = '更新技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 删除技能
   */
  async deleteSkill(skillId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/skills/${skillId}`);
      
      // 清除缓存
      this.skillCache.delete(skillId);
      
      this.eventEmitter.emit('skill:deleted', skillId);
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'deleteSkill', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 404) {
        throw new NotFoundError(`技能 ${skillId} 不存在`, 'skill', 'SkillService');
      }
      serviceError.message = '删除技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取用户技能
   */
  async getUserSkills(userId: string, useCache: boolean = true): Promise<UserSkill[]> {
    // 检查缓存
    if (useCache) {
      const cached = this.getUserSkillsFromCache(userId);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.apiClient.get(`/users/${userId}/skills`);
      const userSkills = response.data as UserSkill[];
      
      // 更新缓存
      this.setUserSkillsCache(userId, userSkills);
      
      this.eventEmitter.emit('user-skill:fetched', userSkills);
      return userSkills;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'getUserSkills', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'SkillService');
      }
      serviceError.message = '获取用户技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 添加用户技能
   */
  async addUserSkill(userId: string, skillData: UserSkillData): Promise<UserSkill> {
    try {
      const response = await this.apiClient.post(`/users/${userId}/skills`, skillData);
      const userSkill = response.data as UserSkill;
      
      // 清除用户技能缓存，强制重新获取
      this.userSkillCache.delete(userId);
      
      this.eventEmitter.emit('user-skill:added', userSkill);
      
      return userSkill;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'addUserSkill', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 或技能不存在`, 'userOrSkill', 'SkillService');
      }
      if (httpDetails?.response?.status === 400) {
        throw new ValidationError('用户技能数据验证失败', [{ field: 'skillData', message: '用户技能数据验证失败', code: 'VALIDATION_FAILED' }], 'SkillService');
      }
      serviceError.message = '添加用户技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新用户技能
   */
  async updateUserSkill(userId: string, skillId: string, updateData: Partial<UserSkillData>): Promise<UserSkill> {
    try {
      const response = await this.apiClient.put(`/users/${userId}/skills/${skillId}`, updateData);
      const userSkill = response.data as UserSkill;
      
      // 清除用户技能缓存，强制重新获取
      this.userSkillCache.delete(userId);
      
      this.eventEmitter.emit('user-skill:updated', userSkill);
      
      return userSkill;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'updateUserSkill', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 404) {
        throw new NotFoundError(`用户技能不存在`, 'userSkill', 'SkillService');
      }
      if (httpDetails?.response?.status === 400) {
        throw new ValidationError('用户技能数据验证失败', [{ field: 'updateData', message: '用户技能数据验证失败', code: 'VALIDATION_FAILED' }], 'SkillService');
      }
      serviceError.message = '更新用户技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 移除用户技能
   */
  async removeUserSkill(userId: string, skillId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/users/${userId}/skills/${skillId}`);
      
      // 清除用户技能缓存，强制重新获取
      this.userSkillCache.delete(userId);
      
      this.eventEmitter.emit('user-skill:removed', userId, skillId);
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'removeUserSkill', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 404) {
        throw new NotFoundError(`用户技能不存在`, 'userSkill', 'SkillService');
      }
      serviceError.message = '移除用户技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 评估技能
   */
  async assessSkill(assessmentData: SkillAssessmentData): Promise<SkillAssessment> {
    try {
      const response = await this.apiClient.post('/skills/assess', assessmentData);
      const assessment = response.data as SkillAssessment;
      
      // 清除相关用户的技能缓存
      this.userSkillCache.delete(assessmentData.userId);
      
      this.eventEmitter.emit('skill:assessed', assessment);
      
      return assessment;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'assessSkill', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 400) {
        throw new ValidationError('技能评估数据验证失败', [{ field: 'assessmentData', message: '技能评估数据验证失败', code: 'VALIDATION_FAILED' }], 'SkillService');
      }
      serviceError.message = '技能评估失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 验证用户技能
   */
  async verifyUserSkill(userId: string, skillId: string, verified: boolean): Promise<UserSkill> {
    try {
      const response = await this.apiClient.patch(`/users/${userId}/skills/${skillId}/verify`, { verified });
      const userSkill = response.data as UserSkill;
      
      // 清除用户技能缓存，强制重新获取
      this.userSkillCache.delete(userId);
      
      if (verified) {
        this.eventEmitter.emit('skill:verified', userSkill);
      }
      this.eventEmitter.emit('skill:verified', userSkill);
      
      return userSkill;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'verifyUserSkill', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 404) {
        throw new NotFoundError(`用户技能不存在`, 'userSkill', 'SkillService');
      }
      serviceError.message = '验证用户技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 搜索技能
   */
  async searchSkills(query: string, filters: Partial<SkillQueryParams> = {}): Promise<PaginatedResponse<Skill>> {
    try {
      const params = { ...filters, search: query };
      const url = buildURL(this.baseURL, '/skills/search', params);
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<Skill>;
      
      // 缓存搜索结果中的技能
      result.data.forEach(skill => {
        this.setSkillCache(skill.id, skill);
      });
      
      this.eventEmitter.emit('skill:search-completed', { query, result });
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'searchSkills', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '搜索技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取技能推荐
   */
  async getSkillRecommendations(userId: string, limit: number = 10): Promise<SkillRecommendation[]> {
    try {
      const url = buildURL(this.baseURL, `/users/${userId}/skill-recommendations`, { limit });
      const response = await this.apiClient.get(url);
      const recommendations = response.data as SkillRecommendation[];
      
      this.eventEmitter.emit('skill:recommendations-fetched', recommendations);
      return recommendations;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'getSkillRecommendations', ServiceErrorType.BUSINESS_LOGIC);
      const httpDetails = serviceError.details as { response?: { status: number } } | undefined;
      if (httpDetails?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'SkillService');
      }
      serviceError.message = '获取技能推荐失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取技能统计信息
   */
  async getSkillStats(filters: Partial<SkillQueryParams> = {}): Promise<SkillStats> {
    try {
      const url = buildURL(this.baseURL, '/skills/stats', filters);
      const response = await this.apiClient.get(url);
      const stats = response.data as SkillStats;
      
      this.eventEmitter.emit('skill:stats-fetched', stats);
      return stats;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'getSkillStats', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '获取技能统计信息失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取热门技能
   */
  async getTrendingSkills(limit: number = 20): Promise<Skill[]> {
    try {
      const url = buildURL(this.baseURL, '/skills/trending', { limit });
      const response = await this.apiClient.get(url);
      const skills = response.data as Skill[];
      
      // 缓存热门技能
      skills.forEach(skill => {
        this.setSkillCache(skill.id, skill);
      });
      
      this.eventEmitter.emit('skill:trending-fetched', skills);
      return skills;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'getTrendingSkills', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '获取热门技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 批量获取技能
   */
  async getSkillsByIds(skillIds: string[]): Promise<Skill[]> {
    try {
      const response = await this.apiClient.post('/skills/batch', { skillIds });
      const skills = response.data as Skill[];
      
      // 更新缓存
      skills.forEach(skill => {
        this.setSkillCache(skill.id, skill);
      });
      
      this.eventEmitter.emit('skill:batch-fetched', skills);
      return skills;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'SkillService', 'getSkillsByIds', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '批量获取技能失败';
      this.eventEmitter.emit('skill:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 清除技能缓存
   */
  clearSkillCache(skillId?: string): void {
    if (skillId) {
      this.skillCache.delete(skillId);
    } else {
      this.skillCache.clear();
    }
  }

  /**
   * 清除用户技能缓存
   */
  clearUserSkillCache(userId?: string): void {
    if (userId) {
      this.userSkillCache.delete(userId);
    } else {
      this.userSkillCache.clear();
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { skills: number; userSkills: number } {
    return {
      skills: this.skillCache.size,
      userSkills: this.userSkillCache.size
    };
  }

  /**
   * 监听技能事件
   */
  override on<T extends string | symbol>(event: T, fn: (...args: unknown[]) => void, context?: unknown): this {
    return super.on(event, fn, context);
  }

  /**
   * 监听技能事件（类型安全版本）
   */
  onSkillEvent<K extends keyof SkillEvents>(event: K, listener: SkillEvents[K]): void {
    super.on(event as string, listener as (...args: unknown[]) => void);
  }

  /**
   * 移除技能事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: unknown[]) => void) | undefined, context?: unknown, once?: boolean | undefined): this {
    return super.off(event, fn, context, once);
  }

  /**
   * 移除技能事件监听（类型安全版本）
   */
  offSkillEvent<K extends keyof SkillEvents>(event: K, listener: SkillEvents[K]): void {
    super.off(event as string, listener as (...args: unknown[]) => void);
  }

  /**
   * 从缓存获取技能
   */
  private getSkillFromCache(skillId: string): Skill | null {
    const cached = this.skillCache.get(skillId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.skill;
    }
    if (cached) {
      this.skillCache.delete(skillId);
    }
    return null;
  }

  /**
   * 设置技能缓存
   */
  private setSkillCache(skillId: string, skill: Skill): void {
    this.skillCache.set(skillId, {
      skill,
      timestamp: Date.now()
    });
  }

  /**
   * 从缓存获取用户技能
   */
  private getUserSkillsFromCache(userId: string): UserSkill[] | null {
    const cached = this.userSkillCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.userSkills;
    }
    if (cached) {
      this.userSkillCache.delete(userId);
    }
    return null;
  }

  /**
   * 设置用户技能缓存
   */
  private setUserSkillsCache(userId: string, userSkills: UserSkill[]): void {
    this.userSkillCache.set(userId, {
      userSkills,
      timestamp: Date.now()
    });
  }

  /**
   * 启动缓存清理
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // 清理技能缓存
      for (const [skillId, cached] of this.skillCache.entries()) {
        if (now - cached.timestamp >= this.CACHE_TTL) {
          this.skillCache.delete(skillId);
        }
      }
      
      // 清理用户技能缓存
      for (const [userId, cached] of this.userSkillCache.entries()) {
        if (now - cached.timestamp >= this.CACHE_TTL) {
          this.userSkillCache.delete(userId);
        }
      }
    }, 60000); // 每分钟清理一次
  }
}

/**
 * 创建技能服务实例
 */
export function createSkillService(config: ApiConfig): SkillService {
  return new SkillService(config);
}

/**
 * 默认技能服务实例
 */
let defaultSkillService: SkillService | null = null;

/**
 * 获取默认技能服务实例
 */
export function getSkillService(): SkillService {
  if (!defaultSkillService) {
    throw new Error('Skill service not initialized. Call initSkillService first.');
  }
  return defaultSkillService;
}

/**
 * 初始化默认技能服务
 */
export function initSkillService(config: ApiConfig): SkillService {
  defaultSkillService = new SkillService(config);
  return defaultSkillService;
}

/**
 * 销毁默认技能服务
 */
export async function destroySkillService(): Promise<void> {
  if (defaultSkillService) {
    await defaultSkillService.destroy();
    defaultSkillService = null;
  }
}