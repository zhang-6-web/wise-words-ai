import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import ChatSession from '@/lib/models/ChatSession';

// 获取单个会话详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // 改为 Promise
) {
  try {
    // 先 await params
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    await connectDB();
    
    const chatSession = await ChatSession.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!chatSession) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }
    console.log('[Chat Session GET]', chatSession)
    return NextResponse.json({ session: chatSession });
  } catch (error) {
    console.error('[Chat Session GET Error]', error);
    return NextResponse.json({ error: '获取会话失败' }, { status: 500 });
  }
}
// 更新会话（添加消息）- 修复版本
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // 改为 Promise
) {
  try {
    // 先 await params 获取 id
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const body = await request.json();
    console.log('[Chat Session PUT] 接收到的消息:', body);
    const { messages, title } = body;
    console.log('[Chat Session PUT] 接收到的消息数量:', messages?.length);
    await connectDB();

    // 构建更新数据
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (messages) {
      updateData.messages = messages;
    }
    if (title) {
      updateData.title = title;
    }

    // 使用 returnDocument: 'after' 替代 new: true
    const chatSession = await ChatSession.findOneAndUpdate(
      {
        _id: id,  // 使用 await 后的 id
        userId: session.user.id,
      },
      updateData,
      { 
        returnDocument: 'after',  // 替代 new: true
        runValidators: true 

        
      }
    );

    if (!chatSession) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }
    return NextResponse.json({ session: chatSession });
  } catch (error) {
    console.error('[Chat Session PUT Error]', error);
    return NextResponse.json(
      { error: '更新会话失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// 删除会话
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // 改为 Promise
) {
  try {
    // 先 await params
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    await connectDB();

    const result = await ChatSession.deleteOne({
      _id: id,
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Chat Session DELETE Error]', error);
    return NextResponse.json({ error: '删除会话失败' }, { status: 500 });
  }
}