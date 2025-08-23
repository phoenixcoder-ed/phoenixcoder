// 对象基础操作
export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

export const isNotEmpty = (obj: any): boolean => {
  return !isEmpty(obj);
};

export const isObject = (obj: any): obj is object => {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
};

export const isPlainObject = (obj: any): obj is Record<string, any> => {
  if (!isObject(obj)) return false;
  
  // 检查是否是普通对象（不是类实例）
  const proto = Object.getPrototypeOf(obj);
  return proto === null || proto === Object.prototype;
};

export const keys = <T extends Record<string, any>>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};

export const values = <T extends Record<string, any>>(obj: T): T[keyof T][] => {
  return Object.values(obj);
};

export const entries = <T extends Record<string, any>>(obj: T): [keyof T, T[keyof T]][] => {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
};

export const size = (obj: any): number => {
  if (obj == null) return 0;
  if (Array.isArray(obj)) return obj.length;
  if (typeof obj === 'object') return Object.keys(obj).length;
  if (typeof obj === 'string') return obj.length;
  return 0;
};

// 对象属性操作
export const has = <T extends Record<string, any>>(obj: T, key: string | number | symbol): boolean => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

export const hasPath = (obj: any, path: string | string[]): boolean => {
  const keys = Array.isArray(path) ? path : path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || !has(current, key)) {
      return false;
    }
    current = current[key];
  }
  
  return true;
};

export const get = <T = any>(obj: any, path: string | string[], defaultValue?: T): T => {
  const keys = Array.isArray(path) ? path : path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || !has(current, key)) {
      return defaultValue as T;
    }
    current = current[key];
  }
  
  return current as T;
};

export const set = <T extends Record<string, any>>(obj: T, path: string | string[], value: any): T => {
  const keys = Array.isArray(path) ? path : path.split('.');
  const result = { ...obj } as any;
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!has(current, key) || !isObject(current[key])) {
      current[key] = {};
    } else {
      current[key] = { ...current[key] };
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
};

export const unset = <T extends Record<string, any>>(obj: T, path: string | string[]): T => {
  const keys = Array.isArray(path) ? path : path.split('.');
  const result = { ...obj } as any;
  
  if (keys.length === 1) {
    delete result[keys[0]];
    return result;
  }
  
  let current = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!has(current, key) || !isObject(current[key])) {
      return result;
    }
    current[key] = { ...current[key] };
    current = current[key];
  }
  
  delete current[keys[keys.length - 1]];
  return result;
};

// 对象合并和克隆
export const clone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => clone(item)) as T;
  }
  
  if (isPlainObject(obj)) {
    const cloned = {} as T;
    for (const key in obj) {
      if (has(obj, key)) {
        (cloned as any)[key] = clone((obj as any)[key]);
      }
    }
    return cloned;
  }
  
  return obj;
};

export const shallowClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return [...obj] as T;
  }
  
  if (isPlainObject(obj)) {
    return { ...obj } as T;
  }
  
  return obj;
};

export const merge = <T extends Record<string, any>>(...objects: Partial<T>[]): T => {
  const result = {} as T;
  
  for (const obj of objects) {
    if (isPlainObject(obj)) {
      Object.assign(result, obj);
    }
  }
  
  return result;
};

export const deepMerge = <T extends Record<string, any>>(...objects: Partial<T>[]): T => {
  const result = {} as any;
  
  for (const obj of objects) {
    if (isPlainObject(obj)) {
      for (const key in obj) {
        if (has(obj, key)) {
          const value = obj[key];
          
          if (isPlainObject(value) && isPlainObject(result[key])) {
            result[key] = deepMerge(result[key], value);
          } else {
            result[key] = clone(value);
          }
        }
      }
    }
  }
  
  return result as T;
};

export const assign = <T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T => {
  return Object.assign(target, ...sources);
};

// 对象过滤和转换
export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  
  for (const key of keys) {
    if (has(obj, key)) {
      result[key] = obj[key];
    }
  }
  
  return result;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj } as Omit<T, K>;
  
  for (const key of keys) {
    delete (result as any)[key];
  }
  
  return result;
};

export const pickBy = <T extends Record<string, any>>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> => {
  const result = {} as Partial<T>;
  
  for (const key in obj) {
    if (has(obj, key) && predicate(obj[key], key)) {
      result[key] = obj[key];
    }
  }
  
  return result;
};

export const omitBy = <T extends Record<string, any>>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> => {
  const result = {} as Partial<T>;
  
  for (const key in obj) {
    if (has(obj, key) && !predicate(obj[key], key)) {
      result[key] = obj[key];
    }
  }
  
  return result;
};

export const mapValues = <T extends Record<string, any>, U>(
  obj: T,
  mapper: (value: T[keyof T], key: keyof T) => U
): Record<keyof T, U> => {
  const result = {} as Record<keyof T, U>;
  
  for (const key in obj) {
    if (has(obj, key)) {
      result[key] = mapper(obj[key], key);
    }
  }
  
  return result;
};

export const mapKeys = <T extends Record<string, any>, K extends string | number | symbol>(
  obj: T,
  mapper: (value: T[keyof T], key: keyof T) => K
): Record<K, T[keyof T]> => {
  const result = {} as Record<K, T[keyof T]>;
  
  for (const key in obj) {
    if (has(obj, key)) {
      const newKey = mapper(obj[key], key);
      result[newKey] = obj[key];
    }
  }
  
  return result;
};

// 对象比较
export const equals = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    return obj1.every((item, index) => equals(item, obj2[index]));
  }
  
  if (isPlainObject(obj1) && isPlainObject(obj2)) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => has(obj2, key) && equals(obj1[key], obj2[key]));
  }
  
  return false;
};

