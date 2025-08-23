import {
  format,
  parse,
  parseISO,
  isValid,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  differenceInSeconds,
  isBefore,
  isAfter,
  isSameDay,
  isWeekend,
  getYear,
  setYear,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 常用日期格式
export const DATE_FORMATS = {
  DATE: 'yyyy-MM-dd',
  TIME: 'HH:mm:ss',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  DATETIME_SHORT: 'yyyy-MM-dd HH:mm',
  DATE_CN: 'yyyy年MM月dd日',
  DATETIME_CN: 'yyyy年MM月dd日 HH:mm:ss',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  MONTH_DAY: 'MM-dd',
  YEAR_MONTH: 'yyyy-MM',
} as const;

// 日期创建和解析
export const createDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day);
};

export const createDateTime = (
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): Date => {
  return new Date(year, month - 1, day, hour, minute, second);
};

export const parseDate = (dateString: string, formatString?: string): Date | null => {
  try {
    if (formatString) {
      return parse(dateString, formatString, new Date(), { locale: zhCN });
    }
    
    // 尝试解析 ISO 格式
    const isoDate = parseISO(dateString);
    if (isValid(isoDate)) {
      return isoDate;
    }
    
    // 尝试解析常用格式
    const formats = [
      DATE_FORMATS.DATE,
      DATE_FORMATS.DATETIME,
      DATE_FORMATS.DATETIME_SHORT,
      DATE_FORMATS.DATE_CN,
      DATE_FORMATS.DATETIME_CN,
    ];
    
    for (const fmt of formats) {
      try {
        const parsed = parse(dateString, fmt, new Date(), { locale: zhCN });
        if (isValid(parsed)) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

// 日期格式化
export const formatDate = (date: Date | string, formatString: string = DATE_FORMATS.DATE): string => {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  
  if (!dateObj || !isValid(dateObj)) {
    return '';
  }
  
  return format(dateObj, formatString, { locale: zhCN });
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, DATE_FORMATS.DATETIME);
};

export const formatTime = (date: Date | string): string => {
  return formatDate(date, DATE_FORMATS.TIME);
};

export const formatDateCN = (date: Date | string): string => {
  return formatDate(date, DATE_FORMATS.DATE_CN);
};

export const formatDateTimeCN = (date: Date | string): string => {
  return formatDate(date, DATE_FORMATS.DATETIME_CN);
};

// 日期计算
export const addTime = (
  date: Date,
  amount: number,
  unit: 'days' | 'weeks' | 'months' | 'years'
): Date => {
  switch (unit) {
    case 'days':
      return addDays(date, amount);
    case 'weeks':
      return addWeeks(date, amount);
    case 'months':
      return addMonths(date, amount);
    case 'years':
      return addYears(date, amount);
    default:
      return date;
  }
};

export const subtractTime = (
  date: Date,
  amount: number,
  unit: 'days' | 'weeks' | 'months' | 'years'
): Date => {
  switch (unit) {
    case 'days':
      return subDays(date, amount);
    case 'weeks':
      return subWeeks(date, amount);
    case 'months':
      return subMonths(date, amount);
    case 'years':
      return subYears(date, amount);
    default:
      return date;
  }
};

// 日期范围
export const getDateRange = (
  start: Date,
  end: Date,
  unit: 'days' | 'weeks' | 'months' = 'days'
): Date[] => {
  const dates: Date[] = [];
  let current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    current = addTime(current, 1, unit);
  }
  
  return dates;
};

export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  return {
    start: startOfWeek(date, { locale: zhCN }),
    end: endOfWeek(date, { locale: zhCN }),
  };
};

export const getMonthRange = (date: Date): { start: Date; end: Date } => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
};

export const getYearRange = (date: Date): { start: Date; end: Date } => {
  return {
    start: startOfYear(date),
    end: endOfYear(date),
  };
};

// 日期比较
export const isDateBefore = (date1: Date, date2: Date): boolean => {
  return isBefore(date1, date2);
};

export const isDateAfter = (date1: Date, date2: Date): boolean => {
  return isAfter(date1, date2);
};

export const isDateEqual = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return (isAfter(date, start) || isSameDay(date, start)) &&
         (isBefore(date, end) || isSameDay(date, end));
};

// 日期差值计算
export const getDaysDifference = (date1: Date, date2: Date): number => {
  return differenceInDays(date2, date1);
};

export const getWeeksDifference = (date1: Date, date2: Date): number => {
  return differenceInWeeks(date2, date1);
};

export const getMonthsDifference = (date1: Date, date2: Date): number => {
  return differenceInMonths(date2, date1);
};

export const getYearsDifference = (date1: Date, date2: Date): number => {
  return differenceInYears(date2, date1);
};

export const getTimeDifference = (date1: Date, date2: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} => {
  const totalSeconds = differenceInSeconds(date2, date1);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  
  return { days, hours, minutes, seconds };
};

