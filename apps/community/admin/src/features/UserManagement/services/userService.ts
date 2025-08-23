/**
 * 用户服务层
 * 遵循服务层解耦API原则，将API调用从组件中分离
 */

import { httpClient } from '@/shared/api/httpClient';

import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListResponse,
} from '../types';

// 用户查询参数接口
interface UserQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  userType?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

/**
 * 用户服务类
 */
export class UserService {
  private static readonly BASE_URL = '/api/users';

  /**
   * 获取用户列表
   */
  static async getUsers(
    params: UserQueryParams = {}
  ): Promise<UserListResponse> {
    return httpClient.get<UserListResponse>(UserService.BASE_URL, { params });
  }

  /**
   * 根据ID获取用户详情
   */
  static async getUserById(id: string): Promise<User> {
    return httpClient.get<User>(`${UserService.BASE_URL}/${id}`);
  }

  /**
   * 创建用户
   */
  static async createUser(userData: CreateUserRequest): Promise<User> {
    return httpClient.post<User>(UserService.BASE_URL, userData);
  }

  /**
   * 更新用户
   */
  static async updateUser(
    id: string,
    userData: UpdateUserRequest
  ): Promise<User> {
    return httpClient.put<User>(`${UserService.BASE_URL}/${id}`, userData);
  }

  /**
   * 删除用户
   */
  static async deleteUser(id: string): Promise<void> {
    await httpClient.delete(`${UserService.BASE_URL}/${id}`);
  }

  /**
   * 批量删除用户
   */
  static async batchDeleteUsers(ids: string[]): Promise<void> {
    await httpClient.post(`${UserService.BASE_URL}/batch-delete`, { ids });
  }

  /**
   * 激活用户
   */
  static async activateUser(id: string): Promise<User> {
    return httpClient.patch<User>(`${UserService.BASE_URL}/${id}/activate`);
  }

  /**
   * 停用用户
   */
  static async deactivateUser(id: string): Promise<User> {
    return httpClient.patch<User>(`${UserService.BASE_URL}/${id}/deactivate`);
  }

  /**
   * 重置用户密码
   */
  static async resetPassword(
    id: string
  ): Promise<{ temporaryPassword: string }> {
    return httpClient.post<{ temporaryPassword: string }>(
      `${UserService.BASE_URL}/${id}/reset-password`
    );
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
  }> {
    return httpClient.get<{
      total: number;
      active: number;
      inactive: number;
      byType: Record<string, number>;
    }>(`${UserService.BASE_URL}/stats`);
  }
}
