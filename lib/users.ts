/**
 * 用户数据存储（内存存储，开发用）
 * 后期可替换为数据库
 */

import bcrypt from 'bcryptjs';
import { User, UserWithoutPassword, RegisterInput } from '@/types/user';

// 内存用户存储
const users: Map<string, User> = new Map();

// 测试账号（开发用）
const initTestUser = async () => {
  const testEmail = 'test@example.com';
  if (!users.has(testEmail)) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const testUser: User = {
      id: '1',
      name: '测试用户',
      email: testEmail,
      password: hashedPassword,
      createdAt: new Date(),
    };
    users.set(testEmail, testUser);
    console.log('[Users] Test user created:', testEmail);
  }
};

// 初始化测试账号
initTestUser();

/**
 * 根据邮箱查找用户
 */
export function findUserByEmail(email: string): User | undefined {
  return users.get(email.toLowerCase());
}

/**
 * 根据ID查找用户
 */
export function findUserById(id: string): User | undefined {
  for (const user of users.values()) {
    if (user.id === id) {
      return user;
    }
  }
  return undefined;
}

/**
 * 创建新用户
 */
export async function createUser(input: RegisterInput): Promise<User> {
  const { name, email, password } = input;
  
  // 检查邮箱是否已存在
  if (users.has(email.toLowerCase())) {
    throw new Error('该邮箱已被注册');
  }
  
  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 创建用户
  const newUser: User = {
    id: Date.now().toString(),
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    createdAt: new Date(),
  };
  
  users.set(email.toLowerCase(), newUser);
  console.log('[Users] New user created:', email);
  
  return newUser;
}

/**
 * 验证用户密码
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 移除密码字段，返回安全用户信息
 */
export function sanitizeUser(user: User): UserWithoutPassword {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * 获取所有用户（调试用）
 */
export function getAllUsers(): UserWithoutPassword[] {
  return Array.from(users.values()).map(sanitizeUser);
}

/**
 * 用户数量
 */
export function getUserCount(): number {
  return users.size;
}
