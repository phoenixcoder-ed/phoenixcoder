// 验证器工具
export const validators = {
  // 邮箱验证
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  // URL验证
  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  // 电话号码验证
  phone: (value: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
  },

  // 密码强度验证
  password: {
    weak: (value: string): boolean => value.length >= 6,
    medium: (value: string): boolean => {
      return value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
    },
    strong: (value: string): boolean => {
      return value.length >= 8 && 
             /[a-z]/.test(value) && 
             /[A-Z]/.test(value) && 
             /[0-9]/.test(value) && 
             /[^a-zA-Z0-9]/.test(value);
    },
  },

  // 数字验证
  number: (value: string): boolean => {
    return !isNaN(Number(value)) && isFinite(Number(value));
  },

  // 整数验证
  integer: (value: string): boolean => {
    return Number.isInteger(Number(value));
  },

  // 正数验证
  positive: (value: string): boolean => {
    return validators.number(value) && Number(value) > 0;
  },

  // 范围验证
  range: (min: number, max: number) => (value: string): boolean => {
    const num = Number(value);
    return validators.number(value) && num >= min && num <= max;
  },

  // 长度验证
  length: {
    min: (minLength: number) => (value: string): boolean => {
      return value.length >= minLength;
    },
    max: (maxLength: number) => (value: string): boolean => {
      return value.length <= maxLength;
    },
    exact: (exactLength: number) => (value: string): boolean => {
      return value.length === exactLength;
    },
    between: (min: number, max: number) => (value: string): boolean => {
      return value.length >= min && value.length <= max;
    },
  },

  // 正则表达式验证
  pattern: (regex: RegExp) => (value: string): boolean => {
    return regex.test(value);
  },

  // 必填验证
  required: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  // 日期验证
  date: (value: string): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  // 信用卡号验证（Luhn算法）
  creditCard: (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },
};