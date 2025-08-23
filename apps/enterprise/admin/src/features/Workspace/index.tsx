import React from 'react';

import {
  AccessTime as TimeIcon,
  Assignment as TaskIcon,
  CheckCircle as CheckIcon,
  Code as CodeIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';

// 模拟用户数据
const currentUser = {
  name: 'Alex Chen',
  avatar: '/avatars/alex.jpg',
  level: 15,
  points: 8750,
  nextLevelPoints: 10000,
  role: '全栈开发工程师',
  onlineStatus: 'online',
};

// 工作统计数据
const workStats = [
  {
    title: '今日任务',
    value: '8',
    total: '12',
    percentage: 67,
    color: '#6A00FF',
    icon: <TaskIcon />,
  },
  {
    title: '本周完成',
    value: '24',
    total: '30',
    percentage: 80,
    color: '#00E4FF',
    icon: <CheckIcon />,
  },
  {
    title: '代码提交',
    value: '156',
    total: '200',
    percentage: 78,
    color: '#00FFB3',
    icon: <CodeIcon />,
  },
  {
    title: '工作时长',
    value: '6.5h',
    total: '8h',
    percentage: 81,
    color: '#FFB347',
    icon: <TimeIcon />,
  },
];

// 待办事项数据
const todoItems = [
  {
    id: 1,
    title: '完成用户认证模块开发',
    priority: 'high',
    deadline: '今天 18:00',
    project: 'PhoenixCoder',
    completed: false,
  },
  {
    id: 2,
    title: '代码审查 - 支付系统',
    priority: 'medium',
    deadline: '明天 10:00',
    project: 'E-Commerce',
    completed: false,
  },
  {
    id: 3,
    title: '更新项目文档',
    priority: 'low',
    deadline: '本周五',
    project: 'API Gateway',
    completed: true,
  },
  {
    id: 4,
    title: '参加技术分享会议',
    priority: 'medium',
    deadline: '明天 14:00',
    project: '团队会议',
    completed: false,
  },
];

// 最近项目数据
const recentProjects = [
  {
    id: 1,
    name: 'PhoenixCoder 平台',
    description: '程序员技能认证与任务平台',
    progress: 85,
    status: 'active',
    lastUpdate: '2小时前',
    tech: ['React', 'Node.js', 'MongoDB'],
  },
  {
    id: 2,
    name: 'E-Commerce API',
    description: '电商平台后端服务',
    progress: 92,
    status: 'review',
    lastUpdate: '1天前',
    tech: ['Python', 'FastAPI', 'PostgreSQL'],
  },
  {
    id: 3,
    name: 'Mobile App',
    description: '移动端应用开发',
    progress: 45,
    status: 'development',
    lastUpdate: '3天前',
    tech: ['React Native', 'TypeScript'],
  },
];

// 移除未使用的通知数据

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return '#FF4444';
    case 'medium':
      return '#FFB347';
    case 'low':
      return '#00FFB3';
    default:
      return '#6A00FF';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return '#00FFB3';
    case 'review':
      return '#FFB347';
    case 'development':
      return '#6A00FF';
    default:
      return '#00E4FF';
  }
};

