import { describe, it, expect } from 'vitest';
import growthActions from '@/redux/actions/growthActions';

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
        {
            id: 'stage3',
            name: 'Node.js后端',
            status: 'upcoming' as const,
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
    {
        id: 'skill3',
        name: 'Node.js',
        level: 5,
        category: '后端开发',
    },
];

describe('growthActions 成长路径Actions测试', () => {
    describe('学习路径相关Actions', () => {
        it('应该创建获取学习路径的action', () => {
            const action = growthActions.fetchGrowthPath();

            expect(action).toEqual({
                type: 'fetchGrowthPath',
                payload: {},
            });
        });

        it('应该创建获取学习路径成功的action', () => {
            const action = growthActions.fetchGrowthPathSuccess(mockGrowthPath);

            expect(action).toEqual({
                type: 'fetchGrowthPathSuccess',
                payload: {
                    growthPath: mockGrowthPath,
                },
            });
        });

        it('应该创建获取学习路径失败的action', () => {
            const errorMessage = '网络连接失败';
            const action = growthActions.fetchGrowthPathFailed(errorMessage);

            expect(action).toEqual({
                type: 'fetchGrowthPathFailed',
                payload: {
                    error: errorMessage,
                },
            });
        });

        it('应该创建更新学习进度的action', () => {
            const progress = 75;
            const action = growthActions.updateGrowthProgress(progress);

            expect(action).toEqual({
                type: 'updateGrowthProgress',
                payload: {
                    progress,
                },
            });
        });
    });

    describe('挑战相关Actions', () => {
        it('应该创建获取挑战列表的action', () => {
            const action = growthActions.fetchChallenges();

            expect(action).toEqual({
                type: 'fetchChallenges',
                payload: {},
            });
        });

        it('应该创建获取挑战列表成功的action', () => {
            const action = growthActions.fetchChallengesSuccess(mockChallenges);

            expect(action).toEqual({
                type: 'fetchChallengesSuccess',
                payload: {
                    challenges: mockChallenges,
                },
            });
        });

        it('应该创建获取挑战列表失败的action', () => {
            const errorMessage = '获取挑战列表失败';
            const action = growthActions.fetchChallengesFailed(errorMessage);

            expect(action).toEqual({
                type: 'fetchChallengesFailed',
                payload: {
                    error: errorMessage,
                },
            });
        });

        it('应该创建获取挑战详情的action', () => {
            const challengeId = 'challenge1';
            const action = growthActions.fetchChallengeDetail(challengeId);

            expect(action).toEqual({
                type: 'fetchChallengeDetail',
                payload: {
                    challengeId,
                },
            });
        });

        it('应该创建更新挑战进度的action', () => {
            const challengeId = 'challenge1';
            const progress = 85;
            const action = growthActions.updateChallengeProgress(challengeId, progress);

            expect(action).toEqual({
                type: 'updateChallengeProgress',
                payload: {
                    challengeId,
                    progress,
                },
            });
        });

        it('应该创建完成挑战的action', () => {
            const challengeId = 'challenge1';
            const action = growthActions.completeChallenge(challengeId);

            expect(action).toEqual({
                type: 'completeChallenge',
                payload: {
                    challengeId,
                },
            });
        });
    });

    describe('技能相关Actions', () => {
        it('应该创建获取技能列表的action', () => {
            const action = growthActions.fetchSkills();

            expect(action).toEqual({
                type: 'fetchSkills',
                payload: {},
            });
        });

        it('应该创建获取技能列表成功的action', () => {
            const action = growthActions.fetchSkillsSuccess(mockSkills);

            expect(action).toEqual({
                type: 'fetchSkillsSuccess',
                payload: {
                    skills: mockSkills,
                },
            });
        });

        it('应该创建获取技能列表失败的action', () => {
            const errorMessage = '获取技能列表失败';
            const action = growthActions.fetchSkillsFailed(errorMessage);

            expect(action).toEqual({
                type: 'fetchSkillsFailed',
                payload: {
                    error: errorMessage,
                },
            });
        });

        it('应该创建更新技能等级的action', () => {
            const skillId = 'skill1';
            const level = 9;
            const action = growthActions.updateSkillLevel(skillId, level);

            expect(action).toEqual({
                type: 'updateSkillLevel',
                payload: {
                    skillId,
                    level,
                },
            });
        });
    });

    describe('Action类型验证', () => {
        it('所有action应该有正确的类型字段', () => {
            const actions = [
                growthActions.fetchGrowthPath(),
                growthActions.fetchGrowthPathSuccess(mockGrowthPath),
                growthActions.fetchGrowthPathFailed('error'),
                growthActions.updateGrowthProgress(50),
                growthActions.fetchChallenges(),
                growthActions.fetchChallengesSuccess(mockChallenges),
                growthActions.fetchChallengesFailed('error'),
                growthActions.fetchChallengeDetail('id'),
                growthActions.updateChallengeProgress('id', 50),
                growthActions.completeChallenge('id'),
                growthActions.fetchSkills(),
                growthActions.fetchSkillsSuccess(mockSkills),
                growthActions.fetchSkillsFailed('error'),
                growthActions.updateSkillLevel('id', 5),
            ];

            actions.forEach((action) => {
                expect(action).toHaveProperty('type');
                expect(typeof action.type).toBe('string');
                expect(action.type.length).toBeGreaterThan(0);
            });
        });

        it('所有action应该有payload字段', () => {
            const actions = [
                growthActions.fetchGrowthPath(),
                growthActions.fetchGrowthPathSuccess(mockGrowthPath),
                growthActions.fetchGrowthPathFailed('error'),
                growthActions.updateGrowthProgress(50),
                growthActions.fetchChallenges(),
                growthActions.fetchChallengesSuccess(mockChallenges),
                growthActions.fetchChallengesFailed('error'),
                growthActions.fetchChallengeDetail('id'),
                growthActions.updateChallengeProgress('id', 50),
                growthActions.completeChallenge('id'),
                growthActions.fetchSkills(),
                growthActions.fetchSkillsSuccess(mockSkills),
                growthActions.fetchSkillsFailed('error'),
                growthActions.updateSkillLevel('id', 5),
            ];

            actions.forEach((action) => {
                expect(action).toHaveProperty('payload');
                expect(typeof action.payload).toBe('object');
            });
        });
    });

    describe('边界情况测试', () => {
        it('应该处理空的挑战列表', () => {
            const action = growthActions.fetchChallengesSuccess([]);

            expect(action.payload.challenges).toEqual([]);
        });

        it('应该处理空的技能列表', () => {
            const action = growthActions.fetchSkillsSuccess([]);

            expect(action.payload.skills).toEqual([]);
        });

        it('应该处理进度为0的情况', () => {
            const action = growthActions.updateGrowthProgress(0);

            expect(action.payload.progress).toBe(0);
        });

        it('应该处理进度为100的情况', () => {
            const action = growthActions.updateChallengeProgress('challenge1', 100);

            expect(action.payload.progress).toBe(100);
        });

        it('应该处理技能等级为1的情况', () => {
            const action = growthActions.updateSkillLevel('skill1', 1);

            expect(action.payload.level).toBe(1);
        });

        it('应该处理技能等级为10的情况', () => {
            const action = growthActions.updateSkillLevel('skill1', 10);

            expect(action.payload.level).toBe(10);
        });
    });
});
