import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ClipboardIcon,
  ArrowPathIcon,
  CubeIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import type { Message } from '../types';
import { format } from 'date-fns';

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
  onMintNFT?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRegenerate,
  onMintNFT,
}) => {
  const [copied, setCopied] = useState(false);

  // Debug: Check message content
  if (!message.content) {
    console.warn('⚠️ MessageItem: message.content is empty!', message);
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      className={`
        flex gap-3 p-4
        ${isUser ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
        ${isSystem ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${
              isUser
                ? 'bg-primary-600 text-white'
                : isSystem
                ? 'bg-blue-600 text-white'
                : 'bg-green-600 text-white'
            }
          `}
        >
          {isUser ? 'U' : isSystem ? 'S' : 'AI'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(message.timestamp), 'HH:mm')}
            </span>
          </div>

          {/* Actions */}
          {!isSystem && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <ClipboardIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {!isUser && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Regenerate response"
                >
                  <ArrowPathIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}

              {!isUser && onMintNFT && (
                <button
                  onClick={onMintNFT}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Mint as NFT"
                >
                  <CubeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';

                return !inline && language ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    className="rounded-md"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-sm"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              a({ node, children, ...props }) {
                return (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {children}
                  </a>
                );
              },
              table({ node, children, ...props }) {
                return (
                  <div className="overflow-x-auto">
                    <table
                      className="min-w-full divide-y divide-gray-300 dark:divide-gray-700"
                      {...props}
                    >
                      {children}
                    </table>
                  </div>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* RAG Results */}
        {message.ragResults && message.ragResults.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Retrieved Context ({message.ragResults.length})
            </div>
            <div className="space-y-2">
              {message.ragResults.map((result, index) => (
                <RAGResultCard key={result.id || index} result={result} />
              ))}
            </div>
          </div>
        )}

        {/* Memory IDs */}
        {message.memoryIds && message.memoryIds.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Memories created:</span>
            <div className="flex gap-1">
              {message.memoryIds.map((id) => (
                <span
                  key={id}
                  className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded"
                >
                  {id.substring(0, 8)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// RAG Result Card Component
interface RAGResultCardProps {
  result: {
    id: string;
    content: string;
    score: number;
    source: string;
    metadata?: Record<string, any>;
  };
}

const RAGResultCard: React.FC<RAGResultCardProps> = ({ result }) => {
  const [expanded, setExpanded] = useState(false);

  const preview =
    result.content.length > 150
      ? result.content.substring(0, 150) + '...'
      : result.content;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {result.source}
          </span>
          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
            {(result.score * 100).toFixed(1)}% match
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {expanded ? result.content : preview}
      </div>

      {result.content.length > 150 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {result.metadata && Object.keys(result.metadata).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {Object.entries(result.metadata).map(([key, value]) => (
              <span
                key={key}
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                <span className="font-medium">{key}:</span> {String(value)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
