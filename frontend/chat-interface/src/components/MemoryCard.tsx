import React from 'react';
import type { Memory } from '../types';

interface MemoryCardProps {
  memory: Memory;
  onClick?: () => void;
  searchQuery?: string;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onClick, searchQuery = '' }) => {
  const typeColors: Record<string, string> = {
    stm: 'bg-blue-100 text-blue-800',
    episodic: 'bg-green-100 text-green-800',
    semantic: 'bg-orange-100 text-orange-800',
    reflection: 'bg-purple-100 text-purple-800',
  };

  const importanceColor = (importance: number) => {
    if (importance >= 8) return 'text-red-600';
    if (importance >= 6) return 'text-orange-600';
    if (importance >= 4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      onClick={onClick}
      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${typeColors[memory.type] || 'bg-gray-100 text-gray-800'}`}>
            {memory.type.toUpperCase()}
          </span>
          {memory.onChain && (
            <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-800">
              <svg className="inline w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" />
              </svg>
              On-chain
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-semibold ${importanceColor(memory.importance)}`}>
            {memory.importance.toFixed(1)}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 line-clamp-3 mb-3">
        {highlightText(memory.content, searchQuery)}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {memory.accessCount}
          </span>
          <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
        </div>
        {memory.entities && memory.entities.length > 0 && (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {memory.entities.length} entities
          </span>
        )}
      </div>
    </div>
  );
};

export default MemoryCard;
