import React, { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';

interface ResponsiveContainerProps {
    width?: string | number;
    height: string | number;
    children: React.ReactNode;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ width = '100%', height, children }) => {
    const [containerWidth, setContainerWidth] = useState<string | number>(width);

    useEffect(() => {
        if (width === '100%') {
            const { windowWidth } = Taro.getSystemInfoSync();
            setContainerWidth(windowWidth);
        }
    }, [width]);

    return (
        <View
            style={{
                width: containerWidth,
                height: height,
            }}
        >
            {children}
        </View>
    );
};

export default ResponsiveContainer;
