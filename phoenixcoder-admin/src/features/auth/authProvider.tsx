import { AuthProvider } from 'react-admin';
import { login as apiLogin, register as apiRegister, getCurrentUser, LoginResponse } from './api';

export const authProvider: AuthProvider = {
  login: async (credentials) => {
    try {
      const data: LoginResponse = await apiLogin(credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(
        new Error(error instanceof Error ? error.message : '登录失败')
      );
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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