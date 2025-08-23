import React, { useState } from 'react';

import { useNotify } from 'react-admin';
import { useNavigate } from 'react-router-dom';

import './LoginPage.css';

import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  GitHub,
  Google,
  ArrowBack,
  Person,
  Phone,
  QrCode,
} from '@mui/icons-material';
import { Typography, Box, Button, IconButton, Container } from '@mui/material';

import { AVATAR_SERVICES } from '../../config/oauth';
import { useAuth } from '../../contexts/AuthContext';
import { oauthService } from '../../services/oauthService';

const LoginPage = () => {
  const [loginIdentifier, setLoginIdentifier] = useState(''); // 支持用户名/邮箱/手机号
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'email' | 'phone' | 'username'>(
    'email'
  ); // 当前选择的登录方式
  const [showWeChatQR, setShowWeChatQR] = useState(false);
  const [wechatQRStatus, setWechatQRStatus] = useState('waiting'); // waiting, scanned, confirmed, expired

  const notify = useNotify();
  const navigate = useNavigate();
  const { login } = useAuth();

  // 智能识别输入类型
  const detectInputType = (input: string): 'email' | 'phone' | 'username' => {
    // 邮箱格式检测
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // 手机号格式检测（中国大陆）
    const phoneRegex = /^1[3-9]\d{9}$/;

    if (emailRegex.test(input)) {
      return 'email';
    } else if (phoneRegex.test(input)) {
      return 'phone';
    } else {
      // 其他情况按用户名处理
      return 'username';
    }
  };

  // 获取当前登录方式的图标
  const getLoginIcon = () => {
    switch (loginType) {
      case 'email':
        return <Email className="input-icon" />;
      case 'phone':
        return <Phone className="input-icon" />;
      case 'username':
        return <Person className="input-icon" />;
      default:
        return <Email className="input-icon" />;
    }
  };

  // 获取当前登录方式的占位符
  const getPlaceholder = () => {
    switch (loginType) {
      case 'email':
        return '请输入邮箱地址';
      case 'phone':
        return '请输入手机号码';
      case 'username':
        return '请输入用户名';
      default:
        return '请输入邮箱地址';
    }
  };

  // 获取当前登录方式的输入类型
  const getInputType = () => {
    switch (loginType) {
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      case 'username':
        return 'text';
      default:
        return 'email';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 检测输入类型（智能识别或使用用户选择的类型）
      const detectedType = detectInputType(loginIdentifier);
      const actualType =
        loginType === 'email' && detectedType !== 'email'
          ? detectedType
          : loginType;

      // 模拟登录API调用
      const loginData = {
        [actualType]: loginIdentifier,
        password,
        rememberMe,
        loginType: actualType,
      };

      console.log('登录数据:', loginData);

      // 模拟API延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 模拟登录成功
      const mockUser = {
        id: '1',
        name: '张三',
        email:
          actualType === 'email' ? loginIdentifier : 'zhangsan@example.com',
        phone: actualType === 'phone' ? loginIdentifier : '13800138000',
        username: actualType === 'username' ? loginIdentifier : 'zhangsan',
        avatar: `${AVATAR_SERVICES.dicebear}?seed=Zhang`,
        role: 'developer',
        level: 'Senior',
        skills: ['React', 'TypeScript', 'Node.js'],
        points: 2580,
        completedTasks: 42,
        rating: 4.8,
      };

      // 保存用户信息到localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock-jwt-token-' + Date.now());

      if (rememberMe) {
        localStorage.setItem('rememberLogin', 'true');
      }

      // 调用登录方法
      await login(loginData);

      notify(
        `使用${actualType === 'email' ? '邮箱' : actualType === 'phone' ? '手机号' : '用户名'}登录成功！`,
        { type: 'success' }
      );

      // 跳转到首页
      navigate('/');
    } catch (error) {
      console.error('登录失败:', error);
      setError('登录失败，请检查您的凭据');
      notify('登录失败，请检查您的凭据', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleThirdPartyLogin = async (provider: string) => {
    setLoading(true);
    try {
      switch (provider) {
        case 'GitHub':
          await handleGitHubLogin();
          break;
        case '微信':
          await handleWeChatLogin();
          break;
        case 'Google':
          await handleGoogleLogin();
          break;
        default:
          notify(`${provider} 登录功能开发中`, { type: 'info' });
      }
    } catch (error) {
      console.error(`${provider} 登录失败:`, error);
      notify(`${provider} 登录失败`, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // GitHub 登录处理
  const handleGitHubLogin = async () => {
    try {
      setLoading(true);

      // 检查OAuth配置
      if (!oauthService.isConfigured('github')) {
        notify('GitHub OAuth 配置不完整，请联系管理员', { type: 'error' });
        return;
      }

      // 生成OAuth授权URL
      const authUrl = oauthService.getAuthUrl('github');

      notify('正在跳转到 GitHub 授权页面...', { type: 'info' });

      // 跳转到GitHub授权页面
      window.location.href = authUrl;
    } catch (error) {
      console.error('GitHub 登录失败:', error);
      notify('GitHub 登录失败，请重试', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 微信登录处理
  const handleWeChatLogin = async () => {
    try {
      setLoading(true);
      setShowWeChatQR(true);
      setWechatQRStatus('generating');

      // 检查OAuth配置
      if (!oauthService.isConfigured('wechat')) {
        notify('微信 OAuth 配置不完整，请联系管理员', { type: 'error' });
        setShowWeChatQR(false);
        return;
      }

      // 生成微信二维码登录URL
      oauthService.getWeChatQRUrl();
      setWechatQRStatus('waiting');

      // 开始轮询检查扫码状态
      const pollInterval = setInterval(async () => {
        try {
          const status = await oauthService.checkWeChatQRStatus();

          if (status === 'scanned') {
            setWechatQRStatus('scanned');
          } else if (status === 'confirmed') {
            setWechatQRStatus('confirmed');
            clearInterval(pollInterval);

            // 处理微信登录回调
            const userInfo = await oauthService.handleWeChatCallback();

            // 保存用户信息
            localStorage.setItem('user', JSON.stringify(userInfo));
            localStorage.setItem('token', userInfo.token);
            localStorage.setItem('loginProvider', 'wechat');

            await login({
              email: userInfo.email,
              password: 'wechat_oauth_login',
            });
            notify('微信登录成功！', { type: 'success' });
            navigate('/');
          }
        } catch (error) {
          console.error('检查微信扫码状态失败:', error);
          clearInterval(pollInterval);
          throw error;
        }
      }, 2000);

      // 设置超时
      setTimeout(() => {
        clearInterval(pollInterval);
        if (wechatQRStatus === 'waiting' || wechatQRStatus === 'scanned') {
          notify('二维码已过期，请重新获取', { type: 'warning' });
          setShowWeChatQR(false);
          setWechatQRStatus('waiting');
        }
      }, 300000); // 5分钟超时
    } catch (error) {
      console.error('微信登录失败:', error);
      notify('微信登录失败，请重试', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Google 登录处理
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // 检查OAuth配置
      if (!oauthService.isConfigured('google')) {
        notify('Google OAuth 配置不完整，请联系管理员', { type: 'error' });
        return;
      }

      // 生成OAuth授权URL
      const authUrl = oauthService.getAuthUrl('google');

      notify('正在跳转到 Google 授权页面...', { type: 'info' });

      // 跳转到Google授权页面
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google 登录失败:', error);
      notify('Google 登录失败，请重试', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-background">
      {/* 粒子背景动画 */}
      <div className="login-particle-background"></div>
      {/* 导航栏 */}
      <div
        className="login-navbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={() => navigate('/')}
            sx={{ color: 'white', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #7B61FF, #FFA940)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PhoenixCoder
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate('/register')}
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: '#7B61FF',
              background: 'rgba(123, 97, 255, 0.1)',
            },
          }}
        >
          注册账户
        </Button>
      </div>

      {/* 主要内容 */}
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <div
          className="login-card"
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <div className="login-card-content">
            {/* 标题 */}
            <div className="login-title-container">
              <h1 className="login-title">欢迎回来</h1>
              <p className="login-subtitle">登录您的账户以继续</p>
            </div>

            {/* 登录表单 */}
            <form onSubmit={handleLogin}>
              {/* 登录方式选择 */}
              <div className="login-type-selector">
                <button
                  type="button"
                  className={`login-type-btn ${loginType === 'email' ? 'active' : ''}`}
                  onClick={() => setLoginType('email')}
                >
                  <Email className="type-icon" />
                  邮箱
                </button>
                <button
                  type="button"
                  className={`login-type-btn ${loginType === 'phone' ? 'active' : ''}`}
                  onClick={() => setLoginType('phone')}
                >
                  <Phone className="type-icon" />
                  手机
                </button>
                <button
                  type="button"
                  className={`login-type-btn ${loginType === 'username' ? 'active' : ''}`}
                  onClick={() => setLoginType('username')}
                >
                  <Person className="type-icon" />
                  用户名
                </button>
              </div>

              <div className="input-group">
                {getLoginIcon()}
                <input
                  type={getInputType()}
                  placeholder={getPlaceholder()}
                  className="login-input"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                />
              </div>

              <div className="input-group">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="密码"
                  className="login-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </div>

              {/* 记住密码和忘记密码 */}
              <div className="login-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="login-checkbox"
                  />
                  <span className="checkmark"></span>
                  记住密码
                </label>
                <a href="#" className="forgot-password-link">
                  忘记密码？
                </a>
              </div>

              {/* 错误信息 */}
              {error && <div className="error-message">{error}</div>}

              {/* 登录按钮 */}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </button>
            </form>

            {/* 分割线 */}
            <div className="divider">
              <span className="divider-text">或使用第三方登录</span>
            </div>

            {/* 微信二维码登录 */}
            {showWeChatQR && (
              <div className="wechat-qr-container">
                <div className="wechat-qr-code">
                  <QrCode style={{ fontSize: '160px', color: '#07c160' }} />
                </div>
                <div className="wechat-qr-tip">
                  {wechatQRStatus === 'waiting' && '请使用微信扫描二维码'}
                  {wechatQRStatus === 'scanned' && '扫描成功，请在手机上确认'}
                  {wechatQRStatus === 'confirmed' && '登录确认中...'}
                  {wechatQRStatus === 'expired' && '二维码已过期，请重新获取'}
                </div>
                <div className="wechat-qr-status">
                  {wechatQRStatus === 'waiting' && '等待扫码...'}
                  {wechatQRStatus === 'scanned' && '已扫描'}
                  {wechatQRStatus === 'confirmed' && '已确认'}
                  {wechatQRStatus === 'expired' && '已过期'}
                </div>
                <button
                  className="back-btn"
                  onClick={() => setShowWeChatQR(false)}
                >
                  返回登录
                </button>
              </div>
            )}

            {/* 第三方登录 */}
            {!showWeChatQR && (
              <div className="third-party-login">
                <button
                  className="third-party-btn github-btn"
                  onClick={() => handleThirdPartyLogin('GitHub')}
                  disabled={loading}
                >
                  <GitHub />
                  GitHub
                </button>
                <button
                  className="third-party-btn wechat-btn"
                  onClick={() => handleThirdPartyLogin('微信')}
                  disabled={loading}
                >
                  <QrCode />
                  微信扫码
                </button>
                <button
                  className="third-party-btn google-btn"
                  onClick={() => handleThirdPartyLogin('Google')}
                  disabled={loading}
                >
                  <Google />
                  Google
                </button>
              </div>
            )}

            {/* 注册链接 */}
            <div className="register-link-container">
              <p className="register-text">
                还没有账户？{' '}
                <span
                  className="register-link"
                  onClick={() => navigate('/register')}
                >
                  立即注册
                </span>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default LoginPage;
