import { useState, useCallback } from 'react';

export interface FormField {
  value: any;
  error?: string;
  touched?: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

export interface FormValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

export interface FormValidationRules {
  [key: string]: FormValidationRule;
}

export interface UseFormOptions {
  initialValues?: Record<string, any>;
  validationRules?: FormValidationRules;
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
}

export interface UseFormReturn {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: string) => void;
  setTouched: (name: string, touched?: boolean) => void;
  validateField: (name: string) => string | undefined;
  validateForm: () => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  getFieldProps: (name: string) => {
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    error?: string;
    touched?: boolean;
  };
}

export function useForm(options: UseFormOptions = {}): UseFormReturn {
  const { initialValues = {}, validationRules = {}, onSubmit } = options;

  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {};
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        error: undefined,
        touched: false,
      };
    });
    return state;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        error: undefined,
      },
    }));
  }, []);

  const setError = useCallback((name: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
      },
    }));
  }, []);

  const setTouched = useCallback((name: string, touched = true) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched,
      },
    }));
  }, []);

  const validateField = useCallback((name: string): string | undefined => {
    const field = formState[name];
    const rules = validationRules[name];

    if (!field || !rules) return undefined;

    const { value } = field;

    if (rules.required && (!value || value === '')) {
      return '此字段为必填项';
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      return `最少需要 ${rules.minLength} 个字符`;
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      return `最多允许 ${rules.maxLength} 个字符`;
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      return '格式不正确';
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return undefined;
  }, [formState, validationRules]);

  const validateForm = useCallback((): boolean => {
    let isValid = true;
    const newFormState = { ...formState };

    Object.keys(formState).forEach(name => {
      const error = validateField(name);
      if (error) {
        isValid = false;
        newFormState[name] = {
          ...newFormState[name],
          error,
          touched: true,
        };
      }
    });

    setFormState(newFormState);
    return isValid;
  }, [formState, validateField]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    if (!onSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      const values: Record<string, any> = {};
      Object.keys(formState).forEach(key => {
        values[key] = formState[key].value;
      });
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, validateForm, onSubmit]);

  const reset = useCallback(() => {
    const state: FormState = {};
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        error: undefined,
        touched: false,
      };
    });
    setFormState(state);
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback((name: string) => {
    const field = formState[name] || { value: '', error: undefined, touched: false };
    
    return {
      value: field.value,
      onChange: (value: any) => setValue(name, value),
      onBlur: () => {
        setTouched(name, true);
        const error = validateField(name);
        if (error) {
          setError(name, error);
        }
      },
      error: field.touched ? field.error : undefined,
      touched: field.touched,
    };
  }, [formState, setValue, setTouched, setError, validateField]);

  const values = Object.keys(formState).reduce((acc, key) => {
    acc[key] = formState[key].value;
    return acc;
  }, {} as Record<string, any>);

  const errors = Object.keys(formState).reduce((acc, key) => {
    if (formState[key].error) {
      acc[key] = formState[key].error!;
    }
    return acc;
  }, {} as Record<string, string>);

  const touched = Object.keys(formState).reduce((acc, key) => {
    acc[key] = formState[key].touched || false;
    return acc;
  }, {} as Record<string, boolean>);

  const isValid = Object.keys(formState).every(key => !formState[key].error);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    setError,
    setTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps,
  };
}