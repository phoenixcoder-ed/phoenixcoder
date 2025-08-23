// 声明模块以解决类型问题
import { combineReducers } from 'redux';
import type { Reducer, AnyAction } from 'redux';
import accountReducers from './accountReducers';
import taskReducers from './taskReducers';
import growthReducers from './growthReducers';
import problemReducers from './problemReducers';
import postReducers from './postReducers';
import knowledgeReducers from './knowledgeReducers';

// 定义应用状态类型
interface AppState {
    accountReducers: ReturnType<typeof accountReducers>;
    taskReducers: ReturnType<typeof taskReducers>;
    growthReducers: ReturnType<typeof growthReducers>;
    problemReducers: ReturnType<typeof problemReducers>;
    postReducers: ReturnType<typeof postReducers>;
    knowledgeReducers: ReturnType<typeof knowledgeReducers>;
}

// 组合reducers并添加类型注解
const rootReducer: Reducer<AppState, AnyAction> = combineReducers<AppState>({
    accountReducers,
    taskReducers,
    growthReducers,
    problemReducers,
    postReducers,
    knowledgeReducers,
});

export default rootReducer;

export type { AppState };
