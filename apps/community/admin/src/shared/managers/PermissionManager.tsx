import React, { createContext, useContext, useEffect, useState } from 'react';

import { logger } from '@/shared/utils/logger';

// 权限类型定义
export type Permission =
  | 'user_management'
  | 'task_management'
  | 'skill_management'
  | 'content_management'
  | 'financial_management'
  | 'data_analytics'
  | 'system_management'
  | 'notification_management';

// 用户角色定义
export type UserRole = 'super_admin' | 'admin' | 'merchant' | 'moderator';

// 角色权限映射
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'user_management',
    'task_management',
    'skill_management',
    'content_management',
    'financial_management',
    'data_analytics',
    'system_management',
    'notification_management',
  ],
  admin: [
    'user_management',
    'task_management',
    'skill_management',
    'content_management',
    'data_analytics',
    'notification_management',
  ],
  merchant: ['task_management', 'data_analytics'],
  moderator: ['content_management', 'notification_management'],
};

// 菜单项类型
export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  permission?: Permission;
  children?: MenuItem[];
}

// 权限上下文类型
interface PermissionContextType {
  userRole: UserRole | null;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  setUserRole: (role: UserRole) => void;
  isLoading: boolean;
  filterMenuItems: (menuItems: MenuItem[]) => MenuItem[];
}

// 创建权限上下文
const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined
);

/**
 * 权限提供者组件
 */
export const PermissionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 从用户信息中获取角色
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        // 这里应该从API或localStorage获取用户角色
        const storedRole = localStorage.getItem('userRole') as UserRole;
        if (storedRole && ROLE_PERMISSIONS[storedRole]) {
          setUserRole(storedRole);
        } else {
          // 默认角色或重定向到登录
          setUserRole('merchant');
        }
      } catch (error) {
        logger.error('Failed to load user role:', error);
        setUserRole('merchant');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserRole();
  }, []);

  // 获取当前用户的权限列表
  const permissions = userRole ? ROLE_PERMISSIONS[userRole] : [];

  // 检查是否有特定权限
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  // 检查是否有任意一个权限
  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some((permission) => hasPermission(permission));
  };

  // 检查是否有所有权限
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every((permission) => hasPermission(permission));
  };

  // 过滤菜单项（根据权限）
  const filterMenuItems = (menuItems: MenuItem[]): MenuItem[] => {
    return menuItems
      .filter((item) => {
        // 如果没有权限要求，显示该项
        if (!item.permission) {
          return true;
        }

        // 检查权限
        const hasAccess = hasPermission(item.permission);

        // 如果有子菜单，递归过滤
        if (item.children) {
          const filteredChildren = filterMenuItems(item.children);
          return hasAccess || filteredChildren.length > 0;
        }

        return hasAccess;
      })
      .map((item) => ({
        ...item,
        children: item.children ? filterMenuItems(item.children) : undefined,
      }));
  };

  const value: PermissionContextType = {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    setUserRole,
    isLoading,
    filterMenuItems,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * 使用权限的Hook
 */
export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

/**
 * 权限检查工具函数
 */
export const checkPermission = (
  userRole: UserRole,
  permission: Permission
): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

export default PermissionProvider;
