import { create } from 'zustand';
import { chatApi } from '../api';
import type { Session, Message, RAGMode, SessionConfig } from '../types';

interface ChatStore {
  // State
  sessions: Session[];
  currentSessionId: string | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  streamingMessage: string | null;
  ragMode: RAGMode;
  error: string | null;

  // Actions
  createSession: (agentId: string, config: SessionConfig) => Promise<Session>;
  selectSession: (sessionId: string) => void;
  sendMessage: (agentId: string, message: string) => Promise<void>;
  loadMessages: (agentId: string, sessionId: string) => Promise<void>;
  setRagMode: (mode: RAGMode) => void;
  deleteSession: (agentId: string, sessionId: string) => Promise<void>;
  renameSession: (agentId: string, sessionId: string, newName: string) => Promise<void>;
  loadSessions: (agentId: string) => Promise<void>;
  setStreamingMessage: (message: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
}

const generateId = () => Math.random().toString(36).substring(7);

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  sessions: [],
  currentSessionId: null,
  messages: {},
  isLoading: false,
  streamingMessage: null,
  ragMode: 'off',
  error: null,

  // Load sessions
  loadSessions: async (agentId: string) => {
    try {
      const sessions = await chatApi.getSessions(agentId);
      set({ sessions });
    } catch (error) {
      console.error('Failed to load sessions:', error);
      set({ error: 'Failed to load sessions' });
    }
  },

  // Create session
  createSession: async (agentId: string, config: SessionConfig) => {
    try {
      const session = await chatApi.createSession(agentId, {
        name: `Session ${new Date().toLocaleString()}`,
        config,
      });
      
      set((state) => ({
        sessions: [...state.sessions, session],
        currentSessionId: session.id,
        messages: {
          ...state.messages,
          [session.id]: [],
        },
      }));
      
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      set({ error: 'Failed to create session' });
      throw error;
    }
  },

  // Select session
  selectSession: (sessionId: string) => {
    set({ currentSessionId: sessionId });
  },

  // Load messages
  loadMessages: async (agentId: string, sessionId: string) => {
    try {
      set({ isLoading: true });
      const response = await chatApi.getMessages(agentId, sessionId, { limit: 50 });
      
      set((state) => ({
        messages: {
          ...state.messages,
          [sessionId]: response.data,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ error: 'Failed to load messages', isLoading: false });
    }
  },

  // Send message
  sendMessage: async (agentId: string, message: string) => {
    const { currentSessionId, ragMode } = get();
    if (!currentSessionId) {
      console.error('No session selected');
      return;
    }

    try {
      // Add user message immediately
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: {
          ...state.messages,
          [currentSessionId]: [...(state.messages[currentSessionId] || []), userMessage],
        },
        isLoading: true,
      }));

      // Send to API
      const response = await chatApi.sendMessage(agentId, {
        sessionId: currentSessionId,
        message,
        ragMode,
      });

      // Add assistant message
      const assistantMessage: Message = {
        id: response.messageId,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        ragResults: response.ragResults,
        memoryIds: response.memoriesCreated,
      };

      set((state) => ({
        messages: {
          ...state.messages,
          [currentSessionId]: [...state.messages[currentSessionId], assistantMessage],
        },
        isLoading: false,
        streamingMessage: null,
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ error: 'Failed to send message', isLoading: false });
    }
  },

  // Set RAG mode
  setRagMode: (mode: RAGMode) => {
    set({ ragMode: mode });
  },

  // Delete session
  deleteSession: async (agentId: string, sessionId: string) => {
    try {
      await chatApi.deleteSession(agentId, sessionId);
      
      set((state) => {
        const newMessages = { ...state.messages };
        delete newMessages[sessionId];
        return {
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSessionId:
            state.currentSessionId === sessionId ? null : state.currentSessionId,
          messages: newMessages,
        };
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      set({ error: 'Failed to delete session' });
    }
  },

  // Rename session
  renameSession: async (agentId: string, sessionId: string, newName: string) => {
    try {
      await chatApi.renameSession(agentId, sessionId, newName);
      
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, name: newName } : s
        ),
      }));
    } catch (error) {
      console.error('Failed to rename session:', error);
      set({ error: 'Failed to rename session' });
    }
  },

  // Set streaming message
  setStreamingMessage: (message: string | null) => {
    set({ streamingMessage: message });
  },

  // Add message
  addMessage: (sessionId: string, message: Message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message],
      },
    }));
  },
}));
