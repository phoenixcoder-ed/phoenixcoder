#!/bin/bash
# VS Code 服务启动脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== VS Code 多服务启动脚本 ===${NC}"
echo -e "${YELLOW}正在启动所有服务...${NC}"
echo

echo -e "${CYAN}启动服务: server${NC}"
cd '/Users/zhuwencan/work/phoenixcoder/apps/community/server'
if [[ -f "venv/bin/activate" ]]; then
    source venv/bin/activate
fi
source venv/bin/activate && python main.py &
echo -e "${GREEN}✓ server 已启动 (PID: $!)${NC}"
echo

echo -e "${CYAN}启动服务: oidc-server${NC}"
cd '/Users/zhuwencan/work/phoenixcoder/apps/community/oidc-server'
if [[ -f "venv/bin/activate" ]]; then
    source venv/bin/activate
fi
source venv/bin/activate && python main.py &
echo -e "${GREEN}✓ oidc-server 已启动 (PID: $!)${NC}"
echo

echo -e "${YELLOW}等待服务启动...${NC}"
sleep 3

echo -e "${GREEN}所有服务已启动完成！${NC}"
echo -e "${CYAN}访问地址:${NC}"
echo -e "${CYAN}  - Server: http://localhost:8000${NC}"
echo -e "${CYAN}  - OIDC Server: http://localhost:8080${NC}"
echo
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"

# 等待用户中断
wait
