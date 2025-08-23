-- PostgreSQL数据库初始化脚本
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    sub VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('programmer', 'merchant', 'admin')),
    avatar VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- 创建应用表，用于存储不同客户端应用信息
CREATE TABLE IF NOT EXISTS applications (
    client_id VARCHAR(255) PRIMARY KEY,
    client_secret VARCHAR(255) NOT NULL,
    redirect_uri VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    app_type VARCHAR(50) NOT NULL CHECK (app_type IN ('web', 'app', 'admin', 'miniapp')),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- 创建授权码表
CREATE TABLE IF NOT EXISTS auth_codes (
    code VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL REFERENCES applications(client_id),
    user_sub VARCHAR(255) NOT NULL REFERENCES users(sub),
    redirect_uri VARCHAR(255) NOT NULL,
    scope VARCHAR(255) NOT NULL,
    state VARCHAR(255),
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (client_id) REFERENCES applications(client_id),
    FOREIGN KEY (user_sub) REFERENCES users(sub)
);

-- 创建微信用户关联表
CREATE TABLE IF NOT EXISTS wechat_users (
    openid VARCHAR(255) PRIMARY KEY,
    user_sub VARCHAR(255) NOT NULL REFERENCES users(sub),
    unionid VARCHAR(255),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (user_sub) REFERENCES users(sub)
);

-- 插入初始应用数据
-- 警告：生产环境中请使用强随机密钥替换这些默认值
-- 建议使用 security/generate-keys.sh 生成安全密钥
INSERT INTO applications (client_id, client_secret, redirect_uri, name, description, app_type, created_at, updated_at)
VALUES
('web-client', 'dev-web-client-secret', 'http://localhost:3000/callback', 'Web应用', '网页端应用', 'web', EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT),
('admin-client', 'dev-admin-client-secret', 'http://localhost:8080/callback', '管理端应用', '管理后台应用', 'admin', EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT),
('app-client', 'dev-app-client-secret', 'phoenixcoder://callback', '移动应用', 'App端应用', 'app', EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT),
('miniapp-client', 'dev-miniapp-client-secret', 'https://miniapp.phoenixcoder.com/callback', '小程序应用', '微信小程序应用', 'miniapp', EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT),
('test-client', 'test-client-secret', 'http://localhost:3000/callback', '测试应用', '单元测试用应用', 'web', EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT),
('integration-test-client', 'integration-test-secret', 'http://localhost:3000/callback', '集成测试应用', '集成测试用应用', 'web', EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT);

-- 插入测试用户数据（仅用于测试环境）
INSERT INTO users (sub, email, name, password, user_type, created_at, updated_at)
VALUES
('test_user_1', 'test@example.com', '测试用户', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfm', 'programmer', EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT),
('test_user_2', 'user@example.com', '普通用户', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfm', 'programmer', EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT);

-- 注意：测试用户密码为 admin123，生产环境请删除这些测试数据

-- 插入初始管理员用户
-- 警告：生产环境中请使用强密码并删除默认管理员账户
-- 默认密码：admin123 (已使用bcrypt加密)
INSERT INTO users (sub, email, name, password, user_type, created_at, updated_at)
VALUES
('admin_1', 'admin@example.com', '管理员', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfm', 'admin', EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT);

-- 注意：请使用 bcrypt 加密强密码，不要使用默认的 "password123"
-- 生成密码哈希示例：python -c "import bcrypt; print(bcrypt.hashpw(b'your_strong_password', bcrypt.gensalt()).decode())"