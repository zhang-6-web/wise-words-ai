export interface MessageImage {
  preview?: string;
  name: string;
  base64?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  images?: MessageImage[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export const DEFAULT_SETTINGS: ChatSettings = {
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: '你是一个智能助手，可以帮助用户解答各种问题。请用中文回答。',
};

export const MODEL_OPTIONS = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
];
