import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import InterviewQuestions from './InterviewQuestions';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import * as apiModule from './api';

// 模拟api模块
const mockGetQuestions = vi.fn();
const mockCreateQuestion = vi.fn();
const mockUpdateQuestion = vi.fn();
const mockDeleteQuestion = vi.fn();

vi.mock('./api', () => ({
  __esModule: true,
  getQuestions: mockGetQuestions,
  createQuestion: mockCreateQuestion,
  updateQuestion: mockUpdateQuestion,
  deleteQuestion: mockDeleteQuestion,
}));

// 测试数据
const mockQuestions = [
  {
    id: '1',
    title: 'What is React?',
    description: 'Explain the basics of React framework.',
    type: 'essay',
    difficulty: 'easy',
    category: '编程',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'How does useState work?',
    description: 'Explain the useState hook in React.',
    type: 'essay',
    difficulty: 'medium',
    category: '编程',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
];

describe('InterviewQuestions Component', () => {
  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks();
  });

  test('renders interview questions page with title', () => {
    render(<InterviewQuestions />);
    expect(screen.getByText('面试题管理')).toBeInTheDocument();
  });

  test('fetches and displays questions correctly', async () => {
    // 模拟API响应
    const mockResponse = mockQuestions;
    console.log('Mock response:', mockResponse);
    mockGetQuestions.mockResolvedValueOnce(mockResponse);

    render(<InterviewQuestions />);

    // 检查加载状态
    expect(screen.getByText('加载中...')).toBeInTheDocument();

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 检查是否有错误
    expect(screen.queryByText(/错误:/)).not.toBeInTheDocument();

    // 验证API调用
    const calls = mockGetQuestions.mock.calls;
    console.log('API calls:', calls);
    expect(mockGetQuestions).toHaveBeenCalledWith();

    // 获取API调用的返回值
    const returnValue = mockGetQuestions.mock.results[0].value;
    console.log('API return value:', returnValue);

    // 输出问题列表长度，用于调试
    const rows = screen.queryAllByRole('row');
    console.log('Table rows:', rows.length - 1); // 减去表头行

    // 输出表格内容，用于调试
    if (rows.length > 1) {
      rows.slice(1).forEach((row, index) => {
        console.log(`Row ${index + 1}:`, row.textContent);
      });
    }

    // 等待数据加载完成并显示
    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument();
      expect(screen.getByText('How does useState work?')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('opens add question dialog when add button is clicked', () => {
    render(<InterviewQuestions />);

    // 点击添加按钮
    fireEvent.click(screen.getByText('添加面试题'));

    // 验证对话框是否打开
    expect(screen.getByText('添加面试题')).toBeInTheDocument();
    expect(screen.getByLabelText('标题')).toBeInTheDocument();
    expect(screen.getByLabelText('内容')).toBeInTheDocument();
  });

  test('submits add question form correctly', async () => {
    // 模拟API响应
    mockCreateQuestion.mockResolvedValueOnce({
      id: '3',
      title: 'New Question',
      description: 'New Question Content',
      type: 'essay',
      difficulty: 'hard',
      category: '编程',
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    });

    mockGetQuestions.mockResolvedValueOnce(mockQuestions);

    render(<InterviewQuestions />);

    // 点击添加按钮
    fireEvent.click(screen.getByText('添加面试题'));

    // 填写表单
    fireEvent.change(screen.getByLabelText('标题'), {
      target: { value: 'New Question' },
    });
    fireEvent.change(screen.getByLabelText('描述'), {
      target: { value: 'New Question Content' },
    });
    fireEvent.change(screen.getByLabelText('分类'), {
      target: { value: 'backend' },
    });
    fireEvent.change(screen.getByLabelText('难度'), {
      target: { value: 'advanced' },
    });

    // 提交表单
    fireEvent.click(screen.getByText('确认'));

    // 等待API调用完成
    await waitFor(() => {
      expect(mockCreateQuestion).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Question',
        description: 'New Question Content',
        type: 'essay',
        difficulty: 'hard',
        category: '编程',
      }));
    });
  });

  test('opens edit question dialog when edit button is clicked', async () => {
    // 模拟API响应
    mockGetQuestions.mockResolvedValueOnce(mockQuestions);

    render(<InterviewQuestions />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    // 点击编辑按钮
    const editButtons = screen.getAllByText('编辑');
    fireEvent.click(editButtons[0]);

    // 验证对话框是否打开并且已填充数据
    expect(screen.getByText('编辑面试题')).toBeInTheDocument();
    expect(screen.getByLabelText('标题')).toHaveValue('What is React?');
    expect(screen.getByLabelText('描述')).toHaveValue('Explain the basics of React framework.');
  });

  test('deletes question when delete button is clicked', async () => {
    // 模拟API响应
    mockGetQuestions.mockResolvedValueOnce(mockQuestions);
    mockDeleteQuestion.mockResolvedValueOnce({
      status: 204,
    });
    mockGetQuestions.mockResolvedValueOnce([mockQuestions[1]]); // 只剩第二个问题

    render(<InterviewQuestions />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    // 点击删除按钮
    const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
    fireEvent.click(deleteButtons[0]);

    // 确认删除
    fireEvent.click(screen.getByText('确认'));

    // 等待删除完成
    await waitFor(() => {
      expect(screen.queryByText('What is React?')).not.toBeInTheDocument();
      expect(screen.getByText('How does useState work?')).toBeInTheDocument();
      expect(mockDeleteQuestion).toHaveBeenCalledWith('1');
    });

    // 验证API调用
    expect(mockDeleteQuestion).toHaveBeenCalledWith('1');
  });
});