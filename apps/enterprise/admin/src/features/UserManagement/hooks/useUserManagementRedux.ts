/**
 * 用户管理 Redux Hooks
 * 基于 Redux Toolkit 的用户管理状态管理
 */

import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '../../../store';
import {
  fetchUsersAsync,
  createUserAsync,
  updateUserAsync,
  deleteUserAsync,
  setFilters,
  setPagination,
  setSelectedUsers,
  clearSelectedUsers,
  selectUsers,
  selectLoading,
  selectError,
  selectFilters,
  selectPagination,
  selectSelectedUsers,
  selectTotalCount,
} from '../../../store/slices/userManagementSlice';
import type {
  UserFilters,
  CreateUserRequest,
  UpdateUserRequest,
} from '../types/index';

export const useUserManagementRedux = () => {
  const dispatch = useAppDispatch();

  // 选择器
  const users = useAppSelector(selectUsers);
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const filters = useAppSelector(selectFilters);
  const pagination = useAppSelector(selectPagination);
  const selectedUsers = useAppSelector(selectSelectedUsers);
  const totalCount = useAppSelector(selectTotalCount);

  // 异步操作
  const fetchUsers = useCallback(
    (params?: { filters?: UserFilters; page?: number; pageSize?: number }) => {
      return dispatch(fetchUsersAsync(params || {}));
    },
    [dispatch]
  );

  const createUser = useCallback(
    (userData: CreateUserRequest) => {
      return dispatch(createUserAsync(userData));
    },
    [dispatch]
  );

  const updateUser = useCallback(
    (id: string, userData: UpdateUserRequest) => {
      return dispatch(updateUserAsync({ id, userData }));
    },
    [dispatch]
  );

  const deleteUser = useCallback(
    (id: string) => {
      return dispatch(deleteUserAsync(id));
    },
    [dispatch]
  );

  // 同步操作
  const updateFilters = useCallback(
    (newFilters: Partial<UserFilters>) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  const updatePagination = useCallback(
    (newPagination: { page?: number; pageSize?: number }) => {
      dispatch(setPagination(newPagination));
    },
    [dispatch]
  );

  const selectUsersAction = useCallback(
    (userIds: string[]) => {
      dispatch(setSelectedUsers(userIds));
    },
    [dispatch]
  );

  const clearSelection = useCallback(() => {
    dispatch(clearSelectedUsers());
  }, [dispatch]);

  // 组合操作
  const refreshUsers = useCallback(() => {
    return fetchUsers({
      filters,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  }, [fetchUsers, filters, pagination.page, pagination.pageSize]);

  const searchUsers = useCallback(
    (searchFilters: Partial<UserFilters>) => {
      dispatch(setFilters(searchFilters));
      dispatch(setPagination({ page: 1 })); // 重置到第一页
      return fetchUsers({
        filters: { ...filters, ...searchFilters },
        page: 1,
        pageSize: pagination.pageSize,
      });
    },
    [dispatch, fetchUsers, filters, pagination.pageSize]
  );

  const changePage = useCallback(
    (page: number) => {
      dispatch(setPagination({ page }));
      return fetchUsers({ filters, page, pageSize: pagination.pageSize });
    },
    [dispatch, fetchUsers, filters, pagination.pageSize]
  );

  const changePageSize = useCallback(
    (pageSize: number) => {
      dispatch(setPagination({ page: 1, pageSize }));
      return fetchUsers({ filters, page: 1, pageSize });
    },
    [dispatch, fetchUsers, filters]
  );

  const deleteSelectedUsers = useCallback(async () => {
    const deletePromises = selectedUsers.map((userId) =>
      dispatch(deleteUserAsync(userId))
    );
    await Promise.all(deletePromises);
    dispatch(clearSelectedUsers());
    return refreshUsers();
  }, [selectedUsers, dispatch, refreshUsers]);

  return {
    // 状态
    users,
    loading,
    error,
    filters,
    pagination,
    selectedUsers,
    totalCount,

    // 基础操作
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    updateFilters,
    updatePagination,
    selectUsers: selectUsersAction,
    clearSelection,

    // 组合操作
    refreshUsers,
    searchUsers,
    changePage,
    changePageSize,
    deleteSelectedUsers,
  };
};

export default useUserManagementRedux;
