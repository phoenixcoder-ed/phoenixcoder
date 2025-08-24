import { useState, useCallback } from 'react';

export interface FormField<T = unknown> {
  value: T;
  error?: string;
  touched?: boolean;
}

export type FormState<T = Record<string, unknown>> = {
  [K in keyof T]: FormField<T[K]>;
}

export interface FormValidationRule<T = unknown> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | undefined;
}

export type FormValidationRules<T = Record<string, unknown>> = {
  [K in keyof T]?: FormValidationRule<T[K]>;
}

export interface UseFormOptions<T = Record<string, unknown>> {
  initialValues?: Partial<T>;
  validationRules?: FormValidationRules<T>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export interface UseFormReturn<T = Record<string, unknown>> {
  values: Partial<T>;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: <K extends keyof T>(name: K, value: T[K]) => void;
  setError: (name: keyof T, error: string) => void;
  setTouched: (name: keyof T, touched?: boolean) => void;
  validateField: (name: keyof T) => string | undefined;
  validateForm: () => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  getFieldProps: <K extends keyof T>(name: K) => {
    value: T[K] | undefined;
    onChange: (value: T[K]) => void;
    onBlur: () => void;
    error?: string;
    touched?: boolean;
  };
}

export function useForm<T = Record<string, unknown>>(options: UseFormOptions<T> = {}): UseFormReturn<T> {
  const { initialValues = {}, validationRules = {}, onSubmit } = options;

  const [formState, setFormState] = useState<FormState<T>>(() => {
    const state = {} as FormState<T>;
    Object.keys(initialValues || {}).forEach(key => {
      const typedKey = key as keyof T;
      state[typedKey] = {
        value: (initialValues as T)[typedKey],
        error: undefined,
        touched: false,
      } as FormField<T[keyof T]>;
    });
    return state;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        error: undefined,
      },
    }));
  }, []);

  const setError = useCallback((name: keyof T, error: string) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
      },
    }));
  }, []);

  const setTouched = useCallback((name: keyof T, touched = true) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched,
      },
    }));
  }, []);

  const validateField = useCallback((name: keyof T): string | undefined => {
    const field = formState[name];
    const rules = validationRules && (validationRules as FormValidationRules<T>)[name];

    if (!field || !rules) return undefined;

    const { value } = field;

    if (rules.required && (!value || value === '')) {
      return '此字段为必填项';
    }

    if (rules.minLength && value && typeof value === 'string' && value.length < rules.minLength) {
      return `最少需要 ${rules.minLength} 个字符`;
    }

    if (rules.maxLength && value && typeof value === 'string' && value.length > rules.maxLength) {
      return `最多允许 ${rules.maxLength} 个字符`;
    }

    if (rules.pattern && value && typeof value === 'string' && !rules.pattern.test(value)) {
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

    Object.keys(formState).forEach(key => {
      const name = key as keyof T;
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
      const values = {} as T;
      Object.keys(formState).forEach(key => {
        const typedKey = key as keyof T;
        values[typedKey] = formState[typedKey].value;
      });
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, validateForm, onSubmit]);

  const reset = useCallback(() => {
    const state = {} as FormState<T>;
    Object.keys(initialValues || {}).forEach(key => {
      const typedKey = key as keyof T;
      state[typedKey] = {
        value: (initialValues as T)[typedKey],
        error: undefined,
        touched: false,
      } as FormField<T[keyof T]>;
    });
    setFormState(state);
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback(<K extends keyof T>(name: K) => {
    const field = formState[name] || { value: undefined as T[K], error: undefined, touched: false };
    
    return {
      value: field.value,
      onChange: (value: T[K]) => setValue(name, value),
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
    const typedKey = key as keyof T;
    acc[typedKey] = formState[typedKey].value;
    return acc;
  }, {} as Partial<T>);

  const errors = Object.keys(formState).reduce((acc, key) => {
    const typedKey = key as keyof T;
    if (formState[typedKey].error) {
      acc[typedKey] = formState[typedKey].error!;
    }
    return acc;
  }, {} as Partial<Record<keyof T, string>>);

  const touched = Object.keys(formState).reduce((acc, key) => {
    const typedKey = key as keyof T;
    acc[typedKey] = formState[typedKey].touched || false;
    return acc;
  }, {} as Partial<Record<keyof T, boolean>>);

  const isValid = Object.keys(formState).every(key => {
    const typedKey = key as keyof T;
    return !formState[typedKey].error;
  });

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