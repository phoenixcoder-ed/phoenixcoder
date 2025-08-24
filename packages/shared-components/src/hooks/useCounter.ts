import { useState, useCallback } from 'react';

interface UseCounterOptions {
  min?: number;
  max?: number;
  step?: number;
}

// 计数器 Hook
export function useCounter(
  initialValue: number = 0,
  options: UseCounterOptions = {}
) {
  const { min, max, step = 1 } = options;
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prev => {
      const newValue = prev + step;
      return max !== undefined ? Math.min(newValue, max) : newValue;
    });
  }, [step, max]);

  const decrement = useCallback(() => {
    setCount(prev => {
      const newValue = prev - step;
      return min !== undefined ? Math.max(newValue, min) : newValue;
    });
  }, [step, min]);

  const set = useCallback((value: number) => {
    setCount(_prev => {
      let newValue = value;
      if (min !== undefined) newValue = Math.max(newValue, min);
      if (max !== undefined) newValue = Math.min(newValue, max);
      return newValue;
    });
  }, [min, max]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const incrementBy = useCallback((amount: number) => {
    setCount(prev => {
      const newValue = prev + amount;
      if (min !== undefined && newValue < min) return min;
      if (max !== undefined && newValue > max) return max;
      return newValue;
    });
  }, [min, max]);

  const decrementBy = useCallback((amount: number) => {
    setCount(prev => {
      const newValue = prev - amount;
      if (min !== undefined && newValue < min) return min;
      if (max !== undefined && newValue > max) return max;
      return newValue;
    });
  }, [min, max]);

  return {
    count,
    increment,
    decrement,
    set,
    reset,
    incrementBy,
    decrementBy,
    // 便捷属性
    isAtMin: min !== undefined && count <= min,
    isAtMax: max !== undefined && count >= max,
    canIncrement: max === undefined || count < max,
    canDecrement: min === undefined || count > min,
  };
}

// 步进计数器 Hook
export function useStepCounter(
  initialValue: number = 0,
  steps: number[] = [1, 5, 10]
) {
  const [count, setCount] = useState(initialValue);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = steps[currentStepIndex] || 1;

  const increment = useCallback(() => {
    setCount(prev => prev + currentStep);
  }, [currentStep]);

  const decrement = useCallback(() => {
    setCount(prev => prev - currentStep);
  }, [currentStep]);

  const setStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  }, [steps.length]);

  const reset = useCallback(() => {
    setCount(initialValue);
    setCurrentStepIndex(0);
  }, [initialValue]);

  return {
    count,
    increment,
    decrement,
    reset,
    setCount,
    currentStep,
    currentStepIndex,
    setStep,
    steps,
  };
}