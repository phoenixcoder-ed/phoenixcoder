# PhoenixCoder MiniApp

PhoenixCoder 项目的小程序端，基于 Taro + React + TypeScript 构建，支持微信小程序、支付宝小程序等多端发布。

## 技术栈

- **Taro 4.1.5 - 跨端开发框架
- **React** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript
- **Redux** - 状态管理
- **Taro UI 2.3.0** - 小程序 UI 组件库
- **Axios** - HTTP 请求库
- **Moment** - 时间处理库
- **Lodash** - 工具函数库

## 功能特性

- ✅ 跨端支持（微信、支付宝、百度、字节跳动小程序、H5）
- ✅ TypeScript 类型安全
- ✅ Redux 状态管理
- ✅ 登录认证
- ✅ 响应式设计
- ✅ 组件化开发
- ✅ 热更新支持
- ✅ 成长路线展示
- ✅ 技术闯关系统

## 快速开始

### 1. 环境要求

- Node.js >= 12.0.0
- **pnpm**: >= 8.0.0 (必须使用 pnpm 作为包管理工具)
- 微信开发者工具（微信小程序）
- 支付宝小程序开发者工具（支付宝小程序）

> ⚠️ **重要提醒**: 本项目强制使用 pnpm 作为包管理工具，不支持 npm 或 yarn。

### 2. 安装依赖

```bash
# 安装依赖（仅支持 pnpm）
pnpm install
```

### 3. 开发模式

```bash
# 微信小程序
pnpm run dev:weapp

# 支付宝小程序
pnpm run dev:alipay

# 百度小程序
pnpm run dev:swan

# 字节跳动小程序
pnpm run dev:tt

# H5
pnpm run dev:h5

# React Native
pnpm run dev:rn
```

### 4. 构建生产版本

```bash
# 微信小程序
pnpm run build:weapp

# 支付宝小程序
pnpm run build:alipay

# 百度小程序
pnpm run build:swan

# 字节跳动小程序
pnpm run build:tt

# H5
pnpm run build:h5

# React Native
pnpm run build:rn
```

## 项目结构

```
phoenixcoder-miniapp/
├── src/
│   ├── app.tsx                # 应用入口
│   ├── app.scss               # 全局样式
│   ├── assets/                # 静态资源
│   ├── components/            # 公共组件
│   ├── constants/             # 常量定义
│   ├── index.html             # H5 入口
│   ├── interceptors/          # 拦截器
│   ├── pages/                 # 页面组件
│   │   ├── index/             # 首页
│   │   ├── login/             # 登录页
│   │   ├── profile/           # 个人页
│   │   ├── growth/            # 成长页
│   │   ├── club/              # 社区页
│   ├── redux/                 # Redux 状态管理
│   ├── typed/                 # TypeScript 类型定义
│   └── utils/                 # 工具函数
├── config/                    # Taro 配置
│   ├── dev.js                 # 开发环境配置
│   ├── index.js               # 主配置
│   ├── prod.js                # 生产环境配置
│   └── uat.js                 # 测试环境配置
├── design/                    # 设计资源
├── scripts/                   # 构建脚本
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置

├── project.config.json        # 小程序项目配置
└── README.md                  # 项目文档
```

## 配置说明

### Taro 配置 (config/index.js)
```javascript
// 项目配置示例
export default {
  projectName: 'phoenixcoder-miniapp',
  date: '2024-6-24',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
    '@tarojs/plugin-babel',
    '@tarojs/plugin-sass',
    '@tarojs/plugin-csso',
    '@tarojs/plugin-uglifyjs'
  ],
  defineConstants: {},
  alias: {
    '@/components': '@/src/components',
    '@/pages': '@/src/pages',
    '@/utils': '@/src/utils',
    '@/redux': '@/src/redux',
    '@/assets': '@/src/assets'
  },
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'nerv',
  compiler: 'webpack5',
  cache: {
    enable: true
  },
  // 各平台配置
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    esnextModules: ['taro-ui']
  },
  weapp: {
    module: {
      postcss: {
        autoprefixer: {
          enable: true
        }
      }
    }
  }
}
```

