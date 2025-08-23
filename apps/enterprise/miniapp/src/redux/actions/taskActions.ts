import createActions from '@/utils/actionHelper';
import { Action } from 'redux-actions';
import { Task } from '@/redux/store/task/types';

// 声明模块以解决类型问题
declare module '@/utils/actionHelper' {
    function createActions(_actions: any): any;
    export default createActions;
}

declare module 'redux-actions' {
    export interface Action<T> {
        type: string;
        payload?: T;
        error?: boolean;
        meta?: any;
    }
}

declare module '@/redux/store/task/types' {
    export interface Task {
        id: string;
        title: string;
        description: string;
        reward: number;
        tags: string[];
        deadline: string;
        skills: string[];
        status: 'available' | 'taken' | 'completed';
    }
}

export interface TaskActions {
    fetchTasks: () => Action<void>;
    fetchTasksSuccess: (_tasks: Task[]) => Action<Task[]>;
    fetchTasksFailed: (_error: string) => Action<string>;
    takeTask: (_taskId: string) => Action<string>;
    takeTaskSuccess: (_taskId: string) => Action<string>;
    takeTaskFailed: (_error: string) => Action<string>;
}

export default createActions({
    fetchTasks: () => ({}),
    fetchTasksSuccess: (_tasks: Task[]) => ({ tasks: _tasks }),
    fetchTasksFailed: (_error: string) => ({ error: _error }),
    takeTask: (_taskId: string) => ({ taskId: _taskId }),
    takeTaskSuccess: (_taskId: string) => ({ taskId: _taskId }),
    takeTaskFailed: (_error: string) => ({ error: _error }),
}) as TaskActions;
