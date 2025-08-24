import { useState, useCallback } from 'react';

interface CopyState {
  value: string | null;
  success: boolean;
  error: string | null;
}

// 复制到剪贴板 Hook
export function useCopyToClipboard(): [
  CopyState,
  (text: string) => Promise<boolean>
] {
  const [state, setState] = useState<CopyState>({
    value: null,
    success: false,
    error: null,
  });

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      setState({
        value: text,
        success: false,
        error: 'Clipboard not supported',
      });
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setState({
        value: text,
        success: true,
        error: null,
      });
      return true;
    } catch (error) {
      setState({
        value: text,
        success: false,
        error: error instanceof Error ? error.message : 'Copy failed',
      });
      return false;
    }
  }, []);

  return [state, copyToClipboard];
}

// 简化版复制 Hook
export function useCopy() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(null);
      
      // 2秒后重置状态
      setTimeout(() => setCopied(false), 2000);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copy failed');
      setCopied(false);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return {
    copied,
    error,
    copy,
    reset,
    hasError: !!error,
  };
}

// 带有回退方案的复制 Hook
export function useCopyWithFallback() {
  const [state, setState] = useState<CopyState>({
    value: null,
    success: false,
    error: null,
  });

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    // 现代浏览器 API
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setState({
          value: text,
          success: true,
          error: null,
        });
        return true;
      } catch {
        // 继续尝试回退方案
      }
    }

    // 回退方案：使用 execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setState({
          value: text,
          success: true,
          error: null,
        });
        return true;
      } else {
        throw new Error('execCommand failed');
      }
    } catch (error) {
      setState({
        value: text,
        success: false,
        error: error instanceof Error ? error.message : 'Copy failed',
      });
      return false;
    }
  }, []);

  return [state, copyToClipboard];
}