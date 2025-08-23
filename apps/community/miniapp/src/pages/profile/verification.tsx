import React, { Component } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { AtButton, AtInput, AtTag } from 'taro-ui';
import { Upload } from '@tarojs/components';
import './verification.scss';

class Verification extends Component<{}, {}> {
    config: any = {
        navigationBarTitleText: '身份技能认证',
        navigationBarBackgroundColor: '#1E1E2F',
        navigationBarTextStyle: 'white',
    };

    constructor(props: any) {
        super(props);
        this.state = {
            skills: ['前端开发', '后端开发', '移动开发', 'DevOps', '数据科学', 'UI/UX设计', '产品经理', '测试工程师'],
            selectedSkills: [],
            isVerifying: false,
            error: null,
            success: false,
        };
        this.toggleSkill = this.toggleSkill.bind(this);
        this.handleVerify = this.handleVerify.bind(this);
    }

    // 切换技能选择
    toggleSkill(skill: string) {
        this.setState((prevState) => ({
            selectedSkills: prevState.selectedSkills.includes(skill)
                ? prevState.selectedSkills.filter((s) => s !== skill)
                : [...prevState.selectedSkills, skill],
        }));
    }

    // 提交认证
    handleVerify() {
        const { selectedSkills } = this.state;

        if (selectedSkills.length === 0) {
            this.setState({
                error: '请选择至少一项技能',
            });
            return;
        }

        this.setState({
            isVerifying: true,
            error: null,
        });

        // 模拟认证过程
        setTimeout(() => {
            // 这里应该调用后端API进行认证
            // 模拟认证成功
            Taro.setStorageSync('userInfo', {
                ...Taro.getStorageSync('userInfo'),
                isVerified: true,
                skills: selectedSkills,
            });

            this.setState({
                isVerifying: false,
                success: true,
            });

            // 显示成功提示
            Taro.showToast({
                title: '认证成功',
                icon: 'success',
            });

            // 延迟返回
            setTimeout(() => {
                Taro.navigateBack();
            }, 1500);
        }, 2000);
    }

    render() {
        const { skills, selectedSkills, isVerifying, error, success } = this.state;

        return (
            <View className="verification-container">
                <View className="verification-header">
                    <Text className="verification-title">身份技能认证</Text>
                    <Text className="verification-description">完成认证以解锁更多任务和功能</Text>
                </View>

                {error && (
                    <View className="error-message">
                        <Text>{error}</Text>
                    </View>
                )}

                {success && (
                    <View className="success-message">
                        <Image className="success-icon" src="/assets/images/success.png" mode="aspectFit" />
                        <Text className="success-text">认证成功！</Text>
                        <Text className="success-subtext">即将返回上一页</Text>
                    </View>
                )}

                {!success && (
                    <ScrollView className="content-container" scrollY>
                        <View className="form-section">
                            <Text className="section-title">基本信息</Text>
                            <AtInput
                                name="realName"
                                className="input-item"
                                placeholder="真实姓名"
                                type="text"
                                border={false}
                            />
                            <AtInput
                                name="phone"
                                className="input-item"
                                placeholder="手机号码"
                                type="number"
                                border={false}
                            />
                            <AtInput
                                name="email"
                                className="input-item"
                                placeholder="邮箱地址"
                                type="text"
                                border={false}
                            />
                        </View>

                        <View className="form-section">
                            <Text className="section-title">技能认证</Text>
                            <Text className="section-description">请选择您擅长的技能（可多选）</Text>
                            <View className="skills-container">
                                {skills.map((skill, index) => (
                                    <AtTag
                                        key={index}
                                        className={`skill-tag ${selectedSkills.includes(skill) ? 'selected' : ''}`}
                                        onClick={() => this.toggleSkill(skill)}
                                    >
                                        {skill}
                                    </AtTag>
                                ))}
                            </View>
                        </View>

                        <View className="form-section">
                            <Text className="section-title">证明材料</Text>
                            <Text className="section-description">上传您的技能证明（如证书、项目作品等）</Text>
                            <Upload
                                name="file"
                                action="https://example.com/upload"
                                onChange={this.handleUpload}
                                className="upload-btn"
                            >
                                <Text>上传证明材料</Text>
                            </Upload>
                        </View>
                    </ScrollView>
                )}

                {!success && (
                    <View className="submit-container">
                        <AtButton
                            type="primary"
                            className="submit-btn"
                            loading={isVerifying}
                            disabled={isVerifying}
                            onClick={this.handleVerify}
                        >
                            提交认证
                        </AtButton>
                        <Text className="hint-text">认证信息将在1-3个工作日内审核完成</Text>
                    </View>
                )}
            </View>
        );
    }
}

export default Verification;
