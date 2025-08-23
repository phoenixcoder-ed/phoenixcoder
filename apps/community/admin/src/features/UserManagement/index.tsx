import React, { useState, useEffect } from 'react';

import { Add, X } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import UserForm from './components/UserForm';
import UserTable from './components/UserTable';
import { UserService } from './services/userService';
import { User, CreateUserRequest, UpdateUserRequest } from './types/index';

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
    type: 'success',
  });

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setTableKey(Date.now());
      const response = await UserService.getUsers();
      setUsers(response.users);
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
      await UserService.createUser(data as CreateUserRequest);
      fetchUsers();
      setOpenAddDialog(false);
      showNotification('添加用户成功', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加用户失败');
      showNotification(
        err instanceof Error ? err.message : '添加用户失败',
        'error'
      );
    }
  };

  // 更新用户
  const handleUpdateUser = async (data: UpdateUserRequest) => {
    if (currentUser === undefined) return;

    try {
      await UserService.updateUser(currentUser.id, data);
      fetchUsers();
      setOpenEditDialog(false);
      setCurrentUser(undefined);
      showNotification('更新用户成功', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新用户失败');
      showNotification(
        err instanceof Error ? err.message : '更新用户失败',
        'error'
      );
    }
  };

  // 删除用户
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      await UserService.deleteUser(deleteUserId);
      fetchUsers();
      setOpenDeleteDialog(false);
      setDeleteUserId('');
      showNotification('删除用户成功', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除用户失败');
      showNotification(
        err instanceof Error ? err.message : '删除用户失败',
        'error'
      );
    }
  };

  // 打开编辑对话框
  const handleEdit = (user: User) => {
    setCurrentUser(user);
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
      type,
    });
  };

  // 关闭通知
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px',
        }}
      >
        <Typography variant="h6">加载中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px',
        }}
      >
        <Typography variant="h6" color="error">
          错误: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          用户管理
        </Typography>
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
            },
          }}
        >
          添加用户
        </Button>
      </Box>

      <UserTable
        key={tableKey}
        users={users}
        loading={loading}
        sortConfig={null}
        selectedUser={null}
        onSort={() => {}}
        onSelectUser={() => {}}
        onEditUser={handleEdit}
        onDeleteUser={(user) => handleDelete(user.id)}
      />

      {/* 添加用户对话框 */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>添加用户</DialogTitle>
        <DialogContent>
          <UserForm
            user={null}
            isOpen={openAddDialog}
            onClose={() => setOpenAddDialog(false)}
            onSubmit={handleAddUser}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>编辑用户</DialogTitle>
        <DialogContent>
          <UserForm
            user={currentUser}
            isOpen={openEditDialog}
            onClose={() => setOpenEditDialog(false)}
            onSubmit={handleUpdateUser}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
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
            bgcolor:
              notification.type === 'success'
                ? theme.palette.success.main
                : theme.palette.error.main,
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
          <IconButton
            onClick={handleCloseNotification}
            sx={{ color: '#fff' }}
            size="small"
          >
            <X sx={{ fontSize: 16 }} component="span" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default UserManagement;
