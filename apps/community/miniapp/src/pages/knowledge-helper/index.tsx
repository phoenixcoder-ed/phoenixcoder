import React, { Component } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { AtButton, AtInput, AtTag, AtIcon, AtActivityIndicator } from 'taro-ui';
import { connect } from '@tarojs/redux';
import { knowledgeActions } from '../../redux/actions';
import AuthService from '../../utils/auth';

// 临时类型定义
interface KnowledgeEntry {
    id: string;
    title: string;
    category: string;
    content: string;
}

interface SearchResult {
    id: string;
    title: string;
    summary: string;
    tags: string[];
}

// 模拟数据
const mockSearchResults: SearchResult[] = [
    {
        id: '1',
        title: 'React Hooks 最佳实践',
        summary: '深入了解React Hooks的使用方法和最佳实践，包括useState、useEffect等常用Hook的使用技巧。',
        tags: ['React', 'Hooks', '前端'],
    },
    {
        id: '2',
        title: 'TypeScript 进阶指南',
        summary: 'TypeScript高级特性详解，包括泛型、装饰器、模块系统等内容。',
        tags: ['TypeScript', '进阶', '类型系统'],
    },
    {
        id: '3',
        title: 'Taro 小程序开发技巧',
        summary: '使用Taro框架开发跨平台小程序的实用技巧和注意事项。',
        tags: ['Taro', '小程序', '跨平台'],
    },
];
import './index.scss';

interface Props {
    searchResults: SearchResult[];
    currentKnowledge: any;
    loading: boolean;
    error: string | null;
    searchKnowledge: (_query: string) => any;
    getKnowledgeDetail: (_id: string) => any;
}

interface State {
    searchQuery: string;
    activeTab: number;
    hotTopics: string[];
    favorites: KnowledgeEntry[];
}

class KnowledgeHelper extends Component<Props, State> {
    config: Config = {
        navigationBarTitleText: '知识助手',
        navigationBarBackgroundColor: '#1E1E2F',
        navigationBarTextStyle: 'white',
    };

    constructor(props: Props) {
        super(props);
        this.state = {
            searchQuery: '',
            activeTab: 0,
            hotTopics: ['React Hooks', 'TypeScript', 'Taro 开发', 'Redux 状态管理', '小程序优化'],
            favorites: [],
        };
    }

    componentDidMount() {
        // 检查用户登录状态
        if (!AuthService.isLoggedIn()) {
            Taro.showToast({
                title: '请先登录',
                icon: 'none',
                duration: 2000,
            });
            setTimeout(() => {
                Taro.navigateTo({ url: '/pages/login/index' });
            }, 2000);
            return;
        }
    }

    handleSearch = () => {
        const { searchQuery } = this.state;
        if (searchQuery.trim()) {
            this.props.searchKnowledge(searchQuery);
            this.setState({ activeTab: 0 });
        }
    };

    handleTabChange = (index: number) => {
        this.setState({ activeTab: index });
    };

    handleTopicClick = (topic: string) => {
        this.setState({ searchQuery: topic });
        this.props.searchKnowledge(topic);
        this.setState({ activeTab: 0 });
    };

    handleKnowledgeClick = (id: string) => {
        this.props.getKnowledgeDetail(id);
    };

