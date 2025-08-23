# 代码结构说明

本项目采用Feature-Sliced Architecture (FSA) 和 Screaming Architecture 原则组织代码。

## 目录结构

```
phoenixcoder-admin/src/
├── app/                 # 应用级组件和配置
│   ├── Dashboard.tsx    # 仪表盘组件
│   └── ...
├── features/            # 功能模块
│   ├── auth/            # 认证相关功能
│   ├── UserManagement/  # 用户管理功能
│   ├── KnowledgeBase/   # 知识库功能
│   └── interviewQuestions/ # 面试题功能
├── shared/              # 共享代码
│   ├── api/             # API服务
│   └── components/      # 共享组件
├── entities/            # 实体定义 (预留)
├── App.tsx              # 应用入口
├── Layout.tsx           # 布局组件
└── theme.tsx            # 主题配置
```

## 架构原则

1. **按功能组织代码**：每个功能模块包含其所需的所有代码（组件、类型、服务等）。
2. **分离关注点**：
   - `app/`: 应用级组件和配置
   - `features/`: 业务功能模块
   - `shared/`: 可重用的共享代码
   - `entities/`: 领域实体定义
3. **清晰的导入路径**：使用index.ts文件简化导入。
4. **组件化**：将UI拆分为可重用的组件。

## 开发指南

### 创建新功能

1. 在`features/`目录下创建新功能目录
2. 目录结构参考现有功能模块
3. 创建index.ts文件导出模块内容
4. 在App.tsx中注册新功能

### 添加共享组件

1. 将组件添加到`shared/components/`目录
2. 在需要使用的地方导入

### 添加API服务

1. 将API服务添加到`shared/api/`目录
2. 在需要使用的地方导入
