/**
 * 用户管理状态管理 Slice
 * 管理用户列表、筛选、分页等状态
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// 导入类型定义
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from '../../features/UserManagement/types/index';

// 定义用户管理状态接口
export interface UserManagementState {
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

// 初始状态
const initialState: UserManagementState = {
  users: [],
  selectedUsers: [],
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  filters: {},
  sortBy: 'created_at',
  sortOrder: 'desc',
};

// 异步 thunk - 获取用户列表
export const fetchUsersAsync = createAsyncThunk(
  'userManagement/fetchUsers',
  async (
    params: {
      page?: number;
      pageSize?: number;
      filters?: UserFilters;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize)
        queryParams.append('pageSize', params.pageSize.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/users?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '获取用户列表失败'
      );
    }
  }
);

// 异步 thunk - 创建用户
export const createUserAsync = createAsyncThunk(
  'userManagement/createUser',
  async (userData: CreateUserRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('创建用户失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '创建用户失败'
      );
    }
  }
);

// 异步 thunk - 更新用户
export const updateUserAsync = createAsyncThunk(
  'userManagement/updateUser',
  async (
    { id, userData }: { id: string; userData: UpdateUserRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('更新用户失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '更新用户失败'
      );
    }
  }
);

// 异步 thunk - 删除用户
export const deleteUserAsync = createAsyncThunk(
  'userManagement/deleteUser',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除用户失败');
      }

      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '删除用户失败'
      );
    }
  }
);

// 创建 slice
const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {
    // 设置筛选条件
    setFilters: (state, action: PayloadAction<UserFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // 重置到第一页
    },

    // 设置排序
    setSorting: (
      state,
      action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>
    ) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },

    // 设置分页
    setPagination: (
      state,
      action: PayloadAction<{ page?: number; pageSize?: number }>
    ) => {
      if (action.payload.page !== undefined) {
        state.currentPage = action.payload.page;
      }
      if (action.payload.pageSize !== undefined) {
        state.pageSize = action.payload.pageSize;
      }
    },

    // 设置选中的用户
    setSelectedUsers: (state, action: PayloadAction<string[]>) => {
      state.selectedUsers = action.payload;
    },

    // 清除选中的用户
    clearSelectedUsers: (state) => {
      state.selectedUsers = [];
    },

    // 选择用户
    selectUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      if (!state.selectedUsers.includes(userId)) {
        state.selectedUsers.push(userId);
      }
    },

    // 取消选择用户
    deselectUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      state.selectedUsers = state.selectedUsers.filter((id) => id !== userId);
    },

    // 选择所有用户
    selectAllUsers: (state) => {
      state.selectedUsers = state.users.map((user) => user.id);
    },

    // 取消选择所有用户
    deselectAllUsers: (state) => {
      state.selectedUsers = [];
    },

    // 清除错误
    clearError: (state) => {
      state.error = null;
    },

    // 重置状态
    resetUserManagement: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // 获取用户列表
    builder
      .addCase(fetchUsersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.total = action.payload.total;
      })
      .addCase(fetchUsersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 创建用户
    builder
      .addCase(createUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 更新用户
    builder
      .addCase(updateUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(
          (user) => user.id === action.payload.id
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 删除用户
    builder
      .addCase(deleteUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
        state.selectedUsers = state.selectedUsers.filter(
          (id) => id !== action.payload
        );
        state.total -= 1;
      })
      .addCase(deleteUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// 导出 actions
export const {
  setFilters,
  setSorting,
  setPagination,
  selectUser,
  deselectUser,
  selectAllUsers,
  deselectAllUsers,
  setSelectedUsers,
  clearSelectedUsers,
  clearError,
  resetUserManagement,
} = userManagementSlice.actions;

// 导出 selectors
export const selectUsers = (state: { userManagement: UserManagementState }) =>
  state.userManagement.users;

export const selectSelectedUsers = (state: {
  userManagement: UserManagementState;
}) => state.userManagement.selectedUsers;

export const selectLoading = (state: { userManagement: UserManagementState }) =>
  state.userManagement.loading;

export const selectError = (state: { userManagement: UserManagementState }) =>
  state.userManagement.error;

export const selectFilters = (state: { userManagement: UserManagementState }) =>
  state.userManagement.filters;

export const selectPagination = (state: {
  userManagement: UserManagementState;
}) => ({
  page: state.userManagement.currentPage,
  pageSize: state.userManagement.pageSize,
});

export const selectTotalCount = (state: {
  userManagement: UserManagementState;
}) => state.userManagement.total;

export const selectSorting = (state: {
  userManagement: UserManagementState;
}) => ({
  sortBy: state.userManagement.sortBy,
  sortOrder: state.userManagement.sortOrder,
});

// 保持向后兼容的 selectors
export const selectUserManagementLoading = selectLoading;
export const selectUserManagementError = selectError;
export const selectUserManagementFilters = selectFilters;
export const selectUserManagementPagination = (state: {
  userManagement: UserManagementState;
}) => ({
  currentPage: state.userManagement.currentPage,
  pageSize: state.userManagement.pageSize,
  total: state.userManagement.total,
});
export const selectUserManagementSorting = selectSorting;

// 导出 reducer
export default userManagementSlice.reducer;
