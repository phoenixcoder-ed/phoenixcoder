import React from 'react';
import { Card, CardContent, Typography, Box, ListItem } from '@mui/material';

const EnvInfo: React.FC = () => {
  // 从环境变量中获取配置信息
  const env = import.meta.env;

  return (
    <Card sx={{ margin: 2, maxWidth: 600, marginX: 'auto' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          环境配置信息
        </Typography>
        <Box component="ul" sx={{ listStyleType: 'none', padding: 0 }}>
          <ListItem sx={{ marginBottom: 1, paddingLeft: 0 }}>
            <strong>环境名称:</strong> {env.VITE_APP_ENV}
          </ListItem>
          <ListItem sx={{ marginBottom: 1, paddingLeft: 0 }}>
            <strong>API 地址:</strong> {env.VITE_APP_API_URL}
          </ListItem>
          <ListItem sx={{ paddingLeft: 0 }}>
            <strong>调试模式:</strong> {env.VITE_APP_DEBUG === 'true' ? '开启' : '关闭'}
          </ListItem>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EnvInfo;