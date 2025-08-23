import React, { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { View, Text, ScrollView, Image, Input, Button } from '@tarojs/components';
import { useDispatch, useSelector } from 'react-redux';
import * as postActions from '@/redux/actions/postActions';
import { RootState } from '@/redux/store';
import { Comment } from '@/redux/store/post/types';
import './Detail.scss';

// 定义组件props类型
interface Props {}

const PostDetail: React.FC<Props> = () => {
    const router = useRouter();
    const { postId } = router.params;
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [commenting, setCommenting] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [likeCount, setLikeCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);

    const { postDetail, comments, error } = useSelector((state: RootState) => state.postReducers);

    useEffect(() => {
        fetchPostDetail();
    }, [postId]);

    useEffect(() => {
        if (postDetail) {
            setLikeCount(postDetail.likeCount);
            setIsLiked(!!postDetail.isLiked);
            setFavoriteCount(postDetail.favoriteCount || 0);
            setIsFavorited(!!postDetail.isFavorited);
        }
    }, [postDetail]);

    const fetchPostDetail = async () => {
        setLoading(true);
        try {
            await dispatch(postActions.fetchPostDetailRequest({ postId }));
        } catch (err) {
            console.error('获取帖子详情失败:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        try {
            await dispatch(postActions.likePostRequest({ postId }));
            if (isLiked) {
                setLikeCount(likeCount - 1);
            } else {
                setLikeCount(likeCount + 1);
            }
            setIsLiked(!isLiked);
        } catch (err) {
            console.error('点赞失败:', err);
        }
    };

    const handleFavorite = async () => {
        try {
            await dispatch(postActions.favoritePostRequest({ postId }));
            setIsFavorited(!isFavorited);
        } catch (err) {
            console.error('收藏失败:', err);
        }
    };

    const handleSubmitComment = async () => {
        if (!commentContent.trim()) return;

        setCommenting(true);
        try {
            await dispatch(
                postActions.commentPostRequest({
                    postId,
                    content: commentContent,
                }),
            );
            setCommentContent('');
            // 重新获取评论列表
            await dispatch(postActions.fetchPostDetailRequest({ postId }));
        } catch (err) {
            console.error('评论失败:', err);
        } finally {
            setCommenting(false);
        }
    };

    const renderPostContent = () => {
        if (!postDetail) return null;

        return (
            <ScrollView className="content-container">
                <View className="header-container">
                    <Image src={postDetail.avatar || 'https://via.placeholder.com/40'} className="avatar" />
                    <View className="user-info">
                        <Text className="username">{postDetail.authorName}</Text>
                        <Text className="post-time">{formatDate(postDetail.createdAt)}</Text>
                    </View>
                </View>

                <Text className="post-title">{postDetail.title}</Text>

                <View className="post-tags">
                    {postDetail.tags.map((tag, index) => (
                        <Text key={index} className="tag">
                            {tag}
                        </Text>
                    ))}
                </View>

                <View className="post-content">
                    <Text className="content-text">{postDetail.content}</Text>
                </View>

                <View className="action-bar">
                    <View className="action-button" onClick={handleLike}>
                        <Text className={`action-text ${isLiked ? 'liked-text' : ''}`}>❤️ {likeCount}</Text>
                    </View>

                    <View className="action-button">
                        <Text className="action-text">💬 {postDetail.commentCount}</Text>
                    </View>

                    <View className="action-button" onClick={handleFavorite}>
                        <Text className="action-text">
                            {isFavorited ? '⭐' : '☆'} {favoriteCount}
                        </Text>
                    </View>

                    <View className="action-button">
                        <Text className="action-text">📤 分享</Text>
                    </View>
                </View>

                <View className="comments-section">
                    <Text className="comments-title">评论 ({postDetail.commentCount})</Text>

                    <View className="comment-input-container">
                        <Input
                            className="comment-input"
                            placeholder="写下你的评论..."
                            value={commentContent}
                            onInput={(e) => setCommentContent(e.detail.value)}
                        />
                        <Button className="submit-comment-button" onClick={handleSubmitComment} disabled={commenting}>
                            发送
                        </Button>
                    </View>

                    {comments && comments.length > 0 ? (
                        <View className="comments-list">{comments.map((item) => renderCommentItem({ item }))}</View>
                    ) : (
                        <Text className="no-comments-text">暂无评论</Text>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderCommentItem = ({ item }: { item: Comment }) => (
        <View className="comment-item" key={item.id}>
            <Image src={item.avatar || 'https://via.placeholder.com/32'} className="comment-avatar" />
            <View className="comment-content">
                <View className="comment-header">
                    <Text className="comment-username">{item.authorName}</Text>
                    <Text className="comment-time">{formatDate(item.createdAt)}</Text>
                </View>
                <Text className="comment-text">{item.content}</Text>
            </View>
        </View>
    );

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

    return (
        <View className="container">
            {loading ? (
                <View className="loading-container">
                    <Text className="loading-text">加载中...</Text>
                </View>
            ) : error ? (
                <View className="error-container">
                    <Text className="error-text">{error}</Text>
                    <Button className="retry-button" onClick={fetchPostDetail}>
                        重试
                    </Button>
                </View>
            ) : (
                renderPostContent()
            )}
        </View>
    );
};

// Redux连接
const mapStateToProps = (state: RootState) => ({
    post: state.postReducers,
});

const mapDispatchToProps = (dispatch: any) => ({
    postActions: bindActionCreators(postActions, dispatch),
});

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(PostDetail);

// 样式已移至 CSS 文件中
