import React, { Component } from 'react';
import Taro from '@tarojs/taro';
import { connect } from '@tarojs/redux';
import { bindActionCreators } from 'redux';
import { View } from '@tarojs/components';
import { AtButton, AtInput, AtMessage } from 'taro-ui';
import { accountActions } from '@/redux/actions';
import { UserInfo } from '@/redux/store/account/types';
import './index.scss';

interface LoginProps {
    loginWithEmailSaga: any;
    loginWithPhoneSaga: any;
    sendPhoneCodeSaga: any;
    userInfo: UserInfo;
}

const mapDispatchToProps = (_dispatch: any) => {
    if (!_dispatch) {
        console.error('Redux dispatch is null');
        return {
            loginWithEmailSaga: () => Promise.reject('Redux not initialized'),
            loginWithPhoneSaga: () => Promise.reject('Redux not initialized'),
            sendPhoneCodeSaga: () => Promise.reject('Redux not initialized'),
        };
    }
    return {
        loginWithEmailSaga: bindActionCreators(accountActions.loginWithEmailSaga, _dispatch),
        loginWithPhoneSaga: bindActionCreators(accountActions.loginWithPhoneSaga, _dispatch),
        sendPhoneCodeSaga: bindActionCreators(accountActions.sendPhoneCodeSaga, _dispatch),
    };
};

const mapStateToProps = (state: any) => {
    return {
        userInfo: state?.accountReducers?.userInfo || {},
    };
};

class Login extends Component<LoginProps> {
    config: Config = {
        navigationBarTitleText: '账号登录',
    };

    state = {
        phone: '',
        code: '',
        countdown: 0,
        isPhoneLogin: true,
        email: '',
        password: '',
    };

    componentDidMount() {
        // 自动登录逻辑可以移到App组件中
        // 调试Redux连接状态
        console.log('Login component mounted');
        console.log('Props:', this.props);
        console.log('Redux actions available:', {
            loginWithEmailSaga: typeof this.props.loginWithEmailSaga,
            loginWithPhoneSaga: typeof this.props.loginWithPhoneSaga,
            sendPhoneCodeSaga: typeof this.props.sendPhoneCodeSaga,
        });
    }

    // 发送手机验证码
    handleSendCode = () => {
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

    // 手机登录
    handlePhoneLogin = () => {
        const { phone, code } = this.state;
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            AtMessage({ type: 'error', message: '请输入正确的手机号码' });
            return;
        }
        if (!/^\d{6}$/.test(code)) {
            AtMessage({ type: 'error', message: '请输入6位验证码' });
            return;
        }

        const { loginWithPhoneSaga } = this.props;
        loginWithPhoneSaga(phone, code)
            .then(() => {
                AtMessage({ type: 'success', message: '登录成功' });
                Taro.switchTab({
                    url: '/pages/task-hall/index',
                });
            })
            .catch(() => {
                AtMessage({ type: 'error', message: '登录失败，请重试' });
            });
    };

    // 邮箱登录
    handleEmailLogin = () => {
        const { email, password } = this.state;
        if (!email || !password) {
            AtMessage({ type: 'error', message: '请输入邮箱和密码' });
            return;
        }

        const { loginWithEmailSaga } = this.props;
        loginWithEmailSaga(email, password)
            .then(() => {
                AtMessage({ type: 'success', message: '登录成功' });
                Taro.switchTab({
                    url: '/pages/task-hall/index',
                });
            })
            .catch(() => {
                AtMessage({ type: 'error', message: '登录失败，请重试' });
            });
    };

    render() {
        const { countdown, isPhoneLogin, phone, code, email, password } = this.state;

        return (
            <View className="login-container">
                <View className="logo-container">
                    <View className="logo">P</View>
                    <View className="app-name">PhoenixCoder</View>
                </View>

                <View className="login-tabs">
                    <View
                        className={`tab-item ${isPhoneLogin ? 'active' : ''}`}
                        onClick={() => this.setState({ isPhoneLogin: true })}
                    >
                        手机登录
                    </View>
                    <View
                        className={`tab-item ${!isPhoneLogin ? 'active' : ''}`}
                        onClick={() => this.setState({ isPhoneLogin: false })}
                    >
                        邮箱登录
                    </View>
                </View>

                {isPhoneLogin ? (
                    <View className="login-form">
                        <AtInput
                            className="input-item"
                            placeholder="请输入手机号码"
                            value={phone}
                            onChange={(value) => this.setState({ phone: value })}
                            type="number"
                            maxLength={11}
                        />
                        <View className="code-container">
                            <AtInput
                                className="input-item code-input"
                                placeholder="请输入验证码"
                                value={code}
                                onChange={(value) => this.setState({ code: value })}
                                type="number"
                                maxLength={6}
                            />
                            <AtButton
                                className="send-code-btn"
                                type="primary"
                                size="small"
                                disabled={countdown > 0}
                                onClick={this.handleSendCode}
                            >
                                {countdown > 0 ? `${countdown}s` : '发送验证码'}
                            </AtButton>
                        </View>
                        <AtButton className="login-btn" type="primary" onClick={this.handlePhoneLogin}>
                            登录
                        </AtButton>
                    </View>
                ) : (
                    <View className="login-form">
                        <AtInput
                            className="input-item"
                            placeholder="请输入邮箱"
                            value={email}
                            onChange={(value) => this.setState({ email: value })}
                            type="text"
                        />
                        <AtInput
                            className="input-item"
                            placeholder="请输入密码"
                            value={password}
                            onChange={(value) => this.setState({ password: value })}
                            type="password"
                        />
                        <AtButton className="login-btn" type="primary" onClick={this.handleEmailLogin}>
                            登录
                        </AtButton>
                    </View>
                )}
            </View>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);
