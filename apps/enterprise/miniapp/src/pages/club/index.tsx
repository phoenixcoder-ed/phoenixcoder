import React, { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { AtButton, AtInput, AtTag, AtIcon } from 'taro-ui';
import { useDispatch, useSelector } from 'react-redux';
import { postActions } from '@/redux/actions';

// 临时定义 Post 类型
interface Post {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    authorId: string;
    authorName: string;
    avatar: string;
    likeCount: number;
    commentCount: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    isLiked?: boolean;
    isFavorited?: boolean;
}

// 临时定义 AppState 类型
interface AppState {
    postReducers: {
        posts: any[];
        categories?: Array<{ id: string; name: string }>;
        loading: boolean;
        error: string | null;
    };
}

// 扩展 Post 类型以匹配实际使用的属性
interface ExtendedPost extends Post {
    userAvatar?: string;
    userName?: string;
    excerpt?: string;
    coverImage?: string;
    views?: number;
    comments?: number;
    likes?: number;
    categoryName?: string;
    categoryId?: string;
}
import './index.scss';

// 定义组件
const Club: React.FC = () => {
    // Redux状态和调度器
    const dispatch = useDispatch();
    const { posts, categories, loading, error } = useSelector((state: AppState) => ({
        posts: state.postReducers?.posts || [],
        categories: state.postReducers?.categories || [],
        loading: state.postReducers?.loading || false,
        error: state.postReducers?.error || null,
    }));

    // 组件状态
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // 配置
    Taro.setNavigationBarTitle({ title: '社区互动' });
    Taro.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#1E1E2F',
    });

    // 模拟数据
    const [mockPosts] = useState<ExtendedPost[]>([
        {
            id: '1',
            title: 'React Hooks 最佳实践分享',
            content: '分享一些React Hooks的使用心得...',
            category: 'frontend',
            tags: ['React', 'Hooks', 'JavaScript'],
            authorId: '1',
            authorName: 'CodeMaster',
            avatar: 'https://img.icons8.com/bubbles/200/user.png',
            likeCount: 25,
            commentCount: 8,
            viewCount: 156,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userAvatar: 'https://img.icons8.com/bubbles/200/user.png',
            userName: 'CodeMaster',
            excerpt: '分享一些React Hooks的使用心得和最佳实践...',
            views: 156,
            comments: 8,
            likes: 25,
            categoryName: '前端开发',
            categoryId: 'frontend',
        },
        {
            id: '2',
            title: 'Python 数据分析入门指南',
            content: 'Python数据分析的基础知识...',
            category: 'backend',
            tags: ['Python', '数据分析', 'Pandas'],
            authorId: '2',
            authorName: 'DataExpert',
            avatar: 'https://img.icons8.com/bubbles/200/user.png',
            likeCount: 42,
            commentCount: 15,
            viewCount: 289,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            userAvatar: 'https://img.icons8.com/bubbles/200/user.png',
            userName: 'DataExpert',
            excerpt: 'Python数据分析的基础知识和常用库介绍...',
            views: 289,
            comments: 15,
            likes: 42,
            categoryName: '后端开发',
            categoryId: 'backend',
        },
    ]);

    const [mockCategories] = useState([
        { id: 'all', name: '全部' },
        { id: 'frontend', name: '前端开发' },
        { id: 'backend', name: '后端开发' },
        { id: 'mobile', name: '移动开发' },
        { id: 'ai', name: '人工智能' },
    ]);

    // 组件加载时执行
    useEffect(() => {
        // 获取分类
        try {
            (dispatch as any)(postActions.fetchCategories());
        } catch (err: any) {
            console.error('获取分类失败:', err);
        }

        // 获取帖子
        try {
            (dispatch as any)(postActions.fetchPosts());
        } catch (err: any) {
            console.error('获取帖子失败:', err);
        }
    }, [dispatch]);

    // 切换分类
    const handleCategoryChange = (categoryId: string): void => {
        setSelectedCategory(categoryId);
        (dispatch as any)(postActions.fetchPosts(categoryId));
    };

    // 搜索帖子
    const handleSearch = (): void => {
        if (searchQuery.trim()) {
            // 在实际应用中，这里会调用搜索API
            Taro.showToast({
                title: `搜索: ${searchQuery}`,
                icon: 'none',
            });
        }
    };

    // 查看帖子详情
    const handlePostDetail = (postId: string): void => {
        Taro.navigateTo({
            url: `/pages/post/Detail?id=${postId}`,
        });
    };

    // 发布新帖
    const handlePublishPost = (): void => {
        Taro.navigateTo({
            url: '/pages/post/Publish',
        });
    };

    // 渲染帖子项
    const renderPostItem = ({ item }: { item: ExtendedPost }): JSX.Element => (
        <View className="post-item" onClick={() => handlePostDetail(item.id)}>
            <View className="post-header">
                <Image
                    className="avatar"
                    src={item.userAvatar || 'https://img.icons8.com/bubbles/200/user.png'}
                    mode="aspectFill"
                />
                <View className="user-info">
                    <Text className="username">{item.userName}</Text>
                    <Text className="post-time">{formatDate(item.createdAt)}</Text>
                </View>
            </View>
            <View className="post-content">
                <Text className="post-title">{item.title}</Text>
                <Text className="post-excerpt">{item.excerpt}</Text>
            </View>
            {item.coverImage && <Image className="post-image" src={item.coverImage} mode="aspectFill" />}
            <View className="post-footer">
                <View className="post-stats">
                    <View className="stat-item">
                        <AtIcon className="stat-icon" value="eye" size={16} />
                        <Text className="stat-text">{item.views}</Text>
                    </View>
                    <View className="stat-item">
                        <AtIcon className="stat-icon" value="message" size={16} />
                        <Text className="stat-text">{item.comments}</Text>
                    </View>
                    <View className="stat-item">
                        <AtIcon className="stat-icon" value="heart" size={16} />
                        <Text className="stat-text">{item.likes}</Text>
                    </View>
                </View>
                <AtTag size="small" className="category-tag">
                    {item.categoryName}
                </AtTag>
            </View>
        </View>
    );

    // 过滤帖子 - 使用Redux数据或模拟数据
    const displayPosts = posts.length > 0 ? posts : mockPosts;
    const displayCategories = categories.length > 0 ? categories : mockCategories;
    const filteredPosts =
        selectedCategory === 'all' ? displayPosts : displayPosts.filter((post) => post.categoryId === selectedCategory);

    // 格式化日期
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diff / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diff / (1000 * 60));

        if (diffDays > 0) {
            return `${diffDays}天前`;
        } else if (diffHours > 0) {
            return `${diffHours}小时前`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes}分钟前`;
        } else {
            return '刚刚';
        }
    };

    return (
        <View className="club-container">
            {/* 搜索栏 */}
            <View className="search-container">
                <AtInput
                    className="search-input"
                    name="search"
                    placeholder="搜索话题或帖子"
                    value={searchQuery}
                    onChange={(value: string | number) => setSearchQuery(String(value))}
                    onConfirm={handleSearch}
                />
                <AtButton className="search-button" type="primary" size="small" onClick={handleSearch}>
                    搜索
                </AtButton>
            </View>

            {/* 分类导航 */}
            <ScrollView className="category-scroll" scrollX>
                <View className="category-container">
                    {displayCategories.map((category) => (
                        <View
                            key={category.id}
                            className={`category-item ${selectedCategory === category.id ? 'selected' : ''}`}
                            onClick={() => handleCategoryChange(category.id)}
                        >
                            <Text className="category-text">{category.name}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View>
                {/* 帖子列表 */}
                <ScrollView className="posts-container">
                    {loading && posts.length === 0 ? (
                        <View className="loading-container">
                            <Text className="loading-text">加载中...</Text>
                        </View>
                    ) : error ? (
                        <View className="error-container">
                            <Text className="error-text">{error}</Text>
                            <AtButton
                                type="primary"
                                onClick={() => (dispatch as any)(postActions.fetchPosts(selectedCategory))}
                            >
                                重试
                            </AtButton>
                        </View>
                    ) : (
                        <View>
                            {filteredPosts.map((item) => renderPostItem({ item }))}
                            {loading && (
                                <View className="footer-loading">
                                    <Text>加载更多...</Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* 发布按钮 */}
                <View className="publish-button-container">
                    <AtButton className="publish-button" type="primary" size="normal" onClick={handlePublishPost}>
                        发布新帖
                    </AtButton>
                </View>
            </View>
        </View>
    );
};

export default Club;
