import React, { useState } from 'react';
import Taro, { StyleSheet } from '@tarojs/taro';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Picker, ActivityIndicator } from '@tarojs/components';

import { connect } from 'react-redux';
import { ConnectedProps } from 'react-redux';
import { CodeEditor } from '@/components/CodeEditor';
import TagInput from '@/components/TagInput.tsx';

// 导入必要的类型
import type { RootState } from '@/redux/store';
import type { PostActions } from '@/redux/store/post/types';
import { bindActionCreators } from 'redux';
import { postActions } from '@/redux/store/post/actions.ts';

// 定义组件props类型
interface Props extends ConnectedProps<typeof connector> {
    navigation: any;
    postActions: PostActions;
}

const PublishPost: React.FC<Props> = ({ navigation, postActions }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('技术讨论');
    const [tags, setTags] = useState<string[]>([]);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState('');

    const categories = ['技术讨论', '经验分享', '问题求助', '招聘信息', '其他'];

    const handlePublish = async () => {
        if (!title.trim()) {
            setError('请输入标题');
            return;
        }

        if (!content.trim()) {
            setError('请输入内容');
            return;
        }

        setPublishing(true);
        setError('');
        try {
            await postActions.publishPostRequest({
                title,
                content,
                category,
                tags,
            });
            navigation.goBack();
        } catch (err) {
            console.error('发布帖子失败:', err);
            setError('发布失败，请重试');
        } finally {
            setPublishing(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>标题</Text>
                    <TextInput
                        style={styles.titleInput}
                        placeholder="请输入帖子标题"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>分类</Text>
                    <Picker
                        selectedValue={category}
                        style={styles.categoryPicker}
                        onValueChange={(itemValue) => setCategory(itemValue)}
                    >
                        {categories.map((cat) => (
                            <Picker.Item key={cat} label={cat} value={cat} />
                        ))}
                    </Picker>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>内容</Text>
                    <CodeEditor
                        value={content}
                        onChangeText={setContent}
                        style={styles.contentEditor}
                        placeholder="请输入帖子内容，可以包含代码块..."
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>标签</Text>
                    <TagInput
                        tags={tags}
                        onTagsChange={setTags}
                        placeholder="添加标签，按回车确认"
                        style={styles.tagInput}
                    />
                    <Text style={styles.tagHint}>最多添加5个标签，有助于帖子被更多人发现</Text>
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.publishButton, publishing ? styles.publishButtonDisabled : {}]}
                    onPress={handlePublish}
                    disabled={publishing}
                >
                    {publishing ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.publishButtonText}>发布帖子</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Redux连接
const mapStateToProps = (state: RootState) => ({
    post: state.postReducers,
});

const mapDispatchToProps = (dispatch: any): { postActions: PostActions } => ({
    postActions: bindActionCreators(postActions, dispatch) as any,
});

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(PublishPost);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    titleInput: {
        height: 44,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: 'white',
    },
    categoryPicker: {
        height: 44,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        backgroundColor: 'white',
    },
    contentEditor: {
        height: 300,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: 'white',
    },
    tagInput: {
        minHeight: 44,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        padding: 8,
        backgroundColor: 'white',
    },
    tagHint: {
        fontSize: 12,
        color: '#757575',
        marginTop: 8,
    },
    errorContainer: {
        padding: 12,
        backgroundColor: '#FFEBEE',
        borderRadius: 4,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 14,
        color: '#F44336',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: 'white',
    },
    publishButton: {
        backgroundColor: '#3D5AFE',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
    },
    publishButtonDisabled: {
        backgroundColor: '#90CAF9',
    },
    publishButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
