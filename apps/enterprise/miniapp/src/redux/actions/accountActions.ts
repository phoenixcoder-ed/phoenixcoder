import createActions from '@/utils/actionHelper';
import { Action } from 'redux-actions';
import { UserInfo } from '@/redux/store/account/types';

interface AccountActions {
    saveUserInfo: (_userInfo: UserInfo) => Action<UserInfo>;
    loginWithEmailSaga: (_username: string, _password: string) => Action<any>;
    loginWithPhoneSaga: (_phone: string, _code: string) => Action<any>;
    sendPhoneCodeSaga: (_phone: string) => Action<any>;
    registerWithEmailSaga: (_email: string, _password: string, _userType: string) => Action<any>;
    registerWithPhoneSaga: (_phone: string, _code: string, _password: string, _userType: string) => Action<any>;
    logout: () => Action<void>;
}

export default createActions({
    saveUserInfo: (_userInfo: UserInfo) => ({ userInfo: _userInfo }),
    loginWithEmailSaga: (_username: string, _password: string) => ({
        username: _username,
        password: _password,
    }),
    loginWithPhoneSaga: (_phone: string, _code: string) => ({
        phone: _phone,
        code: _code,
    }),
    sendPhoneCodeSaga: (_phone: string) => ({
        phone: _phone,
    }),
    registerWithEmailSaga: (_email: string, _password: string, _userType: string) => ({
        email: _email,
        password: _password,
        userType: _userType,
    }),
    registerWithPhoneSaga: (_phone: string, _code: string, _password: string, _userType: string) => ({
        phone: _phone,
        code: _code,
        password: _password,
        userType: _userType,
    }),
    logout: () => ({}),
}) as AccountActions;
