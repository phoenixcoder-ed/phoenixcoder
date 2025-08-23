import React from 'react';

import { Box, Typography } from '@mui/material';

const FinancialManagement: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        财务管理
      </Typography>
      <Typography>财务管理模块开发中...</Typography>
    </Box>
  );
};

export default FinancialManagement;
