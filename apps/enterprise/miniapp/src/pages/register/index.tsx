import React, { Component } from 'react';
import Taro, { Config } from '@tarojs/taro';
import { connect } from '@tarojs/redux';
import { bindActionCreators } from 'redux';
import { View, Text } from '@tarojs/components';
import { AtButton, AtInput, AtMessage, AtRadio } from 'taro-ui';
import { accountActions } from '@/redux/actions';
import { UserInfo } from '@/redux/store/account/types';
import './index.scss';

// 定义组件props类型
interface RegisterProps {
    registerWithEmailSaga: (_email: string, _password: string, _userType: string) => Promise<any>;
    registerWithPhoneSaga: (_phone: string, _code: string, _password: string, _userType: string) => Promise<any>;
    sendPhoneCodeSaga: (_phone: string) => Promise<any>;
    userInfo: UserInfo | null;
}

import type { RootState } from '@/redux/store';
import type { Dispatch } from 'redux';

const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
        registerWithEmailSaga: bindActionCreators(accountActions.registerWithEmailSaga, dispatch),
        registerWithPhoneSaga: bindActionCreators(accountActions.registerWithPhoneSaga, dispatch),
        sendPhoneCodeSaga: bindActionCreators(accountActions.sendPhoneCodeSaga, dispatch),
    };
};

const mapStateToProps = (state: RootState) => {
    return {
        userInfo: state.accountReducers.userInfo,
    };
};

// 定义state接口
interface RegisterState {
    phone: string;
    code: string;
    countdown: number;
    isPhoneRegister: boolean;
    email: string;
    password: string;
    confirmPassword: string;
    userType: 'programmer' | 'merchant' | 'contributor';
}

class Register extends Component<RegisterProps> {
    config: Config = {
        navigationBarTitleText: '账号注册',
    };

    state: RegisterState = {
        phone: '',
        code: '',
        countdown: 0,
        isPhoneRegister: true,
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'programmer',
    };

    // 发送手机验证码
    handleSendCode = (): void => {
        const { phone } = this.state;
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            AtMessage({
                type: 'error',
                message: '请输入正确的手机号码',
            });
            return;
        }

