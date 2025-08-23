/**
 * API 服务配置
 * 统一管理所有API请求
 */

import { API_BASE_URL } from '@/config/api';
import { logger } from '@/shared/utils/logger';

// 请求拦截器
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // 默认请求头
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // 添加认证token
    const token = localStorage.getItem('token');
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    // 合并请求配置
    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // 处理HTTP错误
      if (!response.ok) {
        logger.debug('API请求失败 - 状态码:', response.status);
        logger.debug('API请求失败 - 状态文本:', response.statusText);

        let errorData = {};
        try {
          const responseText = await response.text();
          logger.debug('API请求失败 - 响应文本:', responseText);

          if (responseText) {
            errorData = JSON.parse(responseText);
            logger.debug('API请求失败 - 解析后的错误数据:', errorData);
          }
        } catch (parseError) {
          logger.error('解析错误响应失败:', parseError);
        }

        // 优先使用后端返回的错误信息
        const errorMessage =
          (errorData as { detail?: string; message?: string }).detail ||
          (errorData as { detail?: string; message?: string }).message ||
          `HTTP ${response.status}: ${response.statusText}`;

        logger.debug('API请求失败 - 最终错误信息:', errorMessage);
        throw new Error(errorMessage);
      }

      // 返回JSON数据
      return await response.json();
    } catch (error) {
      logger.error('API请求失败:', error);

      // 处理网络连接错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络连接或确认服务器是否正常运行');
      }

      // 处理超时错误
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }

      // 处理其他错误
      if (error instanceof Error) {
        throw error;
      }

      // 未知错误
      throw new Error('请求失败，请稍后重试');
    }
  }

  // GET请求
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST请求
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    logger.debug('ApiClient.post - 端点:', endpoint);
    logger.debug('ApiClient.post - 原始数据:', data);
    logger.debug('ApiClient.post - 数据类型:', typeof data);

    const body = data ? JSON.stringify(data) : undefined;
    logger.debug('ApiClient.post - 序列化后的body:', body);
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  // PUT请求
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient(API_BASE_URL);

// 导出基础URL供其他地方使用
export { API_BASE_URL };
