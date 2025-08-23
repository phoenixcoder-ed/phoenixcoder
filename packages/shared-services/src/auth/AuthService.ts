import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, NotFoundError, ValidationError, AuthenticationError, AuthorizationError, handleUnknownError, ServiceErrorType } from '../types/ServiceError';
import { AuthConfig } from '../types/ServiceConfig';

import { User, TokenPair, LoginRequest, RegisterRequest, LoginResponse, AuthUser } from '@phoenixcoder/shared-types';
import { ApiClient } from '@phoenixcoder/shared-utils';
import { EventEmitter } from 'eventemitter3';

/**
 * 认证状态接口
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: TokenPair | null;
  permissions: string[];
  roles: string[];
}

/**
 * 认证事件接口
 */
export interface AuthEvents {
  'auth:login': (user: AuthUser, token: TokenPair) => void;
  'auth:logout': () => void;
  'auth:refresh': (token: TokenPair) => void;
  'auth:error': (error: ServiceError) => void;
  'auth:state-change': (state: AuthState) => void;
}

/**
 * 认证服务类
 */
export class AuthService extends BaseService implements IService {
  private apiClient: ApiClient;
  private authState: AuthState;
  private refreshTimer?: NodeJS.Timeout;
  private eventEmitter: EventEmitter<AuthEvents>;

  constructor(config: AuthConfig) {
    super(config, 'AuthService', '1.0.0');
    
    this.apiClient = new ApiClient(
      config.authServerURL,
      {
        'Content-Type': 'application/json'
      }
    );

    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      permissions: [],
      roles: []
    };

    this.eventEmitter = new EventEmitter();
    this.setupApiInterceptors();
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 尝试从存储中恢复认证状态
    await this.restoreAuthState();
    
