import { MemoryInput, MemoryQuery, SearchResult, MemoryStats } from '@agent-memory/shared';
export declare class MemoryService {
    /**
     * Store memory (write coordinator)
     */
    storeMemory(input: MemoryInput): Promise<string>;
    /**
     * Retrieve memories (read coordinator)
     */
    retrieveMemories(query: MemoryQuery): Promise<SearchResult[]>;
    /**
     * Update memory
     */
    updateMemory(id: string, _updates: Partial<MemoryInput>): Promise<void>;
    /**
     * Delete memory
     */
    deleteMemory(id: string): Promise<void>;
    /**
     * Get session memories
     */
    getSessionMemories(sessionId: string): Promise<string[]>;
    /**
     * Create session
     */
    createSession(agentId: string, metadata?: Record<string, any>): Promise<string>;
    /**
     * End session
     */
    endSession(sessionId: string): Promise<void>;
    /**
     * Get memory statistics
     */
    getMemoryStats(agentId: string): Promise<MemoryStats>;
}
export declare function getMemoryService(): MemoryService;
//# sourceMappingURL=memory-service.d.ts.map