export const shallowEquals = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    return obj1.every((item, index) => item === obj2[index]);
  }
  
  if (isPlainObject(obj1) && isPlainObject(obj2)) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => has(obj2, key) && obj1[key] === obj2[key]);
  }
  
  return false;
};

// 对象验证
export const isEqual = equals;
export const isShallowEqual = shallowEquals;

export const hasValue = (obj: any, value: any): boolean => {
  if (Array.isArray(obj)) {
    return obj.includes(value);
  }
  
  if (isPlainObject(obj)) {
    return Object.values(obj).includes(value);
  }
  
  return false;
};

export const hasDeepValue = (obj: any, value: any): boolean => {
  if (equals(obj, value)) return true;
  
  if (Array.isArray(obj)) {
    return obj.some(item => hasDeepValue(item, value));
  }
  
  if (isPlainObject(obj)) {
    return Object.values(obj).some(item => hasDeepValue(item, value));
  }
  
  return false;
};

// 对象转换
export const toArray = <T extends Record<string, any>>(
  obj: T,
  mapper?: (value: T[keyof T], key: keyof T) => any
): any[] => {
  const result: any[] = [];
  
  for (const key in obj) {
    if (has(obj, key)) {
      const value = mapper ? mapper(obj[key], key) : obj[key];
      result.push(value);
    }
  }
  
  return result;
};

export const toPairs = <T extends Record<string, any>>(obj: T): [keyof T, T[keyof T]][] => {
  return entries(obj);
};

export const fromPairs = <K extends string | number | symbol, V>(
  pairs: [K, V][]
): Record<K, V> => {
  const result = {} as Record<K, V>;
  
  for (const [key, value] of pairs) {
    result[key] = value;
  }
  
  return result;
};

export const invert = <T extends Record<string | number, string | number>>(
  obj: T
): Record<T[keyof T], keyof T> => {
  const result = {} as Record<T[keyof T], keyof T>;
  
  for (const key in obj) {
    if (has(obj, key)) {
      const value = obj[key];
      result[value] = key;
    }
  }
  
  return result;
};

export const invertBy = <T extends Record<string, any>, K extends string | number | symbol>(
  obj: T,
  mapper: (value: T[keyof T]) => K
): Record<K, (keyof T)[]> => {
  const result = {} as Record<K, (keyof T)[]>;
  
  for (const key in obj) {
    if (has(obj, key)) {
      const mappedKey = mapper(obj[key]);
      if (!result[mappedKey]) {
        result[mappedKey] = [];
      }
      result[mappedKey].push(key);
    }
  }
  
  return result;
};

// 对象路径操作
export const paths = (obj: any, currentPath: string[] = []): string[][] => {
  const result: string[][] = [];
  
  if (isPlainObject(obj)) {
    for (const key in obj) {
      if (has(obj, key)) {
        const newPath = [...currentPath, key];
        result.push(newPath);
        result.push(...paths(obj[key], newPath));
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const newPath = [...currentPath, index.toString()];
      result.push(newPath);
      result.push(...paths(item, newPath));
    });
  }
  
  return result;
};

export const pathValues = (obj: any): Array<{ path: string[]; value: any }> => {
  const result: Array<{ path: string[]; value: any }> = [];
  
  const traverse = (current: any, currentPath: string[] = []) => {
    if (isPlainObject(current)) {
      for (const key in current) {
        if (has(current, key)) {
          const newPath = [...currentPath, key];
          result.push({ path: newPath, value: current[key] });
          traverse(current[key], newPath);
        }
      }
    } else if (Array.isArray(current)) {
      current.forEach((item, index) => {
        const newPath = [...currentPath, index.toString()];
        result.push({ path: newPath, value: item });
        traverse(item, newPath);
      });
    }
  };
  
  traverse(obj);
  return result;
};

// 对象扁平化
export const flatten = (obj: any, separator: string = '.'): Record<string, any> => {
  const result: Record<string, any> = {};
  
  const traverse = (current: any, prefix: string = '') => {
    if (isPlainObject(current)) {
      for (const key in current) {
        if (has(current, key)) {
          const newKey = prefix ? `${prefix}${separator}${key}` : key;
          traverse(current[key], newKey);
        }
      }
    } else if (Array.isArray(current)) {
      current.forEach((item, index) => {
        const newKey = `${prefix}${separator}${index}`;
        traverse(item, newKey);
      });
    } else {
      result[prefix] = current;
    }
  };
  
  traverse(obj);
  return result;
};

export const unflatten = (obj: Record<string, any>, separator: string = '.'): any => {
  const result: any = {};
  
  for (const key in obj) {
    if (has(obj, key)) {
      const keys = key.split(separator);
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!has(current, k)) {
          // 检查下一个键是否是数字，决定创建对象还是数组
          const nextKey = keys[i + 1];
          current[k] = /^\d+$/.test(nextKey) ? [] : {};
        }
        current = current[k];
      }
      
      current[keys[keys.length - 1]] = obj[key];
    }
  }
  
  return result;
};

// 对象工具函数
export const freeze = <T>(obj: T): Readonly<T> => {
  return Object.freeze(obj);
};

export const seal = <T>(obj: T): T => {
  return Object.seal(obj);
};

export const isFrozen = (obj: any): boolean => {
  return Object.isFrozen(obj);
};

export const isSealed = (obj: any): boolean => {
  return Object.isSealed(obj);
};

export const isExtensible = (obj: any): boolean => {
  return Object.isExtensible(obj);
};

// 对象序列化
export const stringify = (obj: any, space?: number): string => {
  return JSON.stringify(obj, null, space);
};

export const parse = <T = any>(str: string): T | null => {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
};

// 对象缓存和记忆化
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

export const memoizeWith = <T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// 对象常量
export const EMPTY_OBJECT: Readonly<Record<string, never>> = Object.freeze({});