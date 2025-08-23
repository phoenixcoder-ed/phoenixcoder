import { AuthProvider } from 'react-admin';

import { logger } from '@/shared/utils/logger';

import { login as apiLogin, logout as apiLogout, LoginResponse } from './api';

export const authProvider: AuthProvider = {
  login: async (credentials) => {
    try {
      const data: LoginResponse = await apiLogin(credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return Promise.resolve();
    } catch (error: unknown) {
      return Promise.reject(
        new Error(error instanceof Error ? error.message : '登录失败')
      );
    }
  },

  logout: async () => {
    try {
      // 调用后端注销 API
      await apiLogout();
    } catch (error: unknown) {
      // 即使后端注销失败，也要清除本地存储
      logger.debug('后端注销失败，但仍会清除本地存储:', error);
    } finally {
      // 无论如何都要清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.resolve();
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    return token ? Promise.resolve() : Promise.reject(new Error('未登录'));
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return Promise.reject(new Error('认证失败，请重新登录'));
    }
    return Promise.resolve();
  },

  getPermissions: () => {
    const user = localStorage.getItem('user');
    if (user) {
      const { user_type } = JSON.parse(user);
      return Promise.resolve([user_type]);
    }
    return Promise.resolve([]);
  },

  getUserIdentity: () => {
    const user = localStorage.getItem('user');
    if (user) {
      return Promise.resolve(JSON.parse(user));
    }
    return Promise.reject(new Error('未找到用户信息'));
  },
};

export default authProvider;
