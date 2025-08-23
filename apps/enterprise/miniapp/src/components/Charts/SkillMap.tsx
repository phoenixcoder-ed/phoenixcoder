// 声明模块以解决类型问题
declare module '@tarojs/taro' {
    export function useState<T>(_initialState: T | (() => T)): [T, (_newState: T | ((_prevState: T) => T)) => void];
    export function useEffect(_effect: () => void | (() => void), _deps?: any[]): void;
    export const getSystemInfoSync: () => {
        theme: 'light' | 'dark';
    };
    export const onThemeChange: (_callback: (_res: { theme: 'light' | 'dark' }) => void) => {
        off: () => void;
    };
}

declare module '@tarojs/components' {
    export const View: any;
    export const Text: any;
    export const TouchableOpacity: any;
}

declare module '@ant-design/charts-taro' {
    export const RadarChart: any;
    export const PolarGrid: any;
    export const PolarAngleAxis: any;
    export const PolarRadiusAxis: any;
    export const Radar: any;
    export const Tooltip: any;
    export const ResponsiveContainer: any;
}

declare module './SkillMap.module.scss' {
    const styles: any;
    export default styles;
}

// 导入模块
const Taro = require('@tarojs/taro');
const { useState, useEffect } = Taro;
const { View, Text, TouchableOpacity } = require('@tarojs/components');
const {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Tooltip,
    ResponsiveContainer,
} = require('@ant-design/charts-taro');
const styles = require('./SkillMap.module.scss').default;

declare module '@ant-design/charts-taro' {
    export const RadarChart: any;
    export const PolarGrid: any;
    export const PolarAngleAxis: any;
    export const PolarRadiusAxis: any;
    export const Radar: any;
    export const Tooltip: any;
    export const ResponsiveContainer: any;
}

type SkillData = {
    name: string;
    value: number;
    description: string;
    category: string;
};

interface SkillMapProps {
    skillsData: SkillData[];
    onSkillSelect?: (_skill: SkillData) => void;
    theme?: 'light' | 'dark';
    width?: number;
    height?: number;
    _type?: 'radar' | 'scatter';
}

