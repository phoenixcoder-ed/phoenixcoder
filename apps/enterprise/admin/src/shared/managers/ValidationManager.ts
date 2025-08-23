import { create } from 'zustand';

import {
  ValidationStatus,
  ValidationSeverity,
  ValidationErrorType,
  ValidationError,
  FieldValidationState,
  FormValidationState,
  ValidationRule,
  ValidationContext,
  ValidationResult,
  ValidationEvent,
  ValidationListener,
  FrontendExceptionState,
  ExceptionStateConfig,
} from '../types/validation';

/**
 * 统一数据校验管理器
 * 提供前后端一致的数据校验状态处理机制
 */

// 默认异常状态处理策略
const DEFAULT_EXCEPTION_CONFIG: ExceptionStateConfig = {
  [FrontendExceptionState.NETWORK_OFFLINE]: {
    skipValidation: true,
    showFallbackUI: true,
    enableOfflineMode: true,
    retryConfig: {
      maxRetries: 3,
      retryDelayMs: 1000,
      exponentialBackoff: true,
    },
    fallbackMessage: '网络连接已断开，请检查网络设置',
  },
  [FrontendExceptionState.SERVER_UNAVAILABLE]: {
    skipValidation: true,
    showFallbackUI: true,
    enableOfflineMode: false,
    retryConfig: {
      maxRetries: 5,
      retryDelayMs: 2000,
      exponentialBackoff: true,
    },
    fallbackMessage: '服务器暂时不可用，请稍后重试',
  },
  [FrontendExceptionState.PERMISSION_DENIED]: {
    skipValidation: false,
    showFallbackUI: true,
    enableOfflineMode: false,
    fallbackMessage: '权限不足，无法执行此操作',
  },
  [FrontendExceptionState.SESSION_EXPIRED]: {
    skipValidation: true,
    showFallbackUI: true,
    enableOfflineMode: false,
    fallbackMessage: '登录已过期，请重新登录',
  },
  [FrontendExceptionState.RATE_LIMITED]: {
    skipValidation: true,
    showFallbackUI: true,
    enableOfflineMode: false,
    retryConfig: {
      maxRetries: 3,
      retryDelayMs: 5000,
      exponentialBackoff: false,
    },
    fallbackMessage: '请求过于频繁，请稍后重试',
  },
  [FrontendExceptionState.MAINTENANCE_MODE]: {
    skipValidation: true,
    showFallbackUI: true,
    enableOfflineMode: true,
    fallbackMessage: '系统正在维护中，请稍后访问',
  },
  [FrontendExceptionState.BROWSER_UNSUPPORTED]: {
    skipValidation: false,
    showFallbackUI: true,
    enableOfflineMode: false,
    fallbackMessage: '当前浏览器不支持此功能，请升级浏览器',
  },
  [FrontendExceptionState.FEATURE_DISABLED]: {
    skipValidation: true,
    showFallbackUI: true,
    enableOfflineMode: false,
    fallbackMessage: '此功能暂时不可用',
  },
};

// 内置校验规则
export const builtInValidators = {
  required: (message = '此字段为必填项'): ValidationRule => ({
    type: ValidationErrorType.REQUIRED,
    message,
    validator: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
  }),

  email: (message = '请输入有效的邮箱地址'): ValidationRule => ({
    type: ValidationErrorType.FORMAT,
    message,
    validator: (value) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(String(value));
    },
  }),

  phone: (message = '请输入有效的手机号码'): ValidationRule => ({
    type: ValidationErrorType.FORMAT,
    message,
    validator: (value) => {
      if (!value) return true;
      const phoneRegex = /^1[3-9]\d{9}$/;
      return phoneRegex.test(String(value));
    },
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    type: ValidationErrorType.LENGTH,
    message: message || `最少需要${min}个字符`,
    validator: (value) => {
      if (!value) return true;
      return String(value).length >= min;
    },
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    type: ValidationErrorType.LENGTH,
    message: message || `最多允许${max}个字符`,
    validator: (value) => {
      if (!value) return true;
      return String(value).length <= max;
    },
  }),

  pattern: (regex: RegExp, message = '格式不正确'): ValidationRule => ({
    type: ValidationErrorType.PATTERN,
    message,
    validator: (value) => {
      if (!value) return true;
      return regex.test(String(value));
    },
  }),

  range: (min: number, max: number, message?: string): ValidationRule => ({
    type: ValidationErrorType.RANGE,
    message: message || `值必须在${min}到${max}之间`,
    validator: (value) => {
      if (!value) return true;
      const num = Number(value);
      return !isNaN(num) && num >= min && num <= max;
    },
  }),

  asyncUnique: (checkUrl: string, message = '该值已存在'): ValidationRule => ({
    type: ValidationErrorType.UNIQUE,
    message,
    async: true,
    debounceMs: 500,
    validator: async (value) => {
      if (!value) return true;
      try {
        const response = await fetch(
          `${checkUrl}?value=${encodeURIComponent(String(value))}`
        );
        const result = await response.json();
        return result.isUnique;
      } catch {
        return true; // 网络错误时跳过校验
      }
    },
  }),
};

