import { API_ENDPOINTS } from '@/config/api';
import { logger } from '@/shared/utils/logger';

export interface OAuthCallbackRequest {
  provider: string;
  code: string;
  state?: string;
  user_info?: Record<string, unknown>;
}

export interface OAuthCallbackResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    provider: string;
    role?: string;
    level?: string;
    skills?: string[];
    points?: number;
    completedTasks?: number;
    rating?: number;
  };
  token: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role?: string;
    level?: string;
    skills?: string[];
    points?: number;
    completedTasks?: number;
    rating?: number;
  };
  token: string;
  refreshToken?: string;
}

class AuthApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_APP_API_URL || 'http://localhost:8001/api';
  }

  /**
   * OAuth回调处理
   */
  async handleOAuthCallback(
    request: OAuthCallbackRequest
  ): Promise<OAuthCallbackResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.auth.oauthCallback}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      logger.error('OAuth callback API error:', error);
      throw error;
    }
  }

  /**
   * 普通登录
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.auth.login}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      logger.error('Login API error:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  async getProfile(token: string): Promise<{
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role?: string;
    level?: string;
    skills?: string[];
    points?: number;
    completedTasks?: number;
    rating?: number;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.auth.profile}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      logger.error('Get profile API error:', error);
      throw error;
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    token: string;
    refreshToken?: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.auth.refresh}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      logger.error('Refresh token API error:', error);
      throw error;
    }
  }

  /**
   * 登出
   */
  async logout(token: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.auth.logout}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }
    } catch (error) {
      logger.error('Logout API error:', error);
      throw error;
    }
  }
}

export const authApiService = new AuthApiService();
