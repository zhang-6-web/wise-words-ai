'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Message, ChatSession, ChatSettings, DEFAULT_SETTINGS } from '../types/chat';

interface UseChatReturn {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  sendMessage: () => Promise<void>;
  stopGeneration: () => void;
  clearMessages: () => void;
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  settings: ChatSettings;
  updateSettings: (settings: Partial<ChatSettings>) => void;
}

const SETTINGS_KEY = 'chat-settings';

export function useChat(): UseChatReturn {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 从数据库加载会话列表
  useEffect(() => {
    if (session?.user) {
      fetchSessions();
    }
  }, [session]);

  // 加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  // 保存设置
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // 获取会话列表
  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        // 转换数据库格式为前端格式
        const formattedSessions = data.sessions.map((s: any) => ({
          id: s._id,
          title: s.title,
          messages: [], // 列表中不加载消息
          createdAt: new Date(s.createdAt).getTime(),
          updatedAt: new Date(s.updatedAt).getTime(),
        }));
        setSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const generateSessionTitle = (firstMessage: string): string => {
    const title = firstMessage.slice(0, 30);
    return title.length < firstMessage.length ? title + '...' : title;
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          settings: {
            model: settings.model,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            systemPrompt: settings.systemPrompt,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;
        
        setMessages(prev => 
          prev.map(m => 
            m.id === assistantMessage.id 
              ? { ...m, content: accumulatedContent }
              : m
          )
        );
      }

      const finalMessages = [...messages, userMessage, { ...assistantMessage, content: accumulatedContent, isStreaming: false }];
      setMessages(finalMessages);

      // 保存到数据库
      await saveSessionToDB(finalMessages);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages(prev => 
          prev.map(m => 
            m.id === assistantMessage.id 
              ? { ...m, isStreaming: false, content: m.content || '已停止生成' }
              : m
          )
        );
      } else {
        setError(err instanceof Error ? err.message : '发送消息失败');
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, messages, settings, currentSessionId, session]);

  // 保存会话到数据库
  const saveSessionToDB = async (currentMessages: Message[]) => {
    if (!session?.user) return;

    try {
      const title = currentMessages[0]?.content || '新对话';
      const dbMessages = currentMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));

      if (currentSessionId) {
        // 更新现有会话
        await fetch(`/api/chat/sessions/${currentSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: dbMessages }),
        });
      } else {
        // 创建新会话
        const response = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: generateSessionTitle(title) }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const newSessionId = data.session._id;
          setCurrentSessionId(newSessionId);
          
          // 添加消息到新会话
          await fetch(`/api/chat/sessions/${newSessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: dbMessages }),
          });

          // 刷新会话列表
          await fetchSessions();
        }
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        const dbMessages = data.session.messages.map((m: any) => ({
          id: `msg-${Date.now()}-${Math.random()}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp).getTime(),
        }));
        setMessages(dbMessages);
        setCurrentSessionId(sessionId);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          setMessages([]);
          setCurrentSessionId(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [currentSessionId]);

  const updateSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    clearMessages,
    currentSession,
    sessions,
    loadSession,
    deleteSession,
    settings,
    updateSettings,
  };
}