import React, { useEffect } from 'react';

import { Close as CloseIcon } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  IconButton,
  Snackbar,
  Stack,
} from '@mui/material';

import { useGlobalStore } from '@/shared/store/globalStore';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    actions?: Array<{
      label: string;
      action: () => void;
      variant?: 'text' | 'outlined' | 'contained';
    }>;
  };
  onClose: (id: string) => void;
  onAction: (action: () => void) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
  onAction,
}) => {
  const { type, title, message, actions, id } = notification;

  return (
    <Alert
      severity={type}
      action={
        <Stack direction="row" spacing={1} alignItems="center">
          {actions?.map((action, index) => (
            <Button
              key={index}
              size="small"
              variant={action.variant || 'text'}
              onClick={() => onAction(action.action)}
            >
              {action.label}
            </Button>
          ))}
          <IconButton size="small" onClick={() => onClose(id)} color="inherit">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      }
      sx={{
        mb: 1,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
};

export const NotificationSystem: React.FC = () => {
  const notifications = useGlobalStore((state) => state.ui.notifications);
  const removeNotification = useGlobalStore(
    (state) => state.removeNotification
  );

  // 自动移除通知
  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    notifications.forEach((notification) => {
      if (notification.type === 'success' || notification.type === 'info') {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, 5000); // 5秒后自动移除成功和信息通知
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  const handleClose = (id: string) => {
    removeNotification(id);
  };

  const handleAction = (action: () => void) => {
    action();
  };

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 9999,
        maxWidth: 400,
        width: '100%',
      }}
    >
      <Stack spacing={1}>
        {notifications.slice(0, 5).map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={handleClose}
            onAction={handleAction}
          />
        ))}
      </Stack>
    </Box>
  );
};

// Toast 通知组件（用于简单的消息提示）
interface ToastNotificationProps {
  open: boolean;
  message: string;
  severity?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  autoHideDuration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  open,
  message,
  severity = 'info',
  onClose,
  autoHideDuration = 6000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

// Hook 用于显示通知
export const useNotification = () => {
  const addNotification = useGlobalStore((state) => state.addNotification);

  const showSuccess = (title: string, message: string) => {
    addNotification({
      type: 'success',
      title,
      message,
    });
  };

  const showError = (title: string, message: string) => {
    addNotification({
      type: 'error',
      title,
      message,
    });
  };

  const showWarning = (title: string, message: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
    });
  };

  const showInfo = (title: string, message: string) => {
    addNotification({
      type: 'info',
      title,
      message,
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default NotificationSystem;
