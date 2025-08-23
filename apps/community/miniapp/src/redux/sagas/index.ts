// 声明模块以解决类型问题
declare module 'redux-saga/effects' {
    export function fork(_func: any): any;
    export function all(_arr: any[]): any;
}

// 删除旧的模块声明
// declare module 'redux-saga-restart' {
//    export function makeRestartable(saga: any): any;
// }

declare module './accountSaga' {
    export function loginWithEmailSaga(_action: any): any;
    export function sendPhoneCodeSaga(_action: any): any;
    export function loginWithPhoneSaga(_action: any): any;
    export function registerWithEmailSaga(_action: any): any;
    export function registerWithPhoneSaga(_action: any): any;
    export function logoutSaga(_action: any): any;
}

declare module './growthSaga' {
    export function fetchGrowthPathSaga(_action: any): any;
    export function updateGrowthProgressSaga(_action: any): any;
    export function fetchChallengesSaga(_action: any): any;
    export function updateChallengeProgressSaga(_action: any): any;
    export function completeChallengeSaga(_action: any): any;
    export function fetchSkillsSaga(_action: any): any;
    export function updateSkillLevelSaga(_action: any): any;
}

declare module './problemSaga' {
    export function fetchProblemsSaga(_action: any): any;
    export function fetchProblemDetailSaga(_action: any): any;
    export function submitAnswerSaga(_action: any): any;
    export function fetchAnswerRecordsSaga(_action: any): any;
    export function fetchWrongProblemsSaga(_action: any): any;
}

declare module './postSaga' {
    export function fetchPostsSaga(_action: any): any;
    export function fetchPostDetailSaga(_action: any): any;
    export function publishPostSaga(_action: any): any;
    export function commentPostSaga(_action: any): any;
    export function likePostSaga(_action: any): any;
    export function favoritePostSaga(_action: any): any;
}

declare module './taskSaga' {
    export function watchFetchTasks(): any;
    export function watchTakeTask(): any;
}

import { fork, all } from 'redux-saga/effects';
// 修复makeRestartable导入问题
import restartable from 'redux-saga-restart';
const makeRestartable = restartable.default || restartable;
import {
    loginWithEmailSaga,
    sendPhoneCodeSaga,
    loginWithPhoneSaga,
    registerWithEmailSaga,
    registerWithPhoneSaga,
    logoutSaga,
} from './accountSaga';
import { watchFetchTasks, watchTakeTask } from './taskSaga';
import {
    fetchGrowthPathSaga,
    updateGrowthProgressSaga,
    fetchChallengesSaga,
    updateChallengeProgressSaga,
    completeChallengeSaga,
    fetchSkillsSaga,
    updateSkillLevelSaga,
} from './growthSaga';
import {
    fetchProblemsSaga,
    fetchProblemDetailSaga,
    submitAnswerSaga,
    fetchAnswerRecordsSaga,
    fetchWrongProblemsSaga,
} from './problemSaga';
import {
    fetchPostsSaga,
    fetchPostDetailSaga,
    publishPostSaga,
    commentPostSaga,
    likePostSaga,
    favoritePostSaga,
} from './postSaga';

const rootSagas = [
    makeRestartable(loginWithEmailSaga),
    makeRestartable(sendPhoneCodeSaga),
    makeRestartable(loginWithPhoneSaga),
    makeRestartable(registerWithEmailSaga),
    makeRestartable(registerWithPhoneSaga),
    makeRestartable(logoutSaga),
    makeRestartable(fetchGrowthPathSaga),
    makeRestartable(updateGrowthProgressSaga),
    makeRestartable(fetchChallengesSaga),
    makeRestartable(updateChallengeProgressSaga),
    makeRestartable(completeChallengeSaga),
    makeRestartable(fetchSkillsSaga),
    makeRestartable(updateSkillLevelSaga),
    makeRestartable(watchFetchTasks),
    makeRestartable(watchTakeTask),
    makeRestartable(fetchProblemsSaga),
    makeRestartable(fetchProblemDetailSaga),
    makeRestartable(submitAnswerSaga),
    makeRestartable(fetchAnswerRecordsSaga),
    makeRestartable(fetchWrongProblemsSaga),
    makeRestartable(fetchPostsSaga),
    makeRestartable(fetchPostDetailSaga),
    makeRestartable(publishPostSaga),
    makeRestartable(commentPostSaga),
    makeRestartable(likePostSaga),
    makeRestartable(favoritePostSaga),
];

function* root() {
    yield all(rootSagas.map((saga) => fork(saga)));
}

export default root;
