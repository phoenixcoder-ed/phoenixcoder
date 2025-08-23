/**
 * 小程序测试数据工厂
 *
 * 提供Taro小程序测试所需的模拟数据生成功能
 */

import { faker } from '@faker-js/faker/locale/zh_CN';
import { v4 as uuidv4 } from 'uuid';

// 小程序特有类型定义
export interface MiniUser {
    id: string;
    openid: string;
    unionid?: string;
    nickname: string;
    avatar: string;
    gender: 0 | 1 | 2; // 0未知 1男 2女
    city: string;
    province: string;
    country: string;
    language: string;
    isVerified: boolean;
    level: number;
    experience: number;
    coins: number;
    createdAt: string;
    lastLoginAt: string;
    preferences: {
        theme: 'light' | 'dark';
        notifications: boolean;
        language: 'zh-CN' | 'en-US';
    };
    profile: {
        bio?: string;
        skills: string[];
        githubUrl?: string;
        portfolioUrl?: string;
        contactEmail?: string;
    };
}

export interface MiniTask {
    id: string;
    title: string;
    description: string;
    category: 'frontend' | 'backend' | 'mobile' | 'design' | 'testing' | 'devops' | 'data' | 'ai';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    budget: {
        min: number;
        max: number;
        currency: 'CNY' | 'USD';
    };
    timeline: {
        estimatedHours: number;
        deadline: string;
        startDate?: string;
        endDate?: string;
    };
    requirements: {
        skills: string[];
        experience: 'junior' | 'mid' | 'senior';
        remote: boolean;
        partTime: boolean;
    };
    publisher: {
        id: string;
        nickname: string;
        avatar: string;
        rating: number;
    };
    assignee?: {
        id: string;
        nickname: string;
        avatar: string;
    };
    tags: string[];
    attachments: {
        id: string;
        name: string;
        url: string;
        type: 'image' | 'document' | 'code';
        size: number;
    }[];
    location?: {
        city: string;
        province: string;
        address?: string;
    };
    createdAt: string;
    updatedAt: string;
    viewCount: number;
    favoriteCount: number;
    applicationCount: number;
}

export interface MiniApplication {
    id: string;
    taskId: string;
    applicant: {
        id: string;
        nickname: string;
        avatar: string;
        rating: number;
        completedTasks: number;
    };
    proposal: {
        coverLetter: string;
        budget: number;
        timeline: number; // 预计完成天数
        approach: string; // 解决方案
    };
    portfolio: {
        projects: {
            name: string;
            description: string;
            url?: string;
            images: string[];
            technologies: string[];
        }[];
        skills: {
            name: string;
            level: number; // 1-5
            experience: number; // 年数
        }[];
    };
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    createdAt: string;
    updatedAt: string;
    feedback?: string;
}

export interface MiniChallenge {
    id: string;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'monthly' | 'special';
    category: 'coding' | 'learning' | 'contribution' | 'social';
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'active' | 'completed' | 'expired' | 'locked';
    progress: {
        current: number;
        target: number;
        unit: string;
    };
    rewards: {
        experience: number;
        coins: number;
        badges: string[];
        items?: string[];
    };
    requirements: {
        level?: number;
        prerequisites?: string[];
        timeLimit?: number; // 小时
    };
    startDate: string;
    endDate: string;
    createdAt: string;
    participants: number;
    completions: number;
}

export interface MiniBadge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'achievement' | 'skill' | 'contribution' | 'special';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    requirements: {
        type: 'task_completion' | 'skill_level' | 'rating' | 'contribution' | 'special';
        criteria: any;
    };
    rewards: {
        experience: number;
        coins: number;
        title?: string;
    };
    unlockedAt?: string;
    progress?: {
        current: number;
        target: number;
    };
}

export interface MiniNotification {
    id: string;
    userId: string;
    type: 'task' | 'application' | 'payment' | 'system' | 'social' | 'challenge';
    subtype: string;
    title: string;
    content: string;
    data?: any;
    isRead: boolean;
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
    expiresAt?: string;
    actions?: {
        label: string;
        action: string;
        data?: any;
    }[];
}

