import { useState, useEffect, useCallback } from 'react';

// 请求配置类型
export interface FetchConfig extends RequestInit {
  baseURL?: string;
  timeout?: number;
}

// 请求状态类型
export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// 数据获取 Hook
export function useFetch<T>(
  url: string,
  config: FetchConfig = {}
): FetchState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { baseURL = '', timeout = 5000, ...fetchConfig } = config;
      const fullUrl = baseURL + url;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(fullUrl, {
        ...fetchConfig,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [url, config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}