// 校验管理器状态接口
interface ValidationManagerState {
  forms: Record<string, FormValidationState>;
  currentExceptionStates: FrontendExceptionState[];
  exceptionConfig: ExceptionStateConfig;
  listeners: ValidationListener[];
  isOnline: boolean;
}

// 校验管理器操作接口
interface ValidationManagerActions {
  // 表单管理
  createForm: (formId: string, fields: string[]) => void;
  removeForm: (formId: string) => void;
  resetForm: (formId: string) => void;

  // 字段校验
  validateField: (
    formId: string,
    fieldName: string,
    value: unknown,
    rules: ValidationRule[]
  ) => Promise<ValidationResult>;
  setFieldValue: (formId: string, fieldName: string, value: unknown) => void;
  setFieldTouched: (
    formId: string,
    fieldName: string,
    touched: boolean
  ) => void;
  setFieldError: (
    formId: string,
    fieldName: string,
    error: ValidationError
  ) => void;

  // 表单校验
  validateForm: (formId: string) => Promise<ValidationResult>;
  setFormSubmitting: (formId: string, isSubmitting: boolean) => void;

  // 异常状态管理
  addExceptionState: (state: FrontendExceptionState) => void;
  removeExceptionState: (state: FrontendExceptionState) => void;
  clearExceptionStates: () => void;
  shouldSkipValidation: () => boolean;

  // 事件监听
  addEventListener: (listener: ValidationListener) => void;
  removeEventListener: (listener: ValidationListener) => void;
  emitEvent: (event: ValidationEvent) => void;

  // 网络状态
  setOnlineStatus: (isOnline: boolean) => void;
}

// 创建校验管理器
export const useValidationManager = create<
  ValidationManagerState & ValidationManagerActions