export interface MiniMessage {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    type: 'text' | 'image' | 'file' | 'system';
    content: string;
    metadata?: {
        fileName?: string;
        fileSize?: number;
        imageWidth?: number;
        imageHeight?: number;
    };
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    createdAt: string;
    updatedAt: string;
}

// 基础工厂类
class BaseMiniFactory<T> {
    protected buildData(): Partial<T> {
        return {};
    }

    build(overrides: Partial<T> = {}): T {
        const baseData = this.buildData();
        return { ...baseData, ...overrides } as T;
    }

    buildList(count: number, overrides: Partial<T> = {}): T[] {
        return Array.from({ length: count }, () => this.build(overrides));
    }

    buildBatch(count: number, overridesList: Partial<T>[] = []): T[] {
        return Array.from({ length: count }, (_, index) => {
            const overrides = overridesList[index] || {};
            return this.build(overrides);
        });
    }
}

// 小程序用户工厂
export class MiniUserFactory extends BaseMiniFactory<MiniUser> {
    protected buildData(): MiniUser {
        const createdAt = faker.date.between({ from: '2022-01-01', to: new Date() });
        const skills = [
            'JavaScript',
            'TypeScript',
            'React',
            'Vue.js',
            'Node.js',
            'Python',
            'Java',
            'Go',
            'Docker',
            'Kubernetes',
            'AWS',
            'UI设计',
            '产品设计',
        ];

        return {
            id: uuidv4(),
            openid: `openid_${faker.string.alphanumeric(28)}`,
            unionid: faker.helpers.maybe(() => `unionid_${faker.string.alphanumeric(28)}`, { probability: 0.7 }),
            nickname: faker.person.fullName(),
            avatar: faker.image.avatar(),
            gender: faker.helpers.arrayElement([0, 1, 2]),
            city: faker.location.city(),
            province: faker.location.state(),
            country: '中国',
            language: 'zh_CN',
            isVerified: faker.helpers.weightedArrayElement([
                { weight: 7, value: true },
                { weight: 3, value: false },
            ]),
            level: faker.number.int({ min: 1, max: 50 }),
            experience: faker.number.int({ min: 0, max: 10000 }),
            coins: faker.number.int({ min: 0, max: 5000 }),
            createdAt: createdAt.toISOString(),
            lastLoginAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
            preferences: {
                theme: faker.helpers.arrayElement(['light', 'dark']),
                notifications: faker.helpers.weightedArrayElement([
                    { weight: 8, value: true },
                    { weight: 2, value: false },
                ]),
                language: faker.helpers.arrayElement(['zh-CN', 'en-US']),
            },
            profile: {
                bio: faker.lorem.paragraph({ min: 1, max: 3 }),
                skills: faker.helpers.arrayElements(skills, { min: 2, max: 6 }),
                githubUrl: faker.helpers.maybe(() => `https://github.com/${faker.internet.userName()}`, {
                    probability: 0.6,
                }),
                portfolioUrl: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.4 }),
                contactEmail: faker.helpers.maybe(() => faker.internet.email(), { probability: 0.5 }),
            },
        };
    }

    static createNewbie(overrides: Partial<MiniUser> = {}): MiniUser {
        return new MiniUserFactory().build({
            level: faker.number.int({ min: 1, max: 5 }),
            experience: faker.number.int({ min: 0, max: 100 }),
            coins: faker.number.int({ min: 0, max: 100 }),
            isVerified: false,
            profile: {
                bio: '编程新手，正在学习中',
                skills: ['HTML', 'CSS', 'JavaScript'],
                ...overrides.profile,
            },
            ...overrides,
        });
    }

    static createExpert(overrides: Partial<MiniUser> = {}): MiniUser {
        return new MiniUserFactory().build({
            level: faker.number.int({ min: 30, max: 50 }),
            experience: faker.number.int({ min: 5000, max: 10000 }),
            coins: faker.number.int({ min: 2000, max: 5000 }),
            isVerified: true,
            profile: {
                bio: '资深开发者，拥有丰富的项目经验',
                skills: [
                    'JavaScript',
                    'TypeScript',
                    'React',
                    'Node.js',
                    'Python',
                    'Docker',
                    'Kubernetes',
                    'AWS',
                    '架构设计',
                    '团队管理',
                ],
                githubUrl: `https://github.com/${faker.internet.userName()}`,
                portfolioUrl: faker.internet.url(),
                contactEmail: faker.internet.email(),
                ...overrides.profile,
            },
            ...overrides,
        });
    }
}

