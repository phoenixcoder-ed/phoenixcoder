import React, { ChangeEvent, useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Snackbar, Alert, IconButton,
  FormControl, InputLabel, Select, MenuItem, RadioGroup,
  Radio, FormControlLabel, Box, Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { getQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion } from './api';

// 题目类型接口
export interface Question {
  id: string;
  title: string;
  description?: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correct_answer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  created_at: string;
  updated_at: string;
}

// 创建题目请求接口
export interface CreateQuestionRequest {
  title: string;
  description?: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correct_answer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

// 更新题目请求接口
export interface UpdateQuestionRequest {
  title?: string;
  description?: string;
  type?: 'single_choice' | 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correct_answer?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

const InterviewQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState<CreateQuestionRequest>({
    title: '',
    description: '',
    type: 'single_choice',
    options: ['选项1', '选项2', '选项3', '选项4'],
    correct_answer: '选项1',
    difficulty: 'medium',
    category: '编程'
  });
  const [editQuestion, setEditQuestion] = useState<UpdateQuestionRequest>({});
  const [deleteQuestionId, setDeleteQuestionId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');

  // 获取题目列表
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const data = await getQuestions();
        setQuestions(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取题目列表失败');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [filterCategory, filterDifficulty]);

  // 打开添加题目对话框
  const handleAddDialogOpen = () => {
    setNewQuestion({
      title: '',
      description: '',
      type: 'single_choice',
      options: ['选项1', '选项2', '选项3', '选项4'],
      correct_answer: '选项1',
      difficulty: 'medium',
      category: '编程'
    });
    setOpenAddDialog(true);
  };

  // 关闭添加题目对话框
  const handleAddDialogClose = () => {
    setOpenAddDialog(false);
  };

  // 打开编辑题目对话框
  const handleEditDialogOpen = async (questionId: string) => {
    try {
      const question = await getQuestion(questionId);
      setCurrentQuestion(question);
      setEditQuestion({
        title: question.title,
        description: question.description,
        type: question.type,
        options: question.options,
        correct_answer: question.correct_answer,
        difficulty: question.difficulty,
        category: question.category
      });
      setOpenEditDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取题目详情失败');
    }
  };

  // 关闭编辑题目对话框
  const handleEditDialogClose = () => {
    setOpenEditDialog(false);
    setCurrentQuestion(null);
  };

  // 打开删除题目对话框
  const handleDeleteDialogOpen = (questionId: string) => {
    setDeleteQuestionId(questionId);
    setOpenDeleteDialog(true);
  };

  // 关闭删除题目对话框
  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
    setDeleteQuestionId('');
  };

  // 处理添加题目
  const handleAddQuestion = async () => {
    try {
      // 根据题目类型处理选项和正确答案
      const processedQuestion = {
        ...newQuestion,
        // 如果是 essay 类型，清空选项和正确答案
        options: newQuestion.type === 'essay' ? undefined : newQuestion.options,
        correct_answer: newQuestion.type === 'essay' ? undefined : newQuestion.correct_answer
      };

      await createQuestion(processedQuestion);
      // 刷新题目列表
      const data = await getQuestions();
      setQuestions(data);
      setOpenAddDialog(false);
      showSnackbar('添加题目成功', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加题目失败');
      showSnackbar(err instanceof Error ? err.message : '添加题目失败', 'error');
    }
  };

  // 处理更新题目
  const handleUpdateQuestion = async () => {
    if (!currentQuestion) return;

    try {
      // 根据题目类型处理选项和正确答案
      const processedQuestion = {
        ...editQuestion,
        // 如果是 essay 类型，清空选项和正确答案
        options: editQuestion.type === 'essay' ? undefined : editQuestion.options,
        correct_answer: editQuestion.type === 'essay' ? undefined : editQuestion.correct_answer
      };

      await updateQuestion(currentQuestion.id, processedQuestion);
      // 刷新题目列表
      const data = await getQuestions();
      setQuestions(data);
      setOpenEditDialog(false);
      setCurrentQuestion(null);
      showSnackbar('更新题目成功', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新题目失败');
      showSnackbar(err instanceof Error ? err.message : '更新题目失败', 'error');
    }
  };

  // 处理删除题目
  const handleDeleteQuestion = async () => {
    if (!deleteQuestionId) return;

    try {
      await deleteQuestion(deleteQuestionId);
      // 刷新题目列表
      const data = await getQuestions();
      setQuestions(data);
      setOpenDeleteDialog(false);
      setDeleteQuestionId('');
      showSnackbar('删除题目成功', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除题目失败');
      showSnackbar(err instanceof Error ? err.message : '删除题目失败', 'error');
    }
  };

  // 显示提示信息
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // 关闭提示信息
  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  // 处理输入变化
  // 处理输入变化 - 使用更通用的事件类型
  const handleNewQuestionChange = (e: any) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理选项变化
  const handleNewOptionChange = (index: number, value: string) => {
    const newOptions = [...(newQuestion.options || [])];
    newOptions[index] = value;
    setNewQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  // 处理编辑输入变化 - 使用更通用的事件类型
  const handleEditQuestionChange = (e: any) => {
    const { name, value } = e.target;
    setEditQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理编辑选项变化
  const handleEditOptionChange = (index: number, value: string) => {
    const newOptions = [...(editQuestion.options || [])];
    newOptions[index] = value;
    setEditQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  // 处理筛选变化
  const handleFilterChange = () => {
    // 触发重新获取数据
  };

  // 处理分类筛选变化
  const handleCategoryFilterChange = (e: any) => {
    setFilterCategory(e.target.value as string);
  };

  // 处理难度筛选变化
  const handleDifficultyFilterChange = (e: any) => {
    setFilterDifficulty(e.target.value as string);
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <h1>面试题库</h1>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>分类</InputLabel>
            <Select
              value={filterCategory}
              label="分类"
              onChange={handleCategoryFilterChange}
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="编程">编程</MenuItem>
              <MenuItem value="算法">算法</MenuItem>
              <MenuItem value="数据库">数据库</MenuItem>
              <MenuItem value="操作系统">操作系统</MenuItem>
              <MenuItem value="网络">网络</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>难度</InputLabel>
            <Select
              value={filterDifficulty}
              label="难度"
              onChange={handleDifficultyFilterChange}
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
            onClick={handleAddDialogOpen}
          >
            添加题目
          </Button>
        </div>
      </div>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="题目表格">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>题目</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>难度</TableCell>
              <TableCell>分类</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((question) => (
              <TableRow
                key={question.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {question.id}
                </TableCell>
                <TableCell>{question.title}</TableCell>
                <TableCell>
                  {question.type === 'single_choice' && '单选题'}
                  {question.type === 'multiple_choice' && '多选题'}
                  {question.type === 'true_false' && '判断题'}
                  {question.type === 'essay' && '简答题'}
                </TableCell>
                <TableCell>
                  {question.difficulty === 'easy' && '简单'}
                  {question.difficulty === 'medium' && '中等'}
                  {question.difficulty === 'hard' && '困难'}
                </TableCell>
                <TableCell>{question.category}</TableCell>
                <TableCell>{new Date(question.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => handleEditDialogOpen(question.id)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleDeleteDialogOpen(question.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 添加题目对话框 */}
      <Dialog open={openAddDialog} onClose={handleAddDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>添加题目</DialogTitle>
        <DialogContent>
          <DialogContentText>
            请填写题目信息
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="题目"
            type="text"
            fullWidth
            value={newQuestion.title}
            onChange={handleNewQuestionChange}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="描述"
            multiline
            rows={4}
            fullWidth
            value={newQuestion.description || ''}
            onChange={handleNewQuestionChange}
          />
          <FormControl component="div" fullWidth margin="dense">
            <InputLabel>题目类型</InputLabel>
            <Select
              name="type"
              value={newQuestion.type}
              label="题目类型"
              onChange={handleNewQuestionChange}
            >
              <MenuItem value="single_choice">单选题</MenuItem>
              <MenuItem value="multiple_choice">多选题</MenuItem>
              <MenuItem value="true_false">判断题</MenuItem>
              <MenuItem value="essay">简答题</MenuItem>
            </Select>
          </FormControl>

          {/* 选项输入 - 仅当类型不是简答题时显示 */}
          {newQuestion.type !== 'essay' && (
            <div style={{ marginTop: 20 }}>
              <Typography variant="subtitle1" gutterBottom>选项</Typography>
              {newQuestion.options && newQuestion.options.map((option, index) => (
                <TextField
                  key={index}
                  margin="dense"
                  fullWidth
                  value={option}
                  onChange={(e) => handleNewOptionChange(index, e.target.value)}
                  label={`选项 ${index + 1}`}
                />
              ))}
              {newQuestion.type !== 'true_false' && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setNewQuestion(prev => ({
                      ...prev,
                      options: [...(prev.options || []), `选项 ${(prev.options || []).length + 1}`]
                    }));
                  }}
                  style={{ marginTop: 10 }}
                >
                  添加选项
                </Button>
              )}
            </div>
          )}

          {/* 正确答案 - 仅当类型不是简答题时显示 */}
          {newQuestion.type !== 'essay' && (
            <div style={{ marginTop: 20 }}>
              <Typography variant="subtitle1" gutterBottom>正确答案</Typography>
              {newQuestion.type === 'true_false' ? (
                <RadioGroup
                  row
                  name="correct_answer"
                  value={newQuestion.correct_answer || 'true'}
                  onChange={handleNewQuestionChange}
                >
                  <FormControlLabel value="true" control={<Radio />} label="正确" />
                  <FormControlLabel value="false" control={<Radio />} label="错误" />
                </RadioGroup>
              ) : (
                <FormControl component="div" fullWidth>
                  <InputLabel>正确选项</InputLabel>
                  <Select
                    name="correct_answer"
                    value={newQuestion.correct_answer || ''}
                    label="正确选项"
                    onChange={handleNewQuestionChange}
                  >
                    {newQuestion.options && newQuestion.options.map((option, index) => (
                      <MenuItem key={index} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </div>
          )}

          <FormControl component="div" fullWidth margin="dense">
            <InputLabel>难度</InputLabel>
            <Select
              name="difficulty"
              value={newQuestion.difficulty}
              label="难度"
              onChange={handleNewQuestionChange}
            >
              <MenuItem value="easy">简单</MenuItem>
              <MenuItem value="medium">中等</MenuItem>
              <MenuItem value="hard">困难</MenuItem>
            </Select>
          </FormControl>

          <FormControl component="div" fullWidth margin="dense">
            <InputLabel>分类</InputLabel>
            <Select
              name="category"
              value={newQuestion.category}
              label="分类"
              onChange={handleNewQuestionChange}
            >
              <MenuItem value="编程">编程</MenuItem>
              <MenuItem value="算法">算法</MenuItem>
              <MenuItem value="数据库">数据库</MenuItem>
              <MenuItem value="操作系统">操作系统</MenuItem>
              <MenuItem value="网络">网络</MenuItem>
              <MenuItem value="前端">前端</MenuItem>
              <MenuItem value="后端">后端</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddDialogClose}>取消</Button>
          <Button onClick={handleAddQuestion}>添加</Button>
        </DialogActions>
      </Dialog>

      {/* 编辑题目对话框 */}
      <Dialog open={openEditDialog} onClose={handleEditDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>编辑题目</DialogTitle>
        <DialogContent>
          <DialogContentText>
            请修改题目信息
          </DialogContentText>
          {currentQuestion && (
            <div>
              <TextField
                autoFocus
                margin="dense"
                name="title"
                label="题目"
                type="text"
                fullWidth
                value={editQuestion.title || ''}
                onChange={handleEditQuestionChange}
                required
              />
              <TextField
                margin="dense"
                name="description"
                label="描述"
                multiline
                rows={4}
                fullWidth
                value={editQuestion.description || ''}
                onChange={handleEditQuestionChange}
              />
              <FormControl component="div" fullWidth margin="dense">
                <InputLabel>题目类型</InputLabel>
                <Select
                  name="type"
                  value={editQuestion.type || currentQuestion.type}
                  label="题目类型"
                  onChange={handleEditQuestionChange}
                >
                  <MenuItem value="single_choice">单选题</MenuItem>
                  <MenuItem value="multiple_choice">多选题</MenuItem>
                  <MenuItem value="true_false">判断题</MenuItem>
                  <MenuItem value="essay">简答题</MenuItem>
                </Select>
              </FormControl>

              {/* 选项输入 - 仅当类型不是简答题时显示 */}
              {(editQuestion.type || currentQuestion.type) !== 'essay' && (
                <div style={{ marginTop: 20 }}>
                  <Typography variant="subtitle1" gutterBottom>选项</Typography>
                  {(editQuestion.options || currentQuestion.options || []).map((option, index) => (
                    <TextField
                      key={index}
                      margin="dense"
                      fullWidth
                      value={option}
                      onChange={(e) => handleEditOptionChange(index, e.target.value)}
                      label={`选项 ${index + 1}`}
                    />
                  ))}
                  {(editQuestion.type || currentQuestion.type) !== 'true_false' && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setEditQuestion(prev => ({
                          ...prev,
                          options: [...(prev.options || currentQuestion.options || []), `选项 ${((prev.options || currentQuestion.options || []).length + 1)}`]
                        }));
                      }}
                      style={{ marginTop: 10 }}
                    >
                      添加选项
                    </Button>
                  )}
                </div>
              )}

              {/* 正确答案 - 仅当类型不是简答题时显示 */}
              {(editQuestion.type || currentQuestion.type) !== 'essay' && (
                <div style={{ marginTop: 20 }}>
                  <Typography variant="subtitle1" gutterBottom>正确答案</Typography>
                  {(editQuestion.type || currentQuestion.type) === 'true_false' ? (
                    <RadioGroup
                      row
                      name="correct_answer"
                      value={editQuestion.correct_answer || currentQuestion.correct_answer || 'true'}
                      onChange={handleEditQuestionChange}
                    >
                      <FormControlLabel value="true" control={<Radio />} label="正确" />
                      <FormControlLabel value="false" control={<Radio />} label="错误" />
                    </RadioGroup>
                  ) : (
                    <FormControl component="div" fullWidth>
                      <InputLabel>正确选项</InputLabel>
                      <Select
                        name="correct_answer"
                        value={editQuestion.correct_answer || currentQuestion.correct_answer || ''}
                        label="正确选项"
                        onChange={handleEditQuestionChange}
                      >
                        {(editQuestion.options || currentQuestion.options || []).map((option, index) => (
                          <MenuItem key={index} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </div>
              )}

              <FormControl component="div" fullWidth margin="dense">
                <InputLabel>难度</InputLabel>
                <Select
                  name="difficulty"
                  value={editQuestion.difficulty || currentQuestion.difficulty}
                  label="难度"
                  onChange={handleEditQuestionChange}
                >
                  <MenuItem value="easy">简单</MenuItem>
                  <MenuItem value="medium">中等</MenuItem>
                  <MenuItem value="hard">困难</MenuItem>
                </Select>
              </FormControl>

              <FormControl component="div" fullWidth margin="dense">
                <InputLabel>分类</InputLabel>
                <Select
                  name="category"
                  value={editQuestion.category || currentQuestion.category}
                  label="分类"
                  onChange={handleEditQuestionChange}
                >
                  <MenuItem value="编程">编程</MenuItem>
                  <MenuItem value="算法">算法</MenuItem>
                  <MenuItem value="数据库">数据库</MenuItem>
                  <MenuItem value="操作系统">操作系统</MenuItem>
                  <MenuItem value="网络">网络</MenuItem>
                  <MenuItem value="前端">前端</MenuItem>
                  <MenuItem value="后端">后端</MenuItem>
                </Select>
              </FormControl>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>取消</Button>
          <Button onClick={handleUpdateQuestion}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 删除题目对话框 */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteDialogClose}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除此题吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>取消</Button>
          <Button onClick={handleDeleteQuestion} color="error">
            删除
          </Button>
        </DialogActions>
      </Dialog>

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
  );
};

export default InterviewQuestions;