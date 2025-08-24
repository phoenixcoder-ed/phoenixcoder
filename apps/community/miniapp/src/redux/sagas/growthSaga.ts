// 声明模块以解决类型问题
declare module 'redux-saga/effects' {}
declare module 'axios' {
    export interface AxiosResponse<T = any> {
        data: T;
    }
}

declare module '../../typed/types' {
    export interface ActionWithDeferred {
        payload?: any;
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

declare module '@/redux/store/growth/types' {
    export interface GrowthPath {}
    export interface Challenge {}
    export interface Skill {}
}

import { call, put, takeLatest } from 'redux-saga/effects';
import { AxiosResponse } from 'axios';
import { growthActions } from '@/redux/actions';
import { HttpUtil } from '@/utils/httpUtil';
import { GrowthPath, Challenge, Skill } from '@/redux/store/growth/types';
import { ActionWithDeferred, IAction } from '../../typed/types';

/**
 * 获取学习路径Saga
 */
export function* fetchGrowthPathSaga() {
    return yield takeLatest(
        growthActions.fetchGrowthPath,
        function* fetchGrowthPathHandler({ deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { data }: AxiosResponse<GrowthPath> = yield call(HttpUtil.fetchGrowthPath);
                yield put(growthActions.fetchGrowthPathSuccess(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(growthActions.fetchGrowthPathFailed('获取学习路径失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 更新学习进度Saga
 */
export function* updateGrowthProgressSaga() {
    return yield takeLatest(
        growthActions.updateGrowthProgress,
        function* updateProgressHandler({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { progress: _progress } = payload;
                yield call(HttpUtil.updateGrowthProgress, _progress);
                yield put(growthActions.updateGrowthProgressSuccess(_progress));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(growthActions.updateGrowthProgressFailed('更新学习进度失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 获取挑战列表Saga
 */
export function* fetchChallengesSaga() {
    return yield takeLatest(
        growthActions.fetchChallenges,
        function* fetchChallengesHandler({ deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { data }: AxiosResponse<Challenge[]> = yield call(HttpUtil.fetchChallenges);
                yield put(growthActions.fetchChallengesSuccess(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(growthActions.fetchChallengesFailed('获取挑战列表失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 更新挑战进度Saga
 */
export function* updateChallengeProgressSaga() {
    return yield takeLatest(
        growthActions.updateChallengeProgress,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { challengeId: _challengeId, progress: _progress } = payload;
                yield call(HttpUtil.updateChallengeProgress, _challengeId, _progress);
                yield put(
                    growthActions.updateChallengeProgressSuccess({ challengeId: _challengeId, progress: _progress }),
                );
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(growthActions.updateChallengeProgressFailed('更新挑战进度失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 完成挑战Saga
 */
export function* completeChallengeSaga() {
    return yield takeLatest(
        growthActions.completeChallenge,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { challengeId: _challengeId } = payload;
                yield call(HttpUtil.completeChallenge, _challengeId);
                yield put(growthActions.completeChallengeSuccess(_challengeId));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(growthActions.completeChallengeFailed('完成挑战失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 获取技能列表Saga
 */
export function* fetchSkillsSaga() {
    return yield takeLatest(
        growthActions.fetchSkills,
        function* fetchSkillsHandler({ deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { data }: AxiosResponse<Skill[]> = yield call(HttpUtil.fetchSkills);
                yield put(growthActions.fetchSkillsSuccess(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(growthActions.fetchSkillsFailed('获取技能列表失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 更新技能等级Saga
 */
export function* updateSkillLevelSaga() {
    return yield takeLatest(
        growthActions.updateSkillLevel,
        function* updateSkillHandler({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { skillId: _skillId, level: _level } = payload;
                yield call(HttpUtil.updateSkillLevel, _skillId, _level);
                yield put(growthActions.updateSkillLevelSuccess({ skillId: _skillId, level: _level }));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(growthActions.updateSkillLevelFailed('更新技能等级失败'));
                yield call(deferred.reject);
            }
        },
    );
}
