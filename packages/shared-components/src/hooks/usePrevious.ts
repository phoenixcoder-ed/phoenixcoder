import { useRef, useEffect } from 'react';

// 获取前一个值的 Hook
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// 比较前后值变化的 Hook
export function useValueChange<T>(
  value: T,
  callback?: (current: T, previous: T | undefined) => void
) {
  const previous = usePrevious(value);
  const hasChanged = previous !== value;

  useEffect(() => {
    if (hasChanged && callback) {
      callback(value, previous);
    }
  }, [value, previous, hasChanged, callback]);

  return {
    current: value,
    previous,
    hasChanged,
  };
}

// 深度比较前一个值的 Hook
export function usePreviousDeep<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const prevRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (JSON.stringify(ref.current) !== JSON.stringify(value)) {
      prevRef.current = ref.current;
      ref.current = value;
    }
  });

  return prevRef.current;
}