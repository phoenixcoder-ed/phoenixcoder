import Taro, { Component, Config } from '@tarojs/taro';
import React from 'react';
import { View, Text } from '@tarojs/components';
import { connect } from '@tarojs/redux';
import { bindActionCreators } from 'redux';
import * as accountActions from '@/redux/store/account/actions.ts';
import { UserInfo } from '@/redux/store/account/types';
import { AtButton, AtAvatar, AtList, AtListItem } from 'taro-ui';
import './index.scss';

interface ProfileProps {
    userInfo: UserInfo;
    accountActions: typeof accountActions;
}

interface ProfileState {
    avatar: string;
}

class Profile extends Component<ProfileProps> {
    static config: Config = {
        navigationBarTitleText: '我的',
        navigationBarBackgroundColor: '#1E1E2F',
        navigationBarTextStyle: 'white',
    };

    state: ProfileState = {
        avatar: this.props.userInfo.avatar || '',
    };

    // 退出登录
    handleLogout = () => {
        Taro.showModal({
            title: '确认退出',
            content: '确定要退出当前账号吗？',
            success: (res) => {
                if (res.confirm) {
                    // @ts-ignore
                    this.props.accountActions.logout();
                    Taro.navigateTo({
                        url: '/pages/login/index',
                    });
                }
            },
        });
    };

    // 跳转到个人设置
    handleSetting = () => {
        Taro.navigateTo({
            url: '/pages/profile/setting/index',
        });
    };

    // 跳转到我的任务
    handleMyTasks = () => {
        Taro.navigateTo({
            url: '/pages/profile/my-tasks/index',
        });
    };

    // 跳转到我的技能
    handleMySkills = () => {
        Taro.navigateTo({
            url: '/pages/profile/my-skills/index',
        });
    };

    // 跳转到我的徽章
    handleMyBadges = () => {
        Taro.navigateTo({
            url: '/pages/profile/my-badges/index',
        });
    };

    renderUserTypeLabel(userType: string) {
        switch (userType) {
            case 'programmer':
                return '程序员';
            case 'merchant':
                return '商家';
            case 'contributor':
                return '共建者';
            default:
                return '未知';
        }
    }

    render() {
        const { userInfo } = this.props;
        const { avatar } = this.state;

        return (
            <View className="profile-container">
                {/* 用户信息卡片 */}
                <View className="user-info-card">
                    <AtAvatar
                        image={avatar || 'https://img.icons8.com/bubbles/200/user.png'}
                        size="large"
                        className="avatar"
                    />
                    <View className="user-info">
                        <Text className="user-name">{userInfo.name || '未设置昵称'}</Text>
                        <Text className="user-type">{this.renderUserTypeLabel(userInfo.userType || '')}</Text>
                        <Text className="user-email">{userInfo.email || '未绑定邮箱'}</Text>
                    </View>
                    <AtButton size="small" className="edit-btn" onClick={this.handleSetting}>
                        编辑
                    </AtButton>
                </View>

                {/* 功能菜单列表 */}
                <AtList className="function-list">
                    <AtListItem title="我的任务" icon="clock" arrow="right" onClick={this.handleMyTasks} />
                    <AtListItem title="我的技能" icon="code" arrow="right" onClick={this.handleMySkills} />
                    <AtListItem title="我的徽章" icon="award" arrow="right" onClick={this.handleMyBadges} />
                    <AtListItem title="设置" icon="settings" arrow="right" onClick={this.handleSetting} />
                </AtList>

                {/* 退出登录按钮 */}
                <View className="logout-btn-container">
                    <AtButton type="secondary" className="logout-btn" onClick={this.handleLogout}>
                        退出登录
                    </AtButton>
                </View>
            </View>
        );
    }
}

export default connect(
    (state: any) => ({
        userInfo: state.accountReducers.userInfo,
    }),
    (dispatch: Function) => ({
        accountActions: bindActionCreators(accountActions, dispatch),
    }),
)(Profile);
