// postActions.ts
import { createAction } from 'redux-actions';
import Taro from '@tarojs/taro';

// 定义action类型
export const FETCH_CATEGORIES_REQUEST = 'FETCH_CATEGORIES_REQUEST';
export const FETCH_CATEGORIES_SUCCESS = 'FETCH_CATEGORIES_SUCCESS';
export const FETCH_CATEGORIES_FAILURE = 'FETCH_CATEGORIES_FAILURE';

export const FETCH_POSTS_REQUEST = 'FETCH_POSTS_REQUEST';
export const FETCH_POSTS_SUCCESS = 'FETCH_POSTS_SUCCESS';
export const FETCH_POSTS_FAILURE = 'FETCH_POSTS_FAILURE';

export const FETCH_POST_DETAIL_REQUEST = 'FETCH_POST_DETAIL_REQUEST';
export const FETCH_POST_DETAIL_SUCCESS = 'FETCH_POST_DETAIL_SUCCESS';
export const FETCH_POST_DETAIL_FAILURE = 'FETCH_POST_DETAIL_FAILURE';

export const PUBLISH_POST_REQUEST = 'PUBLISH_POST_REQUEST';
export const PUBLISH_POST_SUCCESS = 'PUBLISH_POST_SUCCESS';
export const PUBLISH_POST_FAILURE = 'PUBLISH_POST_FAILURE';

export const COMMENT_POST_REQUEST = 'COMMENT_POST_REQUEST';
export const COMMENT_POST_SUCCESS = 'COMMENT_POST_SUCCESS';
export const COMMENT_POST_FAILURE = 'COMMENT_POST_FAILURE';

export const LIKE_POST_REQUEST = 'LIKE_POST_REQUEST';
export const LIKE_POST_SUCCESS = 'LIKE_POST_SUCCESS';
export const LIKE_POST_FAILURE = 'LIKE_POST_FAILURE';

export const FAVORITE_POST_REQUEST = 'FAVORITE_POST_REQUEST';
export const FAVORITE_POST_SUCCESS = 'FAVORITE_POST_SUCCESS';
export const FAVORITE_POST_FAILURE = 'FAVORITE_POST_FAILURE';

// 创建action creators
// 获取分类
export const fetchCategoriesRequest = createAction(FETCH_CATEGORIES_REQUEST);
export const fetchCategoriesSuccess = createAction(FETCH_CATEGORIES_SUCCESS);
export const fetchCategoriesFailure = createAction(FETCH_CATEGORIES_FAILURE);

// 获取帖子列表
export const fetchPostsRequest = createAction(FETCH_POSTS_REQUEST);
export const fetchPostsSuccess = createAction(FETCH_POSTS_SUCCESS);
export const fetchPostsFailure = createAction(FETCH_POSTS_FAILURE);

// 获取帖子详情
export const fetchPostDetailRequest = createAction(FETCH_POST_DETAIL_REQUEST);
export const fetchPostDetailSuccess = createAction(FETCH_POST_DETAIL_SUCCESS);
export const fetchPostDetailFailure = createAction(FETCH_POST_DETAIL_FAILURE);

// 发布帖子
export const publishPostRequest = createAction(PUBLISH_POST_REQUEST);
export const publishPostSuccess = createAction(PUBLISH_POST_SUCCESS);
export const publishPostFailure = createAction(PUBLISH_POST_FAILURE);

// 评论帖子
export const commentPostRequest = createAction(COMMENT_POST_REQUEST);
export const commentPostSuccess = createAction(COMMENT_POST_SUCCESS);
export const commentPostFailure = createAction(COMMENT_POST_FAILURE);

// 点赞帖子
export const likePostRequest = createAction(LIKE_POST_REQUEST);
export const likePostSuccess = createAction(LIKE_POST_SUCCESS);
export const likePostFailure = createAction(LIKE_POST_FAILURE);

// 收藏帖子
export const favoritePostRequest = createAction(FAVORITE_POST_REQUEST);
export const favoritePostSuccess = createAction(FAVORITE_POST_SUCCESS);
export const favoritePostFailure = createAction(FAVORITE_POST_FAILURE);

// 获取分类异步函数
export const fetchCategories = () => {
    return async (dispatch) => {
        dispatch(fetchCategoriesRequest());
        try {
            // 这里应该是API调用逻辑
            const { data } = await Taro.request({
                url: '/api/categories',
                method: 'GET',
            });
            dispatch(fetchCategoriesSuccess(data));
        } catch (error) {
            dispatch(fetchCategoriesFailure(error.message));
        }
    };
};

// 获取帖子列表异步函数
export const fetchPosts = (categoryId = 'all') => {
    return async (dispatch) => {
        dispatch(fetchPostsRequest());
        try {
            // 这里应该是API调用逻辑
            const url = categoryId === 'all' ? '/api/posts' : `/api/posts?category=${categoryId}`;
            const { data } = await Taro.request({
                url,
                method: 'GET',
            });
            dispatch(fetchPostsSuccess(data));
        } catch (error) {
            dispatch(fetchPostsFailure(error.message));
        }
    };
};

// 导出所有action creators
export default {
    fetchCategoriesRequest,
    fetchCategoriesSuccess,
    fetchCategoriesFailure,
    fetchPostsRequest,
    fetchPostsSuccess,
    fetchPostsFailure,
    fetchPostDetailRequest,
    fetchPostDetailSuccess,
    fetchPostDetailFailure,
    publishPostRequest,
    publishPostSuccess,
    publishPostFailure,
    commentPostRequest,
    commentPostSuccess,
    commentPostFailure,
    likePostRequest,
    likePostSuccess,
    likePostFailure,
    favoritePostRequest,
    favoritePostSuccess,
    favoritePostFailure,
};
