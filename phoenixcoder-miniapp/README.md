# PhoenixCoder MiniApp

PhoenixCoder 项目的小程序端，基于 Taro 4 + React + TypeScript 构建，支持微信小程序、支付宝小程序等多端发布。

## 技术栈

- **Taro 4** - 跨端开发框架
- **React 18** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript
- **Redux Toolkit** - 状态管理
- **Taro UI** - 小程序 UI 组件库

## 功能特性

- ✅ 跨端支持（微信、支付宝、百度、字节跳动小程序）
- ✅ TypeScript 类型安全
- ✅ Redux 状态管理
- ✅ OIDC 登录认证
- ✅ 响应式设计
- ✅ 组件化开发
- ✅ 热更新支持

## 快速开始

### 1. 环境要求

- Node.js 18+
- npm 或 yarn
- 微信开发者工具（微信小程序）
- 支付宝小程序开发者工具（支付宝小程序）

### 2. 安装依赖

```bash
# 安装依赖
npm install

# 或使用 yarn
yarn install
```

### 3. 开发模式

```bash
# 微信小程序
npm run dev:weapp

# 支付宝小程序
npm run dev:alipay

# 百度小程序
npm run dev:swan

# 字节跳动小程序
npm run dev:tt

# H5
npm run dev:h5

# React Native
npm run dev:rn
```

### 4. 构建生产版本

```bash
# 微信小程序
npm run build:weapp

# 支付宝小程序
npm run build:alipay

# H5
npm run build:h5
```

## 项目结构

```
phoenixcoder-miniapp/
├── src/
│   ├── app.ts                 # 应用入口
│   ├── app.config.ts          # 应用配置
│   ├── app.scss               # 全局样式
│   ├── components/            # 公共组件
│   ├── pages/                 # 页面组件
│   ├── store/                 # Redux 状态管理
│   ├── services/              # API 服务
│   ├── utils/                 # 工具函数
│   └── types/                 # TypeScript 类型定义
├── config/                    # Taro 配置
├── scripts/                   # 构建脚本
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置
└── README.md                  # 项目文档
```

## 配置说明

### 应用配置 (app.config.ts)

```typescript
export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/login',
    'pages/profile/profile'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'PhoenixCoder',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/profile/profile',
        text: '我的'
      }
    ]
  }
})
```

### 环境配置

创建 `.env` 文件：

```bash
# API 配置
TARO_APP_API_URL=http://localhost:8000
TARO_APP_OIDC_ISSUER=http://localhost:8001
TARO_APP_CLIENT_ID=phoenixcoder-miniapp

# 小程序配置
TARO_APP_ID=your-miniapp-id
```

## 开发指南

### 页面开发

```typescript
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Index() {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='index'>
      <Text>Hello World!</Text>
    </View>
  )
}
```

### 状态管理

```typescript
// store/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserState {
  user: any | null
  token: string | null
}

const initialState: UserState = {
  user: null,
  token: null
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
    }
  }
})

export const { setUser, setToken, logout } = userSlice.actions
export default userSlice.reducer
```

### API 调用

```typescript
// services/api.ts
import Taro from '@tarojs/taro'

const API_BASE_URL = process.env.TARO_APP_API_URL

export const api = {
  async request(url: string, options: any = {}) {
    const token = Taro.getStorageSync('token')
    
    const response = await Taro.request({
      url: `${API_BASE_URL}${url}`,
      ...options,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      }
    })
    
    return response.data
  },
  
  async login(code: string) {
    return this.request('/auth/callback', {
      method: 'POST',
      data: { code }
    })
  }
}
```

## 部署

### 微信小程序

1. 构建项目：`npm run build:weapp`
2. 打开微信开发者工具
3. 导入项目目录：`dist/`
4. 上传代码到微信后台

### 支付宝小程序

1. 构建项目：`npm run build:alipay`
2. 打开支付宝小程序开发者工具
3. 导入项目目录：`dist/`
4. 上传代码到支付宝后台

### H5

1. 构建项目：`npm run build:h5`
2. 将 `dist/` 目录部署到 Web 服务器

## 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e
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
npm run clean

# 重新安装依赖
rm -rf node_modules
npm install
```

### 2. 样式问题

- 确保使用 Taro 支持的 CSS 特性
- 避免使用不支持的 CSS 选择器
- 使用 rpx 单位进行响应式设计

### 3. 网络请求

- 确保在小程序后台配置了合法域名
- 使用 HTTPS 协议
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

