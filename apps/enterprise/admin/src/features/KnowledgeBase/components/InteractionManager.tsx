import React, { useState, useCallback, useEffect } from 'react';

import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  Star,
  BookmarkBorder,
  Bookmark,
  Share,
  Category,
  Visibility,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Slider,
  Rating,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// 知识项目类型
interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'article' | 'note' | 'tutorial' | 'reference' | 'project';
  status: 'draft' | 'published' | 'archived';
  visibility: 'private' | 'team' | 'public';
  author: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  rating: number;
  estimatedReadTime: number;
  prerequisites: string[];
  relatedItems: string[];
  attachments: Attachment[];
  comments: Comment[];
}

// 附件类型
interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// 评论类型
interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  replies: Comment[];
}

// 分类类型
interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  itemCount: number;
  parentId?: string;
  children?: Category[];
}

// 标签类型
interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount: number;
  category: string;
}

// 筛选条件类型
interface FilterOptions {
  categories: string[];
  tags: string[];
  types: string[];
  difficulties: string[];
  statuses: string[];
  visibilities: string[];
  dateRange: {
    start: string;
    end: string;
  };
  ratingRange: [number, number];
  searchQuery: string;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'rating' | 'viewCount';
  sortOrder: 'asc' | 'desc';
}

