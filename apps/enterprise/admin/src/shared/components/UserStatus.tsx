/**
 * 用户状态显示组件
 * 显示当前登录用户的信息和状态
 */

import React from 'react';

import { Person, Email, Phone, ExitToApp, Refresh } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';

import { useAuth } from '../../contexts/AuthContext';

interface UserStatusProps {
  variant?: 'compact' | 'detailed';
  showLogout?: boolean;
}

/**
 * 用户状态显示组件
 */
export const UserStatus: React.FC<UserStatusProps> = ({
  variant = 'compact',
  showLogout = true,
}) => {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          未登录
        </Typography>
      </Box>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('注销失败:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshUser();
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  };

  // 获取用户头像
  const getAvatarText = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // 获取用户类型显示文本
  const getUserTypeText = (userType: string) => {
    const typeMap: Record<string, string> = {
      admin: '管理员',
      developer: '开发者',
      client: '客户',
      user: '用户',
    };
    return typeMap[userType] || userType;
  };

  // 获取用户类型颜色
  const getUserTypeColor = (
    userType: string
  ): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    const colorMap: Record<
      string,
      'primary' | 'secondary' | 'success' | 'warning' | 'error'
    > = {
      admin: 'error',
      developer: 'primary',
      client: 'success',
      user: 'secondary',
    };
    return colorMap[userType] || 'secondary';
  };

  if (variant === 'compact') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 1,
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
          }}
        >
          {getAvatarText(user.name)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 'medium',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.name}
          </Typography>
          <Chip
            label={getUserTypeText(user.userType)}
            size="small"
            color={getUserTypeColor(user.userType)}
            sx={{ height: 16, fontSize: '0.625rem' }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="刷新用户信息">
            <IconButton size="small" onClick={handleRefresh}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          {showLogout && (
            <Tooltip title="退出登录">
              <IconButton size="small" onClick={handleLogout} color="error">
                <ExitToApp fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Card sx={{ maxWidth: 400 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'primary.main',
              fontSize: '1.5rem',
            }}
          >
            {getAvatarText(user.name)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {user.name}
            </Typography>
            <Chip
              label={getUserTypeText(user.userType)}
              color={getUserTypeColor(user.userType)}
              size="small"
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Tooltip title="刷新用户信息">
              <IconButton size="small" onClick={handleRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
            {showLogout && (
              <Tooltip title="退出登录">
                <IconButton size="small" onClick={handleLogout} color="error">
                  <ExitToApp />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              ID: {user.id}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>

          {user.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {user.phone}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserStatus;
