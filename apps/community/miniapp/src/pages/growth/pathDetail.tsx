// 导入模块
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { View, Text, Button, Progress } from '@tarojs/components';
import { useSelector, useDispatch } from 'react-redux';
import growthActions from '../../redux/actions/growthActions';
import LearningProgressChart from '../../components/Charts/LearningProgressChart';
import ThemeToggle from '../../components/ThemeToggle';
import styles from './pathDetail.module.scss';

type Module = {
    id: string;
    name: string;
    description: string;
    progress: number;
    isCompleted: boolean;
    challenges: Challenge[];
};

type Challenge = {
    id: string;
    name: string;
    difficulty: 'easy' | 'medium' | 'hard';
    isCompleted: boolean;
};

type Skill = {
    name: string;
    value: number;
    category: string;
};

type ProgressData = {
    date: string;
    progress: number;
};

type PathDetailProps = {
    pathId: string;
};

const PathDetail = ({ pathId }: PathDetailProps) => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [activeModule, setActiveModule] = useState<Module | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // 从Redux获取数据
    const pathDetail = useSelector((state: any) => state.growth.pathDetail);
    const skillsData: Skill[] = useSelector((state: any) => state.growth.skillsData) || [];
    const progressData: ProgressData[] = useSelector((state: any) => state.growth.progressData) || [];

    // 主题切换处理
    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
    };

    // 加载路径详情
    useEffect(() => {
        if (pathId) {
            dispatch(growthActions.fetchGrowthPath())
                .then(() => {
                    setIsLoading(false);
                    // 设置第一个模块为活动模块
                    if (pathDetail?.modules && pathDetail.modules.length > 0) {
                        setActiveModule(pathDetail.modules[0]);
                    }
                })
                .catch((error) => {
                    console.error('Failed to fetch path detail:', error);
                    setIsLoading(false);
                });
        }
    }, [pathId, dispatch]);

    // 处理模块切换
    const handleModuleChange = (module: Module) => {
        setActiveModule(module);
    };

    // 处理挑战完成
    const handleCompleteChallenge = (challengeId: string) => {
        if (activeModule) {
            // 更新挑战状态
            const updatedChallenges = activeModule.challenges.map((challenge) =>
                challenge.id === challengeId ? { ...challenge, isCompleted: true } : challenge,
            );

            // 计算新的模块进度
            const completedChallenges = updatedChallenges.filter((challenge) => challenge.isCompleted).length;
            const newProgress = Math.round((completedChallenges / updatedChallenges.length) * 100);

            const updatedModule = {
                ...activeModule,
                challenges: updatedChallenges,
                progress: newProgress,
                isCompleted: newProgress === 100,
            };

            setActiveModule(updatedModule);

            // 更新Redux状态
            dispatch(growthActions.updateGrowthProgress(newProgress));
        }
    };

    // 根据主题设置颜色
    const themeConfig = {
        dark: {
            bgColor: '#1E1E2F',
            textColor: '#FFFFFF',
            cardBg: '#2D2D42',
            highlightColor: '#3D5AFE',
            borderColor: '#4D4D6D',
        },
        light: {
            bgColor: '#F9FAFB',
            textColor: '#1E1E2F',
            cardBg: '#FFFFFF',
            highlightColor: '#3D5AFE',
            borderColor: '#E5E7EB',
        },
    };

    const currentTheme = themeConfig[theme];

    if (isLoading) {
        return (
            <View className={styles.loadingContainer} style={{ backgroundColor: currentTheme.bgColor }}>
                <Text style={{ color: currentTheme.textColor }}>加载中...</Text>
            </View>
        );
    }

    if (!pathDetail) {
        return (
            <View className={styles.errorContainer} style={{ backgroundColor: currentTheme.bgColor }}>
                <Text style={{ color: currentTheme.textColor }}>无法加载路径详情</Text>
            </View>
        );
    }

    return (
        <View className={styles.container} style={{ backgroundColor: currentTheme.bgColor }}>
            {/* 头部 */}
            <View
                className={styles.header}
                style={{ backgroundColor: currentTheme.cardBg, borderBottomColor: currentTheme.borderColor }}
            >
                <View className={styles.headerContent}>
                    <Text className={styles.pathTitle} style={{ color: currentTheme.textColor }}>
                        {pathDetail.name}
                    </Text>
                    <Text className={styles.pathDescription} style={{ color: currentTheme.textColor }}>
                        {pathDetail.description}
                    </Text>
                    <Progress
                        percent={pathDetail.progress}
                        strokeWidth={4}
                        activeColor={currentTheme.highlightColor}
                        backgroundColor={currentTheme.borderColor}
                        className={styles.progressBar}
                    />
                    <Text className={styles.progressText} style={{ color: currentTheme.textColor }}>
                        整体进度: {pathDetail.progress}%
                    </Text>
                </View>
                <ThemeToggle initialTheme={theme} onChange={handleThemeChange} />
            </View>

            {/* 图表部分 */}
            <LearningProgressChart skillsData={skillsData} progressData={progressData} />

            {/* 模块列表 */}
            <View className={styles.modulesContainer}>
                <Text className={styles.sectionTitle} style={{ color: currentTheme.textColor }}>
                    学习模块
                </Text>
                <View className={styles.modulesList}>
                    {pathDetail.modules.map((module: Module) => (
                        <View
                            key={module.id}
                            className={`${styles.moduleCard} ${activeModule?.id === module.id ? styles.activeModule : ''}`}
                            style={{
                                backgroundColor:
                                    activeModule?.id === module.id ? currentTheme.highlightColor : currentTheme.cardBg,
                                borderColor: currentTheme.borderColor,
                            }}
                            onClick={() => handleModuleChange(module)}
                        >
                            <Text
                                className={styles.moduleTitle}
                                style={{ color: activeModule?.id === module.id ? '#FFFFFF' : currentTheme.textColor }}
                            >
                                {module.name}
                            </Text>
                            <Progress
                                percent={module.progress}
                                strokeWidth={3}
                                activeColor={activeModule?.id === module.id ? '#FFFFFF' : currentTheme.highlightColor}
                                backgroundColor={
                                    activeModule?.id === module.id
                                        ? 'rgba(255, 255, 255, 0.3)'
                                        : currentTheme.borderColor
                                }
                                className={styles.moduleProgress}
                            />
                            <Text
                                className={styles.moduleProgressText}
                                style={{ color: activeModule?.id === module.id ? '#FFFFFF' : currentTheme.textColor }}
                            >
                                {module.progress}%
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* 活动模块详情 */}
            {activeModule && (
                <View
                    className={styles.activeModuleDetail}
                    style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.borderColor }}
                >
                    <Text className={styles.detailTitle} style={{ color: currentTheme.textColor }}>
                        {activeModule.name}
                    </Text>
                    <Text className={styles.detailDescription} style={{ color: currentTheme.textColor }}>
                        {activeModule.description}
                    </Text>

                    <Text className={styles.challengesTitle} style={{ color: currentTheme.textColor }}>
                        挑战
                    </Text>
                    <View className={styles.challengesList}>
                        {activeModule.challenges.map((challenge: Challenge) => (
                            <View
                                key={challenge.id}
                                className={`${styles.challengeItem} ${challenge.isCompleted ? styles.completedChallenge : ''}`}
                                style={{ borderColor: currentTheme.borderColor }}
                            >
                                <View className={styles.challengeHeader}>
                                    <Text className={styles.challengeName} style={{ color: currentTheme.textColor }}>
                                        {challenge.name}
                                    </Text>
                                    <View
                                        className={`${styles.difficultyBadge} ${challenge.difficulty === 'easy' ? styles.easy : challenge.difficulty === 'medium' ? styles.medium : styles.hard}`}
                                    >
                                        {challenge.difficulty === 'easy'
                                            ? '简单'
                                            : challenge.difficulty === 'medium'
                                              ? '中等'
                                              : '困难'}
                                    </View>
                                </View>
                                <Button
                                    type={challenge.isCompleted ? 'default' : 'primary'}
                                    disabled={challenge.isCompleted}
                                    onClick={() => handleCompleteChallenge(challenge.id)}
                                    style={{
                                        backgroundColor: challenge.isCompleted
                                            ? currentTheme.borderColor
                                            : currentTheme.highlightColor,
                                    }}
                                >
                                    {challenge.isCompleted ? '已完成' : '完成挑战'}
                                </Button>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};

export default PathDetail;