const InteractionManager: React.FC = () => {
  const theme = useTheme();

  // 状态管理
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    tags: [],
    types: [],
    difficulties: [],
    statuses: [],
    visibilities: [],
    dateRange: { start: '', end: '' },
    ratingRange: [0, 5],
    searchQuery: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // 对话框状态
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);

  // UI状态
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // 模拟数据初始化
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // 模拟分类数据
    const mockCategories: Category[] = [
      {
        id: '1',
        name: '前端开发',
        description: '前端技术相关知识',
        color: '#2196F3',
        icon: '🎨',
        itemCount: 25,
        children: [
          {
            id: '1-1',
            name: 'React',
            description: 'React框架',
            color: '#61DAFB',
            icon: '⚛️',
            itemCount: 12,
            parentId: '1',
          },
          {
            id: '1-2',
            name: 'Vue',
            description: 'Vue框架',
            color: '#4FC08D',
            icon: '💚',
            itemCount: 8,
            parentId: '1',
          },
          {
            id: '1-3',
            name: 'TypeScript',
            description: 'TypeScript语言',
            color: '#3178C6',
            icon: '📘',
            itemCount: 5,
            parentId: '1',
          },
        ],
      },
      {
        id: '2',
        name: '后端开发',
        description: '后端技术相关知识',
        color: '#4CAF50',
        icon: '⚙️',
        itemCount: 18,
        children: [
          {
            id: '2-1',
            name: 'Node.js',
            description: 'Node.js技术',
            color: '#339933',
            icon: '🟢',
            itemCount: 10,
            parentId: '2',
          },
          {
            id: '2-2',
            name: 'Python',
            description: 'Python语言',
            color: '#3776AB',
            icon: '🐍',
            itemCount: 8,
            parentId: '2',
          },
        ],
      },
      {
        id: '3',
        name: '数据库',
        description: '数据库相关知识',
        color: '#FF9800',
        icon: '🗄️',
        itemCount: 12,
      },
      {
        id: '4',
        name: '算法与数据结构',
        description: '算法和数据结构',
        color: '#9C27B0',
        icon: '🧮',
        itemCount: 30,
      },
    ];

    // 模拟标签数据
    const mockTags: Tag[] = [
      {
        id: '1',
        name: 'JavaScript',
        color: '#F7DF1E',
        usageCount: 45,
        category: '编程语言',
      },
      {
        id: '2',
        name: 'React',
        color: '#61DAFB',
        usageCount: 32,
        category: '框架',
      },
      {
        id: '3',
        name: '性能优化',
        color: '#FF5722',
        usageCount: 28,
        category: '技术',
      },
      {
        id: '4',
        name: '最佳实践',
        color: '#4CAF50',
        usageCount: 25,
        category: '方法论',
      },
      {
        id: '5',
        name: '面试',
        color: '#E91E63',
        usageCount: 22,
        category: '职业发展',
      },
    ];

    // 模拟知识项目数据
    const mockItems: KnowledgeItem[] = [
      {
        id: '1',
        title: 'React Hooks 完全指南',
        content: '深入理解React Hooks的原理和最佳实践...',
        category: '1-1',
        tags: ['React', 'JavaScript', '最佳实践'],
        difficulty: 'intermediate',
        type: 'tutorial',
        status: 'published',
        visibility: 'public',
        author: '张三',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20',
        viewCount: 1250,
        likeCount: 89,
        bookmarkCount: 156,
        rating: 4.8,
        estimatedReadTime: 15,
        prerequisites: ['JavaScript基础', 'React基础'],
        relatedItems: ['2', '3'],
        attachments: [],
        comments: [],
      },
      {
        id: '2',
        title: 'TypeScript 高级类型系统',
        content: 'TypeScript高级类型的使用技巧和实战案例...',
        category: '1-3',
        tags: ['TypeScript', '类型系统'],
        difficulty: 'advanced',
        type: 'article',
        status: 'published',
        visibility: 'team',
        author: '李四',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-18',
        viewCount: 890,
        likeCount: 67,
        bookmarkCount: 123,
        rating: 4.6,
        estimatedReadTime: 20,
        prerequisites: ['TypeScript基础'],
        relatedItems: ['1'],
        attachments: [],
        comments: [],
      },
      {
        id: '3',
        title: '前端性能优化实战',
        content: '前端性能优化的策略和实施方案...',
        category: '1',
        tags: ['性能优化', 'JavaScript', '最佳实践'],
        difficulty: 'intermediate',
        type: 'project',
        status: 'draft',
        visibility: 'private',
        author: '王五',
        createdAt: '2024-01-12',
        updatedAt: '2024-01-22',
        viewCount: 0,
        likeCount: 0,
        bookmarkCount: 0,
        rating: 0,
        estimatedReadTime: 25,
        prerequisites: ['JavaScript基础', 'Web基础'],
        relatedItems: ['1'],
        attachments: [],
        comments: [],
      },
    ];

    setCategories(mockCategories);
    setTags(mockTags);
    setKnowledgeItems(mockItems);
  };

  // 筛选和排序逻辑
  const getFilteredItems = useCallback(() => {
    let filtered = [...knowledgeItems];

    // 搜索过滤
    if (filterOptions.searchQuery) {
      const query = filterOptions.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 分类过滤
    if (filterOptions.categories.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.categories.includes(item.category)
      );
    }

    // 标签过滤
    if (filterOptions.tags.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.tags.some((tag) => item.tags.includes(tag))
      );
    }

    // 类型过滤
    if (filterOptions.types.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.types.includes(item.type)
      );
    }

    // 难度过滤
    if (filterOptions.difficulties.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.difficulties.includes(item.difficulty)
      );
    }

    // 状态过滤
    if (filterOptions.statuses.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.statuses.includes(item.status)
      );
    }

    // 可见性过滤
    if (filterOptions.visibilities.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.visibilities.includes(item.visibility)
      );
    }

    // 评分过滤
    filtered = filtered.filter(
      (item) =>
        item.rating >= filterOptions.ratingRange[0] &&
        item.rating <= filterOptions.ratingRange[1]
    );

    // 排序
    filtered.sort((a, b) => {
      const aValue = a[filterOptions.sortBy];
      const bValue = b[filterOptions.sortBy];

      if (filterOptions.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [knowledgeItems, filterOptions]);

  // CRUD 操作
  const handleCreateItem = () => {
    setEditingItem({
      id: '',
      title: '',
      content: '',
      category: '',
      tags: [],
      difficulty: 'beginner',
      type: 'article',
      status: 'draft',
      visibility: 'private',
      author: '当前用户',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0,
      likeCount: 0,
      bookmarkCount: 0,
      rating: 0,
      estimatedReadTime: 0,
      prerequisites: [],
      relatedItems: [],
      attachments: [],
      comments: [],
    });
    setOpenItemDialog(true);
  };

  const handleEditItem = (item: KnowledgeItem) => {
    setEditingItem({ ...item });
    setOpenItemDialog(true);
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    setLoading(true);
    try {
      if (editingItem.id) {
        // 更新现有项目
        setKnowledgeItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? { ...editingItem, updatedAt: new Date().toISOString() }
              : item
          )
        );
        showSnackbar('知识项目更新成功', 'success');
      } else {
        // 创建新项目
        const newItem = {
          ...editingItem,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setKnowledgeItems((prev) => [...prev, newItem]);
        showSnackbar('知识项目创建成功', 'success');
      }
      setOpenItemDialog(false);
      setEditingItem(null);
    } catch {
      showSnackbar('操作失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('确定要删除这个知识项目吗？')) return;

    setLoading(true);
    try {
      setKnowledgeItems((prev) => prev.filter((item) => item.id !== id));
      showSnackbar('知识项目删除成功', 'success');
    } catch {
      showSnackbar('删除失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 交互操作
  const handleLikeItem = (id: string) => {
    setKnowledgeItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, likeCount: item.likeCount + 1 } : item
      )
    );
  };

  const handleBookmarkItem = (id: string) => {
    setKnowledgeItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, bookmarkCount: item.bookmarkCount + 1 }
          : item
      )
    );
  };

  const handleViewItem = (id: string) => {
    setKnowledgeItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, viewCount: item.viewCount + 1 } : item
      )
    );
    const item = knowledgeItems.find((item) => item.id === id);
    if (item) {
      setSelectedItem(item);
    }
  };

  // 工具函数
  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return theme.palette.grey[500];
      case 'published':
        return theme.palette.success.main;
      case 'archived':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return '📄';
      case 'note':
        return '📝';
      case 'tutorial':
        return '📚';
      case 'reference':
        return '📖';
      case 'project':
        return '🚀';
      default:
        return '📄';
    }
  };

  // 渲染知识项目卡片
  const renderItemCard = (item: KnowledgeItem) => (
    <Card
      key={item.id}
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
      onClick={() => handleViewItem(item.id)}
    >
      <CardContent sx={{ flex: 1 }}>
        {/* 头部信息 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
              {getTypeIcon(item.type)}
            </Typography>
            <Chip label={item.type} size="small" variant="outlined" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={item.status}
              size="small"
              sx={{
                bgcolor: `${getStatusColor(item.status)}20`,
                color: getStatusColor(item.status),
              }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditItem(item);
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* 标题和内容预览 */}
        <Typography variant="h6" sx={{ mb: 1, fontFamily: 'JetBrains Mono' }}>
          {item.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {item.content}
        </Typography>

        {/* 标签 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {item.tags.slice(0, 3).map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
          {item.tags.length > 3 && (
            <Chip
              label={`+${item.tags.length - 3}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {/* 统计信息 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Visibility fontSize="small" color="action" />
              <Typography variant="caption">{item.viewCount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star fontSize="small" color="action" />
              <Typography variant="caption">{item.likeCount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BookmarkBorder fontSize="small" color="action" />
              <Typography variant="caption">{item.bookmarkCount}</Typography>
            </Box>
          </Box>
          <Rating value={item.rating} readOnly size="small" />
        </Box>

        {/* 底部信息 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {item.estimatedReadTime} 分钟阅读
          </Typography>
          <Chip
            label={item.difficulty}
            size="small"
            sx={{
              bgcolor: `${getDifficultyColor(item.difficulty)}20`,
              color: getDifficultyColor(item.difficulty),
            }}
          />
        </Box>
      </CardContent>

      {/* 操作按钮 */}
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleLikeItem(item.id);
            }}
          >
            <Star fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleBookmarkItem(item.id);
            }}
          >
            <Bookmark fontSize="small" />
          </IconButton>
          <IconButton size="small">
            <Share fontSize="small" />
          </IconButton>
        </Box>
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteItem(item.id);
          }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    </Card>
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
          📚 知识库交互管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setOpenFilterDialog(true)}
          >
            筛选
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateItem}
          >
            创建知识
          </Button>
        </Box>
      </Box>

      {/* 搜索和快速筛选 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <TextField
              placeholder="搜索知识库..."
              variant="outlined"
              size="small"
              value={filterOptions.searchQuery}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  searchQuery: e.target.value,
                }))
              }
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'action.active' }} />
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>排序方式</InputLabel>
              <Select
                value={filterOptions.sortBy}
                onChange={(e) =>
                  setFilterOptions((prev) => ({
                    ...prev,
                    sortBy: e.target.value as FilterOptions['sortBy'],
                  }))
                }
              >
                <MenuItem value="updatedAt">更新时间</MenuItem>
                <MenuItem value="createdAt">创建时间</MenuItem>
                <MenuItem value="title">标题</MenuItem>
                <MenuItem value="rating">评分</MenuItem>
                <MenuItem value="viewCount">浏览量</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant={
                filterOptions.sortOrder === 'desc' ? 'contained' : 'outlined'
              }
              size="small"
              onClick={() =>
                setFilterOptions((prev) => ({
                  ...prev,
                  sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc',
                }))
              }
            >
              {filterOptions.sortOrder === 'desc' ? '降序' : '升序'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              {knowledgeItems.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              总知识项目
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="success.main">
              {
                knowledgeItems.filter((item) => item.status === 'published')
                  .length
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              已发布
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="warning.main">
              {knowledgeItems.filter((item) => item.status === 'draft').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              草稿
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="info.main">
              {knowledgeItems.reduce((sum, item) => sum + item.viewCount, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              总浏览量
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 主内容区域 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 3,
          }}
        >
          {getFilteredItems().map(renderItemCard)}
        </Box>
      )}

      {/* 创建/编辑对话框 */}
      <Dialog
        open={openItemDialog}
        onClose={() => setOpenItemDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingItem?.id ? '编辑知识项目' : '创建知识项目'}
        </DialogTitle>
        <DialogContent>
          {editingItem && (
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
            >
              <TextField
                label="标题"
                value={editingItem.title}
                onChange={(e) =>
                  setEditingItem((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
                fullWidth
              />
              <TextField
                label="内容"
                value={editingItem.content}
                onChange={(e) =>
                  setEditingItem((prev) =>
                    prev ? { ...prev, content: e.target.value } : null
                  )
                }
                multiline
                rows={6}
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>分类</InputLabel>
                  <Select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem((prev) =>
                        prev
                          ? {
                              ...prev,
                              category: e.target.value,
                            }
                          : null
                      )
                    }
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.name}>
                        {category.icon} {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>类型</InputLabel>
                  <Select
                    value={editingItem.type}
                    onChange={(e) =>
                      setEditingItem((prev) =>
                        prev
                          ? {
                              ...prev,
                              type: e.target.value as KnowledgeItem['type'],
                            }
                          : null
                      )
                    }
                  >
                    <MenuItem value="article">文章</MenuItem>
                    <MenuItem value="note">笔记</MenuItem>
                    <MenuItem value="tutorial">教程</MenuItem>
                    <MenuItem value="reference">参考</MenuItem>
                    <MenuItem value="project">项目</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>难度</InputLabel>
                  <Select
                    value={editingItem.difficulty}
                    onChange={(e) =>
                      setEditingItem((prev) =>
                        prev
                          ? {
                              ...prev,
                              difficulty: e.target
                                .value as KnowledgeItem['difficulty'],
                            }
                          : null
                      )
                    }
                  >
                    <MenuItem value="beginner">初级</MenuItem>
                    <MenuItem value="intermediate">中级</MenuItem>
                    <MenuItem value="advanced">高级</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>状态</InputLabel>
                  <Select
                    value={editingItem.status}
                    onChange={(e) =>
                      setEditingItem((prev) =>
                        prev
                          ? {
                              ...prev,
                              status: e.target.value as KnowledgeItem['status'],
                            }
                          : null
                      )
                    }
                  >
                    <MenuItem value="draft">草稿</MenuItem>
                    <MenuItem value="published">已发布</MenuItem>
                    <MenuItem value="archived">已归档</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Autocomplete
                multiple
                options={tags.map((tag) => tag.name)}
                value={editingItem.tags}
                onChange={(_, newValue) =>
                  setEditingItem((prev) =>
                    prev ? { ...prev, tags: newValue } : null
                  )
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="标签"
                    placeholder="选择或输入标签"
                  />
                )}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenItemDialog(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSaveItem}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 筛选对话框 */}
      <Dialog
        open={openFilterDialog}
        onClose={() => setOpenFilterDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>高级筛选</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* 分类筛选 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                分类
              </Typography>
              <FormControl fullWidth>
                <InputLabel>选择分类</InputLabel>
                <Select
                  multiple
                  value={filterOptions.categories}
                  onChange={(e) =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      categories: e.target.value as string[],
                    }))
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.icon} {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* 类型筛选 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                类型
              </Typography>
              <FormControl fullWidth>
                <InputLabel>选择类型</InputLabel>
                <Select
                  multiple
                  value={filterOptions.types}
                  onChange={(e) =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      types: e.target.value as string[],
                    }))
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="article">📄 文章</MenuItem>
                  <MenuItem value="note">📝 笔记</MenuItem>
                  <MenuItem value="tutorial">📚 教程</MenuItem>
                  <MenuItem value="reference">📖 参考</MenuItem>
                  <MenuItem value="project">🚀 项目</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* 难度筛选 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                难度
              </Typography>
              <FormControl fullWidth>
                <InputLabel>选择难度</InputLabel>
                <Select
                  multiple
                  value={filterOptions.difficulties}
                  onChange={(e) =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      difficulties: e.target.value as string[],
                    }))
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="beginner">🟢 初级</MenuItem>
                  <MenuItem value="intermediate">🟡 中级</MenuItem>
                  <MenuItem value="advanced">🔴 高级</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* 状态筛选 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                状态
              </Typography>
              <FormControl fullWidth>
                <InputLabel>选择状态</InputLabel>
                <Select
                  multiple
                  value={filterOptions.statuses}
                  onChange={(e) =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      statuses: e.target.value as string[],
                    }))
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="draft">📝 草稿</MenuItem>
                  <MenuItem value="published">✅ 已发布</MenuItem>
                  <MenuItem value="archived">📦 已归档</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* 评分范围 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                评分范围
              </Typography>
              <Slider
                value={filterOptions.ratingRange}
                onChange={(_, newValue) =>
                  setFilterOptions((prev) => ({
                    ...prev,
                    ratingRange: newValue as [number, number],
                  }))
                }
                valueLabelDisplay="auto"
                min={0}
                max={5}
                step={0.1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 2.5, label: '2.5' },
                  { value: 5, label: '5' },
                ]}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFilterOptions({
                searchQuery: '',
                categories: [],
                tags: [],
                types: [],
                difficulties: [],
                statuses: [],
                visibilities: [],
                dateRange: { start: '', end: '' },
                ratingRange: [0, 5],
                sortBy: 'updatedAt',
                sortOrder: 'desc',
              });
            }}
          >
            重置
          </Button>
          <Button onClick={() => setOpenFilterDialog(false)}>关闭</Button>
          <Button
            variant="contained"
            onClick={() => setOpenFilterDialog(false)}
          >
            应用筛选
          </Button>
        </DialogActions>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedItem && getTypeIcon(selectedItem.type)}
            {selectedItem?.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={selectedItem.difficulty}
                  size="small"
                  sx={{
                    bgcolor: `${getDifficultyColor(selectedItem.difficulty)}20`,
                    color: getDifficultyColor(selectedItem.difficulty),
                  }}
                />
                <Chip
                  label={selectedItem.status}
                  size="small"
                  sx={{
                    bgcolor: `${getStatusColor(selectedItem.status)}20`,
                    color: getStatusColor(selectedItem.status),
                  }}
                />
                <Chip label={selectedItem.type} size="small" />
              </Box>
              <Typography variant="body1">{selectedItem.content}</Typography>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  标签
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {selectedItem.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  作者: {selectedItem.author}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  创建时间: {selectedItem.createdAt}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  更新时间: {selectedItem.updatedAt}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedItem(null)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InteractionManager;
