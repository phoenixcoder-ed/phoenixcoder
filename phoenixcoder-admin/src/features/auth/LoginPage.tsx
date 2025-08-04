import React, { useState } from 'react';
import { useLogin, useTranslate } from 'react-admin';
import { Button, Card, CardContent, TextField, Typography, Box, Tabs, Tab, FormControlLabel, Checkbox }
  from '@mui/material';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'programmer' | 'merchant' | 'admin'>('programmer');
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [rememberMe, setRememberMe] = useState(false);
  const login = useLogin();
  const t = useTranslate();
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({
        email: loginType === 'email' ? email : undefined,
        phone: loginType === 'phone' ? phone : undefined,
        password,
        login_type: loginType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      // 调用注册API
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phone,
          name,
          password,
          user_type: userType,
        }),
      });

      if (!response.ok) {
        throw new Error('注册失败');
      }

      // 注册成功后自动登录
      await login({
        email,
        password,
        login_type: 'email',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            PhoenixCoder 登录
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            centered
            sx={{ mb: 4 }}
          >
            <Tab label="登录" />
            <Tab label="注册" />
          </Tabs>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {activeTab === 0 ? (
            <form onSubmit={handleLogin}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={loginType === 'email'}
                    onChange={() => setLoginType('email')}
                    name="loginType"
                  />
                }
                label="邮箱登录"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={loginType === 'phone'}
                    onChange={() => setLoginType('phone')}
                    name="loginType"
                  />
                }
                label="手机号登录"
                sx={{ mb: 2 }}
              />

              {loginType === 'email' ? (
                <TextField
                  label="邮箱"
                  type="email"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 2 }}
                />
              ) : (
                <TextField
                  label="手机号"
                  type="tel"
                  fullWidth
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  sx={{ mb: 2 }}
                />
              )}

              <TextField
                label="密码"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    name="rememberMe"
                  />
                }
                label="记住我"
                sx={{ mb: 2 }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                登录
              </Button>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="body2">
                  还没有账号？{' '}
                  <Button
                    variant="text"
                    onClick={() => setActiveTab(1)}
                    sx={{ p: 0, minWidth: 'auto' }}
                  >
                    立即注册
                  </Button>
                </Typography>
              </Box>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <TextField
                label="邮箱"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                helperText="选填，用于找回密码"
              />

              <TextField
                label="手机号"
                type="tel"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{ mb: 2 }}
                helperText="选填，用于登录和找回密码"
              />

              <TextField
                label="用户名"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                label="密码"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                label="确认密码"
                type="password"
                fullWidth
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                选择用户类型:
              </Typography>
              <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={userType === 'programmer'}
                      onChange={() => setUserType('programmer')}
                      name="userType"
                    />
                  }
                  label="程序员"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={userType === 'merchant'}
                      onChange={() => setUserType('merchant')}
                      name="userType"
                    />
                  }
                  label="商家"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={userType === 'admin'}
                      onChange={() => setUserType('admin')}
                      name="userType"
                    />
                  }
                  label="管理员"
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                注册
              </Button>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="body2">
                  已有账号？{' '}
                  <Button
                    variant="text"
                    onClick={() => setActiveTab(0)}
                    sx={{ p: 0, minWidth: 'auto' }}
                  >
                    立即登录
                  </Button>
                </Typography>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;