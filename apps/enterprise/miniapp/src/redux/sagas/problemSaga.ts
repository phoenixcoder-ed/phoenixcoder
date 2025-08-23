// 声明模块以解决类型问题
declare module 'redux-saga/effects' {}
declare module 'axios' {
    export interface AxiosResponse<T = any> {
        data: T;
    }
}

declare module '@/utils/httpUtil' {
    export namespace HttpUtil {
        export function fetchProblems(_category?: string, _difficulty?: number): Promise<AxiosResponse<any>>;
        export function fetchProblemDetail(_problemId: string): Promise<AxiosResponse<any>>;
        export function submitAnswer(_problemId: string, _code: string, _language: string): Promise<AxiosResponse<any>>;
        export function fetchAnswerRecords(): Promise<AxiosResponse<any>>;
        export function fetchWrongProblems(): Promise<AxiosResponse<any>>;
    }
}

declare module '@/redux/actions' {
    export const problemActions: {
        fetchProblemsRequest: any;
        fetchProblemsSuccess: (_data: any) => any;
        fetchProblemsFailure: (_error: string) => any;
        fetchProblemDetailRequest: any;
        fetchProblemDetailSuccess: (_data: any) => any;
        fetchProblemDetailFailure: (_error: string) => any;
        submitAnswerRequest: any;
        submitAnswerSuccess: (_data: any) => any;
        submitAnswerFailure: (_error: string) => any;
        fetchAnswerRecordsRequest: any;
        fetchAnswerRecordsSuccess: (_data: any) => any;
        fetchAnswerRecordsFailure: (_error: string) => any;
        fetchWrongProblemsRequest: any;
        fetchWrongProblemsSuccess: (_data: any) => any;
        fetchWrongProblemsFailure: (_error: string) => any;
    };
}

declare module '../../typed/types' {
    export interface ActionWithDeferred {
        payload: any;
        deferred: {
            resolve: () => void;
            reject: () => void;
        };
    }
    export interface IAction {
        type: string;
        payload?: any;
    }
}

declare module '@/redux/store/problem/types' {
    export interface Problem {}
    export interface AnswerRecord {}
}

import { call, put, takeLatest } from 'redux-saga/effects';
import { AxiosResponse } from 'axios';
import { problemActions } from '@/redux/actions';
import { HttpUtil } from '@/utils/httpUtil';
import { Problem, AnswerRecord } from '@/redux/store/problem/types';
import { ActionWithDeferred, IAction } from '../../typed/types';

/**
 * 获取题目列表Saga
 */
export function* fetchProblemsSaga() {
    return yield takeLatest(
        problemActions.fetchProblemsRequest,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { category: _category, difficulty: _difficulty } = payload || {};
                const { data }: AxiosResponse<Problem[]> = yield call(HttpUtil.fetchProblems, _category, _difficulty);
                yield put(problemActions.fetchProblemsSuccess(data));
                yield call(deferred.resolve);
            } catch {
                yield put(problemActions.fetchProblemsFailure('获取题目列表失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 获取题目详情Saga
 */
export function* fetchProblemDetailSaga() {
    return yield takeLatest(
        problemActions.fetchProblemDetailRequest,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { problemId: _problemId } = payload;
                const { data }: AxiosResponse<Problem> = yield call(HttpUtil.fetchProblemDetail, _problemId);
                yield put(problemActions.fetchProblemDetailSuccess(data));
                yield call(deferred.resolve);
            } catch {
                yield put(problemActions.fetchProblemDetailFailure('获取题目详情失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 提交答案Saga
 */
export function* submitAnswerSaga() {
    return yield takeLatest(
        problemActions.submitAnswerRequest,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { problemId: _problemId, code: _code, language: _language } = payload;
                const { data }: AxiosResponse<AnswerRecord> = yield call(
                    HttpUtil.submitAnswer,
                    _problemId,
                    _code,
                    _language,
                );
                yield put(problemActions.submitAnswerSuccess(data));
                yield call(deferred.resolve);
            } catch {
                yield put(problemActions.submitAnswerFailure('提交答案失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 获取答题记录Saga
 */
export function* fetchAnswerRecordsSaga() {
    return yield takeLatest(
        problemActions.fetchAnswerRecordsRequest,
        function* ({ deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { data: _data }: AxiosResponse<AnswerRecord[]> = yield call(HttpUtil.fetchAnswerRecords);
                yield put(problemActions.fetchAnswerRecordsSuccess(_data));
                yield call(deferred.resolve);
            } catch {
                yield put(problemActions.fetchAnswerRecordsFailure('获取答题记录失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 获取错题集Saga
 */
export function* fetchWrongProblemsSaga() {
    return yield takeLatest(
        problemActions.fetchWrongProblemsRequest,
        function* ({ deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { data: _data }: AxiosResponse<Problem[]> = yield call(HttpUtil.fetchWrongProblems);
                yield put(problemActions.fetchWrongProblemsSuccess(_data));
                yield call(deferred.resolve);
            } catch {
                yield put(problemActions.fetchWrongProblemsFailure('获取错题集失败'));
                yield call(deferred.reject);
            }
        },
    );
}
