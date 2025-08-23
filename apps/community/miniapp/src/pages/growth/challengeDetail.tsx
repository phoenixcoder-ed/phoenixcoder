// 导入类型
import type { RootState } from '@/redux/store';

// 定义本地类型
interface Option {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface Skill {
    id: string;
    name: string;
    level: number;
    increase: number;
}

// 导入模块
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { View, Text, Button, Radio, RadioGroup, Textarea } from '@tarojs/components';
import { useSelector, useDispatch } from 'react-redux';
import growthActions from '@/redux/actions/growthActions';
const { fetchChallengeDetail, completeChallenge, updateSkillLevel } = growthActions;
import ThemeToggle from '@/components/ThemeToggle';
import styles from './challengeDetail.module.scss';

type ChallengeDetailProps = {
    challengeId: string;
};

const ChallengeDetail = ({ challengeId }: ChallengeDetailProps) => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [gainedSkills, setGainedSkills] = useState<Skill[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // 从Redux获取数据
    const challengeDetail = useSelector((state: RootState) => state.growth.challengeDetail);

    // 主题切换处理
    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
    };

    // 加载挑战详情
    useEffect(() => {
        if (challengeId) {
            dispatch(fetchChallengeDetail(challengeId))
                .then(() => {
                    setIsLoading(false);
                })
                .catch((error: Error) => {
                    console.error('Failed to fetch challenge detail:', error);
                    setIsLoading(false);
                });
        }
    }, [challengeId, dispatch]);

    // 处理选项选择
    const handleOptionChange = (e: { detail: { value: string } }) => {
        setSelectedOption(e.detail.value);
    };