// 业务相关日期函数
export const isWorkingDay = (date: Date): boolean => {
  return !isWeekend(date);
};

export const getNextWorkingDay = (date: Date): Date => {
  let nextDay = addDays(date, 1);
  while (isWeekend(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
};

export const getPreviousWorkingDay = (date: Date): Date => {
  let prevDay = subDays(date, 1);
  while (isWeekend(prevDay)) {
    prevDay = subDays(prevDay, 1);
  }
  return prevDay;
};

export const getWorkingDaysInMonth = (date: Date): number => {
  const { start, end } = getMonthRange(date);
  const days = getDateRange(start, end);
  return days.filter(isWorkingDay).length;
};

// 时区相关
export const getTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const getTimezoneOffset = (date: Date = new Date()): number => {
  return date.getTimezoneOffset();
};

export const convertToTimezone = (date: Date, _timezone: string): Date => {
  // 简化实现，实际项目中建议使用 date-fns-tz
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc);
};

// 相对时间
export const getRelativeTime = (date: Date, baseDate: Date = new Date()): string => {
  const diff = getDaysDifference(baseDate, date);
  
  if (diff === 0) {
    return '今天';
  } else if (diff === 1) {
    return '明天';
  } else if (diff === -1) {
    return '昨天';
  } else if (diff > 1 && diff <= 7) {
    return `${diff}天后`;
  } else if (diff < -1 && diff >= -7) {
    return `${Math.abs(diff)}天前`;
  } else if (diff > 7) {
    return formatDate(date, DATE_FORMATS.MONTH_DAY);
  } else {
    return formatDate(date, DATE_FORMATS.MONTH_DAY);
  }
};

// 年龄计算
export const calculateAge = (birthDate: Date, referenceDate: Date = new Date()): number => {
  return getYearsDifference(birthDate, referenceDate);
};

// 生日相关
export const getNextBirthday = (birthDate: Date, referenceDate: Date = new Date()): Date => {
  const thisYearBirthday = setYear(birthDate, getYear(referenceDate));
  
  if (isAfter(thisYearBirthday, referenceDate) || isSameDay(thisYearBirthday, referenceDate)) {
    return thisYearBirthday;
  }
  
  return setYear(birthDate, getYear(referenceDate) + 1);
};

export const getDaysUntilBirthday = (birthDate: Date, referenceDate: Date = new Date()): number => {
  const nextBirthday = getNextBirthday(birthDate, referenceDate);
  return getDaysDifference(referenceDate, nextBirthday);
};

// 日期验证
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && isValid(date);
};

export const isValidDateString = (dateString: string): boolean => {
  const parsed = parseDate(dateString);
  return parsed !== null && isValid(parsed);
};

export const isDateInPast = (date: Date, referenceDate: Date = new Date()): boolean => {
  return isBefore(date, referenceDate);
};

export const isDateInFuture = (date: Date, referenceDate: Date = new Date()): boolean => {
  return isAfter(date, referenceDate);
};

// 日期数组操作
export const sortDates = (dates: Date[], order: 'asc' | 'desc' = 'asc'): Date[] => {
  return [...dates].sort((a, b) => {
    const diff = a.getTime() - b.getTime();
    return order === 'asc' ? diff : -diff;
  });
};

export const getEarliestDate = (dates: Date[]): Date | null => {
  if (dates.length === 0) return null;
  return new Date(Math.min(...dates.map(d => d.getTime())));
};

export const getLatestDate = (dates: Date[]): Date | null => {
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map(d => d.getTime())));
};

// 日期格式检测
export const detectDateFormat = (dateString: string): string | null => {
  const formats = [
    DATE_FORMATS.DATE,
    DATE_FORMATS.DATETIME,
    DATE_FORMATS.DATETIME_SHORT,
    DATE_FORMATS.DATE_CN,
    DATE_FORMATS.DATETIME_CN,
    DATE_FORMATS.ISO,
  ];
  
  for (const format of formats) {
    try {
      const parsed = parse(dateString, format, new Date(), { locale: zhCN });
      if (isValid(parsed)) {
        return format;
      }
    } catch {
      continue;
    }
  }
  
  return null;
};

// 常用日期常量
export const TODAY = new Date();
export const YESTERDAY = subDays(TODAY, 1);
export const TOMORROW = addDays(TODAY, 1);
export const THIS_WEEK_START = startOfWeek(TODAY, { locale: zhCN });
export const THIS_WEEK_END = endOfWeek(TODAY, { locale: zhCN });
export const THIS_MONTH_START = startOfMonth(TODAY);
export const THIS_MONTH_END = endOfMonth(TODAY);
export const THIS_YEAR_START = startOfYear(TODAY);
export const THIS_YEAR_END = endOfYear(TODAY);