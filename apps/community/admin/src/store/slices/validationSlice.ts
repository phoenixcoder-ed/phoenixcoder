/**
 * 验证状态管理 Slice
 * 管理表单验证、错误状态等
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义验证错误接口
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'length' | 'custom';
  severity: 'error' | 'warning';
}

// 定义字段验证状态接口
export interface FieldValidationState {
  value: unknown;
  errors: ValidationError[];
  warnings: ValidationError[];
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

// 定义表单验证状态接口
export interface FormValidationState {
  fields: Record<string, FieldValidationState>;
  globalErrors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

// 定义验证状态接口
export interface ValidationState {
  forms: Record<string, FormValidationState>;
  currentExceptionStates: string[];
  networkStatus: 'online' | 'offline' | 'slow';
}

// 初始状态
const initialState: ValidationState = {
  forms: {},
  currentExceptionStates: [],
  networkStatus: 'online',
};

// 创建 slice
const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    // 创建表单
    createForm: (
      state,
      action: PayloadAction<{ formId: string; fields: string[] }>
    ) => {
      const { formId, fields } = action.payload;
      const formFields: Record<string, FieldValidationState> = {};

      fields.forEach((field) => {
        formFields[field] = {
          value: '',
          errors: [],
          warnings: [],
          touched: false,
          dirty: false,
          validating: false,
        };
      });

      state.forms[formId] = {
        fields: formFields,
        globalErrors: [],
        isValid: false,
        isSubmitting: false,
        submitCount: 0,
      };
    },

    // 移除表单
    removeForm: (state, action: PayloadAction<string>) => {
      const formId = action.payload;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [formId]: _, ...forms } = state.forms;
      state.forms = forms;
    },

    // 更新字段值
    updateFieldValue: (
      state,
      action: PayloadAction<{ formId: string; field: string; value: unknown }>
    ) => {
      const { formId, field, value } = action.payload;
      if (state.forms[formId]?.fields[field]) {
        state.forms[formId].fields[field].value = value;
        state.forms[formId].fields[field].dirty = true;
      }
    },

    // 设置字段为已触摸
    setFieldTouched: (
      state,
      action: PayloadAction<{
        formId: string;
        field: string;
        touched?: boolean;
      }>
    ) => {
      const { formId, field, touched = true } = action.payload;
      if (state.forms[formId]?.fields[field]) {
        state.forms[formId].fields[field].touched = touched;
      }
    },

    // 设置字段验证状态
    setFieldValidating: (
      state,
      action: PayloadAction<{
        formId: string;
        field: string;
        validating: boolean;
      }>
    ) => {
      const { formId, field, validating } = action.payload;
      if (state.forms[formId]?.fields[field]) {
        state.forms[formId].fields[field].validating = validating;
      }
    },

    // 设置字段错误
    setFieldErrors: (
      state,
      action: PayloadAction<{
        formId: string;
        field: string;
        errors: ValidationError[];
      }>
    ) => {
      const { formId, field, errors } = action.payload;
      if (state.forms[formId]?.fields[field]) {
        state.forms[formId].fields[field].errors = errors;
      }
    },

    // 设置字段警告
    setFieldWarnings: (
      state,
      action: PayloadAction<{
        formId: string;
        field: string;
        warnings: ValidationError[];
      }>
    ) => {
      const { formId, field, warnings } = action.payload;
      if (state.forms[formId]?.fields[field]) {
        state.forms[formId].fields[field].warnings = warnings;
      }
    },

    // 清除字段错误
    clearFieldErrors: (
      state,
      action: PayloadAction<{ formId: string; field: string }>
    ) => {
      const { formId, field } = action.payload;
      if (state.forms[formId]?.fields[field]) {
        state.forms[formId].fields[field].errors = [];
      }
    },

    // 设置全局错误
    setGlobalErrors: (
      state,
      action: PayloadAction<{ formId: string; errors: ValidationError[] }>
    ) => {
      const { formId, errors } = action.payload;
      if (state.forms[formId]) {
        state.forms[formId].globalErrors = errors;
      }
    },

    // 清除全局错误
    clearGlobalErrors: (state, action: PayloadAction<string>) => {
      const formId = action.payload;
      if (state.forms[formId]) {
        state.forms[formId].globalErrors = [];
      }
    },

    // 设置表单提交状态
    setFormSubmitting: (
      state,
      action: PayloadAction<{ formId: string; isSubmitting: boolean }>
    ) => {
      const { formId, isSubmitting } = action.payload;
      if (state.forms[formId]) {
        state.forms[formId].isSubmitting = isSubmitting;
        if (isSubmitting) {
          state.forms[formId].submitCount += 1;
        }
      }
    },

    // 验证表单
    validateForm: (state, action: PayloadAction<string>) => {
      const formId = action.payload;
      const form = state.forms[formId];
      if (!form) return;

      let isValid = true;
      Object.values(form.fields).forEach((field) => {
        if (field.errors.length > 0) {
          isValid = false;
        }
      });

      if (form.globalErrors.length > 0) {
        isValid = false;
      }

      form.isValid = isValid;
    },

    // 重置表单
    resetForm: (state, action: PayloadAction<string>) => {
      const formId = action.payload;
      const form = state.forms[formId];
      if (!form) return;

      Object.keys(form.fields).forEach((field) => {
        form.fields[field] = {
          value: '',
          errors: [],
          warnings: [],
          touched: false,
          dirty: false,
          validating: false,
        };
      });

      form.globalErrors = [];
      form.isValid = false;
      form.isSubmitting = false;
      form.submitCount = 0;
    },

    // 添加异常状态
    addExceptionState: (state, action: PayloadAction<string>) => {
      const exceptionState = action.payload;
      if (!state.currentExceptionStates.includes(exceptionState)) {
        state.currentExceptionStates.push(exceptionState);
      }
    },

    // 移除异常状态
    removeExceptionState: (state, action: PayloadAction<string>) => {
      const exceptionState = action.payload;
      state.currentExceptionStates = state.currentExceptionStates.filter(
        (s) => s !== exceptionState
      );
    },

    // 清除所有异常状态
    clearExceptionStates: (state) => {
      state.currentExceptionStates = [];
    },

    // 设置网络状态
    setNetworkStatus: (
      state,
      action: PayloadAction<'online' | 'offline' | 'slow'>
    ) => {
      state.networkStatus = action.payload;
    },

    // 重置验证状态
    resetValidation: (state) => {
      Object.assign(state, initialState);
    },
  },
});

// 导出 actions
export const {
  createForm,
  removeForm,
  updateFieldValue,
  setFieldTouched,
  setFieldValidating,
  setFieldErrors,
  setFieldWarnings,
  clearFieldErrors,
  setGlobalErrors,
  clearGlobalErrors,
  setFormSubmitting,
  validateForm,
  resetForm,
  addExceptionState,
  removeExceptionState,
  clearExceptionStates,
  setNetworkStatus,
  resetValidation,
} = validationSlice.actions;

// 导出 selectors
export const selectForm =
  (formId: string) => (state: { validation: ValidationState }) =>
    state.validation.forms[formId];

export const selectField =
  (formId: string, fieldName: string) =>
  (state: { validation: ValidationState }) =>
    state.validation.forms[formId]?.fields[fieldName];

export const selectFormErrors =
  (formId: string) => (state: { validation: ValidationState }) => {
    const form = state.validation.forms[formId];
    if (!form) return [];

    const allErrors: ValidationError[] = [];
    Object.values(form.fields).forEach((field) => {
      allErrors.push(...field.errors);
    });
    allErrors.push(...form.globalErrors);

    return allErrors;
  };

export const selectFormIsValid =
  (formId: string) => (state: { validation: ValidationState }) =>
    state.validation.forms[formId]?.isValid ?? false;

export const selectExceptionStates = (state: { validation: ValidationState }) =>
  state.validation.currentExceptionStates;

export const selectNetworkStatus = (state: { validation: ValidationState }) =>
  state.validation.networkStatus;

// 导出 reducer
export default validationSlice.reducer;
