import React, { Component } from 'react';
import Taro, { Config } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { AtButton, AtRadio, AtCheckbox, AtInput, AtTextarea } from 'taro-ui';
import './survey.scss';

// 定义问卷问题类型
interface Question {
    id: string;
    title: string;
    type: 'single' | 'multiple' | 'text' | 'textarea';
    options?: string[];
    required: boolean;
}

export default class Survey extends Component<
    any,
    { answers: Record<string, any>; isSubmitting: boolean; error: string | null }
> {
    config: Config = {
        navigationBarTitleText: '学习偏好调查',
        navigationBarBackgroundColor: '#1E1E2F',
        navigationBarTextStyle: 'white',
    };

    constructor(props: any) {
        super(props);
        this.state = {
            answers: {},
            isSubmitting: false,
            error: null,
        };
        this.handleAnswerChange = this.handleAnswerChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    // 问卷问题
    questions: Question[] = [
        {
            id: 'q1',
            title: '您的主要技术栈是什么？',
            type: 'multiple',
            options: ['前端开发', '后端开发', '移动开发', 'DevOps', '数据科学', 'UI/UX设计'],
            required: true,
        },
        {
            id: 'q2',
            title: '您当前的技术水平如何？',
            type: 'single',
            options: ['入门级', '中级', '高级', '专家'],
            required: true,
        },
        {
            id: 'q3',
            title: '您希望通过PhoenixCoder提升哪方面的能力？',
            type: 'multiple',
            options: ['编程技能', '项目经验', '架构设计', '团队协作', '求职面试'],
            required: true,
        },
        {
            id: 'q4',
            title: '您每周可以投入多少时间学习？',
            type: 'single',
            options: ['少于5小时', '5-10小时', '10-20小时', '20小时以上'],
            required: true,
        },
        {
            id: 'q5',
            title: '您有什么具体的学习目标或想解决的问题？',
            type: 'textarea',
            required: false,
        },
    ];

    // 处理答案变化
    handleAnswerChange(questionId: string, value: any) {
        this.setState((prevState) => ({
            answers: {
                ...prevState.answers,
                [questionId]: value,
            },
        }));
    }

    // 验证表单
    validateForm(): boolean {
        const { answers } = this.state;
        const requiredQuestions = this.questions.filter((q) => q.required);

        for (const question of requiredQuestions) {
            const answer = answers[question.id];
            if (!answer) return false;
            if (question.type === 'multiple' && answer.length === 0) return false;
        }

        return true;
    }

    // 提交问卷
    handleSubmit() {
        if (!this.validateForm()) {
            this.setState({
                error: '请回答所有必填问题',
            });
            return;
        }

        this.setState({
            isSubmitting: true,
            error: null,
        });

        // 模拟提交
        setTimeout(() => {
            // 保存问卷完成状态
            Taro.setStorageSync('hasCompletedSurvey', true);
            // 显示成功提示
            Taro.showToast({
                title: '问卷提交成功',
                icon: 'success',
            });
            // 返回知识助手页面
            Taro.navigateBack();
        }, 1500);
    }

    render() {
        const { answers, isSubmitting, error } = this.state;

        return (
            <View className="survey-container">
                <View className="survey-header">
                    <Text className="survey-title">学习偏好调查</Text>
                    <Text className="survey-description">完成问卷调查，帮助我们为您提供更精准的学习推荐</Text>
                </View>

                {error && (
                    <View className="error-message">
                        <Text>{error}</Text>
                    </View>
                )}

                <ScrollView className="questions-container" scrollY>
                    {this.questions.map((question, index) => (
                        <View key={question.id} className="question-item">
                            <View className="question-header">
                                <Text className="question-number">{index + 1}.</Text>
                                <Text className="question-title">
                                    {question.title}
                                    {question.required && <Text className="required">*</Text>}
                                </Text>
                            </View>

                            {question.type === 'single' && (
                                <View className="options-container">
                                    {question.options?.map((option, i) => (
                                        <AtRadio
                                            key={i}
                                            checked={answers[question.id] === option}
                                            onChange={() => this.handleAnswerChange(question.id, option)}
                                            className="radio-option"
                                        >
                                            {option}
                                        </AtRadio>
                                    ))}
                                </View>
                            )}

                            {question.type === 'multiple' && (
                                <View className="options-container">
                                    {question.options?.map((option, i) => (
                                        <AtCheckbox
                                            key={i}
                                            value={option}
                                            checked={(answers[question.id] || []).includes(option)}
                                            onChange={(checked) => {
                                                let newAnswers = [...(answers[question.id] || [])];
                                                if (checked) {
                                                    newAnswers.push(option);
                                                } else {
                                                    newAnswers = newAnswers.filter((item) => item !== option);
                                                }
                                                this.handleAnswerChange(question.id, newAnswers);
                                            }}
                                            className="checkbox-option"
                                        >
                                            {option}
                                        </AtCheckbox>
                                    ))}
                                </View>
                            )}

                            {question.type === 'text' && (
                                <AtInput
                                    name={question.id}
                                    className="text-input"
                                    placeholder="请输入您的答案"
                                    value={answers[question.id] || ''}
                                    onChange={(value) => this.handleAnswerChange(question.id, value)}
                                />
                            )}

                            {question.type === 'textarea' && (
                                <AtTextarea
                                    name={question.id}
                                    className="textarea-input"
                                    placeholder="请输入您的答案"
                                    value={answers[question.id] || ''}
                                    onChange={(value) => this.handleAnswerChange(question.id, value)}
                                />
                            )}
                        </View>
                    ))}
                </ScrollView>

                <View className="submit-container">
                    <AtButton
                        type="primary"
                        className="submit-button"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={this.handleSubmit}
                    >
                        提交问卷
                    </AtButton>
                    <Text className="required-hint">* 为必填项</Text>
                </View>
            </View>
        );
    }
}

export default Survey;
