import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';

import { logger } from '@/shared/utils/logger';

// 任务状态类型
type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

// 任务类型
interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: TaskStatus;
  budget: number;
  deadline: string;
  publisherId: string;
  publisherName: string;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
  skillsRequired: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

// 状态颜色映射
const statusColors: Record<
  TaskStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
  disputed: 'secondary',
};

// 状态标签映射
const statusLabels: Record<TaskStatus, string> = {
  pending: '待接单',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  disputed: '争议中',
};

/**
 * 任务列表组件
 */
const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 模拟数据
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'React前端开发项目',
        description:
          '需要开发一个企业级React应用，包含用户管理、数据可视化等功能',
        category: 'frontend',
        status: 'pending',
        budget: 5000,
        deadline: '2024-02-15',
        publisherId: 'pub1',
        publisherName: '科技公司A',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        skillsRequired: ['React', 'TypeScript', 'Material-UI'],
        difficulty: 'intermediate',
      },
      {
        id: '2',
        title: 'Python数据分析脚本',
        description: '编写Python脚本进行销售数据分析和可视化',
        category: 'data_analysis',
        status: 'in_progress',
        budget: 2000,
        deadline: '2024-02-10',
        publisherId: 'pub2',
        publisherName: '零售公司B',
        assigneeId: 'dev1',
        assigneeName: '张开发',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-20',
        skillsRequired: ['Python', 'Pandas', 'Matplotlib'],
        difficulty: 'beginner',
      },
      {
        id: '3',
        title: 'Node.js后端API开发',
        description: '开发RESTful API，包含用户认证、数据CRUD等功能',
        category: 'backend',
        status: 'completed',
        budget: 8000,
        deadline: '2024-01-30',
        publisherId: 'pub3',
        publisherName: '创业公司C',
        assigneeId: 'dev2',
        assigneeName: '李后端',
        createdAt: '2024-01-05',
        updatedAt: '2024-01-30',
        skillsRequired: ['Node.js', 'Express', 'MongoDB'],
        difficulty: 'advanced',
      },
    ];

    setTimeout(() => {
      setTasks(mockTasks);
      setTotalPages(Math.ceil(mockTasks.length / 10));
      setLoading(false);
    }, 1000);
  }, []);

  // 处理页面变化
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  // 处理查看详情
  const handleViewTask = (taskId: string) => {
    navigate(`/tasks/detail/${taskId}`);
  };

  // 处理编辑任务
  const handleEditTask = (taskId: string) => {
    logger.debug('编辑任务:', taskId);
  };

  // 处理删除任务
  const handleDeleteTask = (taskId: string) => {
    logger.debug('删除任务:', taskId);
  };

  // 过滤任务
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || task.status === statusFilter;
    const matchesCategory =
      categoryFilter === 'all' || task.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 搜索和过滤器 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="搜索任务"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>状态</InputLabel>
          <Select
            value={statusFilter}
            label="状态"
            onChange={(e) =>
              setStatusFilter(e.target.value as TaskStatus | 'all')
            }
          >
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="pending">待接单</MenuItem>
            <MenuItem value="in_progress">进行中</MenuItem>
            <MenuItem value="completed">已完成</MenuItem>
            <MenuItem value="cancelled">已取消</MenuItem>
            <MenuItem value="disputed">争议中</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>分类</InputLabel>
          <Select
            value={categoryFilter}
            label="分类"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="frontend">前端开发</MenuItem>
            <MenuItem value="backend">后端开发</MenuItem>
            <MenuItem value="mobile">移动开发</MenuItem>
            <MenuItem value="data_analysis">数据分析</MenuItem>
            <MenuItem value="design">UI/UX设计</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 任务列表 */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
        }}
      >
        {filteredTasks.map((task) => (
          <Box key={task.id}>
            <Card
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ flexGrow: 1, mr: 1 }}
                  >
                    {task.title}
                  </Typography>
                  <Chip
                    label={statusLabels[task.status]}
                    color={statusColors[task.status]}
                    size="small"
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {task.description.length > 100
                    ? `${task.description.substring(0, 100)}...`
                    : task.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    预算: ¥{task.budget.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    截止: {task.deadline}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    发布者: {task.publisherName}
                  </Typography>
                  {task.assigneeName && (
                    <Typography variant="body2" color="text.secondary">
                      接单者: {task.assigneeName}
                    </Typography>
                  )}
                </Box>

                <Box
                  sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}
                >
                  {task.skillsRequired.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>

              <Box
                sx={{
                  p: 2,
                  pt: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Tooltip title="查看详情">
                    <IconButton
                      size="small"
                      onClick={() => handleViewTask(task.id)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="编辑">
                    <IconButton
                      size="small"
                      onClick={() => handleEditTask(task.id)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Chip
                  label={task.difficulty}
                  size="small"
                  color={
                    task.difficulty === 'expert'
                      ? 'error'
                      : task.difficulty === 'advanced'
                        ? 'warning'
                        : task.difficulty === 'intermediate'
                          ? 'info'
                          : 'success'
                  }
                />
              </Box>
            </Card>
          </Box>
        ))}
      </Box>

      {/* 分页 */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default TaskList;
