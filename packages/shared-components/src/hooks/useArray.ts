import { useState, useCallback } from 'react';

// 数组操作 Hook
export function useArray<T>(initialValue: T[] = []) {
  const [array, setArray] = useState<T[]>(initialValue);

  // 添加元素
  const push = useCallback((element: T) => {
    setArray(prev => [...prev, element]);
  }, []);

  // 移除指定索引的元素
  const removeIndex = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 移除指定元素
  const remove = useCallback((element: T) => {
    setArray(prev => prev.filter(item => item !== element));
  }, []);

  // 更新指定索引的元素
  const updateIndex = useCallback((index: number, newElement: T) => {
    setArray(prev => prev.map((item, i) => i === index ? newElement : item));
  }, []);

  // 插入元素到指定位置
  const insert = useCallback((index: number, element: T) => {
    setArray(prev => {
      const newArray = [...prev];
      newArray.splice(index, 0, element);
      return newArray;
    });
  }, []);

  // 移动元素
  const move = useCallback((fromIndex: number, toIndex: number) => {
    setArray(prev => {
      const newArray = [...prev];
      const [removed] = newArray.splice(fromIndex, 1);
      newArray.splice(toIndex, 0, removed);
      return newArray;
    });
  }, []);

  // 清空数组
  const clear = useCallback(() => {
    setArray([]);
  }, []);

  // 重置为初始值
  const reset = useCallback(() => {
    setArray(initialValue);
  }, [initialValue]);

  // 排序
  const sort = useCallback((compareFn?: (a: T, b: T) => number) => {
    setArray(prev => [...prev].sort(compareFn));
  }, []);

  // 反转
  const reverse = useCallback(() => {
    setArray(prev => [...prev].reverse());
  }, []);

  // 过滤
  const filter = useCallback((predicate: (item: T, index: number) => boolean) => {
    setArray(prev => prev.filter(predicate));
  }, []);

  // 映射更新
  const map = useCallback((mapper: (item: T, index: number) => T) => {
    setArray(prev => prev.map(mapper));
  }, []);

  // 替换整个数组
  const replace = useCallback((newArray: T[]) => {
    setArray(newArray);
  }, []);

  return {
    array,
    set: setArray,
    push,
    removeIndex,
    remove,
    updateIndex,
    insert,
    move,
    clear,
    reset,
    sort,
    reverse,
    filter,
    map,
    replace,
    // 便捷属性
    length: array.length,
    isEmpty: array.length === 0,
    first: array[0],
    last: array[array.length - 1],
  };
}