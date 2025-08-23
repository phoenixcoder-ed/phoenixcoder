// 声明模块以解决类型问题
declare module 'redux-saga/effects' {}
declare module 'axios' {
    export interface AxiosResponse<T = any> {
        data: T;
    }
}

declare module '@/utils/httpUtil' {
    export namespace HttpUtil {
        export function fetchPosts(_category?: string, _page?: number, _pageSize?: number): Promise<AxiosResponse<any>>;
        export function fetchPostDetail(_postId: string): Promise<AxiosResponse<any>>;
        export function publishPost(
            _title: string,
            _content: string,
            _category: string,
            _tags?: string[],
        ): Promise<AxiosResponse<any>>;
        export function commentPost(_postId: string, _content: string): Promise<AxiosResponse<any>>;
        export function likePost(_postId: string): Promise<AxiosResponse<any>>;
        export function favoritePost(_postId: string): Promise<AxiosResponse<any>>;
    }
}

declare module '@/redux/actions' {
    export const postActions: {
        fetchPostsRequest: any;
        fetchPostsSuccess: (_data: any) => any;
        fetchPostsFailure: (_error: string) => any;
        fetchPostDetailRequest: any;
        fetchPostDetailSuccess: (_data: any) => any;
        fetchPostDetailFailure: (_error: string) => any;
        publishPostRequest: any;
        publishPostSuccess: (_data: any) => any;
        publishPostFailure: (_error: string) => any;
        commentPostRequest: any;
        commentPostSuccess: (_data: any) => any;
        commentPostFailure: (_error: string) => any;
        likePostRequest: any;
        likePostSuccess: (_data: any) => any;
        likePostFailure: (_error: string) => any;
        favoritePostRequest: any;
        favoritePostSuccess: (_data: any) => any;
        favoritePostFailure: (_error: string) => any;
    };
}

declare module '../../typed/types' {
    export interface ActionWithDeferred {
        payload: any;
        deferred: {
            resolve: () => void;
            reject: () => void;
        };
    }
    export interface IAction {
        type: string;
        payload?: any;
    }
}

declare module '@/redux/store/post/types' {
    export interface Post {}
    export interface Comment {}
}

import { call, put, takeLatest } from 'redux-saga/effects';
import { AxiosResponse } from 'axios';
import { postActions } from '@/redux/actions';
import { HttpUtil } from '@/utils/httpUtil';
import { Post, Comment } from '@/redux/store/post/types';
import { ActionWithDeferred, IAction } from '../../typed/types';

/**
 * 获取帖子列表Saga
 */
export function* fetchPostsSaga() {
    return yield takeLatest(
        postActions.fetchPostsRequest,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { category, page = 1, pageSize = 10 } = payload || {};
                const { data }: AxiosResponse<{ list: Post[]; total: number }> = yield call(
                    HttpUtil.fetchPosts,
                    category,
                    page,
                    pageSize,
                );
                yield put(postActions.fetchPostsSuccess(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(postActions.fetchPostsFailure('获取帖子列表失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 获取帖子详情Saga
 */
export function* fetchPostDetailSaga() {
    return yield takeLatest(
        postActions.fetchPostDetailRequest,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { postId } = payload;
                const { data }: AxiosResponse<Post> = yield call(HttpUtil.fetchPostDetail, postId);
                yield put(postActions.fetchPostDetailSuccess(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(postActions.fetchPostDetailFailure('获取帖子详情失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 发布帖子Saga
 */
export function* publishPostSaga() {
    return yield takeLatest(
        postActions.publishPostRequest,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { title, content, category, tags } = payload;
                const { data }: AxiosResponse<Post> = yield call(HttpUtil.publishPost, title, content, category, tags);
                yield put(postActions.publishPostSuccess(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(postActions.publishPostFailure('发布帖子失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 评论帖子Saga
 */
export function* commentPostSaga() {
    return yield takeLatest(
        postActions.commentPostRequest,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { postId, content } = payload;
                const { data }: AxiosResponse<Comment> = yield call(HttpUtil.commentPost, postId, content);
                yield put(postActions.commentPostSuccess(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(postActions.commentPostFailure('评论帖子失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 点赞帖子Saga
 */
export function* likePostSaga() {
    return yield takeLatest(
        postActions.likePostRequest,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { postId } = payload;
                const { data }: AxiosResponse<any> = yield call(HttpUtil.likePost, postId);
                yield put(postActions.likePostSuccess(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(postActions.likePostFailure('点赞帖子失败'));
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 收藏帖子Saga
 */
export function* favoritePostSaga() {
    return yield takeLatest(
        postActions.favoritePostRequest,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { postId } = payload;
                const { data }: AxiosResponse<any> = yield call(HttpUtil.favoritePost, postId);
                yield put(postActions.favoritePostSuccess(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield put(postActions.favoritePostFailure('收藏帖子失败'));
                yield call(deferred.reject);
            }
        },
    );
}
