import axios, { InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '@/config/api';
import { logger } from '@/shared/utils/logger';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器添加token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 定义登录响应类型接口
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    user_type: 'programmer' | 'merchant' | 'admin';
    // 可以根据实际情况添加更多字段
  };
}

// 定义注册响应类型接口
export interface RegisterResponse {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  user_type: 'programmer' | 'merchant' | 'admin';
  // 可以根据实际情况添加更多字段
}

// 登录API
export const login = async (credentials: {
  email?: string;
  phone?: string;
  username?: string;
  password: string;
}): Promise<LoginResponse> => {
  try {
    // 调用后端的直接登录接口
    const response = await api.post<{
      access_token: string;
      token_type: string;
      user: LoginResponse['user'];
    }>('/auth/login', credentials);

    // 转换响应格式以匹配前端期望的格式
    return {
      token: response.data.access_token,
      user: response.data.user,
    };
  } catch (error) {
    throw new Error(
      '登录失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 注册API
export const register = async (userData: {
  email?: string;
  phone?: string;
  name: string;
  password: string;
  user_type: 'programmer' | 'merchant' | 'admin';
}): Promise<RegisterResponse> => {
  try {
    const response = await api.post<RegisterResponse>('/register', userData);
    return response.data;
  } catch (error) {
    throw new Error(
      '注册失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 获取当前用户信息
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/oidc/userinfo');
    return response.data;
  } catch {
    throw new Error('获取用户信息失败');
  }
};

// 注销API
export const logout = async (): Promise<void> => {
  try {
    await api.post('/logout');
  } catch (error) {
    // 即使后端注销失败，我们也应该清除本地存储
    logger.warn('后端注销失败，但将继续清除本地存储:', error);
  }
};

export default api;
