import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
  TrendingUp,
  Psychology,
  School,
  EmojiEvents,
  Insights,
  Lightbulb,
  Star,
  BookmarkBorder,
  Add,
  Edit,
  Delete,
  Share,
  Bookmark,
  ThumbUpOutlined,
  Sort,
  Search,
  Refresh,
  Download,
  Settings,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Fab,
  Menu,
  ListItemIcon,
  Snackbar,
  Alert,
  Rating,
  Autocomplete,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// 认知维度类型
interface CognitiveDimension {
  name: string;
  value: number;
  trend: number; // 增长趋势 -1到1
  color: string;
  description: string;
  milestones: string[];
}

// 学习记录类型
interface LearningRecord {
  id: string;
  title: string;
  date: string;
  activity: string;
  category: string;
  duration: number; // 分钟
  difficulty: number; // 1-5
  rating: number; // 1-5
  effectiveness: number; // 1-5
  insights: string[];
  notes?: string;
  tags: string[];
  resources?: string[];
  cognitiveGains: { [dimension: string]: number };
}

// 认知里程碑类型
interface CognitiveMilestone {
  id: string;
  title: string;
  description: string;
  achievedAt: string;
  category: string;
  impact: number; // 1-5
  relatedSkills: string[];
  skills: string[];
  reflection?: string;
}

// 思维模式类型
interface ThinkingPattern {
  name: string;
  strength: number;
  examples: string[];
  color: string;
}

