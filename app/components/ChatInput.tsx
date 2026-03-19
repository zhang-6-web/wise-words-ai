'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send, Square, Loader2 } from 'lucide-react';
// import Image from 'next/image';
import { Image, Space } from 'antd';

import { MessageImage } from '../types/chat';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (images?: MessageImage[]) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

// 在组件上方定义接口
interface PastedImage {
  file: File;
  preview: string;
  name: string;
  base64?: string;
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
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);
  const [previewImage, setPreviewImage] = useState<PastedImage | null>(null);
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);
  useEffect(() => {
   console.log('pastedImages',pastedImages)
  }, [pastedImages]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSend(pastedImages);
        setPastedImages([]);
      }
    }
  };
  const handlePaste = (event: any) => {
    // 获取剪贴板中的数据
    const items = event.clipboardData?.items;
    if (!items) return;
    // 遍历剪贴板中的所有项
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        // 阻止默认粘贴行为（防止图片文本被粘贴进去）
        event.preventDefault();
        // 获取图片文件
        const imageFile = items[i].getAsFile();
        // 在这里处理图片文件
        handleImagePaste(imageFile);
        break;
      }
    }
  };
  const handleImagePaste = async (imageFile: File) => {
    // 1. 创建预览URL
    const previewUrl = URL.createObjectURL(imageFile);
    // 2. 转换为base64
    const buffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const imageDataUrl = `data:${imageFile.type};base64,${base64}`;
    // 3. 保存图片到状态中
    setPastedImages((prev: PastedImage[]) => {
      return [...prev, {
        file: imageFile,
        preview: previewUrl,
        name: imageFile.name,
        base64: imageDataUrl,
      }];
    });
  };
  const handleSend = () => {
    if ((input.trim() || pastedImages.length > 0) && !isLoading) {
      // 构建 MessageImage 数组
      const messageImages: MessageImage[] = pastedImages.map(img => ({
        preview: img.preview,
        name: img.name,
        base64: img.base64,
      }));
      onSend(messageImages);
      // 清空图片
      pastedImages.forEach(img => URL.revokeObjectURL(img.preview));
      setPastedImages([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  return (
    <div className="p-4 w-3xl">
      <div className="relative flex flex-col bg-gray-800 w-full rounded-2xl border border-gray-700 transition-all">
        {/* 图片预览区域 - 只有有图片时才显示 */}
        {pastedImages.length > 0 && (
          <div className="flex items-center gap-2 p-2 border-b border-gray-700 z-1000">
            <div className="relative group flex flex-wrap gap-2" >
              {pastedImages.map((pastedImage, index) => (
                <div key={index} className="relative group">
                  {/* 图片缩略图 */}
                  <Image
                    onClick={() => setPreviewImage(pastedImage as PastedImage)}
                    src={pastedImage.preview || ''}
                    alt="粘贴的图片预览"
                    preview={{
                      mask: { blur: true },
                      cover: (
                        <Space vertical align="center">
                          预览
                        </Space>
                      ),
                    }}
                    width={48}
                    height={48}
                    className="h-12 w-auto rounded-lg object-cover border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                  />

                  {/* 移除按钮 - 悬浮在图片右上角，默认隐藏，group-hover时显示 */}
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(pastedImage.preview || '');
                      setPastedImages((prev) => prev.filter((img) => img !== pastedImage));
                    }}
                    className="
        absolute -top-2 -right-2 
        p-1 
        bg-gray-800 hover:bg-red-600 
        rounded-full 
        border border-gray-600
        opacity-0 group-hover:opacity-100 
        transition-all duration-200
        shadow-lg
      "
                    title="移除图片"
                  >
                    <svg
                      className="w-3 h-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  {/* 悬停时显示的文件名 - 覆盖在图片上 */}
                  {/* <div className="
      absolute inset-0 
      bg-black/70 
      opacity-0 group-hover:opacity-100 
      transition-opacity duration-200
      rounded-lg 
      flex items-center justify-center
      text-xs text-gray-200 px-2
    ">
                    <span className="truncate max-w-[100px]">
                      {pastedImage.name}
                    </span>
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* 输入区域 - 保持flex布局 */}
        <div
          className="flex items-end gap-2 p-2"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={"输入消息... (Enter发送, Shift+Enter换行)"}
            disabled={isLoading}
            rows={1}
            style={{ outline: 'none' }}
            className="
          w-full
          placeholder-gray-500
          resize-none px-3 py-2 
          max-h-[200px] min-h-[44px] 
          disabled:opacity-50
          bg-transparent
        "
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
                disabled={(!input.trim() && pastedImages.length === 0) || disabled}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors"
                title="发送消息"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 底部提示文字 */}
      <div className="text-center mt-2 text-xs text-gray-600">
        AI生成的内容可能存在错误，请仔细核实重要信息
      </div>
    </div>
  );
}
