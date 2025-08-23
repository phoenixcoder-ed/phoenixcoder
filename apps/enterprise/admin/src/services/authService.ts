/**
 * 认证服务
 * 处理登录、注册、用户信息等认证相关功能
 */

import { apiClient } from './api';

// 类型定义
export interface LoginRequest {
  email?: string;
  phone?: string;
  username?: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  userType?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: string;
}

export interface ApiError {
  detail: string;
}

/**
 * 认证服务类
 */
class AuthService {
  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('AuthService.login - 接收到的凭据:', credentials);
      console.log('AuthService.login - 凭据类型:', typeof credentials);
      console.log('AuthService.login - 凭据JSON:', JSON.stringify(credentials));

      // 确保发送正确的数据格式
      const loginData = {
        ...credentials,
      };

      console.log('AuthService.login - 发送的数据:', loginData);

      const response = await apiClient.post<AuthResponse>(
        '/auth/login',
        loginData
      );

      // 保存token到localStorage
      if (response.accessToken) {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  /**
   * 用户注册
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/register',
        userData
      );

      // 保存token到localStorage
      if (response.accessToken) {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<UserInfo> {
    try {
      const response = await apiClient.get<UserInfo>('/auth/me');

      // 更新本地存储的用户信息
      localStorage.setItem('user', JSON.stringify(response));

      return response;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 用户注销
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('注销请求失败:', error);
      // 即使服务器注销失败，也要清除本地数据
    } finally {
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  /**
   * 检查用户是否已登录
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /**
   * 获取本地存储的用户信息
   */
  getLocalUser(): UserInfo | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('解析本地用户信息失败:', error);
      return null;
    }
  }

  /**
   * 获取本地存储的token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * 清除认证信息
   */
  clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * 验证邮箱格式
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
}

// 创建并导出认证服务实例
export const authService = new AuthService();

// 默认导出
export default authService;
