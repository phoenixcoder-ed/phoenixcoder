import { useState, useEffect, useCallback, useRef } from 'react';

// 节流值 Hook
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      const now = Date.now();
      if (now >= lastExecuted.current + delay) {
        setThrottledValue(value);
        lastExecuted.current = now;
      }
    }, delay - (Date.now() - lastExecuted.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

// 节流回调 Hook
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef<T>(callback);
  const lastExecuted = useRef<number>(0);
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

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastExecuted.current >= delay) {
        // 立即执行
        callbackRef.current(...args);
        lastExecuted.current = now;
      } else {
        // 延迟执行
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args);
          lastExecuted.current = Date.now();
        }, delay - (now - lastExecuted.current));
      }
    },
    [delay]
  ) as T;

  return throttledCallback;
}

// 节流状态 Hook
export function useThrottleState<T>(
  initialValue: T,
  delay: number
): [T, T, (value: T) => void, () => void] {
  const [value, setValue] = useState<T>(initialValue);
  const throttledValue = useThrottle(value, delay);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return [value, throttledValue, setValue, reset];
}

// 节流效果 Hook
export function useThrottleEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  delay: number
) {
  const cleanupRef = useRef<(() => void) | void>(undefined);
  const lastExecuted = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();
    
    if (now - lastExecuted.current >= delay) {
      // 立即执行
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      cleanupRef.current = effect();
      lastExecuted.current = now;
    } else {
      // 延迟执行
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (cleanupRef.current) {
          cleanupRef.current();
        }
        cleanupRef.current = effect();
        lastExecuted.current = Date.now();
      }, delay - (now - lastExecuted.current));
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [...deps, delay]);
}