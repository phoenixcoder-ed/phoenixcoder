# 构建阶段
FROM node:24.4.1-alpine AS builder

# 安装必要的构建工具和依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# 安装pnpm并使用国内镜像源加速依赖安装
RUN npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（包括开发依赖，因为需要构建）
# 添加重试机制和错误处理
RUN pnpm install --frozen-lockfile || \
    (echo "First pnpm install failed, retrying..." && \
     pnpm store prune && \
     pnpm install --frozen-lockfile)

# 复制源代码
COPY . .

# 构建应用
# 添加构建错误处理和详细日志
RUN set -e && \
    echo "Starting build process..." && \
    pnpm run build && \
    echo "Build completed successfully" && \
    ls -la dist/ || (echo "Build failed or dist directory not found" && exit 1)

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]