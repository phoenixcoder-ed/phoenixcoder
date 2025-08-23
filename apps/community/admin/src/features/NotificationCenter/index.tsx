import React from 'react';

import { Box, Typography } from '@mui/material';

const NotificationCenter: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        通知中心
      </Typography>
      <Typography>通知中心模块开发中...</Typography>
    </Box>
  );
};

export default NotificationCenter;
