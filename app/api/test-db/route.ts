import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/mongoose';

export async function GET() {
  try {
    const result = await testConnection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        database: result.database,
        host: result.host,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        error: result.error?.message || 'Unknown error',
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: '数据库连接测试失败',
      error: error.message,
    }, { status: 500 });
  }
}
