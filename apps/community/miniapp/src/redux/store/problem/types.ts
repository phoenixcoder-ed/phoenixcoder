// 题目类型定义
export interface Problem {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: number;
    tags: string[];
    sampleInput: string;
    sampleOutput: string;
    constraints: string;
    hints: string[];
    createdAt: string;
    updatedAt: string;
}

// 答案记录类型定义
export interface AnswerRecord {
    id: string;
    problemId: string;
    code: string;
    language: string;
    result: 'success' | 'failure' | 'pending';
    score: number;
    errorMessage: string;
    submitTime: string;
}

// 题目列表查询参数
export interface ProblemQueryParams {
    category?: string;
    difficulty?: number;
    page?: number;
    pageSize?: number;
}
