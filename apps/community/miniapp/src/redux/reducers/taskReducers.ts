// 声明模块以解决类型问题
declare module 'seamless-immutable' {
    export interface ImmutableObject<T> {
        merge(_values: any): ImmutableObject<T>;
        map(_func: (_value: any, _index: number) => any): any[];
        // 添加其他可能用到的方法
    }
    export function from<T>(_value: T): ImmutableObject<T>;
    export default { from };
}

declare module '@/redux/actions' {
    export const taskActions: any;
}

declare module '@/typed/types' {
    export interface IAction {
        type: string;
        payload?: any;
        error?: boolean;
        meta?: any;
    }
}

declare module '@/utils/reducerHelper' {
    function createReducers(_func: (_on: any) => void): any;
    export default createReducers;
}

// @ts-ignore: 无法找到模块声明，需安装seamless-immutable
import Immutable from 'seamless-immutable';
import { taskActions } from '../actions';
import { IAction } from '@/typed/types';
import createReducers from '@/utils/reducerHelper';

declare interface Task {
    id: string;
    title: string;
    description: string;
    reward: number;
    tags: string[];
    deadline: string;
    skills: string[];
    status: 'available' | 'taken' | 'completed';
}

const initState = Immutable.from({
    tasks: [] as Task[],
    loading: false,
    error: '',
});

export default createReducers((on) => {
    on(taskActions.fetchTasks, (state: typeof initState) => {
        return state.merge({ loading: true, error: '' });
    });

    on(taskActions.fetchTasksSuccess, (state: typeof initState, action: IAction) => {
        const { tasks } = action.payload;
        return state.merge({ tasks, loading: false });
    });

    on(taskActions.fetchTasksFailed, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({ error: _error, loading: false });
    });

    on(taskActions.takeTaskSuccess, (state: typeof initState, action: IAction) => {
        const { taskId } = action.payload;
        const updatedTasks = state.tasks.map((task) => {
            if (task.id === taskId) {
                return { ...task, status: 'taken' };
            }
            return task;
        });
        return state.merge({ tasks: updatedTasks });
    });

    on(taskActions.takeTaskFailed, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({ error: _error, loading: false });
    });
}, initState);
