import React from 'react';

import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom/matchers';
import { vi, describe, beforeEach, test, expect } from 'vitest';

// 导入服务
import { UserService } from './services/userService';
// 导入共享类型
import type { User } from './types/index';

import UserManagement from './index';

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  userType: 'programmer' | 'merchant' | 'admin';
  isActive: boolean;
}

// 模拟UserService
vi.mock('./services/userService', () => ({
  UserService: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    activateUser: vi.fn(),
    deactivateUser: vi.fn(),
    resetPassword: vi.fn(),
    getUserStats: vi.fn(),
  },
}));

// 模拟全局store
vi.mock('../../shared/store/globalStore', () => ({
  useGlobalStore: () => ({
    addNotification: vi.fn(),
  }),
}));

// 模拟react-admin的useTheme hook
vi.mock('react-admin', () => ({
  useTheme: () => [
    {
      palette: {
        primary: { main: '#1976d2' },
        success: { main: '#4caf50' },
        error: { main: '#f44336' },
      },
      shadows: ['none', '0px 2px 4px rgba(0,0,0,0.1)'],
    },
  ],
}));

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    fullName: 'Admin User',
    userType: 'admin',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    username: 'programmer1',
    email: 'programmer1@example.com',
    fullName: 'Programmer One',
    userType: 'programmer',
    isActive: true,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
];

describe('UserManagement Component', () => {
  beforeEach(() => {
    // 重置模拟
    vi.clearAllMocks();
  });

  test('renders user management page and fetches users', async () => {
    // 模拟API响应
    (UserService.getUsers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      users: mockUsers,
      total: mockUsers.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    // 渲染组件
    render(<UserManagement />);

    // 检查加载状态
    expect(screen.getByText('加载中...')).toBeInTheDocument();

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 检查用户列表是否渲染
    expect(screen.getByText('admin')).toBeInTheDocument();
    // 检查是否有程序员类型的Chip组件
    expect(screen.getByText('programmer')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('programmer1@example.com')).toBeInTheDocument();
  });

  test('opens add user dialog when add button is clicked', async () => {
    // 模拟API响应
    (UserService.getUsers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      users: mockUsers,
      total: mockUsers.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    // 渲染组件
    render(<UserManagement />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 点击添加按钮
    fireEvent.click(screen.getByRole('button', { name: /添加用户/i }));

    // 检查对话框是否打开
    // 使用within函数限定在对话框范围内查找
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('添加用户')).toBeInTheDocument();
  });

  test('adds a new user successfully', async () => {
    const newUser: CreateUserRequest = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      userType: 'programmer',
      isActive: true,
    };

    // 模拟初始用户列表获取
    (UserService.getUsers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      users: mockUsers,
      total: mockUsers.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    // 模拟创建用户
    (UserService.createUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...newUser,
      id: '3',
      fullName: newUser.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 模拟刷新后的用户列表
    (UserService.getUsers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      users: [
        ...mockUsers,
        {
          ...newUser,
          id: '3',
          fullName: newUser.username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: mockUsers.length + 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    // 渲染组件
    render(<UserManagement />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 点击添加按钮
    fireEvent.click(screen.getByRole('button', { name: /添加用户/i }));

    // 添加调试信息
    // screen.debug();

    // 调试：查看渲染的DOM结构
    // screen.debug();
    console.log('Document body:', document.body.innerHTML);

    // 通过placeholder属性查找表单元素并使用fireEvent.input
    const usernameInput = screen.getByPlaceholderText('请输入用户名');
    const emailInput = screen.getByPlaceholderText('请输入邮箱');
    const passwordInput = screen.getByPlaceholderText('请输入密码');

    fireEvent.input(usernameInput, { target: { value: newUser.username } });
    fireEvent.input(emailInput, { target: { value: newUser.email } });
    fireEvent.input(passwordInput, { target: { value: newUser.password } });

    // 提交表单
    fireEvent.click(screen.getByRole('button', { name: /添加|保存/ }));

    // 等待添加完成
    await waitFor(() => {
      expect(screen.getByText('添加用户成功')).toBeInTheDocument();
    });

    // 检查新用户是否在列表中
    // 添加调试信息
    console.log('Document body after adding user:', document.body.innerHTML);
    expect(screen.getByText('newuser')).toBeInTheDocument();
  });
});