// 小程序任务工厂
export class MiniTaskFactory extends BaseMiniFactory<MiniTask> {
    protected buildData(): MiniTask {
        const categories: MiniTask['category'][] = [
            'frontend',
            'backend',
            'mobile',
            'design',
            'testing',
            'devops',
            'data',
            'ai',
        ];
        const difficulties: MiniTask['difficulty'][] = ['beginner', 'intermediate', 'advanced', 'expert'];
        const statuses: MiniTask['status'][] = ['draft', 'published', 'in_progress', 'completed', 'cancelled'];
        const priorities: MiniTask['priority'][] = ['low', 'medium', 'high', 'urgent'];

        const skills = [
            'JavaScript',
            'TypeScript',
            'React',
            'Vue.js',
            'Node.js',
            'Python',
            'Java',
            'Go',
            'Docker',
            'Kubernetes',
            'AWS',
            'UI设计',
            '产品设计',
        ];

        const tags = [
            '前端开发',
            '后端开发',
            '移动开发',
            'UI设计',
            '数据分析',
            '机器学习',
            'DevOps',
            '测试',
            '文档',
            '代码审查',
        ];

        const budgetMin = faker.number.int({ min: 100, max: 1000 });
        const createdAt = faker.date.between({ from: '2023-01-01', to: new Date() });

        return {
            id: uuidv4(),
            title: faker.lorem.sentence({ min: 3, max: 8 }).replace('.', ''),
            description: faker.lorem.paragraphs({ min: 2, max: 4 }),
            category: faker.helpers.arrayElement(categories),
            difficulty: faker.helpers.arrayElement(difficulties),
            status: faker.helpers.arrayElement(statuses),
            priority: faker.helpers.arrayElement(priorities),
            budget: {
                min: budgetMin,
                max: budgetMin + faker.number.int({ min: 200, max: 2000 }),
                currency: 'CNY',
            },
            timeline: {
                estimatedHours: faker.number.int({ min: 1, max: 200 }),
                deadline: faker.date.between({ from: new Date(), to: '2024-12-31' }).toISOString(),
                startDate: faker.helpers.maybe(
                    () => faker.date.between({ from: new Date(), to: '2024-06-30' }).toISOString(),
                    { probability: 0.3 },
                ),
                endDate: faker.helpers.maybe(
                    () => faker.date.between({ from: '2024-07-01', to: '2024-12-31' }).toISOString(),
                    { probability: 0.3 },
                ),
            },
            requirements: {
                skills: faker.helpers.arrayElements(skills, { min: 1, max: 4 }),
                experience: faker.helpers.arrayElement(['junior', 'mid', 'senior']),
                remote: faker.helpers.weightedArrayElement([
                    { weight: 7, value: true },
                    { weight: 3, value: false },
                ]),
                partTime: faker.helpers.weightedArrayElement([
                    { weight: 6, value: true },
                    { weight: 4, value: false },
                ]),
            },
            publisher: {
                id: uuidv4(),
                nickname: faker.person.fullName(),
                avatar: faker.image.avatar(),
                rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
            },
            assignee: faker.helpers.maybe(
                () => ({
                    id: uuidv4(),
                    nickname: faker.person.fullName(),
                    avatar: faker.image.avatar(),
                }),
                { probability: 0.4 },
            ),
            tags: faker.helpers.arrayElements(tags, { min: 1, max: 4 }),
            attachments: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
                id: uuidv4(),
                name: faker.system.fileName(),
                url: faker.internet.url(),
                type: faker.helpers.arrayElement(['image', 'document', 'code']),
                size: faker.number.int({ min: 1024, max: 10485760 }), // 1KB - 10MB
            })),
            location: faker.helpers.maybe(
                () => ({
                    city: faker.location.city(),
                    province: faker.location.state(),
                    address: faker.location.streetAddress(),
                }),
                { probability: 0.3 },
            ),
            createdAt: createdAt.toISOString(),
            updatedAt: new Date().toISOString(),
            viewCount: faker.number.int({ min: 0, max: 1000 }),
            favoriteCount: faker.number.int({ min: 0, max: 100 }),
            applicationCount: faker.number.int({ min: 0, max: 50 }),
        };
    }

    static createUrgentTask(overrides: Partial<MiniTask> = {}): MiniTask {
        return new MiniTaskFactory().build({
            priority: 'urgent',
            timeline: {
                estimatedHours: faker.number.int({ min: 1, max: 40 }),
                deadline: faker.date
                    .between({
                        from: new Date(),
                        to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    })
                    .toISOString(),
            },
            budget: {
                min: 500,
                max: 2000,
                currency: 'CNY',
            },
            ...overrides,
        });
    }

    static createBeginnerTask(overrides: Partial<MiniTask> = {}): MiniTask {
        return new MiniTaskFactory().build({
            difficulty: 'beginner',
            category: 'frontend',
            requirements: {
                skills: ['HTML', 'CSS', 'JavaScript'],
                experience: 'junior',
                remote: true,
                partTime: true,
            },
            budget: {
                min: 100,
                max: 500,
                currency: 'CNY',
            },
            ...overrides,
        });
    }
}

