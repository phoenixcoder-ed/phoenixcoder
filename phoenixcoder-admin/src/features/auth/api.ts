
import axios, {InternalAxiosRequestConfig } from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
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
  password: string;
  login_type: 'email' | 'phone';
}): Promise<LoginResponse> => {
  try {
    // 注意：这里我们直接调用OIDC服务的登录端点
    // 在实际项目中，可能需要先获取授权码，再获取token
    const response = await api.post<LoginResponse>('/oidc/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error('登录失败: ' + (error instanceof Error ? error.message : '未知错误'));
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
    throw new Error('注册失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
};

// 获取当前用户信息
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/oidc/userinfo');
    return response.data;
  } catch (error) {
    throw new Error('获取用户信息失败');
  }
};

export default api;