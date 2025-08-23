import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ServiceErrorType, ValidationError, NotFoundError, handleUnknownError } from '../types/ServiceError';
import { ApiConfig } from '../types/ServiceConfig';

import { User, UserProfile, UserPreferences, UserStats, PaginatedResponse } from '@phoenixcoder/shared-types';
import { ApiClient, buildURL } from '@phoenixcoder/shared-utils';
import { EventEmitter } from 'eventemitter3';

/**
 * 用户查询参数
 */
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  skills?: string[];
  level?: string;
}

/**
 * 用户更新数据
 */
export interface UserUpdateData {
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  skills?: string[];
  preferences?: Partial<UserPreferences>;
}

/**
 * 用户事件接口
 */
export interface UserEvents {
  'user:created': (user: User) => void;
  'user:updated': (user: User) => void;
  'user:deleted': (userId: string) => void;
  'user:fetched': (users: User[]) => void;
  'user:profile-fetched': (profile: UserProfile) => void;
  'user:profile-updated': (profile: UserProfile) => void;
  'user:preferences-fetched': (preferences: UserPreferences) => void;
  'user:preferences-updated': (preferences: UserPreferences) => void;
  'user:stats-fetched': (stats: UserStats) => void;
  'user:search-completed': (data: { query: string; users: User[] }) => void;
  'user:avatar-uploaded': (data: { userId: string; avatarUrl: string }) => void;
  'user:batch-fetched': (users: User[]) => void;
  'user:error': (error: ServiceError) => void;
}

/**
 * 用户服务类
 */
export class UserService extends BaseService implements IService {
  private apiClient: ApiClient;
  private eventEmitter: EventEmitter;
  private userCache: Map<string, { user: User; timestamp: number }>;
  private readonly CACHE_TTL = 300000; // 5分钟缓存
  private baseURL: string;

