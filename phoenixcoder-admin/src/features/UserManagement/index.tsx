import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Typography } from '@mui/material';
import { Add, Delete, Edit, X } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import UserForm from './components/UserForm';
import UserTable from './components/UserTable';
import { User, CreateUserRequest, UpdateUserRequest } from './types';


const UserManagement: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tableKey, setTableKey] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [deleteUserId, setDeleteUserId] = useState<string>('');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    message: '',
    type: 'success'
  });
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    user_type: 'programmer',
    is_active: true
  });
  const [editUser, setEditUser] = useState<UpdateUserRequest>({
    username: '',
    email: '',
    user_type: 'programmer',
    is_active: true
  });

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setTableKey(Date.now());
      // 实际项目中应该调用API获取数据
      const response = await axios.get('/api/users');
      // 假设API返回的用户数据需要转换为我们定义的User类型
      const usersData: User[] = response.data.map((user: any) => ({
        id: user.id,
        username: user.name || '',
        email: user.email,
        user_type: user.user_type || 'programmer',
        is_active: user.is_active !== undefined ? user.is_active : true,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString()
      }));
      setUsers(usersData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户列表失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 添加用户
  const handleAddUser = async (data: CreateUserRequest | UpdateUserRequest) => {
    // 确保数据是CreateUserRequest类型
    if (!('password' in data)) {
      throw new Error('添加用户需要密码');
    }
    try {
      // 转换为API期望的请求格式
      const apiRequest: { [key: string]: any } = {
        name: data.username,
        email: data.email,
        user_type: data.user_type
        // 假设API不需要is_active字段
      };
      // 添加密码字段（如果存在）
      if (data.password) {
        apiRequest.password = data.password;
      }
      await axios.post('/api/users', apiRequest);
      fetchUsers();
      setOpenAddDialog(false);
      showNotification('添加用户成功', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加用户失败');
      showNotification(err instanceof Error ? err.message : '添加用户失败', 'error');
    }
  };

  // 更新用户
  const handleUpdateUser = async (data: UpdateUserRequest) => {
    if (currentUser === undefined) return;

    try {
      // 转换为API期望的请求格式
      const apiRequest = {
        name: data.username,
        email: data.email,
        user_type: data.user_type,
        // 只包含需要更新的字段
        password: data.password
      };
      // 如果提供了密码，则添加到请求中
      if (data.password) {
        apiRequest['password'] = data.password;
      }
      await axios.put(`/api/users/${currentUser.id}`, apiRequest);
      fetchUsers();
      setOpenEditDialog(false);
      setCurrentUser(undefined);
      showNotification('更新用户成功', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新用户失败');
      showNotification(err instanceof Error ? err.message : '更新用户失败', 'error');
    }
  };

  // 删除用户
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      await axios.delete(`/api/users/${deleteUserId}`);
      fetchUsers();
      setOpenDeleteDialog(false);
      setDeleteUserId('');
      showNotification('删除用户成功', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除用户失败');
      showNotification(err instanceof Error ? err.message : '删除用户失败', 'error');
    }
  };

  // 打开编辑对话框
  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setEditUser({
      username: user.username,
      email: user.email,
      user_type: user.user_type,
      is_active: user.is_active
    } as UpdateUserRequest);
    setOpenEditDialog(true);
  };

  // 打开删除对话框
  const handleDelete = (id: string) => {
    setDeleteUserId(id);
    setOpenDeleteDialog(true);
  };

  // 显示通知
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      open: true,
      message,
      type
    });
  };

  // 关闭通知
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography variant="h6">加载中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography variant="h6" color="error">错误: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>用户管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add sx={{ fontSize: 18 }} component="span" />}
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
          添加用户
        </Button>
      </Box>

      <UserTable
  key={tableKey}
  users={users}
  onEdit={handleEdit}
  onDelete={handleDelete}
  sx={{ 
    '& .MuiTableCell-root': { py: 1.5 },
    '& .MuiButton-root': {
      minWidth: 32,
      padding: theme.spacing(0.5),
      '&:not(:last-child)': { mr: 1 }
    }
  }}
/>

      {/* 添加用户对话框 */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>添加用户</DialogTitle>
        <DialogContent>
          <UserForm
            initialData={newUser}
            onSubmit={handleAddUser}
            onCancel={() => setOpenAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>编辑用户</DialogTitle>
        <DialogContent>
          <UserForm
            initialData={editUser}
            currentUser={currentUser}
            onSubmit={handleUpdateUser}
            onCancel={() => setOpenEditDialog(false)}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除此用户吗？此操作不可撤销。</Typography>
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
            onClick={handleDeleteUser}
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
            <X sx={{ fontSize: 16 }} component="span" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default UserManagement;