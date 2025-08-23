import express from 'express';
import cors from 'cors';
const app = express();
const port = 8000;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟用户数据
const mockUsers = {
  github: {
    id: 'github_123456',
    name: 'GitHub 用户',
    email: 'github.user@example.com',
    username: 'github_user',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GitHub',
    provider: 'github',
    role: 'developer',
    level: 'Senior',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    points: 2500,
    completedTasks: 45,
    rating: 4.8,
  },
  wechat: {
    id: 'wechat_789012',
    name: '微信用户',
    email: 'wechat.user@example.com',
    username: 'wechat_user',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WeChat',
    provider: 'wechat',
    role: 'designer',
    level: 'Intermediate',
    skills: ['UI/UX', 'Figma', 'Photoshop'],
    points: 1800,
    completedTasks: 32,
    rating: 4.6,
  },
  google: {
    id: 'google_345678',
    name: 'Google 用户',
    email: 'google.user@example.com',
    username: 'google_user',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Google',
    provider: 'google',
    role: 'developer',
    level: 'Mid',
    skills: ['Angular', 'TypeScript', 'Firebase'],
    points: 2100,
    completedTasks: 38,
    rating: 4.7,
  },
};

// OAuth回调处理
app.post('/api/auth/oauth/callback', (req, res) => {
  try {
    const { provider, code, state, userInfo } = req.body;
    
    console.log(`收到 ${provider} OAuth 回调:`, { code, state });
    
    // 验证必要参数
    if (!provider || !code) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }
    
    // 获取模拟用户数据
    const user = mockUsers[provider];
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '不支持的OAuth提供商',
      });
    }
    
    // 生成JWT token (模拟)
    const token = `jwt_${provider}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const refreshToken = `refresh_${provider}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // 返回成功响应
    res.json({
      success: true,
      user,
      token,
      refreshToken,
      message: `${provider} 登录成功`,
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

// 普通登录
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('收到登录请求:', { email });
    
    // 检查是否是OAuth登录
    if (password && password.startsWith('oauth_')) {
      const provider = password.split('_')[1];
      const user = mockUsers[provider];
      
      if (user && user.email === email) {
        const token = `jwt_${provider}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        return res.json({
          success: true,
          user,
          token,
          message: `${provider} 登录成功`,
        });
      }
    }
    
    // 普通登录逻辑
    if (email === 'admin@example.com' && password === 'admin123') {
      const user = {
        id: 'admin_001',
        name: '管理员',
        email: 'admin@example.com',
        username: 'admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        provider: 'local',
        role: 'admin',
        level: 'Expert',
        skills: ['Management', 'Strategy', 'Leadership'],
        points: 5000,
        completedTasks: 100,
        rating: 5.0,
      };
      
      const token = `jwt_local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      return res.json({
        success: true,
        user,
        token,
        message: '登录成功',
      });
    }
    
    res.status(401).json({
      success: false,
      message: '邮箱或密码错误',
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

// 获取用户信息
app.get('/api/auth/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证token',
      });
    }
    
    // 从token中解析provider (模拟)
    const tokenParts = token.split('_');
    const provider = tokenParts[1];
    
    const user = mockUsers[provider] || {
      id: 'admin_001',
      name: '管理员',
      email: 'admin@example.com',
      username: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      provider: 'local',
      role: 'admin',
      level: 'Expert',
      skills: ['Management', 'Strategy', 'Leadership'],
      points: 5000,
      completedTasks: 100,
      rating: 5.0,
    };
    
    res.json({
      success: true,
      user,
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

// 刷新token
app.post('/api/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: '未提供refresh token',
      });
    }
    
    // 生成新的token (模拟)
    const tokenParts = refreshToken.split('_');
    const provider = tokenParts[1];
    const newToken = `jwt_${provider}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newRefreshToken = `refresh_${provider}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

// 登出
app.post('/api/auth/logout', (req, res) => {
  try {
    // 在实际项目中，这里应该将token加入黑名单
    res.json({
      success: true,
      message: '登出成功',
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'OAuth Mock Server',
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 OAuth Mock Server 运行在 http://localhost:${port}`);
  console.log('📋 可用的API端点:');
  console.log('  POST /api/auth/oauth/callback - OAuth回调处理');
  console.log('  POST /api/auth/login - 用户登录');
  console.log('  GET  /api/auth/profile - 获取用户信息');
  console.log('  POST /api/auth/refresh - 刷新token');
  console.log('  POST /api/auth/logout - 用户登出');
  console.log('  GET  /api/health - 健康检查');
  console.log('');
  console.log('🔐 测试账号:');
  console.log('  邮箱: admin@example.com');
  console.log('  密码: admin123');
  console.log('');
  console.log('🌐 支持的OAuth提供商: GitHub, 微信, Google');
});