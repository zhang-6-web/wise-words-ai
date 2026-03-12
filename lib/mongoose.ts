import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// 验证连接字符串
function validateMongoDBUri(uri: string | undefined): void {
  if (!uri) {
    throw new Error(
      '请设置 MONGODB_URI 环境变量\n' +
      '本地开发: mongodb://localhost:27017/my-ai-app\n' +
      'MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/my-ai-app?retryWrites=true&w=majority'
    );
  }

  // 检查 Atlas 连接字符串格式
  if (uri.includes('mongodb+srv://')) {
    // 检查是否还是占位符
    if (uri.includes('username:password') || uri.includes('@cluster.mongodb.net')) {
      throw new Error(
        'MongoDB Atlas 连接字符串不正确\n' +
        '请按照以下步骤获取正确的连接字符串：\n' +
        '1. 访问 https://www.mongodb.com/cloud/atlas 注册账号\n' +
        '2. 创建 Cluster\n' +
        '3. Database Access -> 创建用户（记住用户名和密码）\n' +
        '4. Network Access -> Add IP Address -> 0.0.0.0/0\n' +
        '5. Database -> Connect -> Drivers -> Node.js -> 复制连接字符串\n' +
        '6. 将连接字符串中的 <username> 和 <password> 替换为实际值'
      );
    }
  }

  // 检查本地连接字符串
  if (uri.includes('mongodb://localhost')) {
    console.log('[MongoDB] 使用本地 MongoDB 服务器');
  }
}

validateMongoDBUri(MONGODB_URI);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log('[MongoDB] Connected successfully to:', mongoose.connection.name);
        return mongoose;
      })
      .catch((error) => {
        console.error('[MongoDB] Connection error:', error.message);
        cached!.promise = null;
        throw error;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

// 测试连接函数
export async function testConnection() {
  try {
    const conn = await connectDB();
    return {
      success: true,
      message: 'MongoDB 连接成功',
      database: conn.connection.name,
      host: conn.connection.host,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      error: error,
    };
  }
}

export default connectDB;
