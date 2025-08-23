import './index.scss';

import React, { Component } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { AtTabs, AtTabsPane, AtCard, AtButton, AtTag, AtIcon, AtActivityIndicator } from 'taro-ui';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { taskActions } from '../../redux/actions';
import AuthService from '../../utils/auth';

// 声明所需类型
interface Task {
    id: string;
    title: string;
    description: string;
    reward: number;
    tags: string[];
    deadline: string;
    skills: string[];
    status: 'available' | 'taken' | 'completed';
}

interface TaskHallProps {
    fetchTasks: () => void;
    takeTask: (_taskId: string) => void;
    tasks: Task[];
    loading: boolean;
}

interface TaskHallState {
    activeTab: number;
    filter: 'all' | 'available' | 'taken';
}

// 模拟任务数据
const mockTasks: Task[] = [
    {
        id: '1',
        title: 'React前端开发项目',
        description: '需要开发一个企业级React应用，包含用户管理、数据可视化等功能',
        reward: 5000,
        tags: ['前端', '紧急'],
        deadline: '2024-02-15',
        skills: ['React', 'TypeScript', 'Ant Design'],
        status: 'available',
    },
    {
        id: '2',
        title: 'Python数据分析脚本',
        description: '编写数据清洗和分析脚本，处理电商销售数据',
        reward: 2000,
        tags: ['数据分析', '远程'],
        deadline: '2024-02-10',
        skills: ['Python', 'Pandas', 'NumPy'],
        status: 'available',
    },
    {
        id: '3',
        title: 'Node.js API开发',
        description: '开发RESTful API接口，包含用户认证和数据CRUD操作',
        reward: 3500,
        tags: ['后端', '长期'],
        deadline: '2024-02-20',
        skills: ['Node.js', 'Express', 'MongoDB'],
        status: 'taken',
    },
];

interface RootState {
    taskReducers: {
        tasks: Task[];
        loading: boolean;
    };
}

const mapStateToProps = ({ taskReducers }: RootState) => ({
    tasks: taskReducers?.tasks?.length > 0 ? taskReducers.tasks : mockTasks,
    loading: taskReducers?.loading || false,
});

const mapDispatchToProps = (dispatch: (_action: unknown) => unknown) => ({
    fetchTasks: bindActionCreators(taskActions.fetchTasks, dispatch),
    takeTask: bindActionCreators(taskActions.takeTask, dispatch),
});

class TaskHall extends Component<TaskHallProps, TaskHallState> {
    static config: Config = {
        navigationBarTitleText: '任务大厅',
        navigationBarBackgroundColor: '#1E1E2F',
        navigationBarTextStyle: 'white',
    };

    constructor(props: TaskHallProps) {
        super(props);
        this.state = {
            activeTab: 0,
            filter: 'all' as 'all' | 'available' | 'taken',
        };
    }

    componentDidMount() {
        // 获取任务列表
        this.props.fetchTasks();
    }

    handleTabClick = (value: number) => {
        this.setState({ activeTab: value });
        // 根据标签筛选任务
        let filter: 'all' | 'available' | 'taken' = 'all';
        if (value === 1) filter = 'available';
        if (value === 2) filter = 'taken';
        this.setState({ filter });
    };

    handleTakeTask = (taskId: string) => {
        // 检查用户是否登录
        if (!AuthService.isLoggedIn()) {
            AuthService.redirectToLogin();
            return;
        }

        // 检查用户是否完成身份技能认证
        if (!AuthService.isIdentityVerified()) {
            AuthService.redirectToVerification();
            return;
        }

        // @ts-ignore: Taro类型定义问题
        Taro.showModal({
            title: '接单确认',
            content: '确定要接取此任务吗？',
            success: (res: { confirm: boolean }) => {
                if (res.confirm) {
                    this.props.takeTask(taskId);
                    // @ts-ignore: Taro类型定义问题
                    Taro.showToast({
                        title: '接单成功',
                        icon: 'success',
                    });
                }
            },
        });
    };

    renderTaskTags(tags: string[]) {
        return tags.map((tag, index) => (
            <AtTag key={index} size="small" className="task-tag" type={tag === '紧急' ? 'danger' : 'primary'}>
                {tag}
            </AtTag>
        ));
    }

    renderTaskSkills(skills: string[]) {
        return skills.map((skill, index) => (
            <Text key={index} className="skill-tag">
                {skill}
            </Text>
        ));
    }

    getFilteredTasks() {
        const { tasks } = this.props;
        const { filter } = this.state;

        if (filter === 'all') return tasks;
        if (filter === 'available') return tasks.filter((task) => task.status === 'available');
        if (filter === 'taken') return tasks.filter((task) => task.status === 'taken');
        return tasks;
    }

    render() {
        const { loading } = this.props;
        const filteredTasks = this.getFilteredTasks();

        return (
            <View className="task-hall-container">
                {/* 顶部标签栏 */}
                <AtTabs
                    current={this.state.activeTab}
                    onClick={this.handleTabClick}
                    className="task-tabs"
                    tabList={[{ title: '全部任务' }, { title: '可接任务' }, { title: '我接的单' }]}
                >
                    <AtTabsPane current={this.state.activeTab} index={0}>
                        {/* 全部任务内容 */}
                    </AtTabsPane>
                    <AtTabsPane current={this.state.activeTab} index={1}>
                        {/* 可接任务内容 */}
                    </AtTabsPane>
                    <AtTabsPane current={this.state.activeTab} index={2}>
                        {/* 我接的单内容 */}
                    </AtTabsPane>
                </AtTabs>

                {/* 任务列表 */}
                <ScrollView className="task-list" scrollY>
                    {loading ? (
                        <View className="loading-container">
                            <AtActivityIndicator size={32} />
                            <Text className="loading-text">加载中...</Text>
                        </View>
                    ) : filteredTasks.length === 0 ? (
                        <View className="empty-container">
                            <AtIcon className="empty-icon" value="file-text" size={60} />
                            <Text className="empty-text">暂无任务</Text>
                        </View>
                    ) : (
                        filteredTasks.map((task) => (
                            <AtCard key={task.id} className="task-card">
                                <View className="task-header">
                                    <Text className="task-title">{task.title}</Text>
                                    <Text className="task-reward">￥{task.reward}</Text>
                                </View>

                                <View className="task-tags">{this.renderTaskTags(task.tags)}</View>

                                <View className="task-info">
                                    <Text className="task-description">{task.description}</Text>
                                </View>

                                <View className="task-details">
                                    <View className="detail-item">
                                        <AtIcon value="clock" size={14} />
                                        <Text className="detail-text">截止日期: {task.deadline}</Text>
                                    </View>
                                    <View className="detail-item">
                                        <AtIcon value="code" size={14} />
                                        <Text className="detail-text">所需技能:</Text>
                                        <View className="skills-container">{this.renderTaskSkills(task.skills)}</View>
                                    </View>
                                </View>

                                <View className="task-actions">
                                    <AtButton
                                        type={task.status === 'available' ? 'primary' : 'secondary'}
                                        size="small"
                                        disabled={task.status !== 'available'}
                                        onClick={() => this.handleTakeTask(task.id)}
                                    >
                                        {task.status === 'available'
                                            ? '立即接单'
                                            : task.status === 'taken'
                                              ? '进行中'
                                              : '已完成'}
                                    </AtButton>
                                </View>
                            </AtCard>
                        ))
                    )}
                </ScrollView>
            </View>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TaskHall);
