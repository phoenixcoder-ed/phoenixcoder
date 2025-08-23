import api from '../../features/auth/api';

// 定义题目类型接口
export interface Question {
  id: string;
  title: string;
  description?: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correctAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  createdAt: string;
  updatedAt: string;
}

// 定义创建题目请求接口
export interface CreateQuestionRequest {
  title: string;
  description?: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correctAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

// 定义更新题目请求接口
export interface UpdateQuestionRequest {
  title?: string;
  description?: string;
  type?: string;
  options?: string[];
  correctAnswer?: string;
  difficulty?: string;
  category?: string;
}

// 获取题目列表，支持筛选和分页
export const getQuestions = async (
  category?: string,
  difficulty?: string,
  limit: number = 10,
  offset: number = 0
): Promise<Question[]> => {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (difficulty) params.append('difficulty', difficulty);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await api.get<Question[]>(`/questions?${params}`);
    return response.data;
  } catch (error) {
    throw new Error(
      '获取题目列表失败: ' +
        (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 获取单个题目
export const getQuestion = async (questionId: string): Promise<Question> => {
  try {
    const response = await api.get<Question>(`/questions/${questionId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      '获取题目详情失败: ' +
        (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 创建题目
export const createQuestion = async (
  questionData: CreateQuestionRequest
): Promise<Question> => {
  try {
    const response = await api.post<Question>('/questions', questionData);
    return response.data;
  } catch (error) {
    throw new Error(
      '创建题目失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 更新题目
export const updateQuestion = async (
  questionId: string,
  questionData: UpdateQuestionRequest
): Promise<Question> => {
  try {
    const response = await api.put<Question>(
      `/questions/${questionId}`,
      questionData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      '更新题目失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 删除题目
export const deleteQuestion = async (questionId: string): Promise<void> => {
  try {
    await api.delete(`/questions/${questionId}`);
  } catch (error) {
    throw new Error(
      '删除题目失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};
