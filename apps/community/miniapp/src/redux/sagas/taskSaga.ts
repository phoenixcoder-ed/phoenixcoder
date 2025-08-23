import { call, put, takeLatest } from 'redux-saga/effects';
import { taskActions } from '@/redux/actions';
import { fetchTasksWithDelay, takeTaskWithDelay } from '@/utils/httpUtil';

// 获取任务列表Saga
function* fetchTasksSaga() {
    try {
        // 调用API获取数据
        const response = yield call(fetchTasksWithDelay);
        if (response && response.code === 200) {
            yield put(taskActions.fetchTasksSuccess(response.data));
        } else {
            yield put(taskActions.fetchTasksFailed('获取任务列表失败，请重试'));
        }
    } catch {
        yield put(taskActions.fetchTasksFailed('获取任务列表失败，请重试'));
    }
}

// 接单Saga
function* takeTaskSaga(action: any) {
    try {
        const { taskId } = action.payload;
        // 调用API接单
        const response = yield call(takeTaskWithDelay, taskId);
        if (response && response.code === 200) {
            yield put(taskActions.takeTaskSuccess(taskId));
        } else {
            yield put(taskActions.takeTaskFailed('接单失败，请重试'));
        }
    } catch {
        yield put(taskActions.takeTaskFailed('接单失败，请重试'));
    }
}

// 监听Action
export function* watchFetchTasks() {
    yield takeLatest(taskActions.fetchTasks, fetchTasksSaga);
}

export function* watchTakeTask() {
    yield takeLatest(taskActions.takeTask, takeTaskSaga);
}
