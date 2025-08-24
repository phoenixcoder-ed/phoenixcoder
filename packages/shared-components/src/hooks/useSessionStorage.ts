import { useState, useEffect, useCallback } from 'react';

// 会话存储 Hook
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // 获取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      // 静默处理 sessionStorage 读取错误，返回默认值
      return initialValue;
    }
  });

  // 设置值
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch {
      // 静默处理 sessionStorage 设置错误
    }
  }, [key, storedValue]);

  // 移除值
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // 静默处理 sessionStorage 移除错误
    }
  }, [key, initialValue]);

  // 监听存储变化
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // 静默处理 sessionStorage 解析错误
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

// 会话存储状态 Hook（带有更多功能）
export function useSessionStorageState<T>(key: string, initialValue: T) {
  const [value, setValue, removeValue] = useSessionStorage(key, initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setValueWithLoading = useCallback(async (newValue: T | ((val: T) => T)) => {
    try {
      setIsLoading(true);
      setError(null);
      setValue(newValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [setValue]);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [setValue, initialValue]);

  return {
    value,
    setValue: setValueWithLoading,
    removeValue,
    reset,
    isLoading,
    error,
    hasError: !!error,
  };
}