import React from 'react';

import { User, UserSortConfig } from '../types';

interface UserTableProps {
  users: User[];
  loading: boolean;
  sortConfig: UserSortConfig | null;
  selectedUser: User | null;
  onSort: (field: keyof User) => void;
  onSelectUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  sortConfig,
  selectedUser,
  onSort,
  onSelectUser,
  onEditUser,
  onDeleteUser,
}) => {
  const getSortIcon = (field: keyof User) => {
    if (!sortConfig || sortConfig.field !== field) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'programmer':
        return 'badge-primary';
      case 'merchant':
        return 'badge-secondary';
      case 'admin':
        return 'badge-accent';
      default:
        return 'badge-ghost';
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'programmer':
        return '👨‍💻';
      case 'merchant':
        return '🏪';
      case 'admin':
        return '⚙️';
      default:
        return '👤';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <span className="ml-4 text-base-content/70">加载用户数据中...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-6xl">👥</div>
        <div className="text-xl font-semibold text-base-content/70">
          暂无用户数据
        </div>
        <div className="text-sm text-base-content/50">
          系统中还没有用户，请添加第一个用户
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-base-200/50">
              <th className="w-12">
                <label>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                  />
                </label>
              </th>
              <th
                className="cursor-pointer hover:bg-base-300/50 transition-colors"
                onClick={() => onSort('username')}
              >
                <div className="flex items-center space-x-2">
                  <span>用户名</span>
                  <span className="text-xs">{getSortIcon('username')}</span>
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-300/50 transition-colors"
                onClick={() => onSort('email')}
              >
                <div className="flex items-center space-x-2">
                  <span>邮箱</span>
                  <span className="text-xs">{getSortIcon('email')}</span>
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-300/50 transition-colors"
                onClick={() => onSort('userType')}
              >
                <div className="flex items-center space-x-2">
                  <span>用户类型</span>
                  <span className="text-xs">{getSortIcon('userType')}</span>
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-300/50 transition-colors"
                onClick={() => onSort('isActive')}
              >
                <div className="flex items-center space-x-2">
                  <span>状态</span>
                  <span className="text-xs">{getSortIcon('isActive')}</span>
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-300/50 transition-colors"
                onClick={() => onSort('createdAt')}
              >
                <div className="flex items-center space-x-2">
                  <span>创建时间</span>
                  <span className="text-xs">{getSortIcon('createdAt')}</span>
                </div>
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className={`hover:bg-base-200/30 transition-colors cursor-pointer ${
                  selectedUser?.id === user.id
                    ? 'bg-primary/10 border-l-4 border-primary'
                    : ''
                }`}
                onClick={() => onSelectUser(user)}
              >
                <td>
                  <label>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={selectedUser?.id === user.id}
                      onChange={() => onSelectUser(user)}
                    />
                  </label>
                </td>
                <td>
                  <div className="flex items-center space-x-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-8 h-8">
                        <span className="text-xs font-mono">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold font-mono">{user.username}</div>
                      <div className="text-sm opacity-50">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="font-mono text-sm">{user.email}</div>
                </td>
                <td>
                  <div
                    className={`badge ${getUserTypeColor(user.userType)} gap-2`}
                  >
                    <span>{getUserTypeIcon(user.userType)}</span>
                    {user.userType}
                  </div>
                </td>
                <td>
                  <div
                    className={`badge ${user.isActive ? 'badge-success' : 'badge-error'} gap-2`}
                  >
                    <span>{user.isActive ? '✅' : '❌'}</span>
                    {user.isActive ? '活跃' : '禁用'}
                  </div>
                </td>
                <td>
                  <div className="text-sm font-mono">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                  <div className="text-xs opacity-50 font-mono">
                    {new Date(user.createdAt).toLocaleTimeString('zh-CN')}
                  </div>
                </td>
                <td>
                  <div className="flex space-x-2">
                    <button
                      className="btn btn-ghost btn-xs cosmic-glow"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditUser(user);
                      }}
                      title="编辑用户"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteUser(user);
                      }}
                      title="删除用户"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