### 应用入口 (app.tsx)
```typescript
import Taro, { Component, Config } from '@tarojs/taro';
import '@tarojs/async-await';
import { Provider } from '@tarojs/redux';
import './app.scss';

// 引入 Redux store
import store from './redux/store';

class App extends Component {
  config: Config = {
    pages: [
      'pages/index/index',
      'pages/login/index',
      'pages/profile/index',
      'pages/growth/index',
      'pages/club/index'
    ],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#1E1E2F',
      navigationBarTitleText: 'PhoenixCoder',
      navigationBarTextStyle: 'white'
    },
    tabBar: {
      color: '#888',
      selectedColor: '#3D5AFE',
      backgroundColor: '#fff',
      list: [
        {
          pagePath: 'pages/index/index',
          text: '首页',
          iconPath: 'src/assets/icons/home.png',
          selectedIconPath: 'src/assets/icons/home_active.png'
        },
        {
          pagePath: 'pages/growth/index',
          text: '成长',
          iconPath: 'src/assets/icons/growth.png',
          selectedIconPath: 'src/assets/icons/growth_active.png'
        },
        {
          pagePath: 'pages/club/index',
          text: '社区',
          iconPath: 'src/assets/icons/club.png',
          selectedIconPath: 'src/assets/icons/club_active.png'
        },
        {
          pagePath: 'pages/profile/index',
          text: '我的',
          iconPath: 'src/assets/icons/profile.png',
          selectedIconPath: 'src/assets/icons/profile_active.png'
        }
      ]
    }
  };

  componentDidMount() {
    // 应用初始化逻辑
  }

  componentDidShow() {
    // 应用显示逻辑
  }

  componentDidHide() {
    // 应用隐藏逻辑
  }

  render() {
    return (
      <Provider store={store}>
        {this.props.children}
      </Provider>
    );
  }
}

export default App;

// 模块声明
declare module '@tarojs/taro' {}
declare module '@tarojs/redux' {}
```

## 开发指南

### 页面开发

```typescript
import Taro, { Component } from '@tarojs/taro';
import { View, Text, Image, Progress, Button } from '@tarojs/components';
import './index.scss';

// 模块声明
declare module '@tarojs/taro' {}
declare module '@tarojs/components' {}

export default class Growth extends Component {
  state = {
    progress: 45,
    remainingDays: 180,
    currentStage: 'React深度实践',
    nextStage: '后端架构设计'
  };

  componentWillMount() {
    // 页面加载前逻辑
  }

  componentDidMount() {
    // 页面加载完成逻辑
  }

  handleContinueChallenge = () => {
    // 继续挑战按钮点击事件
    Taro.showToast({
      title: '继续挑战！',
      icon: 'success'
    });
  };

  render() {
    const { progress, remainingDays, currentStage, nextStage } = this.state;

    return (
      <View className='growth-container'>
        <View className='growth-header'>
          <Text className='growth-title'>个性化成长路线</Text>
          <Button className='edit-btn'>编辑目标</Button>
        </View>

        <View className='growth-path'>
          <View className='path-title'>成为全栈开发专家</View>
          <View className='path-time'>预计完成时间：2026年1月</View>

          <View className='stage-tabs'>
            <View className='stage-tab active'>学习阶段</View>
            <View className='stage-tab'>当前阶段</View>
            <View className='stage-tab'>下一阶段</View>
          </View>

          <View className='stage-content'>
            <View className='stage-item'>前端开发基础</View>
            <View className='stage-item active'>{currentStage}</View>
            <View className='stage-item'>{nextStage}</View>
          </View>

          <View className='progress-container'>
            <View className='progress-info'>
              <Text>当前进度：{progress}%</Text>
              <Text>剩余时间：{remainingDays}天</Text>
            </View>
            <Progress percent={progress} strokeWidth={10} activeColor='#3D5AFE' backgroundColor='#E0E0E0' />
          </View>
        </View>

        <View className='challenge-system'>
          <View className='system-title'>技术闯关系统</View>
          <View className='challenge-card'>
            <View className='challenge-header'>
              <Text className='challenge-progress'>当前进度: 3/8天</Text>
              <Text className='challenge-title'>数据结构大师之路</Text>
              <Text className='challenge-desc'>掌握核心数据结构与算法</Text>
            </View>
            <Button className='continue-btn' onClick={this.handleContinueChallenge}>继续闯关</Button>
          </View>

          <View className='challenge-levels'>
            <View className='level-item completed'>
              <Text>第1关</Text>
              <Text>数组与字符串</Text>
              <Text>已完成</Text>
            </View>
            <View className='level-item completed'>
              <Text>第2关</Text>
              <Text>链表操作</Text>
              <Text>已完成</Text>
            </View>
            <View className='level-item active'>
              <Text>第3关</Text>
              <Text>树与递归</Text>
              <Text>进行中 2/5 任务</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
}
```

