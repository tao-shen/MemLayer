import { useEffect, useRef, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { MessageItem } from './MessageItem';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  onRegenerateMessage?: (messageId: string) => void;
  onMintNFT?: (messageId: string) => void;
}

// Use virtual scrolling for large message lists (>50 messages)
const VIRTUAL_SCROLL_THRESHOLD = 50;

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onRegenerateMessage,
  onMintNFT,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const itemHeights = useRef<Map<number, number>>(new Map());

  // Measure container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      if (listRef.current) {
        listRef.current.scrollToItem(messages.length - 1, 'end');
      } else {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length]);

  // Get estimated item size
  const getItemSize = (index: number): number => {
    return itemHeights.current.get(index) || 150; // Default estimated height
  };

  // Set item size after render
  const setItemSize = (index: number, size: number) => {
    itemHeights.current.set(index, size);
    listRef.current?.resetAfterIndex(index);
  };

  // Render empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm mt-2">Start a conversation to see messages here</p>
        </div>
      </div>
    );
  }

  // Use virtual scrolling for large lists
  if (messages.length > VIRTUAL_SCROLL_THRESHOLD) {
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const rowRef = useRef<HTMLDivElement>(null);
      const message = messages[index];

      useEffect(() => {
        if (rowRef.current) {
          const height = rowRef.current.getBoundingClientRect().height;
          setItemSize(index, height);
        }
      }, [index]);

      return (
        <div style={style}>
          <div
            ref={rowRef}
            className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-200 dark:border-gray-700"
          >
            <MessageItem
              message={message}
              onRegenerate={
                message.role === 'assistant' && onRegenerateMessage
                  ? () => onRegenerateMessage(message.id)
                  : undefined
              }
              onMintNFT={
                message.role === 'assistant' && onMintNFT
                  ? () => onMintNFT(message.id)
                  : undefined
              }
            />
          </div>
        </div>
      );
    };

    return (
      <div ref={containerRef} className="flex-1 overflow-hidden">
        <List
          ref={listRef}
          height={containerHeight}
          itemCount={messages.length}
          itemSize={getItemSize}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </List>
      </div>
    );
  }

  // Regular rendering for small lists
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {messages.map((message) => (
          <div
            key={message.id}
            className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <MessageItem
              message={message}
              onRegenerate={
                message.role === 'assistant' && onRegenerateMessage
                  ? () => onRegenerateMessage(message.id)
                  : undefined
              }
              onMintNFT={
                message.role === 'assistant' && onMintNFT
                  ? () => onMintNFT(message.id)
                  : undefined
              }
            />
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
};
