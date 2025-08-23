import React from 'react';

import { Lock as LockIcon } from '@mui/icons-material';
import { Box, Typography, Button } from '@mui/material';

import { usePermissions, Permission } from '../managers/PermissionManager.tsx';

interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 权限守卫组件
 * 用于控制页面和组件的访问权限
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback,
}) => {
  const { hasPermission, isLoading } = usePermissions();

  // 加载中状态
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Typography>检查权限中...</Typography>
      </Box>
    );
  }

  // 检查权限
  if (!hasPermission(permission)) {
    // 如果提供了自定义fallback，使用它
    if (fallback) {
      return <>{fallback}</>;
    }

    // 默认的无权限页面
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        textAlign="center"
        p={4}
      >
        <LockIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          访问受限
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          您没有访问此页面的权限。如需访问，请联系系统管理员。
        </Typography>
        <Button variant="contained" onClick={() => window.history.back()}>
          返回上一页
        </Button>
      </Box>
    );
  }

  // 有权限，渲染子组件
  return <>{children}</>;
};

/**
 * 权限检查Hook
 * 用于在组件内部检查权限
 */
export const usePermissionCheck = (permission: Permission) => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
};

export default PermissionGuard;
