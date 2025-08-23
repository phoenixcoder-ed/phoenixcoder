// 声明模块以解决类型问题
declare module 'redux-saga/effects' {}
declare module 'axios' {
    export interface AxiosResponse<T = any> {
        data: T;
    }
}

declare module '@/utils/httpUtil' {
    export namespace HttpUtil {
        export function fetchGrowthPath(): Promise<AxiosResponse<any>>;
        export function updateGrowthProgress(_progress: number): Promise<AxiosResponse<any>>;
        export function fetchChallenges(): Promise<AxiosResponse<any>>;
        export function updateChallengeProgress(_challengeId: string, _progress: number): Promise<AxiosResponse<any>>;
        export function completeChallenge(_challengeId: string): Promise<AxiosResponse<any>>;
        export function fetchSkills(): Promise<AxiosResponse<any>>;
        export function updateSkillLevel(_skillId: string, _level: number): Promise<AxiosResponse<any>>;
    }
}

declare module '@/redux/actions' {
    export const growthActions: {
        fetchGrowthPath: any;
        fetchGrowthPathSuccess: (_data: any) => any;
        fetchGrowthPathFailed: (_error: string) => any;
        updateGrowthProgress: any;
        updateGrowthProgressSuccess: (_progress: number) => any;
        updateGrowthProgressFailed: (_error: string) => any;
        fetchChallenges: any;
        fetchChallengesSuccess: (_data: any) => any;
        fetchChallengesFailed: (_error: string) => any;
        updateChallengeProgress: any;
        updateChallengeProgressSuccess: (_data: any) => any;
        updateChallengeProgressFailed: (_error: string) => any;
        completeChallenge: any;
        completeChallengeSuccess: (_challengeId: string) => any;
        completeChallengeFailed: (_error: string) => any;
        fetchSkills: any;
        fetchSkillsSuccess: (_data: any) => any;
        fetchSkillsFailed: (_error: string) => any;
        updateSkillLevel: any;
        updateSkillLevelSuccess: (_data: any) => any;
        updateSkillLevelFailed: (_error: string) => any;
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
        function* ({ deferred }: ActionWithDeferred): IterableIterator<IAction> {
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
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { progress } = payload;
                yield call(HttpUtil.updateGrowthProgress, progress);
                yield put(growthActions.updateGrowthProgressSuccess(progress));
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
        function* ({ deferred }: ActionWithDeferred): IterableIterator<IAction> {
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
                const { challengeId, progress } = payload;
                yield call(HttpUtil.updateChallengeProgress, challengeId, progress);
                yield put(growthActions.updateChallengeProgressSuccess({ challengeId, progress }));
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
                const { challengeId } = payload;
                yield call(HttpUtil.completeChallenge, challengeId);
                yield put(growthActions.completeChallengeSuccess(challengeId));
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
        function* ({ deferred }: ActionWithDeferred): IterableIterator<IAction> {
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
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { skillId, level } = payload;
                yield call(HttpUtil.updateSkillLevel, skillId, level);
                yield put(growthActions.updateSkillLevelSuccess({ skillId, level }));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(growthActions.updateSkillLevelFailed('更新技能等级失败'));
                yield call(deferred.reject);
            }
        },
    );
}
