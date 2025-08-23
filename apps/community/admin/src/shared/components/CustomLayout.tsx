import React, { useState, useMemo } from 'react';

import { useLogout } from 'react-admin';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Dashboard as DashboardIcon,
  DarkMode as DarkModeIcon,
  ExitToApp as ExitToAppIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  WbSunny as SunnyIcon,
  Code as CodeIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem as MuiMenuItem,
  Toolbar,
  Typography,
  useTheme,
  Chip,
} from '@mui/material';

import { useAuth } from '@/contexts/AuthContext';
import { useGlobalStore } from '@/shared/store/globalStore';

import { NotificationSystem } from './NotificationSystem';
import UserPreferences from './UserPreferences';

interface Theme {
  palette: {
    mode: 'light' | 'dark';
  };
  breakpoints: {
    down: (key: string) => string;
  };
}

const menuItems = [
  {
    text: '工作台首页',
    icon: <DashboardIcon />,
    path: '/home',
    color: '#6A00FF',
  },
  {
    text: '我的任务',
    icon: <AssignmentIcon />,
    path: '/tasks',
    color: '#00E4FF',
  },
  {
    text: '我的项目',
    icon: <CodeIcon />,
    path: '/projects',
    color: '#00FFB3',
  },
  {
    text: '我的IP档案',
    icon: <PersonIcon />,
    path: '/profile',
    color: '#FF6B6B',
  },
  {
    text: '技能成长',
    icon: <SchoolIcon />,
    path: '/skills',
    color: '#FFB347',
  },
  {
    text: '我的认证',
    icon: <EmojiEventsIcon />,
    path: '/certifications',
    color: '#9C27B0',
  },
  {
    text: '挑战任务',
    icon: <SecurityIcon />,
    path: '/challenges',
    color: '#4CAF50',
  },
  {
    text: '数据分析',
    icon: <AnalyticsIcon />,
    path: '/analytics',
    color: '#607D8B',
  },
  {
    text: '系统设置',
    icon: <SettingsIcon />,
    path: '/settings',
    color: '#795548',
  },
];

