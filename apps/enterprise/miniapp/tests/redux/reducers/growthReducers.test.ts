import { describe, it, expect } from 'vitest';
import growthReducer from '@/redux/reducers/growthReducers';
import { growthActions } from '@/redux/actions';
import Immutable from 'seamless-immutable';

// 模拟测试数据
const mockGrowthPath = {
    id: '1',
    title: 'React 全栈开发路径',
    goal: '成为React全栈开发工程师',
    expectedCompletion: '2024-06-01',
    currentProgress: 65,
    remainingDays: 45,
    stages: [
        {
            id: 'stage1',
            name: 'React基础',
            status: 'completed' as const,
        },
        {
            id: 'stage2',
            name: 'React进阶',
            status: 'current' as const,
        },
    ],
};

const mockChallenges = [
    {
        id: 'challenge1',
        name: 'React Hooks 实战',
        description: '使用React Hooks构建一个待办事项应用',
        status: 'in-progress' as const,
        progress: 75,
        daysLeft: 3,
    },
    {
        id: 'challenge2',
        name: 'Redux状态管理',
        description: '学习Redux进行复杂状态管理',
        status: 'upcoming' as const,
        daysLeft: 7,
    },
];

const mockSkills = [
    {
        id: 'skill1',
        name: 'JavaScript',
        level: 8,
        category: '前端开发',
    },
    {
        id: 'skill2',
        name: 'React',
        level: 7,
        category: '前端框架',
    },
];

// 初始状态
const initialState = Immutable.from({
    growthPath: null,
    challenges: [],
    skills: [],
    loading: false,
    error: null,
});

