/**
 * 用户信息组件
 * 显示当前登录用户信息和注销功能
 */

import React from 'react';

import { useAuth } from '../contexts/AuthContext';

export const UserProfile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto mt-4 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-600">未登录</h3>
          <p className="text-sm text-gray-500 mt-1">请先登录以查看用户信息</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('注销失败:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>

      <div className="mb-4">
        <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
          {user.userType || '普通用户'}
        </span>
      </div>

      <button
        onClick={handleLogout}
        className="w-full px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
      >
        注销
      </button>
    </div>
  );
};

export default UserProfile;
