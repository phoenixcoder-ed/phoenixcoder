import { useState, useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface IntersectionObserverEntry {
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  target: Element;
  time: number;
}

// 交叉观察器 Hook
export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<T>(null);
  const frozen = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen.current || !element) {
      return;
    }

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(
      ([entry]: IntersectionObserverEntry[]) => {
        const isIntersecting = entry.isIntersecting;
        setEntry(entry);
        setIsVisible(isIntersecting);

        if (freezeOnceVisible && isIntersecting) {
          frozen.current = true;
        }
      },
      observerParams
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible]);

  return {
    ref: elementRef,
    entry,
    isVisible,
    isIntersecting: entry?.isIntersecting ?? false,
  };
}

// 懒加载 Hook
export function useLazyLoad<T extends Element = HTMLImageElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const { ref, isVisible } = useIntersectionObserver<T>({
    freezeOnceVisible: true,
    ...options,
  });

  return {
    ref,
    shouldLoad: isVisible,
  };
}

// 无限滚动 Hook
export function useInfiniteScroll<T extends Element = HTMLDivElement>(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
) {
  const { ref, isVisible } = useIntersectionObserver<T>(options);

  useEffect(() => {
    if (isVisible) {
      callback();
    }
  }, [isVisible, callback]);

  return ref;
}