// 小程序申请工厂
export class MiniApplicationFactory extends BaseMiniFactory<MiniApplication> {
    protected buildData(): MiniApplication {
        const statuses: MiniApplication['status'][] = ['pending', 'accepted', 'rejected', 'withdrawn'];

        const technologies = [
            'React',
            'Vue.js',
            'Angular',
            'Node.js',
            'Python',
            'Java',
            'Docker',
            'Kubernetes',
            'AWS',
            'MongoDB',
            'PostgreSQL',
            'Redis',
        ];

        const skills = [
            'JavaScript',
            'TypeScript',
            'React',
            'Vue.js',
            'Node.js',
            'Python',
            'Java',
            'Go',
            'Docker',
            'Kubernetes',
            'AWS',
            'UI设计',
            '产品设计',
        ];

        return {
            id: uuidv4(),
            taskId: uuidv4(),
            applicant: {
                id: uuidv4(),
                nickname: faker.person.fullName(),
                avatar: faker.image.avatar(),
                rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
                completedTasks: faker.number.int({ min: 0, max: 100 }),
            },
            proposal: {
                coverLetter: faker.lorem.paragraphs({ min: 2, max: 4 }),
                budget: faker.number.int({ min: 100, max: 2000 }),
                timeline: faker.number.int({ min: 1, max: 30 }),
                approach: faker.lorem.paragraph({ min: 3, max: 6 }),
            },
            portfolio: {
                projects: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
                    name: faker.lorem.words({ min: 2, max: 4 }),
                    description: faker.lorem.paragraph({ min: 1, max: 3 }),
                    url: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.7 }),
                    images: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => faker.image.url()),
                    technologies: faker.helpers.arrayElements(technologies, { min: 2, max: 6 }),
                })),
                skills: faker.helpers.arrayElements(skills, { min: 3, max: 8 }).map((skill) => ({
                    name: skill,
                    level: faker.number.int({ min: 1, max: 5 }),
                    experience: faker.number.int({ min: 0, max: 10 }),
                })),
            },
            status: faker.helpers.arrayElement(statuses),
            createdAt: faker.date.between({ from: '2023-01-01', to: new Date() }).toISOString(),
            updatedAt: new Date().toISOString(),
            feedback: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.3 }),
        };
    }
}

