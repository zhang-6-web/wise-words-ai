import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// 验证连接字符串
if (!uri) {
  throw new Error(
    '请设置 MONGODB_URI 环境变量\n' +
    '本地开发: mongodb://localhost:27017/my-ai-app\n' +
    'MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/my-ai-app?retryWrites=true&w=majority'
  );
}

// 检查 Atlas 连接字符串是否为占位符
if (uri.includes('mongodb+srv://') && 
    (uri.includes('username:password') || uri.includes('@cluster.mongodb.net'))) {
  throw new Error(
    'MongoDB Atlas 连接字符串不正确\n' +
    '请访问 https://www.mongodb.com/cloud/atlas 获取正确的连接字符串'
  );
}

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // 在开发环境中使用全局变量，防止热重载时创建多个连接
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect()
      .then(client => {
        console.log('[MongoDB] Native driver connected');
        return client;
      })
      .catch(err => {
        console.error('[MongoDB] Connection failed:', err.message);
        throw err;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // 生产环境
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
