import React from 'react';
import { View } from '@tarojs/components';
import './FloatingActionButton.scss';

interface FloatingActionButtonProps {
    onClick: () => void;
    icon?: React.ReactNode;
    text?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, icon, text }) => {
    return (
        <View className="floating-action-button" onClick={onClick}>
            <View className="floating-action-button__content">
                {icon && <View className="floating-action-button__icon">{icon}</View>}
                {text && <View className="floating-action-button__text">{text}</View>}
            </View>
        </View>
    );
};

export default FloatingActionButton;
