# Import 规范

为了保持代码一致性和可读性，特制定以下import导入规范。

## 1. 引号使用
- 统一使用单引号(`'`)
- 错误示例: `import React from "react";`
- 正确示例: `import React from 'react';`

## 2. 文件扩展名
- 导入TypeScript文件时省略`.tsx`和`.ts`扩展名
- 错误示例: `import { Layout } from "./Layout.tsx";`
- 正确示例: `import { Layout } from "./Layout";`

## 3. 导入顺序
按以下顺序排列导入语句，组间空行分隔：
1. 内置模块（如`react`）
2. 第三方模块（如`@mui/material`）
3. 本地模块（组件、服务等）
4. 样式文件

## 4. 导入分组
将不同类型的导入分组，并在组间添加空行：
- React及相关库
- MUI组件
- MUI图标
- 本地组件
- 本地服务/API
- 类型定义

## 5. 图标导入
从`@mui/icons-material`导入图标时，使用命名导入：
- 错误示例: `import DeleteIcon from '@mui/icons-material/Delete';`
- 正确示例: `import { Delete } from '@mui/icons-material';`

## 6. 路径规范
- 使用相对路径，避免使用`../`进行多级目录导入
- 对于共享组件，使用`@`别名（需配置tsconfig）