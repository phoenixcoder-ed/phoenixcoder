import React, { useEffect, useState } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * 页面白名单配置
 * 这些页面不需要登录即可访问
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/landing',
  '/auth-demo',
  '/about',
  '/privacy',
  '/terms',
  '/error',
  '/error/unauthorized',
  '/error/forbidden',
  '/error/not-found',
  '/error/server-error',
  '/error/network-error',
  '/error/generic',
];

/**
 * 检查路径是否在白名单中
 */
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some((route) => {
    // 精确匹配或前缀匹配（对于 /error/* 这样的路径）
    return pathname === route || pathname.startsWith(route + '/');
  });
};

/**
 * 检查用户是否已登录
 */
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  // 简单检查token和用户信息是否存在
  if (!token || !user) {
    return false;
  }

  try {
    // 检查token是否过期（如果token是JWT格式）
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;

    if (payload.exp && payload.exp < currentTime) {
      // Token已过期，清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }

    return true;
  } catch {
    // 如果token不是JWT格式，只检查是否存在
    return Boolean(token && user);
  }
};

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 认证守卫组件
 * 用于保护需要登录才能访问的页面
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const currentPath = location.pathname;

      // 如果是公开路由，直接允许访问
      if (isPublicRoute(currentPath)) {
        setIsAuthed(true);
        setIsLoading(false);
        return;
      }

      // 检查用户是否已登录
      const authenticated = isAuthenticated();

      if (!authenticated) {
        // 未登录，重定向到登录页面，并保存当前路径
        const returnUrl = encodeURIComponent(currentPath + location.search);
        navigate(`/login?returnUrl=${returnUrl}`, { replace: true });
        setIsLoading(false);
        return;
      }

      setIsAuthed(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [location.pathname, location.search, navigate]);

  // 加载中状态
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          验证登录状态...
        </Typography>
      </Box>
    );
  }

  // 未认证且不是公开路由，不渲染内容（已重定向）
  if (!isAuthed && !isPublicRoute(location.pathname)) {
    return null;
  }

  // 已认证或是公开路由，渲染子组件
  return <>{children}</>;
};

/**
 * 用于检查当前路径是否需要认证的Hook
 */
export const useAuthRequired = (): boolean => {
  const location = useLocation();
  return !isPublicRoute(location.pathname);
};

/**
 * 用于检查用户登录状态的Hook
 */
export const useAuthStatus = () => {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => {
    const checkAuthStatus = () => {
      setAuthenticated(isAuthenticated());
    };

    // 监听storage变化
    window.addEventListener('storage', checkAuthStatus);

    // 定期检查认证状态
    const interval = setInterval(checkAuthStatus, 60000); // 每分钟检查一次

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      clearInterval(interval);
    };
  }, []);

  return {
    isAuthenticated: authenticated,
    login: () => setAuthenticated(true),
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthenticated(false);
    },
  };
};

export { AuthGuard as default };
