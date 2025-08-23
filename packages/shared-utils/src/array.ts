// 数组基础操作
export const isEmpty = <T>(arr: T[] | null | undefined): boolean => {
  return !arr || arr.length === 0;
};

export const isNotEmpty = <T>(arr: T[] | null | undefined): boolean => {
  return !isEmpty(arr);
};

export const first = <T>(arr: T[]): T | undefined => {
  return arr[0];
};

export const last = <T>(arr: T[]): T | undefined => {
  return arr[arr.length - 1];
};

export const head = <T>(arr: T[]): T | undefined => {
  return first(arr);
};

export const tail = <T>(arr: T[]): T[] => {
  return arr.slice(1);
};

export const init = <T>(arr: T[]): T[] => {
  return arr.slice(0, -1);
};

export const take = <T>(arr: T[], count: number): T[] => {
  return arr.slice(0, count);
};

export const drop = <T>(arr: T[], count: number): T[] => {
  return arr.slice(count);
};

export const slice = <T>(arr: T[], start: number, end?: number): T[] => {
  return arr.slice(start, end);
};

// 数组查找
export const find = <T>(arr: T[], predicate: (item: T, index: number) => boolean): T | undefined => {
  return arr.find(predicate);
};

export const findIndex = <T>(arr: T[], predicate: (item: T, index: number) => boolean): number => {
  return arr.findIndex(predicate);
};

export const findLast = <T>(arr: T[], predicate: (item: T, index: number) => boolean): T | undefined => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i], i)) {
      return arr[i];
    }
  }
  return undefined;
};

export const findLastIndex = <T>(arr: T[], predicate: (item: T, index: number) => boolean): number => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i], i)) {
      return i;
    }
  }
  return -1;
};

export const includes = <T>(arr: T[], item: T): boolean => {
  return arr.includes(item);
};

export const indexOf = <T>(arr: T[], item: T, fromIndex?: number): number => {
  return arr.indexOf(item, fromIndex);
};

export const lastIndexOf = <T>(arr: T[], item: T, fromIndex?: number): number => {
  return arr.lastIndexOf(item, fromIndex);
};

// 数组过滤
export const filter = <T>(arr: T[], predicate: (item: T, index: number) => boolean): T[] => {
  return arr.filter(predicate);
};

export const reject = <T>(arr: T[], predicate: (item: T, index: number) => boolean): T[] => {
  return arr.filter((item, index) => !predicate(item, index));
};

export const compact = <T>(arr: (T | null | undefined | false | 0 | '')[]): T[] => {
  return arr.filter(Boolean) as T[];
};

export const unique = <T>(arr: T[]): T[] => {
  return [...new Set(arr)];
};

