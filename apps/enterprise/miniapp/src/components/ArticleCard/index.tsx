import React, { Component } from 'react';
import Taro from '@tarojs/taro';
import { AtCard } from 'taro-ui';

// 定义组件props类型
interface ArticleCardProps {
    title: string;
    content: string;
    note?: string;
    extra?: string;
    thumb?: string;
    onClick?: () => void;
}

class ArticleCard extends Component<ArticleCardProps> {
    render() {
        return (
            <AtCard
                note={this.props.note || ''}
                extra={this.props.extra || ''}
                title={this.props.title}
                thumb={this.props.thumb}
                onClick={this.props.onClick}
            >
                {this.props.content}
            </AtCard>
        );
    }
}

export default ArticleCard;