    // 如果有token，验证其有效性
    if (this.authState.token) {
      await this.validateToken();
    }
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.eventEmitter.removeAllListeners();
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/auth/health');
      return response.status === 200;
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<{ user: AuthUser; token: TokenPair }> {
    try {
      const response = await this.apiClient.post('/auth/login', credentials);
      const { user, token } = response.data;

      await this.setAuthState({
        isAuthenticated: true,
        user,
        token,
        permissions: user.permissions || [],
        roles: user.roles || []
      });

      this.scheduleTokenRefresh(token);
      this.eventEmitter.emit('auth:login', user, token);

      return { user, token };
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AuthService', 'login', ServiceErrorType.AUTHENTICATION);
      serviceError.message = '登录失败';
      this.eventEmitter.emit('auth:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<{ user: AuthUser; token: TokenPair }> {
    try {
      const response = await this.apiClient.post('/auth/register', data);
      const { user, token } = response.data;

      await this.setAuthState({
        isAuthenticated: true,
        user,
        token,
        permissions: user.permissions || [],
        roles: user.roles || []
      });

      this.scheduleTokenRefresh(token);
      this.eventEmitter.emit('auth:login', user, token);

      return { user, token };
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AuthService', 'register', ServiceErrorType.AUTHENTICATION);
      serviceError.message = '注册失败';
      this.eventEmitter.emit('auth:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      if (this.authState.token) {
        await this.apiClient.post('/auth/logout', {
          token: this.authState.token.accessToken
        });
      }
    } catch (error: unknown) {
      // 忽略登出错误，继续清理本地状态
      console.warn('Logout request failed:', error);
    } finally {
      await this.clearAuthState();
      this.eventEmitter.emit('auth:logout');
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<TokenPair> {
    if (!this.authState.token?.refreshToken) {
      throw new AuthenticationError('没有可用的刷新令牌', null, 'AuthService');
    }

    try {
      const response = await this.apiClient.post('/auth/refresh', {
        refreshToken: this.authState.token.refreshToken
      });
      
      const newToken = response.data.token;
      
      await this.setAuthState({
        ...this.authState,
        token: newToken
      });

      this.scheduleTokenRefresh(newToken);
      this.eventEmitter.emit('auth:refresh', newToken);

      return newToken;
    } catch (error: unknown) {
      const serviceError = handleUnknownError(error, 'AuthService', 'refreshToken', ServiceErrorType.AUTHENTICATION);
      serviceError.message = '令牌刷新失败';
      this.eventEmitter.emit('auth:error', serviceError);
      await this.clearAuthState();
      throw serviceError;
    }
  }

  /**
   * 验证令牌
   */
  async validateToken(): Promise<boolean> {
    if (!this.authState.token) {
      return false;
    }

    try {
      const response = await this.apiClient.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${this.authState.token.accessToken}`
        }
      });
      
      return response.status === 200;
    } catch (error: unknown) {
      await this.clearAuthState();
      return false;
    }
  }

  /**
   * 检查权限
   */
  hasPermission(permission: string): boolean {
    return this.authState.permissions.includes(permission);
  }

  /**
   * 检查角色
   */
  hasRole(role: string): boolean {
    return this.authState.roles.includes(role);
  }

  /**
   * 检查多个权限（AND逻辑）
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * 检查多个权限（OR逻辑）
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * 获取当前认证状态
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): AuthUser | null {
    return this.authState.user;
  }

  /**
   * 获取当前令牌
   */
  getCurrentToken(): TokenPair | null {
    return this.authState.token;
  }

  /**
   * 是否已认证
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * 监听认证事件
   */
  override on<T extends string | symbol>(event: T, fn: (...args: any[]) => void, context?: any): this {
    return super.on(event, fn, context);
  }

  /**
   * 监听认证事件（类型安全版本）
   */
  onAuthEvent<K extends keyof AuthEvents>(event: K, listener: (...args: Parameters<AuthEvents[K]>) => void): void {
    this.eventEmitter.on(event, listener as any);
  }

  /**
   * 移除认证事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: any[]) => void) | undefined, context?: any, once?: boolean | undefined): this {
    return super.off(event, fn, context, once);
  }

  /**
   * 移除认证事件监听（类型安全版本）
   */
  offAuthEvent<K extends keyof AuthEvents>(event: K, listener: (...args: Parameters<AuthEvents[K]>) => void): void {
    this.eventEmitter.off(event, listener as any);
  }

  /**
   * 设置认证状态
   */
  private async setAuthState(state: AuthState): Promise<void> {
    this.authState = { ...state };
    
    // 保存到本地存储
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_state', JSON.stringify({
        user: state.user,
        token: state.token,
        permissions: state.permissions,
        roles: state.roles
      }));
    }

    this.eventEmitter.emit('auth:state-change', this.authState);
  }

  /**
   * 清理认证状态
   */
  private async clearAuthState(): Promise<void> {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      permissions: [],
      roles: []
    };

    // 清理本地存储
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_state');
    }

    this.eventEmitter.emit('auth:state-change', this.authState);
  }

  /**
   * 从存储中恢复认证状态
   */
  private async restoreAuthState(): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem('auth_state');
      if (stored) {
        const data = JSON.parse(stored);
        this.authState = {
          isAuthenticated: !!data.token,
          user: data.user,
          token: data.token,
          permissions: data.permissions || [],
          roles: data.roles || []
        };

        if (data.token) {
          this.scheduleTokenRefresh(data.token);
        }
      }
    } catch (error: unknown) {
      console.warn('Failed to restore auth state:', error);
      await this.clearAuthState();
    }
  }

  /**
   * 安排令牌刷新
   */
  private scheduleTokenRefresh(token: TokenPair): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!token.expiresIn) {
      return;
    }

    // expiresIn 是秒数，转换为毫秒并计算刷新时间
    const refreshTime = (token.expiresIn - 60) * 1000; // 提前1分钟刷新

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch (error: unknown) {
          console.error('Auto refresh token failed:', error);
        }
      }, refreshTime);
    }
  }

  /**
   * 设置API拦截器
   */
  private setupApiInterceptors(): void {
    // 请求拦截器 - 自动添加认证头
    this.apiClient.addRequestInterceptor((config) => {
      if (this.authState.token?.accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${this.authState.token.accessToken}`;
      }
      return config;
    });

    // 响应拦截器 - 直接返回响应
    this.apiClient.addResponseInterceptor((response) => response);

    // 错误拦截器 - 处理认证错误
    this.apiClient.addErrorInterceptor(async (error: Error) => {
      const apiError = error as any;
      if (apiError.response?.status === 401) {
        // 尝试刷新令牌
        if (this.authState.token?.refreshToken) {
          try {
            await this.refreshToken();
            // 认证状态已更新，但不在这里重试请求
            // 重试逻辑应该由调用方处理
            throw new AuthenticationError('认证已刷新，请重试请求', null, 'AuthService');
          } catch (refreshError) {
            await this.clearAuthState();
            throw new AuthenticationError('认证已过期，请重新登录', refreshError, 'AuthService');
          }
        } else {
          await this.clearAuthState();
          throw new AuthenticationError('认证已过期，请重新登录', null, 'AuthService');
        }
      } else if (apiError.response?.status === 403) {
        throw new AuthorizationError('权限不足', apiError, 'AuthService');
      }
      throw error;
    });
  }
}

/**
 * 创建认证服务实例
 */
export function createAuthService(config: AuthConfig): AuthService {
  return new AuthService(config);
}

/**
 * 默认认证服务实例
 */
let defaultAuthService: AuthService | null = null;

/**
 * 获取默认认证服务实例
 */
export function getAuthService(): AuthService {
  if (!defaultAuthService) {
    throw new Error('Auth service not initialized. Call initAuthService first.');
  }
  return defaultAuthService;
}

/**
 * 初始化默认认证服务
 */
export function initAuthService(config: AuthConfig): AuthService {
  defaultAuthService = new AuthService(config);
  return defaultAuthService;
}

/**
 * 销毁默认认证服务
 */
export async function destroyAuthService(): Promise<void> {
  if (defaultAuthService) {
    await defaultAuthService.destroy();
    defaultAuthService = null;
  }
}