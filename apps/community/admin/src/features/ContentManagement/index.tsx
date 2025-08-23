import React from 'react';

import { Box, Typography } from '@mui/material';

const ContentManagement: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        内容管理
      </Typography>
      <Typography>内容管理模块开发中...</Typography>
    </Box>
  );
};

export default ContentManagement;
