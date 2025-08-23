// 声明模块以解决类型问题
// 统一使用import语法导入模块
import Taro from '@tarojs/taro';
import { Component } from 'react';
import { Provider } from '@tarojs/redux';
import configStore from '@/redux/store/configStore';
import httpLoadingInterceptor from '@/interceptors/httpLoadingInterceptor';
import './app.scss';
import '@/assets/font-icons/icons.css';

// 导入图片资源
import IndexDefaultImage from '@/assets/images/index.png';
import IndexSelectedImage from '@/assets/images/index_focus.png';
import DiscoveryDefaultImage from '@/assets/images/discovery.png';
import DiscoverySelectedImage from '@/assets/images/discovery_focus.png';
import GrowthDefaultImage from '@/assets/images/growth.svg';
import GrowthSelectedImage from '@/assets/images/growth_focus.svg';
import ProblemDefaultImage from '@/assets/images/problem.svg';
import ProblemSelectedImage from '@/assets/images/problem_focus.svg';
import ProfileDefaultImage from '@/assets/images/profile.svg';
import ProfileSelectedImage from '@/assets/images/profile_focus.svg';

// 模块声明
// 模块类型扩展
declare global {
    namespace Taro {
        interface TaroStatic {
            onThemeChange(_callback: (_res: { theme: 'light' | 'dark' }) => void): { off: () => void };
            getSystemInfoSync(): { theme: 'light' | 'dark' } & any;
        }
    }
}

// 声明@tarojs/redux模块
declare module '@tarojs/redux' {
    export function Provider(_props: { store: any; children: any }): any;
}

// 类型声明文件通常放在单独的.d.ts文件中
// 这里只保留必要的模块声明

declare module '*.css';
declare module '*.scss';
declare module '*.svg';
declare module '*.png';

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

// interceptor list
Taro.addInterceptor(httpLoadingInterceptor);

class App extends Component<{ children?: React.ReactNode }, {}> {
    // 初始化Redux store
    private store = configStore();

    /**
     * 指定config的类型声明为: Taro.Config
     */
    config: Taro.Config = {
        pages: [
            'pages/index/index',
            'pages/login/index',
            'pages/register/index',
            'pages/task-hall/index',
            'pages/growth/index',
            'pages/growth/pathDetail',
            'pages/growth/challengeDetail',
            'pages/knowledge-helper/index',
            'pages/club/index',
            'pages/profile/index',
            'pages/post/index',
            'pages/post/Detail',
            'pages/post/Publish',
        ],
        window: {
            backgroundTextStyle: 'dark',
            navigationBarBackgroundColor: '#1E1E2F',
            navigationBarTitleText: 'PhoenixCoder',
            navigationBarTextStyle: 'white' as 'white',
        },
        debug: true,
        tabBar: {
            color: '#A0A0A0',
            selectedColor: '#3D5AFE',
            backgroundColor: '#1E1E2F',
            list: [
                {
                    pagePath: 'pages/task-hall/index',
                    text: '任务大厅',
                    iconPath: IndexDefaultImage,
                    selectedIconPath: IndexSelectedImage,
                },
                {
                    pagePath: 'pages/growth/index',
                    text: '成长路线',
                    iconPath: GrowthDefaultImage,
                    selectedIconPath: GrowthSelectedImage,
                },
                {
                    pagePath: 'pages/knowledge-helper/index',
                    text: '知识助手',
                    iconPath: ProblemDefaultImage,
                    selectedIconPath: ProblemSelectedImage,
                },
                {
                    pagePath: 'pages/club/index',
                    text: '社区互动',
                    iconPath: DiscoveryDefaultImage,
                    selectedIconPath: DiscoverySelectedImage,
                },
                {
                    pagePath: 'pages/profile/index',
                    text: '我的',
                    iconPath: ProfileDefaultImage,
                    selectedIconPath: ProfileSelectedImage,
                },
            ],
        },
    };

    componentDidMount() {}

    componentDidShow(_props) {}

    componentDidHide() {}

    componentDidCatchError() {}

    // Taro框架中App组件的render函数不会被调用
    // 保留实现以符合接口定义并提供Redux Provider
    render() {
        return <Provider store={this.store}>{this.props.children}</Provider>;
    }
}

export default App;
