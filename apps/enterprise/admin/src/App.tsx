import React, { useEffect } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';

import AdminRoutes from './app/AdminRoutes';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './features/auth/LoginPage';
import {
  GitHubCallback,
  WeChatCallback,
  GoogleCallback,
} from './features/auth/OAuthCallback';
import { LandingPage } from './features/public/LandingPage';
import { RegisterPage } from './features/public/RegisterPage';
import { Layout } from './Layout';
import { AuthGuard } from './shared/components/AuthGuard';
import EnvInfo from './shared/components/EnvInfo';
import {
  GlobalErrorHandler,
  ErrorRoutes,
} from './shared/components/GlobalErrorHandler';
import { queryClient } from './shared/config/queryClient';
import { PermissionProvider } from './shared/managers/PermissionManager.tsx';
import AppInitializer from './shared/utils/appInitializer';
import { ReduxProvider } from './store/Provider';
import { ThemeProviderWrapper } from './theme';

// 内部应用组件，处理初始化逻辑
const AppContent: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 初始化应用
    const initializer = AppInitializer.getInstance();
    initializer.initialize(navigate);
  }, [navigate]);

  return (
    <Routes>
      {/* 错误页面路由 */}
      <Route path="/error/*" element={<ErrorRoutes />} />

      {/* 公开页面路由 */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* OAuth 回调路由 */}
      <Route path="/auth/github/callback" element={<GitHubCallback />} />
      <Route path="/auth/wechat/callback" element={<WeChatCallback />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      {/* 需要认证的主应用路由 */}
      <Route
        path="/*"
        element={
          <AuthGuard>
            <ThemeProviderWrapper>
              <PermissionProvider>
                <Layout>
                  <AdminRoutes />
                  <EnvInfo />
                </Layout>
              </PermissionProvider>
            </ThemeProviderWrapper>
          </AuthGuard>
        }
      />
    </Routes>
  );
};

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalErrorHandler>
      <ReduxProvider>
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </ReduxProvider>
    </GlobalErrorHandler>
  </QueryClientProvider>
);
