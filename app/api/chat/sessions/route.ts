import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import ChatSession from '@/lib/models/ChatSession';

// 获取用户的所有聊天会话
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    await connectDB();

    const sessions = await ChatSession.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .select('_id title createdAt updatedAt');

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('[Chat Sessions GET Error]', error);
    return NextResponse.json(
      { error: '获取会话列表失败' },
      { status: 500 }
    );
  }
}

// 创建新会话
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title = '新对话' } = body;

    await connectDB();

    const newSession = await ChatSession.create({
      userId: session.user.id,
      title,
      messages: [],
    });

    return NextResponse.json({
      session: {
        _id: newSession._id,
        title: newSession.title,
        createdAt: newSession.createdAt,
        updatedAt: newSession.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Chat Sessions POST Error]', error);
    return NextResponse.json(
      { error: '创建会话失败' },
      { status: 500 }
    );
  }
}
