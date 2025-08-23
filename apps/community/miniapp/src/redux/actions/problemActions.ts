// problemActions.ts
import { createAction } from 'redux-actions';

// 定义action类型
export const FETCH_PROBLEMS_REQUEST = 'FETCH_PROBLEMS_REQUEST';
export const FETCH_PROBLEMS_SUCCESS = 'FETCH_PROBLEMS_SUCCESS';
export const FETCH_PROBLEMS_FAILURE = 'FETCH_PROBLEMS_FAILURE';

export const FETCH_PROBLEM_DETAIL_REQUEST = 'FETCH_PROBLEM_DETAIL_REQUEST';
export const FETCH_PROBLEM_DETAIL_SUCCESS = 'FETCH_PROBLEM_DETAIL_SUCCESS';
export const FETCH_PROBLEM_DETAIL_FAILURE = 'FETCH_PROBLEM_DETAIL_FAILURE';

export const SUBMIT_ANSWER_REQUEST = 'SUBMIT_ANSWER_REQUEST';
export const SUBMIT_ANSWER_SUCCESS = 'SUBMIT_ANSWER_SUCCESS';
export const SUBMIT_ANSWER_FAILURE = 'SUBMIT_ANSWER_FAILURE';

export const FETCH_ANSWER_RECORDS_REQUEST = 'FETCH_ANSWER_RECORDS_REQUEST';
export const FETCH_ANSWER_RECORDS_SUCCESS = 'FETCH_ANSWER_RECORDS_SUCCESS';
export const FETCH_ANSWER_RECORDS_FAILURE = 'FETCH_ANSWER_RECORDS_FAILURE';

export const FETCH_WRONG_PROBLEMS_REQUEST = 'FETCH_WRONG_PROBLEMS_REQUEST';
export const FETCH_WRONG_PROBLEMS_SUCCESS = 'FETCH_WRONG_PROBLEMS_SUCCESS';
export const FETCH_WRONG_PROBLEMS_FAILURE = 'FETCH_WRONG_PROBLEMS_FAILURE';

// 创建action creators
// 获取题目列表
export const fetchProblemsRequest = createAction(FETCH_PROBLEMS_REQUEST);
export const fetchProblemsSuccess = createAction(FETCH_PROBLEMS_SUCCESS);
export const fetchProblemsFailure = createAction(FETCH_PROBLEMS_FAILURE);

// 获取题目详情
export const fetchProblemDetailRequest = createAction(FETCH_PROBLEM_DETAIL_REQUEST);
export const fetchProblemDetailSuccess = createAction(FETCH_PROBLEM_DETAIL_SUCCESS);
export const fetchProblemDetailFailure = createAction(FETCH_PROBLEM_DETAIL_FAILURE);

// 提交答案
export const submitAnswerRequest = createAction(SUBMIT_ANSWER_REQUEST);
export const submitAnswerSuccess = createAction(SUBMIT_ANSWER_SUCCESS);
export const submitAnswerFailure = createAction(SUBMIT_ANSWER_FAILURE);

// 获取答题记录
export const fetchAnswerRecordsRequest = createAction(FETCH_ANSWER_RECORDS_REQUEST);
export const fetchAnswerRecordsSuccess = createAction(FETCH_ANSWER_RECORDS_SUCCESS);
export const fetchAnswerRecordsFailure = createAction(FETCH_ANSWER_RECORDS_FAILURE);

// 获取错题集
export const fetchWrongProblemsRequest = createAction(FETCH_WRONG_PROBLEMS_REQUEST);
export const fetchWrongProblemsSuccess = createAction(FETCH_WRONG_PROBLEMS_SUCCESS);
export const fetchWrongProblemsFailure = createAction(FETCH_WRONG_PROBLEMS_FAILURE);

// 导出所有action creators
export default {
    fetchProblemsRequest,
    fetchProblemsSuccess,
    fetchProblemsFailure,
    fetchProblemDetailRequest,
    fetchProblemDetailSuccess,
    fetchProblemDetailFailure,
    submitAnswerRequest,
    submitAnswerSuccess,
    submitAnswerFailure,
    fetchAnswerRecordsRequest,
    fetchAnswerRecordsSuccess,
    fetchAnswerRecordsFailure,
    fetchWrongProblemsRequest,
    fetchWrongProblemsSuccess,
    fetchWrongProblemsFailure,
};
