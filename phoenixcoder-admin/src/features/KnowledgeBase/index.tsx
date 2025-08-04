// React及相关库
import React, { useState, useEffect } from 'react';

// MUI组件
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography, TextField, Select } from '@mui/material';
import { SxProps, Theme } from '@mui/system';
import { useTheme } from '@mui/material/styles';

// MUI图标
import { Add, Delete, Edit, Search, FilterList, X } from '@mui/icons-material';

// 第三方库
import axios from 'axios';

// 本地组件
import ArticleForm from './components/ArticleForm';
import ArticleTable from './components/ArticleTable';
import StatusDisplay from './components/StatusDisplay';

// 类型定义
import { Article, CreateArticleRequest, UpdateArticleRequest } from './types';



const KnowledgeBase: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [deleteArticleId, setDeleteArticleId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');
  const [tagFilter, setTagFilter] = useState<string>('全部');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    message: '',
    type: 'success'
  });

  // 获取文章列表
  const fetchArticles = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await axios.get('/api/articles');
      setArticles(response.data);
    } catch (err) {
      setError(true);
      setErrorMessage('获取文章列表失败，请重试');
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // 添加文章
  const handleAddArticle = async (data: CreateArticleRequest) => {
    try {
      await axios.post('/api/articles', data);
      setOpenAddDialog(false);
      fetchArticles();
      setNotification({
        open: true,
        message: '文章添加成功',
        type: 'success'
      });
    } catch (err) {
      setError(true);
      setErrorMessage('添加文章失败，请重试');
      console.error('Failed to add article:', err);
    }
  };

  // 更新文章
  const handleUpdateArticle = async (data: UpdateArticleRequest) => {
    if (!currentArticle) return;
    try {
      await axios.put(`/api/articles/${currentArticle.id}`, data);
      setOpenEditDialog(false);
      fetchArticles();
      setNotification({
        open: true,
        message: '文章更新成功',
        type: 'success'
      });
    } catch (err) {
      setError(true);
      setErrorMessage('更新文章失败，请重试');
      console.error('Failed to update article:', err);
    }
  };

  // 删除文章
  const handleDeleteArticle = async () => {
    try {
      await axios.delete(`/api/articles/${deleteArticleId}`);
      setOpenDeleteDialog(false);
      fetchArticles();
      setNotification({
        open: true,
        message: '文章删除成功',
        type: 'success'
      });
    } catch (err) {
      setError(true);
      setErrorMessage('删除文章失败，请重试');
      console.error('Failed to delete article:', err);
    }
  };

  // 打开编辑对话框
  const handleEdit = (article: Article) => {
    setCurrentArticle(article);
    setOpenEditDialog(true);
  };

  // 打开删除对话框
  const handleDelete = (id: string) => {
    setDeleteArticleId(id);
    setOpenDeleteDialog(true);
  };

  // 关闭通知
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // 过滤文章
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === '全部' || article.category === categoryFilter;
    const matchesTag = tagFilter === '全部' || article.tags.includes(tagFilter);
    return matchesSearch && matchesCategory && matchesTag;
  });

  // 获取所有分类
  const categories = ['全部', ...Array.from(new Set(articles.map(article => article.category)))];

  // 获取所有标签
  const tags = ['全部', ...Array.from(new Set(articles.flatMap(article => article.tags)))];

  return (
    <Box // 暂时移除sx属性以通过类型检查
// // 修复类型定义后启用sx属性
sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>知识库管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add sx={{ fontSize: 18 }} />}
          onClick={() => setOpenAddDialog(true)}
          sx={{
            textTransform: 'none',
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            '&:hover': {
              boxShadow: theme.shadows[4],
            }
          }}
        >
          添加文章
        </Button>
      </Box>

      <Box sx={{ mb: 4, bgcolor: theme.palette.background.paper, p: 2, borderRadius: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 0.5, flexGrow: 1 }}>
            <Search fontSize="small" sx={{ color: theme.palette.text.secondary, ml: 1 }} />
            <TextField
              variant="standard"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  px: 1,
                  width: '100%',
                  '& .MuiInput-input': {
                    py: 0.5
                  }
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 0.5 }}>
            <FilterList fontSize="small" sx={{ color: theme.palette.text.secondary, ml: 1 }} />
            <Select
              native
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as string)}
              variant="standard"
              sx={{
                border: 'none',
                px: 1,
                '& .MuiSelect-nativeInput': {
                  py: 0.5
                }
              }}
              IconComponent={() => null}
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 0.5 }}>
            <FilterList fontSize="small" sx={{ color: theme.palette.text.secondary, ml: 1, fontSize: '18px' }} />
            <Select
              native
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value as string)}
              variant="standard"
              sx={{
                border: 'none',
                px: 1,
                '& .MuiSelect-nativeInput': {
                  py: 0.5
                }
              }}
              IconComponent={() => null}
            >
              {tags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </Select>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('全部');
              setTagFilter('全部');
            }}
            sx={{
              textTransform: 'none',
              borderRadius: 1,
            }}
          >
            重置
          </Button>
        </Box>
      </Box>

      {loading && <StatusDisplay status="loading" />}
      {error && <StatusDisplay status="error" message={errorMessage} onRetry={fetchArticles} />}
      {!loading && !error && filteredArticles.length === 0 && <StatusDisplay status="empty" />}
      {!loading && !error && filteredArticles.length > 0 && (
        <ArticleTable
          articles={filteredArticles}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(id) => console.log('View article:', id)}
        />
      )}

      {/* 添加文章对话框 */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>添加文章</DialogTitle>
        <DialogContent>
          <ArticleForm
            onSubmit={(values) => {
    if (openAddDialog) {
      handleAddArticle(values as CreateArticleRequest)
    } else {
      handleUpdateArticle(values as UpdateArticleRequest)
    }
  }}
            onCancel={() => setOpenAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 编辑文章对话框 */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>编辑文章</DialogTitle>
        <DialogContent>
          <ArticleForm
            initialData={currentArticle || undefined}
            currentArticle={currentArticle || undefined}
            onSubmit={handleUpdateArticle}
            onCancel={() => setOpenEditDialog(false)}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除这篇文章吗？此操作不可撤销。</Typography>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, gap: 2 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ textTransform: 'none' }}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteArticle}
            sx={{ textTransform: 'none', borderRadius: 1 }}
          >
            确认删除
          </Button>
        </Box>
      </Dialog>

      {/* 通知提示 */}
      {notification.open && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            bgcolor: notification.type === 'success' ? theme.palette.success.main : theme.palette.error.main,
            color: '#fff',
            p: 2,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: theme.shadows[4],
            zIndex: 1000,
          }}
        >
          {notification.message}
          <IconButton onClick={handleCloseNotification} sx={{ color: '#fff' }} size="small">
            <X sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default KnowledgeBase;