import { Radar } from '@ant-design/plots';
import React from 'react';

interface ProgressData {
    subject: string;
    score: number;
}

export const LearningProgressChart = ({ data }: { data: ProgressData[] }) => {
    const config = {
        data,
        xField: 'subject',
        yField: 'score',
        meta: {
            score: {
                alias: '成长值',
                min: 0,
                max: 100,
            },
        },
        area: {
            style: {
                fillOpacity: 0.2,
            },
        },
        tooltip: {
            showCrosshairs: true,
        },
    };

    return <Radar {...config} />;
};
