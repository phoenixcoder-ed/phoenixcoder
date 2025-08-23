#!/bin/bash

# PhoenixCoder SSH安全加固脚本
# 配置SSH密钥认证，禁用密码认证

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 配置变量
SSH_KEY_NAME="phoenixcoder_deploy"
SSH_KEY_TYPE="ed25519"
SSH_CONFIG_FILE="/etc/ssh/sshd_config"
SSH_USER="edward"
REMOTE_HOST="192.168.3.30"

# 显示帮助信息
show_help() {
    echo -e "${BLUE}PhoenixCoder SSH安全加固脚本${NC}"
    echo -e "用法: $0 [命令]\n"
    echo -e "命令:\n"
    echo -e "  generate-key     生成SSH密钥对"
    echo -e "  setup-server     配置服务器SSH安全设置"
    echo -e "  deploy-key       部署公钥到服务器"
    echo -e "  test-connection  测试SSH密钥连接"
    echo -e "  harden-ssh       完整的SSH安全加固流程"
    echo -e "  backup-config    备份SSH配置文件"
    echo -e "  restore-config   恢复SSH配置文件"
    echo -e "  help             显示帮助信息\n"
    echo -e "${YELLOW}注意：运行此脚本前请确保有服务器的sudo权限${NC}"
}

# 检查依赖
check_dependencies() {
    if ! command -v ssh-keygen &> /dev/null; then
        echo -e "${RED}错误: ssh-keygen 未安装${NC}"
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        echo -e "${RED}错误: ssh 未安装${NC}"
        exit 1
    fi
}

# 加载环境变量
load_env() {
    if [[ -f ".env.security.local" ]]; then
        source .env.security.local
    fi
    
    if [[ -z "$SUDO_PASSWORD" ]]; then
        echo -e "${RED}错误: 未设置SUDO_PASSWORD环境变量${NC}"
        echo -e "${YELLOW}请在 .env.security.local 文件中设置密码${NC}"
        exit 1
    fi
}

# 生成SSH密钥对
generate_ssh_key() {
    echo -e "${GREEN}正在生成SSH密钥对...${NC}"
    
    # 创建.ssh目录
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    # 生成密钥对
    if [[ -f "~/.ssh/${SSH_KEY_NAME}" ]]; then
        echo -e "${YELLOW}SSH密钥已存在，是否覆盖？(y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}跳过密钥生成${NC}"
            return 0
        fi
    fi
    
    ssh-keygen -t $SSH_KEY_TYPE -f ~/.ssh/$SSH_KEY_NAME -C "phoenixcoder-deploy@$(hostname)" -N ""
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ SSH密钥对生成成功${NC}"
        echo -e "${BLUE}私钥: ~/.ssh/${SSH_KEY_NAME}${NC}"
        echo -e "${BLUE}公钥: ~/.ssh/${SSH_KEY_NAME}.pub${NC}"
        
        # 设置正确的权限
        chmod 600 ~/.ssh/$SSH_KEY_NAME
        chmod 644 ~/.ssh/${SSH_KEY_NAME}.pub
        
        echo -e "\n${YELLOW}公钥内容:${NC}"
        cat ~/.ssh/${SSH_KEY_NAME}.pub
    else
        echo -e "${RED}✗ SSH密钥生成失败${NC}"
        exit 1
    fi
}

# 部署公钥到服务器
deploy_public_key() {
    echo -e "${GREEN}正在部署公钥到服务器...${NC}"
    
    if [[ ! -f "~/.ssh/${SSH_KEY_NAME}.pub" ]]; then
        echo -e "${RED}错误: 公钥文件不存在，请先生成SSH密钥${NC}"
        exit 1
    fi
    
    # 使用ssh-copy-id部署公钥
    echo -e "${BLUE}正在复制公钥到服务器...${NC}"
    ssh-copy-id -i ~/.ssh/${SSH_KEY_NAME}.pub ${SSH_USER}@${REMOTE_HOST}
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ 公钥部署成功${NC}"
    else
        echo -e "${RED}✗ 公钥部署失败${NC}"
        echo -e "${YELLOW}请手动复制公钥内容到服务器的 ~/.ssh/authorized_keys 文件${NC}"
        echo -e "${YELLOW}公钥内容:${NC}"
        cat ~/.ssh/${SSH_KEY_NAME}.pub
        exit 1
    fi
}

# 备份SSH配置
backup_ssh_config() {
    echo -e "${GREEN}正在备份SSH配置...${NC}"
    
    # 在服务器上备份配置文件
    ssh -i ~/.ssh/$SSH_KEY_NAME ${SSH_USER}@${REMOTE_HOST} "echo '$SUDO_PASSWORD' | sudo -S cp $SSH_CONFIG_FILE ${SSH_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ SSH配置备份成功${NC}"
    else
        echo -e "${RED}✗ SSH配置备份失败${NC}"
        exit 1
    fi
}

