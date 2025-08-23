// 声明模块以解决类型问题
import React from 'react';
import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';
import { Line, Radar } from '@ant-design/charts';
import ResponsiveContainer from './ResponsiveContainer';
import styles from './LearningProgressChart.module.scss';

type SkillData = {
    name: string;
    value: number;
    category: string;
};

type ProgressData = {
    date: string;
    progress: number;
};

interface LearningProgressChartProps {
    skillsData: SkillData[];
    progressData: ProgressData[];
}

const LearningProgressChart: React.FC<LearningProgressChartProps> = ({ skillsData, progressData }) => {
    // 格式化技能数据，按类别分组
    const groupedSkills = skillsData.reduce(
        (groups, skill) => {
            const { category } = skill;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(skill);
            return groups;
        },
        {} as Record<string, SkillData[]>,
    );

    // 准备雷达图数据
    const radarData = Object.keys(groupedSkills).map((category) => {
        const categorySkills = groupedSkills[category];
        const categoryObj: any = { category };
        categorySkills.forEach((skill) => {
            categoryObj[skill.name] = skill.value;
        });
        return categoryObj;
    });

    // 准备折线图数据
    const lineData = progressData.map((item) => ({
        ...item,
        progress: Math.round(item.progress * 100) / 100, // 保留两位小数
    }));

    return (
        <View className={styles.chartContainer}>
            {/* 技能雷达图 */}
            <View className={styles.chartSection}>
                <View className={styles.chartTitle}>技能掌握程度</View>
                <ResponsiveContainer width="100%" height={300}>
                    <Radar
                        data={radarData}
                        xField="category"
                        yField="value"
                        seriesField="category"
                        radius={0.8}
                        startAngle={Math.PI / 2}
                        endAngle={(Math.PI * 5) / 2}
                        xAxis={{
                            line: null,
                            tickLine: null,
                            grid: {
                                line: {
                                    style: {
                                        stroke: '#4D4D6D',
                                    },
                                },
                            },
                            label: {
                                style: {
                                    fill: '#A0A0A0',
                                    fontSize: 12,
                                },
                            },
                        }}
                        yAxis={{
                            grid: {
                                line: {
                                    style: {
                                        stroke: '#4D4D6D',
                                    },
                                },
                            },
                            label: {
                                style: {
                                    fill: '#A0A0A0',
                                },
                            },
                        }}
                        point={{}}
                        area={{
                            style: {
                                fillOpacity: 0.3,
                            },
                        }}
                        color={['#3D5AFE', '#7B61FF', '#FFA940', '#00BFA5']}
                    />
                </ResponsiveContainer>
            </View>

            {/* 学习进度折线图 */}
            <View className={styles.chartSection}>
                <View className={styles.chartTitle}>学习进度趋势</View>
                <ResponsiveContainer width="100%" height={250}>
                    <Line
                        data={lineData}
                        xField="date"
                        yField="progress"
                        point={{
                            size: 4,
                            shape: 'circle',
                            style: {
                                fill: '#3D5AFE',
                                stroke: '#3D5AFE',
                                lineWidth: 0,
                            },
                        }}
                        color="#3D5AFE"
                        lineStyle={{
                            lineWidth: 2,
                        }}
                        tooltip={{
                            formatter: (datum) => {
                                return { name: '进度', value: `${datum.progress}%` };
                            },
                            domStyles: {
                                'g2-tooltip': {
                                    backgroundColor: '#2D2D42',
                                    borderColor: '#4D4D6D',
                                    color: '#FFFFFF',
                                },
                            },
                        }}
                        yAxis={{
                            min: 0,
                            max: 100,
                            label: {
                                style: {
                                    fill: '#A0A0A0',
                                },
                            },
                        }}
                        xAxis={{
                            label: {
                                style: {
                                    fill: '#A0A0A0',
                                },
                            },
                        }}
                        grid={{
                            line: {
                                style: {
                                    stroke: '#4D4D6D',
                                    lineDash: [3, 3],
                                },
                            },
                        }}
                    ></Line>
                </ResponsiveContainer>
            </View>
        </View>
    );
};

export default LearningProgressChart;