### 状态管理

```typescript
// redux/store/configStore.ts
import Taro from '@tarojs/taro';
import { createStore, applyMiddleware, compose } from 'redux';
import { createLogger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import rootReducer from './reducers';
import rootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();
const middlewares = [sagaMiddleware];

// 开发环境添加日志中间件
if (process.env.NODE_ENV === 'development') {
  const logger = createLogger({
    collapsed: true
  });
  middlewares.push(logger);
}

const store = createStore(
  rootReducer,
  compose(applyMiddleware(...middlewares))
);

sagaMiddleware.run(rootSaga);

export default store;
```

### API 调用

```typescript
// utils/request.ts
import Taro from '@tarojs/taro';
import { HTTP_STATUS } from '../constants/status';
import { logError } from './log';

// 创建请求实例
const request = async (url: string, options: any = {}) => {
  // 基础配置
  const baseUrl = 'http://localhost:8000';
  const header = {
    'Content-Type': 'application/json',
    ...options.header
  };

  // 添加 token
  const token = Taro.getStorageSync('token');
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }

  try {
    // 显示加载中
    Taro.showLoading({
      title: '加载中...'
    });

    // 发起请求
    const response = await Taro.request({
      url: baseUrl + url,
      method: options.method || 'GET',
      data: options.data,
      header
    });

    // 隐藏加载中
    Taro.hideLoading();

    // 处理响应
    if (response.statusCode === HTTP_STATUS.SUCCESS) {
      return response.data;
    } else if (response.statusCode === HTTP_STATUS.UNAUTHORIZED) {
      // 未授权，跳转到登录页
      Taro.navigateTo({
        url: '/pages/login/index'
      });
      return Promise.reject(new Error('未授权'));
    } else {
      logError('请求错误', response);
      Taro.showToast({
        title: '请求失败',
        icon: 'none'
      });
      return Promise.reject(new Error(`请求失败: ${response.statusCode}`));
    }
  } catch (error) {
    // 隐藏加载中
    Taro.hideLoading();

    logError('请求异常', error);
    Taro.showToast({
      title: '网络异常',
      icon: 'none'
    });
    return Promise.reject(error);
  }
};

export default request;
```

## 部署

### 微信小程序

1. 构建项目：`pnpm run build:weapp`
2. 打开微信开发者工具
3. 导入项目目录：`dist/weapp`
4. 上传代码到微信后台

### 支付宝小程序

1. 构建项目：`pnpm run build:alipay`
2. 打开支付宝小程序开发者工具
3. 导入项目目录：`dist/alipay`
4. 上传代码到支付宝后台

### H5

1. 构建项目：`pnpm run build:h5`
2. 将 `dist/h5` 目录部署到 Web 服务器

## 测试

```bash
# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm run test:coverage
```

## 代码规范

- 使用 **ESLint** 进行代码检查
- 使用 **Prettier** 进行代码格式化
- 使用 **TypeScript** 进行类型检查
- 遵循 **Taro 开发规范**

## 常见问题

### 1. 编译错误

```bash
# 清理缓存
rm -rf node_modules
rm package-lock.json

# 重新安装依赖
npm install
```

### 2. 缺少平台插件

```bash
# 安装微信小程序平台插件
pnpm install @tarojs/plugin-platform-weapp

# 安装支付宝小程序平台插件
pnpm install @tarojs/plugin-platform-alipay
```

### 3. 样式问题

- 确保使用 Taro 支持的 CSS 特性
- 避免使用不支持的 CSS 选择器
- 使用 rpx 单位进行响应式设计

### 4. 网络请求

- 确保在小程序后台配置了合法域名
- 使用 HTTPS 协议（生产环境）
- 处理网络错误和超时

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目主页: https://github.com/phoenixcoder/phoenixcoder
- 问题反馈: https://github.com/phoenixcoder/phoenixcoder/issues