>((set, get) => ({
  // 初始状态
  forms: {},
  currentExceptionStates: [],
  exceptionConfig: DEFAULT_EXCEPTION_CONFIG,
  listeners: [],
  isOnline: navigator.onLine,

  // 表单管理
  createForm: (formId, fields) => {
    set((state) => ({
      forms: {
        ...state.forms,
        [formId]: {
          status: ValidationStatus.PENDING,
          fields: fields.reduce(
            (acc, fieldName) => ({
              ...acc,
              [fieldName]: {
                status: ValidationStatus.PENDING,
                errors: [],
                warnings: [],
                touched: false,
                dirty: false,
              },
            }),
            {}
          ),
          globalErrors: [],
          isSubmitting: false,
          submitAttempts: 0,
        },
      },
    }));
  },

  removeForm: (formId) => {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [formId]: _, ...forms } = state.forms;
      return { forms };
    });
  },

  resetForm: (formId) => {
    set((state) => {
      const form = state.forms[formId];
      if (!form) return state;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            status: ValidationStatus.PENDING,
            fields: Object.keys(form.fields).reduce(
              (acc, fieldName) => ({
                ...acc,
                [fieldName]: {
                  status: ValidationStatus.PENDING,
                  errors: [],
                  warnings: [],
                  touched: false,
                  dirty: false,
                },
              }),
              {}
            ),
            globalErrors: [],
            isSubmitting: false,
            submitAttempts: 0,
          },
        },
      };
    });
  },

  // 字段校验
  validateField: async (formId, fieldName, value, rules) => {
    const state = get();
    const form = state.forms[formId];
    if (!form) {
      return { isValid: false, errors: [], warnings: [] };
    }

    // 检查是否应该跳过校验
    if (state.shouldSkipValidation()) {
      return { isValid: true, errors: [], warnings: [] };
    }

    // 更新字段状态为校验中
    set((currentState) => ({
      forms: {
        ...currentState.forms,
        [formId]: {
          ...currentState.forms[formId],
          fields: {
            ...currentState.forms[formId].fields,
            [fieldName]: {
              ...currentState.forms[formId].fields[fieldName],
              status: ValidationStatus.VALIDATING,
              lastValue: value,
              validatedAt: new Date().toISOString(),
            },
          },
        },
      },
    }));

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 创建校验上下文
    const context: ValidationContext = {
      formData: Object.keys(form.fields).reduce(
        (acc, key) => ({
          ...acc,
          [key]: form.fields[key].lastValue,
        }),
        { [fieldName]: value }
      ),
      fieldName,
      isSubmitting: form.isSubmitting,
    };

    // 执行校验规则
    for (const rule of rules) {
      try {
        const isValid = await rule.validator(value, context);
        if (!isValid) {
          const error: ValidationError = {
            type: rule.type,
            severity: ValidationSeverity.ERROR,
            field: fieldName,
            message: rule.message,
            timestamp: new Date().toISOString(),
            source: 'client',
          };
          errors.push(error);
        }
      } catch (validationError) {
        const error: ValidationError = {
          type: ValidationErrorType.UNKNOWN,
          severity: ValidationSeverity.ERROR,
          field: fieldName,
          message: '校验过程中发生错误',
          timestamp: new Date().toISOString(),
          source: 'client',
          details: { originalError: validationError },
        };
        errors.push(error);
      }
    }

    const isValid = errors.length === 0;
    const finalStatus = isValid
      ? ValidationStatus.VALID
      : ValidationStatus.INVALID;

    // 更新字段状态
    set((currentState) => ({
      forms: {
        ...currentState.forms,
        [formId]: {
          ...currentState.forms[formId],
          fields: {
            ...currentState.forms[formId].fields,
            [fieldName]: {
              ...currentState.forms[formId].fields[fieldName],
              status: finalStatus,
              errors,
              warnings,
            },
          },
        },
      },
    }));

    // 触发校验完成事件
    get().emitEvent({
      type: 'validation_complete',
      fieldName,
      value,
      result: { isValid, errors, warnings },
      timestamp: new Date().toISOString(),
    });

    return { isValid, errors, warnings };
  },

  setFieldValue: (formId, fieldName, value) => {
    set((state) => {
      const form = state.forms[formId];
      if (!form || !form.fields[fieldName]) return state;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: {
              ...form.fields,
              [fieldName]: {
                ...form.fields[fieldName],
                lastValue: value,
                dirty: true,
              },
            },
          },
        },
      };
    });

    // 触发字段变更事件
    get().emitEvent({
      type: 'field_change',
      fieldName,
      value,
      timestamp: new Date().toISOString(),
    });
  },

  setFieldTouched: (formId, fieldName, touched) => {
    set((state) => {
      const form = state.forms[formId];
      if (!form || !form.fields[fieldName]) return state;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: {
              ...form.fields,
              [fieldName]: {
                ...form.fields[fieldName],
                touched,
              },
            },
          },
        },
      };
    });

    if (touched) {
      get().emitEvent({
        type: 'field_blur',
        fieldName,
        timestamp: new Date().toISOString(),
      });
    }
  },

  setFieldError: (formId, fieldName, error) => {
    set((state) => {
      const form = state.forms[formId];
      if (!form || !form.fields[fieldName]) return state;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: {
              ...form.fields,
              [fieldName]: {
                ...form.fields[fieldName],
                status: ValidationStatus.INVALID,
                errors: [error],
              },
            },
          },
        },
      };
    });
  },

  // 表单校验
  validateForm: async (formId) => {
    const state = get();
    const form = state.forms[formId];
    if (!form) {
      return { isValid: false, errors: [], warnings: [] };
    }

    // 检查是否应该跳过校验
    if (state.shouldSkipValidation()) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    // 收集所有字段的错误
    Object.values(form.fields).forEach((field) => {
      allErrors.push(...field.errors);
      allWarnings.push(...field.warnings);
    });

    // 添加全局错误
    allErrors.push(...form.globalErrors);

    const isValid = allErrors.length === 0;

    // 更新表单状态
    set((currentState) => ({
      forms: {
        ...currentState.forms,
        [formId]: {
          ...currentState.forms[formId],
          status: isValid ? ValidationStatus.VALID : ValidationStatus.INVALID,
        },
      },
    }));

    return { isValid, errors: allErrors, warnings: allWarnings };
  },

  setFormSubmitting: (formId, isSubmitting) => {
    set((state) => {
      const form = state.forms[formId];
      if (!form) return state;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            isSubmitting,
            submitAttempts: isSubmitting
              ? form.submitAttempts
              : form.submitAttempts + 1,
            lastSubmitAt: isSubmitting ? undefined : new Date().toISOString(),
          },
        },
      };
    });

    if (isSubmitting) {
      get().emitEvent({
        type: 'form_submit',
        timestamp: new Date().toISOString(),
      });
    }
  },

  // 异常状态管理
  addExceptionState: (state) => {
    set((currentState) => ({
      currentExceptionStates: [
        ...currentState.currentExceptionStates.filter((s) => s !== state),
        state,
      ],
    }));
  },

  removeExceptionState: (state) => {
    set((currentState) => ({
      currentExceptionStates: currentState.currentExceptionStates.filter(
        (s) => s !== state
      ),
    }));
  },

  clearExceptionStates: () => {
    set({ currentExceptionStates: [] });
  },

  shouldSkipValidation: () => {
    const state = get();

    // 检查全局异常状态
    for (const exceptionState of state.currentExceptionStates) {
      const config = state.exceptionConfig[exceptionState];
      if (config?.skipValidation) {
        return true;
      }
    }

    // 检查网络状态
    if (!state.isOnline) {
      const offlineConfig =
        state.exceptionConfig[FrontendExceptionState.NETWORK_OFFLINE];
      if (offlineConfig?.skipValidation) {
        return true;
      }
    }

    return false;
  },

  // 事件监听
  addEventListener: (listener) => {
    set((state) => ({
      listeners: [...state.listeners, listener],
    }));
  },

  removeEventListener: (listener) => {
    set((state) => ({
      listeners: state.listeners.filter((l) => l !== listener),
    }));
  },

  emitEvent: (event) => {
    const state = get();
    state.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('校验事件监听器执行错误:', error);
      }
    });
  },

  // 网络状态
  setOnlineStatus: (isOnline) => {
    set({ isOnline });

    if (!isOnline) {
      get().addExceptionState(FrontendExceptionState.NETWORK_OFFLINE);
    } else {
      get().removeExceptionState(FrontendExceptionState.NETWORK_OFFLINE);
    }
  },
}));

