import { NavigateFunction } from 'react-router-dom';

import { handleHttpError } from '../components/GlobalErrorHandler';

interface HttpError {
  status?: number;
  response?: { status?: number };
  message?: string;
  code?: string;
}

interface AxiosConfig {
  headers: Record<string, string>;
}

interface AxiosError extends HttpError {
  config?: { url?: string };
}

// 生成请求 ID
const generateRequestId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// HTTP 响应拦截器
export const setupHttpInterceptor = (navigate: NavigateFunction) => {
  // 如果使用 axios
  if (
    typeof window !== 'undefined' &&
    (window as unknown as Record<string, unknown>).axios
  ) {
    const axios = (window as unknown as Record<string, unknown>).axios as {
      interceptors: {
        request: {
          use: (
            success: (config: AxiosConfig) => AxiosConfig,
            error: (error: AxiosError) => Promise<AxiosError>
          ) => void;
        };
        response: {
          use: (
            success: (response: unknown) => unknown,
            error: (error: AxiosError) => Promise<AxiosError>
          ) => void;
        };
      };
    };

    // 请求拦截器
    axios.interceptors.request.use(
      (config: AxiosConfig) => {
        // 添加认证 token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求 ID 用于追踪
        config.headers['X-Request-ID'] = generateRequestId();

        return config;
      },
      (error: AxiosError) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    axios.interceptors.response.use(
      (response: unknown) => {
        return response;
      },
      (error: AxiosError) => {
        console.error('Response interceptor error:', error);

        // 使用全局错误处理器
        handleHttpError(error, navigate);

        return Promise.reject(error);
      }
    );
  }

  // 如果使用 fetch，可以创建一个包装器
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      try {
        // 添加认证头
        const [url, options = {}] = args;
        const token = localStorage.getItem('token');

        const enhancedOptions = {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            ...(token && { Authorization: `Bearer ${token}` }),
            'X-Request-ID': generateRequestId(),
          },
        };

        const response = await originalFetch(url, enhancedOptions);

        // 检查响应状态
        if (!response.ok) {
          // 对于登录API的400错误，完全不拦截，让页面自己处理
          const isLoginApi = url.toString().includes('/auth/login');
          const isLoginPage = window.location.pathname === '/login';

          if (isLoginApi && isLoginPage && response.status === 400) {
            // 登录API的400错误，直接返回响应，不抛出错误
            console.log('登录API 400错误，不拦截，让页面自己处理');
            return response;
          }

          const error: HttpError = {
            status: response.status,
            message: response.statusText,
            response: {
              status: response.status,
            },
          };

          // 使用全局错误处理器
          handleHttpError(error, navigate);

          throw error;
        }

        return response;
      } catch (fetchError) {
        console.error('Fetch wrapper error:', fetchError);

        // 网络错误处理
        if (
          fetchError instanceof TypeError &&
          fetchError.message.includes('fetch')
        ) {
          const networkError: HttpError = {
            code: 'NETWORK_ERROR',
            message: '网络连接失败，请检查网络连接或服务器状态',
          };
          handleHttpError(networkError, navigate);
        } else if (
          fetchError instanceof Error &&
          fetchError.name === 'AbortError'
        ) {
          // 请求被取消
          const abortError: HttpError = {
            code: 'REQUEST_ABORTED',
            message: '请求已取消',
          };
          handleHttpError(abortError, navigate);
        }

        throw fetchError;
      }
    };
  }
};

// React Admin 数据提供者错误处理
export const enhanceDataProvider = (
  dataProvider: Record<string, unknown>,
  navigate: NavigateFunction
) => {
  const enhancedProvider = { ...dataProvider };

  // 包装所有方法
  Object.keys(dataProvider).forEach((method) => {
    if (typeof dataProvider[method] === 'function') {
      enhancedProvider[method] = async (...args: unknown[]) => {
        try {
          return await (
            dataProvider[method] as (...args: unknown[]) => Promise<unknown>
          )(...args);
        } catch (providerError) {
          console.error(`DataProvider ${method} error:`, providerError);

          // 使用全局错误处理器
          handleHttpError(providerError as HttpError, navigate);

          throw providerError;
        }
      };
    }
  });

  return enhancedProvider;
};

// 错误重试机制
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (retryError) {
      lastError = retryError;

      // 如果是认证错误或权限错误，不重试
      const httpError = retryError as HttpError;
      const status = httpError?.status || httpError?.response?.status;
      if (status === 401 || status === 403) {
        throw retryError;
      }

      // 最后一次尝试失败
      if (i === maxRetries) {
        throw retryError;
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }

  throw lastError;
};

export default {
  setupHttpInterceptor,
  enhanceDataProvider,
  withRetry,
};