const CustomLayout = ({
  children,
  toggleTheme,
}: {
  children: React.ReactNode;
  toggleTheme?: () => void;
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const theme = useTheme<Theme>();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { toggleTheme: globalToggleTheme, ui } = useGlobalStore();
  const unreadNotifications = useMemo(
    () => (ui.notifications || []).filter((notification) => !notification.read),
    [ui.notifications]
  );

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  // 获取用户类型显示文本
  const getUserTypeText = (userType: string) => {
    const typeMap: Record<string, string> = {
      admin: '管理员',
      developer: '开发者',
      client: '客户',
      user: '用户',
    };
    return typeMap[userType] || userType;
  };

  const currentUser = useMemo(() => {
    if (!isAuthenticated || !user) {
      return {
        name: 'Guest',
        avatar: '',
        email: '',
        role: '访客',
        department: '',
        userId: '',
        permissions: [],
        isOnline: false,
        level: 0,
        points: 0,
      };
    }

    return {
      name: user.name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3D5AFE&color=fff&size=40`,
      email: user.email,
      role: getUserTypeText(user.user_type),
      department: '技术部',
      userId: user.id,
      permissions: ['用户管理', '系统设置', '数据分析', '技能认证'],
      isOnline: true,
      level: 5,
      points: 1250,
    };
  }, [user, isAuthenticated]);

  const drawerStyle = useMemo(
    () => ({
      background:
        'linear-gradient(180deg, rgba(13, 13, 23, 0.95) 0%, rgba(26, 26, 46, 0.98) 100%)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(106, 0, 255, 0.3)',
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          'url("data:image/svg+xml,%3Csvg width=\\"40\\" height=\\"40\\" viewBox=\\"0 0 40 40\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cg fill=\\"none\\" fill-rule=\\"evenodd\\"%3E%3Cg fill=\\"%236A00FF\\" fill-opacity=\\"0.02\\"%3E%3Cpath d=\\"M20 20l20-20v40z\\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        zIndex: -1,
      },
    }),
    []
  );

  const drawer = (
    <Box sx={drawerStyle}>
      <Toolbar
        sx={{
          background:
            'linear-gradient(135deg, rgba(106, 0, 255, 0.1), rgba(0, 228, 255, 0.1))',
          borderBottom: '1px solid rgba(106, 0, 255, 0.2)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: '100%',
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6A00FF, #00E4FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(106, 0, 255, 0.5)',
            }}
          >
            <CodeIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6A00FF, #00E4FF)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PhoenixCoder
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(106, 0, 255, 0.2)' }} />
      <List sx={{ p: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                background:
                  location.pathname === item.path
                    ? `linear-gradient(135deg, ${item.color}30, ${item.color}20)`
                    : 'rgba(255, 255, 255, 0.02)',
                border:
                  location.pathname === item.path
                    ? `1px solid ${item.color}60`
                    : '1px solid transparent',
                '&:hover': {
                  background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                  border: `1px solid ${item.color}40`,
                  transform: 'translateX(8px)',
                  boxShadow: `0 4px 20px ${item.color}30`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: item.color,
                  minWidth: 40,
                  '& .MuiSvgIcon-root': {
                    filter: `drop-shadow(0 0 8px ${item.color}50)`,
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    color:
                      theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: 'calc(100% - 240px)' },
          ml: { sm: '240px' },
          background:
            'linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(13, 13, 23, 0.98))',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(106, 0, 255, 0.2)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="打开抽屉"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: 'none' },
              '&:hover': {
                background: 'rgba(106, 0, 255, 0.2)',
                boxShadow: '0 0 15px rgba(106, 0, 255, 0.4)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #6A00FF, #00E4FF)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            程序员工作台
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`Lv.${currentUser.level}`}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #6A00FF, #00E4FF)',
                color: 'white',
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 600,
                boxShadow: '0 0 10px rgba(106, 0, 255, 0.4)',
              }}
            />

            <IconButton
              color="inherit"
              aria-label="通知"
              sx={{
                '&:hover': {
                  background: 'rgba(0, 228, 255, 0.2)',
                  boxShadow: '0 0 15px rgba(0, 228, 255, 0.4)',
                },
              }}
            >
              <Badge badgeContent={unreadNotifications.length} color="error">
                <NotificationsIcon
                  sx={{ filter: 'drop-shadow(0 0 8px rgba(0, 228, 255, 0.5))' }}
                />
              </Badge>
            </IconButton>

            <IconButton
              color="inherit"
              onClick={toggleTheme || globalToggleTheme}
              aria-label="切换主题"
              sx={{
                '&:hover': {
                  background: 'rgba(255, 183, 71, 0.2)',
                  boxShadow: '0 0 15px rgba(255, 183, 71, 0.4)',
                },
              }}
            >
              {theme.palette.mode === 'dark' ? (
                <SunnyIcon
                  sx={{
                    filter: 'drop-shadow(0 0 8px rgba(255, 183, 71, 0.5))',
                  }}
                />
              ) : (
                <DarkModeIcon
                  sx={{ filter: 'drop-shadow(0 0 8px rgba(106, 0, 255, 0.5))' }}
                />
              )}
            </IconButton>

            <IconButton
              size="large"
              edge="end"
              aria-label="用户账户"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{
                '&:hover': {
                  background: 'rgba(0, 255, 179, 0.2)',
                  boxShadow: '0 0 15px rgba(0, 255, 179, 0.4)',
                },
              }}
            >
              <Avatar
                src={currentUser.avatar}
                alt={currentUser.name}
                sx={{
                  width: 36,
                  height: 36,
                  border: '2px solid rgba(106, 0, 255, 0.5)',
                  boxShadow: '0 0 15px rgba(106, 0, 255, 0.3)',
                }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 360,
            maxWidth: 400,
            borderRadius: '16px',
            background:
              'linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(13, 13, 23, 0.98))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(106, 0, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid rgba(106, 0, 255, 0.2)',
            background:
              'linear-gradient(135deg, rgba(106, 0, 255, 0.1), rgba(0, 228, 255, 0.1))',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={currentUser.avatar}
              alt={currentUser.name}
              sx={{
                width: 64,
                height: 64,
                mr: 2,
                border: '3px solid rgba(106, 0, 255, 0.5)',
                boxShadow: '0 0 20px rgba(106, 0, 255, 0.4)',
              }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontFamily: '"Orbitron", sans-serif',
                    background: 'linear-gradient(135deg, #6A00FF, #00E4FF)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {currentUser.name}
                </Typography>
                {currentUser.isOnline && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00FFB3, #00E4FF)',
                      ml: 1,
                      boxShadow: '0 0 10px rgba(0, 255, 179, 0.6)',
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {currentUser.role}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`Lv.${currentUser.level}`}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #6A00FF, #00E4FF)',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
                <Chip
                  label={`${currentUser.points} pts`}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #00E4FF, #00FFB3)',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ py: 1 }}>
          <MuiMenuItem
            onClick={handleMenuClose}
            sx={{
              px: 3,
              py: 1.5,
              '&:hover': {
                background: 'rgba(106, 0, 255, 0.1)',
              },
            }}
          >
            <PersonIcon sx={{ mr: 2, fontSize: 20, color: '#6A00FF' }} />
            <Typography>个人资料</Typography>
          </MuiMenuItem>

          <MuiMenuItem
            onClick={handleMenuClose}
            sx={{
              px: 3,
              py: 1.5,
              '&:hover': {
                background: 'rgba(0, 228, 255, 0.1)',
              },
            }}
          >
            <SettingsIcon sx={{ mr: 2, fontSize: 20, color: '#00E4FF' }} />
            <Typography>账户设置</Typography>
          </MuiMenuItem>

          <MuiMenuItem
            onClick={() => {
              setPreferencesOpen(true);
              handleMenuClose();
            }}
            sx={{
              px: 3,
              py: 1.5,
              '&:hover': {
                background: 'rgba(0, 255, 179, 0.1)',
              },
            }}
          >
            <SecurityIcon sx={{ mr: 2, fontSize: 20, color: '#00FFB3' }} />
            <Typography>偏好设置</Typography>
          </MuiMenuItem>

          <Divider sx={{ borderColor: 'rgba(106, 0, 255, 0.2)', my: 1 }} />

          <MuiMenuItem
            onClick={handleLogout}
            sx={{
              px: 3,
              py: 1.5,
              '&:hover': {
                background: 'rgba(255, 107, 107, 0.1)',
              },
            }}
          >
            <ExitToAppIcon sx={{ mr: 2, fontSize: 20, color: '#FF6B6B' }} />
            <Typography>退出登录</Typography>
          </MuiMenuItem>
        </Box>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: 240 }, flexShrink: { sm: 0 } }}
        aria-label="navigation menu"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 240,
              ...drawerStyle,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 240,
              ...drawerStyle,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: 'calc(100% - 240px)' },
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, rgba(13, 13, 23, 0.95) 0%, rgba(26, 26, 46, 0.9) 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url("data:image/svg+xml,%3Csvg width=\\"60\\" height=\\"60\\" viewBox=\\"0 0 60 60\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cg fill=\\"none\\" fill-rule=\\"evenodd\\"%3E%3Cg fill=\\"%236A00FF\\" fill-opacity=\\"0.03\\"%3E%3Ccircle cx=\\"30\\" cy=\\"30\\" r=\\"1\\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            zIndex: -1,
          },
        }}
      >
        <Toolbar />
        {children}
      </Box>

      <UserPreferences
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />

      <NotificationSystem />
    </Box>
  );
};

export default CustomLayout;
