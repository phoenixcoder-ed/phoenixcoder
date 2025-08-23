// 声明模块以解决类型问题
// 导入必要的类型和库
import React, { Component } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Image } from '@tarojs/components';
import { AtButton } from 'taro-ui';
import { connect } from 'react-redux';

// 临时定义 growthActions
const growthActions = {
    fetchGrowthPath: () => ({ type: 'FETCH_GROWTH_PATH' }),
    fetchChallenges: () => ({ type: 'FETCH_CHALLENGES' }),
    fetchSkills: () => ({ type: 'FETCH_SKILLS' }),
    updateGrowthProgress: (progress: number) => ({ type: 'UPDATE_GROWTH_PROGRESS', payload: progress }),
    completeChallenge: (challengeId: string) => ({ type: 'COMPLETE_CHALLENGE', payload: challengeId }),
};

// 定义本地类型
interface Skill {
    id: string;
    name: string;
    category: string;
    level: number;
    description: string;
}

interface GrowthPath {
    id: string;
    title: string;
    goal: string;
    expectedCompletion: string;
    currentProgress: number;
    remainingDays: number;
    stages: Array<{ id: string; name: string; status: string }>;
}

interface Challenge {
    id: string;
    name: string;
    status: string;
    progress?: number;
}

// 临时定义 AuthService
const AuthService = {
    isLoggedIn: () => {
        const userInfo = Taro.getStorageSync('userInfo');
        return !!userInfo && !!userInfo.token;
    },
    redirectToLogin: () => {
        Taro.showModal({
            title: '登录提示',
            content: '请先登录以继续操作',
            confirmText: '去登录',
            success: (res) => {
                if (res.confirm) {
                    Taro.navigateTo({
                        url: '/pages/login/index',
                    });
                }
            },
        });
    },
};

// 临时定义组件
const LearningProgressChart: React.FC<any> = ({ skillsData: _skillsData, progressData: _progressData }) => (
    <View className="chart-placeholder">
        <Text>学习进度图表</Text>
    </View>
);

const SkillMap: React.FC<any> = ({ skillsData: _skillsData, onSkillSelect: _onSkillSelect }) => (
    <View className="chart-placeholder">
        <Text>技能地图</Text>
    </View>
);

const ThemeToggle: React.FC<any> = ({ initialTheme, onChange }) => (
    <View className="theme-toggle">
        <AtButton size="small" onClick={() => onChange(initialTheme === 'dark' ? 'light' : 'dark')}>
            {initialTheme === 'dark' ? '🌞' : '🌙'}
        </AtButton>
    </View>
);
import './index.scss';

// 扩展Taro类型声明
declare module '@tarojs/taro' {
    interface TaroStatic {
        onThemeChange(_callback: (_res: { theme: 'light' | 'dark' }) => void): { off: () => void };
        getSystemInfoSync(): { theme: 'light' | 'dark' } & any;
    }
}

// 定义RootState类型
interface RootState {
    growthReducers: {
        growthPath: GrowthPath | null;
        challenges: Challenge[];
        skills: Skill[];
        loading: boolean;
        error: string | null;
    };
}

// 从Redux状态构建图表数据
const buildChartData = (skills: Skill[]) => {
    // 技能数据转换为图表格式
    const skillsData = skills.map((skill) => ({
        name: skill.name,
        value: skill.level * 10,
        category: skill.category,
        description: `${skill.name} 技能等级: ${skill.level}`,
    }));

    // 模拟学习进度数据
    const progressData = [
        { date: '1月', progress: 10 },
        { date: '2月', progress: 15 },
        { date: '3月', progress: 25 },
        { date: '4月', progress: 30 },
        { date: '5月', progress: 45 },
        { date: '6月', progress: 60 },
    ];

    return { skillsData, progressData };
};

// 处理技能选择
const handleSkillSelect = (skill: Skill) => {
    Taro.navigateTo({
        url: `/pages/skill/detail?id=${skill.id}`,
    });
};

