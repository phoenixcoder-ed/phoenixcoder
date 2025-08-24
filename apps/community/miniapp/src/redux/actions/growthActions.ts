import createActions from '@/utils/actionHelper';
import { Action } from 'redux-actions';
import { GrowthPath, Challenge, Skill } from '@/redux/store/growth/types';

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
    fetchGrowthPath: () => Action<undefined>;
    fetchGrowthPathSuccess: (_growthPath: GrowthPath) => Action<{ growthPath: GrowthPath }>;
    fetchGrowthPathFailed: (_error: string) => Action<{ error: string }>;
    updateGrowthProgress: (_progress: number) => Action<{ progress: number }>;
    fetchChallenges: () => Action<undefined>;
    fetchChallengesSuccess: (_challenges: Challenge[]) => Action<{ challenges: Challenge[] }>;
    fetchChallengesFailed: (_error: string) => Action<{ error: string }>;
    fetchChallengeDetail: (_challengeId: string) => Action<{ challengeId: string }>;
    updateChallengeProgress: (
        _challengeId: string,
        _progress: number,
    ) => Action<{ challengeId: string; progress: number }>;
    completeChallenge: (_challengeId: string) => Action<{ challengeId: string }>;
    fetchSkills: () => Action<undefined>;
    fetchSkillsSuccess: (_skills: Skill[]) => Action<{ skills: Skill[] }>;
    fetchSkillsFailed: (_error: string) => Action<{ error: string }>;
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
