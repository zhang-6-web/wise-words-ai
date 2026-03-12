'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Square, Loader2 } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isLoading,
  disabled = false
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSend();
      }
    }
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend();
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div
      className="
    p-4
     w-3xl
    "
    >
      <div
        className="
        relative flex items-end gap-2 
        bg-gray-800 
        w-full
        rounded-2xl border 
        border-gray-700 p-2  transition-all"

      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={"输入消息... (Enter发送, Shift+Enter换行)"}
          disabled={isLoading}
          rows={1}
          className="
          w-full
           placeholder-gray-500
            resize-none outline-none px-3 py-2 max-h-[200px] min-h-[44px] disabled:opacity-50"
        />
        <div className="flex-shrink-0 pb-1">
          {isLoading ? (
            <button
              onClick={onStop}
              className="w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
              title="停止生成"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors"
              title="发送消息"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="text-center mt-2 text-xs text-gray-600">
        AI生成的内容可能存在错误，请仔细核实重要信息
      </div>
    </div>
  );
}
