// 用户类型接口
export interface User {
  id: string;
  username: string;
  email: string;
  user_type: 'admin' | 'merchant' | 'programmer' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 创建用户请求接口
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  user_type: 'admin' | 'merchant' | 'programmer' | 'other';
  is_active: boolean;
}

// 更新用户请求接口
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  user_type?: 'admin' | 'merchant' | 'programmer' | 'other';
  is_active?: boolean;
}