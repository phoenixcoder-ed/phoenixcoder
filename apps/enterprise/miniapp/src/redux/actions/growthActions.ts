import createActions from '@/utils/actionHelper';
import { Action } from 'redux-actions';
import { GrowthPath, Challenge, Skill } from '@/redux/store/growth/types';

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

declare module '@/redux/store/growth/types' {
    export interface GrowthPath {
        id: string;
        title: string;
        goal: string;
        expectedCompletion: string;
        currentProgress: number;
        remainingDays: number;
        stages: Array<{
            id: string;
            name: string;
            status: 'completed' | 'current' | 'upcoming';
        }>;
    }

    export interface Challenge {
        id: string;
        name: string;
        description: string;
        status: 'completed' | 'in-progress' | 'upcoming';
        progress?: number;
        daysLeft?: number;
    }

    export interface Skill {
        id: string;
        name: string;
        level: number;
        category: string;
    }
}

export interface GrowthActions {
    fetchGrowthPath: () => Action<void>;
    fetchGrowthPathSuccess: (_growthPath: GrowthPath) => Action<GrowthPath>;
    fetchGrowthPathFailed: (_error: string) => Action<string>;
    updateGrowthProgress: (_progress: number) => Action<number>;
    fetchChallenges: () => Action<void>;
    fetchChallengesSuccess: (_challenges: Challenge[]) => Action<Challenge[]>;
    fetchChallengesFailed: (_error: string) => Action<string>;
    fetchChallengeDetail: (_challengeId: string) => Action<string>;
    updateChallengeProgress: (
        _challengeId: string,
        _progress: number,
    ) => Action<{ challengeId: string; progress: number }>;
    completeChallenge: (_challengeId: string) => Action<string>;
    fetchSkills: () => Action<void>;
    fetchSkillsSuccess: (_skills: Skill[]) => Action<Skill[]>;
    fetchSkillsFailed: (_error: string) => Action<string>;
    updateSkillLevel: (_skillId: string, _level: number) => Action<{ skillId: string; level: number }>;
}

export default createActions({
    fetchGrowthPath: () => ({}),
    fetchGrowthPathSuccess: (_growthPath: GrowthPath) => ({ growthPath: _growthPath }),
    fetchGrowthPathFailed: (_error: string) => ({ error: _error }),
    updateGrowthProgress: (_progress: number) => ({ progress: _progress }),
    fetchChallenges: () => ({}),
    fetchChallengesSuccess: (_challenges: Challenge[]) => ({ challenges: _challenges }),
    fetchChallengesFailed: (_error: string) => ({ error: _error }),
    fetchChallengeDetail: (_challengeId: string) => ({ challengeId: _challengeId }),
    updateChallengeProgress: (_challengeId: string, _progress: number) => ({
        challengeId: _challengeId,
        progress: _progress,
    }),
    completeChallenge: (_challengeId: string) => ({ challengeId: _challengeId }),
    fetchSkills: () => ({}),
    fetchSkillsSuccess: (_skills: Skill[]) => ({ skills: _skills }),
    fetchSkillsFailed: (_error: string) => ({ error: _error }),
    updateSkillLevel: (_skillId: string, _level: number) => ({
        skillId: _skillId,
        level: _level,
    }),
}) as GrowthActions;
