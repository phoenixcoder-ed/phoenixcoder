import React, { useState, useEffect } from 'react';
import { Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTheme } from '@mui/material/styles';
import { CreateArticleRequest, UpdateArticleRequest, Article } from '../types';

interface ArticleFormProps {
  initialData?: CreateArticleRequest | UpdateArticleRequest;
  currentArticle?: Article;
  onSubmit: (data: CreateArticleRequest | UpdateArticleRequest) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ initialData, currentArticle, onSubmit, onCancel, isEdit = false }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState<CreateArticleRequest | UpdateArticleRequest>({
    title: '',
    content: '',
    summary: '',
    tags: [],
    category: '技术'
  });
  const [newTag, setNewTag] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else if (currentArticle && isEdit) {
      setFormData({
        title: currentArticle.title,
        content: currentArticle.content,
        summary: currentArticle.summary || '',
        tags: currentArticle.tags,
        category: currentArticle.category
      });
    }
  }, [initialData, currentArticle, isEdit]);

  // 处理文本输入变化
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    if (!name) return;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理选择器变化
  const handleSelectChange = (
    event: React.ChangeEvent<Omit<HTMLInputElement, "value"> & { value: string }> | (Event & { target: { value: string; name: string } }),
    child?: React.ReactNode
  ) => {
    let name: string | undefined;
    let value: unknown;

    if ('target' in event && event.target) {
      name = event.target.name;
      value = event.target.value;
    } else if ('currentTarget' in event && event.currentTarget) {
      const currentTarget = event.currentTarget as HTMLInputElement;
      name = currentTarget.name;
      value = currentTarget.value;
    } else {
      return;
    }

    if (!name) return;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理富文本内容变化
  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
  };

  // 添加标签
  const handleAddTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
      }));
      setNewTag('');
    }
  };

  // 删除标签
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag)
    }));
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        autoFocus
        margin="dense"
        name="title"
        label="标题"
        type="text"
        fullWidth
        value={formData.title || ''}
        onChange={handleInputChange}
        required
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: theme.palette.divider,
            },
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
            borderRadius: 1,
          },
        }}
      />
      <TextField
        margin="dense"
        name="summary"
        label="摘要"
        multiline
        rows={3}
        fullWidth
        value={formData.summary || ''}
        onChange={handleInputChange}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: theme.palette.divider,
            },
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
            borderRadius: 1,
          },
        }}
      />
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>内容</Typography>
        <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1, overflow: 'hidden' }}>
          <ReactQuill
            value={formData.content || ''}
            onChange={handleContentChange}
            modules={{ toolbar: ['bold', 'italic', 'underline', 'strike', 'link', 'image', 'list', 'indent', 'outdent', 'code-block'] }}
            style={{ height: '300px', border: 'none' }}
          />
        </Box>
      </Box>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>标签</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {(formData.tags || []).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              onDelete={() => handleRemoveTag(tag)}
              sx={{
                bgcolor: theme.palette.background.paper,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                }
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            margin="dense"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            label="添加标签"
            variant="outlined"
            size="small"
            sx={{
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                borderRadius: 1,
              },
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={handleAddTag}
            sx={{
              textTransform: 'none',
              borderRadius: 1,
            }}
          >
            添加
          </Button>
        </Box>
      </Box>
      <FormControl component="div" fullWidth margin="dense" sx={{ mt: 3 }}>
        <InputLabel>分类</InputLabel>
        <Select
          name="category"
          value={formData.category || '技术'}
          label="分类"
          onChange={handleSelectChange}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: theme.palette.divider,
              },
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
              borderRadius: 1,
            },
          }}
        >
          <MenuItem value="技术">技术</MenuItem>
          <MenuItem value="产品">产品</MenuItem>
          <MenuItem value="设计">设计</MenuItem>
          <MenuItem value="市场">市场</MenuItem>
          <MenuItem value="运营">运营</MenuItem>
          <MenuItem value="其他">其他</MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button
          onClick={onCancel}
          sx={{
            textTransform: 'none',
            color: theme.palette.text.secondary
          }}
        >
          取消
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{
            textTransform: 'none',
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            '&:hover': {
              boxShadow: theme.shadows[4],
            }
          }}
        >
          {isEdit ? '保存' : '添加'}
        </Button>
      </Box>
    </form>
  );
};

export default ArticleForm;