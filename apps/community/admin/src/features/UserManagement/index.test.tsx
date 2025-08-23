import React from 'react';

import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom/matchers';
import axios from 'axios';
import { vi, describe, beforeEach, test, expect } from 'vitest';

import { User, UserType } from './types/index';

import UserManagement from './index';

// 导入共享类型

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  userType: 'DEVELOPER' | 'CLIENT' | 'ADMIN';
  isActive: boolean;
}

// 模拟axios
vi.mock('axios');

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

const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

// 设置axios.create返回mock实例
(axios.create as ReturnType<typeof vi.fn>).mockReturnValue(mockAxiosInstance);

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    userType: UserType.ADMIN,
    fullName: 'Admin User',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    username: 'programmer1',
    email: 'programmer1@example.com',
    userType: UserType.DEVELOPER,
    fullName: 'Programmer One',
    isActive: true,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
];

describe('UserManagement Component', () => {
  beforeEach(() => {
    // 重置模拟
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.put.mockReset();
    mockAxiosInstance.delete.mockReset();
  });

  test('renders user management page and fetches users', async () => {
    // 模拟API响应
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: mockUsers,
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
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: mockUsers,
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
    // 模拟API响应
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: mockUsers,
    });
    const newUser: CreateUserRequest = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
      userType: 'DEVELOPER',
      isActive: true,
    };
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { ...newUser, id: '3', name: newUser.username },
    });
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: [
        ...mockUsers,
        {
          ...newUser,
          id: '3',
          name: newUser.username,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
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
