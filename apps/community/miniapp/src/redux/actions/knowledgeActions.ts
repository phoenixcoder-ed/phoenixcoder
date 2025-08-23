// knowledgeActions.ts
import { createAction } from 'redux-actions';

// 定义action类型
export const SEARCH_KNOWLEDGE_REQUEST = 'SEARCH_KNOWLEDGE_REQUEST';
export const SEARCH_KNOWLEDGE_SUCCESS = 'SEARCH_KNOWLEDGE_SUCCESS';
export const SEARCH_KNOWLEDGE_FAILURE = 'SEARCH_KNOWLEDGE_FAILURE';

export const GET_KNOWLEDGE_DETAIL_REQUEST = 'GET_KNOWLEDGE_DETAIL_REQUEST';
export const GET_KNOWLEDGE_DETAIL_SUCCESS = 'GET_KNOWLEDGE_DETAIL_SUCCESS';
export const GET_KNOWLEDGE_DETAIL_FAILURE = 'GET_KNOWLEDGE_DETAIL_FAILURE';

export const CLEAR_SEARCH_RESULTS = 'CLEAR_SEARCH_RESULTS';

// 创建action creators
export const searchKnowledgeRequest = createAction(SEARCH_KNOWLEDGE_REQUEST);
export const searchKnowledgeSuccess = createAction(SEARCH_KNOWLEDGE_SUCCESS);
export const searchKnowledgeFailure = createAction(SEARCH_KNOWLEDGE_FAILURE);

export const getKnowledgeDetailRequest = createAction(GET_KNOWLEDGE_DETAIL_REQUEST);
export const getKnowledgeDetailSuccess = createAction(GET_KNOWLEDGE_DETAIL_SUCCESS);
export const getKnowledgeDetailFailure = createAction(GET_KNOWLEDGE_DETAIL_FAILURE);

export const clearSearchResults = createAction(CLEAR_SEARCH_RESULTS);

// 异步action creators
export const searchKnowledge = (query: string) => {
    return async (dispatch: any) => {
        dispatch(searchKnowledgeRequest());
        try {
            // 模拟API调用
            const mockResults = [
                {
                    id: '1',
                    title: `关于 "${query}" 的搜索结果`,
                    summary: '这是一个模拟的搜索结果摘要',
                    tags: ['JavaScript', 'React'],
                    difficulty: 'medium' as const,
                    readTime: 5,
                },
                {
                    id: '2',
                    title: `${query} 进阶指南`,
                    summary: '深入了解相关技术概念和最佳实践',
                    tags: ['进阶', '最佳实践'],
                    difficulty: 'hard' as const,
                    readTime: 10,
                },
            ];

            // 模拟网络延迟
            await new Promise((resolve) => setTimeout(resolve, 1000));

            dispatch(searchKnowledgeSuccess(mockResults));
            return mockResults;
        } catch (error) {
            dispatch(searchKnowledgeFailure(error.message));
            throw error;
        }
    };
};

export const getKnowledgeDetail = (id: string) => {
    return async (dispatch: any) => {
        dispatch(getKnowledgeDetailRequest());
        try {
            // 模拟API调用
            const mockDetail = {
                id,
                title: '知识详情标题',
                content: '这是知识的详细内容...',
                tags: ['JavaScript', 'React'],
                difficulty: 'medium' as const,
                readTime: 5,
                author: '技术专家',
                publishDate: new Date().toISOString(),
                views: 1234,
                likes: 56,
            };

            // 模拟网络延迟
            await new Promise((resolve) => setTimeout(resolve, 800));

            dispatch(getKnowledgeDetailSuccess(mockDetail));
            return mockDetail;
        } catch (error) {
            dispatch(getKnowledgeDetailFailure(error.message));
            throw error;
        }
    };
};

// 导出所有action creators
export default {
    searchKnowledgeRequest,
    searchKnowledgeSuccess,
    searchKnowledgeFailure,
    getKnowledgeDetailRequest,
    getKnowledgeDetailSuccess,
    getKnowledgeDetailFailure,
    clearSearchResults,
    searchKnowledge,
    getKnowledgeDetail,
};
