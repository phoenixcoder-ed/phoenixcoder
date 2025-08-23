import React, { useState, useEffect } from 'react';

import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserType,
} from '@/features/UserManagement/types';
import { logger } from '@/shared/utils/logger';

interface UserFormProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    userType: UserType.DEVELOPER,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        fullName: user.fullName,
        userType: user.userType,
        isActive: user.isActive,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        userType: UserType.DEVELOPER,
        isActive: true,
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const userTypes: {
    value: UserType;
    label: string;
    icon: string;
    description: string;
  }[] = [
    {
      value: UserType.DEVELOPER,
      label: '开发者',
      icon: '👨‍💻',
      description: '可以接受编程任务，参与项目开发',
    },
    {
      value: UserType.CLIENT,
      label: '客户',
      icon: '🏪',
      description: '可以发布任务，雇佣程序员',
    },
    {
      value: UserType.ADMIN,
      label: '管理员',
      icon: '⚙️',
      description: '系统管理员，拥有所有权限',
    },
    {
      value: UserType.REVIEWER,
      label: '审核员',
      icon: '🔍',
      description: '负责审核任务和用户',
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = '全名不能为空';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = '全名至少需要2个字符';
    }

    if (!formData.email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = '密码不能为空';
      } else if (formData.password.length < 6) {
        newErrors.password = '密码至少需要6个字符';
      }
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        const updateData: UpdateUserRequest = {
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          userType: formData.userType,
          isActive: formData.isActive,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await onSubmit(updateData);
      } else {
        await onSubmit(formData);
      }
      onClose();
    } catch (error) {
      logger.debug('用户数据提交:', formData);
      logger.error('Form submission error:', error);
    }
  };

  const handleInputChange = (
    field: keyof CreateUserRequest,
    value: string | boolean | UserType
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 清除对应字段的错误
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl cosmic-glass">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <span className="text-3xl">{isEditing ? '✏️' : '➕'}</span>
            {isEditing ? '编辑用户' : '创建用户'}
          </h3>
          <button
            className="btn btn-ghost btn-circle cosmic-glow"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 用户名 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-mono flex items-center gap-2">
                👤 用户名 <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              className={`input input-bordered cosmic-glow font-mono ${
                errors.username ? 'input-error' : ''
              }`}
              placeholder="输入用户名..."
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              disabled={loading}
            />
            {errors.username && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.username}
                </span>
              </label>
            )}
          </div>

          {/* 邮箱 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-mono flex items-center gap-2">
                📧 邮箱 <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="email"
              className={`input input-bordered cosmic-glow font-mono ${
                errors.email ? 'input-error' : ''
              }`}
              placeholder="输入邮箱地址..."
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
            />
            {errors.email && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.email}
                </span>
              </label>
            )}
          </div>

          {/* 全名 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-mono flex items-center gap-2">
                👤 全名 <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              className={`input input-bordered cosmic-glow font-mono ${
                errors.fullName ? 'input-error' : ''
              }`}
              placeholder="输入全名..."
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              disabled={loading}
            />
            {errors.fullName && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.fullName}
                </span>
              </label>
            )}
          </div>

          {/* 密码 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-mono flex items-center gap-2">
                🔒 密码 {!isEditing && <span className="text-error">*</span>}
                {isEditing && (
                  <span className="text-sm text-base-content/50">
                    (留空则不修改)
                  </span>
                )}
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`input input-bordered cosmic-glow font-mono w-full pr-12 ${
                  errors.password ? 'input-error' : ''
                }`}
                placeholder={isEditing ? '留空则不修改密码...' : '输入密码...'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-xs"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.password}
                </span>
              </label>
            )}
          </div>

          {/* 用户类型 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-mono flex items-center gap-2">
                🏷️ 用户类型 <span className="text-error">*</span>
              </span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {userTypes.map((type) => (
                <label
                  key={type.value}
                  className={`cursor-pointer border-2 rounded-lg p-4 transition-all hover:scale-105 ${
                    formData.userType === type.value
                      ? 'border-primary bg-primary/10 cosmic-glow'
                      : 'border-base-300 hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="userType"
                    value={type.value}
                    checked={formData.userType === type.value}
                    onChange={(e) =>
                      handleInputChange('userType', e.target.value as UserType)
                    }
                    className="radio radio-primary sr-only"
                    disabled={loading}
                  />
                  <div className="text-center">
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="font-bold">{type.label}</div>
                    <div className="text-xs text-base-content/70 mt-1">
                      {type.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 用户状态 */}
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="toggle toggle-primary cosmic-glow"
                checked={formData.isActive}
                onChange={(e) =>
                  handleInputChange('isActive', e.target.checked)
                }
                disabled={loading}
              />
              <span className="label-text font-mono flex items-center gap-2">
                {formData.isActive ? '✅' : '❌'}
                {formData.isActive ? '用户状态：活跃' : '用户状态：禁用'}
              </span>
            </label>
            <div className="text-xs text-base-content/50 ml-16">
              {formData.isActive
                ? '用户可以正常登录和使用系统功能'
                : '用户将被禁止登录和使用系统功能'}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary cosmic-glow"
              disabled={loading}
            >
              {loading && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
              {isEditing ? '更新用户' : '创建用户'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