// 主题配置
const themeConfig = {
    dark: {
        bgColor: '#1E1E2F',
        textColor: '#FFFFFF',
        cardBg: '#2D2D42',
        highlightColor: '#3D5AFE',
    },
    light: {
        bgColor: '#F9FAFB',
        textColor: '#1E1E2F',
        cardBg: '#FFFFFF',
        highlightColor: '#3D5AFE',
    },
};

// 定义组件props类型
interface Props {
    growthPath: GrowthPath | null;
    challenges: Challenge[];
    skills: Skill[];
    loading: boolean;
    error: string | null;
    dispatch: any;
    fetchGrowthPath: () => Promise<any>;
    fetchChallenges: () => Promise<any>;
    fetchSkills: () => Promise<any>;
    updateGrowthProgress: (_progress: number) => Promise<any>;
    completeChallenge: (_challengeId: string) => Promise<any>;
}

// 模拟数据
const mockSkills: Skill[] = [
    { id: '1', name: 'JavaScript', level: 4, category: 'frontend', description: 'JavaScript编程语言' },
    { id: '2', name: 'React', level: 3, category: 'frontend', description: 'React前端框架' },
    { id: '3', name: 'Node.js', level: 3, category: 'backend', description: 'Node.js后端开发' },
    { id: '4', name: 'Python', level: 2, category: 'backend', description: 'Python编程语言' },
];

const mockChallenges: Challenge[] = [
    { id: '1', name: '完成React项目', status: 'in-progress', progress: 60 },
    { id: '2', name: '学习TypeScript', status: 'completed', progress: 100 },
];

const mockGrowthPath: GrowthPath = {
    id: '1',
    title: '全栈开发路线',
    goal: '成为全栈开发工程师',
    expectedCompletion: '2024-12-31',
    currentProgress: 65,
    remainingDays: 120,
    stages: [
        { id: '1', name: '前端基础', status: 'completed' },
        { id: '2', name: 'React框架', status: 'in-progress' },
        { id: '3', name: '后端开发', status: 'pending' },
    ],
};

// Redux连接
const mapStateToProps = (state: RootState) => ({
    growthPath: state.growthReducers?.growthPath || mockGrowthPath,
    challenges: state.growthReducers?.challenges || mockChallenges,
    skills: state.growthReducers?.skills || mockSkills,
    loading: state.growthReducers?.loading || false,
    error: state.growthReducers?.error || null,
});

const mapDispatchToProps = (dispatch: any) => ({
    dispatch,
    fetchGrowthPath: () => dispatch(growthActions.fetchGrowthPath()),
    fetchChallenges: () => dispatch(growthActions.fetchChallenges()),
    fetchSkills: () => dispatch(growthActions.fetchSkills()),
    updateGrowthProgress: (progress: number) => dispatch(growthActions.updateGrowthProgress(progress)),
    completeChallenge: (challengeId: string) => dispatch(growthActions.completeChallenge(challengeId)),
});

class Growth extends Component<Props> {
    static config: any = {
        navigationBarTitleText: '成长路线',
        navigationBarBackgroundColor: '#1E1E2F',
        navigationBarTextStyle: 'white',
    };

    // 声明主题监听器类型
    private themeChangeListener: { off: () => void } | null = null;

    // 定义组件状态
    state: {
        theme: 'light' | 'dark';
        chartData: {
            skillsData: Array<{
                name: string;
                value: number;
                category: string;
                description: string;
            }>;
            progressData: Array<{
                date: string;
                progress: number;
            }>;
        };
    };

