import { createAction } from 'redux-actions';
import { Post, Comment, PostQueryParams } from './types';

// Action Types
export const FETCH_POSTS_REQUEST = 'FETCH_POSTS_REQUEST';
export const FETCH_POSTS_SUCCESS = 'FETCH_POSTS_SUCCESS';
export const FETCH_POSTS_FAILURE = 'FETCH_POSTS_FAILURE';

export const FETCH_POST_DETAIL_REQUEST = 'FETCH_POST_DETAIL_REQUEST';
export const FETCH_POST_DETAIL_SUCCESS = 'FETCH_POST_DETAIL_SUCCESS';
export const FETCH_POST_DETAIL_FAILURE = 'FETCH_POST_DETAIL_FAILURE';

export const PUBLISH_POST_REQUEST = 'PUBLISH_POST_REQUEST';
export const PUBLISH_POST_SUCCESS = 'PUBLISH_POST_SUCCESS';
export const PUBLISH_POST_FAILURE = 'PUBLISH_POST_FAILURE';

export const LIKE_POST_REQUEST = 'LIKE_POST_REQUEST';
export const LIKE_POST_SUCCESS = 'LIKE_POST_SUCCESS';
export const LIKE_POST_FAILURE = 'LIKE_POST_FAILURE';

export const FAVORITE_POST_REQUEST = 'FAVORITE_POST_REQUEST';
export const FAVORITE_POST_SUCCESS = 'FAVORITE_POST_SUCCESS';
export const FAVORITE_POST_FAILURE = 'FAVORITE_POST_FAILURE';

export const ADD_COMMENT_REQUEST = 'ADD_COMMENT_REQUEST';
export const ADD_COMMENT_SUCCESS = 'ADD_COMMENT_SUCCESS';
export const ADD_COMMENT_FAILURE = 'ADD_COMMENT_FAILURE';

// Action Creators
// 获取帖子列表
export const fetchPostsRequest = createAction<PostQueryParams>(FETCH_POSTS_REQUEST);
export const fetchPostsSuccess = createAction<{ posts: Post[]; total: number }>(FETCH_POSTS_SUCCESS);
export const fetchPostsFailure = createAction<string>(FETCH_POSTS_FAILURE);

// 获取帖子详情
export const fetchPostDetailRequest = createAction<string>(FETCH_POST_DETAIL_REQUEST);
export const fetchPostDetailSuccess = createAction<Post>(FETCH_POST_DETAIL_SUCCESS);
export const fetchPostDetailFailure = createAction<string>(FETCH_POST_DETAIL_FAILURE);

// 发布帖子
interface PublishPostParams {
    title: string;
    content: string;
    category: string;
    tags: string[];
}
export const publishPostRequest = createAction<PublishPostParams>(PUBLISH_POST_REQUEST);
export const publishPostSuccess = createAction<Post>(PUBLISH_POST_SUCCESS);
export const publishPostFailure = createAction<string>(PUBLISH_POST_FAILURE);

// 点赞帖子
interface LikePostParams {
    postId: string;
    isLiked: boolean;
}
export const likePostRequest = createAction<LikePostParams>(LIKE_POST_REQUEST);
export const likePostSuccess = createAction<{ postId: string; isLiked: boolean; likeCount: number }>(LIKE_POST_SUCCESS);
export const likePostFailure = createAction<string>(LIKE_POST_FAILURE);

// 收藏帖子
interface FavoritePostParams {
    postId: string;
    isFavorited: boolean;
}
export const favoritePostRequest = createAction<FavoritePostParams>(FAVORITE_POST_REQUEST);
export const favoritePostSuccess = createAction<{ postId: string; isFavorited: boolean; favoriteCount: number }>(
    FAVORITE_POST_SUCCESS,
);
export const favoritePostFailure = createAction<string>(FAVORITE_POST_FAILURE);

// 添加评论
interface AddCommentParams {
    postId: string;
    content: string;
}
export const addCommentRequest = createAction<AddCommentParams>(ADD_COMMENT_REQUEST);
export const addCommentSuccess = createAction<Comment>(ADD_COMMENT_SUCCESS);
export const addCommentFailure = createAction<string>(ADD_COMMENT_FAILURE);

// 导出所有action
export const postActions = {
    fetchPostsRequest,
    fetchPostsSuccess,
    fetchPostsFailure,
    fetchPostDetailRequest,
    fetchPostDetailSuccess,
    fetchPostDetailFailure,
    publishPostRequest,
    publishPostSuccess,
    publishPostFailure,
    likePostRequest,
    likePostSuccess,
    likePostFailure,
    favoritePostRequest,
    favoritePostSuccess,
    favoritePostFailure,
    addCommentRequest,
    addCommentSuccess,
    addCommentFailure,
};