const CognitiveGrowth: React.FC = () => {
  const theme = useTheme();

  // 状态管理
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 对话框状态
  const [openMilestoneDialog, setOpenMilestoneDialog] = useState(false);
  const [openLearningDialog, setOpenLearningDialog] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] =
    useState<CognitiveMilestone | null>(null);
  const [editingLearning, setEditingLearning] = useState<LearningRecord | null>(
    null
  );

  // 菜单状态
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // 通知状态
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // 表单状态
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    category: '',
    importance: 3,
    date: new Date().toISOString().split('T')[0],
    skills: [] as string[],
    reflection: '',
  });

  const [learningForm, setLearningForm] = useState({
    title: '',
    category: '',
    duration: 0,
    difficulty: 1,
    rating: 5,
    notes: '',
    tags: [] as string[],
    resources: [] as string[],
  });
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [timeRange, setTimeRange] = useState('6months');

  // 可选项数据
  const availableCategories = [
    '技术学习',
    '项目实践',
    '理论研究',
    '软技能',
    '行业认知',
    '工具掌握',
  ];
  const availableSkills = [
    'JavaScript',
    'TypeScript',
    'React',
    'Vue',
    'Node.js',
    'Python',
    'Java',
    '系统设计',
    '数据结构',
    '算法',
    '数据库',
    '网络安全',
    '云计算',
    '机器学习',
    '项目管理',
    '团队协作',
    '沟通技巧',
    '领导力',
    '创新思维',
    '问题解决',
  ];
  const availableTags = [
    '前端',
    '后端',
    '全栈',
    '移动端',
    '数据科学',
    'DevOps',
    '架构',
    '管理',
  ];

  // 通知函数
  const showSnackbar = useCallback(
    (
      message: string,
      severity: 'success' | 'error' | 'warning' | 'info' = 'success'
    ) => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  // 重置表单
  const resetMilestoneForm = () => {
    setMilestoneForm({
      title: '',
      description: '',
      category: '',
      importance: 3,
      date: new Date().toISOString().split('T')[0],
      skills: [],
      reflection: '',
    });
  };

  const resetLearningForm = () => {
    setLearningForm({
      title: '',
      category: '',
      duration: 0,
      difficulty: 1,
      rating: 5,
      notes: '',
      tags: [],
      resources: [],
    });
  };

  // 处理里程碑操作
  const handleCreateMilestone = useCallback(async () => {
    setLoading(true);
    try {
      // 这里应该调用API创建里程碑
      console.log('创建里程碑:', milestoneForm);
      setOpenMilestoneDialog(false);
      resetMilestoneForm();
      showSnackbar('认知里程碑创建成功！');
    } catch {
      showSnackbar('创建失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  }, [milestoneForm, showSnackbar]);

  const handleUpdateMilestone = useCallback(async () => {
    setLoading(true);
    try {
      // 这里应该调用API更新里程碑
      console.log('更新里程碑:', milestoneForm);
      setOpenMilestoneDialog(false);
      setEditingMilestone(null);
      resetMilestoneForm();
      showSnackbar('认知里程碑更新成功！');
    } catch {
      showSnackbar('更新失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  }, [milestoneForm, showSnackbar]);

  const handleDeleteMilestone = useCallback(
    async (milestoneId: string) => {
      setLoading(true);
      try {
        // 这里应该调用API删除里程碑
        console.log('删除里程碑:', milestoneId);
        showSnackbar('认知里程碑删除成功！');
      } catch {
        showSnackbar('删除失败，请重试', 'error');
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar]
  );

  // 处理学习记录操作
  const handleCreateLearning = useCallback(async () => {
    setLoading(true);
    try {
      // 这里应该调用API创建学习记录
      console.log('创建学习记录:', learningForm);
      setOpenLearningDialog(false);
      resetLearningForm();
      showSnackbar('学习记录创建成功！');
    } catch {
      showSnackbar('创建失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  }, [learningForm, showSnackbar]);

  const handleUpdateLearning = useCallback(async () => {
    setLoading(true);
    try {
      // 这里应该调用API更新学习记录
      console.log('更新学习记录:', learningForm);
      setOpenLearningDialog(false);
      setEditingLearning(null);
      resetLearningForm();
      showSnackbar('学习记录更新成功！');
    } catch {
      showSnackbar('更新失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  }, [learningForm, showSnackbar]);

  // 编辑处理
  const handleEditMilestone = useCallback((milestone: CognitiveMilestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      title: milestone.title,
      description: milestone.description,
      category: milestone.category,
      importance: milestone.impact,
      date: milestone.achievedAt,
      skills: milestone.skills,
      reflection: milestone.reflection || '',
    });
    setOpenMilestoneDialog(true);
  }, []);

  const handleEditLearning = useCallback((learning: LearningRecord) => {
    setEditingLearning(learning);
    setLearningForm({
      title: learning.title,
      category: learning.category,
      duration: learning.duration,
      difficulty: learning.difficulty,
      rating: learning.rating,
      notes: learning.notes || '',
      tags: learning.tags,
      resources: learning.resources || [],
    });
    setOpenLearningDialog(true);
  }, []);
  const [selectedDimension, setSelectedDimension] = useState('all');

  // 认知维度数据
  const [cognitiveDimensions] = useState<CognitiveDimension[]>([
    {
      name: '逻辑思维',
      value: 85,
      trend: 0.15,
      color: '#3F51B5',
      description: '分析问题、推理和解决复杂问题的能力',
      milestones: ['掌握算法思维', '系统架构设计', '复杂问题分解'],
    },
    {
      name: '创新思维',
      value: 78,
      trend: 0.22,
      color: '#E91E63',
      description: '产生新想法、创造性解决问题的能力',
      milestones: ['原创项目设计', '技术方案创新', '跨领域思考'],
    },
    {
      name: '系统思维',
      value: 72,
      trend: 0.18,
      color: '#4CAF50',
      description: '整体性、关联性思考问题的能力',
      milestones: ['架构全局观', '业务系统理解', '技术生态认知'],
    },
    {
      name: '批判思维',
      value: 80,
      trend: 0.12,
      color: '#FF9800',
      description: '质疑、分析和评估信息的能力',
      milestones: ['技术选型评估', '代码审查能力', '方案优劣分析'],
    },
    {
      name: '学习能力',
      value: 88,
      trend: 0.25,
      color: '#9C27B0',
      description: '快速掌握新知识和技能的能力',
      milestones: ['快速上手新技术', '知识迁移应用', '自主学习规划'],
    },
    {
      name: '抽象思维',
      value: 75,
      trend: 0.2,
      color: '#607D8B',
      description: '从具体事物中提取本质和规律的能力',
      milestones: ['设计模式理解', '数学建模', '概念抽象'],
    },
  ]);

  // 学习记录数据
  const [learningRecords] = useState<LearningRecord[]>([
    {
      id: '1',
      title: '深入学习React Hooks原理',
      date: '2024-01-25',
      activity: '深入学习React Hooks原理',
      category: '技术学习',
      duration: 180,
      difficulty: 4,
      rating: 5,
      effectiveness: 4,
      insights: ['理解了闭包在Hooks中的应用', '掌握了自定义Hook的设计模式'],
      notes: '通过实际项目练习加深了对Hooks的理解',
      tags: ['React', 'Hooks', '前端'],
      resources: ['React官方文档', '相关技术博客'],
      cognitiveGains: { 逻辑思维: 2, 抽象思维: 3, 系统思维: 1 },
    },
    {
      id: '2',
      title: '设计微服务架构方案',
      date: '2024-01-24',
      activity: '设计微服务架构方案',
      category: '架构设计',
      duration: 240,
      difficulty: 5,
      rating: 5,
      effectiveness: 5,
      insights: ['学会了服务拆分的边界划分', '理解了分布式系统的复杂性'],
      notes: '结合实际业务场景设计了完整的微服务架构',
      tags: ['微服务', '架构', '后端'],
      resources: ['微服务设计模式', '分布式系统原理'],
      cognitiveGains: { 系统思维: 4, 批判思维: 2, 创新思维: 3 },
    },
    {
      id: '3',
      title: '算法竞赛题目练习',
      date: '2024-01-23',
      activity: '算法竞赛题目练习',
      category: '算法训练',
      duration: 120,
      difficulty: 3,
      rating: 4,
      effectiveness: 3,
      insights: ['提升了动态规划的理解', '学会了时间复杂度优化技巧'],
      notes: '通过大量练习提升了算法思维能力',
      tags: ['算法', '动态规划', '竞赛'],
      resources: ['LeetCode', '算法导论'],
      cognitiveGains: { 逻辑思维: 3, 抽象思维: 2 },
    },
  ]);

  // 认知里程碑数据
  const [cognitiveMilestones] = useState<CognitiveMilestone[]>([
    {
      id: '1',
      title: '突破算法思维瓶颈',
      description:
        '在解决复杂算法问题时实现了思维模式的转变，从暴力解法转向优雅的数学思维',
      achievedAt: '2024-01-20',
      category: '逻辑思维',
      impact: 5,
      relatedSkills: ['动态规划', '贪心算法', '数学建模'],
      skills: ['动态规划', '贪心算法', '数学建模'],
    },
    {
      id: '2',
      title: '系统架构设计顿悟',
      description:
        '在设计大型系统时领悟了"分而治之"的精髓，能够从业务角度思考技术架构',
      achievedAt: '2024-01-15',
      category: '系统思维',
      impact: 4,
      relatedSkills: ['微服务', '领域驱动设计', '系统设计'],
      skills: ['微服务', '领域驱动设计', '系统设计'],
    },
    {
      id: '3',
      title: '跨领域知识融合',
      description: '将心理学原理应用到用户体验设计中，实现了技术与人文的结合',
      achievedAt: '2024-01-10',
      category: '创新思维',
      impact: 4,
      relatedSkills: ['用户体验', '心理学', '产品设计'],
      skills: ['用户体验', '心理学', '产品设计'],
    },
  ]);

  // 思维模式数据
  const [thinkingPatterns] = useState<ThinkingPattern[]>([
    {
      name: '第一性原理',
      strength: 85,
      examples: ['从基础概念推导复杂系统', '质疑既有假设', '回归问题本质'],
      color: '#3F51B5',
    },
    {
      name: '系统性思考',
      strength: 78,
      examples: ['考虑全局影响', '识别关键节点', '理解反馈循环'],
      color: '#4CAF50',
    },
    {
      name: '类比推理',
      strength: 82,
      examples: ['跨领域知识迁移', '模式识别', '经验复用'],
      color: '#E91E63',
    },
    {
      name: '逆向思维',
      strength: 75,
      examples: ['从结果推导过程', '反向验证', '换位思考'],
      color: '#FF9800',
    },
  ]);

  // 绘制认知发展趋势图
  const drawCognitiveTrend = useCallback(() => {
    const canvas = chartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // 绘制坐标轴
    ctx.strokeStyle = theme.palette.divider;
    ctx.lineWidth = 1;

    // Y轴
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // X轴
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // 绘制网格线
    for (let i = 1; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.strokeStyle = theme.palette.divider;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // 绘制认知维度趋势线
    cognitiveDimensions.forEach((dimension) => {
      const color = dimension.color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      // 模拟历史数据点
      const dataPoints = [];
      for (let i = 0; i <= 10; i++) {
        const x = padding + (chartWidth / 10) * i;
        const baseValue = dimension.value - dimension.trend * 20;
        const value =
          baseValue + (dimension.trend * 20 * i) / 10 + Math.sin(i) * 5;
        const y = height - padding - (value / 100) * chartHeight;
        dataPoints.push({ x, y });
      }

      // 绘制趋势线
      ctx.beginPath();
      dataPoints.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      // 绘制数据点
      dataPoints.forEach((point) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // 绘制标签
    ctx.fillStyle = theme.palette.text.primary;
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'center';

    // Y轴标签
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (chartHeight / 5) * i;
      ctx.fillText((i * 20).toString(), padding - 20, y + 4);
    }

    // X轴标签（时间）
    const timeLabels = [
      '6月前',
      '5月前',
      '4月前',
      '3月前',
      '2月前',
      '1月前',
      '现在',
    ];
    for (let i = 0; i < timeLabels.length; i++) {
      const x = padding + (chartWidth / 6) * i;
      ctx.save();
      ctx.translate(x, height - padding + 20);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(timeLabels[i], 0, 0);
      ctx.restore();
    }
  }, [cognitiveDimensions, theme]);

  useEffect(() => {
    drawCognitiveTrend();
  }, [cognitiveDimensions, theme, drawCognitiveTrend]);

  // 获取趋势图标
  const getTrendIcon = (trend: number) => {
    if (trend > 0.1) return <TrendingUp sx={{ color: '#4CAF50' }} />;
    if (trend < -0.1)
      return (
        <TrendingUp sx={{ color: '#F44336', transform: 'rotate(180deg)' }} />
      );
    return <TrendingUp sx={{ color: '#FF9800', transform: 'rotate(90deg)' }} />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 标题区域 */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ mb: 1, fontFamily: 'JetBrains Mono' }}
            >
              认知成长分析
            </Typography>
            <Typography variant="body1" color="text.secondary">
              追踪个人认知发展轨迹，分析学习模式与思维成长
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="刷新数据">
              <IconButton onClick={() => window.location.reload()}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="导出报告">
              <IconButton>
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="设置">
              <IconButton onClick={() => setOpenSettingsDialog(true)}>
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 导航标签 */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="认知概览" />
          <Tab label="学习记录" />
          <Tab label="思维分析" />
          <Tab label="成长统计" />
        </Tabs>

        {/* 搜索和筛选工具栏 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="搜索认知内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>分类筛选</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="分类筛选"
            >
              <MenuItem value="">全部</MenuItem>
              {availableCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>排序方式</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="排序方式"
            >
              <MenuItem value="date">日期</MenuItem>
              <MenuItem value="importance">重要性</MenuItem>
              <MenuItem value="category">分类</MenuItem>
            </Select>
          </FormControl>
          <IconButton
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Sort />
          </IconButton>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>时间范围</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="时间范围"
            >
              <MenuItem value="1month">1个月</MenuItem>
              <MenuItem value="3months">3个月</MenuItem>
              <MenuItem value="6months">6个月</MenuItem>
              <MenuItem value="1year">1年</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>认知维度</InputLabel>
            <Select
              value={selectedDimension}
              onChange={(e) => setSelectedDimension(e.target.value)}
              label="认知维度"
            >
              <MenuItem value="all">全部</MenuItem>
              {cognitiveDimensions.map((dim) => (
                <MenuItem key={dim.name} value={dim.name}>
                  {dim.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', lg: 'row' },
        }}
      >
        {/* 认知维度概览 */}
        <Box sx={{ flex: { xs: 1, lg: 2 } }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Psychology color="primary" />
                认知维度发展趋势
              </Typography>
              <canvas
                ref={chartRef}
                width={800}
                height={400}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px',
                }}
              />
            </CardContent>
          </Card>

          {/* 认知维度详情 */}
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Insights color="primary" />
                认知能力详情
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 2,
                }}
              >
                {cognitiveDimensions.map((dimension) => (
                  <Paper
                    key={dimension.name}
                    sx={{
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderLeft: `4px solid ${dimension.color}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontFamily: 'JetBrains Mono' }}
                      >
                        {dimension.name}
                      </Typography>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {getTrendIcon(dimension.trend)}
                        <Typography
                          variant="h6"
                          sx={{ color: dimension.color }}
                        >
                          {dimension.value}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {dimension.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {dimension.milestones.map((milestone) => (
                        <Chip
                          key={milestone}
                          label={milestone}
                          size="small"
                          sx={{
                            bgcolor: `${dimension.color}20`,
                            color: dimension.color,
                          }}
                        />
                      ))}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 右侧面板 */}
        <Box sx={{ flex: { xs: 1, lg: 1 } }}>
          {/* 思维模式分析 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Lightbulb color="primary" />
                思维模式强度
              </Typography>
              {thinkingPatterns.map((pattern) => (
                <Box key={pattern.name} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'JetBrains Mono' }}
                    >
                      {pattern.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pattern.strength}%
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 6,
                      bgcolor: theme.palette.divider,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${pattern.strength}%`,
                        height: '100%',
                        bgcolor: pattern.color,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    {pattern.examples.slice(0, 2).map((example) => (
                      <Typography
                        key={example}
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        • {example}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* 认知里程碑 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <EmojiEvents color="primary" />
                认知里程碑
              </Typography>
              <List dense>
                {cognitiveMilestones.map((milestone) => (
                  <React.Fragment key={milestone.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            width: 32,
                            height: 32,
                          }}
                        >
                          <Star sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontFamily: 'JetBrains Mono' }}
                            >
                              {milestone.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="编辑">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditMilestone(milestone)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="删除">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDeleteMilestone(milestone.id)
                                  }
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              {milestone.description}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {milestone.achievedAt}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {[...Array(milestone.impact)].map((_, i) => (
                                  <Star
                                    key={i}
                                    sx={{ fontSize: 12, color: '#FFD700' }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {cognitiveMilestones.indexOf(milestone) <
                      cognitiveMilestones.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* 最近学习活动 */}
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <School color="primary" />
                最近学习活动
              </Typography>
              <List dense>
                {learningRecords.slice(0, 3).map((record) => (
                  <React.Fragment key={record.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.secondary.main,
                            width: 32,
                            height: 32,
                          }}
                        >
                          <BookmarkBorder sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="subtitle2">
                              {record.activity}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="编辑">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditLearning(record)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="点赞">
                                <IconButton size="small">
                                  <ThumbUpOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {record.date} • {record.duration}分钟
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                              {[...Array(record.effectiveness)].map((_, i) => (
                                <Star
                                  key={i}
                                  sx={{ fontSize: 10, color: '#FFD700' }}
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {learningRecords.slice(0, 3).indexOf(record) < 2 && (
                      <Divider />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 浮动操作按钮 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Fab
          color="primary"
          onClick={() => setOpenMilestoneDialog(true)}
          sx={{ mb: 1 }}
        >
          <EmojiEvents />
        </Fab>
        <Fab color="secondary" onClick={() => setOpenLearningDialog(true)}>
          <Add />
        </Fab>
      </Box>

      {/* 认知里程碑对话框 */}
      <Dialog
        open={openMilestoneDialog}
        onClose={() => {
          setOpenMilestoneDialog(false);
          setEditingMilestone(null);
          resetMilestoneForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingMilestone ? '编辑认知里程碑' : '添加认知里程碑'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="里程碑标题"
              value={milestoneForm.title}
              onChange={(e) =>
                setMilestoneForm({ ...milestoneForm, title: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="详细描述"
              value={milestoneForm.description}
              onChange={(e) =>
                setMilestoneForm({
                  ...milestoneForm,
                  description: e.target.value,
                })
              }
              multiline
              rows={3}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>分类</InputLabel>
              <Select
                value={milestoneForm.category}
                onChange={(e) =>
                  setMilestoneForm({
                    ...milestoneForm,
                    category: e.target.value,
                  })
                }
                label="分类"
              >
                {availableCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography gutterBottom>重要程度</Typography>
              <Slider
                value={milestoneForm.importance}
                onChange={(_, value) =>
                  setMilestoneForm({
                    ...milestoneForm,
                    importance: value as number,
                  })
                }
                min={1}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            <TextField
              label="日期"
              type="date"
              value={milestoneForm.date}
              onChange={(e) =>
                setMilestoneForm({ ...milestoneForm, date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Autocomplete
              multiple
              options={availableSkills}
              value={milestoneForm.skills}
              onChange={(_, newValue) =>
                setMilestoneForm({ ...milestoneForm, skills: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="相关技能"
                  placeholder="选择技能"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index: value.indexOf(option) })}
                    key={option}
                  />
                ))
              }
            />
            <TextField
              label="反思总结"
              value={milestoneForm.reflection}
              onChange={(e) =>
                setMilestoneForm({
                  ...milestoneForm,
                  reflection: e.target.value,
                })
              }
              multiline
              rows={2}
              fullWidth
              placeholder="这个里程碑给你带来了什么启发？"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenMilestoneDialog(false);
              setEditingMilestone(null);
              resetMilestoneForm();
            }}
          >
            取消
          </Button>
          <Button
            onClick={
              editingMilestone ? handleUpdateMilestone : handleCreateMilestone
            }
            variant="contained"
            disabled={
              loading || !milestoneForm.title || !milestoneForm.description
            }
          >
            {loading ? '保存中...' : editingMilestone ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 学习记录对话框 */}
      <Dialog
        open={openLearningDialog}
        onClose={() => {
          setOpenLearningDialog(false);
          setEditingLearning(null);
          resetLearningForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingLearning ? '编辑学习记录' : '添加学习记录'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="学习内容"
              value={learningForm.title}
              onChange={(e) =>
                setLearningForm({ ...learningForm, title: e.target.value })
              }
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>分类</InputLabel>
              <Select
                value={learningForm.category}
                onChange={(e) =>
                  setLearningForm({ ...learningForm, category: e.target.value })
                }
                label="分类"
              >
                {availableCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="学习时长（分钟）"
              type="number"
              value={learningForm.duration}
              onChange={(e) =>
                setLearningForm({
                  ...learningForm,
                  duration: parseInt(e.target.value) || 0,
                })
              }
              fullWidth
            />
            <Box>
              <Typography gutterBottom>难度等级</Typography>
              <Slider
                value={learningForm.difficulty}
                onChange={(_, value) =>
                  setLearningForm({
                    ...learningForm,
                    difficulty: value as number,
                  })
                }
                min={1}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            <Box>
              <Typography gutterBottom>学习效果评分</Typography>
              <Rating
                value={learningForm.rating}
                onChange={(_, value) =>
                  setLearningForm({ ...learningForm, rating: value || 5 })
                }
                size="large"
              />
            </Box>
            <Autocomplete
              multiple
              options={availableTags}
              value={learningForm.tags}
              onChange={(_, newValue) =>
                setLearningForm({ ...learningForm, tags: newValue })
              }
              renderInput={(params) => (
                <TextField {...params} label="标签" placeholder="添加标签" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index: value.indexOf(option) })}
                    key={option}
                  />
                ))
              }
            />
            <TextField
              label="学习笔记"
              value={learningForm.notes}
              onChange={(e) =>
                setLearningForm({ ...learningForm, notes: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
              placeholder="记录学习过程中的重要发现和思考..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenLearningDialog(false);
              setEditingLearning(null);
              resetLearningForm();
            }}
          >
            取消
          </Button>
          <Button
            onClick={
              editingLearning ? handleUpdateLearning : handleCreateLearning
            }
            variant="contained"
            disabled={loading || !learningForm.title}
          >
            {loading ? '保存中...' : editingLearning ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 设置对话框 */}
      <Dialog
        open={openSettingsDialog}
        onClose={() => setOpenSettingsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>认知分析设置</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="启用自动数据分析"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="显示趋势预测"
            />
            <FormControlLabel control={<Switch />} label="启用学习提醒" />
            <FormControl fullWidth>
              <InputLabel>默认时间范围</InputLabel>
              <Select defaultValue="6months" label="默认时间范围">
                <MenuItem value="1month">1个月</MenuItem>
                <MenuItem value="3months">3个月</MenuItem>
                <MenuItem value="6months">6个月</MenuItem>
                <MenuItem value="1year">1年</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="数据导出格式"
              select
              defaultValue="json"
              fullWidth
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="pdf">PDF报告</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettingsDialog(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={() => setOpenSettingsDialog(false)}
          >
            保存设置
          </Button>
        </DialogActions>
      </Dialog>

      {/* 右键菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>编辑</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          <ListItemText>分享</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Bookmark fontSize="small" />
          </ListItemIcon>
          <ListItemText>收藏</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>删除</ListItemText>
        </MenuItem>
      </Menu>

      {/* 通知栏 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CognitiveGrowth;