    // 处理答案提交
    const handleSubmit = () => {
        if (!selectedOption && !userAnswer && challengeDetail?.type === 'coding') {
            Taro.showToast({
                title: '请完成挑战',
                icon: 'none',
            });
            return;
        }

        let isAnswerCorrect = false;

        if (challengeDetail?.type === 'multiple_choice') {
            // 检查选择题答案
            const correctOption = challengeDetail.options?.find((option: Option) => option.isCorrect);
            isAnswerCorrect = selectedOption === correctOption?.id;
        } else if (challengeDetail?.type === 'coding') {
            // 这里应该有代码评估逻辑，简化为假设答案正确
            isAnswerCorrect = true; // 实际应用中需要替换为真实的代码评估
        }

        setIsSubmitted(true);
        setIsCorrect(isAnswerCorrect);

        if (isAnswerCorrect) {
            // 完成挑战
            dispatch(completeChallenge(challengeId))
                .then((result: { skills?: Skill[] }) => {
                    // 更新技能等级
                    if (result?.skills) {
                        setGainedSkills(result.skills);
                        // 触发技能等级更新
                        result.skills.forEach((skill: Skill) => {
                            dispatch(updateSkillLevel(skill.id, skill.level));
                        });
                    }

                    Taro.showToast({
                        title: '挑战成功！',
                        icon: 'success',
                    });
                })
                .catch((error: Error) => {
                    console.error('Failed to complete challenge:', error);
                    Taro.showToast({
                        title: '挑战提交失败',
                        icon: 'none',
                    });
                });
        } else {
            Taro.showToast({
                title: '答案不正确，请重试',
                icon: 'none',
            });
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
            correctColor: '#00BFA5',
            incorrectColor: '#FF5252',
        },
        light: {
            bgColor: '#F9FAFB',
            textColor: '#1E1E2F',
            cardBg: '#FFFFFF',
            highlightColor: '#3D5AFE',
            borderColor: '#E5E7EB',
            correctColor: '#00BFA5',
            incorrectColor: '#FF5252',
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

    if (!challengeDetail) {
        return (
            <View className={styles.errorContainer} style={{ backgroundColor: currentTheme.bgColor }}>
                <Text style={{ color: currentTheme.textColor }}>无法加载挑战详情</Text>
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
                    <Text className={styles.challengeTitle} style={{ color: currentTheme.textColor }}>
                        {challengeDetail.name}
                    </Text>
                    <View
                        className={`${styles.difficultyBadge} ${challengeDetail.difficulty === 'easy' ? styles.easy : challengeDetail.difficulty === 'medium' ? styles.medium : styles.hard}`}
                    >
                        {challengeDetail.difficulty === 'easy'
                            ? '简单'
                            : challengeDetail.difficulty === 'medium'
                              ? '中等'
                              : '困难'}
                    </View>
                    <Text className={styles.challengeDescription} style={{ color: currentTheme.textColor }}>
                        {challengeDetail.description}
                    </Text>
                </View>
                <ThemeToggle initialTheme={theme} onChange={handleThemeChange} />
            </View>

            {/* 挑战内容 */}
            <View
                className={styles.challengeContent}
                style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.borderColor }}
            >
                {challengeDetail && challengeDetail.type === 'multiple_choice' && (
                    <View className={styles.questionContainer}>
                        <Text className={styles.questionText} style={{ color: currentTheme.textColor }}>
                            {challengeDetail.question || ''}
                        </Text>
                        <RadioGroup
                            checkedValue={selectedOption}
                            onChange={handleOptionChange}
                            className={styles.optionsList}
                        >
                            {challengeDetail.options?.map((option: Option) => (
                                <Radio
                                    key={option.id}
                                    value={option.id}
                                    className={styles.optionItem}
                                    style={{
                                        color: isSubmitted
                                            ? option.isCorrect
                                                ? currentTheme.correctColor
                                                : selectedOption === option.id
                                                  ? currentTheme.incorrectColor
                                                  : currentTheme.textColor
                                            : currentTheme.textColor,
                                    }}
                                >
                                    {option.text}
                                    {isSubmitted && option.isCorrect && (
                                        <Text
                                            className={styles.correctMark}
                                            style={{ color: currentTheme.correctColor }}
                                        >
                                            {' '}
                                            ✓
                                        </Text>
                                    )}
                                    {isSubmitted && selectedOption === option.id && !option.isCorrect && (
                                        <Text
                                            className={styles.incorrectMark}
                                            style={{ color: currentTheme.incorrectColor }}
                                        >
                                            {' '}
                                            ✗
                                        </Text>
                                    )}
                                </Radio>
                            ))}
                        </RadioGroup>
                    </View>
                )}

                {challengeDetail && challengeDetail.type === 'coding' && (
                    <View className={styles.codingContainer}>
                        <Text className={styles.questionText} style={{ color: currentTheme.textColor }}>
                            {challengeDetail.question || ''}
                        </Text>
                        <View
                            className={styles.codePrompt}
                            style={{ backgroundColor: '#1E1E2F', borderColor: currentTheme.borderColor }}
                        >
                            <Text className={styles.promptText} style={{ color: '#FFFFFF' }}>
                                {challengeDetail.codePrompt || ''}
                            </Text>
                        </View>
                        <Textarea
                            value={userAnswer}
                            onInput={(e) => setUserAnswer(e.detail.value)}
                            placeholder="在此输入您的代码..."
                            className={styles.codeInput}
                            style={{
                                backgroundColor: '#1E1E2F',
                                color: '#FFFFFF',
                                borderColor: currentTheme.borderColor,
                            }}
                        ></Textarea>
                    </View>
                )}

                <Button
                    type="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitted}
                    className={styles.submitButton}
                    style={{ backgroundColor: currentTheme.highlightColor }}
                >
                    {isSubmitted ? '已提交' : '提交答案'}
                </Button>
            </View>

            {/* 结果反馈 */}
            {isSubmitted && (
                <View
                    className={styles.resultContainer}
                    style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.borderColor }}
                >
                    {isCorrect ? (
                        <View className={styles.successResult} style={{ color: currentTheme.correctColor }}>
                            <Text className={styles.resultTitle}>恭喜！挑战成功！</Text>
                            <Text className={styles.resultMessage}>您已掌握了这个知识点。</Text>

                            {gainedSkills.length > 0 && (
                                <View className={styles.skillsGained}>
                                    <Text className={styles.skillsTitle} style={{ color: currentTheme.textColor }}>
                                        技能提升：
                                    </Text>
                                    <View className={styles.skillsList}>
                                        {gainedSkills.map((skill: Skill) => (
                                            <View
                                                key={skill.id}
                                                className={styles.skillItem}
                                                style={{ borderColor: currentTheme.borderColor }}
                                            >
                                                <Text style={{ color: currentTheme.textColor }}>{skill.name}</Text>
                                                <Text
                                                    className={styles.skillIncrease}
                                                    style={{ color: currentTheme.correctColor }}
                                                >
                                                    +{skill.increase} 级
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View className={styles.failResult} style={{ color: currentTheme.incorrectColor }}>
                            <Text className={styles.resultTitle}>挑战失败</Text>
                            <Text className={styles.resultMessage}>请再检查一下您的答案。</Text>
                            <Button
                                type="default"
                                onClick={() => {
                                    setIsSubmitted(false);
                                    setSelectedOption(null);
                                    setIsCorrect(null);
                                }}
                                style={{ borderColor: currentTheme.borderColor, color: currentTheme.textColor }}
                            >
                                再试一次
                            </Button>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

export default ChallengeDetail;
