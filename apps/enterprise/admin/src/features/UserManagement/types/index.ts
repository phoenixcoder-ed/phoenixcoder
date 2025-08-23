/**
 * 用户管理模块类型定义
 */

// 用户类型枚举
export enum UserType {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  CLIENT = 'client',
  REVIEWER = 'reviewer',
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

// 用户基础接口
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  userType: string;
  isActive: boolean;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'expert';
  hourlyRate?: number;
  location?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profileCompletion?: number;
  rating?: number;
  totalTasks?: number;
  completedTasks?: number;
}

// 创建用户请求接口
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  userType: string;
  isActive?: boolean;
  phone?: string;
  bio?: string;
  skills?: string[];
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'expert';
  hourlyRate?: number;
  location?: string;
  timezone?: string;
}

// 更新用户请求接口
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  userType?: string;
  isActive?: boolean;
  phone?: string;
  bio?: string;
  skills?: string[];
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'expert';
  hourlyRate?: number;
  location?: string;
  timezone?: string;
}

// 用户列表响应接口
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 用户表单数据接口
export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  userType: UserType;
  isActive: boolean;
  phone?: string;
  bio?: string;
  skills?: string[];
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'expert';
  hourlyRate?: number;
  location?: string;
  timezone?: string;
}

// 表格列定义接口
export interface UserTableColumn {
  key: keyof User | 'actions';
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, record: User) => React.ReactNode;
}

// 用户筛选器接口
export interface UserFilters {
  search?: string;
  userType?: UserType;
  isActive?: boolean;
  created_at_start?: string;
  created_at_end?: string;
  [key: string]: unknown;
}

// 用户排序配置接口
export interface UserSortConfig {
  field: keyof User;
  direction: 'asc' | 'desc';
}
