import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// 加载状态管理 Hook
export function useLoading(initialLoading: boolean = false) {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
  });

  const startLoading = useCallback(() => {
    setState({ isLoading: true, error: null });
  }, []);

  const stopLoading = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState({ isLoading: false, error });
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null });
  }, []);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      startLoading();
      const result = await asyncFn();
      stopLoading();
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      return null;
    }
  }, [startLoading, stopLoading, setError]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    startLoading,
    stopLoading,
    setError,
    reset,
    withLoading,
    hasError: !!state.error,
  };
}

// 多任务加载状态管理 Hook
export function useMultiLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const startLoading = useCallback((key: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { isLoading: true, error: null },
    }));
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { ...prev[key], isLoading: false },
    }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { isLoading: false, error },
    }));
  }, []);

  const reset = useCallback((key: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { isLoading: false, error: null },
    }));
  }, []);

  const resetAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key]?.isLoading || false;
  }, [loadingStates]);

  const getError = useCallback((key: string) => {
    return loadingStates[key]?.error || null;
  }, [loadingStates]);

  const hasError = useCallback((key: string) => {
    return !!loadingStates[key]?.error;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  return {
    loadingStates,
    startLoading,
    stopLoading,
    setError,
    reset,
    resetAll,
    isLoading,
    getError,
    hasError,
    isAnyLoading,
  };
}