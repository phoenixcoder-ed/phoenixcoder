import React from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';

// 核心功能模块
import ChallengeManagement from '@/features/ChallengeManagement';
import ContentManagement from '@/features/ContentManagement';
import DataAnalytics from '@/features/DataAnalytics';
import FinancialManagement from '@/features/FinancialManagement';
import HomePage from '@/features/HomePage';
import NotificationCenter from '@/features/NotificationCenter';
import SkillCertification from '@/features/SkillCertification';
import SystemSettings from '@/features/SystemSettings';
import TaskManagement from '@/features/TaskManagement';
import TaskMarketplace from '@/features/TaskMarketplace';
import UserManagement from '@/features/UserManagement';
import ErrorTestPage from '@/shared/components/ErrorTestPage';
import { ErrorRoutes } from '@/shared/components/GlobalErrorHandler';
import { PermissionGuard } from '@/shared/components/PermissionGuard';

import Dashboard from './Dashboard';

/**
 * 管理后台路由配置
 * 包含完整的功能模块和权限控制
 */
export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 默认重定向到首页 */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* 首页 - 所有用户都可访问 */}
      <Route path="/home" element={<HomePage />} />

      {/* 仪表板 - 所有用户都可访问 */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* 用户管理 - 需要用户管理权限 */}
      <Route
        path="/users/*"
        element={
          <PermissionGuard permission="user_management">
            <UserManagement />
          </PermissionGuard>
        }
      />

      {/* 任务管理 - 需要任务管理权限 */}
      <Route
        path="/tasks/*"
        element={
          <PermissionGuard permission="task_management">
            <TaskManagement />
          </PermissionGuard>
        }
      />

      {/* 任务广场 - 所有用户都可访问 */}
      <Route path="/marketplace" element={<TaskMarketplace />} />

      {/* 技能认证管理 - 需要技能管理权限 */}
      <Route
        path="/skills/*"
        element={
          <PermissionGuard permission="skill_management">
            <SkillCertification />
          </PermissionGuard>
        }
      />

      {/* 挑战任务管理 - 需要内容管理权限 */}
      <Route
        path="/challenges/*"
        element={
          <PermissionGuard permission="content_management">
            <ChallengeManagement />
          </PermissionGuard>
        }
      />

      {/* 内容管理 - 需要内容管理权限 */}
      <Route
        path="/content/*"
        element={
          <PermissionGuard permission="content_management">
            <ContentManagement />
          </PermissionGuard>
        }
      />

      {/* 财务管理 - 需要财务管理权限 */}
      <Route
        path="/finance/*"
        element={
          <PermissionGuard permission="financial_management">
            <FinancialManagement />
          </PermissionGuard>
        }
      />

      {/* 数据分析 - 需要数据分析权限 */}
      <Route
        path="/analytics/*"
        element={
          <PermissionGuard permission="data_analytics">
            <DataAnalytics />
          </PermissionGuard>
        }
      />

      {/* 通知中心 - 所有用户都可访问 */}
      <Route path="/notifications/*" element={<NotificationCenter />} />

      {/* 系统设置 - 需要系统管理权限 */}
      <Route
        path="/settings/*"
        element={
          <PermissionGuard permission="system_management">
            <SystemSettings />
          </PermissionGuard>
        }
      />

      {/* 错误测试页面 - 仅开发环境 */}
      {process.env.NODE_ENV === 'development' && (
        <Route path="/test-errors" element={<ErrorTestPage />} />
      )}

      {/* 错误页面路由 */}
      <Route path="/error/*" element={<ErrorRoutes />} />

      {/* 404 页面 */}
      <Route path="*" element={<Navigate to="/error/404" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
