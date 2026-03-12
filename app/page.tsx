'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useChat } from './hooks/useChat';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { ScrollToBottom } from './components/ScrollToBottom';
import { Header } from './components/Header';
import { AlertCircle, User, LogOut } from 'lucide-react';
export default function ChatPage() {
  const { data: session, status } = useSession();
  const {
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
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 处理登出
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom || messages[messages.length - 1]?.role === 'user') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle scroll to show/hide scroll button
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewChat = () => {
    clearMessages();
    setIsSidebarOpen(false);
  };

  const handleSelectSession = (sessionId: string) => {
    loadSession(sessionId);
    setIsSidebarOpen(false);
  };
  return (
    <div className="relative flex h-screen bg-gray-950 text-gray-100 overflow-hidden
    ">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSession?.id || null}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={deleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={`
          flex-1 flex flex-col min-w-0
          transition-all duration-300 ease-in-out will-change-[margin,width]
          ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
        `}>
        {/* User Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`
                p-2 hover:bg-gray-800 rounded-lg transition-all duration-300
                ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
              `}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm hidden sm:block">
                欢迎，{session?.user?.name || '用户'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">退出</span>
            </button>
          </div>
        </header>
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border-b border-red-700/50 px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-red-400 hover:text-red-300 underline ml-auto"
              >
                重试
              </button>
            </div>
          </div>
        )}
        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  欢迎使用 知言
                </h2>
                <p className="text-gray-400 mb-6">
                  基于 DeepSeek 的智能对话助手。开始一个新的对话，或者从左侧选择历史对话。
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setInput('你好，请介绍一下你自己')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 transition-colors"
                  >
                    👋 打个招呼
                  </button>
                  <button
                    onClick={() => setInput('帮我写一段Python代码，计算斐波那契数列')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 transition-colors"
                  >
                    💻 写代码
                  </button>
                  <button
                    onClick={() => setInput('解释一下量子计算的基本原理')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 transition-colors"
                  >
                    🧠 学知识
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Scroll to Bottom Button */}
          <ScrollToBottom
            isVisible={showScrollButton}
            onClick={scrollToBottom}
          />
        </div>
        {/* Input Area */}
        <div
          className="flex items-center justify-center  backdrop-blur-sm border-b border-gray-800"
        >
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={sendMessage}
            onStop={stopGeneration}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
      />
    </div>
  );
}
