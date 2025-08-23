import React from 'react';

import { Box, Button, Typography, Stack } from '@mui/material';

import { useGlobalErrorHandler } from './GlobalErrorHandler';

const ErrorTestPage: React.FC = () => {
  const { handleError } = useGlobalErrorHandler();

  const testErrors = [
    {
      name: '401 未授权',
      error: { status: 401, message: '用户未登录' },
    },
    {
      name: '403 禁止访问',
      error: { status: 403, message: '权限不足' },
    },
    {
      name: '404 未找到',
      error: { status: 404, message: '资源不存在' },
    },
    {
      name: '500 服务器错误',
      error: { status: 500, message: '内部服务器错误' },
    },
    {
      name: '网络错误',
      error: { message: 'Network Error' },
    },
  ];

  const handleTestError = (error: { status?: number; message: string }) => {
    handleError(error);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        全局异常处理测试
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        点击下面的按钮测试不同类型的错误处理：
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 400 }}>
        {testErrors.map((test, index) => (
          <Button
            key={index}
            variant="outlined"
            color="error"
            onClick={() => handleTestError(test.error)}
            sx={{ justifyContent: 'flex-start' }}
          >
            测试 {test.name}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default ErrorTestPage;
