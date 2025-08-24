// 表单字段属性类型
export interface FormFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
}

// 表单验证类型
export interface FormValidation {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: (value: unknown) => boolean | string;
  custom?: (value: unknown, formData: Record<string, unknown>) => boolean | string;
}

// 表单状态类型
export interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// 表单配置类型
export interface FormConfig {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  resetOnSubmit?: boolean;
}