import validator from 'validator';
import { SkillLevel, TaskDifficulty, UserLevel } from '@phoenixcoder/shared-types';

// 基础验证函数
export const isEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

export const isURL = (url: string): boolean => {
  return validator.isURL(url);
};

export const isUUID = (uuid: string): boolean => {
  return validator.isUUID(uuid);
};

export const isStrongPassword = (password: string): boolean => {
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });
};

export const isPhoneNumber = (phone: string, locale?: string): boolean => {
  return validator.isMobilePhone(phone, locale as any);
};

export const isAlphanumeric = (str: string): boolean => {
  return validator.isAlphanumeric(str);
};

export const isLength = (str: string, min: number, max?: number): boolean => {
  return validator.isLength(str, { min, max });
};

// 业务相关验证
export const isValidUsername = (username: string): boolean => {
  // 用户名：3-20个字符，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const isValidSkillLevel = (level: number): boolean => {
  return Object.values(SkillLevel).includes(level);
};

export const isValidTaskDifficulty = (difficulty: string): boolean => {
  return Object.values(TaskDifficulty).includes(difficulty as TaskDifficulty);
};

export const isValidUserLevel = (level: string): boolean => {
  return Object.values(UserLevel).includes(level as UserLevel);
};

export const isValidReward = (amount: number): boolean => {
  return amount > 0 && amount <= 100000; // 最大奖励限制
};

export const isValidDeadline = (deadline: Date): boolean => {
  const now = new Date();
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(now.getFullYear() + 1); // 最多一年后
  
  return deadline > now && deadline <= maxFutureDate;
};

// 文件验证
export const isValidImageFile = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(ext);
};

export const isValidDocumentFile = (filename: string): boolean => {
  const docExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return docExtensions.includes(ext);
};

export const isValidFileSize = (size: number, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxSizeBytes;
};

// 数据结构验证
export const isValidArray = <T>(arr: unknown, validator?: (item: T) => boolean): arr is T[] => {
  if (!Array.isArray(arr)) return false;
  if (!validator) return true;
  return arr.every(validator);
};

export const isValidObject = (obj: unknown): obj is Record<string, unknown> => {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
};

export const hasRequiredFields = <T extends Record<string, unknown>>(
  obj: unknown,
  requiredFields: (keyof T)[]
): obj is T => {
  if (!isValidObject(obj)) return false;
  return requiredFields.every(field => Object.prototype.hasOwnProperty.call(obj, field));
};

// 业务规则验证
export const canUserTakeTask = (
  userLevel: UserLevel,
  taskDifficulty: TaskDifficulty
): boolean => {
  const levelMap = {
    [UserLevel.BEGINNER]: [TaskDifficulty.EASY],
    [UserLevel.INTERMEDIATE]: [TaskDifficulty.EASY, TaskDifficulty.MEDIUM],
    [UserLevel.ADVANCED]: [TaskDifficulty.EASY, TaskDifficulty.MEDIUM, TaskDifficulty.HARD],
    [UserLevel.EXPERT]: Object.values(TaskDifficulty),
  };
  
  return levelMap[userLevel].includes(taskDifficulty);
};

export const isValidSkillMatch = (
  userSkills: string[],
  requiredSkills: string[],
  minMatchPercentage: number = 0.5
): boolean => {
  if (requiredSkills.length === 0) return true;
  
  const matchedSkills = requiredSkills.filter(skill => 
    userSkills.includes(skill)
  );
  
  const matchPercentage = matchedSkills.length / requiredSkills.length;
  return matchPercentage >= minMatchPercentage;
};

// 输入清理和验证
export const sanitizeInput = (input: string): string => {
  return validator.escape(validator.trim(input));
};

export const sanitizeHTML = (html: string): string => {
  // 基础 HTML 清理，实际项目中建议使用 DOMPurify
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// 验证结果类型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 复合验证函数
export const validateUserRegistration = (data: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}): ValidationResult => {
  const errors: string[] = [];
  
  if (!isValidUsername(data.username)) {
    errors.push('用户名格式不正确');
  }
  
  if (!isEmail(data.email)) {
    errors.push('邮箱格式不正确');
  }
  
  if (!isStrongPassword(data.password)) {
    errors.push('密码强度不够');
  }
  
  if (data.password !== data.confirmPassword) {
    errors.push('两次输入的密码不一致');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateTaskCreation = (data: {
  title: string;
  description: string;
  difficulty: string;
  reward: number;
  deadline: Date;
  requiredSkills: string[];
}): ValidationResult => {
  const errors: string[] = [];
  
  if (!isLength(data.title, 5, 100)) {
    errors.push('任务标题长度应在5-100个字符之间');
  }
  
  if (!isLength(data.description, 20, 2000)) {
    errors.push('任务描述长度应在20-2000个字符之间');
  }
  
  if (!isValidTaskDifficulty(data.difficulty)) {
    errors.push('任务难度不正确');
  }
  
  if (!isValidReward(data.reward)) {
    errors.push('奖励金额不正确');
  }
  
  if (!isValidDeadline(data.deadline)) {
    errors.push('截止时间不正确');
  }
  
  if (!isValidArray(data.requiredSkills) || data.requiredSkills.length === 0) {
    errors.push('至少需要选择一个技能要求');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};