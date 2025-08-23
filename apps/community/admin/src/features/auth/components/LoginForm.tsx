/**
 * 登录表单组件
 * 专注于UI展示，业务逻辑通过props传入
 */

import React, { useState } from 'react';

import {
  Visibility,
  VisibilityOff,
  Email,
  Phone,
  Person,
  GitHub,
  Google,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Divider,
  Alert,
} from '@mui/material';

import { LoginCredentials } from '@/features/auth/hooks/useAuth';

interface LoginFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (credentials: LoginCredentials) => void;
  onClearError: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  loading,
  error,
  onSubmit,
  onClearError,
}) => {
  const [formData, setFormData] = useState({
    input: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [inputType, setInputType] = useState<'email' | 'phone' | 'username'>(
    'email'
  );

  // 智能识别输入类型
  const detectInputType = (input: string): 'email' | 'phone' | 'username' => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^1[3-9]\d{9}$/;

    if (emailRegex.test(input)) {
      return 'email';
    } else if (phoneRegex.test(input)) {
      return 'phone';
    } else {
      return 'username';
    }
  };

  const handleInputChange = (value: string) => {
    setFormData((prev) => ({ ...prev, input: value }));

    // 清除错误信息
    if (error) {
      onClearError();
    }

    // 自动检测输入类型
    if (value) {
      const detectedType = detectInputType(value);
      setInputType(detectedType);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.input || !formData.password) {
      return;
    }

    const credentials: LoginCredentials = {
      [inputType]: formData.input,
      password: formData.password,
      rememberMe: formData.rememberMe,
      loginType: inputType,
    };

    onSubmit(credentials);
  };

  const getInputIcon = () => {
    switch (inputType) {
      case 'email':
        return <Email />;
      case 'phone':
        return <Phone />;
      case 'username':
        return <Person />;
      default:
        return <Email />;
    }
  };

  const getInputPlaceholder = () => {
    switch (inputType) {
      case 'email':
        return '请输入邮箱地址';
      case 'phone':
        return '请输入手机号码';
      case 'username':
        return '请输入用户名';
      default:
        return '请输入邮箱/手机号/用户名';
    }
  };

  const getInputLabel = () => {
    switch (inputType) {
      case 'email':
        return '邮箱';
      case 'phone':
        return '手机号';
      case 'username':
        return '用户名';
      default:
        return '登录账号';
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label={getInputLabel()}
        placeholder={getInputPlaceholder()}
        value={formData.input}
        onChange={(e) => handleInputChange(e.target.value)}
        margin="normal"
        required
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">{getInputIcon()}</InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="密码"
        placeholder="请输入密码"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, password: e.target.value }))
        }
        margin="normal"
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                aria-label="切换密码显示"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={formData.rememberMe}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, rememberMe: e.target.checked }))
            }
            color="primary"
          />
        }
        label="记住登录状态"
        sx={{ mb: 2 }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading || !formData.input || !formData.password}
        sx={{ mb: 3, py: 1.5 }}
      >
        {loading ? '登录中...' : '登录'}
      </Button>

      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          或使用第三方登录
        </Typography>
      </Divider>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<GitHub />}
          onClick={() => {
            /* TODO: 实现 GitHub 登录 */
          }}
          disabled={loading}
        >
          GitHub
        </Button>

        <Button
          variant="outlined"
          startIcon={<Google />}
          onClick={() => {
            /* TODO: 实现 Google 登录 */
          }}
          disabled={loading}
        >
          Google
        </Button>

        <Button
          variant="outlined"
          onClick={() => {
            /* TODO: 实现微信登录 */
          }}
          disabled={loading}
          sx={{ color: '#07C160', borderColor: '#07C160' }}
        >
          微信
        </Button>
      </Box>
    </Box>
  );
};
