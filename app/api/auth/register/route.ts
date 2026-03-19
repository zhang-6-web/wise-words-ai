import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    // 验证必填字段
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: '密码长度至少为6位' },
        { status: 400 }
      );
    }

    // 验证密码确认
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: '两次输入的密码不一致' },
        { status: 400 }
      );
    }

    // 连接数据库
    await connectDB();

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
      },
    });

  } catch (error) {
    console.error('[Register API Error]', error);
    const errorMessage = error instanceof Error ? error.message : '注册失败';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