// 监听网络状态变化
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useValidationManager.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useValidationManager.getState().setOnlineStatus(false);
  });
}

// 导出常用的校验工具函数
export const ValidationUtils = {
  createError: (
    type: ValidationErrorType,
    field: string,
    message: string,
    severity: ValidationSeverity = ValidationSeverity.ERROR
  ): ValidationError => ({
    type,
    severity,
    field,
    message,
    timestamp: new Date().toISOString(),
    source: 'client',
  }),

  isFieldValid: (field: FieldValidationState): boolean => {
    return field.status === ValidationStatus.VALID && field.errors.length === 0;
  },

  isFormValid: (form: FormValidationState): boolean => {
    return (
      form.status === ValidationStatus.VALID &&
      form.globalErrors.length === 0 &&
      Object.values(form.fields).every((field) =>
        ValidationUtils.isFieldValid(field)
      )
    );
  },

  getFieldErrors: (field: FieldValidationState): ValidationError[] => {
    return field.errors.filter(
      (error) => error.severity === ValidationSeverity.ERROR
    );
  },

  getFieldWarnings: (field: FieldValidationState): ValidationError[] => {
    return field.warnings.concat(
      field.errors.filter(
        (error) => error.severity === ValidationSeverity.WARNING
      )
    );
  },
};
