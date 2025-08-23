import Immutable, { ImmutableObject } from 'seamless-immutable';
import { problemActions } from '@/redux/actions';
import { IAction } from '@/typed/types';
import createReducers from '@/utils/reducerHelper';

// 导入问题相关类型
import { Problem, AnswerRecord } from '@/redux/store/problem/types';

// 定义ProblemState接口
export interface ProblemState {
    problems: Problem[];
    currentProblem: Problem | null;
    answerRecords: AnswerRecord[];
    wrongProblems: Problem[];
    loading: boolean;
    error: string | null;
}

// 扩展ProblemState接口，添加merge方法
declare module '@/redux/store/problem/types' {
    export interface ProblemState {
        merge: (_changes: any) => ImmutableObject<ProblemState>;
    }
}

// 初始状态
const initState: ImmutableObject<ProblemState> = Immutable.from({
    problems: [],
    currentProblem: null,
    answerRecords: [],
    wrongProblems: [],
    loading: false,
    error: null,
});

export default createReducers((on) => {
    // 获取题目列表
    on(problemActions.fetchProblemsRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 获取题目列表成功
    on(problemActions.fetchProblemsSuccess, (state: typeof initState, action: IAction) => {
        const { problems } = action.payload;
        return state.merge({
            problems,
            loading: false,
        });
    });

    // 获取题目列表失败
    on(problemActions.fetchProblemsFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });

    // 获取题目详情
    on(problemActions.fetchProblemDetailRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 获取题目详情成功
    on(problemActions.fetchProblemDetailSuccess, (state: typeof initState, action: IAction) => {
        const { problem } = action.payload;
        return state.merge({
            currentProblem: problem,
            loading: false,
        });
    });

    // 获取题目详情失败
    on(problemActions.fetchProblemDetailFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });

    // 提交答案
    on(problemActions.submitAnswerRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 提交答案成功
    on(problemActions.submitAnswerSuccess, (state: typeof initState, action: IAction) => {
        const { record } = action.payload;
        // 更新答题记录
        const answerRecords = [...state.answerRecords, record];
        // 如果答案错误，更新错题集
        let wrongProblems = state.wrongProblems;
        if (!record.passed) {
            wrongProblems = [...wrongProblems, record.problemId];
            // 去重
            wrongProblems = Array.from(new Set(wrongProblems));
        }
        return state.merge({
            answerRecords,
            wrongProblems,
            loading: false,
        });
    });

    // 提交答案失败
    on(problemActions.submitAnswerFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });

    // 获取答题记录
    on(problemActions.fetchAnswerRecordsRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 获取答题记录成功
    on(problemActions.fetchAnswerRecordsSuccess, (state: typeof initState, action: IAction) => {
        const { records } = action.payload;
        return state.merge({
            answerRecords: records,
            loading: false,
        });
    });

    // 获取答题记录失败
    on(problemActions.fetchAnswerRecordsFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });

    // 获取错题集
    on(problemActions.fetchWrongProblemsRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 获取错题集成功
    on(problemActions.fetchWrongProblemsSuccess, (state: typeof initState, action: IAction) => {
        const { problems } = action.payload;
        return state.merge({
            wrongProblems: problems,
            loading: false,
        });
    });

    // 获取错题集失败
    on(problemActions.fetchWrongProblemsFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });
}, initState);
