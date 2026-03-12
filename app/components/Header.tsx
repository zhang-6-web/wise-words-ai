'use client';

import React from 'react';
import { Menu, MessageSquare } from 'lucide-react';

interface HeaderProps {
  onOpenSidebar: () => void;
  title?: string;
}

export function Header({ onOpenSidebar, title = '新对话' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 lg:hidden">
      <button
        onClick={onOpenSidebar}
        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-400" />
      </button>
      
      <div className="flex items-center gap-2 text-white font-medium">
        <MessageSquare className="w-5 h-5 text-blue-500" />
        <span className="truncate max-w-[200px]">{title}</span>
      </div>
      
      <div className="w-9" /> {/* Spacer for alignment */}
    </header>
  );
}
