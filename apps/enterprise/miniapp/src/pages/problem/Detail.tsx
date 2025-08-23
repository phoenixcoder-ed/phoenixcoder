import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Picker } from 'react-native';
import { useSelector } from 'react-redux';
import { problemActions } from '@/redux/actions';
import { RootState } from '@/redux/store';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ConnectedProps } from 'react-redux';
import { CodeBox } from '@/components/CodeBox';

// 定义组件props类型
interface Props extends ConnectedProps<typeof connector> {
    _navigation: any;
    route: any;
}

const ProblemDetail: React.FC<Props> = ({ _navigation, route, problemActions }) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [result, setResult] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
    const { problemId } = route.params;

    // 从Redux状态获取题目详情数据
    const { problemDetail, answerResult, error } = useSelector((state: RootState) => state.problemReducers);

    useEffect(() => {
        fetchProblemDetail();
    }, [problemId]);

    useEffect(() => {
        if (answerResult) {
            setResult(answerResult.result === 'success' ? '答案正确！' : answerResult.errorMessage || '答案错误');
            setIsSuccess(answerResult.result === 'success');
            setSubmitting(false);
        }
    }, [answerResult]);

    const fetchProblemDetail = async () => {
        setLoading(true);
        try {
            await problemActions.fetchProblemDetailRequest({ problemId });
        } catch (err) {
            console.error('获取题目详情失败:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!code.trim()) {
            setResult('请输入代码');
            setIsSuccess(false);
            return;
        }

        setSubmitting(true);
        setResult(null);
        setIsSuccess(null);
        try {
            await problemActions.submitAnswerRequest({
                problemId,
                code,
                language,
            });
        } catch (err) {
            console.error('提交答案失败:', err);
            setResult('提交失败，请重试');
            setIsSuccess(false);
            setSubmitting(false);
        }
    };

    const renderProblemContent = () => {
        if (!problemDetail) return null;

        return (
            <ScrollView style={styles.contentContainer}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>{problemDetail.title}</Text>
                    <View style={[styles.difficultyTag, getDifficultyStyle(problemDetail.difficulty)]}>
                        <Text style={styles.difficultyText}>{getDifficultyText(problemDetail.difficulty)}</Text>
                    </View>
                </View>

                <View style={styles.tagsContainer}>
                    {problemDetail.tags.map((tag, index) => (
                        <Text key={index} style={styles.tag}>
                            {tag}
                        </Text>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>题目描述</Text>
                    <Text style={styles.sectionContent}>{problemDetail.description}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>输入样例</Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.codeText}>{problemDetail.sampleInput}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>输出样例</Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.codeText}>{problemDetail.sampleOutput}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>约束条件</Text>
                    <Text style={styles.sectionContent}>{problemDetail.constraints}</Text>
                </View>

                {problemDetail.hints && problemDetail.hints.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>提示</Text>
                        {problemDetail.hints.map((hint, index) => (
                            <Text key={index} style={styles.sectionContent}>
                                {index + 1}. {hint}
                            </Text>
                        ))}
                    </View>
                )}
            </ScrollView>
        );
    };

    const getDifficultyStyle = (difficulty: number) => {
        switch (difficulty) {
            case 1:
                return { backgroundColor: '#4CAF50' };
            case 2:
                return { backgroundColor: '#FFA500' };
            case 3:
                return { backgroundColor: '#F44336' };
            default:
                return { backgroundColor: '#9E9E9E' };
        }
    };

    const getDifficultyText = (difficulty: number) => {
        switch (difficulty) {
            case 1:
                return '简单';
            case 2:
                return '中等';
            case 3:
                return '困难';
            default:
                return '未知';
        }
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3D5AFE" />
                    <Text style={styles.loadingText}>加载中...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchProblemDetail}>
                        <Text style={styles.retryButtonText}>重试</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.contentWrapper}>
                    {renderProblemContent()}

                    <View style={styles.codeEditorContainer}>
                        <View style={styles.languagePickerContainer}>
                            <Text style={styles.languageLabel}>选择语言:</Text>
                            <Picker
                                selectedValue={language}
                                style={styles.languagePicker}
                                onValueChange={(itemValue) => setLanguage(itemValue)}
                            >
                                <Picker.Item label="JavaScript" value="javascript" />
                                <Picker.Item label="Python" value="python" />
                                <Picker.Item label="Java" value="java" />
                                <Picker.Item label="C++" value="cpp" />
                            </Picker>
                        </View>

                        <Text style={styles.codeLabel}>编写代码:</Text>
                        <CodeBox code={code} onChangeText={setCode} language={language} style={styles.codeBox} />

                        <TouchableOpacity
                            style={[styles.submitButton, submitting ? styles.submitButtonDisabled : {}]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>提交答案</Text>
                            )}
                        </TouchableOpacity>

                        {result && (
                            <View
                                style={[styles.resultContainer, isSuccess ? styles.successResult : styles.errorResult]}
                            >
                                <Text style={styles.resultText}>{result}</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

// Redux连接
const mapStateToProps = (state: RootState) => ({
    problem: state.problemReducers,
});

const mapDispatchToProps = (dispatch: any) => ({
    problemActions: bindActionCreators(problemActions, dispatch),
});

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(ProblemDetail);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 16,
        color: '#757575',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#F44336',
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#3D5AFE',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    contentWrapper: {
        flex: 1,
        flexDirection: 'column',
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    difficultyTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    difficultyText: {
        fontSize: 12,
        color: 'white',
        fontWeight: 'bold',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    tag: {
        backgroundColor: '#E3F2FD',
        color: '#1976D2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 12,
        marginRight: 6,
        marginBottom: 6,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    sectionContent: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    codeBlock: {
        backgroundColor: '#263238',
        padding: 12,
        borderRadius: 4,
        overflow: 'auto',
    },
    codeText: {
        color: '#EEFFFF',
        fontFamily: 'monospace',
        fontSize: 14,
    },
    codeEditorContainer: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        padding: 16,
        backgroundColor: 'white',
    },
    languagePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    languageLabel: {
        fontSize: 14,
        color: '#333',
        marginRight: 12,
    },
    languagePicker: {
        flex: 1,
        height: 40,
    },
    codeLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
    },
    codeBox: {
        height: 200,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: '#3D5AFE',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 16,
    },
    submitButtonDisabled: {
        backgroundColor: '#90CAF9',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultContainer: {
        padding: 12,
        borderRadius: 4,
        marginBottom: 8,
    },
    successResult: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
        borderWidth: 1,
    },
    errorResult: {
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
        borderWidth: 1,
    },
    resultText: {
        fontSize: 14,
        color: '#333',
    },
});
