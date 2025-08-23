#!/bin/bash

# 测试 iTerm2 AppleScript 修复
echo "测试 iTerm2 AppleScript 修复..."

# 设置 iTerm2 环境变量
export TERM_PROGRAM=iTerm.app

# 运行脚本
echo "运行 start.sh --mode=local --tabs"
./start.sh --mode=local --tabs

echo "测试完成！"