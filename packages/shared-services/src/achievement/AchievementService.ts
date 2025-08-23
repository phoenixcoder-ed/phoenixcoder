import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, NotFoundError, ValidationError, handleUnknownError, ServiceErrorType } from '../types/ServiceError';
import { ApiConfig } from '../types/ServiceConfig';
import { SERVICE_EVENTS } from '../types/ServiceConstants';
import { Achievement, UserAchievement, AchievementCategory, AchievementType, PaginatedResponse } from '@phoenixcoder/shared-types';
import { ApiClient, buildURL } from '@phoenixcoder/shared-utils';
import { EventEmitter } from 'eventemitter3';

/**
 * 成就查询参数
 */
export interface AchievementQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: AchievementCategory | AchievementCategory[];
  type?: AchievementType | AchievementType[];
  difficulty?: number; // 1-5
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 用户成就查询参数
 */
export interface UserAchievementQueryParams {
  userId?: string;
  achievementId?: string;
  category?: AchievementCategory;
  type?: AchievementType;
  unlocked?: boolean;
  progress?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 成就创建数据
 */
export interface AchievementCreateData {
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  difficulty: number; // 1-5
  points: number;
  icon?: string;
  badge?: string;
  requirements: Record<string, any>;
  rewards?: Record<string, any>;
  isActive?: boolean;
  isSecret?: boolean;
  prerequisites?: string[];
}

/**
 * 成就更新数据
 */
export interface AchievementUpdateData {
  name?: string;
  description?: string;
  category?: AchievementCategory;
  type?: AchievementType;
  difficulty?: number;
  points?: number;
  icon?: string;
  badge?: string;
  requirements?: Record<string, any>;
  rewards?: Record<string, any>;
  isActive?: boolean;
  isSecret?: boolean;
  prerequisites?: string[];
}

/**
 * 成就进度数据
 */
export interface AchievementProgressData {
  userId: string;
  achievementId: string;
  progress: number; // 0-100
  currentValue?: number;
  targetValue?: number;
  metadata?: Record<string, any>;
}

/**
 * 成就解锁数据
 */
export interface AchievementUnlockData {
  userId: string;
  achievementId: string;
  unlockedAt?: Date;
  evidence?: string[];
  metadata?: Record<string, any>;
}

/**
 * 成就统计信息
 */
export interface AchievementStats {
  total: number;
  byCategory: Record<AchievementCategory, number>;
  byType: Record<AchievementType, number>;
  byDifficulty: Record<number, number>;
  totalPoints: number;
  averagePoints: number;
  unlockedCount: Record<string, number>;
  popularAchievements: Achievement[];
  rareAchievements: Achievement[];
}

/**
 * 用户成就统计
 */
export interface UserAchievementStats {
  userId: string;
  totalAchievements: number;
  unlockedAchievements: number;
  totalPoints: number;
  completionRate: number;
  byCategory: Record<AchievementCategory, {
    total: number;
    unlocked: number;
    points: number;
  }>;
  recentUnlocks: UserAchievement[];
  nextAchievements: Achievement[];
  rank?: number;
  percentile?: number;
}

/**
 * 成就排行榜项目
 */
export interface AchievementLeaderboardItem {
  userId: string;
  username: string;
  avatar?: string;
  totalPoints: number;
  achievementCount: number;
  rank: number;
  badges: string[];
}

/**
 * 成就事件接口
 */
export interface AchievementEvents {
  'achievement:created': (achievement: Achievement) => void;
  'achievement:updated': (achievement: Achievement) => void;
  'achievement:deleted': (achievementId: string) => void;
  'achievement:unlocked': (userAchievement: UserAchievement) => void;
  'achievement:progress': (progress: AchievementProgressData) => void;
  'achievement:milestone': (userId: string, milestone: string) => void;
  'achievement:error': (error: ServiceError) => void;
}

/**
 * 成就服务类
 */
export class AchievementService extends BaseService implements IService {
  private apiClient: ApiClient;
  private eventEmitter: EventEmitter<AchievementEvents>;
  private achievementCache: Map<string, { achievement: Achievement; timestamp: number }>;
  private userAchievementCache: Map<string, { achievements: UserAchievement[]; timestamp: number }>;
  private readonly CACHE_TTL = 600000; // 10分钟缓存

