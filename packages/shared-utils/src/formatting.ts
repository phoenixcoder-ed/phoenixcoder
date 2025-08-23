import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 数字格式化
export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCurrency = (amount: number, currency: string = 'CNY'): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 日期时间格式化
export const formatDate = (date: Date | string, pattern: string = 'yyyy-MM-dd'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    return '无效日期';
  }
  
  return format(dateObj, pattern, { locale: zhCN });
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
};

export const formatTime = (date: Date | string): string => {
  return formatDate(date, 'HH:mm:ss');
};

export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    return '无效日期';
  }
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: zhCN 
  });
};

export const formatDeadline = (deadline: Date | string): string => {
  const deadlineObj = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const now = new Date();
  
  if (!isValid(deadlineObj)) {
    return '无效截止时间';
  }
  
  const diffMs = deadlineObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return '已过期';
  } else if (diffDays === 0) {
    return '今天截止';
  } else if (diffDays === 1) {
    return '明天截止';
  } else if (diffDays <= 7) {
    return `${diffDays}天后截止`;
  } else {
    return formatDate(deadlineObj, 'MM-dd');
  }
};

// 文本格式化
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export const capitalizeFirst = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

export const camelToKebab = (str: string): string => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};

export const kebabToCamel = (str: string): string => {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
};

export const snakeToKebab = (str: string): string => {
  return str.replace(/_/g, '-');
};

export const kebabToSnake = (str: string): string => {
  return str.replace(/-/g, '_');
};

// 业务相关格式化
export const formatSkillLevel = (level: number): string => {
  const levels = ['初学者', '入门', '熟练', '精通', '专家'];
  return levels[level - 1] || '未知';
};

export const formatUserLevel = (level: string): string => {
  const levelMap: Record<string, string> = {
    'BEGINNER': '新手',
    'INTERMEDIATE': '进阶',
    'ADVANCED': '高级',
    'EXPERT': '专家',
  };
  
  return levelMap[level] || level;
};

export const formatTaskDifficulty = (difficulty: string): string => {
  const difficultyMap: Record<string, string> = {
    'EASY': '简单',
    'MEDIUM': '中等',
    'HARD': '困难',
    'EXPERT': '专家级',
  };
  
  return difficultyMap[difficulty] || difficulty;
};

export const formatTaskStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'DRAFT': '草稿',
    'PUBLISHED': '已发布',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消',
    'EXPIRED': '已过期',
  };
  
  return statusMap[status] || status;
};

export const formatRewardType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'MONEY': '现金',
    'POINTS': '积分',
    'BADGE': '徽章',
    'CERTIFICATE': '证书',
  };
  
  return typeMap[type] || type;
};

// 地址和联系方式格式化
export const formatPhoneNumber = (phone: string): string => {
  // 格式化中国手机号：138-1234-5678
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

export const maskPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}****${cleaned.slice(7)}`;
  }
  
  return phone;
};

export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  
  if (!username || !domain) {
    return email;
  }
  
  const maskedUsername = username.length > 2 
    ? `${username[0]}***${username[username.length - 1]}`
    : username;
  
  return `${maskedUsername}@${domain}`;
};

// URL 格式化
export const formatURL = (url: string): string => {
  if (!url) return '';
  
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  
  return url;
};

export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(formatURL(url));
    return urlObj.hostname;
  } catch {
    return url;
  }
};

// 代码格式化
export const formatCode = (code: string, _language: string = 'javascript'): string => {
  // 基础代码格式化，实际项目中建议使用 Prettier
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
};

export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// 数组格式化
export const formatList = (items: string[], conjunction: string = '和'): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(conjunction);
  
  return `${items.slice(0, -1).join('、')}${conjunction}${items[items.length - 1]}`;
};

export const formatTags = (tags: string[], maxDisplay: number = 3): string => {
  if (tags.length <= maxDisplay) {
    return tags.join(', ');
  }
  
  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;
  
  return `${displayTags.join(', ')} +${remainingCount}`;
};