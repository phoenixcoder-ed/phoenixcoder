// 模拟的面试题API服务

import { Question, CreateQuestionRequest, UpdateQuestionRequest } from '../features/interviewQuestions/InterviewQuestions';

// 模拟数据
const mockQuestions: Question[] = [
  {
    id: '1',
    title: '什么是React?',
    description: '请简要描述React的核心概念。',
    type: 'essay',
    difficulty: 'easy',
    category: '前端',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'React的生命周期有哪些?',
    description: '请列举React组件的主要生命周期方法。',
    type: 'essay',
    difficulty: 'medium',
    category: '前端',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z'
  }
];

// 获取所有面试题
export const getQuestions = async (): Promise<Question[]> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockQuestions;
};

// 获取单个面试题
export const getQuestion = async (id: string): Promise<Question | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockQuestions.find(question => question.id === id);
};

// 创建面试题
export const createQuestion = async (data: CreateQuestionRequest): Promise<Question> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newQuestion: Question = {
    id: Date.now().toString(),
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockQuestions.push(newQuestion);
  return newQuestion;
};

// 更新面试题
export const updateQuestion = async (id: string, data: UpdateQuestionRequest): Promise<Question | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockQuestions.findIndex(question => question.id === id);
  if (index !== -1) {
    mockQuestions[index] = {
      ...mockQuestions[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return mockQuestions[index];
  }
  return undefined;
};

// 删除面试题
export const deleteQuestion = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockQuestions.findIndex(question => question.id === id);
  if (index !== -1) {
    mockQuestions.splice(index, 1);
    return true;
  }
  return false;
};