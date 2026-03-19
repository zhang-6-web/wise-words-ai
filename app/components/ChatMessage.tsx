'use client';

import React, { useState } from 'react';
import { Message } from '../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { User, Bot, Copy, Check, Clock, Image as ImageIcon } from 'lucide-react';
import { Image, Space } from 'antd';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
        : 'bg-gradient-to-br from-gray-600 to-gray-700'
        }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className={`relative rounded-2xl px-4 py-3 ${isUser
          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
          : 'bg-gray-800 text-gray-100 rounded-bl-md border border-gray-700'
          }`}>
          {isUser ? (
            <div className="whitespace-pre-wrap leading-relaxed">
              {message.content}
              {/* 显示图片缩略图 */}
              {message.images && message.images.length > 0 && (
                <div className="flex flex-wrap items-start gap-2 mt-2">
                  {message.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <Image
                        width={100}
                        height={100}
                        src={img.base64 || img.preview}
                        alt={img.name || `图片${idx + 1}`}
                        className="rounded-lg object-cover border border-gray-700 hover:opacity-90 transition-opacity cursor-pointer"
                        preview={{
                          mask: { blur: true },
                          cover: (
                            <Space vertical align="center">
                              预览
                            </Space>
                          ),
                        }}
                      />
                      {/* {img.name && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-[80px]">
                          {img.name}
                        </div>
                      )} */}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <MarkdownRenderer content={message.content} />
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : 'flex-row'
          }`}>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(message.timestamp)}
          </span>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              title="复制内容"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>复制</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
