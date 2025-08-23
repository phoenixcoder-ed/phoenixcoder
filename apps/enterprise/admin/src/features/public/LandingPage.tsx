import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  Menu as MenuIcon,
  Code,
  Assignment,
  EmojiEvents,
  Group,
  Add,
  GitHub,
  Twitter,
  LinkedIn,
  Facebook,
} from '@mui/icons-material';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const features = [
    {
      icon: <Code sx={{ fontSize: 40, color: '#7B61FF' }} />,
      title: '技能图谱',
      description: '可视化展示您的技术栈和成长轨迹',
    },
    {
      icon: <Assignment sx={{ fontSize: 40, color: '#FFA940' }} />,
      title: 'IP档案',
      description: '构建您的专业技术档案和作品集',
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 40, color: '#00ffb3' }} />,
      title: '挑战任务',
      description: '参与编程挑战，提升技能获得认证',
    },
    {
      icon: <Add sx={{ fontSize: 40, color: '#ff6b6b' }} />,
      title: '发布新任务',
      description: '发布项目需求，寻找合适的开发者',
    },
    {
      icon: <Group sx={{ fontSize: 40, color: '#4ecdc4' }} />,
      title: '社区主页',
      description: '与全球开发者交流分享经验',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* 导航栏 */}
      <AppBar
        position="fixed"
        sx={{
          background: 'rgba(30, 30, 47, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #7B61FF, #FFA940)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PhoenixCoder
          </Typography>

          {/* 桌面端导航 */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            <Button color="inherit" onClick={() => navigate('/features')}>
              功能
            </Button>
            <Button color="inherit" onClick={() => navigate('/pricing')}>
              定价
            </Button>
            <Button color="inherit" onClick={() => navigate('/about')}>
              关于
            </Button>
            <Button
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: '#7B61FF',
                  background: 'rgba(123, 97, 255, 0.1)',
                },
              }}
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #7B61FF, #FFA940)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #6B51E5, #E8932A)',
                },
              }}
              onClick={() => navigate('/register')}
            >
              注册
            </Button>
          </Box>

          {/* 移动端菜单按钮 */}
          <IconButton
            sx={{ display: { xs: 'block', md: 'none' }, color: 'white' }}
            onClick={handleMobileMenuOpen}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 移动端菜单 */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMenuClose}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <MenuItem onClick={() => navigate('/features')}>功能</MenuItem>
        <MenuItem onClick={() => navigate('/pricing')}>定价</MenuItem>
        <MenuItem onClick={() => navigate('/about')}>关于</MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/login');
          }}
        >
          登录
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/register');
          }}
        >
          注册
        </MenuItem>
      </Menu>

      {/* 英雄区域 */}
      <Box
        sx={{
          background:
            'linear-gradient(135deg, #1e1e2f 0%, #2d2d44 50%, #1e1e2f 100%)',
          color: 'white',
          pt: 12,
          pb: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 'bold',
              mb: 3,
              background: 'linear-gradient(45deg, #7B61FF, #FFA940)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            连接全球开发者
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              color: 'rgba(255, 255, 255, 0.8)',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            在PhoenixCoder平台上展示技能、接受挑战、构建未来
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                background: 'linear-gradient(45deg, #7B61FF, #FFA940)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #6B51E5, #E8932A)',
                },
              }}
              onClick={() => navigate('/register')}
            >
              开始使用
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: '#7B61FF',
                  background: 'rgba(123, 97, 255, 0.1)',
                },
              }}
              onClick={() => navigate('/demo')}
            >
              查看演示
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* 特色功能 */}
      <Box sx={{ py: 8, background: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              mb: 2,
              color: '#1e1e2f',
            }}
          >
            核心功能
          </Typography>
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              color: '#666',
              mb: 6,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            为开发者量身打造的专业平台
          </Typography>

          <Stack spacing={4}>
            {features.map((feature, index) => (
              <Card
                key={index}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    {feature.icon}
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 'bold', color: '#1e1e2f' }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ color: '#666', lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* CTA区域 */}
      <Box
        sx={{
          background:
            'linear-gradient(135deg, #1e1e2f 0%, #2d2d44 50%, #1e1e2f 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              mb: 3,
              background: 'linear-gradient(45deg, #7B61FF, #FFA940)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            准备开始您的编程之旅？
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 4,
              fontSize: '1.2rem',
            }}
          >
            加入数千名开发者，在PhoenixCoder平台上展示才华、学习成长
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              background: 'linear-gradient(45deg, #7B61FF, #FFA940)',
              '&:hover': {
                background: 'linear-gradient(45deg, #6B51E5, #E8932A)',
              },
            }}
            onClick={() => navigate('/register')}
          >
            立即注册
          </Button>
        </Container>
      </Box>

      {/* 页脚 */}
      <Box sx={{ background: '#1e1e2f', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  background: 'linear-gradient(45deg, #7B61FF, #FFA940)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                PhoenixCoder
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                连接全球开发者的专业平台
              </Typography>
            </Box>

            <Stack direction="row" spacing={3}>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: '#6a00ff', mb: 2, fontWeight: 'bold' }}
                >
                  产品
                </Typography>
                <Stack spacing={1}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    技能图谱
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    挑战任务
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    社区
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: '#6a00ff', mb: 2, fontWeight: 'bold' }}
                >
                  公司
                </Typography>
                <Stack spacing={1}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    关于我们
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    联系我们
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    隐私政策
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: '#6a00ff', mb: 2, fontWeight: 'bold' }}
                >
                  支持
                </Typography>
                <Stack spacing={1}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    帮助中心
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    API文档
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    状态页面
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: '#6a00ff', mb: 2, fontWeight: 'bold' }}
                >
                  社交媒体
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <GitHub />
                  </IconButton>
                  <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <Twitter />
                  </IconButton>
                  <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <LinkedIn />
                  </IconButton>
                  <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <Facebook />
                  </IconButton>
                </Stack>
              </Box>
            </Stack>
          </Stack>

          <Box
            sx={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              mt: 4,
              pt: 4,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              © 2024 PhoenixCoder. 保留所有权利。
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
