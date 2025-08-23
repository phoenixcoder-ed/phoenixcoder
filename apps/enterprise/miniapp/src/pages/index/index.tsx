import Taro from '@tarojs/taro';
import React, { Component } from 'react';
import { View, Text } from '@tarojs/components';
import { AtButton } from 'taro-ui';
import './index.scss';

class Index extends Component<{}, {}> {
    config = {
        navigationBarTitleText: '首页',
        navigationBarBackgroundColor: '#1E1E2F',
        navigationBarTextStyle: 'white',
    };

    // 进入应用按钮点击事件
    handleEnterApp = () => {
        Taro.switchTab({
            url: '/pages/task-hall/index',
        });
    };

    render() {
        return (
            <View className="index">
                <View className="container">
                    <AtButton type="primary" className="home-button" onClick={this.handleEnterApp}>
                        进入应用
                    </AtButton>
                    <View className="description">
                        <Text className="description-text">欢迎使用程序员成长助手</Text>
                    </View>
                </View>
            </View>
        );
    }
}

export default Index;
