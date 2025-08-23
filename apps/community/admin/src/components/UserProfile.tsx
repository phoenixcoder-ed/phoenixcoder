/**
 * 用户信息组件
 * 显示当前登录用户信息和注销功能
 */

import React from 'react';

import { ExitToApp, Person } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
} from '@mui/material';

import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/shared/utils/logger';

export const UserProfile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="textSecondary">
            未登录
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            请先登录以查看用户信息
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.debug('注销失败:', error);
    }
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              mr: 2,
            }}
          >
            <Person sx={{ fontSize: 32 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {user.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {user.email}
            </Typography>
            {user.phone && (
              <Typography variant="body2" color="textSecondary">
                {user.phone}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Chip
            label={user.user_type || '普通用户'}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ExitToApp />}
            onClick={handleLogout}
            fullWidth
          >
            注销
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
