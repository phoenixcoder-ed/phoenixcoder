import { User } from '@phoenixcoder/shared-types';

import api from '@/features/auth/api';

// User interface moved to @phoenixcoder/shared-types

// 定义创建用户请求接口
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  userType: 'programmer' | 'merchant' | 'admin';
}

// 定义更新用户请求接口
export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  userType?: string;
  password?: string;
}

// 获取所有用户
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get<User[]>('/users');
    return response.data;
  } catch (error) {
    throw new Error(
      '获取用户列表失败: ' +
        (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 获取单个用户
export const getUser = async (userId: string): Promise<User> => {
  try {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      '获取用户详情失败: ' +
        (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 创建用户
export const createUser = async (
  userData: CreateUserRequest
): Promise<User> => {
  try {
    const response = await api.post<User>('/users', userData);
    return response.data;
  } catch (error) {
    throw new Error(
      '创建用户失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 更新用户
export const updateUser = async (
  userId: string,
  userData: UpdateUserRequest
): Promise<User> => {
  try {
    const response = await api.put<User>(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw new Error(
      '更新用户失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 删除用户
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await api.delete(`/users/${userId}`);
  } catch (error) {
    throw new Error(
      '删除用户失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};
