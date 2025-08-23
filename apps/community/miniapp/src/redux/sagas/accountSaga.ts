// 声明模块以解决类型问题
declare module 'redux-saga/effects' {}
declare module 'axios' {
    export interface AxiosResponse<T = any> {
        data: T;
    }
}

declare module '@/utils/httpUtil' {
    export namespace HttpUtil {
        export function verifyUserLoginWithEmail(_username: string, _password: string): Promise<AxiosResponse<any>>;
        export function sendPhoneVerificationCode(_phone: string): Promise<AxiosResponse<any>>;
        export function verifyUserLoginWithPhone(_phone: string, _code: string): Promise<AxiosResponse<any>>;
        export function registerWithEmail(
            _username: string,
            _email: string,
            _password: string,
        ): Promise<AxiosResponse<any>>;
        export function registerWithPhone(
            _phone: string,
            _code: string,
            _password: string,
        ): Promise<AxiosResponse<any>>;
        export function logout(): Promise<AxiosResponse<any>>;
    }
}

declare module '@/redux/actions' {
    export const accountActions: {
        loginWithEmailSaga: any;
        sendPhoneCodeSaga: any;
        loginWithPhoneSaga: any;
        saveUserInfo: (_data: any) => any;
    };
}

declare module '@/redux/store/account/types' {
    export interface UserInfo {}
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

import { call, put, takeLatest } from 'redux-saga/effects';
import { AxiosResponse } from 'axios';
import { accountActions } from '@/redux/actions';
import { HttpUtil } from '@/utils/httpUtil';
import { UserInfo } from '@/redux/store/account/types';
import { ActionWithDeferred, IAction } from '../../typed/types';

export function* loginWithEmailSaga() {
    return yield takeLatest(
        accountActions.loginWithEmailSaga,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { username, password } = payload;
                const { data }: AxiosResponse<UserInfo> = yield call(
                    HttpUtil.verifyUserLoginWithEmail,
                    username,
                    password,
                );
                yield put(accountActions.saveUserInfo(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 发送手机验证码Saga
 */
export function* sendPhoneCodeSaga() {
    return yield takeLatest(
        accountActions.sendPhoneCodeSaga,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { phone } = payload;
                yield call(HttpUtil.sendPhoneVerificationCode, phone);
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 手机验证码登录Saga
 */
export function* loginWithPhoneSaga() {
    return yield takeLatest(
        accountActions.loginWithPhoneSaga,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { phone, code } = payload;
                const { data }: AxiosResponse<UserInfo> = yield call(HttpUtil.verifyUserLoginWithPhone, phone, code);
                yield put(accountActions.saveUserInfo(data));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 邮箱注册Saga
 */
export function* registerWithEmailSaga() {
    return yield takeLatest(
        accountActions.registerWithEmailSaga,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { email, password, userType } = payload;
                yield call(HttpUtil.registerWithEmail, email, password, userType);
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 手机注册Saga
 */
export function* registerWithPhoneSaga() {
    return yield takeLatest(
        accountActions.registerWithPhoneSaga,
        function* ({ payload, deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                const { phone, code, password, userType } = payload;
                yield call(HttpUtil.registerWithPhone, phone, code, password, userType);
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield call(deferred.reject);
            }
        },
    );
}

/**
 * 退出登录Saga
 */
export function* logoutSaga() {
    return yield takeLatest(
        accountActions.logout,
        function* ({ deferred }: ActionWithDeferred): IterableIterator<IAction> {
            try {
                yield call(HttpUtil.logout);
                // 清除用户信息
                yield put(accountActions.saveUserInfo({}));
                yield call(deferred.resolve);
            } catch (e) {
                console.log(e);
                yield call(deferred.reject);
            }
        },
    );
}