        const { sendPhoneCodeSaga } = this.props;
        sendPhoneCodeSaga(phone)
            .then(() => {
                AtMessage({
                    type: 'success',
                    message: '验证码发送成功',
                });
                // 开始倒计时
                this.setState({ countdown: 60 });
                const timer = setInterval(() => {
                    this.setState((prev) => {
                        if (prev.countdown <= 1) {
                            clearInterval(timer);
                            return { countdown: 0 };
                        }
                        return { countdown: prev.countdown - 1 };
                    });
                }, 1000);
            })
            .catch(() => {
                AtMessage({
                    type: 'error',
                    message: '验证码发送失败，请重试',
                });
            });
    };

    // 手机注册
    handlePhoneRegister = (): void => {
        const { phone, code, password, confirmPassword, userType } = this.state;
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            AtMessage({ type: 'error', message: '请输入正确的手机号码' });
            return;
        }
        if (!/^\d{6}$/.test(code)) {
            AtMessage({ type: 'error', message: '请输入6位数字验证码' });
            return;
        }
        if (!password || password.length < 6) {
            AtMessage({ type: 'error', message: '密码长度不能少于6位' });
            return;
        }
        if (password !== confirmPassword) {
            AtMessage({ type: 'error', message: '两次输入的密码不一致' });
            return;
        }

        const { registerWithPhoneSaga } = this.props;
        registerWithPhoneSaga(phone, code, password, userType)
            .then(() => {
                AtMessage({
                    type: 'success',
                    message: '注册成功',
                });
                // 注册成功后跳转到登录页面
                setTimeout(() => {
                    Taro.navigateTo({
                        url: '/pages/login/index',
                    });
                }, 1500);
            })
            .catch((error) => {
                AtMessage({
                    type: 'error',
                    message: error.message || '注册失败，请重试',
                });
            });
    };

    // 邮箱注册
    handleEmailRegister = (): void => {
        const { email, password, confirmPassword, userType } = this.state;
        if (!/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(email)) {
            AtMessage({ type: 'error', message: '请输入正确的邮箱地址' });
            return;
        }
        if (!password || password.length < 6) {
            AtMessage({ type: 'error', message: '密码长度不能少于6位' });
            return;
        }
        if (password !== confirmPassword) {
            AtMessage({ type: 'error', message: '两次输入的密码不一致' });
            return;
        }

        const { registerWithEmailSaga } = this.props;
        registerWithEmailSaga(email, password, userType)
            .then(() => {
                AtMessage({
                    type: 'success',
                    message: '注册成功，请登录',
                });
                // 注册成功后跳转到登录页面
                setTimeout(() => {
                    Taro.navigateTo({
                        url: '/pages/login/index',
                    });
                }, 1500);
            })
            .catch((error) => {
                AtMessage({
                    type: 'error',
                    message: error.message || '注册失败，请重试',
                });
            });
    };

    render() {
        const { isPhoneRegister, phone, code, countdown, email, password, confirmPassword, userType } = this.state;

        return (
            <View className="register-container">
                <View className="register-form">
                    <View className="register-tabs">
                        <View
                            className={`tab-item ${isPhoneRegister ? 'active' : ''}`}
                            onClick={() => this.setState({ isPhoneRegister: true })}
                        >
                            手机注册
                        </View>
                        <View
                            className={`tab-item ${!isPhoneRegister ? 'active' : ''}`}
                            onClick={() => this.setState({ isPhoneRegister: false })}
                        >
                            邮箱注册
                        </View>
                    </View>

                    {isPhoneRegister ? (
                        <View className="form-content">
                            <AtInput
                                type="number"
                                placeholder="请输入手机号码"
                                value={phone}
                                onChange={(value) => this.setState({ phone: value })}
                            />
                            <View className="code-input-container">
                                <AtInput
                                    type="number"
                                    placeholder="请输入验证码"
                                    value={code}
                                    onChange={(value) => this.setState({ code: value })}
                                    className="code-input"
                                />
                                <AtButton
                                    size="small"
                                    className="send-code-btn"
                                    disabled={countdown > 0}
                                    onClick={this.handleSendCode}
                                >
                                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                                </AtButton>
                            </View>
                        </View>
                    ) : (
                        <View className="form-content">
                            <AtInput
                                type="text"
                                placeholder="请输入邮箱地址"
                                value={email}
                                onChange={(value) => this.setState({ email: value })}
                            />
                        </View>
                    )}

                    <AtInput
                        type="password"
                        placeholder="请设置密码"
                        value={password}
                        onChange={(value) => this.setState({ password: value })}
                    />
                    <AtInput
                        type="password"
                        placeholder="请确认密码"
                        value={confirmPassword}
                        onChange={(value) => this.setState({ confirmPassword: value })}
                    />

                    <View className="user-type-selector">
                        <Text className="selector-title">用户类型:</Text>
                        <View className="radio-group">
                            <AtRadio
                                options={[
                                    { label: '程序员', value: 'programmer' },
                                    { label: '商家', value: 'merchant' },
                                    { label: '共建者', value: 'contributor' },
                                ]}
                                value={userType}
                                onClick={(value) => this.setState({ userType: value })}
                            />
                        </View>
                    </View>

                    <AtButton
                        type="primary"
                        className="register-btn"
                        onClick={isPhoneRegister ? this.handlePhoneRegister : this.handleEmailRegister}
                    >
                        立即注册
                    </AtButton>
                </View>

                <View className="login-link">
                    已有账号？
                    <Text
                        className="link"
                        onClick={() => {
                            Taro.navigateTo({
                                url: '/pages/login/index',
                            });
                        }}
                    >
                        立即登录
                    </Text>
                </View>
            </View>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Register);