// 小程序挑战工厂
export class MiniChallengeFactory extends BaseMiniFactory<MiniChallenge> {
    protected buildData(): MiniChallenge {
        const types: MiniChallenge['type'][] = ['daily', 'weekly', 'monthly', 'special'];
        const categories: MiniChallenge['category'][] = ['coding', 'learning', 'contribution', 'social'];
        const difficulties: MiniChallenge['difficulty'][] = ['easy', 'medium', 'hard'];
        const statuses: MiniChallenge['status'][] = ['active', 'completed', 'expired', 'locked'];

        const startDate = faker.date.between({ from: '2023-01-01', to: new Date() });
        const endDate = new Date(startDate.getTime() + faker.number.int({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000);

        const target = faker.number.int({ min: 1, max: 100 });
        const current = faker.number.int({ min: 0, max: target });

        return {
            id: uuidv4(),
            title: faker.lorem.sentence({ min: 3, max: 6 }).replace('.', ''),
            description: faker.lorem.paragraph({ min: 2, max: 4 }),
            type: faker.helpers.arrayElement(types),
            category: faker.helpers.arrayElement(categories),
            difficulty: faker.helpers.arrayElement(difficulties),
            status: faker.helpers.arrayElement(statuses),
            progress: {
                current,
                target,
                unit: faker.helpers.arrayElement(['次', '小时', '天', '个', '行']),
            },
            rewards: {
                experience: faker.number.int({ min: 10, max: 500 }),
                coins: faker.number.int({ min: 5, max: 200 }),
                badges: faker.helpers.arrayElements(['编程新手', '代码达人', '学习之星', '贡献者', '社交达人'], {
                    min: 0,
                    max: 2,
                }),
                items: faker.helpers.maybe(
                    () => faker.helpers.arrayElements(['头像框', '称号', '皮肤', '道具'], { min: 1, max: 2 }),
                    { probability: 0.3 },
                ),
            },
            requirements: {
                level: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 20 }), { probability: 0.4 }),
                prerequisites: faker.helpers.maybe(
                    () => faker.helpers.arrayElements(['完成新手任务', '获得认证', '达到等级5'], { min: 1, max: 2 }),
                    { probability: 0.3 },
                ),
                timeLimit: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 72 }), { probability: 0.5 }),
            },
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            createdAt: startDate.toISOString(),
            participants: faker.number.int({ min: 0, max: 10000 }),
            completions: faker.number.int({ min: 0, max: 5000 }),
        };
    }

    static createDailyChallenge(overrides: Partial<MiniChallenge> = {}): MiniChallenge {
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        return new MiniChallengeFactory().build({
            type: 'daily',
            difficulty: 'easy',
            status: 'active',
            startDate: today.toISOString(),
            endDate: tomorrow.toISOString(),
            requirements: {
                timeLimit: 24,
            },
            ...overrides,
        });
    }

    static createWeeklyChallenge(overrides: Partial<MiniChallenge> = {}): MiniChallenge {
        const startOfWeek = new Date();
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

        return new MiniChallengeFactory().build({
            type: 'weekly',
            difficulty: 'medium',
            status: 'active',
            startDate: startOfWeek.toISOString(),
            endDate: endOfWeek.toISOString(),
            requirements: {
                timeLimit: 168, // 7 days
            },
            rewards: {
                experience: faker.number.int({ min: 100, max: 500 }),
                coins: faker.number.int({ min: 50, max: 200 }),
                badges: ['周挑战完成者'],
                items: ['特殊头像框'],
            },
            ...overrides,
        });
    }
}

