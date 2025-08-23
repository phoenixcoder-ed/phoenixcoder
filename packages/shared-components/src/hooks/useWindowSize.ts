import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

// 窗口尺寸检测 Hook
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    
    // 初始化时调用一次
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// 窗口尺寸变化回调 Hook
export function useWindowSizeCallback(callback: (size: WindowSize) => void) {
  const windowSize = useWindowSize();

  useEffect(() => {
    callback(windowSize);
  }, [windowSize, callback]);

  return windowSize;
}