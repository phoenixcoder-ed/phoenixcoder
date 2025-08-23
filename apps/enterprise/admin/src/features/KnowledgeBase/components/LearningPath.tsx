import React, { useState, useCallback } from 'react';

import {
  Schedule,
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  CheckCircle,
  RadioButtonUnchecked,
  Timeline,
  EmojiEvents,
  Save,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Autocomplete,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// 学习路径类型
interface LearningPath {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  milestones: Milestone[];
  skills: string[];
  prerequisites: string[];
  createdAt: string;
  updatedAt: string;
}

// 里程碑类型
interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  estimatedHours: number;
  actualHours?: number;
  resources: Resource[];
}

// 学习资源类型
interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'book' | 'course' | 'project';
  url?: string;
  completed: boolean;
}

// 成就类型
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: string;
}

const LearningPath: React.FC = () => {
  const theme = useTheme();

  // 基础状态
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // 对话框状态
  const [openPathDialog, setOpenPathDialog] = useState(false);
  const [openMilestoneDialog, setOpenMilestoneDialog] = useState(false);

  // 表单状态
  const [pathForm, setPathForm] = useState({
    name: '',
    description: '',
    category: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimatedTime: '',
    skills: [] as string[],
    prerequisites: [] as string[],
  });

  // 移除未使用的里程碑编辑状态

  // UI状态
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // 模拟数据
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([
    {
      id: '1',
      name: '全栈开发大师之路',
      description:
        '从零基础到全栈开发专家的完整学习路径，涵盖前端、后端、数据库、部署等全方位技能',
      category: '全栈开发',
      difficulty: 'intermediate',
      estimatedTime: '12个月',
      progress: 65,
      status: 'in_progress',
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Docker'],
      prerequisites: ['JavaScript基础', 'HTML/CSS'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-25',
      milestones: [
        {
          id: '1',
          title: 'JavaScript 进阶',
          description: '掌握ES6+特性、异步编程、模块化等高级概念',
          completed: true,
          completedAt: '2024-01-15',
          estimatedHours: 40,
          actualHours: 35,
          resources: [
            {
              id: '1',
              title: 'JavaScript高级程序设计',
              type: 'book',
              completed: true,
            },
            {
              id: '2',
              title: 'ES6入门教程',
              type: 'article',
              url: 'https://es6.ruanyifeng.com/',
              completed: true,
            },
          ],
        },
        {
          id: '2',
          title: 'React 框架精通',
          description: '深入理解React生态系统，包括Hooks、状态管理、路由等',
          completed: true,
          completedAt: '2024-01-20',
          estimatedHours: 60,
          actualHours: 55,
          resources: [
            {
              id: '3',
              title: 'React官方文档',
              type: 'article',
              url: 'https://react.dev/',
              completed: true,
            },
            {
              id: '4',
              title: 'React实战项目',
              type: 'project',
              completed: true,
            },
          ],
        },
        {
          id: '3',
          title: 'Node.js 后端开发',
          description: '学习服务器端JavaScript开发，包括Express、数据库操作等',
          completed: false,
          estimatedHours: 50,
          resources: [
            { id: '5', title: 'Node.js实战', type: 'book', completed: false },
            {
              id: '6',
              title: 'Express框架教程',
              type: 'course',
              completed: false,
            },
          ],
        },
        {
          id: '4',
          title: '数据库设计与优化',
          description: '掌握关系型和非关系型数据库的设计、查询优化等',
          completed: false,
          estimatedHours: 45,
          resources: [
            { id: '7', title: 'MongoDB实战', type: 'course', completed: false },
            {
              id: '8',
              title: 'SQL优化指南',
              type: 'article',
              completed: false,
            },
          ],
        },
      ],
    },
    {
      id: '2',
      name: 'AI/ML 工程师转型',
      description: '从传统开发转向人工智能和机器学习领域的专业路径',
      category: '人工智能',
      difficulty: 'advanced',
      estimatedTime: '18个月',
      progress: 25,
      status: 'in_progress',
      skills: ['Python', 'TensorFlow', 'PyTorch', '数据分析', '深度学习'],
      prerequisites: ['Python基础', '数学基础', '统计学'],
      createdAt: '2024-01-10',
      updatedAt: '2024-01-24',
      milestones: [
        {
          id: '5',
          title: 'Python 数据科学基础',
          description: '掌握NumPy、Pandas、Matplotlib等数据科学工具',
          completed: true,
          completedAt: '2024-01-22',
          estimatedHours: 80,
          actualHours: 75,
          resources: [
            { id: '9', title: 'Python数据分析', type: 'book', completed: true },
            {
              id: '10',
              title: 'Kaggle入门项目',
              type: 'project',
              completed: true,
            },
          ],
        },
        {
          id: '6',
          title: '机器学习算法',
          description: '理解并实现常见的机器学习算法',
          completed: false,
          estimatedHours: 120,
          resources: [
            { id: '11', title: '机器学习实战', type: 'book', completed: false },
            {
              id: '12',
              title: 'Andrew Ng机器学习课程',
              type: 'course',
              completed: false,
            },
          ],
        },
      ],
    },
    {
      id: '3',
      name: '云原生架构师',
      description: '掌握现代云原生技术栈，成为云架构设计专家',
      category: '云计算',
      difficulty: 'advanced',
      estimatedTime: '15个月',
      progress: 10,
      status: 'not_started',
      skills: ['Kubernetes', 'Docker', 'AWS', '微服务', 'DevOps'],
      prerequisites: ['Linux基础', '网络知识', '容器技术'],
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20',
      milestones: [],
    },
  ]);

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: '初学者',
      description: '完成第一个学习路径',
      icon: '🌱',
      unlockedAt: '2024-01-15',
      category: '成长',
    },
    {
      id: '2',
      title: '坚持者',
      description: '连续学习30天',
      icon: '🔥',
      unlockedAt: '2024-01-20',
      category: '习惯',
    },
    {
      id: '3',
      title: '技能收集者',
      description: '掌握5项新技能',
      icon: '⭐',
      unlockedAt: '2024-01-22',
      category: '技能',
    },
  ]);

  // 可用的技能和分类选项
  const availableSkills = [
    'React',
    'Vue',
    'Angular',
    'Node.js',
    'Python',
    'Java',
    'TypeScript',
    'JavaScript',
    'Docker',
    'Kubernetes',
    'AWS',
    'MongoDB',
    'PostgreSQL',
    'Redis',
    'GraphQL',
    'TensorFlow',
    'PyTorch',
    'Machine Learning',
    'Deep Learning',
    'Data Science',
    'DevOps',
    'CI/CD',
    'Microservices',
    'System Design',
    'Algorithms',
    'Data Structures',
  ];

  const availableCategories = [
    '全栈开发',
    '前端开发',
    '后端开发',
    '移动开发',
    '人工智能',
    '数据科学',
    '云计算',
    'DevOps',
    '系统设计',
    '算法与数据结构',
    '产品管理',
    '项目管理',
  ];

  // 业务逻辑函数
  const showSnackbar = useCallback(
    (
      message: string,
      severity: 'success' | 'error' | 'warning' | 'info' = 'success'
    ) => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const resetPathForm = useCallback(() => {
    setPathForm({
      name: '',
      description: '',
      category: '',
      difficulty: 'beginner',
      estimatedTime: '',
      skills: [],
      prerequisites: [],
    });
  }, []);

  // const resetMilestoneForm = useCallback(() => {
  //   setMilestoneForm({
  //     title: '',
  //     description: '',
  //     estimatedHours: 0,
  //     resources: [],
  //   });
  // }, []);

  // CRUD 操作
  const handleCreatePath = useCallback(async () => {
    if (!pathForm.name.trim() || !pathForm.description.trim()) {
      showSnackbar('请填写必要的路径信息', 'error');
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newPath: LearningPath = {
        id: Date.now().toString(),
        ...pathForm,
        progress: 0,
        status: 'not_started',
        milestones: [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      setLearningPaths((prev) => [...prev, newPath]);
      setOpenPathDialog(false);
      resetPathForm();
      showSnackbar('学习路径创建成功！');
    } catch {
      showSnackbar('创建失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  }, [pathForm, showSnackbar, resetPathForm]);

  const handleUpdatePath = useCallback(async () => {
    if (!editingPath) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedPath = {
        ...editingPath,
        ...pathForm,
        updatedAt: new Date().toISOString().split('T')[0],
      };

      setLearningPaths((prev) =>
        prev.map((path) => (path.id === editingPath.id ? updatedPath : path))
      );

      setOpenPathDialog(false);
      setEditingPath(null);
      resetPathForm();
      showSnackbar('学习路径更新成功！');
    } catch {
      showSnackbar('更新失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  }, [editingPath, pathForm, showSnackbar, resetPathForm]);

  // const handleDeletePath = useCallback(
  //   async (pathId: string) => {
  //     setLoading(true);
  //     try {
  //       await new Promise((resolve) => setTimeout(resolve, 500));

  //       setLearningPaths((prev) => prev.filter((path) => path.id !== pathId));
  //       setOpenDeleteDialog(false);
  //       setSelectedPathForMenu(null);
  //       showSnackbar('学习路径删除成功！');
  //     } catch {
  //       showSnackbar('删除失败，请重试', 'error');
  //     } finally {
  //       setLoading(false);
  //     }
  //   },
  //   [showSnackbar]
  // );

  // const handleToggleMilestone = useCallback(
  //   async (pathId: string, milestoneId: string) => {
  //     setLoading(true);
  //     try {
  //       await new Promise((resolve) => setTimeout(resolve, 300));

  //       setLearningPaths((prev) =>
  //         prev.map((path) => {
  //           if (path.id === pathId) {
  //             const updatedMilestones = path.milestones.map((milestone) => {
  //               if (milestone.id === milestoneId) {
  //                 const completed = !milestone.completed;
  //                 return {
  //                   ...milestone,
  //                   completed,
  //                   completedAt: completed
  //                     ? new Date().toISOString().split('T')[0]
  //                     : undefined,
  //                 };
  //               }
  //               return milestone;
  //             });

  //             const completedCount = updatedMilestones.filter(
  //               (m) => m.completed
  //             ).length;
  //             const progress = Math.round(
  //               (completedCount / updatedMilestones.length) * 100
  //             );

  //             return {
  //               ...path,
  //               milestones: updatedMilestones,
  //               progress,
  //               status:
  //                 progress === 100
  //                   ? 'completed'
  //                   : progress > 0
  //                     ? 'in_progress'
  //                     : 'not_started',
  //               updatedAt: new Date().toISOString().split('T')[0],
  //             };
  //           }
  //           return path;
  //         })
  //       );

  //       showSnackbar('里程碑状态更新成功！');
  //     } catch {
  //       showSnackbar('更新失败，请重试', 'error');
  //     } finally {
  //       setLoading(false);
  //     }
  //   },
  //   [showSnackbar]
  // );

  // const handleStartPath = useCallback(
  //   async (pathId: string) => {
  //     setLoading(true);
  //     try {
  //       await new Promise((resolve) => setTimeout(resolve, 500));

  //       setLearningPaths((prev) =>
  //         prev.map((path) =>
  //           path.id === pathId
  //             ? {
  //                 ...path,
  //                 status: 'in_progress',
  //                 updatedAt: new Date().toISOString().split('T')[0],
  //               }
  //             : path
  //         )
  //       );

  //       showSnackbar('开始学习路径！加油！', 'success');
  //     } catch {
  //       showSnackbar('操作失败，请重试', 'error');
  //     } finally {
  //       setLoading(false);
  //     }
  //   },
  //   [showSnackbar]
  // );

  // 筛选和排序逻辑
  // const filteredAndSortedPaths = React.useMemo(() => {
  //   const filtered = learningPaths.filter((path) => {
  //     const matchesSearch =
  //       path.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       path.description.toLowerCase().includes(searchTerm.toLowerCase());
  //     const matchesCategory =
  //       !filterCategory || path.category === filterCategory;
  //     const matchesDifficulty =
  //       !filterDifficulty || path.difficulty === filterDifficulty;
  //     const matchesStatus = !filterStatus || path.status === filterStatus;

  //     return (
  //       matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
  //     );
  //   });

  //   filtered.sort((a, b) => {
  //     let aValue: unknown = a[sortBy as keyof typeof a];
  //     let bValue: unknown = b[sortBy as keyof typeof b];

  //     if (sortBy === 'progress') {
  //       aValue = a.progress;
  //       bValue = b.progress;
  //     }

  //     if (typeof aValue === 'string' && typeof bValue === 'string') {
  //       aValue = aValue.toLowerCase();
  //       bValue = bValue.toLowerCase();
  //     }

  //     if (sortOrder === 'asc') {
  //       return aValue > bValue ? 1 : -1;
  //     } else {
  //       return aValue < bValue ? 1 : -1;
  //     }
  //   });

  //   return filtered;
  // }, [
  //   learningPaths,
  //   searchTerm,
  //   filterCategory,
  //   filterDifficulty,
  //   filterStatus,
  //   sortBy,
  //   sortOrder,
  // ]);

  // 移除未使用的编辑路径处理函数

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return theme.palette.primary.main;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return theme.palette.grey[500];
      case 'in_progress':
        return theme.palette.primary.main;
      case 'completed':
        return theme.palette.success.main;
      case 'paused':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <RadioButtonUnchecked />;
      case 'in_progress':
        return <PlayArrow />;
      case 'completed':
        return <CheckCircle />;
      case 'paused':
        return <Pause />;
      default:
        return <RadioButtonUnchecked />;
    }
  };

  // 渲染学习路径卡片
  const renderPathCard = (path: LearningPath) => (
    <Card
      key={path.id}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        border: `1px solid ${theme.palette.divider}`,
      }}
      onClick={() => setSelectedPath(path)}
    >
      <CardContent sx={{ flex: 1 }}>
        {/* 头部信息 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Chip
            label={path.category}
            size="small"
            sx={{
              bgcolor: getDifficultyColor(path.difficulty),
              color: 'white',
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(path.status)}
            <Typography variant="caption" color="text.secondary">
              {path.status.replace('_', ' ')}
            </Typography>
          </Box>
        </Box>

        {/* 标题和描述 */}
        <Typography variant="h6" sx={{ mb: 1, fontFamily: 'JetBrains Mono' }}>
          {path.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {path.description}
        </Typography>

        {/* 进度条 */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption">进度</Typography>
            <Typography variant="caption">{path.progress}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={path.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                bgcolor: getStatusColor(path.status),
                borderRadius: 4,
              },
            }}
          />
        </Box>

        {/* 技能标签 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {path.skills.slice(0, 3).map((skill) => (
            <Chip key={skill} label={skill} size="small" variant="outlined" />
          ))}
          {path.skills.length > 3 && (
            <Chip
              label={`+${path.skills.length - 3}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {/* 底部信息 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {path.estimatedTime}
            </Typography>
          </Box>
          <Chip
            label={path.difficulty}
            size="small"
            sx={{
              bgcolor: `${getDifficultyColor(path.difficulty)}20`,
              color: getDifficultyColor(path.difficulty),
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  // 渲染时间轴视图
  const renderTimelineView = () => (
    <Box sx={{ p: 3 }}>
      {learningPaths.map((path) => (
        <Card key={path.id} sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontFamily: 'JetBrains Mono' }}
            >
              {path.name}
            </Typography>
            <Stepper orientation="vertical">
              {path.milestones.map((milestone, index) => (
                <Step key={milestone.id} active={!milestone.completed}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: milestone.completed
                            ? theme.palette.success.main
                            : theme.palette.grey[400],
                        }}
                      >
                        {milestone.completed ? (
                          <CheckCircle sx={{ fontSize: 16 }} />
                        ) : (
                          <Typography variant="caption">{index + 1}</Typography>
                        )}
                      </Avatar>
                    )}
                  >
                    <Typography variant="subtitle1">
                      {milestone.title}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {milestone.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Typography variant="caption">
                        预计: {milestone.estimatedHours}h
                      </Typography>
                      {milestone.actualHours && (
                        <Typography variant="caption">
                          实际: {milestone.actualHours}h
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {milestone.resources.map((resource) => (
                        <Chip
                          key={resource.id}
                          label={resource.title}
                          size="small"
                          variant={resource.completed ? 'filled' : 'outlined'}
                          color={resource.completed ? 'success' : 'default'}
                        />
                      ))}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* 顶部工具栏 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}
        >
          🚀 学习路径规划
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('grid')}
          >
            卡片视图
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('timeline')}
            startIcon={<Timeline />}
          >
            时间轴
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenPathDialog(true)}
          >
            创建路径
          </Button>
        </Box>
      </Box>

      {/* 成就展示 */}
      <Card sx={{ mb: 3, bgcolor: `${theme.palette.primary.main}10` }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <EmojiEvents color="primary" />
            最近成就
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {achievements.map((achievement) => (
              <Chip
                key={achievement.id}
                label={`${achievement.icon} ${achievement.title}`}
                sx={{
                  bgcolor: theme.palette.background.paper,
                  '& .MuiChip-label': { fontFamily: 'JetBrains Mono' },
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* 主内容区域 */}
      {viewMode === 'grid' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 3,
          }}
        >
          {learningPaths.map(renderPathCard)}
        </Box>
      ) : (
        renderTimelineView()
      )}

      {/* 路径详情对话框 */}
      <Dialog
        open={!!selectedPath}
        onClose={() => setSelectedPath(null)}
        maxWidth="lg"
        fullWidth
      >
        {selectedPath && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontFamily: 'JetBrains Mono' }}>
                  {selectedPath.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedPath.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip label={selectedPath.category} color="primary" />
                  <Chip
                    label={selectedPath.difficulty}
                    sx={{
                      bgcolor: getDifficultyColor(selectedPath.difficulty),
                      color: 'white',
                    }}
                  />
                  <Chip label={selectedPath.estimatedTime} variant="outlined" />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={selectedPath.progress}
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                />
              </Box>

              {/* 里程碑列表 */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                学习里程碑
              </Typography>
              <List>
                {selectedPath.milestones.map((milestone, index) => (
                  <React.Fragment key={milestone.id}>
                    <ListItem>
                      <ListItemIcon>
                        {milestone.completed ? (
                          <CheckCircle color="success" />
                        ) : (
                          <RadioButtonUnchecked color="action" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={milestone.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {milestone.description}
                            </Typography>
                            <Typography variant="caption">
                              预计时间: {milestone.estimatedHours}小时
                              {milestone.actualHours &&
                                ` | 实际时间: ${milestone.actualHours}小时`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < selectedPath.milestones.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPath(null)}>关闭</Button>
              <Button variant="contained" startIcon={<PlayArrow />}>
                开始学习
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 创建路径对话框 */}
      <Dialog
        open={openPathDialog}
        onClose={() => setOpenPathDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPath ? '编辑学习路径' : '创建新的学习路径'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="路径名称"
              placeholder="输入学习路径名称"
              fullWidth
              required
              value={pathForm.name}
              onChange={(e) =>
                setPathForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <TextField
              label="路径描述"
              placeholder="描述这个学习路径的目标和内容"
              multiline
              rows={3}
              fullWidth
              required
              value={pathForm.description}
              onChange={(e) =>
                setPathForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>分类</InputLabel>
                <Select
                  value={pathForm.category}
                  onChange={(e) =>
                    setPathForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  {availableCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>难度等级</InputLabel>
                <Select
                  value={pathForm.difficulty}
                  onChange={(e) =>
                    setPathForm((prev) => ({
                      ...prev,
                      difficulty: e.target.value as
                        | 'beginner'
                        | 'intermediate'
                        | 'advanced',
                    }))
                  }
                >
                  <MenuItem value="beginner">初级</MenuItem>
                  <MenuItem value="intermediate">中级</MenuItem>
                  <MenuItem value="advanced">高级</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="预计时长"
                placeholder="如：6个月"
                sx={{ minWidth: 150 }}
                value={pathForm.estimatedTime}
                onChange={(e) =>
                  setPathForm((prev) => ({
                    ...prev,
                    estimatedTime: e.target.value,
                  }))
                }
              />
            </Box>
            <Autocomplete
              multiple
              options={availableSkills}
              value={pathForm.skills}
              onChange={(_, newValue) =>
                setPathForm((prev) => ({ ...prev, skills: newValue }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="技能标签"
                  placeholder="选择相关技能"
                  helperText="选择或输入相关技能"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={option}
                      variant="outlined"
                      label={option}
                      {...tagProps}
                    />
                  );
                })
              }
            />
            <Autocomplete
              multiple
              options={availableSkills}
              value={pathForm.prerequisites}
              onChange={(_, newValue) =>
                setPathForm((prev) => ({ ...prev, prerequisites: newValue }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="前置要求"
                  placeholder="选择前置技能要求"
                  helperText="选择学习此路径需要的前置技能"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={option}
                      variant="outlined"
                      label={option}
                      {...tagProps}
                    />
                  );
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenPathDialog(false);
              setEditingPath(null);
              resetPathForm();
            }}
          >
            取消
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={editingPath ? handleUpdatePath : handleCreatePath}
            disabled={loading}
          >
            {editingPath ? '更新路径' : '创建路径'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 里程碑管理对话框 */}
      <Dialog
        open={openMilestoneDialog}
        onClose={() => setOpenMilestoneDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>添加学习里程碑</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="里程碑标题"
              placeholder="输入里程碑名称"
              fullWidth
              required
            />
            <TextField
              label="详细描述"
              placeholder="描述这个里程碑的学习目标和要求"
              multiline
              rows={3}
              fullWidth
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="预计学习时间"
                placeholder="小时数"
                type="number"
                sx={{ minWidth: 150 }}
                InputProps={{
                  endAdornment: (
                    <Typography variant="body2" color="text.secondary">
                      小时
                    </Typography>
                  ),
                }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>优先级</InputLabel>
                <Select defaultValue="medium">
                  <MenuItem value="low">低</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              学习资源
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  placeholder="资源标题"
                  size="small"
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select defaultValue="article">
                    <MenuItem value="article">文章</MenuItem>
                    <MenuItem value="video">视频</MenuItem>
                    <MenuItem value="book">书籍</MenuItem>
                    <MenuItem value="course">课程</MenuItem>
                    <MenuItem value="project">项目</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  placeholder="链接地址"
                  size="small"
                  sx={{ flex: 1 }}
                />
                <IconButton size="small" color="primary">
                  <Add />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMilestoneDialog(false)}>取消</Button>
          <Button variant="contained" startIcon={<Save />}>
            添加里程碑
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知组件 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LearningPath;
