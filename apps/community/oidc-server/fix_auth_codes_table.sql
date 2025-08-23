-- 修复auth_codes表的user_sub字段，允许NULL值
-- 这样可以在用户登录前保存授权码，登录后再更新user_sub

ALTER TABLE auth_codes ALTER COLUMN user_sub DROP NOT NULL;

-- 更新现有的空字符串为NULL
UPDATE auth_codes SET user_sub = NULL WHERE user_sub = '';