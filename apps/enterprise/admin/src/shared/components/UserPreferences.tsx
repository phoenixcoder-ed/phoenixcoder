import React, { useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Typography,
  Box,
  Divider,
  Slider,
  TextField,
} from '@mui/material';

import { useGlobalStore } from '../store/globalStore';

interface UserPreferencesProps {
  open: boolean;
  onClose: () => void;
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({
  open,
  onClose,
}) => {
  const { user, ui, settings, setUser, updateSettings } = useGlobalStore();

  const [localSettings, setLocalSettings] = useState({
    theme: ui.theme,
    language: settings.language,
    notifications: {
      email: settings.notificationsEnabled,
      push: settings.notificationsEnabled,
      sms: false,
    },
    autoSave: settings.autoSave,
    pageSize: 25,
    timezone: settings.timezone,
  });

  const [localProfile, setLocalProfile] = useState({
    displayName: user?.name || '',
    email: user?.email || '',
    bio: '',
  });

  const handleSettingChange = (key: string, value: unknown) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleProfileChange = (key: string, value: string) => {
    setLocalProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    // 更新设置
    updateSettings({
      language: localSettings.language,
      timezone: localSettings.timezone,
      autoSave: localSettings.autoSave,
      notificationsEnabled: localSettings.notifications.email,
    });

    // 更新用户信息
    if (user) {
      setUser({
        ...user,
        name: localProfile.displayName,
        email: localProfile.email,
      });
    }

    onClose();
  };

  const handleCancel = () => {
    // 重置为原始值
    setLocalSettings({
      theme: ui.theme,
      language: settings.language,
      notifications: {
        email: settings.notificationsEnabled,
        push: settings.notificationsEnabled,
        sms: false,
      },
      autoSave: settings.autoSave,
      pageSize: 25,
      timezone: settings.timezone,
    });
    setLocalProfile({
      displayName: user?.name || '',
      email: user?.email || '',
      bio: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>用户偏好设置</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* 个人信息 */}
          <Typography variant="h6" gutterBottom>
            个人信息
          </Typography>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="显示名称"
              value={localProfile.displayName}
              onChange={(e) =>
                handleProfileChange('displayName', e.target.value)
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="邮箱"
              type="email"
              value={localProfile.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="个人简介"
              multiline
              rows={3}
              value={localProfile.bio}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
              margin="normal"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 界面设置 */}
          <Typography variant="h6" gutterBottom>
            界面设置
          </Typography>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth margin="normal">
              <FormLabel>主题</FormLabel>
              <Select
                value={localSettings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                <MenuItem value="light">浅色主题</MenuItem>
                <MenuItem value="dark">深色主题</MenuItem>
                <MenuItem value="auto">跟随系统</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <FormLabel>语言</FormLabel>
              <Select
                value={localSettings.language}
                onChange={(e) =>
                  handleSettingChange('language', e.target.value)
                }
              >
                <MenuItem value="zh-CN">中文（简体）</MenuItem>
                <MenuItem value="zh-TW">中文（繁体）</MenuItem>
                <MenuItem value="en-US">English</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <FormLabel>时区</FormLabel>
              <Select
                value={localSettings.timezone}
                onChange={(e) =>
                  handleSettingChange('timezone', e.target.value)
                }
              >
                <MenuItem value="Asia/Shanghai">北京时间 (UTC+8)</MenuItem>
                <MenuItem value="Asia/Tokyo">东京时间 (UTC+9)</MenuItem>
                <MenuItem value="America/New_York">纽约时间 (UTC-5)</MenuItem>
                <MenuItem value="Europe/London">伦敦时间 (UTC+0)</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 2 }}>
              <FormLabel>每页显示条数</FormLabel>
              <Slider
                value={localSettings.pageSize}
                onChange={(_, value) => handleSettingChange('pageSize', value)}
                min={10}
                max={100}
                step={10}
                marks={[
                  { value: 10, label: '10' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 功能设置 */}
          <Typography variant="h6" gutterBottom>
            功能设置
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.notifications.email}
                  onChange={(e) =>
                    handleSettingChange('notifications', {
                      ...localSettings.notifications,
                      email: e.target.checked,
                    })
                  }
                />
              }
              label="邮件通知"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.notifications.push}
                  onChange={(e) =>
                    handleSettingChange('notifications', {
                      ...localSettings.notifications,
                      push: e.target.checked,
                    })
                  }
                />
              }
              label="推送通知"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.notifications.sms}
                  onChange={(e) =>
                    handleSettingChange('notifications', {
                      ...localSettings.notifications,
                      sms: e.target.checked,
                    })
                  }
                />
              }
              label="短信通知"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.autoSave}
                  onChange={(e) =>
                    handleSettingChange('autoSave', e.target.checked)
                  }
                />
              }
              label="自动保存"
            />
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>取消</Button>
        <Button onClick={handleSave} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserPreferences;
