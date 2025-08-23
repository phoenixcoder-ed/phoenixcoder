import { useState, useEffect, useCallback, useRef } from 'react';

// 防抖值 Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 防抖回调 Hook
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef<T>(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedCallback;
}

// 防抖状态 Hook
export function useDebounceState<T>(
  initialValue: T,
  delay: number
): [T, T, (value: T) => void, () => void] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return [value, debouncedValue, setValue, reset];
}

// 防抖效果 Hook
export function useDebounceEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  delay: number
) {
  const cleanupRef = useRef<(() => void) | void>(undefined);

  useEffect(() => {
    const handler = setTimeout(() => {
      // 清理上一次的副作用
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      // 执行新的副作用
      cleanupRef.current = effect();
    }, delay);

    return () => {
      clearTimeout(handler);
      // 组件卸载时清理副作用
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [...deps, delay]);
}