    constructor(props: Props) {
        super(props);
        this.state = {
            theme: 'dark',
            chartData: buildChartData([]),
        };
        // 绑定方法到当前实例
        this.handleThemeChange = this.handleThemeChange.bind(this);
        this.handleUpdateProgress = this.handleUpdateProgress.bind(this);
        this.handleCompleteChallenge = this.handleCompleteChallenge.bind(this);
    }
    componentDidMount() {
        // 检查用户登录状态
        if (!AuthService.isLoggedIn()) {
            // 未登录，延迟1秒后引导登录
            setTimeout(() => {
                AuthService.redirectToLogin();
            }, 1000);
        } else {
            // 已登录，获取数据
            // 获取学习路径数据
            this.props.fetchGrowthPath().catch((err: Error) => {
                console.error('获取学习路径失败:', err);
            });

            // 获取挑战数据
            this.props.fetchChallenges().catch((err: Error) => {
                console.error('获取挑战数据失败:', err);
            });

            // 获取技能数据
            this.props
                .fetchSkills()
                .then(() => {
                    // 构建图表数据
                    const chartData = buildChartData(this.props.skills || []);
                    this.setState({ chartData });
                })
                .catch((err: Error) => {
                    console.error('获取技能数据失败:', err);
                });
        }

        // 初始化主题
        try {
            const systemInfo = Taro.getSystemInfoSync();
            const systemTheme = systemInfo.theme || 'dark';
            this.setState({ theme: systemTheme as 'light' | 'dark' });
        } catch (error) {
            console.error('获取系统主题失败:', error);
            this.setState({ theme: 'dark' });
        }

        // 监听主题变化
        this.themeChangeListener = Taro.onThemeChange((res) => {
            this.setState({ theme: res.theme as 'light' | 'dark' });
        });
    }

    componentWillUnmount() {
        // 移除主题变化监听
        if (this.themeChangeListener) {
            this.themeChangeListener.off();
            // 重置监听器引用
            this.themeChangeListener = null;
        }
    }

    // 主题切换处理
    handleThemeChange = (newTheme: 'light' | 'dark') => {
        this.setState({ theme: newTheme });
    };

    // 更新学习进度
    handleUpdateProgress = (progress: number): void => {
        this.props.updateGrowthProgress(progress).catch((err: Error) => {
            console.error('更新学习进度失败:', err);
        });
    };

    // 完成挑战
    handleCompleteChallenge = (challengeId: string): void => {
        this.props.completeChallenge(challengeId).catch((err: Error) => {
            console.error('完成挑战失败:', err);
        });
    };

