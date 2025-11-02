import { useEffect } from 'react';
import { useChatStore } from '@/stores';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  agentId: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ agentId }) => {
  const {
    currentSessionId,
    messages,
    isLoading,
    sendMessage,
    loadMessages,
  } = useChatStore();

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(agentId, currentSessionId);
    }
  }, [currentSessionId, agentId, loadMessages]);

  const handleSendMessage = async (message: string) => {
    await sendMessage(agentId, message);
  };

  const currentMessages = currentSessionId ? messages[currentSessionId] || [] : [];

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
          <MessageList messages={currentMessages} />
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
