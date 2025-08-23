import React, { useState } from 'react';

import { Delete, Edit, Search, Visibility } from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Article } from '@/features/KnowledgeBase/types';

interface ArticleTableProps {
  articles: Article[];
  onEdit: (article: Article) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const ArticleTable: React.FC<ArticleTableProps> = ({
  articles,
  onEdit,
  onDelete,
  onView,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 过滤文章
  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '技术':
        return theme.palette.primary.main;
      case '产品':
        return theme.palette.secondary.main;
      case '设计':
        return theme.palette.info.main;
      case '市场':
        return theme.palette.success.main;
      case '运营':
        return theme.palette.warning.main;
      default:
        return theme.palette.error.main;
    }
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 0.5,
          }}
        >
          <Search
            fontSize="small"
            sx={{ color: theme.palette.text.secondary, ml: 1 }}
          />
          <TextField
            variant="standard"
            placeholder="搜索文章..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            sx={{
              border: 'none',
              outline: 'none',
              px: 1,
              py: 0.5,
              width: '200px',
              '& .MuiInputBase-input::placeholder': {
                color: theme.palette.text.secondary,
              },
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ boxShadow: theme.shadows[2] }}>
        <Table sx={{ minWidth: 650 }} aria-label="article table">
          <TableHead sx={{ bgcolor: theme.palette.background.paper }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>标题</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>分类</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>标签</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>创建时间</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>浏览量</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                操作
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredArticles.map((article) => (
              <TableRow
                key={article.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    maxWidth: '200px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {article.title}
                </TableCell>
                <TableCell>
                  <Chip
                    label={article.category}
                    size="small"
                    sx={{
                      bgcolor: getCategoryColor(article.category),
                      color: '#fff',
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{
                          bgcolor: theme.palette.background.paper,
                          fontSize: '0.7rem',
                          height: '20px',
                        }}
                      />
                    ))}
                    {article.tags.length > 3 && (
                      <Chip
                        label={`+${article.tags.length - 3}`}
                        size="small"
                        sx={{
                          bgcolor: theme.palette.background.paper,
                          fontSize: '0.7rem',
                          height: '20px',
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(article.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{article.viewCount}</TableCell>
                <TableCell align="right">
                  <Tooltip title="查看">
                    <IconButton
                      size="small"
                      onClick={() => onView(article.id)}
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="编辑">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(article)}
                      sx={{ color: theme.palette.primary.main }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(article.id)}
                      sx={{ color: theme.palette.error.main }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ArticleTable;
