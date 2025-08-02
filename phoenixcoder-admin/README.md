# PhoenixCoder Admin

PhoenixCoder 项目的管理端，基于 React Admin + Tailwind CSS 构建，提供完整的后台管理功能。

## 技术栈

- **React 18** - 用户界面库
- **React Admin** - 管理后台框架
- **Tailwind CSS** - 实用优先的 CSS 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速构建工具
- **React Query** - 数据获取和缓存

## 功能特性

- ✅ 完整的 CRUD 操作
- ✅ 响应式设计
- ✅ OIDC 登录认证
- ✅ 权限管理
- ✅ 数据可视化
- ✅ 主题切换
- ✅ 国际化支持
- ✅ 实时通知

## 快速开始

### 1. 环境要求

- Node.js 22.18.0
- npm 或 yarn

### 2. 安装依赖

```bash
# 安装依赖
npm install

# 或使用 yarn
yarn install
```

### 3. 环境配置

创建 `.env` 文件：

```bash
# API 配置
VITE_API_URL=http://localhost:8000
VITE_OIDC_ISSUER=http://localhost:8001
VITE_CLIENT_ID=phoenixcoder-admin

# 应用配置
VITE_APP_TITLE=PhoenixCoder Admin
VITE_APP_VERSION=1.0.0
```

### 4. 开发模式

```bash
# 启动开发服务器
npm run dev

# 或使用 yarn
yarn dev
```

### 5. 构建生产版本

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
phoenixcoder-admin/
├── src/
│   ├── components/            # 公共组件
│   ├── pages/                 # 页面组件
│   ├── resources/             # 资源定义
│   ├── services/              # API 服务
│   ├── utils/                 # 工具函数
│   ├── types/                 # TypeScript 类型定义
│   ├── App.tsx                # 应用入口
│   └── main.tsx               # 主入口
├── public/                    # 静态资源
├── dist/                      # 构建输出
├── package.json               # 项目配置
├── vite.config.ts             # Vite 配置
├── tailwind.config.js         # Tailwind 配置
├── tsconfig.json              # TypeScript 配置
└── README.md                  # 项目文档
```

## 配置说明

### Vite 配置 (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/oidc': {
        target: 'http://localhost:8001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### Tailwind 配置 (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
```

## 开发指南

### 创建新页面

```typescript
// src/pages/Users.tsx
import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  EditButton,
  DeleteButton
} from 'react-admin'

export const UserList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
)
```

### 自定义组件

```typescript
// src/components/CustomField.tsx
import React from 'react'
import { useRecordContext } from 'react-admin'

export const CustomField = () => {
  const record = useRecordContext()
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-900">{record?.name}</span>
      <span className="text-sm text-gray-500">({record?.email})</span>
    </div>
  )
}
```

### API 集成

```typescript
// src/services/api.ts
import { fetchUtils, DataProvider } from 'react-admin'

const httpClient = (url: string, options: any = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' })
  }
  
  const token = localStorage.getItem('token')
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`)
  }
  
  return fetchUtils.fetchJson(url, options)
}

export const dataProvider: DataProvider = {
  getList: (resource, params) => {
    const url = `${process.env.VITE_API_URL}/${resource}`
    return httpClient(url).then(({ json }) => ({
      data: json,
      total: json.length
    }))
  },
  
  getOne: (resource, params) => {
    const url = `${process.env.VITE_API_URL}/${resource}/${params.id}`
    return httpClient(url).then(({ json }) => ({
      data: json
    }))
  },
  
  // ... 其他方法
}
```

## 部署

### 开发环境

```bash
# 启动开发服务器
npm run dev
```

### 生产环境

```bash
# 构建项目
npm run build

# 使用 Docker
docker build -t phoenixcoder-admin .
docker run -p 3000:80 phoenixcoder-admin

# 使用 Docker Compose
docker-compose up -d admin
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name admin.phoenixcoder.com;
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 测试

```bash
# 运行单元测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e

# 运行类型检查
npm run type-check
```

## 代码规范

- 使用 **ESLint** 进行代码检查
- 使用 **Prettier** 进行代码格式化
- 使用 **TypeScript** 进行类型检查
- 遵循 **React Admin** 开发规范

## 主题定制

### 自定义主题

```typescript
// src/theme.ts
import { defaultTheme } from 'react-admin'

export const theme = {
  ...defaultTheme,
  palette: {
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#10b981',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
}
```

### 暗色主题

```typescript
// src/theme.ts
import { darkTheme, lightTheme } from 'react-admin'

export const darkThemeCustom = {
  ...darkTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
    },
  },
}
```

## 国际化

```typescript
// src/i18n/zh.ts
export const zhMessages = {
  ra: {
    action: {
      add: '添加',
      add_filter: '添加筛选',
      back: '返回',
      bulk_actions: '批量操作',
      cancel: '取消',
      clear_input_value: '清空输入',
      clone: '克隆',
      confirm: '确认',
      create: '创建',
      delete: '删除',
      edit: '编辑',
      export: '导出',
      list: '列表',
      refresh: '刷新',
      remove_filter: '移除筛选',
      save: '保存',
      search: '搜索',
      show: '显示',
      sort: '排序',
    },
    boolean: {
      true: '是',
      false: '否',
      null: ' ',
    },
    page: {
      create: '创建 %{name}',
      dashboard: '仪表板',
      edit: '%{name} #%{id}',
      error: '出错了',
      list: '%{name}',
      loading: '加载中',
      not_found: '未找到',
      show: '%{name} #%{id}',
    },
  },
}
```

## 常见问题

### 1. 构建错误

```bash
# 清理缓存
npm run clean

# 重新安装依赖
rm -rf node_modules
npm install
```

### 2. 样式问题

- 确保 Tailwind CSS 正确配置
- 检查 CSS 类名是否正确
- 使用 Tailwind 的响应式前缀

### 3. API 请求问题

- 检查 API 地址配置
- 确保 CORS 设置正确
- 验证认证 token 是否有效

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

