// Test file to verify types export
import { Session, Message, Memory } from './types';

console.log('Types imported successfully');

const testSession: Session = {
  id: 'test',
  agentId: 'test',
  userId: 'test',
  name: 'Test Session',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastMessageAt: new Date(),
  messageCount: 0,
  config: {
    agentType: 'test',
    ragMode: 'off',
    memoryTypes: ['stm'],
    autoReflection: false,
    blockchainEnabled: false,
  },
};

console.log('Test session:', testSession);
