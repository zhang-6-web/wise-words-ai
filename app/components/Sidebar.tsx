'use client';

import React from 'react';
import { ChatSession } from '../types/chat';
import LOGO from '../assets/imgs/logo.png';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  X,
  Clock
} from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onOpenSettings,
  isOpen,
  onClose,
}: SidebarProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0
        w-64 bg-gray-900 border-r border-gray-800
        transform transition-transform duration-300 ease-in-out will-change-transform
        flex flex-col z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Image src={LOGO as any} alt="知言"
                width={35}  // 必须指定宽度
                className="w-6 h-6"
              />
              知言
            </h1>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className={`
                p-2 hover:bg-gray-800 rounded-lg transition-all duration-300
                ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
              `}
            >


              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            新建对话
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无历史对话</p>
              <p className="text-xs mt-1">点击上方按钮开始新对话</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`
                  group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                  ${currentSessionId === session.id
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'hover:bg-gray-800 border border-transparent'
                  }
                `}
                onClick={() => onSelectSession(session.id)}
              >
                <MessageSquare className={`w-5 h-5 flex-shrink-0 ${currentSessionId === session.id ? 'text-blue-400' : 'text-gray-500'
                  }`} />

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-white' : 'text-gray-300'
                    }`}>
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(session.updatedAt)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600/20 hover:text-red-400 rounded-lg transition-all"
                  title="删除对话"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>设置</span>
          </button>
        </div>
      </aside>
    </>
  );
}
