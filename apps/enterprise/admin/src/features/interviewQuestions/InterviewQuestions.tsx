import React, { useState, useEffect } from 'react';

import { Search, BookOutlined, Computer, Clear } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Pagination, Stack, Chip, Tooltip, useTheme } from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';

import {
  getQuestions,
  type Question,
} from '../../shared/api/interviewQuestionsApi';

const InterviewQuestions: React.FC = () => {
  const theme = useTheme();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);

  // 获取题目列表
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const offset = (page - 1) * limit;
        const data = await getQuestions(
          filterCategory,
          filterDifficulty,
          limit,
          offset
        );
        setQuestions(data || []);
        setTotalQuestions(data?.length || 0);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取题目列表失败');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [filterCategory, filterDifficulty, page, limit, searchTerm]);

  // 关闭提示信息
  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 mb-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOutlined className="text-blue-600 dark:text-blue-400" />
            <Typography variant="h5" component="h1" className="font-bold">
              面试鸭
            </Typography>
            <Chip
              label="题库管理"
              size="small"
              color="primary"
              variant="outlined"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Tooltip title="切换主题">
              <IconButton color="inherit">
                <Computer className="text-gray-600 dark:text-gray-300" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Typography
              variant="h6"
              className="text-gray-500 dark:text-gray-400"
            >
              加载题目中...
            </Typography>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <Alert severity="error" sx={{ width: '100%', maxWidth: '500px' }}>
              {error}
            </Alert>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <h1 style={{ margin: 0 }}>面试题库</h1>
            </div>

            {/* 搜索和筛选区域 */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <TextField
                  label="搜索题目"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <Search
                        sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }}
                      />
                    ),
                    endAdornment: searchTerm ? (
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                        edge="end"
                      >
                        <Clear sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : null,
                  }}
                />
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>分类</InputLabel>
                  <Select
                    value={filterCategory}
                    label="分类"
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <MenuItem value="">全部</MenuItem>
                    <MenuItem value="Java">Java</MenuItem>
                    <MenuItem value="Python">Python</MenuItem>
                    <MenuItem value="前端开发">前端开发</MenuItem>
                    <MenuItem value="后端开发">后端开发</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>难度</InputLabel>
                  <Select
                    value={filterDifficulty}
                    label="难度"
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                  >
                    <MenuItem value="">全部</MenuItem>
                    <MenuItem value="easy">简单</MenuItem>
                    <MenuItem value="medium">中等</MenuItem>
                    <MenuItem value="hard">困难</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => {}}
                  sx={{ whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
                >
                  添加题目
                </Button>
              </div>
            </div>

            {/* 题目表格 */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Table sx={{ minWidth: 650 }} aria-label="题目表格">
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor:
                        theme.palette.mode === 'dark' ? '#374151' : '#f8fafc',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>题目</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>类型</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>难度</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>分类</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>创建时间</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      操作
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <Chip label={question.id} size="small" />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={question.title} arrow placement="top">
                          <div
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 200,
                            }}
                          >
                            {question.title}
                          </div>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            question.type === 'single_choice'
                              ? '单选题'
                              : question.type === 'multiple_choice'
                                ? '多选题'
                                : question.type === 'true_false'
                                  ? '判断题'
                                  : '简答题'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            question.difficulty === 'easy'
                              ? '简单'
                              : question.difficulty === 'medium'
                                ? '中等'
                                : '困难'
                          }
                          size="small"
                          sx={{
                            backgroundColor:
                              question.difficulty === 'easy'
                                ? '#dcfce7'
                                : question.difficulty === 'medium'
                                  ? '#fef9c3'
                                  : '#fee2e2',
                            color:
                              question.difficulty === 'easy'
                                ? '#15803d'
                                : question.difficulty === 'medium'
                                  ? '#92400e'
                                  : '#b91c1c',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={question.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(question.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" size="small" sx={{ mr: 1 }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 分页控件 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 20,
                padding: 10,
              }}
            >
              <Stack spacing={2}>
                <Pagination
                  count={Math.ceil(totalQuestions / limit)}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                  variant="outlined"
                  shape="rounded"
                  size="small"
                />
              </Stack>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default InterviewQuestions;
