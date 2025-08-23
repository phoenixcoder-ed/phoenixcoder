// 任务相关actions
import { Dispatch } from 'redux';

// Action Types
export const FETCH_TASKS = 'FETCH_TASKS';
export const TAKE_TASK = 'TAKE_TASK';

export interface FetchTasksAction {
    type: typeof FETCH_TASKS;
    payload: any[];
}

export interface TakeTaskAction {
    type: typeof TAKE_TASK;
    payload: string;
}

// Action Creators
export const fetchTasks = () => {
    return async (dispatch: Dispatch) => {
        try {
            // 模拟API请求
            const tasks = [];
            dispatch({ type: FETCH_TASKS, payload: tasks });
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
    };
};

export const takeTask = (taskId: string) => {
    return async (dispatch: Dispatch) => {
        try {
            // 模拟API请求
            dispatch({ type: TAKE_TASK, payload: taskId });
        } catch (error) {
            console.error('Failed to take task:', error);
        }
    };
};

// 导出actions对象
export const taskActions = {
    fetchTasks,
    takeTask,
};
