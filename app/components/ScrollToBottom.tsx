'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ScrollToBottomProps {
  isVisible: boolean;
  onClick: () => void;
}

export function ScrollToBottom({ isVisible, onClick }: ScrollToBottomProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full shadow-lg border border-gray-700 transition-all animate-fade-in"
    >
      <ChevronDown className="w-4 h-4" />
      <span className="text-sm">回到底部</span>
    </button>
  );
}
