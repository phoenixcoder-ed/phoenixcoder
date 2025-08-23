import { createAction } from 'redux-actions';
import { UserInfo, WeChat } from './types';

// Action Types
export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';

export const LOGOUT_REQUEST = 'LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';
export const LOGOUT_FAILURE = 'LOGOUT_FAILURE';

export const UPDATE_USER_INFO_REQUEST = 'UPDATE_USER_INFO_REQUEST';
export const UPDATE_USER_INFO_SUCCESS = 'UPDATE_USER_INFO_SUCCESS';
export const UPDATE_USER_INFO_FAILURE = 'UPDATE_USER_INFO_FAILURE';

export const GET_WECHAT_INFO_REQUEST = 'GET_WECHAT_INFO_REQUEST';
export const GET_WECHAT_INFO_SUCCESS = 'GET_WECHAT_INFO_SUCCESS';
export const GET_WECHAT_INFO_FAILURE = 'GET_WECHAT_INFO_FAILURE';

// Action Creators
// 登录
export const loginRequest = createAction<{ email: string; password: string }>(LOGIN_REQUEST);
export const loginSuccess = createAction<{ token: string; userInfo: UserInfo }>(LOGIN_SUCCESS);
export const loginFailure = createAction<string>(LOGIN_FAILURE);

// 登出
export const logoutRequest = createAction<void>(LOGOUT_REQUEST);
export const logoutSuccess = createAction<void>(LOGOUT_SUCCESS);
export const logoutFailure = createAction<string>(LOGOUT_FAILURE);

// 更新用户信息
export const updateUserInfoRequest = createAction<Partial<UserInfo>>(UPDATE_USER_INFO_REQUEST);
export const updateUserInfoSuccess = createAction<UserInfo>(UPDATE_USER_INFO_SUCCESS);
export const updateUserInfoFailure = createAction<string>(UPDATE_USER_INFO_FAILURE);

// 获取微信信息
export const getWeChatInfoRequest = createAction<void>(GET_WECHAT_INFO_REQUEST);
export const getWeChatInfoSuccess = createAction<WeChat>(GET_WECHAT_INFO_SUCCESS);
export const getWeChatInfoFailure = createAction<string>(GET_WECHAT_INFO_FAILURE);

// 导出所有action
export const accountActions = {
    loginRequest,
    loginSuccess,
    loginFailure,
    logoutRequest,
    logoutSuccess,
    logoutFailure,
    updateUserInfoRequest,
    updateUserInfoSuccess,
    updateUserInfoFailure,
    getWeChatInfoRequest,
    getWeChatInfoSuccess,
    getWeChatInfoFailure,
};
