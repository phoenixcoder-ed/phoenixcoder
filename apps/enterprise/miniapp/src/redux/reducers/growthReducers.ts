import Immutable, { ImmutableObject } from 'seamless-immutable';
import { growthActions } from '@/redux/actions';
import { IAction } from '@/typed/types';
import createReducers from '@/utils/reducerHelper';
import { GrowthState } from '@/redux/store/growth/types';

declare module '@/typed/types' {
    export interface IAction {
        type: string;
        payload?: any;
        error?: boolean;
        meta?: any;
    }
}

declare module '@/utils/reducerHelper' {
    function createReducers(_on: any, _initialState: any): any;
    export default createReducers;
}

// 扩展GrowthState接口，添加merge方法
declare module '@/redux/store/growth/types' {
    export interface GrowthState {
        merge: (_changes: any) => ImmutableObject<GrowthState>;
        growthPath: any | null;
        challenges: any[];
        skills: any[];
        loading: boolean;
        error: string | null;
    }
}

// 初始状态
const initState: ImmutableObject<GrowthState> = Immutable.from({
    growthPath: null,
    challenges: [],
    skills: [],
    loading: false,
    error: null,
});

export default createReducers((on) => {
    // 获取学习路径
    on(growthActions.fetchGrowthPath, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 获取学习路径成功
    on(growthActions.fetchGrowthPathSuccess, (state: typeof initState, action: IAction) => {
        const { growthPath } = action.payload;
        return state.merge({
            growthPath,
            loading: false,
        });
    });

    // 获取学习路径失败
    on(growthActions.fetchGrowthPathFailed, (state: typeof initState, action: IAction) => {
        const { error } = action.payload;
        return state.merge({
            error,
            loading: false,
        });
    });

    // 更新学习进度
    on(growthActions.updateGrowthProgress, (state: typeof initState, action: IAction) => {
        const { progress } = action.payload;
        if (state.growthPath) {
            return state.merge({
                growthPath: { ...state.growthPath, currentProgress: progress },
            });
        }
        return state;
    });

    // 获取挑战
    on(growthActions.fetchChallenges, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 获取挑战成功
    on(growthActions.fetchChallengesSuccess, (state: typeof initState, action: IAction) => {
        const { challenges } = action.payload;
        return state.merge({
            challenges,
            loading: false,
        });
    });

    // 获取挑战失败
    on(growthActions.fetchChallengesFailed, (state: typeof initState, action: IAction) => {
        const { error } = action.payload;
        return state.merge({
            error,
            loading: false,
        });
    });

    // 更新挑战进度
    on(growthActions.updateChallengeProgress, (state: typeof initState, action: IAction) => {
        const { challengeId, progress } = action.payload;
        const challenges = state.challenges.map((challenge) => {
            if (challenge.id === challengeId) {
                return { ...challenge, progress, status: progress === 100 ? 'completed' : 'in-progress' };
            }
            return challenge;
        });
        return state.merge({
            challenges,
        });
    });

    // 完成挑战
    on(growthActions.completeChallenge, (state: typeof initState, action: IAction) => {
        const { challengeId } = action.payload;
        const challenges = state.challenges.map((challenge) => {
            if (challenge.id === challengeId) {
                return { ...challenge, status: 'completed', progress: 100 };
            }
            return challenge;
        });
        return state.merge({
            challenges,
        });
    });

    // 获取技能
    on(growthActions.fetchSkills, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 获取技能成功
    on(growthActions.fetchSkillsSuccess, (state: typeof initState, action: IAction) => {
        const { skills } = action.payload;
        return state.merge({
            skills,
            loading: false,
        });
    });

    // 获取技能失败
    on(growthActions.fetchSkillsFailed, (state: typeof initState, action: IAction) => {
        const { error } = action.payload;
        return state.merge({
            error,
            loading: false,
        });
    });

    // 更新技能等级
    on(growthActions.updateSkillLevel, (state: typeof initState, action: IAction) => {
        const { skillId, level } = action.payload;
        const skills = state.skills.map((skill) => {
            if (skill.id === skillId) {
                return { ...skill, level };
            }
            return skill;
        });
        return state.merge({
            skills,
        });
    });
}, initState);