  constructor(config: ApiConfig) {
    super(config, 'UserService', '1.0.0');
    
    this.baseURL = config.baseURL;
    this.apiClient = new ApiClient(
      config.baseURL,
      {
        'Content-Type': 'application/json'
      }
    );

    this.eventEmitter = new EventEmitter();
    this.userCache = new Map();
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
    this.userCache.clear();
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/users/health');
      return response.success;
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * 获取用户列表
   */
  async getUsers(params: UserQueryParams = {}): Promise<PaginatedResponse<User>> {
    try {
      const url = buildURL(this.baseURL, '/users', params);
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<User>;
      
      // 缓存用户数据
      result.data.forEach(user => {
        this.setUserCache(user.id, user);
      });
      
      this.eventEmitter.emit('user:fetched', result.data);
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'getUsers', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '获取用户列表失败';
      serviceError.code = 'USER_LIST_FETCH_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(userId: string, useCache: boolean = true): Promise<User> {
    // 检查缓存
    if (useCache) {
      const cached = this.getUserFromCache(userId);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.apiClient.get(`/users/${userId}`);
      const user = response.data as User;
      
      // 更新缓存
      this.setUserCache(userId, user);
      
      this.eventEmitter.emit('user:fetched', [user]);
      return user;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'getUserById', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'UserService');
      }
      serviceError.message = '获取用户失败';
      serviceError.code = 'USER_FETCH_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<User> {
    try {
      const response = await this.apiClient.get(`/users/username/${username}`);
      const user = response.data as User;
      
      // 更新缓存
      this.setUserCache(user.id, user);
      
      this.eventEmitter.emit('user:fetched', [user]);
      return user;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'getUserByUsername', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户名 ${username} 不存在`, 'user', 'UserService');
      }
      serviceError.message = '获取用户失败';
      serviceError.code = 'USER_FETCH_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 创建用户
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const response = await this.apiClient.post('/users', userData);
      const user = response.data as User;
      
      // 更新缓存
      this.setUserCache(user.id, user);
      
      this.eventEmitter.emit('user:created', user);
      
      return user;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'createUser', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('用户数据验证失败', [{
          field: 'userData',
          message: '用户数据格式不正确',
          code: 'INVALID_USER_DATA'
        }], 'UserService');
      }
      serviceError.message = '创建用户失败';
      serviceError.code = 'USER_CREATE_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新用户
   */
  async updateUser(userId: string, updateData: UserUpdateData): Promise<User> {
    try {
      const response = await this.apiClient.put(`/users/${userId}`, updateData);
      const user = response.data as User;
      
      // 更新缓存
      this.setUserCache(userId, user);
      
      this.eventEmitter.emit('user:updated', user);
      
      return user;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'updateUser', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'UserService');
      }
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('用户数据验证失败', [{
          field: 'updateData',
          message: '更新数据格式不正确',
          code: 'INVALID_UPDATE_DATA'
        }], 'UserService');
      }
      serviceError.message = '更新用户失败';
      serviceError.code = 'USER_UPDATE_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/users/${userId}`);
      
      // 清除缓存
      this.userCache.delete(userId);
      
      this.eventEmitter.emit('user:deleted', userId);
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'deleteUser', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'UserService');
      }
      serviceError.message = '删除用户失败';
      serviceError.code = 'USER_DELETE_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取用户资料
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/profile`);
      const profile = response.data as UserProfile;
      
      this.eventEmitter.emit('user:profile-fetched', profile);
      return profile;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'getUserProfile', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 的资料不存在`, 'userProfile', 'UserService');
      }
      serviceError.message = '获取用户资料失败';
      serviceError.code = 'USER_PROFILE_FETCH_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新用户资料
   */
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await this.apiClient.put(`/users/${userId}/profile`, profileData);
      const profile = response.data as UserProfile;
      
      this.eventEmitter.emit('user:profile-updated', profile);
      
      return profile;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'updateUserProfile', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'UserService');
      }
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('用户资料数据验证失败', [{
          field: 'profileData',
          message: '资料数据格式不正确',
          code: 'INVALID_PROFILE_DATA'
        }], 'UserService');
      }
      serviceError.message = '更新用户资料失败';
      serviceError.code = 'USER_PROFILE_UPDATE_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取用户偏好设置
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/preferences`);
      const preferences = response.data as UserPreferences;
      
      this.eventEmitter.emit('user:preferences-fetched', preferences);
      return preferences;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'getUserPreferences', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 的偏好设置不存在`, 'userPreferences', 'UserService');
      }
      serviceError.message = '获取用户偏好设置失败';
      serviceError.code = 'USER_PREFERENCES_FETCH_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新用户偏好设置
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const response = await this.apiClient.put(`/users/${userId}/preferences`, preferences);
      const updatedPreferences = response.data as UserPreferences;
      
      this.eventEmitter.emit('user:preferences-updated', updatedPreferences);
      
      return updatedPreferences;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'updateUserPreferences', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'UserService');
      }
      if (serviceError.details?.response?.status === 400) {
        throw new ValidationError('用户偏好设置数据验证失败', [{
          field: 'preferences',
          message: '偏好设置数据格式不正确',
          code: 'INVALID_PREFERENCES_DATA'
        }], 'UserService');
      }
      serviceError.message = '更新用户偏好设置失败';
      serviceError.code = 'USER_PREFERENCES_UPDATE_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/stats`);
      const stats = response.data as UserStats;
      
      this.eventEmitter.emit('user:stats-fetched', stats);
      return stats;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'getUserStats', ServiceErrorType.BUSINESS_LOGIC);
      if (serviceError.details?.response?.status === 404) {
        throw new NotFoundError(`用户 ${userId} 的统计信息不存在`, 'userStats', 'UserService');
      }
      serviceError.message = '获取用户统计信息失败';
      serviceError.code = 'USER_STATS_FETCH_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(query: string, filters: Partial<UserQueryParams> = {}): Promise<PaginatedResponse<User>> {
    try {
      const params = { ...filters, search: query };
      const url = buildURL(this.baseURL, '/users/search', params);
      const response = await this.apiClient.get(url);
      const result = response.data as PaginatedResponse<User>;
      
      // 缓存搜索结果中的用户
      result.data.forEach(user => {
        this.setUserCache(user.id, user);
      });
      
      this.eventEmitter.emit('user:search-completed', { query, users: result.data });
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'searchUsers', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '搜索用户失败';
      serviceError.code = 'USER_SEARCH_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 上传用户头像
   */
  async uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await this.apiClient.post(`/users/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const result = response.data as { avatarUrl: string };
      
      // 更新缓存中的用户头像
      const cachedUser = this.getUserFromCache(userId);
      if (cachedUser) {
        cachedUser.avatar = result.avatarUrl;
        this.setUserCache(userId, cachedUser);
      }
      
      this.eventEmitter.emit('user:avatar-uploaded', { userId, avatarUrl: result.avatarUrl });
      return result;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'uploadAvatar', ServiceErrorType.BUSINESS_LOGIC);
      
      if (serviceError.httpStatus === 404) {
        throw new NotFoundError(`用户 ${userId} 不存在`, 'user', 'UserService');
      }
      if (serviceError.httpStatus === 400) {
        throw new ValidationError('文件验证失败', [{
          field: 'avatar',
          message: '文件格式或大小不符合要求',
          code: 'INVALID_FILE'
        }], 'UserService');
      }
      
      serviceError.message = '上传用户头像失败';
      serviceError.code = 'AVATAR_UPLOAD_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 批量获取用户
   */
  async getUsersByIds(userIds: string[]): Promise<User[]> {
    try {
      const response = await this.apiClient.post('/users/batch', { userIds });
      const users = response.data as User[];
      
      // 更新缓存
      users.forEach(user => {
        this.setUserCache(user.id, user);
      });
      
      this.eventEmitter.emit('user:batch-fetched', users);
      return users;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'UserService', 'getUsersByIds', ServiceErrorType.BUSINESS_LOGIC);
      serviceError.message = '批量获取用户失败';
      serviceError.code = 'BATCH_USER_FETCH_FAILED';
      this.eventEmitter.emit('user:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 清除用户缓存
   */
  clearUserCache(userId?: string): void {
    if (userId) {
      this.userCache.delete(userId);
    } else {
      this.userCache.clear();
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; users: string[] } {
    return {
      size: this.userCache.size,
      users: Array.from(this.userCache.keys())
    };
  }

  /**
   * 监听用户事件
   */
  onUserEvent<K extends keyof UserEvents>(event: K, listener: UserEvents[K]): void {
    this.eventEmitter.on(event as string, listener as any);
  }

  /**
   * 移除用户事件监听
   */
  offUserEvent<K extends keyof UserEvents>(event: K, listener: UserEvents[K]): void {
    this.eventEmitter.off(event as string, listener as any);
  }

  /**
   * 从缓存获取用户
   */
  private getUserFromCache(userId: string): User | null {
    const cached = this.userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.user;
    }
    if (cached) {
      this.userCache.delete(userId);
    }
    return null;
  }

  /**
   * 设置用户缓存
   */
  private setUserCache(userId: string, user: User): void {
    this.userCache.set(userId, {
      user,
      timestamp: Date.now()
    });
  }

  /**
   * 启动缓存清理
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [userId, cached] of this.userCache.entries()) {
        if (now - cached.timestamp >= this.CACHE_TTL) {
          this.userCache.delete(userId);
        }
      }
    }, 60000); // 每分钟清理一次
  }
}

/**
 * 创建用户服务实例
 */
export function createUserService(config: ApiConfig): UserService {
  return new UserService(config);
}

/**
 * 默认用户服务实例
 */
let defaultUserService: UserService | null = null;

/**
 * 获取默认用户服务实例
 */
export function getUserService(): UserService {
  if (!defaultUserService) {
    throw new Error('User service not initialized. Call initUserService first.');
  }
  return defaultUserService;
}

/**
 * 初始化默认用户服务
 */
export function initUserService(config: ApiConfig): UserService {
  defaultUserService = new UserService(config);
  return defaultUserService;
}

/**
 * 销毁默认用户服务
 */
export async function destroyUserService(): Promise<void> {
  if (defaultUserService) {
    await defaultUserService.destroy();
    defaultUserService = null;
  }
}