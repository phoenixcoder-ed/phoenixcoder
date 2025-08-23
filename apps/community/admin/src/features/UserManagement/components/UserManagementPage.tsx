import React, { useEffect, useState } from 'react';

import { useUserManagement } from '@/features/UserManagement/hooks/useUserManagement';
import { logger } from '@/shared/utils/logger';

import type {
  UserFilters,
  CreateUserRequest,
  UpdateUserRequest,
} from '../types/index';

import { UserFilters as UserFiltersComponent } from './UserFilters';
import { UserForm } from './UserForm';
import { UserTable } from './UserTable';

/**
 * 用户管理页面
 * 遵循组件驱动开发和状态驱动UI原则
 */
const UserManagementPage: React.FC = () => {
  const {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    clearError,
  } = useUserManagement();

  const [localFilters, setLocalFilters] = useState<UserFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(typeof users)[0] | null>(
    null
  );

  // 初始化数据
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (
    userData: CreateUserRequest | UpdateUserRequest
  ) => {
    try {
      // 确保是CreateUserRequest类型
      if ('password' in userData && userData.password) {
        await createUser(userData as CreateUserRequest);
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      // 错误已在hook中处理
      logger.error('Create user error:', error);
    }
  };

  const handleUpdateUser = async (
    userData: Parameters<typeof updateUser>[1]
  ) => {
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, userData);
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      // 错误已在hook中处理
      logger.error('Update user error:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('确定要删除这个用户吗？')) {
      try {
        await deleteUser(userId);
      } catch (error) {
        // 错误已在hook中处理
        logger.error('Delete user error:', error);
      }
    }
  };

  const handleEditUser = (user: (typeof users)[0]) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-base-100 font-body">
      {/* 页面标题 */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6">
        <h1 className="text-3xl font-heading font-bold text-primary-content title-glow">
          用户管理
        </h1>
        <p className="text-primary-content/80 mt-2">
          管理系统用户，包括程序员、商家和管理员
        </p>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto p-6 space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="alert alert-error glass">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={clearError}>
              关闭
            </button>
          </div>
        )}

        {/* 过滤器面板 */}
        <UserFiltersComponent
          filters={localFilters}
          onFiltersChange={setLocalFilters}
          onClearFilters={() => setLocalFilters({})}
        />

        {/* 创建用户按钮 */}
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            创建用户
          </button>
        </div>

        {/* 用户表格 */}
        <div className="card bg-base-200 shadow-xl glass">
          <div className="card-body">
            <UserTable
              users={users}
              loading={loading}
              sortConfig={null}
              selectedUser={editingUser}
              onSort={() => {}}
              onSelectUser={() => {}}
              onEditUser={handleEditUser}
              onDeleteUser={(user) => handleDeleteUser(user.id)}
            />
          </div>
        </div>
      </div>

      {/* 创建用户模态框 */}
      <UserForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      {/* 编辑用户模态框 */}
      <UserForm
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleUpdateUser}
      />
    </div>
  );
};

export default UserManagementPage;