# 配置服务器SSH安全设置
setup_server_ssh() {
    echo -e "${GREEN}正在配置服务器SSH安全设置...${NC}"
    
    # 创建SSH安全配置
    cat > /tmp/ssh_security_config << 'EOF'
# PhoenixCoder SSH安全配置
# 禁用密码认证
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM no

# 只允许公钥认证
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# 禁用root登录
PermitRootLogin no

# 限制登录用户
AllowUsers edward

# 设置连接超时
ClientAliveInterval 300
ClientAliveCountMax 2

# 限制并发连接
MaxAuthTries 3
MaxSessions 10

# 禁用不安全的功能
PermitEmptyPasswords no
PermitUserEnvironment no
AllowAgentForwarding no
AllowTcpForwarding no
X11Forwarding no

# 使用安全的协议版本
Protocol 2

# 设置日志级别
LogLevel VERBOSE
EOF
    
    # 上传配置到服务器
    scp -i ~/.ssh/$SSH_KEY_NAME /tmp/ssh_security_config ${SSH_USER}@${REMOTE_HOST}:/tmp/
    
    # 在服务器上应用配置
    ssh -i ~/.ssh/$SSH_KEY_NAME ${SSH_USER}@${REMOTE_HOST} << 'REMOTE_SCRIPT'
        # 备份原配置
        echo "$SUDO_PASSWORD" | sudo -S cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)
        
        # 应用新配置
        echo "$SUDO_PASSWORD" | sudo -S tee -a /etc/ssh/sshd_config < /tmp/ssh_security_config > /dev/null
        
        # 验证配置
        echo "$SUDO_PASSWORD" | sudo -S sshd -t
        
        if [[ $? -eq 0 ]]; then
            echo "SSH配置验证成功"
            # 重启SSH服务
            echo "$SUDO_PASSWORD" | sudo -S systemctl restart sshd
            echo "SSH服务重启成功"
        else
            echo "SSH配置验证失败，恢复备份"
            echo "$SUDO_PASSWORD" | sudo -S cp /etc/ssh/sshd_config.backup.$(date +%Y%m%d) /etc/ssh/sshd_config
            exit 1
        fi
REMOTE_SCRIPT
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ SSH安全配置应用成功${NC}"
    else
        echo -e "${RED}✗ SSH安全配置应用失败${NC}"
        exit 1
    fi
    
    # 清理临时文件
    rm -f /tmp/ssh_security_config
}

# 测试SSH连接
test_ssh_connection() {
    echo -e "${GREEN}正在测试SSH密钥连接...${NC}"
    
    if [[ ! -f "~/.ssh/${SSH_KEY_NAME}" ]]; then
        echo -e "${RED}错误: 私钥文件不存在${NC}"
        exit 1
    fi
    
    # 测试连接
    ssh -i ~/.ssh/$SSH_KEY_NAME -o ConnectTimeout=10 -o BatchMode=yes ${SSH_USER}@${REMOTE_HOST} "echo 'SSH密钥认证测试成功'"
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ SSH密钥认证测试成功${NC}"
    else
        echo -e "${RED}✗ SSH密钥认证测试失败${NC}"
        echo -e "${YELLOW}请检查：${NC}"
        echo -e "${YELLOW}1. 公钥是否正确部署到服务器${NC}"
        echo -e "${YELLOW}2. 私钥权限是否正确（600）${NC}"
        echo -e "${YELLOW}3. 服务器SSH配置是否正确${NC}"
        exit 1
    fi
}

# 完整的SSH安全加固流程
harden_ssh() {
    echo -e "${BLUE}开始SSH安全加固流程...${NC}\n"
    
    # 1. 生成SSH密钥
    generate_ssh_key
    echo
    
    # 2. 部署公钥
    deploy_public_key
    echo
    
    # 3. 测试密钥认证
    test_ssh_connection
    echo
    
    # 4. 备份SSH配置
    backup_ssh_config
    echo
    
    # 5. 配置SSH安全设置
    setup_server_ssh
    echo
    
    # 6. 最终测试
    echo -e "${BLUE}进行最终连接测试...${NC}"
    test_ssh_connection
    
    echo -e "\n${GREEN}SSH安全加固完成！${NC}"
    echo -e "${YELLOW}重要提醒：${NC}"
    echo -e "${YELLOW}1. 密码认证已禁用，请确保私钥安全保存${NC}"
    echo -e "${YELLOW}2. 私钥路径: ~/.ssh/${SSH_KEY_NAME}${NC}"
    echo -e "${YELLOW}3. 如需恢复密码认证，请使用备份的配置文件${NC}"
}

# 恢复SSH配置
restore_ssh_config() {
    echo -e "${YELLOW}正在恢复SSH配置...${NC}"
    
    # 列出备份文件
    ssh -i ~/.ssh/$SSH_KEY_NAME ${SSH_USER}@${REMOTE_HOST} "echo '$SUDO_PASSWORD' | sudo -S ls -la ${SSH_CONFIG_FILE}.backup.*"
    
    echo -e "${YELLOW}请输入要恢复的备份文件名（完整路径）:${NC}"
    read -r backup_file
    
    if [[ -n "$backup_file" ]]; then
        ssh -i ~/.ssh/$SSH_KEY_NAME ${SSH_USER}@${REMOTE_HOST} "echo '$SUDO_PASSWORD' | sudo -S cp $backup_file $SSH_CONFIG_FILE && echo '$SUDO_PASSWORD' | sudo -S systemctl restart sshd"
        
        if [[ $? -eq 0 ]]; then
            echo -e "${GREEN}✓ SSH配置恢复成功${NC}"
        else
            echo -e "${RED}✗ SSH配置恢复失败${NC}"
        fi
    fi
}

# 主函数
main() {
    check_dependencies
    
    case ${1:-help} in
        generate-key)
            generate_ssh_key
            ;;
        setup-server)
            load_env
            setup_server_ssh
            ;;
        deploy-key)
            deploy_public_key
            ;;
        test-connection)
            test_ssh_connection
            ;;
        harden-ssh)
            load_env
            harden_ssh
            ;;
        backup-config)
            load_env
            backup_ssh_config
            ;;
        restore-config)
            load_env
            restore_ssh_config
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"