const SkillMap: React.FC<SkillMapProps> = ({
    skillsData,
    onSkillSelect,
    theme: _propTheme,
    width: _propWidth = 300,
    _height = 300,
    _type = 'radar',
}) => {
    const [selectedSkill, setSelectedSkill] = useState<SkillData | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    // const { width } = Dimensions.get('window');
    // const _chartWidth = width - 40; // 减去边距

    // 监听系统主题变化
    useEffect(() => {
        const systemTheme = Taro.getSystemInfoSync().theme || 'dark';
        setTheme(systemTheme as 'light' | 'dark');

        const listener = Taro.onThemeChange((res) => {
            setTheme(res.theme as 'light' | 'dark');
        });

        return () => {
            listener?.off();
        };
    }, []);

    // 处理技能选择
    const handleSkillSelect = (skill: SkillData) => {
        setSelectedSkill(skill);
        if (onSkillSelect) {
            onSkillSelect(skill);
        }
    };

    // 格式化雷达图数据
    const radarData = skillsData.map((skill) => ({
        name: skill.name,
        value: skill.value,
        description: skill.description,
        category: skill.category,
    }));

    // 提取技能类别和名称
    const categories = Array.from(new Set(skillsData.map((skill) => skill.category)));
    // const _skillNames = skillsData.map((skill) => skill.name);

    // 根据主题设置颜色
    const themeConfig = {
        dark: {
            bgColor: '#1E1E2F',
            textColor: '#FFFFFF',
            highlightColor: '#3D5AFE',
            borderColor: '#4D4D6D',
            skillCardBg: '#2D2D42',
        },
        light: {
            bgColor: '#F9FAFB',
            textColor: '#1E1E2F',
            highlightColor: '#3D5AFE',
            borderColor: '#E5E7EB',
            skillCardBg: '#FFFFFF',
        },
    };

    const currentTheme = themeConfig[theme];

    return (
        <View className={styles.container} style={{ backgroundColor: currentTheme.bgColor }}>
            {/* 标题 */}
            <View
                className={styles.title}
                style={{ color: currentTheme.textColor, borderLeftColor: currentTheme.highlightColor }}
            >
                技能图谱
            </View>

            {/* 雷达图 */}
            <View className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={350}>
                    <RadarChart outerRadius={120} data={radarData}>
                        <PolarGrid stroke={currentTheme.borderColor} />
                        <PolarAngleAxis dataKey="name" tick={{ fill: currentTheme.textColor, fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: currentTheme.textColor }} />
                        <Radar
                            name="技能水平"
                            dataKey="value"
                            stroke={currentTheme.highlightColor}
                            fill={currentTheme.highlightColor}
                            fillOpacity={0.3}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: currentTheme.skillCardBg,
                                borderColor: currentTheme.borderColor,
                                color: currentTheme.textColor,
                            }}
                            formatter={(value, name, props) => [`${value}%`, props.payload?.name || '技能水平']}
                            onTooltipClick={(data) => {
                                if (data && data.payload) {
                                    handleSkillSelect(data.payload as SkillData);
                                }
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </View>

            {/* 技能卡片列表 */}
            <View className={styles.skillList}>
                {categories.map((category) => (
                    <View key={category} className={styles.categorySection}>
                        <View className={styles.categoryTitle} style={{ color: currentTheme.textColor }}>
                            {category}
                        </View>
                        <View className={styles.skillsRow}>
                            {skillsData
                                .filter((skill) => skill.category === category)
                                .map((skill) => (
                                    <TouchableOpacity
                                        key={skill.name}
                                        className={`${styles.skillCard} ${selectedSkill?.name === skill.name ? styles.selected : ''}`}
                                        style={{
                                            backgroundColor:
                                                selectedSkill?.name === skill.name
                                                    ? currentTheme.highlightColor
                                                    : currentTheme.skillCardBg,
                                            borderColor: currentTheme.borderColor,
                                        }}
                                        onClick={() => handleSkillSelect(skill)}
                                    >
                                        <Text
                                            style={{
                                                color:
                                                    selectedSkill?.name === skill.name
                                                        ? '#FFFFFF'
                                                        : currentTheme.textColor,
                                            }}
                                        >
                                            {skill.name}
                                        </Text>
                                        <View className={styles.skillLevel}>
                                            <View
                                                className={styles.levelBar}
                                                style={{
                                                    width: `${skill.value}%`,
                                                    backgroundColor:
                                                        selectedSkill?.name === skill.name
                                                            ? '#FFFFFF'
                                                            : currentTheme.highlightColor,
                                                }}
                                            />
                                        </View>
                                        <Text
                                            style={{
                                                color:
                                                    selectedSkill?.name === skill.name
                                                        ? '#FFFFFF'
                                                        : currentTheme.textColor,
                                                fontSize: 12,
                                            }}
                                        >
                                            {skill.value}%
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                        </View>
                    </View>
                ))}
            </View>

            {/* 选中技能详情 */}
            {selectedSkill && (
                <View
                    className={styles.skillDetail}
                    style={{
                        backgroundColor: currentTheme.skillCardBg,
                        borderColor: currentTheme.borderColor,
                    }}
                >
                    <View className={styles.detailHeader} style={{ color: currentTheme.textColor }}>
                        {selectedSkill.name}
                    </View>
                    <View className={styles.detailContent} style={{ color: currentTheme.textColor }}>
                        <Text>{selectedSkill.description}</Text>
                    </View>
                    <View className={styles.detailFooter}>
                        <Text style={{ color: currentTheme.highlightColor }}>掌握程度: {selectedSkill.value}%</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

export default SkillMap;