    renderSearchResults = () => {
        const { searchResults } = this.props;

        if (!searchResults || searchResults.length === 0) {
            return (
                <View className="empty-state">
                    <AtIcon value="search" size="60" color="#ccc" />
                    <Text className="empty-text">暂无搜索结果</Text>
                </View>
            );
        }

        return (
            <View className="results-container">
                {searchResults.map((result, index) => (
                    <View key={index} className="result-item" onClick={() => this.handleKnowledgeClick(result.id)}>
                        <Text className="result-title">{result.title}</Text>
                        <Text className="result-summary">{result.summary}</Text>
                        <View className="result-tags">
                            {result.tags.map((tag, tagIndex) => (
                                <AtTag key={tagIndex} size="small" type="primary">
                                    {tag}
                                </AtTag>
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    renderHotTopics = () => {
        const { hotTopics } = this.state;

        return (
            <View className="topics-container">
                <Text className="section-title">热门技术话题</Text>
                <View className="topics-grid">
                    {hotTopics.map((topic, index) => (
                        <View key={index} className="topic-item" onClick={() => this.handleTopicClick(topic)}>
                            <AtIcon value="bookmark" size="20" color="#3D5AFE" />
                            <Text className="topic-text">{topic}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    renderFavorites = () => {
        const { favorites } = this.state;

        if (favorites.length === 0) {
            return (
                <View className="empty-state">
                    <AtIcon value="heart" size="60" color="#ccc" />
                    <Text className="empty-text">暂无收藏内容</Text>
                </View>
            );
        }

        return (
            <View className="favorites-container">
                {favorites.map((item, index) => (
                    <View key={index} className="favorite-item" onClick={() => this.handleKnowledgeClick(item.id)}>
                        <Text className="favorite-title">{item.title}</Text>
                        <Text className="favorite-category">{item.category}</Text>
                    </View>
                ))}
            </View>
        );
    };

    render() {
        const { loading, error } = this.props;
        const { searchQuery, activeTab } = this.state;

        return (
            <View className="knowledge-helper-container">
                {/* 搜索区域 */}
                <View className="search-container">
                    <AtInput
                        name="search"
                        className="search-input"
                        placeholder="搜索知识库..."
                        value={searchQuery}
                        onChange={(value) => this.setState({ searchQuery: String(value) })}
                        onConfirm={this.handleSearch}
                    />
                    <AtButton type="primary" onClick={this.handleSearch}>
                        搜索
                    </AtButton>
                </View>

                {/* 标签页 */}
                <View className="tabs-container">
                    <AtButton
                        className={`tab-button ${activeTab === 0 ? 'active' : ''}`}
                        type={activeTab === 0 ? 'primary' : 'secondary'}
                        onClick={() => this.handleTabChange(0)}
                    >
                        搜索结果
                    </AtButton>
                    <AtButton
                        className={`tab-button ${activeTab === 1 ? 'active' : ''}`}
                        type={activeTab === 1 ? 'primary' : 'secondary'}
                        onClick={() => this.handleTabChange(1)}
                    >
                        热门话题
                    </AtButton>
                    <AtButton
                        className={`tab-button ${activeTab === 2 ? 'active' : ''}`}
                        type={activeTab === 2 ? 'primary' : 'secondary'}
                        onClick={() => this.handleTabChange(2)}
                    >
                        我的收藏
                    </AtButton>
                </View>

                {/* 内容区域 */}
                <ScrollView className="content-container" scrollY>
                    {loading ? (
                        <View className="loading-container">
                            <AtActivityIndicator mode="center" content="加载中..." />
                        </View>
                    ) : error ? (
                        <View className="error-container">
                            <AtIcon value="close-circle" size="60" color="#ff4757" />
                            <Text className="error-text">{error}</Text>
                        </View>
                    ) : (
                        <View>
                            {activeTab === 0 && this.renderSearchResults()}
                            {activeTab === 1 && this.renderHotTopics()}
                            {activeTab === 2 && this.renderFavorites()}
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    }
}

const mapStateToProps = (state: any) => ({
    searchResults:
        state.knowledgeReducers?.searchResults?.length > 0 ? state.knowledgeReducers.searchResults : mockSearchResults,
    currentKnowledge: state.knowledgeReducers?.currentKnowledge || null,
    loading: state.knowledgeReducers?.loading || false,
    error: state.knowledgeReducers?.error || null,
});

const mapDispatchToProps = (dispatch: any) => ({
    searchKnowledge: (query: string) => dispatch(knowledgeActions.searchKnowledge(query)),
    getKnowledgeDetail: (id: string) => dispatch(knowledgeActions.getKnowledgeDetail(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(KnowledgeHelper);
