import { EpisodicQuery, EpisodicMemory, EpisodicEvent } from '@agent-memory/shared';
export declare class EpisodicMemoryEngine {
    /**
     * Record an episodic event
     */
    recordEvent(event: EpisodicEvent): Promise<string>;
    /**
     * Calculate importance score for an event (1-10)
     */
    calculateImportance(event: EpisodicEvent): Promise<number>;
    /**
     * Retrieve episodic memories using three-component model
     */
    retrieveEpisodes(query: EpisodicQuery): Promise<EpisodicMemory[]>;
    /**
     * Get all episodes for an agent (without vector search)
     */
    private getAllEpisodes;
    /**
     * Update memory access tracking
     */
    trackAccess(memoryId: string): Promise<void>;
    /**
     * Delete episodic memory
     */
    deleteMemory(memoryId: string): Promise<void>;
    /**
     * Get memory statistics for an agent
     */
    getStats(agentId: string): Promise<{
        totalMemories: number;
        byEventType: Record<string, number>;
        averageImportance: number;
        oldestMemory: Date | null;
        newestMemory: Date | null;
    }>;
}
export declare function getEpisodicMemoryEngine(): EpisodicMemoryEngine;
//# sourceMappingURL=episodic-memory-engine.d.ts.map