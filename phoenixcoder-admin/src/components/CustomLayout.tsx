import React, { useState } from 'react';
import { Layout as RALayout, AppBar, Toolbar, MenuItemLink } from 'react-admin';
import { useMediaQuery, useTheme } from '@mui/material';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { Drawer, List, ListItem, ListItemText, ListItemIcon, IconButton, Typography, MenuItem } from '@mui/material';
// 导入所需图标
import SunnyIcon from '@mui/icons-material/Sunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import PeopleIcon from '@mui/icons-material/People';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import XIcon from '@mui/icons-material/X';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MessageIcon from '@mui/icons-material/Message';

// 定义侧边栏菜单项
const menuItems = [
  { name: '仪表盘', icon: <HomeIcon />, path: '/' },
  { name: '用户管理', icon: <PeopleIcon />, path: '/users' },
  { name: '面试题', icon: <MessageIcon />, path: '/interview_questions' },
  { name: '知识库', icon: <FileOpenIcon />, path: '/knowledge_base' },
  { name: '我的成长', icon: <EmojiEventsIcon />, path: '/growth' },
];

const CustomLayout = ({ children, toggleTheme }: { children: React.ReactNode, toggleTheme?: () => void }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme<Theme>();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // 渲染侧边栏菜单
  const renderMenuItems = (
    <List>
      {menuItems.map((item) => (
        <MenuItemLink
                key={item.name}
                to={item.path}
                primaryText={item.name}
                leftIcon={<span style={{ minWidth: '36px', color: theme.palette.primary.main }}>{item.icon}</span>}
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  },
                  padding: '12px 16px',
                  fontSize: '1rem'
                }}
              />
      ))}
    </List>
  );

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 顶部应用栏 */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, boxShadow: 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </IconButton>
            )}
            <Typography variant="h6" noWrap sx={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
              PhoenixCoder
            </Typography>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* 主题切换按钮 */}
            {toggleTheme && (
              <IconButton color="inherit" onClick={toggleTheme} aria-label="切换主题">
                {theme.palette.mode === 'dark' ? <SunnyIcon /> : <DarkModeIcon />}
              </IconButton>
            )}

            {/* 用户信息 */}
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              欢迎回来，开发者
            </Typography>
          </div>
        </Toolbar>
      </AppBar>

      {/* 侧边栏抽屉 */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'block' },
          '& .MuiDrawer-paper': {
            width: isMobile ? '70%' : '240px',
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: theme.palette.background.default,
          },
        }}
      >
        <div style={{ padding: '16px' }} />
        {renderMenuItems}
      </Drawer>

      {/* 主内容区域 */}
      <main
        style={{
          flexGrow: 1,
          padding: '24px',
          marginTop: '64px',
          backgroundColor: theme.palette.background.default,
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default CustomLayout;