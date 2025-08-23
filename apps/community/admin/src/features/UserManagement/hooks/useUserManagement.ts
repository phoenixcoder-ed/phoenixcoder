/**
 * 用户管理业务逻辑Hook
 * 遵循分层架构思想，将业务逻辑从组件中分离
 */

import { useState, useCallback, useEffect } from 'react';

import { UserService } from '@/features/UserManagement/services/userService';
import { useGlobalStore } from '@/shared/store/globalStore';

import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from '../types';

// Hook状态接口
interface UseUserManagementState {
  users: User[];
  selectedUsers: string[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  pageSize: number;
  filters: UserFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Hook返回值接口
interface UseUserManagementReturn extends UseUserManagementState {
  // 用户操作
  fetchUsers: () => Promise<void>;
  createUser: (userData: CreateUserRequest) => Promise<void>;
  updateUser: (id: string, userData: UpdateUserRequest) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  batchDeleteUsers: (ids: string[]) => Promise<void>;

  // 选择操作
  selectUser: (id: string) => void;
  selectAllUsers: () => void;
  clearSelection: () => void;

  // 筛选和排序
  setFilters: (filters: Partial<UserFilters>) => void;
  setSorting: (field: string, order: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // 错误处理
  clearError: () => void;
}

/**
 * 用户管理Hook
 */
export const useUserManagement = (): UseUserManagementReturn => {
  // 全局状态
  const { addNotification } = useGlobalStore();

  // 本地状态
  const [state, setState] = useState<UseUserManagementState>({
    users: [],
    selectedUsers: [],
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    pageSize: 20,
    filters: {},
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await UserService.getUsers({
        page: state.currentPage,
        pageSize: state.pageSize,
        search: state.filters.search,
        userType: state.filters.userType,
        isActive: state.filters.isActive,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      });

      setState((prev) => ({
        ...prev,
        users: response.users,
        total: response.total,
        loading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '获取用户列表失败';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));

      addNotification({
        type: 'error',
        title: '获取用户失败',
        message: errorMessage,
      });
    }
  }, [
    state.currentPage,
    state.pageSize,
    state.filters,
    state.sortBy,
    state.sortOrder,
    addNotification,
  ]);

  // 创建用户
  const createUser = useCallback(
    async (userData: CreateUserRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await UserService.createUser(userData);

        addNotification({
          type: 'success',
          title: '创建成功',
          message: '用户创建成功',
        });

        // 刷新用户列表
        await fetchUsers();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '创建用户失败';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));

        addNotification({
          type: 'error',
          title: '创建失败',
          message: errorMessage,
        });
      }
    },
    [fetchUsers, addNotification]
  );

  // 更新用户
  const updateUser = useCallback(
    async (id: string, userData: UpdateUserRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await UserService.updateUser(id, userData);

        addNotification({
          type: 'success',
          title: '更新成功',
          message: '用户信息更新成功',
        });

        // 刷新用户列表
        await fetchUsers();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '更新用户失败';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));

        addNotification({
          type: 'error',
          title: '更新失败',
          message: errorMessage,
        });
      }
    },
    [fetchUsers, addNotification]
  );

  // 删除用户
  const deleteUser = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await UserService.deleteUser(id);

        addNotification({
          type: 'success',
          title: '删除成功',
          message: '用户删除成功',
        });

        // 刷新用户列表
        await fetchUsers();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '删除用户失败';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));

        addNotification({
          type: 'error',
          title: '删除失败',
          message: errorMessage,
        });
      }
    },
    [fetchUsers, addNotification]
  );

  // 批量删除用户
  const batchDeleteUsers = useCallback(
    async (ids: string[]) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await UserService.batchDeleteUsers(ids);

        addNotification({
          type: 'success',
          title: '批量删除成功',
          message: `成功删除 ${ids.length} 个用户`,
        });

        // 清除选择并刷新列表
        setState((prev) => ({ ...prev, selectedUsers: [] }));
        await fetchUsers();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '批量删除失败';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));

        addNotification({
          type: 'error',
          title: '批量删除失败',
          message: errorMessage,
        });
      }
    },
    [fetchUsers, addNotification]
  );

  // 选择用户
  const selectUser = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(id)
        ? prev.selectedUsers.filter((userId) => userId !== id)
        : [...prev.selectedUsers, id],
    }));
  }, []);

  // 全选用户
  const selectAllUsers = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedUsers:
        prev.selectedUsers.length === prev.users.length
          ? []
          : prev.users.map((user) => user.id),
    }));
  }, []);

  // 清除选择
  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedUsers: [] }));
  }, []);

  // 设置筛选条件
  const setFilters = useCallback((filters: Partial<UserFilters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      currentPage: 1, // 重置到第一页
    }));
  }, []);

  // 设置排序
  const setSorting = useCallback((field: string, order: 'asc' | 'desc') => {
    setState((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: order,
      currentPage: 1, // 重置到第一页
    }));
  }, []);

  // 设置页码
  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  // 设置页面大小
  const setPageSize = useCallback((size: number) => {
    setState((prev) => ({
      ...prev,
      pageSize: size,
      currentPage: 1, // 重置到第一页
    }));
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // 初始化时获取用户列表
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    ...state,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    batchDeleteUsers,
    selectUser,
    selectAllUsers,
    clearSelection,
    setFilters,
    setSorting,
    setPage,
    setPageSize,
    clearError,
  };
};
