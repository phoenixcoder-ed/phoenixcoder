/**
 * 认证相关的自定义Hook
 * 分离业务逻辑，遵循单一职责原则
 */

import { useState, useCallback } from 'react';

import { useNotify } from 'react-admin';
import { useNavigate } from 'react-router-dom';

import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { logger } from '@/shared/utils/logger';

export interface LoginCredentials {
  email?: string;
  phone?: string;
  username?: string;
  password: string;
  rememberMe?: boolean;
  loginType: 'email' | 'phone' | 'username';
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
  phone?: string;
}

export interface AuthState {
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthOperations = (): [AuthState, AuthActions] => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notify = useNotify();
  const navigate = useNavigate();
  const { login: contextLogin, logout: contextLogout } = useAuthContext();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      setError(null);

      try {
        // 智能识别输入类型
        const detectedType = detectInputType(
          credentials.email || credentials.phone || credentials.username || ''
        );
        const actualType =
          credentials.loginType === 'email' && detectedType !== 'email'
            ? detectedType
            : credentials.loginType;

        const loginData = {
          [actualType]:
            credentials.email || credentials.phone || credentials.username,
          password: credentials.password,
          rememberMe: credentials.rememberMe,
          loginType: actualType,
        };

        // 调用认证上下文的登录方法
        await contextLogin(loginData);

        // 保存记住登录状态
        if (credentials.rememberMe) {
          localStorage.setItem('rememberLogin', 'true');
        }

        const typeText =
          actualType === 'email'
            ? '邮箱'
            : actualType === 'phone'
              ? '手机号'
              : '用户名';

        notify(`使用${typeText}登录成功！`, { type: 'success' });
        navigate('/');
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : '登录失败，请检查您的凭据';
        setError(errorMessage);
        notify(errorMessage, { type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [contextLogin, notify, navigate]
  );

  const register = useCallback(
    async (userData: RegisterData) => {
      setLoading(true);
      setError(null);

      try {
        // 这里应该调用注册API
        // const result = await authApi.register(userData);
        logger.info('Register data:', userData);

        // 模拟注册逻辑
        await new Promise((resolve) => setTimeout(resolve, 1000));

        notify('注册成功！', { type: 'success' });
        navigate('/login');
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : '注册失败，请稍后重试';
        setError(errorMessage);
        notify(errorMessage, { type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [notify, navigate]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await contextLogout();
      notify('已安全退出', { type: 'info' });
      navigate('/login');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '退出失败';
      setError(errorMessage);
      notify(errorMessage, { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [contextLogout, notify, navigate]);

  return [
    { loading, error },
    { login, register, logout, clearError },
  ];
};

/**
 * 智能识别输入类型
 */
export const detectInputType = (
  input: string
): 'email' | 'phone' | 'username' => {
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

/**
 * 表单验证规则接口
 */
export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  message?: string;
}

/**
 * 表单验证Hook
 */
export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback(
    (name: string, value: string, rules: ValidationRule[]) => {
      const fieldErrors: string[] = [];

      rules.forEach((rule) => {
        if (rule.required && !value.trim()) {
          fieldErrors.push(rule.message || '此字段为必填项');
        }

        if (rule.pattern && value && !rule.pattern.test(value)) {
          fieldErrors.push(rule.message || '格式不正确');
        }

        if (rule.minLength && value.length < rule.minLength) {
          fieldErrors.push(`最少需要${rule.minLength}个字符`);
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          fieldErrors.push(`最多允许${rule.maxLength}个字符`);
        }
      });

      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[0] || '',
      }));

      return fieldErrors.length === 0;
    },
    []
  );

  const clearFieldError = useCallback((name: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateField,
    clearFieldError,
    clearAllErrors,
  };
};
