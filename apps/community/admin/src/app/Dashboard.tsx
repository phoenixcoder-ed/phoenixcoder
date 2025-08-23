import React from 'react';

import {
  People,
  Code,
  School,
  TrendingUp,
  Assignment,
  EmojiEvents,
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { usePermissions } from '@/shared/managers/PermissionManager';

const Dashboard = () => {
  const { userRole, isLoading } = usePermissions();
  const theme = useTheme();

  if (isLoading) return <div>加载中...</div>;

  // 模拟用户数据
  const user = {
    name:
      userRole === 'super_admin'
        ? '超级管理员'
        : userRole === 'admin'
          ? '管理员'
          : userRole === 'merchant'
            ? '商家'
            : '用户',
    user_type: userRole,
    level: 5,
    points: 350,
  };

  // 卡片通用样式 - PhoenixCoder 宇宙主题
  const cardCommonStyle = {
    height: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(106, 0, 255, 0.2)',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 8px 30px rgba(106, 0, 255, 0.25)',
      border: '1px solid rgba(106, 0, 255, 0.4)',
    },
  };

  // 图标容器样式
  const iconContainerStyle = (color: string) => ({
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${color}20, ${color}40)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${color}60`,
    boxShadow: `0 0 20px ${color}30`,
  });

  // 标题样式
  const titleStyle = {
    fontFamily: '"Orbitron", sans-serif',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    fontSize: '0.9rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  };

  // 数值样式
  const valueStyle = {
    fontFamily: '"JetBrains Mono", monospace',
    fontWeight: 700,
    fontSize: '2.2rem',
    background: 'linear-gradient(135deg, #6A00FF, #00E4FF)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 10px rgba(106, 0, 255, 0.3)',
  };

  // 根据用户类型显示不同的仪表盘内容
  const renderDashboardContent = () => {
    if (!user) return null;

    switch (user.user_type) {
      case 'admin':
      case 'super_admin':
        return (
          <Box sx={{ p: 3 }}>
            {/* 欢迎标题 */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Orbitron", sans-serif',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6A00FF, #00E4FF)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(106, 0, 255, 0.5)',
                  mb: 1,
                }}
              >
                PhoenixCoder 管理中心
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: theme.palette.text.secondary, opacity: 0.8 }}
              >
                欢迎回来，{user.name} 🚀
              </Typography>
            </Box>

            {/* 统计卡片 */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 3,
                mb: 4,
              }}
            >
              <Card sx={cardCommonStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={iconContainerStyle('#6A00FF')}>
                      <People sx={{ fontSize: 28, color: '#6A00FF' }} />
                    </Box>
                    <Box>
                      <Typography sx={titleStyle}>程序员总数</Typography>
                      <Typography sx={valueStyle}>1,254</Typography>
                      <Chip
                        label="+12% 本月"
                        size="small"
                        sx={{
                          background: 'rgba(0, 255, 179, 0.2)',
                          color: '#00FFB3',
                          border: '1px solid rgba(0, 255, 179, 0.3)',
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={cardCommonStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={iconContainerStyle('#00E4FF')}>
                      <Assignment sx={{ fontSize: 28, color: '#00E4FF' }} />
                    </Box>
                    <Box>
                      <Typography sx={titleStyle}>活跃任务</Typography>
                      <Typography sx={valueStyle}>567</Typography>
                      <Chip
                        label="+8% 本周"
                        size="small"
                        sx={{
                          background: 'rgba(0, 228, 255, 0.2)',
                          color: '#00E4FF',
                          border: '1px solid rgba(0, 228, 255, 0.3)',
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={cardCommonStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={iconContainerStyle('#00FFB3')}>
                      <Code sx={{ fontSize: 28, color: '#00FFB3' }} />
                    </Box>
                    <Box>
                      <Typography sx={titleStyle}>技能认证</Typography>
                      <Typography sx={valueStyle}>234</Typography>
                      <Chip
                        label="+15% 本月"
                        size="small"
                        sx={{
                          background: 'rgba(0, 255, 179, 0.2)',
                          color: '#00FFB3',
                          border: '1px solid rgba(0, 255, 179, 0.3)',
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={cardCommonStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={iconContainerStyle('#FF6B6B')}>
                      <TrendingUp sx={{ fontSize: 28, color: '#FF6B6B' }} />
                    </Box>
                    <Box>
                      <Typography sx={titleStyle}>平台收入</Typography>
                      <Typography sx={valueStyle}>¥89K</Typography>
                      <Chip
                        label="+23% 本月"
                        size="small"
                        sx={{
                          background: 'rgba(255, 107, 107, 0.2)',
                          color: '#FF6B6B',
                          border: '1px solid rgba(255, 107, 107, 0.3)',
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* 成长数据展示 */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 3,
              }}
            >
              <Card sx={cardCommonStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      ...titleStyle,
                      fontSize: '1.1rem',
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <School sx={{ color: '#6A00FF' }} />
                    技能成长趋势
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      前端开发
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={85}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(106, 0, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background:
                            'linear-gradient(90deg, #6A00FF, #00E4FF)',
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      后端开发
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={72}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(0, 228, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background:
                            'linear-gradient(90deg, #00E4FF, #00FFB3)',
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      DevOps
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={68}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(0, 255, 179, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background:
                            'linear-gradient(90deg, #00FFB3, #6A00FF)',
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card sx={cardCommonStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      ...titleStyle,
                      fontSize: '1.1rem',
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <EmojiEvents sx={{ color: '#00E4FF' }} />
                    最新成就
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          background:
                            'linear-gradient(135deg, #6A00FF, #00E4FF)',
                          width: 40,
                          height: 40,
                        }}
                      >
                        🏆
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          React 高级认证
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          2小时前
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          background:
                            'linear-gradient(135deg, #00E4FF, #00FFB3)',
                          width: 40,
                          height: 40,
                        }}
                      >
                        🎯
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          完成100个任务
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          1天前
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          background:
                            'linear-gradient(135deg, #00FFB3, #6A00FF)',
                          width: 40,
                          height: 40,
                        }}
                      >
                        🚀
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          技能导师认证
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          3天前
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        );

      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              欢迎来到 PhoenixCoder
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary }}
            >
              您的个人成长之旅即将开始 🚀
            </Typography>
          </Box>
        );
    }
  };

  return <Box sx={{ minHeight: '100vh' }}>{renderDashboardContent()}</Box>;
};

export default Dashboard;
