import React from 'react';
import { Box, Chip, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, useTheme, type SxProps, type Theme } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { User } from '../types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
}

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete, sx }) => {
  const theme = useTheme();

  // 获取用户类型颜色
  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin':
        return theme.palette.primary.main;
      case 'merchant':
        return theme.palette.secondary.main;
      case 'programmer':
        return theme.palette.info.main;
      default:
        return theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[500]; // 根据主题模式适配颜色
    }
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <TableContainer 
  component={Paper}
  sx={[
    {
      boxShadow: theme.shadows[2],
      '& .MuiTableCell-root': {
        py: 1.5,
        fontSize: '0.875rem',
        '&:last-child': { pr: 2 }
      }
    },
    ...(sx ? (Array.isArray(sx) ? sx : [sx]) : [])
  ]}
>
        <Table sx={{ minWidth: 650 }} aria-label="user table">
          <TableHead sx={{ bgcolor: theme.palette.background.paper }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>用户名</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>邮箱</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>用户类型</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>创建时间</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row" sx={{ maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.id}
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.user_type}
                    size="small"
                    sx={{
                      bgcolor: getUserTypeColor(user.user_type),
                      color: '#fff',
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? '活跃' : '禁用'}
                    size="small"
                    sx={{
                      bgcolor: user.is_active ? theme.palette.success.main : theme.palette.error.main,
                      color: '#fff',
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Tooltip title="编辑">
                    <IconButton size="small" onClick={() => onEdit(user)} sx={{ color: theme.palette.primary.main, mr: 1 }}>
                      <Edit component="span" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton size="small" onClick={() => onDelete(user.id)} sx={{ color: theme.palette.error.main }}>
                      <Delete component="span" />
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

export default UserTable;