  constructor(config: ApiConfig) {
    super(config, 'AchievementService', '1.0.0');
    
    this.apiClient = new ApiClient(
      config.baseURL,
      {
        'Content-Type': 'application/json'
      }
    );

    this.eventEmitter = new EventEmitter();
    this.achievementCache = new Map();
    this.userAchievementCache = new Map();
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
    this.achievementCache.clear();
    this.userAchievementCache.clear();
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/achievements/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取成就列表
   */
  async getAchievements(params: AchievementQueryParams = {}): Promise<PaginatedResponse<Achievement>> {
    try {
      const url = buildURL('', '/achievements', params);
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<Achievement>;
      
      // 缓存成就数据
      result.data.forEach((achievement: Achievement) => {
        this.setAchievementCache(achievement.id, achievement);
      });
      
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_LIST_FETCHED, { achievements: result.data, params });
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'getAchievements', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '获取成就列表失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 根据ID获取成就
   */
  async getAchievementById(achievementId: string, useCache: boolean = true): Promise<Achievement> {
    // 检查缓存
    if (useCache) {
      const cached = this.getAchievementFromCache(achievementId);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.apiClient.get(`/achievements/${achievementId}`);
      const achievement = response.data as Achievement;
      
      // 更新缓存
      this.setAchievementCache(achievementId, achievement);
      
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_FETCHED, { achievement });
      return achievement;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'getAchievementById', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`成就 ${achievementId} 不存在`, 'achievement', 'AchievementService');
      }
      serviceError.message = '获取成就失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 创建成就
   */
  async createAchievement(achievementData: AchievementCreateData): Promise<Achievement> {
    try {
      const response = await this.apiClient.post('/achievements', achievementData);
      const achievement = response.data as Achievement;
      
      // 更新缓存
      this.setAchievementCache(achievement.id, achievement);
      
      this.eventEmitter.emit('achievement:created', achievement);
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_CREATED, { achievement });
      
      return achievement;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'createAchievement', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('成就数据验证失败', [{ field: 'achievementData', message: '成就数据验证失败', code: 'VALIDATION_FAILED' }], 'AchievementService');
      }
      serviceError.message = '创建成就失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新成就
   */
  async updateAchievement(achievementId: string, updateData: AchievementUpdateData): Promise<Achievement> {
    try {
      const response = await this.apiClient.put(`/achievements/${achievementId}`, updateData);
      const achievement = response.data as Achievement;
      
      // 更新缓存
      this.setAchievementCache(achievementId, achievement);
      
      this.eventEmitter.emit('achievement:updated', achievement);
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_UPDATED, { achievement });
      
      return achievement;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'updateAchievement', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`成就 ${achievementId} 不存在`, 'achievement', 'AchievementService');
      }
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('成就数据验证失败', [{ field: 'updateData', message: '成就数据验证失败', code: 'VALIDATION_FAILED' }], 'AchievementService');
      }
      serviceError.message = '更新成就失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 删除成就
   */
  async deleteAchievement(achievementId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/achievements/${achievementId}`);
      
      // 清除缓存
      this.achievementCache.delete(achievementId);
      
      this.eventEmitter.emit('achievement:deleted', achievementId);
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_DELETED, { achievementId });
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'deleteAchievement', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`成就 ${achievementId} 不存在`, 'achievement', 'AchievementService');
      }
      serviceError.message = '删除成就失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取用户成就
   */
  async getUserAchievements(userId: string, useCache: boolean = true): Promise<UserAchievement[]> {
    // 检查缓存
    if (useCache) {
      const cached = this.getUserAchievementsFromCache(userId);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.apiClient.get(`/users/${userId}/achievements`);
      const userAchievements = response.data as UserAchievement[];
      
      // 更新缓存
      this.setUserAchievementsCache(userId, userAchievements);
      
      this.emit(SERVICE_EVENTS.USER_ACHIEVEMENTS_FETCHED, { userId, achievements: userAchievements });
      return userAchievements;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'getUserAchievements', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'AchievementService');
      }
      serviceError.message = '获取用户成就失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新成就进度
   */
  async updateAchievementProgress(progressData: AchievementProgressData): Promise<UserAchievement> {
    try {
      const response = await this.apiClient.post('/achievements/progress', progressData);
      const userAchievement = response.data as UserAchievement;
      
      // 清除用户成就缓存，强制重新获取
      this.userAchievementCache.delete(progressData.userId);
      
      this.eventEmitter.emit('achievement:progress', progressData);
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_PROGRESS_UPDATED, { userAchievement, progress: progressData });
      
      // 检查是否解锁成就
      if (userAchievement.unlockedAt && progressData.progress >= 100) {
        this.eventEmitter.emit('achievement:unlocked', userAchievement);
        this.emit(SERVICE_EVENTS.ACHIEVEMENT_UNLOCKED, { userAchievement });
      }
      
      return userAchievement;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'updateAchievementProgress', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户或成就不存在`, 'userOrAchievement', 'AchievementService');
      }
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('成就进度数据验证失败', [{ field: 'progressData', message: '成就进度数据验证失败', code: 'VALIDATION_FAILED' }], 'AchievementService');
      }
      serviceError.message = '更新成就进度失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 解锁成就
   */
  async unlockAchievement(unlockData: AchievementUnlockData): Promise<UserAchievement> {
    try {
      const response = await this.apiClient.post('/achievements/unlock', unlockData);
      const userAchievement = response.data as UserAchievement;
      
      // 清除用户成就缓存，强制重新获取
      this.userAchievementCache.delete(unlockData.userId);
      
      this.eventEmitter.emit('achievement:unlocked', userAchievement);
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_UNLOCKED, { userAchievement });
      
      return userAchievement;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'unlockAchievement', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户或成就不存在`, 'userOrAchievement', 'AchievementService');
      }
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('成就解锁数据验证失败', [{ field: 'unlockData', message: '成就解锁数据验证失败', code: 'VALIDATION_FAILED' }], 'AchievementService');
      }
      serviceError.message = '解锁成就失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 搜索成就
   */
  async searchAchievements(query: string, filters: Partial<AchievementQueryParams> = {}): Promise<PaginatedResponse<Achievement>> {
    try {
      const params = { ...filters, search: query };
      const url = buildURL('', '/achievements/search', params);
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<Achievement>;
      
      // 缓存搜索结果中的成就
      result.data.forEach((achievement: Achievement) => {
        this.setAchievementCache(achievement.id, achievement);
      });
      
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_SEARCH_COMPLETED, { query, result });
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'searchAchievements', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '搜索成就失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取成就统计信息
   */
  async getAchievementStats(filters: Partial<AchievementQueryParams> = {}): Promise<AchievementStats> {
    try {
      const url = buildURL('', '/achievements/stats', filters);
      const response = await this.apiClient.get(url);

      const stats = response.data as AchievementStats;
      
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_STATS_FETCHED, { stats });
      return stats;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'getAchievementStats', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '获取成就统计信息失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取用户成就统计
   */
  async getUserAchievementStats(userId: string): Promise<UserAchievementStats> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/achievement-stats`);
      const stats = response.data as UserAchievementStats;
      
      this.emit(SERVICE_EVENTS.USER_ACHIEVEMENT_STATS_FETCHED, { userId, stats });
      return stats;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'getUserAchievementStats', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'AchievementService');
      }
      serviceError.message = '获取用户成就统计失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取成就排行榜
   */
  async getAchievementLeaderboard(limit: number = 50, offset: number = 0): Promise<AchievementLeaderboardItem[]> {
    try {
      const url = buildURL('', '/achievements/leaderboard', { limit, offset });
      const response = await this.apiClient.get(url);
      const leaderboard = response.data as AchievementLeaderboardItem[];
      
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_LEADERBOARD_FETCHED, { leaderboard });
      return leaderboard;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'getAchievementLeaderboard', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '获取成就排行榜失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取推荐成就
   */
  async getRecommendedAchievements(userId: string, limit: number = 10): Promise<Achievement[]> {
    try {
      const url = buildURL('', `/users/${userId}/recommended-achievements`, { limit });
      const response = await this.apiClient.get(url);
      const achievements = response.data as Achievement[];
      
      // 缓存推荐成就
      achievements.forEach(achievement => {
        this.setAchievementCache(achievement.id, achievement);
      });
      
      this.emit(SERVICE_EVENTS.RECOMMENDED_ACHIEVEMENTS_FETCHED, { userId, achievements });
      return achievements;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'getRecommendedAchievements', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'AchievementService');
      }
      serviceError.message = '获取推荐成就失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取即将解锁的成就
   */
  async getUpcomingAchievements(userId: string, limit: number = 5): Promise<UserAchievement[]> {
    try {
      const url = buildURL('', `/users/${userId}/upcoming-achievements`, { limit });
      const response = await this.apiClient.get(url);
      const achievements = response.data as UserAchievement[];
      
      this.emit(SERVICE_EVENTS.UPCOMING_ACHIEVEMENTS_FETCHED, { userId, achievements });
      return achievements;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'getUpcomingAchievements', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'AchievementService');
      }
      serviceError.message = '获取即将解锁的成就失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 批量获取成就
   */
  async getAchievementsByIds(achievementIds: string[]): Promise<Achievement[]> {
    try {
      const response = await this.apiClient.post('/achievements/batch', { achievementIds });
      const achievements = response.data as Achievement[];
      
      // 更新缓存
      achievements.forEach(achievement => {
        this.setAchievementCache(achievement.id, achievement);
      });
      
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_BATCH_FETCHED, { achievements });
      return achievements;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'getAchievementsByIds', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '批量获取成就失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 检查成就条件
   */
  async checkAchievementConditions(userId: string, achievementId?: string): Promise<UserAchievement[]> {
    try {
      const params = achievementId ? { achievementId } : {};
      const response = await this.apiClient.post(`/users/${userId}/check-achievements`, params);
      const updatedAchievements = response.data as UserAchievement[];
      
      // 清除用户成就缓存，强制重新获取
      this.userAchievementCache.delete(userId);
      
      // 发送解锁事件
      updatedAchievements.forEach(achievement => {
        if (achievement.unlockedAt) {
          this.eventEmitter.emit('achievement:unlocked', achievement);
        }
      });
      
      this.emit(SERVICE_EVENTS.ACHIEVEMENT_CONDITIONS_CHECKED, { userId, updatedAchievements });
      return updatedAchievements;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AchievementService', 'checkAchievementConditions', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'AchievementService');
      }
      serviceError.message = '检查成就条件失败';
      this.eventEmitter.emit('achievement:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 清除成就缓存
   */
  clearAchievementCache(achievementId?: string): void {
    if (achievementId) {
      this.achievementCache.delete(achievementId);
    } else {
      this.achievementCache.clear();
    }
  }

  /**
   * 清除用户成就缓存
   */
  clearUserAchievementCache(userId?: string): void {
    if (userId) {
      this.userAchievementCache.delete(userId);
    } else {
      this.userAchievementCache.clear();
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { achievements: number; userAchievements: number } {
    return {
      achievements: this.achievementCache.size,
      userAchievements: this.userAchievementCache.size
    };
  }

  /**
   * 监听成就事件
   */
  onAchievementEvent<K extends keyof AchievementEvents>(event: K, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * 移除成就事件监听
   */
  offAchievementEvent<K extends keyof AchievementEvents>(event: K, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * 从缓存获取成就
   */
  private getAchievementFromCache(achievementId: string): Achievement | null {
    const cached = this.achievementCache.get(achievementId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.achievement;
    }
    if (cached) {
      this.achievementCache.delete(achievementId);
    }
    return null;
  }

  /**
   * 设置成就缓存
   */
  private setAchievementCache(achievementId: string, achievement: Achievement): void {
    this.achievementCache.set(achievementId, {
      achievement,
      timestamp: Date.now()
    });
  }

  /**
   * 从缓存获取用户成就
   */
  private getUserAchievementsFromCache(userId: string): UserAchievement[] | null {
    const cached = this.userAchievementCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.achievements;
    }
    if (cached) {
      this.userAchievementCache.delete(userId);
    }
    return null;
  }

  /**
   * 设置用户成就缓存
   */
  private setUserAchievementsCache(userId: string, achievements: UserAchievement[]): void {
    this.userAchievementCache.set(userId, {
      achievements,
      timestamp: Date.now()
    });
  }

  /**
   * 启动缓存清理
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // 清理成就缓存
      for (const [achievementId, cached] of this.achievementCache.entries()) {
        if (now - cached.timestamp >= this.CACHE_TTL) {
          this.achievementCache.delete(achievementId);
        }
      }
      
      // 清理用户成就缓存
      for (const [userId, cached] of this.userAchievementCache.entries()) {
        if (now - cached.timestamp >= this.CACHE_TTL) {
          this.userAchievementCache.delete(userId);
        }
      }
    }, 60000); // 每分钟清理一次过期缓存
  }
}

// 全局成就服务实例
let achievementServiceInstance: AchievementService | null = null;

/**
 * 创建成就服务实例
 */
export function createAchievementService(config: ApiConfig): AchievementService {
  return new AchievementService(config);
}

/**
 * 获取成就服务实例
 */
export function getAchievementService(): AchievementService | null {
  return achievementServiceInstance;
}

/**
 * 初始化成就服务
 */
export async function initAchievementService(config: ApiConfig): Promise<AchievementService> {
  if (achievementServiceInstance) {
    await achievementServiceInstance.destroy();
  }
  
  achievementServiceInstance = new AchievementService(config);
  await achievementServiceInstance.initialize();
  
  return achievementServiceInstance;
}

/**
 * 销毁成就服务
 */
export async function destroyAchievementService(): Promise<void> {
  if (achievementServiceInstance) {
    await achievementServiceInstance.destroy();
    achievementServiceInstance = null;
  }
}



// 导出默认实例
export default AchievementService;