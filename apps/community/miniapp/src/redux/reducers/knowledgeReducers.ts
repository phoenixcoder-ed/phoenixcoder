import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';
import {
    SEARCH_KNOWLEDGE_REQUEST,
    SEARCH_KNOWLEDGE_SUCCESS,
    SEARCH_KNOWLEDGE_FAILURE,
    GET_KNOWLEDGE_DETAIL_REQUEST,
    GET_KNOWLEDGE_DETAIL_SUCCESS,
    GET_KNOWLEDGE_DETAIL_FAILURE,
    CLEAR_SEARCH_RESULTS,
} from '@/redux/actions/knowledgeActions';
import { KnowledgeState } from '@/redux/store/knowledge/types';

// 初始状态
const initState: KnowledgeState = {
    searchResults: [],
    currentKnowledge: null,
    categories: [],
    loading: false,
    error: null,
    searchHistory: [],
    hotTopics: ['JavaScript异步编程', 'React Hooks使用技巧', 'TypeScript类型系统', '小程序性能优化', 'Node.js事件循环'],
};

// 创建不可变状态
const immutableInitState = Immutable.from(initState);

// 创建 reducer
const knowledgeReducers = handleActions(
    {
        // 搜索知识请求
        [SEARCH_KNOWLEDGE_REQUEST]: (state: any) => {
            return state.merge({
                loading: true,
                error: null,
            });
        },

        // 搜索知识成功
        [SEARCH_KNOWLEDGE_SUCCESS]: (state: any, action: any) => {
            return state.merge({
                searchResults: action.payload,
                loading: false,
                error: null,
            });
        },

        // 搜索知识失败
        [SEARCH_KNOWLEDGE_FAILURE]: (state: any, action: any) => {
            return state.merge({
                loading: false,
                error: action.payload,
            });
        },

        // 获取知识详情请求
        [GET_KNOWLEDGE_DETAIL_REQUEST]: (state: any) => {
            return state.merge({
                loading: true,
                error: null,
            });
        },

        // 获取知识详情成功
        [GET_KNOWLEDGE_DETAIL_SUCCESS]: (state: any, action: any) => {
            return state.merge({
                currentKnowledge: action.payload,
                loading: false,
                error: null,
            });
        },

        // 获取知识详情失败
        [GET_KNOWLEDGE_DETAIL_FAILURE]: (state: any, action: any) => {
            return state.merge({
                loading: false,
                error: action.payload,
            });
        },

        // 清除搜索结果
        [CLEAR_SEARCH_RESULTS]: (state: any) => {
            return state.merge({
                searchResults: [],
                currentKnowledge: null,
                error: null,
            });
        },
    },
    immutableInitState,
);

export default knowledgeReducers;