describe('growthReducer 成长路径Reducer测试', () => {
    describe('学习路径相关Reducer', () => {
        it('应该处理fetchGrowthPath action', () => {
            const action = growthActions.fetchGrowthPath();
            const newState = growthReducer(initialState, action);

            expect(newState.loading).toBe(true);
            expect(newState.error).toBe(null);
        });

        it('应该处理fetchGrowthPathSuccess action', () => {
            const loadingState = initialState.merge({ loading: true });
            const action = growthActions.fetchGrowthPathSuccess(mockGrowthPath);
            const newState = growthReducer(loadingState, action);

            expect(newState.growthPath).toEqual(mockGrowthPath);
            expect(newState.loading).toBe(false);
            expect(newState.error).toBe(null);
        });

        it('应该处理fetchGrowthPathFailed action', () => {
            const loadingState = initialState.merge({ loading: true });
            const errorMessage = '网络连接失败';
            const action = growthActions.fetchGrowthPathFailed(errorMessage);
            const newState = growthReducer(loadingState, action);

            expect(newState.error).toBe(errorMessage);
            expect(newState.loading).toBe(false);
            expect(newState.growthPath).toBe(null);
        });

        it('应该处理updateGrowthProgress action', () => {
            const stateWithPath = initialState.merge({ growthPath: mockGrowthPath });
            const newProgress = 80;
            const action = growthActions.updateGrowthProgress(newProgress);
            const newState = growthReducer(stateWithPath, action);

            expect(newState.growthPath.currentProgress).toBe(newProgress);
            expect(newState.growthPath.title).toBe(mockGrowthPath.title);
        });

        it('应该在没有学习路径时忽略updateGrowthProgress action', () => {
            const action = growthActions.updateGrowthProgress(80);
            const newState = growthReducer(initialState, action);

            expect(newState).toEqual(initialState);
        });
    });

    describe('挑战相关Reducer', () => {
        it('应该处理fetchChallenges action', () => {
            const action = growthActions.fetchChallenges();
            const newState = growthReducer(initialState, action);

            expect(newState.loading).toBe(true);
            expect(newState.error).toBe(null);
        });

        it('应该处理fetchChallengesSuccess action', () => {
            const loadingState = initialState.merge({ loading: true });
            const action = growthActions.fetchChallengesSuccess(mockChallenges);
            const newState = growthReducer(loadingState, action);

            expect(newState.challenges).toEqual(mockChallenges);
            expect(newState.loading).toBe(false);
            expect(newState.error).toBe(null);
        });

        it('应该处理fetchChallengesFailed action', () => {
            const loadingState = initialState.merge({ loading: true });
            const errorMessage = '获取挑战列表失败';
            const action = growthActions.fetchChallengesFailed(errorMessage);
            const newState = growthReducer(loadingState, action);

            expect(newState.error).toBe(errorMessage);
            expect(newState.loading).toBe(false);
            expect(newState.challenges).toEqual([]);
        });

        it('应该处理updateChallengeProgress action', () => {
            const stateWithChallenges = initialState.merge({ challenges: mockChallenges });
            const challengeId = 'challenge1';
            const newProgress = 90;
            const action = growthActions.updateChallengeProgress(challengeId, newProgress);
            const newState = growthReducer(stateWithChallenges, action);

            const updatedChallenge = newState.challenges.find((c) => c.id === challengeId);
            expect(updatedChallenge.progress).toBe(newProgress);
            expect(updatedChallenge.status).toBe('in-progress');
        });

        it('应该在进度为100时将挑战状态设为completed', () => {
            const stateWithChallenges = initialState.merge({ challenges: mockChallenges });
            const challengeId = 'challenge1';
            const action = growthActions.updateChallengeProgress(challengeId, 100);
            const newState = growthReducer(stateWithChallenges, action);

            const updatedChallenge = newState.challenges.find((c) => c.id === challengeId);
            expect(updatedChallenge.progress).toBe(100);
            expect(updatedChallenge.status).toBe('completed');
        });

        it('应该处理completeChallenge action', () => {
            const stateWithChallenges = initialState.merge({ challenges: mockChallenges });
            const challengeId = 'challenge2';
            const action = growthActions.completeChallenge(challengeId);
            const newState = growthReducer(stateWithChallenges, action);

            const completedChallenge = newState.challenges.find((c) => c.id === challengeId);
            expect(completedChallenge.status).toBe('completed');
            expect(completedChallenge.progress).toBe(100);
        });

        it('应该只更新指定的挑战，不影响其他挑战', () => {
            const stateWithChallenges = initialState.merge({ challenges: mockChallenges });
            const challengeId = 'challenge1';
            const action = growthActions.updateChallengeProgress(challengeId, 90);
            const newState = growthReducer(stateWithChallenges, action);

            const unchangedChallenge = newState.challenges.find((c) => c.id === 'challenge2');
            expect(unchangedChallenge.status).toBe('upcoming');
            expect(unchangedChallenge.progress).toBeUndefined();
        });
    });

    describe('技能相关Reducer', () => {
        it('应该处理fetchSkills action', () => {
            const action = growthActions.fetchSkills();
            const newState = growthReducer(initialState, action);

            expect(newState.loading).toBe(true);
            expect(newState.error).toBe(null);
        });

        it('应该处理fetchSkillsSuccess action', () => {
            const loadingState = initialState.merge({ loading: true });
            const action = growthActions.fetchSkillsSuccess(mockSkills);
            const newState = growthReducer(loadingState, action);

            expect(newState.skills).toEqual(mockSkills);
            expect(newState.loading).toBe(false);
            expect(newState.error).toBe(null);
        });

        it('应该处理fetchSkillsFailed action', () => {
            const loadingState = initialState.merge({ loading: true });
            const errorMessage = '获取技能列表失败';
            const action = growthActions.fetchSkillsFailed(errorMessage);
            const newState = growthReducer(loadingState, action);

            expect(newState.error).toBe(errorMessage);
            expect(newState.loading).toBe(false);
            expect(newState.skills).toEqual([]);
        });

        it('应该处理updateSkillLevel action', () => {
            const stateWithSkills = initialState.merge({ skills: mockSkills });
            const skillId = 'skill1';
            const newLevel = 9;
            const action = growthActions.updateSkillLevel(skillId, newLevel);
            const newState = growthReducer(stateWithSkills, action);

            const updatedSkill = newState.skills.find((s) => s.id === skillId);
            expect(updatedSkill.level).toBe(newLevel);
            expect(updatedSkill.name).toBe('JavaScript');
        });

        it('应该只更新指定的技能，不影响其他技能', () => {
            const stateWithSkills = initialState.merge({ skills: mockSkills });
            const skillId = 'skill1';
            const action = growthActions.updateSkillLevel(skillId, 9);
            const newState = growthReducer(stateWithSkills, action);

            const unchangedSkill = newState.skills.find((s) => s.id === 'skill2');
            expect(unchangedSkill.level).toBe(7);
            expect(unchangedSkill.name).toBe('React');
        });
    });

    describe('状态不变性测试', () => {
        it('应该返回新的状态对象，不修改原状态', () => {
            const action = growthActions.fetchGrowthPath();
            const newState = growthReducer(initialState, action);

            expect(newState).not.toBe(initialState);
            expect(initialState.loading).toBe(false);
            expect(newState.loading).toBe(true);
        });

        it('应该在更新挑战时保持状态不变性', () => {
            const stateWithChallenges = initialState.merge({ challenges: mockChallenges });
            const originalChallenges = stateWithChallenges.challenges;
            const action = growthActions.updateChallengeProgress('challenge1', 90);
            const newState = growthReducer(stateWithChallenges, action);

            expect(newState.challenges).not.toBe(originalChallenges);
            expect(originalChallenges[0].progress).toBe(75); // 原数据未被修改
        });

        it('应该在更新技能时保持状态不变性', () => {
            const stateWithSkills = initialState.merge({ skills: mockSkills });
            const originalSkills = stateWithSkills.skills;
            const action = growthActions.updateSkillLevel('skill1', 9);
            const newState = growthReducer(stateWithSkills, action);

            expect(newState.skills).not.toBe(originalSkills);
            expect(originalSkills[0].level).toBe(8); // 原数据未被修改
        });
    });

    describe('边界情况测试', () => {
        it('应该处理空的挑战列表', () => {
            const action = growthActions.fetchChallengesSuccess([]);
            const newState = growthReducer(initialState, action);

            expect(newState.challenges).toEqual([]);
            expect(newState.loading).toBe(false);
        });

        it('应该处理空的技能列表', () => {
            const action = growthActions.fetchSkillsSuccess([]);
            const newState = growthReducer(initialState, action);

            expect(newState.skills).toEqual([]);
            expect(newState.loading).toBe(false);
        });

        it('应该处理不存在的挑战ID', () => {
            const stateWithChallenges = initialState.merge({ challenges: mockChallenges });
            const action = growthActions.updateChallengeProgress('nonexistent', 50);
            const newState = growthReducer(stateWithChallenges, action);

            // 状态应该保持不变
            expect(newState.challenges).toEqual(mockChallenges);
        });

        it('应该处理不存在的技能ID', () => {
            const stateWithSkills = initialState.merge({ skills: mockSkills });
            const action = growthActions.updateSkillLevel('nonexistent', 5);
            const newState = growthReducer(stateWithSkills, action);

            // 状态应该保持不变
            expect(newState.skills).toEqual(mockSkills);
        });

        it('应该处理未知的action类型', () => {
            const unknownAction = { type: 'UNKNOWN_ACTION', payload: {} };
            const newState = growthReducer(initialState, unknownAction);

            // 状态应该保持不变
            expect(newState).toEqual(initialState);
        });
    });
});