// 小程序徽章工厂
export class MiniBadgeFactory extends BaseMiniFactory<MiniBadge> {
    protected buildData(): MiniBadge {
        const categories: MiniBadge['category'][] = ['achievement', 'skill', 'contribution', 'special'];
        const rarities: MiniBadge['rarity'][] = ['common', 'rare', 'epic', 'legendary'];

        const badgeNames = [
            '编程新手',
            '代码达人',
            '学习之星',
            '贡献者',
            '社交达人',
            '任务完成者',
            '评价之星',
            '连续签到',
            '早起鸟',
            '夜猫子',
        ];

        return {
            id: uuidv4(),
            name: faker.helpers.arrayElement(badgeNames),
            description: faker.lorem.sentence({ min: 5, max: 15 }),
            icon: faker.image.url({ width: 64, height: 64 }),
            category: faker.helpers.arrayElement(categories),
            rarity: faker.helpers.arrayElement(rarities),
            requirements: {
                type: faker.helpers.arrayElement([
                    'task_completion',
                    'skill_level',
                    'rating',
                    'contribution',
                    'special',
                ]),
                criteria: {
                    count: faker.number.int({ min: 1, max: 100 }),
                    threshold: faker.number.float({ min: 1.0, max: 5.0, fractionDigits: 1 }),
                },
            },
            rewards: {
                experience: faker.number.int({ min: 50, max: 1000 }),
                coins: faker.number.int({ min: 20, max: 500 }),
                title: faker.helpers.maybe(() => faker.lorem.words({ min: 1, max: 3 }), { probability: 0.3 }),
            },
            unlockedAt: faker.helpers.maybe(
                () => faker.date.between({ from: '2023-01-01', to: new Date() }).toISOString(),
                { probability: 0.6 },
            ),
            progress: faker.helpers.maybe(
                () => {
                    const target = faker.number.int({ min: 5, max: 100 });
                    return {
                        current: faker.number.int({ min: 0, max: target }),
                        target,
                    };
                },
                { probability: 0.4 },
            ),
        };
    }
}

// 小程序通知工厂
export class MiniNotificationFactory extends BaseMiniFactory<MiniNotification> {
    protected buildData(): MiniNotification {
        const types: MiniNotification['type'][] = ['task', 'application', 'payment', 'system', 'social', 'challenge'];
        const priorities: MiniNotification['priority'][] = ['low', 'medium', 'high'];

        const subtypes = {
            task: ['assigned', 'completed', 'deadline_reminder', 'status_changed'],
            application: ['received', 'accepted', 'rejected', 'withdrawn'],
            payment: ['received', 'sent', 'pending', 'failed'],
            system: ['update', 'maintenance', 'announcement', 'feature'],
            social: ['follow', 'like', 'comment', 'mention'],
            challenge: ['started', 'completed', 'failed', 'reward'],
        };

        const type = faker.helpers.arrayElement(types);

        return {
            id: uuidv4(),
            userId: uuidv4(),
            type,
            subtype: faker.helpers.arrayElement(subtypes[type]),
            title: faker.lorem.sentence({ min: 3, max: 6 }).replace('.', ''),
            content: faker.lorem.paragraph({ min: 1, max: 3 }),
            data: faker.helpers.maybe(
                () => ({
                    taskId: uuidv4(),
                    amount: faker.number.int({ min: 100, max: 2000 }),
                    url: faker.internet.url(),
                }),
                { probability: 0.7 },
            ),
            isRead: faker.helpers.weightedArrayElement([
                { weight: 3, value: true },
                { weight: 7, value: false },
            ]),
            priority: faker.helpers.arrayElement(priorities),
            createdAt: faker.date.between({ from: '2023-01-01', to: new Date() }).toISOString(),
            expiresAt: faker.helpers.maybe(
                () => faker.date.between({ from: new Date(), to: '2024-12-31' }).toISOString(),
                { probability: 0.3 },
            ),
            actions: faker.helpers.maybe(
                () => [
                    {
                        label: '查看详情',
                        action: 'navigate',
                        data: { url: '/pages/task/detail' },
                    },
                    {
                        label: '忽略',
                        action: 'dismiss',
                        data: {},
                    },
                ],
                { probability: 0.5 },
            ),
        };
    }
}

