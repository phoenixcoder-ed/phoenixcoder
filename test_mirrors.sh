#!/bin/bash

# 测试Docker镜像代理有效性的脚本

# 镜像代理列表
mirrors=("https://eph8xfli.mirror.aliyuncs.com" "https://dockerproxy.com" "https://hub-mirror.c.163.com" "https://mirror.baidubce.com" "https://ccr.ccs.tencentyun.com")

# 测试函数
function test_mirror() {
    local mirror=$1
    echo "测试镜像代理: $mirror"
    
    # 使用curl测试连接
    # -I 只获取头部信息
    # -m 设置超时时间为5秒
    # -s 静默模式
    response=$(curl -I -m 5 -s $mirror)
    
    if [[ $? -eq 0 ]]; then
        # 检查响应状态码
        status_code=$(echo "$response" | grep -o 'HTTP/[0-9.]* [0-9]*' | cut -d ' ' -f 2)
        if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
            echo "✅ 有效: 状态码 $status_code"
        elif [[ $status_code -ge 300 && $status_code -lt 400 ]]; then
            echo "⚠️ 重定向: 状态码 $status_code"
            # 获取重定向地址
            redirect_url=$(echo "$response" | grep -i 'Location' | cut -d ':' -f 2- | tr -d ' ')
            if [[ -n $redirect_url ]]; then
                echo "🔄 重定向到: $redirect_url"
            fi
        else
            echo "❌ 无效: 状态码 $status_code"
        fi
    else
        echo "❌ 连接失败: 超时或无法访问"
    fi
    echo "------------------------------------"
}

# 循环测试所有镜像
for mirror in "${mirrors[@]}"; do
    test_mirror "$mirror"
done

# 额外测试Docker Hub连通性作为参考
#echo "测试Docker Hub (registry-1.docker.io):"
#curl -I -m 5 -s https://registry-1.docker.io
#echo "------------------------------------"

# 输出结果总结
#echo "测试结果总结:" >&2
#grep -E '✅|⚠️|❌' $0 | cut -d ':' -f 1,2 | sort