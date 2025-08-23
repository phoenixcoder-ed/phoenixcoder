import React from 'react';

import { Box, Typography } from '@mui/material';

const SystemSettings: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        系统设置
      </Typography>
      <Typography>系统设置模块开发中...</Typography>
    </Box>
  );
};

export default SystemSettings;
