import React, { useState } from 'react';

import {
  CloudOff as CloudOffIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Box, Button, Container, Paper, Typography } from '@mui/material';

import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

interface ErrorPageProps {
  title: string;
  message: string;
  icon: React.ReactNode;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  title,
  message,
  icon,
  showHomeButton = true,
  showRetryButton = false,
  onRetry,
}) => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Box sx={{ mb: 3, color: 'error.main' }}>{icon}</Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {message}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {showRetryButton && onRetry && (
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                sx={{ minWidth: 120 }}
              >
                重试
              </Button>
            )}
            {showHomeButton && (
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={() => (window.location.href = '/')}
                sx={{ minWidth: 120 }}
              >
                返回首页
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

// 404 页面
export const NotFoundPage: React.FC = () => (
  <ErrorPage
    title="404"
    message="抱歉，您访问的页面不存在。"
    icon={<SearchIcon sx={{ fontSize: 64 }} />}
  />
);

// 403 页面
export const ForbiddenPage: React.FC = () => (
  <ErrorPage
    title="403"
    message="抱歉，您没有权限访问此页面。"
    icon={<LockIcon sx={{ fontSize: 64 }} />}
  />
);

// 500 页面
export const ServerErrorPage: React.FC = () => (
  <ErrorPage
    title="500"
    message="服务器内部错误，请稍后再试。"
    icon={<ErrorIcon sx={{ fontSize: 64 }} />}
    showRetryButton={true}
    onRetry={() => window.location.reload()}
  />
);

// 网络错误页面
export const NetworkErrorPage: React.FC = () => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.validation.health}`,
        {
          method: 'GET',
        }
      );
      if (response.ok) {
        window.location.reload();
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Box sx={{ mb: 3, color: 'error.main' }}>
            <CloudOffIcon sx={{ fontSize: 64 }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom>
            网络连接失败
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            无法连接到服务器，请检查您的网络连接。
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              disabled={isRetrying}
              sx={{ minWidth: 120 }}
            >
              {isRetrying ? '重试中...' : '重试'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => (window.location.href = '/')}
              sx={{ minWidth: 120 }}
            >
              返回首页
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

// 401 未授权页面
export const UnauthorizedPage: React.FC = () => (
  <ErrorPage
    title="401"
    message="您需要登录才能访问此页面。"
    icon={<LockIcon sx={{ fontSize: 64 }} />}
    showHomeButton={false}
    showRetryButton={true}
    onRetry={() => (window.location.href = '/login')}
  />
);

// 通用错误页面
interface GenericErrorPageProps {
  error?: Error;
}

export const GenericErrorPage: React.FC<GenericErrorPageProps> = ({
  error,
}) => (
  <ErrorPage
    title="出错了"
    message={error?.message || '应用程序遇到了一个意外错误，请稍后再试。'}
    icon={<ErrorIcon sx={{ fontSize: 64 }} />}
    showRetryButton={true}
    onRetry={() => window.location.reload()}
  />
);