    render() {
        const { growthPath, challenges, loading, skills } = this.props;
        const { theme, chartData } = this.state;

        // 使用默认数据以防数据未加载
        const defaultGrowthData: GrowthPath = {
            id: 'default',
            title: '个性化成长路线',
            goal: '成为全栈开发专家',
            expectedCompletion: '2026年1月',
            currentProgress: 0,
            remainingDays: 180,
            stages: [
                { id: '1', name: '前端开发基础', status: 'current' },
                { id: '2', name: 'React深度实践', status: 'upcoming' },
                { id: '3', name: '后端架构设计', status: 'upcoming' },
            ],
        };

        const defaultChallengeData = {
            title: '技术闯关系统',
            currentChallenge: '数据结构大师之路',
            currentProgress: '0/8关',
            description: '掌握核心数据结构与算法',
            daysLeft: 14,
            challenges: [
                { id: '1', name: '数组与字符串', status: 'upcoming' },
                { id: '2', name: '链表操作', status: 'upcoming' },
                { id: '3', name: '树与二叉树', status: 'upcoming' },
                { id: '4', name: '图算法', status: 'upcoming' },
                { id: '5', name: '排序与查找', status: 'upcoming' },
                { id: '6', name: '动态规划', status: 'upcoming' },
                { id: '7', name: '贪心算法', status: 'upcoming' },
                { id: '8', name: '综合应用', status: 'upcoming' },
            ] as Challenge[],
        };

        const currentGrowthData = growthPath || defaultGrowthData;
        const currentChallengeData =
            challenges.length > 0
                ? {
                      title: '技术闯关系统',
                      currentChallenge: challenges.find((c) => c.status === 'in-progress')?.name || '数据结构大师之路',
                      currentProgress: `${challenges.filter((c) => c.status === 'completed').length}/${challenges.length}关`,
                      description: '掌握核心数据结构与算法',
                      daysLeft: 14,
                      challenges,
                  }
                : defaultChallengeData;

        const currentTheme = themeConfig[theme];

        // 如果技能数据已更新但图表数据未更新，则更新图表数据
        if (skills && skills.length > 0 && chartData.skillsData.length === 0) {
            this.setState({ chartData: buildChartData(skills as Skill[]) });
        }

        return (
            <View className="growth-container">
                {/* 头部 */}
                <View
                    className="header"
                    style={{ backgroundColor: currentTheme.cardBg, borderBottomColor: currentTheme.highlightColor }}
                >
                    <View className="logo-container">
                        <Image className="logo" src="/assets/images/logo.png" mode="aspectFit" />
                        <Text className="title" style={{ color: currentTheme.textColor }}>
                            PhoenixCoder
                        </Text>
                    </View>
                    <ThemeToggle initialTheme={theme} onChange={this.handleThemeChange} />
                </View>

                {/* 加载中状态 */}
                {loading && (
                    <View className="loading-container" style={{ backgroundColor: currentTheme.bgColor }}>
                        <Text className="loading-text" style={{ color: currentTheme.textColor }}>
                            加载中...
                        </Text>
                    </View>
                )}

                {/* 学习进度图表 */}
                <View className="chart-section">
                    <LearningProgressChart skillsData={chartData.skillsData} progressData={chartData.progressData} />
                </View>

                {/* 技能图谱 */}
                <View className="skill-map-section">
                    <SkillMap skillsData={chartData.skillsData} onSkillSelect={handleSkillSelect} />
                </View>

                {/* 个性化成长路线 */}
                <View className="growth-section" style={{ backgroundColor: currentTheme.cardBg }}>
                    <View className="section-header">
                        <Text className="section-title" style={{ color: currentTheme.textColor }}>
                            {currentGrowthData.title}
                        </Text>
                        <AtButton className={`edit-btn ${theme}`}>编辑目标</AtButton>
                    </View>
                    <View className="goal-card" style={{ backgroundColor: currentTheme.bgColor }}>
                        <Text className="goal-text" style={{ color: currentTheme.textColor }}>
                            {currentGrowthData.goal}
                        </Text>
                        <Text className="expected-completion" style={{ color: currentTheme.textColor }}>
                            预计完成时间: {currentGrowthData.expectedCompletion}
                        </Text>
                    </View>
                    <View className="stages-container">
                        <View className="stage-tabs">
                            {currentGrowthData.stages.map((stage) => (
                                <View
                                    key={stage.id}
                                    className={`stage-tab ${stage.status === 'current' ? 'active' : ''}`}
                                    style={{
                                        backgroundColor:
                                            stage.status === 'current' ? currentTheme.highlightColor : 'transparent',
                                    }}
                                    onClick={() => {
                                        // 跳转到学习路径详情页
                                        Taro.navigateTo({
                                            url: `/pages/growth/pathDetail?pathId=${currentGrowthData.id}`,
                                        });
                                    }}
                                >
                                    <Text
                                        className="stage-name"
                                        style={{
                                            color: stage.status === 'current' ? '#FFFFFF' : currentTheme.textColor,
                                        }}
                                    >
                                        {stage.name}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View className="progress-container">
                        <Text className="progress-text" style={{ color: currentTheme.textColor }}>
                            当前进度: {currentGrowthData.currentProgress}%
                        </Text>
                        <View
                            className="progress-bar"
                            style={{
                                width: `${currentGrowthData.currentProgress}%`,
                                backgroundColor: currentTheme.highlightColor,
                                height: '8px',
                                borderRadius: '4px',
                            }}
                        />
                        <Text className="remaining-days" style={{ color: currentTheme.textColor }}>
                            剩余时间: {currentGrowthData.remainingDays}天
                        </Text>
                    </View>
                </View>

                {/* 技术闯关系统 */}
                <View className="challenge-section" style={{ backgroundColor: currentTheme.cardBg }}>
                    <View className="section-header">
                        <Text className="section-title" style={{ color: currentTheme.textColor }}>
                            {currentChallengeData.title}
                        </Text>
                    </View>
                    <View className="challenge-card" style={{ backgroundColor: currentTheme.bgColor }}>
                        <View className="challenge-header">
                            <Text className="challenge-day" style={{ color: currentTheme.textColor }}>
                                {new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')}
                            </Text>
                            <View className="challenge-time-left">
                                <View className="circular-progress" style={{ color: '#7B61FF' }}>
                                    <Text>{Math.round((currentChallengeData.daysLeft / 14) * 100)}%</Text>
                                </View>
                                <Text className="time-left-text" style={{ color: currentTheme.textColor }}>
                                    B:{currentChallengeData.daysLeft}
                                </Text>
                            </View>
                        </View>
                        <Text className="challenge-title" style={{ color: currentTheme.textColor }}>
                            {currentChallengeData.currentChallenge}
                        </Text>
                        <Text className="challenge-description" style={{ color: currentTheme.textColor }}>
                            {currentChallengeData.description}
                        </Text>
                        <View className="challenge-progress">
                            <Text className="current-progress" style={{ color: currentTheme.textColor }}>
                                当前进度: {currentChallengeData.currentProgress}
                            </Text>
                        </View>
                        <View className="challenge-actions">
                            <AtButton
                                className={`continue-btn ${theme}`}
                                onClick={() => {
                                    // 找到当前进行中的挑战
                                    const currentChallenge =
                                        challenges.find((c) => c.status === 'in-progress') || challenges[0];
                                    if (currentChallenge) {
                                        Taro.navigateTo({
                                            url: `/pages/growth/challengeDetail?challengeId=${currentChallenge.id}`,
                                        });
                                    }
                                }}
                            >
                                继续挑战
                            </AtButton>
                        </View>
                    </View>
                    <View className="challenge-list">
                        {currentChallengeData.challenges.map((challenge) => (
                            <View
                                key={challenge.id}
                                className={`challenge-item ${challenge.status === 'completed' ? 'completed' : challenge.status === 'in-progress' ? 'in-progress' : 'upcoming'}`}
                                style={{
                                    backgroundColor:
                                        challenge.status === 'completed'
                                            ? '#E8F5E9'
                                            : challenge.status === 'in-progress'
                                              ? '#E3F2FD'
                                              : currentTheme.bgColor,
                                    borderLeftColor:
                                        challenge.status === 'completed'
                                            ? '#4CAF50'
                                            : challenge.status === 'in-progress'
                                              ? '#2196F3'
                                              : '#9E9E9E',
                                }}
                                onClick={() => {
                                    if (challenge.status !== 'upcoming') {
                                        Taro.navigateTo({
                                            url: `/pages/growth/challengeDetail?challengeId=${challenge.id}`,
                                        });
                                    }
                                }}
                            >
                                <View className="challenge-item-header">
                                    <Text className="challenge-item-name" style={{ color: currentTheme.textColor }}>
                                        {challenge.name}
                                    </Text>
                                    <Text
                                        className="challenge-item-status"
                                        style={{
                                            color:
                                                challenge.status === 'completed'
                                                    ? '#4CAF50'
                                                    : challenge.status === 'in-progress'
                                                      ? '#2196F3'
                                                      : '#9E9E9E',
                                        }}
                                    >
                                        {challenge.status === 'completed'
                                            ? '已完成'
                                            : challenge.status === 'in-progress'
                                              ? '进行中'
                                              : '未开始'}
                                    </Text>
                                </View>
                                {challenge.progress !== undefined && (
                                    <View className="challenge-item-progress">
                                        <View
                                            className="challenge-item-progress-bar"
                                            style={{
                                                width: `${challenge.progress}%`,
                                                backgroundColor:
                                                    challenge.status === 'completed' ? '#4CAF50' : '#2196F3',
                                                height: '4px',
                                                borderRadius: '2px',
                                            }}
                                        />
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Growth);
