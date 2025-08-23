// 字符串基础操作
export const isEmpty = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};

export const isNotEmpty = (str: string | null | undefined): boolean => {
  return !isEmpty(str);
};

export const trim = (str: string): string => {
  return str.trim();
};

export const trimStart = (str: string): string => {
  return str.trimStart();
};

export const trimEnd = (str: string): string => {
  return str.trimEnd();
};

// 大小写转换
export const toLowerCase = (str: string): string => {
  return str.toLowerCase();
};

export const toUpperCase = (str: string): string => {
  return str.toUpperCase();
};

export const capitalize = (str: string): string => {
  if (isEmpty(str)) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

export const toCamelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};

export const toPascalCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
    .replace(/\s+/g, '');
};

export const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
};

export const toSnakeCase = (str: string): string => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase();
};

// 字符串截取和填充
export const truncate = (str: string, maxLength: number, suffix: string = '...'): string => {
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - suffix.length) + suffix;
};

export const truncateWords = (str: string, maxWords: number, suffix: string = '...'): string => {
  const words = str.split(/\s+/);
  
  if (words.length <= maxWords) {
    return str;
  }
  
  return words.slice(0, maxWords).join(' ') + suffix;
};

export const padStart = (str: string, targetLength: number, padString: string = ' '): string => {
  return str.padStart(targetLength, padString);
};

export const padEnd = (str: string, targetLength: number, padString: string = ' '): string => {
  return str.padEnd(targetLength, padString);
};

export const padCenter = (str: string, targetLength: number, padString: string = ' '): string => {
  if (str.length >= targetLength) {
    return str;
  }
  
  const totalPadding = targetLength - str.length;
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;
  
  return padString.repeat(leftPadding) + str + padString.repeat(rightPadding);
};

// 字符串查找和替换
export const contains = (str: string, searchString: string, caseSensitive: boolean = true): boolean => {
  if (!caseSensitive) {
    return str.toLowerCase().includes(searchString.toLowerCase());
  }
  
  return str.includes(searchString);
};

export const startsWith = (str: string, searchString: string, caseSensitive: boolean = true): boolean => {
  if (!caseSensitive) {
    return str.toLowerCase().startsWith(searchString.toLowerCase());
  }
  
  return str.startsWith(searchString);
};

export const endsWith = (str: string, searchString: string, caseSensitive: boolean = true): boolean => {
  if (!caseSensitive) {
    return str.toLowerCase().endsWith(searchString.toLowerCase());
  }
  
  return str.endsWith(searchString);
};

export const indexOf = (str: string, searchString: string, caseSensitive: boolean = true): number => {
  if (!caseSensitive) {
    return str.toLowerCase().indexOf(searchString.toLowerCase());
  }
  
  return str.indexOf(searchString);
};

export const lastIndexOf = (str: string, searchString: string, caseSensitive: boolean = true): number => {
  if (!caseSensitive) {
    return str.toLowerCase().lastIndexOf(searchString.toLowerCase());
  }
  
  return str.lastIndexOf(searchString);
};

export const replaceAll = (str: string, searchValue: string, replaceValue: string): string => {
  return str.split(searchValue).join(replaceValue);
};

export const replaceAllIgnoreCase = (str: string, searchValue: string, replaceValue: string): string => {
  const regex = new RegExp(escapeRegExp(searchValue), 'gi');
  return str.replace(regex, replaceValue);
};

// 正则表达式相关
export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const isMatch = (str: string, pattern: string | RegExp): boolean => {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return regex.test(str);
};

export const extractMatches = (str: string, pattern: string | RegExp): string[] => {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : pattern;
  return str.match(regex) || [];
};

// 字符串分割和连接
export const split = (str: string, separator: string | RegExp, limit?: number): string[] => {
  return str.split(separator, limit);
};

export const splitLines = (str: string): string[] => {
  return str.split(/\r?\n/);
};

export const splitWords = (str: string): string[] => {
  return str.split(/\s+/).filter(word => word.length > 0);
};

export const join = (strings: string[], separator: string = ''): string => {
  return strings.join(separator);
};

// 字符串验证
export const isNumeric = (str: string): boolean => {
  return /^\d+$/.test(str);
};

