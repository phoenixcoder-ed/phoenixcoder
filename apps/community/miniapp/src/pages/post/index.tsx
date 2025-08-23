import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { AtActivityIndicator, AtButton, AtTabs, AtTabsPane, AtCard } from 'taro-ui';
import { useDispatch, useSelector } from 'react-redux';
import { postActions } from '@/redux/actions';
import type { AppState } from '@/redux/reducers';
import Taro from '@tarojs/taro';
import './index.scss';

const PostList: React.FC = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [current, setCurrent] = useState(0);

    const tabList = [
        { title: '全部' },
        { title: '技术讨论' },
        { title: '经验分享' },
        { title: '问题求助' },
        { title: '招聘信息' },
    ];

    const { posts, error } = useSelector((state: AppState) => state.postReducers);

    useEffect(() => {
        fetchPosts();
    }, [current]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const category = current === 0 ? undefined : tabList[current].title;
            dispatch(postActions.fetchPostsRequest({ category, page: 1, pageSize: 10 }));
        } catch (err) {
            console.error('获取帖子列表失败:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTabClick = (value: number) => {
        setCurrent(value);
    };

    const handlePostClick = (postId: string) => {
        Taro.navigateTo({
            url: `/pages/post-detail/index?id=${postId}`,
        });
    };

    const handlePublishPost = () => {
        Taro.navigateTo({
            url: '/pages/publish-post/index',
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes}分钟前`;
        } else if (hours < 24) {
            return `${hours}小时前`;
        } else if (days < 30) {
            return `${days}天前`;
        } else {
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        }
    };

    const renderPostItem = (post: any) => (
        <AtCard
            key={post.id}
            title={post.title}
            extra={formatDate(post.createdAt)}
            onClick={() => handlePostClick(post.id)}
        >
            <View className="post-content">
                <Text className="post-excerpt">{post.content?.substring(0, 100)}...</Text>
                <View className="post-meta">
                    <Text className="author">@{post.authorName}</Text>
                    <View className="stats">
                        <Text className="stat-item">{post.viewCount || 0} 阅读</Text>
                        <Text className="stat-item">{post.commentCount || 0} 评论</Text>
                        <Text className="stat-item">{post.likeCount || 0} 点赞</Text>
                    </View>
                </View>
            </View>
        </AtCard>
    );

    return (
        <View className="post-list-container">
            <AtTabs current={current} tabList={tabList} onClick={handleTabClick}>
                {tabList.map((tab, index) => (
                    <AtTabsPane key={index} current={current} index={index}>
                        <View className="tab-content">
                            {loading ? (
                                <View className="loading-container">
                                    <AtActivityIndicator mode="center" content="加载中..." />
                                </View>
                            ) : error ? (
                                <View className="error-container">
                                    <Text className="error-text">{error}</Text>
                                    <AtButton type="primary" size="small" onClick={fetchPosts}>
                                        重试
                                    </AtButton>
                                </View>
                            ) : (
                                <ScrollView scrollY className="post-scroll">
                                    {posts && posts.length > 0 ? (
                                        posts.map(renderPostItem)
                                    ) : (
                                        <View className="empty-container">
                                            <Text className="empty-text">暂无帖子</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            )}
                        </View>
                    </AtTabsPane>
                ))}
            </AtTabs>

            <View className="fab-container">
                <AtButton type="primary" circle size="small" onClick={handlePublishPost}>
                    +
                </AtButton>
            </View>
        </View>
    );
};

export default PostList;
