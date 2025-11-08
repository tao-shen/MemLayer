import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useWebSocketEvent } from '../hooks/useWebSocket';

interface ChatPanelProps {
  agentId: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ agentId }) => {
  const {
    currentSessionId,
    messages,
    isLoading,
    streamingMessage,
    sendMessage,
    loadMessages,
    setStreamingMessage,
  } = useChatStore();

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(agentId, currentSessionId);
      
      // 加入 session room 以接收流式消息
      const ws = (window as any).wsClient;
      if (ws && ws.isConnected()) {
        ws.emit('join-session', currentSessionId);
        console.log('🔌 Joined session room:', currentSessionId);
      } else {
        console.warn('⚠️ WebSocket not connected, cannot join session room');
      }
    }
  }, [currentSessionId, agentId, loadMessages]);

  // 监听流式消息 - 只在组件挂载时注册一次
  useEffect(() => {
    const ws = (window as any).wsClient;
    if (!ws) {
      console.warn('⚠️ wsClient not found');
      return;
    }

    const handleStreamStart = (data: { id: string; sessionId?: string }) => {
      console.log('🌊 Stream started:', data);
      // 只处理当前 session 的消息
      if (data.sessionId && data.sessionId !== currentSessionId) {
        console.log('⏭️ Skipping stream from different session');
        return;
      }
      setStreamingMessage('');
    };

    const handleStreamChunk = (data: { id: string; content: string; done: boolean; sessionId?: string }) => {
      // 只处理当前 session 的消息
      if (data.sessionId && data.sessionId !== currentSessionId) {
        return;
      }
      console.log('📝 Stream chunk received:', data.content.length, 'chars', 'done:', data.done);
      setStreamingMessage(data.content);
    };

    const handleStreamComplete = (data: any) => {
      console.log('✅ Stream complete', data);
      console.log('📊 RAG Results:', data.ragResults?.length || 0);
      
      // 如果有 RAG 结果（记忆检索结果），打印出来
      if (data.ragResults && data.ragResults.length > 0) {
        console.log('🧠 Retrieved Memories:');
        data.ragResults.forEach((result: any, idx: number) => {
          console.log(`  ${idx + 1}. [${result.type.toUpperCase()}] Score: ${result.score.toFixed(2)}`);
          console.log(`     ${result.content.substring(0, 100)}...`);
        });
      }
      
      // 延迟清除流式消息，让最终消息先加载
      setTimeout(() => {
        setStreamingMessage(null);
        // 重新加载消息以获取完整的消息（包括 RAG 结果）
        if (currentSessionId) {
          loadMessages(agentId, currentSessionId);
        }
      }, 200);
    };

    // 注册监听器
    ws.on('message:start', handleStreamStart);
    ws.on('message:chunk', handleStreamChunk);
    ws.on('message', handleStreamComplete);

    console.log('✅ WebSocket listeners registered');

    // 只在组件卸载时清理
    return () => {
      ws.off('message:start', handleStreamStart);
      ws.off('message:chunk', handleStreamChunk);
      ws.off('message', handleStreamComplete);
      console.log('🧹 WebSocket listeners cleaned up');
    };
  }, [currentSessionId, agentId, loadMessages, setStreamingMessage]); // 添加依赖

  const handleSendMessage = async (message: string) => {
    await sendMessage(agentId, message);
  };

  const currentMessages = currentSessionId ? messages[currentSessionId] || [] : [];
  
  // 如果正在流式输出，添加一个临时的助手消息
  const displayMessages = streamingMessage !== null && currentSessionId
    ? [
        ...currentMessages,
        {
          id: `streaming-${Date.now()}`, // 使用唯一的 ID
          role: 'assistant' as const,
          content: streamingMessage,
          timestamp: new Date(),
        },
      ]
    : currentMessages;

  // Debug: Log messages
  if (currentMessages.length > 0) {
    console.log('💬 ChatPanel messages:', currentMessages);
    currentMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.role}] content length: ${msg.content?.length || 0}`);
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {currentSessionId ? 'Chat' : 'No Session Selected'}
        </h2>
      </div>

      {/* Messages */}
      {currentSessionId ? (
        <>
          <MessageList messages={displayMessages} />
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Select or create a session to start chatting</p>
        </div>
      )}
    </div>
  );
};

export { ChatPanel };
export default ChatPanel;
