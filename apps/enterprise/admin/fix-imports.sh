#!/bin/bash

# 此脚本用于修复项目中的import语句，使其符合规范

# 安装依赖
pnpm install eslint-plugin-import --save-dev

# 运行ESLint修复
npx eslint --fix "src/**/*.{ts,tsx}"

# 格式化代码
npx prettier --write "src/**/*.{ts,tsx}"

echo "Import规范化完成！"