const Workspace: React.FC = () => {
  return (
    <Box
      sx={{
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 工作台头部 */}
        <Paper
          elevation={0}
          sx={{
            background:
              'linear-gradient(135deg, rgba(106, 0, 255, 0.1), rgba(0, 228, 255, 0.1))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(106, 0, 255, 0.2)',
            borderRadius: '20px',
            p: 4,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={currentUser.avatar}
                sx={{
                  width: 60,
                  height: 60,
                  mr: 3,
                  border: '3px solid',
                  borderImage: 'linear-gradient(135deg, #6A00FF, #00E4FF) 1',
                  boxShadow: '0 0 20px rgba(106, 0, 255, 0.3)',
                }}
              >
                {currentUser.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6A00FF, #00E4FF)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.5,
                  }}
                >
                  我的工作台
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" color="text.secondary">
                    {currentUser.name} • {currentUser.role}
                  </Typography>
                  <Chip
                    label="在线"
                    size="small"
                    sx={{
                      background: 'linear-gradient(135deg, #00FFB3, #00E4FF)',
                      color: 'black',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#00E4FF',
                  '&:hover': { background: 'rgba(0, 228, 255, 0.2)' },
                }}
              >
                <NotificationIcon />
              </IconButton>
              <IconButton
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#6A00FF',
                  '&:hover': { background: 'rgba(106, 0, 255, 0.2)' },
                }}
              >
                <DashboardIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* 工作统计卡片 */}
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            mb: 4,
          }}
        >
          {workStats.map((stat, index) => (
            <Box key={index}>
              <Card
                sx={{
                  background:
                    'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 15px 30px ${stat.color}20`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        color: stat.color,
                        mr: 2,
                        filter: `drop-shadow(0 0 8px ${stat.color}50)`,
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: 'white' }}
                    >
                      {stat.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color: stat.color,
                        fontFamily: '"JetBrains Mono", monospace',
                        mr: 1,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      / {stat.total}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stat.percentage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: stat.color,
                        borderRadius: 3,
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, textAlign: 'right' }}
                  >
                    {stat.percentage}%
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          }}
        >
          {/* 待办事项 */}
          <Box>
            <Card
              sx={{
                background:
                  'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ScheduleIcon
                    sx={{
                      color: '#6A00FF',
                      mr: 2,
                      filter: 'drop-shadow(0 0 8px rgba(106, 0, 255, 0.5))',
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: 'white', flex: 1 }}
                  >
                    待办事项
                  </Typography>
                  <Chip
                    label={`${todoItems.filter((item) => !item.completed).length} 待完成`}
                    size="small"
                    sx={{
                      background: 'rgba(106, 0, 255, 0.2)',
                      color: '#6A00FF',
                      border: '1px solid rgba(106, 0, 255, 0.3)',
                    }}
                  />
                </Box>
                <List sx={{ p: 0 }}>
                  {todoItems.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        background: item.completed
                          ? 'rgba(0, 255, 179, 0.05)'
                          : 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        mb: 2,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        opacity: item.completed ? 0.7 : 1,
                      }}
                    >
                      <ListItemIcon>
                        <CheckIcon
                          sx={{
                            color: item.completed
                              ? '#00FFB3'
                              : 'rgba(255, 255, 255, 0.3)',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                textDecoration: item.completed
                                  ? 'line-through'
                                  : 'none',
                              }}
                            >
                              {item.title}
                            </Typography>
                            <Chip
                              label={item.priority}
                              size="small"
                              sx={{
                                background: `${getPriorityColor(item.priority)}20`,
                                color: getPriorityColor(item.priority),
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {item.project} • {item.deadline}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* 最近项目 */}
          <Box>
            <Card
              sx={{
                background:
                  'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <WorkIcon
                    sx={{
                      color: '#00E4FF',
                      mr: 2,
                      filter: 'drop-shadow(0 0 8px rgba(0, 228, 255, 0.5))',
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: 'white' }}
                  >
                    最近项目
                  </Typography>
                </Box>
                {recentProjects.map((project) => (
                  <Box
                    key={project.id}
                    sx={{
                      p: 3,
                      mb: 2,
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, flex: 1 }}
                      >
                        {project.name}
                      </Typography>
                      <Chip
                        label={project.status}
                        size="small"
                        sx={{
                          background: `${getStatusColor(project.status)}20`,
                          color: getStatusColor(project.status),
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {project.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">进度</Typography>
                        <Typography variant="body2">
                          {project.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            background: getStatusColor(project.status),
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {project.tech.map((tech) => (
                          <Chip
                            key={tech}
                            label={tech}
                            size="small"
                            sx={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: '0.6rem',
                              height: 18,
                            }}
                          />
                        ))}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {project.lastUpdate}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* 快速操作 */}
        <Paper
          elevation={0}
          sx={{
            background:
              'linear-gradient(135deg, rgba(0, 228, 255, 0.1), rgba(0, 255, 179, 0.1))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 228, 255, 0.2)',
            borderRadius: '20px',
            p: 4,
            mt: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: 2,
              background: 'linear-gradient(135deg, #00E4FF, #00FFB3)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🚀 快速操作
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            快速访问常用功能，提升工作效率
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              sx={{
                background: 'linear-gradient(135deg, #6A00FF, #00E4FF)',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(106, 0, 255, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5A00E6, #00D4E6)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(106, 0, 255, 0.4)',
                },
              }}
            >
              新建任务
            </Button>
            <Button
              variant="outlined"
              startIcon={<CodeIcon />}
              sx={{
                borderColor: '#00FFB3',
                color: '#00FFB3',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#00E6A3',
                  color: '#00E6A3',
                  background: 'rgba(0, 255, 179, 0.1)',
                },
              }}
            >
              代码审查
            </Button>
            <Button
              variant="outlined"
              startIcon={<StarIcon />}
              sx={{
                borderColor: '#FFB347',
                color: '#FFB347',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#FFA500',
                  color: '#FFA500',
                  background: 'rgba(255, 179, 71, 0.1)',
                },
              }}
            >
              查看报告
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Workspace;