export const uniqueBy = <T, K>(arr: T[], keyFn: (item: T) => K): T[] => {
  const seen = new Set<K>();
  return arr.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const without = <T>(arr: T[], ...values: T[]): T[] => {
  const excludeSet = new Set(values);
  return arr.filter(item => !excludeSet.has(item));
};

// 数组转换
export const map = <T, U>(arr: T[], mapper: (item: T, index: number) => U): U[] => {
  return arr.map(mapper);
};

export const flatMap = <T, U>(arr: T[], mapper: (item: T, index: number) => U[]): U[] => {
  return arr.flatMap(mapper);
};

export const flatten = <T>(arr: (T | T[])[]): T[] => {
  return arr.flat() as T[];
};

export const flattenDeep = (arr: any[]): any[] => {
  return arr.reduce((acc, val) => {
    return acc.concat(Array.isArray(val) ? flattenDeep(val) : val);
  }, []);
};

export const reverse = <T>(arr: T[]): T[] => {
  return [...arr].reverse();
};

export const sort = <T>(arr: T[], compareFn?: (a: T, b: T) => number): T[] => {
  return [...arr].sort(compareFn);
};

export const sortBy = <T, K>(arr: T[], keyFn: (item: T) => K): T[] => {
  return [...arr].sort((a, b) => {
    const keyA = keyFn(a);
    const keyB = keyFn(b);
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
};

export const shuffle = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// 数组聚合
export const reduce = <T, U>(arr: T[], reducer: (acc: U, item: T, index: number) => U, initialValue: U): U => {
  return arr.reduce(reducer, initialValue);
};

export const sum = (arr: number[]): number => {
  return arr.reduce((acc, val) => acc + val, 0);
};

export const average = (arr: number[]): number => {
  return isEmpty(arr) ? 0 : sum(arr) / arr.length;
};

export const min = (arr: number[]): number | undefined => {
  return isEmpty(arr) ? undefined : Math.min(...arr);
};

export const max = (arr: number[]): number | undefined => {
  return isEmpty(arr) ? undefined : Math.max(...arr);
};

export const minBy = <T>(arr: T[], keyFn: (item: T) => number): T | undefined => {
  if (isEmpty(arr)) return undefined;
  
  return arr.reduce((min, current) => {
    return keyFn(current) < keyFn(min) ? current : min;
  });
};

export const maxBy = <T>(arr: T[], keyFn: (item: T) => number): T | undefined => {
  if (isEmpty(arr)) return undefined;
  
  return arr.reduce((max, current) => {
    return keyFn(current) > keyFn(max) ? current : max;
  });
};

export const count = <T>(arr: T[], predicate?: (item: T, index: number) => boolean): number => {
  if (!predicate) return arr.length;
  return arr.filter(predicate).length;
};

export const countBy = <T, K>(arr: T[], keyFn: (item: T) => K): Map<K, number> => {
  const counts = new Map<K, number>();
  
  arr.forEach(item => {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  
  return counts;
};

// 数组分组
export const groupBy = <T, K>(arr: T[], keyFn: (item: T) => K): Map<K, T[]> => {
  const groups = new Map<K, T[]>();
  
  arr.forEach(item => {
    const key = keyFn(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });
  
  return groups;
};

export const partition = <T>(arr: T[], predicate: (item: T, index: number) => boolean): [T[], T[]] => {
  const truthy: T[] = [];
  const falsy: T[] = [];
  
  arr.forEach((item, index) => {
    if (predicate(item, index)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  });
  
  return [truthy, falsy];
};

export const chunk = <T>(arr: T[], size: number): T[][] => {
  if (size <= 0) return [];
  
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  
  return chunks;
};

export const splitAt = <T>(arr: T[], index: number): [T[], T[]] => {
  return [arr.slice(0, index), arr.slice(index)];
};

// 数组组合
export const concat = <T>(...arrays: T[][]): T[] => {
  return arrays.flat();
};

export const union = <T>(...arrays: T[][]): T[] => {
  return unique(concat(...arrays));
};

export const intersection = <T>(arr1: T[], arr2: T[]): T[] => {
  const set2 = new Set(arr2);
  return unique(arr1.filter(item => set2.has(item)));
};

export const difference = <T>(arr1: T[], arr2: T[]): T[] => {
  const set2 = new Set(arr2);
  return arr1.filter(item => !set2.has(item));
};

export const symmetricDifference = <T>(arr1: T[], arr2: T[]): T[] => {
  return union(difference(arr1, arr2), difference(arr2, arr1));
};

export const zip = <T, U>(arr1: T[], arr2: U[]): [T, U][] => {
  const length = Math.min(arr1.length, arr2.length);
  const result: [T, U][] = [];
  
  for (let i = 0; i < length; i++) {
    result.push([arr1[i], arr2[i]]);
  }
  
  return result;
};

export const zipWith = <T, U, R>(arr1: T[], arr2: U[], fn: (a: T, b: U) => R): R[] => {
  const length = Math.min(arr1.length, arr2.length);
  const result: R[] = [];
  
  for (let i = 0; i < length; i++) {
    result.push(fn(arr1[i], arr2[i]));
  }
  
  return result;
};

export const unzip = <T, U>(pairs: [T, U][]): [T[], U[]] => {
  const arr1: T[] = [];
  const arr2: U[] = [];
  
  pairs.forEach(([a, b]) => {
    arr1.push(a);
    arr2.push(b);
  });
  
  return [arr1, arr2];
};

// 数组验证
export const every = <T>(arr: T[], predicate: (item: T, index: number) => boolean): boolean => {
  return arr.every(predicate);
};

export const some = <T>(arr: T[], predicate: (item: T, index: number) => boolean): boolean => {
  return arr.some(predicate);
};

export const none = <T>(arr: T[], predicate: (item: T, index: number) => boolean): boolean => {
  return !arr.some(predicate);
};

export const equals = <T>(arr1: T[], arr2: T[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  
  return arr1.every((item, index) => item === arr2[index]);
};

export const deepEquals = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  
  return arr1.every((item, index) => {
    const other = arr2[index];
    
    if (Array.isArray(item) && Array.isArray(other)) {
      return deepEquals(item, other);
    }
    
    if (typeof item === 'object' && typeof other === 'object' && item !== null && other !== null) {
      return JSON.stringify(item) === JSON.stringify(other);
    }
    
    return item === other;
  });
};

// 数组转换为其他类型
export const toObject = <T, K extends string | number | symbol, V>(
  arr: T[],
  keyFn: (item: T) => K,
  valueFn?: (item: T) => V
): Record<K, V | T> => {
  const result = {} as Record<K, V | T>;
  
  arr.forEach(item => {
    const key = keyFn(item);
    const value = valueFn ? valueFn(item) : item;
    result[key] = value;
  });
  
  return result;
};

export const toMap = <T, K, V>(
  arr: T[],
  keyFn: (item: T) => K,
  valueFn?: (item: T) => V
): Map<K, V | T> => {
  const result = new Map<K, V | T>();
  
  arr.forEach(item => {
    const key = keyFn(item);
    const value = valueFn ? valueFn(item) : item;
    result.set(key, value);
  });
  
  return result;
};

export const toSet = <T>(arr: T[]): Set<T> => {
  return new Set(arr);
};

export const toString = <T>(arr: T[], separator: string = ','): string => {
  return arr.join(separator);
};

// 数组采样
export const sample = <T>(arr: T[]): T | undefined => {
  if (isEmpty(arr)) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
};

export const sampleSize = <T>(arr: T[], size: number): T[] => {
  if (size >= arr.length) return shuffle(arr);
  if (size <= 0) return [];
  
  const shuffled = shuffle(arr);
  return shuffled.slice(0, size);
};

// 数组范围生成
export const range = (start: number, end?: number, step: number = 1): number[] => {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  
  const result: number[] = [];
  
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
  } else if (step < 0) {
    for (let i = start; i > end; i += step) {
      result.push(i);
    }
  }
  
  return result;
};

export const repeat = <T>(item: T, count: number): T[] => {
  return Array(count).fill(item);
};

export const times = <T>(count: number, fn: (index: number) => T): T[] => {
  return Array.from({ length: count }, (_, index) => fn(index));
};

// 数组移动和插入
export const move = <T>(arr: T[], fromIndex: number, toIndex: number): T[] => {
  const result = [...arr];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
};

export const insert = <T>(arr: T[], index: number, ...items: T[]): T[] => {
  const result = [...arr];
  result.splice(index, 0, ...items);
  return result;
};

export const remove = <T>(arr: T[], index: number, count: number = 1): T[] => {
  const result = [...arr];
  result.splice(index, count);
  return result;
};

export const replace = <T>(arr: T[], index: number, item: T): T[] => {
  const result = [...arr];
  result[index] = item;
  return result;
};

// 数组业务相关函数
export const paginate = <T>(arr: T[], page: number, pageSize: number): {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} => {
  const total = arr.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = arr.slice(startIndex, endIndex);
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export const search = <T>(arr: T[], query: string, searchFn: (item: T) => string): T[] => {
  const lowerQuery = query.toLowerCase();
  return arr.filter(item => {
    const searchText = searchFn(item).toLowerCase();
    return searchText.includes(lowerQuery);
  });
};

export const fuzzySearch = <T>(arr: T[], query: string, searchFn: (item: T) => string): T[] => {
  const lowerQuery = query.toLowerCase().replace(/\s+/g, '');
  
  return arr.filter(item => {
    const searchText = searchFn(item).toLowerCase().replace(/\s+/g, '');
    
    // 简单的模糊匹配：检查查询字符是否按顺序出现在搜索文本中
    let queryIndex = 0;
    for (let i = 0; i < searchText.length && queryIndex < lowerQuery.length; i++) {
      if (searchText[i] === lowerQuery[queryIndex]) {
        queryIndex++;
      }
    }
    
    return queryIndex === lowerQuery.length;
  });
};

// 数组性能优化
export const memoizeArray = <T, R>(fn: (arr: T[]) => R): (arr: T[]) => R => {
  const cache = new Map<string, R>();
  
  return (arr: T[]): R => {
    const key = JSON.stringify(arr);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(arr);
    cache.set(key, result);
    return result;
  };
};

export const debounceArray = <T>(fn: (arr: T[]) => void, delay: number): (arr: T[]) => void => {
  let timeoutId: NodeJS.Timeout;
  
  return (arr: T[]): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(arr), delay);
  };
};

// 数组常量
export const EMPTY_ARRAY: readonly any[] = Object.freeze([]);