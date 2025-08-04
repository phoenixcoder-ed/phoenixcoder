import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import KnowledgeBase from './index';
import axios from 'axios';
import { vi } from 'vitest';
// 模拟 vi 命名空间
declare namespace vi {
  type Mocked<T> = T & {
    mockClear: () => void;
    mockReset: () => void;
    mockRestore: () => void;
    mockImplementation: (fn: (...args: any[]) => any) => any;
    mockImplementationOnce: (fn: (...args: any[]) => any) => any;
    mockRejectedValue: (value: any) => any;
    mockRejectedValueOnce: (value: any) => any;
    mockResolvedValue: (value: any) => any;
    mockResolvedValueOnce: (value: any) => any;
  };
}

// 模拟测试全局变量
declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const expect: (actual: any) => {
  toBeInTheDocument: () => void;
  not: { toBeInTheDocument: () => void; };
  toHaveBeenCalledWith: (...args: any[]) => void;
  toHaveValue: (value: any) => void;
};

// 模拟axios
vi.mock('axios');
const mockedAxios = axios as any;

// 测试数据
const mockArticles = [
  {
    id: '1',
    title: 'React基础知识',
    content: 'React是一个用于构建用户界面的JavaScript库。',
    summary: 'React基础概念介绍',
    tags: ['react', 'frontend'],
    category: '技术',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Node.js实战',
    content: 'Node.js是一个基于Chrome V8引擎的JavaScript运行时。',
    summary: 'Node.js实战指南',
    tags: ['nodejs', 'backend'],
    category: '技术',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
  {
    id: '3',
    title: '团队协作技巧',
    content: '有效团队协作的关键技巧和方法。',
    summary: '团队协作最佳实践',
    tags: ['teamwork', 'management'],
    category: '管理',
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-03T00:00:00Z',
  },
];

describe('KnowledgeBase Component', () => {
  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks();
  });

  test('renders knowledge base page with title', () => {
    render(<KnowledgeBase />);
    expect(screen.getByText('知识库管理')).toBeInTheDocument();
  });

  test('fetches and displays articles correctly', async () => {
    // 模拟API响应
    mockedAxios.get.mockResolvedValueOnce({
      data: mockArticles,
    });

    render(<KnowledgeBase />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('React基础知识')).toBeInTheDocument();
      expect(screen.getByText('Node.js实战')).toBeInTheDocument();
      expect(screen.getByText('团队协作技巧')).toBeInTheDocument();
    });

    // 验证API调用
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/articles');
  });

  test('opens add article dialog when add button is clicked', async () => {
    // 模拟API响应
    mockedAxios.get.mockResolvedValueOnce({
      data: mockArticles,
    });

    render(<KnowledgeBase />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('React基础知识')).toBeInTheDocument();
    });

    // 点击添加按钮
    fireEvent.click(screen.getByText('添加文章'));

    // 验证对话框是否打开
    expect(screen.getByText('添加文章')).toBeInTheDocument();
    expect(screen.getByLabelText('标题')).toBeInTheDocument();
    expect(screen.getByLabelText('摘要')).toBeInTheDocument();
  });

  test('submits add article form correctly', async () => {
    // 模拟API响应
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: '4',
        title: 'TypeScript入门',
        content: 'TypeScript是JavaScript的超集，添加了类型系统。',
        summary: 'TypeScript基础教程',
        tags: ['typescript', 'frontend'],
        category: '技术',
        createdAt: '2023-01-04T00:00:00Z',
        updatedAt: '2023-01-04T00:00:00Z',
      },
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: mockArticles,
    });

    // 添加文章后的数据
    mockedAxios.get.mockResolvedValueOnce({
      data: [...mockArticles, {
        id: '4',
        title: 'TypeScript入门',
        content: 'TypeScript是JavaScript的超集，添加了类型系统。',
        summary: 'TypeScript基础教程',
        tags: ['typescript', 'frontend'],
        category: '技术',
        createdAt: '2023-01-04T00:00:00Z',
        updatedAt: '2023-01-04T00:00:00Z',
      }],
    });

    render(<KnowledgeBase />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('React基础知识')).toBeInTheDocument();
    });

    // 点击添加按钮
    fireEvent.click(screen.getByText('添加文章'));

    // 填写表单
    fireEvent.change(screen.getByLabelText('标题'), {
      target: { value: 'TypeScript入门' },
    });
    fireEvent.change(screen.getByLabelText('摘要'), {
      target: { value: 'TypeScript基础教程' },
    });
    // 富文本编辑器比较特殊，这里模拟内容变化
    // 实际项目中可能需要更复杂的模拟
    const contentInput = document.querySelector('.ql-editor') as HTMLElement;
    if (contentInput) {
      contentInput.innerHTML = 'TypeScript是JavaScript的超集，添加了类型系统。';
    }
    // 添加标签
    fireEvent.change(screen.getByLabelText('添加标签'), {
      target: { value: 'typescript' },
    });
    fireEvent.click(screen.getByText('添加'));
    fireEvent.change(screen.getByLabelText('添加标签'), {
      target: { value: 'frontend' },
    });
    fireEvent.click(screen.getByText('添加'));

    // 提交表单
    fireEvent.click(screen.getByText('确认'));

    // 等待API调用完成
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/articles', {
        title: 'TypeScript入门',
        summary: 'TypeScript基础教程',
        content: 'TypeScript是JavaScript的超集，添加了类型系统。',
        tags: ['typescript', 'frontend'],
        category: '技术',
      });
    });

    // 验证新文章是否显示
    await waitFor(() => {
      expect(screen.getByText('TypeScript入门')).toBeInTheDocument();
    });
  });

  test('opens edit article dialog when edit button is clicked', async () => {
    // 模拟API响应
    mockedAxios.get.mockResolvedValueOnce({
      data: mockArticles,
    });

    render(<KnowledgeBase />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('React基础知识')).toBeInTheDocument();
    });

    // 点击编辑按钮
    const editButtons = screen.getAllByText('编辑');
    fireEvent.click(editButtons[0]);

    // 验证对话框是否打开并且已填充数据
    expect(screen.getByText('编辑文章')).toBeInTheDocument();
    expect(screen.getByLabelText('标题')).toHaveValue('React基础知识');
    expect(screen.getByLabelText('摘要')).toHaveValue('React基础概念介绍');
  });

  test('deletes article when delete button is clicked', async () => {
    // 模拟API响应
    mockedAxios.get.mockResolvedValueOnce({
      data: mockArticles,
    });
    mockedAxios.delete.mockResolvedValueOnce({
      status: 204,
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: [mockArticles[1], mockArticles[2]], // 只剩后两篇文章
    });

    render(<KnowledgeBase />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('React基础知识')).toBeInTheDocument();
    });

    // 点击删除按钮
    const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
    fireEvent.click(deleteButtons[0]);

    // 确认删除
    fireEvent.click(screen.getByText('确认'));

    // 等待删除完成
    await waitFor(() => {
      expect(screen.queryByText('React基础知识')).not.toBeInTheDocument();
      expect(screen.getByText('Node.js实战')).toBeInTheDocument();
      expect(screen.getByText('团队协作技巧')).toBeInTheDocument();
    });

    // 验证API调用
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/articles/1');
  });

  test('filters articles by search query', async () => {
    // 模拟API响应
    mockedAxios.get.mockResolvedValueOnce({
      data: mockArticles,
    });

    render(<KnowledgeBase />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('React基础知识')).toBeInTheDocument();
      expect(screen.getByText('Node.js实战')).toBeInTheDocument();
      expect(screen.getByText('团队协作技巧')).toBeInTheDocument();
    });

    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText('搜索文章...') as HTMLInputElement;
    fireEvent.change(searchInput, {
      target: { value: 'React' },
    });

    // 验证过滤结果
    expect(screen.getByText('React基础知识')).toBeInTheDocument();
    expect(screen.queryByText('Node.js实战')).not.toBeInTheDocument();
    expect(screen.queryByText('团队协作技巧')).not.toBeInTheDocument();
  });

  test('filters articles by category', async () => {
    // 模拟API响应
    mockedAxios.get.mockResolvedValueOnce({
      data: mockArticles,
    });

    render(<KnowledgeBase />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('React基础知识')).toBeInTheDocument();
    });

    // 选择分类过滤
    const categorySelect = screen.getByLabelText('分类') as HTMLSelectElement;
    fireEvent.change(categorySelect, {
      target: { value: '管理' },
    });

    // 验证过滤结果
    expect(screen.queryByText('React基础知识')).not.toBeInTheDocument();
    expect(screen.queryByText('Node.js实战')).not.toBeInTheDocument();
    expect(screen.getByText('团队协作技巧')).toBeInTheDocument();
  });
});