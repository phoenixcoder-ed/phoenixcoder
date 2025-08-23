import React, { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import { AtButton, AtInput, AtTag, AtIcon, AtTabs, AtTabsPane } from 'taro-ui';
import './index.scss';

// 定义题目类型
interface Problem {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    tags: string[];
    description: string;
    acceptanceRate: number;
    submissionCount: number;
    isCompleted?: boolean;
    isFavorited?: boolean;
}

const ProblemList: React.FC = () => {
    // 状态管理
    const [problems, setProblems] = useState<Problem[]>([]);
    const [currentTab, setCurrentTab] = useState(0);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // 页面配置
    useEffect(() => {
        Taro.setNavigationBarTitle({ title: '编程题库' });
        Taro.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: '#1E1E2F',
        });
    }, []);

    // 模拟数据
    const mockProblems: Problem[] = [
        {
            id: '1',
            title: '两数之和',
            difficulty: 'easy',
            category: 'array',
            tags: ['数组', '哈希表'],
            description: '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值的那两个整数...',
            acceptanceRate: 52.3,
            submissionCount: 1234567,
            isCompleted: true,
            isFavorited: false,
        },
        {
            id: '2',
            title: '反转链表',
            difficulty: 'easy',
            category: 'linked-list',
            tags: ['链表', '递归'],
            description: '给你单链表的头节点 head ，请你反转链表，并返回反转后的链表...',
            acceptanceRate: 73.1,
            submissionCount: 987654,
            isCompleted: false,
            isFavorited: true,
        },
        {
            id: '3',
            title: '最长回文子串',
            difficulty: 'medium',
            category: 'string',
            tags: ['字符串', '动态规划'],
            description: '给你一个字符串 s，找到 s 中最长的回文子串...',
            acceptanceRate: 34.8,
            submissionCount: 765432,
            isCompleted: false,
            isFavorited: false,
        },
        {
            id: '4',
            title: '合并K个升序链表',
            difficulty: 'hard',
            category: 'linked-list',
            tags: ['链表', '分治', '堆'],
            description: '给你一个链表数组，每个链表都已经按升序排列...',
            acceptanceRate: 56.2,
            submissionCount: 543210,
            isCompleted: false,
            isFavorited: false,
        },
    ];

    // 初始化数据
    useEffect(() => {
        setProblems(mockProblems);
    }, []);

    // 难度颜色映射
    const getDifficultyColor = (difficulty: string): string => {
        switch (difficulty) {
            case 'easy':
                return '#00C851';
            case 'medium':
                return '#FF8800';
            case 'hard':
                return '#FF4444';
            default:
                return '#666';
        }
    };

    // 难度文本映射
    const getDifficultyText = (difficulty: string): string => {
        switch (difficulty) {
            case 'easy':
                return '简单';
            case 'medium':
                return '中等';
            case 'hard':
                return '困难';
            default:
                return '未知';
        }
    };

    // 筛选题目
    const getFilteredProblems = (): Problem[] => {
        return problems.filter((problem) => {
            // 搜索过滤
            const matchesSearch =
                problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                problem.description.toLowerCase().includes(searchQuery.toLowerCase());

            // 难度过滤
            const matchesDifficulty = selectedDifficulty === 'all' || problem.difficulty === selectedDifficulty;

            // 标签过滤
            const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => problem.tags.includes(tag));

            return matchesSearch && matchesDifficulty && matchesTags;
        });
    };

    // 处理题目点击
    const handleProblemClick = (problemId: string): void => {
        Taro.navigateTo({
            url: `/pages/problem/detail?id=${problemId}`,
        });
    };

    // 处理收藏
    const handleFavorite = (problemId: string): void => {
        setProblems((prev) => prev.map((p) => (p.id === problemId ? { ...p, isFavorited: !p.isFavorited } : p)));
        Taro.showToast({
            title: '收藏状态已更新',
            icon: 'success',
            duration: 1000,
        });
    };

    // 处理搜索
    const handleSearch = (): void => {
        // 搜索逻辑已在 getFilteredProblems 中实现
        Taro.showToast({
            title: `搜索: ${searchQuery}`,
            icon: 'none',
            duration: 1000,
        });
    };

    // 渲染题目项
    const renderProblemItem = (problem: Problem): JSX.Element => (
        <View key={problem.id} className="problem-item" onClick={() => handleProblemClick(problem.id)}>
            <View className="problem-header">
                <View className="problem-title-row">
                    <Text className="problem-title">{problem.title}</Text>
                    <View className="problem-actions">
                        <AtIcon
                            value={problem.isFavorited ? 'heart-2' : 'heart'}
                            size="20"
                            color={problem.isFavorited ? '#FF4444' : '#ccc'}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFavorite(problem.id);
                            }}
                        />
                    </View>
                </View>
                <View className="problem-meta">
                    <AtTag
                        size="small"
                        type="primary"
                        customStyle={{
                            backgroundColor: getDifficultyColor(problem.difficulty),
                            color: 'white',
                            border: 'none',
                        }}
                    >
                        {getDifficultyText(problem.difficulty)}
                    </AtTag>
                    {problem.isCompleted && (
                        <AtTag
                            size="small"
                            type="primary"
                            customStyle={{ backgroundColor: '#00C851', color: 'white', border: 'none' }}
                        >
                            已完成
                        </AtTag>
                    )}
                </View>
            </View>
            <Text className="problem-description">{problem.description}</Text>
            <View className="problem-tags">
                {problem.tags.map((tag, index) => (
                    <AtTag key={index} size="small">
                        {tag}
                    </AtTag>
                ))}
            </View>
            <View className="problem-stats">
                <Text className="stat-text">通过率: {problem.acceptanceRate}%</Text>
                <Text className="stat-text">提交: {problem.submissionCount.toLocaleString()}</Text>
            </View>
        </View>
    );

    return (
        <View className="problem-page">
            {/* 搜索栏 */}
            <View className="search-bar">
                <AtInput
                    name="search"
                    placeholder="搜索题目..."
                    value={searchQuery}
                    onChange={(value) => setSearchQuery(value as string)}
                    onConfirm={handleSearch}
                />
                <AtButton size="small" type="primary" onClick={handleSearch}>
                    搜索
                </AtButton>
            </View>

            {/* 难度筛选 */}
            <View className="difficulty-filter">
                <AtButton
                    size="small"
                    type={selectedDifficulty === 'all' ? 'primary' : 'default'}
                    onClick={() => setSelectedDifficulty('all')}
                >
                    全部
                </AtButton>
                <AtButton
                    size="small"
                    type={selectedDifficulty === 'easy' ? 'primary' : 'default'}
                    onClick={() => setSelectedDifficulty('easy')}
                >
                    简单
                </AtButton>
                <AtButton
                    size="small"
                    type={selectedDifficulty === 'medium' ? 'primary' : 'default'}
                    onClick={() => setSelectedDifficulty('medium')}
                >
                    中等
                </AtButton>
                <AtButton
                    size="small"
                    type={selectedDifficulty === 'hard' ? 'primary' : 'default'}
                    onClick={() => setSelectedDifficulty('hard')}
                >
                    困难
                </AtButton>
            </View>

            {/* 标签页 */}
            <AtTabs
                current={currentTab}
                tabList={[{ title: '题目列表' }, { title: '我的收藏' }, { title: '已完成' }]}
                onClick={setCurrentTab}
            >
                <AtTabsPane current={currentTab} index={0}>
                    <View className="problem-list">{getFilteredProblems().map(renderProblemItem)}</View>
                </AtTabsPane>
                <AtTabsPane current={currentTab} index={1}>
                    <View className="problem-list">
                        {getFilteredProblems()
                            .filter((p) => p.isFavorited)
                            .map(renderProblemItem)}
                    </View>
                </AtTabsPane>
                <AtTabsPane current={currentTab} index={2}>
                    <View className="problem-list">
                        {getFilteredProblems()
                            .filter((p) => p.isCompleted)
                            .map(renderProblemItem)}
                    </View>
                </AtTabsPane>
            </AtTabs>
        </View>
    );
};

export default ProblemList;
