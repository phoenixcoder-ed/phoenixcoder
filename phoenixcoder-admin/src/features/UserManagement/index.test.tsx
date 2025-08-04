/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import axios from 'axios';
import UserManagement from './index.tsx';
import { User, CreateUserRequest } from './types';
import { vi, describe, beforeEach, test, expect, it, afterAll, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// 模拟axios
vi.mock('axios');
const mockedAxios = axios as vi.Mocked<typeof axios>;

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    user_type: 'admin',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    username: 'programmer1',
    email: 'programmer1@example.com',
    user_type: 'programmer',
    is_active: true,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
];

describe('UserManagement Component', () => {
  beforeEach(() => {
    // 重置模拟
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedAxios.put.mockReset();
    mockedAxios.delete.mockReset();
  });

  test('renders user management page and fetches users', async () => {
    // 模拟API响应
    mockedAxios.get.mockResolvedValueOnce({
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
    mockedAxios.get.mockResolvedValueOnce({
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
    mockedAxios.get.mockResolvedValueOnce({
      data: mockUsers,
    });
    const newUser: CreateUserRequest = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      user_type: 'programmer',
      is_active: true,
    };
    mockedAxios.post.mockResolvedValueOnce({
      data: { ...newUser, id: '3', name: newUser.username },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: [...mockUsers, { ...newUser, id: '3', name: newUser.username, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
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