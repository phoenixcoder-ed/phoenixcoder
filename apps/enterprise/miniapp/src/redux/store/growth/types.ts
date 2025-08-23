// 学习路径类型定义
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

// 挑战类型定义
export interface Challenge {
    id: string;
    name: string;
    description: string;
    status: 'completed' | 'in-progress' | 'upcoming';
    progress?: number;
    daysLeft?: number;
}

// 技能类型定义
export interface Skill {
    id: string;
    name: string;
    level: number;
    category: string;
}

// 学习路径状态定义
export interface GrowthState {
    growthPath: GrowthPath | null;
    challenges: Challenge[];
    skills: Skill[];
    loading: boolean;
    error: string | null;
}