// 小程序消息工厂
export class MiniMessageFactory extends BaseMiniFactory<MiniMessage> {
    protected buildData(): MiniMessage {
        const types: MiniMessage['type'][] = ['text', 'image', 'file', 'system'];
        const statuses: MiniMessage['status'][] = ['sending', 'sent', 'delivered', 'read', 'failed'];

        const type = faker.helpers.arrayElement(types);
        let content = '';
        let metadata = undefined;

        switch (type) {
            case 'text':
                content = faker.lorem.sentence({ min: 1, max: 10 });
                break;
            case 'image':
                content = faker.image.url();
                metadata = {
                    imageWidth: faker.number.int({ min: 200, max: 1920 }),
                    imageHeight: faker.number.int({ min: 200, max: 1080 }),
                };
                break;
            case 'file':
                content = faker.internet.url();
                metadata = {
                    fileName: faker.system.fileName(),
                    fileSize: faker.number.int({ min: 1024, max: 10485760 }),
                };
                break;
            case 'system':
                content = faker.helpers.arrayElement([
                    '任务已分配给您',
                    '您的申请已被接受',
                    '任务已完成，请确认',
                    '系统维护通知',
                ]);
                break;
        }

        const createdAt = faker.date.between({ from: '2023-01-01', to: new Date() });

        return {
            id: uuidv4(),
            conversationId: uuidv4(),
            senderId: uuidv4(),
            receiverId: uuidv4(),
            type,
            content,
            metadata,
            status: faker.helpers.arrayElement(statuses),
            createdAt: createdAt.toISOString(),
            updatedAt: createdAt.toISOString(),
        };
    }
}

// 小程序数据场景生成器
export class MiniDataScenarioGenerator {
    /**
     * 创建新用户入门场景
     */
    static createNewUserOnboardingScenario() {
        const newUser = MiniUserFactory.createNewbie();

        const beginnerTasks = Array.from({ length: 5 }, () => MiniTaskFactory.createBeginnerTask());
        const dailyChallenge = MiniChallengeFactory.createDailyChallenge();

        const welcomeNotifications = [
            new MiniNotificationFactory().build({
                userId: newUser.id,
                type: 'system',
                subtype: 'welcome',
                title: '欢迎加入PhoenixCoder！',
                content: '完成新手任务，开始您的编程之旅。',
                priority: 'high',
                isRead: false,
            }),
        ];

        const basicBadges = [
            new MiniBadgeFactory().build({
                name: '新手上路',
                category: 'achievement',
                rarity: 'common',
                unlockedAt: newUser.createdAt,
            }),
        ];

        return {
            users: [newUser],
            tasks: beginnerTasks,
            challenges: [dailyChallenge],
            notifications: welcomeNotifications,
            badges: basicBadges,
        };
    }

    /**
     * 创建活跃用户场景
     */
    static createActiveUserScenario() {
        const activeUser = MiniUserFactory.createExpert();

        const myTasks = Array.from({ length: 3 }, () =>
            new MiniTaskFactory().build({
                assignee: {
                    id: activeUser.id,
                    nickname: activeUser.nickname,
                    avatar: activeUser.avatar,
                },
                status: 'in_progress',
            }),
        );

        const availableTasks = new MiniTaskFactory().buildList(10, { status: 'published' });

        const myApplications = Array.from({ length: 5 }, () =>
            new MiniApplicationFactory().build({
                applicant: {
                    id: activeUser.id,
                    nickname: activeUser.nickname,
                    avatar: activeUser.avatar,
                    rating: 4.8,
                    completedTasks: 25,
                },
            }),
        );

        const activeChallenges = [
            MiniChallengeFactory.createDailyChallenge(),
            MiniChallengeFactory.createWeeklyChallenge(),
        ];

        const unreadNotifications = new MiniNotificationFactory().buildList(8, {
            userId: activeUser.id,
            isRead: false,
        });

        const earnedBadges = [
            new MiniBadgeFactory().build({
                name: '任务达人',
                category: 'achievement',
                rarity: 'rare',
                unlockedAt: faker.date.past().toISOString(),
            }),
            new MiniBadgeFactory().build({
                name: '代码专家',
                category: 'skill',
                rarity: 'epic',
                unlockedAt: faker.date.past().toISOString(),
            }),
        ];

        return {
            users: [activeUser],
            tasks: [...myTasks, ...availableTasks],
            applications: myApplications,
            challenges: activeChallenges,
            notifications: unreadNotifications,
            badges: earnedBadges,
        };
    }