export const isAlpha = (str: string): boolean => {
  return /^[a-zA-Z]+$/.test(str);
};

export const isAlphanumeric = (str: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

export const isEmail = (str: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
};

export const isURL = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

export const isPhoneNumber = (str: string): boolean => {
  // 简单的中国手机号验证
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(str.replace(/\D/g, ''));
};

export const isIPAddress = (str: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(str);
};

// 字符串转换
export const toNumber = (str: string): number | null => {
  const num = Number(str);
  return isNaN(num) ? null : num;
};

export const toBoolean = (str: string): boolean => {
  const lowerStr = str.toLowerCase().trim();
  return ['true', '1', 'yes', 'on', 'y'].includes(lowerStr);
};

export const toArray = (str: string, separator: string = ','): string[] => {
  return str.split(separator).map(item => item.trim()).filter(item => item.length > 0);
};

// 字符串清理
export const removeWhitespace = (str: string): string => {
  return str.replace(/\s/g, '');
};

export const removeExtraWhitespace = (str: string): string => {
  return str.replace(/\s+/g, ' ').trim();
};

export const removeSpecialChars = (str: string, keep: string = ''): string => {
  const keepChars = escapeRegExp(keep);
  const regex = new RegExp(`[^a-zA-Z0-9\\s${keepChars}]`, 'g');
  return str.replace(regex, '');
};

export const removeNumbers = (str: string): string => {
  return str.replace(/\d/g, '');
};

export const removeLetters = (str: string): string => {
  return str.replace(/[a-zA-Z]/g, '');
};

// 字符串统计
export const countChars = (str: string): number => {
  return str.length;
};

export const countWords = (str: string): number => {
  return splitWords(str).length;
};

export const countLines = (str: string): number => {
  return splitLines(str).length;
};

export const countOccurrences = (str: string, searchString: string, caseSensitive: boolean = true): number => {
  if (isEmpty(searchString)) return 0;
  
  const text = caseSensitive ? str : str.toLowerCase();
  const search = caseSensitive ? searchString : searchString.toLowerCase();
  
  let count = 0;
  let position = 0;
  
  while ((position = text.indexOf(search, position)) !== -1) {
    count++;
    position += search.length;
  }
  
  return count;
};

// 字符串比较
export const equals = (str1: string, str2: string, caseSensitive: boolean = true): boolean => {
  if (!caseSensitive) {
    return str1.toLowerCase() === str2.toLowerCase();
  }
  
  return str1 === str2;
};

export const compare = (str1: string, str2: string, caseSensitive: boolean = true): number => {
  const s1 = caseSensitive ? str1 : str1.toLowerCase();
  const s2 = caseSensitive ? str2 : str2.toLowerCase();
  
  if (s1 < s2) return -1;
  if (s1 > s2) return 1;
  return 0;
};

// 字符串相似度
export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

export const similarity = (str1: string, str2: string): number => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
};

// 字符串模板
export const template = (str: string, variables: Record<string, any>): string => {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match;
  });
};

export const interpolate = (str: string, variables: Record<string, any>): string => {
  return str.replace(/\$\{(\w+)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match;
  });
};

// 随机字符串生成
export const randomString = (length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

export const randomAlphabetic = (length: number): string => {
  return randomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
};

export const randomNumeric = (length: number): string => {
  return randomString(length, '0123456789');
};

export const randomAlphanumeric = (length: number): string => {
  return randomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
};

// 字符串编码
export const encodeHTML = (str: string): string => {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return str.replace(/[&<>"']/g, char => htmlEntities[char]);
};

export const decodeHTML = (str: string): string => {
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };
  
  return str.replace(/&(amp|lt|gt|quot|#39);/g, entity => htmlEntities[entity]);
};

export const encodeURI = (str: string): string => {
  return encodeURIComponent(str);
};

export const decodeURI = (str: string): string => {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

// 字符串格式化
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// 字符串常量
export const EMPTY_STRING = '';
export const SPACE = ' ';
export const TAB = '\t';
export const NEWLINE = '\n';
export const CARRIAGE_RETURN = '\r';
export const LINE_SEPARATOR = '\r\n';