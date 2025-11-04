import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { SessionItem } from './SessionItem';

interface SessionSidebarProps {
  agentId: string;
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({ agentId }) => {
  const {
    sessions,
    currentSessionId,
    selectSession,
    loadSessions,
    createSession,
    deleteSession,
    renameSession,
  } = useChatStore();

  useEffect(() => {
    if (agentId) {
      loadSessions(agentId);
    }
  }, [agentId, loadSessions]);

  const handleCreateSession = async () => {
    try {
      console.log('Creating session for agent:', agentId);
      const session = await createSession(agentId, {
        agentType: 'default',
        ragMode: 'off',
        memoryTypes: ['stm', 'episodic', 'semantic', 'reflection'],
        autoReflection: false,
        blockchainEnabled: false,
      });
      console.log('Session created:', session);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(agentId, sessionId);
  };

  const handleRenameSession = async (sessionId: string, newName: string) => {
    await renameSession(agentId, sessionId, newName);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCreateSession}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          + New Session
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {!sessions || sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p>No sessions yet</p>
            <p className="text-sm mt-2">Create a new session to get started</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={currentSessionId === session.id}
                onSelect={() => selectSession(session.id)}
                onDelete={handleDeleteSession}
                onRename={handleRenameSession}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { SessionSidebar };
export default SessionSidebar;
