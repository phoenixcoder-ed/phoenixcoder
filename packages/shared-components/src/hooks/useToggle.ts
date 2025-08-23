import { useState, useCallback } from 'react';

// 切换状态 Hook
export function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    reset,
    setValue,
  };
}

// 多状态切换 Hook
export function useMultiToggle<T>(values: T[], initialIndex: number = 0) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const toggle = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % values.length);
  }, [values.length]);

  const setIndex = useCallback((index: number) => {
    if (index >= 0 && index < values.length) {
      setCurrentIndex(index);
    }
  }, [values.length]);

  const setValue = useCallback((value: T) => {
    const index = values.indexOf(value);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [values]);

  const reset = useCallback(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  return {
    value: values[currentIndex],
    index: currentIndex,
    toggle,
    setIndex,
    setValue,
    reset,
    values,
  };
}