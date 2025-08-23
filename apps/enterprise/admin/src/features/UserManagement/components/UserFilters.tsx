import React from 'react';

import { UserType, UserFilters as UserFiltersType } from '../types';

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: UserFiltersType) => void;
  onClearFilters: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const handleFilterChange = (
    key: keyof UserFiltersType,
    value: string | boolean | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const userTypes: { value: UserType; label: string; icon: string }[] = [
    { value: UserType.DEVELOPER, label: '开发者', icon: '👨‍💻' },
    { value: UserType.CLIENT, label: '客户', icon: '🏪' },
    { value: UserType.ADMIN, label: '管理员', icon: '⚙️' },
    { value: UserType.REVIEWER, label: '审核员', icon: '🔍' },
  ];

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== '' && value !== null
  );

  return (
    <div className="cosmic-glass rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          筛选用户
        </h3>
        {hasActiveFilters && (
          <button
            className="btn btn-ghost btn-sm cosmic-glow"
            onClick={onClearFilters}
          >
            <span className="mr-1">🗑️</span>
            清除筛选
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 搜索框 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-mono">🔎 搜索用户</span>
          </label>
          <input
            type="text"
            placeholder="输入用户名或邮箱..."
            className="input input-bordered cosmic-glow font-mono"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        {/* 用户类型筛选 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-mono">👤 用户类型</span>
          </label>
          <select
            className="select select-bordered cosmic-glow"
            value={filters.userType || ''}
            onChange={(e) =>
              handleFilterChange('userType', e.target.value || undefined)
            }
          >
            <option value="">全部类型</option>
            {userTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* 状态筛选 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-mono">📊 用户状态</span>
          </label>
          <select
            className="select select-bordered cosmic-glow"
            value={
              filters.isActive === undefined ? '' : filters.isActive.toString()
            }
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange(
                'isActive',
                value === '' ? undefined : value === 'true'
              );
            }}
          >
            <option value="">全部状态</option>
            <option value="true">✅ 活跃</option>
            <option value="false">❌ 禁用</option>
          </select>
        </div>
      </div>

      {/* 快速筛选标签 */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-base-content/70 font-mono mr-2">
            快速筛选:
          </span>

          {/* 用户类型快速筛选 */}
          {userTypes.map((type) => (
            <button
              key={type.value}
              className={`btn btn-xs ${
                filters.userType === type.value
                  ? 'btn-primary cosmic-glow'
                  : 'btn-ghost hover:btn-primary/20'
              }`}
              onClick={() =>
                handleFilterChange(
                  'userType',
                  filters.userType === type.value ? undefined : type.value
                )
              }
            >
              {type.icon} {type.label}
            </button>
          ))}

          {/* 状态快速筛选 */}
          <button
            className={`btn btn-xs ${
              filters.isActive === true
                ? 'btn-success cosmic-glow'
                : 'btn-ghost hover:btn-success/20'
            }`}
            onClick={() =>
              handleFilterChange(
                'isActive',
                filters.isActive === true ? undefined : true
              )
            }
          >
            ✅ 活跃用户
          </button>

          <button
            className={`btn btn-xs ${
              filters.isActive === false
                ? 'btn-error cosmic-glow'
                : 'btn-ghost hover:btn-error/20'
            }`}
            onClick={() =>
              handleFilterChange(
                'isActive',
                filters.isActive === false ? undefined : false
              )
            }
          >
            ❌ 禁用用户
          </button>
        </div>
      </div>

      {/* 筛选结果统计 */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary">📈</span>
            <span className="font-mono">
              当前筛选条件:
              {filters.search && ` 搜索"${filters.search}"`}
              {filters.userType &&
                ` 类型"${userTypes.find((t) => t.value === filters.userType)?.label}"`}
              {filters.isActive !== undefined &&
                ` 状态"${filters.isActive ? '活跃' : '禁用'}"`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFilters;
