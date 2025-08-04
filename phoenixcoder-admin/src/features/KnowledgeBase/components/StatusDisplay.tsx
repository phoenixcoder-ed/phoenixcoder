import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Error, Info, HourglassEmpty } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface StatusDisplayProps {
  status: 'loading' | 'error' | 'empty';
  message?: string;
  onRetry?: () => void;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, message, onRetry }) => {
  const theme = useTheme();

  // 默认拟人化文案
  const defaultMessages = {
    loading: '数据正在快马加鞭地赶来...',
    error: '哎呀，请求出错了，不过别担心，点击重试按钮再试一次吧～',
    empty: '这里还是一片空地，赶紧添加你的第一篇文章吧！'
  };

  const displayMessage = message || defaultMessages[status];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        textAlign: 'center',
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        p: 4,
      }}
    >
      {status === 'loading' && (
        <HourglassEmpty fontSize="large" sx={{ color: theme.palette.primary.main, mb: 2 }} />
      )}
      {status === 'error' && (
        <Error fontSize="large" sx={{ color: theme.palette.error.main, mb: 2 }} />
      )}
      {status === 'empty' && (
        <Info fontSize="large" sx={{ color: theme.palette.info.main, mb: 2 }} />
      )}
      <Typography variant="h6" sx={{ mb: 2 }}>
        {displayMessage}
      </Typography>
      {status === 'error' && onRetry && (
        <Button
          variant="contained"
          color="primary"
          onClick={onRetry}
          sx={{
            mt: 2,
            textTransform: 'none',
            borderRadius: 1,
          }}
        >
          重试
        </Button>
      )}
    </Box>
  );
};

export default StatusDisplay;