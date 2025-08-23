import Immutable, { ImmutableObject } from 'seamless-immutable';
import { postActions } from '@/redux/actions';
import { IAction } from '@/typed/types';
import createReducers from '@/utils/reducerHelper';

// 定义PostState接口
export interface PostState {
    posts: any[];
    currentPost: any | null;
    comments: any[];
    likedPosts: string[];
    favoritePosts: string[];
    loading: boolean;
    error: string | null;
}

// 扩展PostState接口，添加merge方法
declare module '@/redux/store/post/types' {
    export interface PostState {
        merge: (_changes: any) => ImmutableObject<PostState>;
        posts: any[];
        currentPost: any | null;
        comments: any[];
        likedPosts: string[];
        favoritePosts: string[];
        loading: boolean;
        error: string | null;
    }
}

// 初始状态
const initState: ImmutableObject<PostState> = Immutable.from({
    posts: [],
    currentPost: null,
    comments: [],
    likedPosts: [],
    favoritePosts: [],
    loading: false,
    error: null,
});

export default createReducers((on) => {
    // 获取帖子列表
    on(postActions.fetchPostsRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 获取帖子列表成功
    on(postActions.fetchPostsSuccess, (state: typeof initState, action: IAction) => {
        const { posts } = action.payload;
        return state.merge({
            posts,
            loading: false,
        });
    });

    // 获取帖子列表失败
    on(postActions.fetchPostsFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });

    // 获取帖子详情
    on(postActions.fetchPostDetailRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 获取帖子详情成功
    on(postActions.fetchPostDetailSuccess, (state: typeof initState, action: IAction) => {
        const { post, comments } = action.payload;
        return state.merge({
            currentPost: post,
            comments: comments || [],
            loading: false,
        });
    });

    // 获取帖子详情失败
    on(postActions.fetchPostDetailFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });

    // 发布帖子
    on(postActions.publishPostRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 发布帖子成功
    on(postActions.publishPostSuccess, (state: typeof initState, action: IAction) => {
        const { post } = action.payload;
        // 将新发布的帖子添加到列表顶部
        const posts = [post, ...state.posts];
        return state.merge({
            posts,
            currentPost: post,
            loading: false,
        });
    });

    // 发布帖子失败
    on(postActions.publishPostFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });

    // 评论帖子
    on(postActions.commentPostRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 评论帖子成功
    on(postActions.commentPostSuccess, (state: typeof initState, action: IAction) => {
        const { comment } = action.payload;
        // 将新评论添加到列表
        const comments = [...state.comments, comment];
        // 更新当前帖子的评论数
        let currentPost = state.currentPost;
        if (currentPost && currentPost.id === comment.postId) {
            currentPost = {
                ...currentPost,
                commentCount: (currentPost.commentCount || 0) + 1,
            };
        }
        return state.merge({
            comments,
            currentPost,
            loading: false,
        });
    });

    // 评论帖子失败
    on(postActions.commentPostFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });

    // 点赞帖子
    on(postActions.likePostRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 点赞帖子成功
    on(postActions.likePostSuccess, (state: typeof initState, action: IAction) => {
        const { postId } = action.payload;
        // 更新点赞列表
        let likedPosts = [...state.likedPosts];
        if (!likedPosts.includes(postId)) {
            likedPosts.push(postId);
        }
        // 更新当前帖子的点赞数
        let currentPost = state.currentPost;
        if (currentPost && currentPost.id === postId) {
            currentPost = {
                ...currentPost,
                likeCount: (currentPost.likeCount || 0) + 1,
            };
        }
        return state.merge({
            likedPosts,
            currentPost,
            loading: false,
        });
    });

    // 点赞帖子失败
    on(postActions.likePostFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });

    // 收藏帖子
    on(postActions.favoritePostRequest, (state: typeof initState) => {
        return state.merge({
            loading: true,
            error: null,
        });
    });

    // 收藏帖子成功
    on(postActions.favoritePostSuccess, (state: typeof initState, action: IAction) => {
        const { postId } = action.payload;
        // 更新收藏列表
        let favoritePosts = [...state.favoritePosts];
        if (!favoritePosts.includes(postId)) {
            favoritePosts.push(postId);
        }
        return state.merge({
            favoritePosts,
            loading: false,
        });
    });

    // 收藏帖子失败
    on(postActions.favoritePostFailure, (state: typeof initState, action: IAction) => {
        const { error: _error } = action.payload;
        return state.merge({
            error: _error,
            loading: false,
        });
    });
}, initState);
