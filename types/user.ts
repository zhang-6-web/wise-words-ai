/**
 * 用户类型定义
 */

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // 加密后的密码
  createdAt: Date;
}

export interface UserWithoutPassword {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserWithoutPassword;
}