    /**
     * 创建社交互动场景
     */
    static createSocialInteractionScenario() {
        const users = new MiniUserFactory().buildList(5);
        const mainUser = users[0];

        const conversations = users.slice(1).map((user) => ({
            id: uuidv4(),
            participants: [mainUser.id, user.id],
            lastMessage: new MiniMessageFactory().build({
                senderId: user.id,
                receiverId: mainUser.id,
            }),
            unreadCount: faker.number.int({ min: 0, max: 5 }),
        }));

        const messages = conversations.flatMap((conv) =>
            Array.from({ length: faker.number.int({ min: 5, max: 20 }) }, () =>
                new MiniMessageFactory().build({
                    conversationId: conv.id,
                    senderId: faker.helpers.arrayElement(conv.participants),
                    receiverId: faker.helpers.arrayElement(conv.participants),
                }),
            ),
        );

        const socialNotifications = [
            new MiniNotificationFactory().build({
                userId: mainUser.id,
                type: 'social',
                subtype: 'follow',
                title: '新的关注者',
                content: `${users[1].nickname} 关注了您`,
                isRead: false,
            }),
            new MiniNotificationFactory().build({
                userId: mainUser.id,
                type: 'social',
                subtype: 'like',
                title: '获得点赞',
                content: `${users[2].nickname} 点赞了您的作品`,
                isRead: false,
            }),
        ];

        return {
            users,
            conversations,
            messages,
            notifications: socialNotifications,
        };
    }
}

/**
 * 快速生成小程序测试数据
 */
export function generateMiniTestData(
    scenario: 'default' | 'onboarding' | 'active_user' | 'social' = 'default',
    size: 'small' | 'medium' | 'large' = 'small',
) {
    const sizeConfig = {
        small: { users: 3, tasks: 8, applications: 5, challenges: 2, notifications: 5 },
        medium: { users: 10, tasks: 25, applications: 15, challenges: 5, notifications: 20 },
        large: { users: 50, tasks: 100, applications: 80, challenges: 20, notifications: 100 },
    };

    const config = sizeConfig[size];

    switch (scenario) {
        case 'onboarding':
            return MiniDataScenarioGenerator.createNewUserOnboardingScenario();
        case 'active_user':
            return MiniDataScenarioGenerator.createActiveUserScenario();
        case 'social':
            return MiniDataScenarioGenerator.createSocialInteractionScenario();
        default:
            return {
                users: new MiniUserFactory().buildList(config.users),
                tasks: new MiniTaskFactory().buildList(config.tasks),
                applications: new MiniApplicationFactory().buildList(config.applications),
                challenges: new MiniChallengeFactory().buildList(config.challenges),
                notifications: new MiniNotificationFactory().buildList(config.notifications),
                badges: new MiniBadgeFactory().buildList(10),
                messages: new MiniMessageFactory().buildList(20),
            };
    }
}

// 导出所有工厂类
export {
    MiniUserFactory,
    MiniTaskFactory,
    MiniApplicationFactory,
    MiniChallengeFactory,
    MiniBadgeFactory,
    MiniNotificationFactory,
    MiniMessageFactory,
    MiniDataScenarioGenerator,
};
