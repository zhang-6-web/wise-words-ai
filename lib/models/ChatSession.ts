import { MessageImage } from '@/app/types/chat';
import mongoose, { Schema, Document } from 'mongoose';

// 定义图片子 schema
const MessageImageSchema: Schema = new Schema({
  base64: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  // 如果有其他字段也加上
});

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: MessageImage[];
  timestamp: Date;
  toolCalls?: any[];
}

export interface IChatSession extends Document {
  userId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  images: {
    type: [MessageImageSchema],  // 👈 改为子 schema 数组
    default: undefined,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  toolCalls: {
    type: Array,
    default: undefined,
  },
});

const ChatSessionSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: '新对话',
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ChatSession ||
  mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);