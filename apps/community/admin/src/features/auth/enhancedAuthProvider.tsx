import { AuthProvider } from 'react-admin';

import { logger } from '@/shared/utils/logger';

import { login as apiLogin, LoginResponse } from './api';

export const enhancedAuthProvider: AuthProvider = {
  login: async (credentials) => {
    try {
      const data: LoginResponse = await apiLogin(credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return Promise.resolve();
    } catch (error) {
      // 统一错误处理
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      logger.error('Login error:', error);

      // 抛出错误让全局错误处理器处理
      return Promise.reject(new Error(errorMessage));
    }
  },

  logout: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return Promise.resolve();
    } catch (error) {
      logger.error('Logout error:', error);
      return Promise.resolve(); // 即使出错也要允许登出
    }
  },

  checkAuth: () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return Promise.reject(new Error('未登录'));
      }

      // 检查 token 是否过期（如果有过期时间）
      try {
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          // 这里可以添加 token 过期检查逻辑
          if (
            userData.tokenExpiry &&
            new Date() > new Date(userData.tokenExpiry)
          ) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return Promise.reject(new Error('登录已过期'));
          }
        }
      } catch (parseError) {
        logger.error('Error parsing user data:', parseError);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.reject(new Error('用户数据损坏，请重新登录'));
      }

      return Promise.resolve();
    } catch (error) {
      logger.error('Auth check error:', error);
      return Promise.reject(new Error('认证检查失败'));
    }
  },

  checkError: (error) => {
    const status = error.status || error.response?.status;

    logger.error('Auth error check:', {
      status,
      message: error.message,
      timestamp: new Date().toISOString(),
    });

    // 认证相关错误
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return Promise.reject(new Error('认证失败，请重新登录'));
    }

    // 权限相关错误
    if (status === 403) {
      return Promise.reject(new Error('权限不足，无法访问此资源'));
    }

    // 其他错误不在这里处理，让全局错误处理器处理
    return Promise.resolve();
  },

  getPermissions: () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        const permissions = userData.user_type ? [userData.user_type] : [];

        // 可以根据用户类型添加更多权限
        if (userData.roles) {
          permissions.push(...userData.roles);
        }

        return Promise.resolve(permissions);
      }
      return Promise.resolve([]);
    } catch (error) {
      logger.error('Get permissions error:', error);
      return Promise.resolve([]);
    }
  },

  getUserIdentity: () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return Promise.resolve({
          id: userData.id,
          fullName: userData.username || userData.email || '未知用户',
          avatar: userData.avatar,
          email: userData.email,
          userType: userData.user_type,
          ...userData,
        });
      }
      return Promise.reject(new Error('未找到用户信息'));
    } catch (error) {
      logger.error('Get user identity error:', error);
      return Promise.reject(new Error('获取用户信息失败'));
    }
  },
};

export default enhancedAuthProvider;
