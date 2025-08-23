/**
 * OAuth 回调处理组件
 * 处理第三方登录的回调逻辑
 */

import React, { useEffect, useState } from 'react';

import { useNotify } from 'react-admin';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { CircularProgress, Box, Typography } from '@mui/material';

import { useAuth } from '@/contexts/AuthContext';
import { authApiService } from '@/services/authApiService';
import { oauthService, OAuthProvider } from '@/services/oauthService';
import { logger } from '@/shared/utils/logger';

interface OAuthCallbackProps {
  provider: OAuthProvider;
}

export const OAuthCallback: React.FC<OAuthCallbackProps> = ({ provider }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const { login } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    'processing'
  );
  const [message, setMessage] = useState('正在处理登录...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // 检查是否有错误
        if (error) {
          throw new Error(`OAuth 认证失败: ${error}`);
        }

        // 检查是否有授权码
        if (!code) {
          throw new Error('未收到授权码');
        }

        setMessage('正在验证授权码...');

        // 处理OAuth回调
        const userInfo = await oauthService.handleCallback(provider, code);

        setMessage('正在验证用户信息...');

        // 调用后端API验证并获取JWT token
        const authResult = await authApiService.handleOAuthCallback({
          provider,
          code,
          state: state || '',
          user_info: userInfo as unknown as Record<string, unknown>,
        });

        setMessage('登录成功，正在跳转...');
        setStatus('success');

        // 使用OAuth用户信息进行登录
        await login({
          email: authResult.user.email,
          password: `oauth_${provider}_${authResult.user.id}`, // OAuth登录使用特殊密码格式
        });

        // 保存OAuth用户信息
        localStorage.setItem('user', JSON.stringify(authResult.user));
        localStorage.setItem('token', authResult.token);
        localStorage.setItem('oauth_provider', provider);
        localStorage.setItem(
          'oauth_user_info',
          JSON.stringify(authResult.user)
        );

        notify(`${getProviderName(provider)}登录成功！`, { type: 'success' });

        // 跳转到仪表板
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } catch (error) {
        logger.error('OAuth 回调处理失败:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : '登录失败，请重试');
        notify('登录失败，请重试', { type: 'error' });

        // 3秒后跳转回登录页
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, provider, navigate, notify, login]);

  const getProviderName = (provider: OAuthProvider): string => {
    switch (provider) {
      case 'github':
        return 'GitHub';
      case 'wechat':
        return '微信';
      case 'google':
        return 'Google';
      default:
        return provider;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'primary';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={3}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        p={4}
        borderRadius={2}
        bgcolor="background.paper"
        boxShadow={3}
        maxWidth={400}
        width="100%"
      >
        {status === 'processing' && (
          <CircularProgress size={60} color={getStatusColor()} sx={{ mb: 3 }} />
        )}

        {status === 'success' && (
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h4" color="white">
              ✓
            </Typography>
          </Box>
        )}

        {status === 'error' && (
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'error.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h4" color="white">
              ✗
            </Typography>
          </Box>
        )}

        <Typography
          variant="h6"
          color="text.primary"
          textAlign="center"
          gutterBottom
        >
          {getProviderName(provider)} 登录
        </Typography>

        <Typography variant="body1" color="text.secondary" textAlign="center">
          {message}
        </Typography>

        {status === 'error' && (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 2 }}
          >
            3秒后自动返回登录页...
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// GitHub 回调组件
export const GitHubCallback: React.FC = () => (
  <OAuthCallback provider="github" />
);

// 微信回调组件
export const WeChatCallback: React.FC = () => (
  <OAuthCallback provider="wechat" />
);

// Google 回调组件
export const GoogleCallback: React.FC = () => (
  <OAuthCallback provider="google" />
);
