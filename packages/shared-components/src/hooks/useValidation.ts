import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: any) => string | undefined;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule | ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface UseValidationReturn {
  errors: ValidationErrors;
  isValid: boolean;
  validate: (name: string, value: any) => string | undefined;
  validateAll: (values: Record<string, any>) => boolean;
  setError: (name: string, error: string) => void;
  clearError: (name: string) => void;
  clearAllErrors: () => void;
}

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

function validateSingleRule(value: any, rule: ValidationRule): string | undefined {
  if (rule.required && (value === undefined || value === null || value === '')) {
    return rule.message || '此字段为必填项';
  }

  // 如果值为空且不是必填，则跳过其他验证
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
    return rule.message || `最少需要 ${rule.minLength} 个字符`;
  }

  if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
    return rule.message || `最多允许 ${rule.maxLength} 个字符`;
  }

  if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
    return rule.message || `值不能小于 ${rule.min}`;
  }

  if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
    return rule.message || `值不能大于 ${rule.max}`;
  }

  if (rule.email && typeof value === 'string' && !EMAIL_REGEX.test(value)) {
    return rule.message || '请输入有效的邮箱地址';
  }

  if (rule.url && typeof value === 'string' && !URL_REGEX.test(value)) {
    return rule.message || '请输入有效的URL地址';
  }

  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return rule.message || '格式不正确';
  }

  if (rule.custom) {
    return rule.custom(value);
  }

  return undefined;
}

export function useValidation(rules: ValidationRules = {}): UseValidationReturn {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = useCallback((name: string, value: any): string | undefined => {
    const fieldRules = rules[name];
    if (!fieldRules) return undefined;

    const rulesToCheck = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

    for (const rule of rulesToCheck) {
      const error = validateSingleRule(value, rule);
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }));
        return error;
      }
    }

    // 如果没有错误，清除该字段的错误
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

    return undefined;
  }, [rules]);

  const validateAll = useCallback((values: Record<string, any>): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(name => {
      const value = values[name];
      const fieldRules = rules[name];
      const rulesToCheck = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

      for (const rule of rulesToCheck) {
        const error = validateSingleRule(value, rule);
        if (error) {
          newErrors[name] = error;
          isValid = false;
          break;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules]);

  const setError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    isValid,
    validate,
    validateAll,
    setError,
    clearError,
    clearAllErrors,
  };
}

// 预定义的常用验证规则
export const commonValidationRules = {
  required: { required: true },
  email: { email: true },
  url: { url: true },
  minLength: (length: number) => ({ minLength: length }),
  maxLength: (length: number) => ({ maxLength: length }),
  min: (value: number) => ({ min: value }),
  max: (value: number) => ({ max: value }),
  pattern: (regex: RegExp, message?: string) => ({ pattern: regex, message }),
};