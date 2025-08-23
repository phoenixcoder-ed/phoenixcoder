import { combineReducers } from 'redux';
import { FETCH_TASKS, TAKE_TASK } from '../actions';

interface TaskState {
    tasks: any[];
    loading: boolean;
}

const initialState: TaskState = {
    tasks: [],
    loading: false,
};

const taskReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case FETCH_TASKS:
            return {
                ...state,
                tasks: action.payload,
                loading: false,
            };
        case TAKE_TASK:
            return {
                ...state,
                tasks: state.tasks.map((task: any) =>
                    task.id === action.payload ? { ...task, status: 'taken' } : task,
                ),
            };
        default:
            return state;
    }
};

const rootReducer = combineReducers({
    taskReducers: taskReducer,
    // 添加其他reducers
});

export default rootReducer;
