import React, { useState, useEffect } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CreateUserRequest, UpdateUserRequest, User } from '../types';
import { SelectChangeEvent } from '@mui/material/Select';
interface UserFormProps {
  initialData?: CreateUserRequest | UpdateUserRequest;
  currentUser?: User;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, currentUser, onSubmit, onCancel, isEdit = false }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState<CreateUserRequest | UpdateUserRequest>({
    username: '',
    email: '',
    password: '',
    user_type: 'programmer',
    is_active: true
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else if (currentUser && isEdit) {
      setFormData({
        username: currentUser.username,
        email: currentUser.email,
        password: '',
        user_type: currentUser.user_type,
        is_active: currentUser.is_active
      });
    }
  }, [initialData, currentUser, isEdit]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    let name: string;
    let value: string | boolean = ''; // 初始化为string类型

    if ('target' in e && e.target instanceof HTMLInputElement) {
      name = e.target.name;
      if (e.target.type === 'checkbox') {
        value = e.target.checked;
      } else {
        value = e.target.value;
      }
    } else if ('target' in e && (e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement)) {
      name = e.target.name;
      value = e.target.value;
    } else if ('target' in e) {
      // 处理Select组件的特殊情况
      name = e.target.name;
      value = e.target.value as string; // 明确转换为string类型
    } else {
      // 默认处理
      name = 'unknown';
      value = '';
    }

    setFormData(prev => (
      {
        ...prev,
        [name]: value
      }
    ));
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 处理编辑模式下的密码字段
    let submitData = { ...formData };
    if (isEdit && !submitData.password) {
      // 删除空密码字段，避免覆盖现有密码
      delete submitData.password;
    }
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        fullWidth
        margin="dense"
        id="username"
        name="username"
        label="用户名"
        type="text"
        autoFocus
        value={formData.username || ''}
        onChange={handleChange}
        required
        placeholder="请输入用户名"
        sx={{
          mb: 3,
          '& .MuiInput-underline:before': {
            borderBottomColor: theme.palette.divider,
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottomColor: theme.palette.primary.main,
          },
        }}
      />
      <TextField
        fullWidth
        margin="dense"
        id="email"
        name="email"
        label="邮箱"
        type="email"
        value={formData.email || ''}
        onChange={handleChange}
        required
        placeholder="请输入邮箱"
        sx={{
          mb: 3,
          '& .MuiInput-underline:before': {
            borderBottomColor: theme.palette.divider,
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottomColor: theme.palette.primary.main,
          },
        }}
      />
      <TextField
        fullWidth
        margin="dense"
        id="password"
        name="password"
        label={isEdit ? "密码 (可选)" : "密码"}
        type="password"
        value={formData.password || ''}
        onChange={handleChange}
        required={!isEdit}
        placeholder="请输入密码"
        sx={{
          mb: 3,
          '& .MuiInput-underline:before': {
            borderBottomColor: theme.palette.divider,
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottomColor: theme.palette.primary.main,
          },
        }}
      />
      <FormControl component="div" fullWidth margin="dense" sx={{ mb: 3 }}>
        <InputLabel>用户类型</InputLabel>
        <Select
          name="user_type"
          value={formData.user_type || 'programmer'}
          label="用户类型"
          onChange={handleChange}
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
          <MenuItem value="admin">管理员</MenuItem>
          <MenuItem value="merchant">商家</MenuItem>
          <MenuItem value="programmer">程序员</MenuItem>
          <MenuItem value="other">其他</MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active ?? true}
          onChange={handleChange}
          style={{ marginRight: 10 }}
        />
        <Typography variant="body2">启用用户</Typography>
      </Box>
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

export default UserForm;