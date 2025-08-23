import { apiClient } from '../../../services/api';

// 定义题目类型接口
export interface Question {
  id: string;
  title: string;
  description?: string;
  type: 'singleChoice' | 'multipleChoice' | 'trueFalse' | 'essay';
  options?: string[];
  correctAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 定义分页响应接口
export interface PaginatedQuestions {
  items: Question[];
  total: number;
}

// 定义创建题目请求接口
export interface CreateQuestionRequest {
  title: string;
  description?: string;
  type: 'singleChoice' | 'multipleChoice' | 'trueFalse' | 'essay';
  options?: string[];
  correctAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

// 定义更新题目请求接口
export interface UpdateQuestionRequest {
  title?: string;
  description?: string;
  type?: 'singleChoice' | 'multipleChoice' | 'trueFalse' | 'essay';
  options?: string[];
  correctAnswer?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

// 定义查询参数接口
export interface QuestionQueryParams {
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * 面试题服务
 * 提供面试题相关的API调用方法
 */
export class QuestionService {
  /**
   * 获取所有题目，支持筛选和分页
   */
  static async getQuestions(
    params?: QuestionQueryParams
  ): Promise<PaginatedQuestions> {
    // 构建查询字符串
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }

    const endpoint = searchParams.toString()
      ? `/questions?${searchParams.toString()}`
      : '/questions';

    return await apiClient.get<PaginatedQuestions>(endpoint);
  }

  /**
   * 获取单个题目
   */
  static async getQuestion(id: string): Promise<Question> {
    return await apiClient.get<Question>(`/questions/${id}`);
  }

  /**
   * 创建题目
   */
  static async createQuestion(
    question: CreateQuestionRequest
  ): Promise<Question> {
    return await apiClient.post<Question>('/questions', question);
  }

  /**
   * 更新题目
   */
  static async updateQuestion(
    id: string,
    question: UpdateQuestionRequest
  ): Promise<Question> {
    return await apiClient.put<Question>(`/questions/${id}`, question);
  }

  /**
   * 删除题目
   */
  static async deleteQuestion(id: string): Promise<void> {
    await apiClient.delete<void>(`/questions/${id}`);
  }

  /**
   * 批量删除题目
   */
  static async deleteQuestions(ids: string[]): Promise<void> {
    await apiClient.post<void>('/questions/batch-delete', { ids });
  }

  /**
   * 获取题目分类列表
   */
  static async getCategories(): Promise<string[]> {
    return await apiClient.get<string[]>('/questions/categories');
  }

  /**
   * 获取题目统计信息
   */
  static async getStatistics(): Promise<{
    total: number;
    byDifficulty: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    return await apiClient.get<{
      total: number;
      byDifficulty: Record<string, number>;
      byCategory: Record<string, number>;
    }>('/questions/statistics');
  }
}
