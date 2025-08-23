import { create } from 'zustand';

import { InteractionManager } from './InteractionManager';

export interface FormField {
  name: string;
  value: unknown;
  error?: string;
  touched: boolean;
  required: boolean;
  validators: Validator[];
}

export interface Validator {
  validate: (value: unknown) => boolean | string;
  message: string;
}

export interface FormState {
  fields: Record<string, FormField>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
}

export interface FormActions {
  setFieldValue: (name: string, value: unknown) => void;
  setFieldError: (name: string, error: string) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  validateField: (name: string) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
  submitForm: (
    onSubmit: (values: Record<string, unknown>) => Promise<void>
  ) => Promise<void>;
  addField: (field: Omit<FormField, 'touched'>) => void;
  removeField: (name: string) => void;
}

export const createFormStore = (
  initialFields: Record<string, Omit<FormField, 'touched'>> = {}
) => {
  return create<FormState & FormActions>((set, get) => ({
    fields: Object.keys(initialFields).reduce(
      (acc, key) => {
        acc[key] = { ...initialFields[key], touched: false };
        return acc;
      },
      {} as Record<string, FormField>
    ),
    isValid: true,
    isSubmitting: false,
    isDirty: false,
    errors: {},

    setFieldValue: (name, value) => {
      set((state) => {
        const field = state.fields[name];
        if (!field) return state;

        const updatedField = { ...field, value, touched: true };
        const updatedFields = { ...state.fields, [name]: updatedField };

        // 验证字段
        const isFieldValid = get().validateField(name);
        const errors = { ...state.errors };
        if (isFieldValid) {
          delete errors[name];
        }

        return {
          fields: updatedFields,
          isDirty: true,
          errors,
        };
      });
    },

    setFieldError: (name, error) => {
      set((state) => ({
        errors: { ...state.errors, [name]: error },
      }));
    },

    setFieldTouched: (name, touched) => {
      set((state) => {
        const field = state.fields[name];
        if (!field) return state;

        return {
          fields: {
            ...state.fields,
            [name]: { ...field, touched },
          },
        };
      });
    },

    validateField: (name) => {
      const state = get();
      const field = state.fields[name];
      if (!field) return true;

      // 检查必填字段
      if (field.required && (!field.value || field.value === '')) {
        const error = `${name} 是必填字段`;
        set((state) => ({
          errors: { ...state.errors, [name]: error },
        }));
        return false;
      }

      // 运行验证器
      for (const validator of field.validators) {
        const result = validator.validate(field.value);
        if (result !== true) {
          const error = typeof result === 'string' ? result : validator.message;
          set((state) => ({
            errors: { ...state.errors, [name]: error },
          }));
          return false;
        }
      }

      // 清除错误
      set((state) => {
        const errors = { ...state.errors };
        delete errors[name];
        return { errors };
      });

      return true;
    },

    validateForm: () => {
      const state = get();
      let isValid = true;

      Object.keys(state.fields).forEach((fieldName) => {
        const fieldValid = get().validateField(fieldName);
        if (!fieldValid) {
          isValid = false;
        }
      });

      set({ isValid });
      return isValid;
    },

    resetForm: () => {
      set((state) => ({
        fields: Object.keys(state.fields).reduce(
          (acc, key) => {
            acc[key] = {
              ...state.fields[key],
              value: '',
              touched: false,
            };
            return acc;
          },
          {} as Record<string, FormField>
        ),
        isValid: true,
        isSubmitting: false,
        isDirty: false,
        errors: {},
      }));
    },

    submitForm: async (onSubmit) => {
      const state = get();

      // 验证表单
      if (!get().validateForm()) {
        await InteractionManager.trigger('error:handle', {
          source: 'FormManager',
          data: { message: '表单验证失败，请检查输入' },
        });
        return;
      }

      set({ isSubmitting: true });

      try {
        const values = Object.keys(state.fields).reduce(
          (acc, key) => {
            acc[key] = state.fields[key].value;
            return acc;
          },
          {} as Record<string, unknown>
        );

        await onSubmit(values);

        await InteractionManager.trigger('success:handle', {
          source: 'FormManager',
          data: { message: '表单提交成功' },
        });

        get().resetForm();
      } catch (error) {
        await InteractionManager.trigger('error:handle', {
          source: 'FormManager',
          data: {
            message: error instanceof Error ? error.message : '表单提交失败',
          },
        });
      } finally {
        set({ isSubmitting: false });
      }
    },

    addField: (field) => {
      set((state) => ({
        fields: {
          ...state.fields,
          [field.name]: { ...field, touched: false },
        },
      }));
    },

    removeField: (name) => {
      set((state) => {
        const fields = { ...state.fields };
        delete fields[name];
        const errors = { ...state.errors };
        delete errors[name];
        return { fields, errors };
      });
    },
  }));
};

// 常用验证器
export const validators = {
  required: (message = '此字段为必填项'): Validator => ({
    validate: (value) => value !== null && value !== undefined && value !== '',
    message,
  }),

  email: (message = '请输入有效的邮箱地址'): Validator => ({
    validate: (value) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(String(value));
    },
    message,
  }),

  minLength: (min: number, message?: string): Validator => ({
    validate: (value) => {
      if (!value) return true;
      return String(value).length >= min;
    },
    message: message || `最少需要 ${min} 个字符`,
  }),

  maxLength: (max: number, message?: string): Validator => ({
    validate: (value) => {
      if (!value) return true;
      return String(value).length <= max;
    },
    message: message || `最多允许 ${max} 个字符`,
  }),

  pattern: (regex: RegExp, message = '格式不正确'): Validator => ({
    validate: (value) => {
      if (!value) return true;
      return regex.test(String(value));
    },
    message,
  }),

  number: (message = '请输入有效的数字'): Validator => ({
    validate: (value) => {
      if (!value) return true;
      return !isNaN(Number(value));
    },
    message,
  }),

  min: (min: number, message?: string): Validator => ({
    validate: (value) => {
      if (!value) return true;
      return Number(value) >= min;
    },
    message: message || `值不能小于 ${min}`,
  }),

  max: (max: number, message?: string): Validator => ({
    validate: (value) => {
      if (!value) return true;
      return Number(value) <= max;
    },
    message: message || `值不能大于 ${max}`,
  }),
};

// Hook 用于使用表单
export const useForm = (
  initialFields: Record<string, Omit<FormField, 'touched'>> = {}
) => {
  const store = createFormStore(initialFields);
  return store();
};
